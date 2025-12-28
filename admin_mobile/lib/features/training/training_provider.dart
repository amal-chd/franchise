import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';

class TrainingModule {
  final int id;
  final String title;
  final String description;
  final String role;
  final String category;
  final String thumbnail;
  final double progress; // 0.0 to 1.0
  final String duration;

  TrainingModule({
    required this.id,
    required this.title,
    required this.description,
    required this.role,
    required this.category,
    this.thumbnail = '',
    this.progress = 0.0,
    this.duration = '10 min',
  });

  factory TrainingModule.fromJson(Map<String, dynamic> json) {
    return TrainingModule(
      id: json['id'],
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      role: json['role'] ?? 'franchise',
      category: json['category'] ?? 'General',
      thumbnail: json['thumbnail_url'] ?? '',
      // Mock data for UI demo if not present
      progress: json['progress'] != null 
          ? double.tryParse(json['progress'].toString()) ?? 0.0 
          : (json['id'] % 2 == 0 ? 0.75 : 0.3), // Deterministic mock
      duration: json['duration'] ?? '${(json['id'] * 5) + 10} min',
    );
  }
}

class TrainingMaterial {
  final int id;
  final String title;
  final String type; // video, pdf, image, text
  final String contentUrl;
  final String contentText;

  TrainingMaterial({
    required this.id,
    required this.title,
    required this.type,
    required this.contentUrl,
    required this.contentText,
  });

  factory TrainingMaterial.fromJson(Map<String, dynamic> json) {
    return TrainingMaterial(
      id: json['id'],
      title: json['title'] ?? '',
      type: json['type'] ?? 'text',
      contentUrl: json['content_url'] ?? '',
      contentText: json['content_text'] ?? '',
    );
  }
}

final trainingProvider = AsyncNotifierProvider<TrainingNotifier, List<TrainingModule>>(() {
  return TrainingNotifier();
});

// Provider to fetch materials for a specific module
final trainingMaterialsProvider = FutureProvider.family<List<TrainingMaterial>, int>((ref, moduleId) async {
  final api = ApiService();
  try {
    final response = await api.client.get('admin/training/materials?moduleId=$moduleId');
    List data = [];
    if (response.data is List) {
      data = response.data as List;
    } else if (response.data is Map && response.data['data'] != null) {
      data = response.data['data'] as List;
    }
    return data.map((e) => TrainingMaterial.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});

class TrainingNotifier extends AsyncNotifier<List<TrainingModule>> {
  final ApiService _apiService = ApiService();

  @override
  Future<List<TrainingModule>> build() async {
    return _fetchModules();
  }

  Future<List<TrainingModule>> _fetchModules() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final franchiseId = prefs.getInt('franchiseId'); // Or user ID logic
      // Fallback if not franchise (e.g. admin testing)
      // ideally we need logic to get current user ID
      
      final response = await _apiService.client.get('admin/training/modules');
      List modulesData = [];
      if (response.data is List) modulesData = response.data as List;
      else if (response.data is Map && response.data['data'] != null) modulesData = response.data['data'] as List;

      // Fetch Progress from Backend
      Map<int, dynamic> progressMap = {};
      if (franchiseId != null) {
          try {
            final progressResponse = await _apiService.client.get('admin/training/progress?userId=$franchiseId');
            if (progressResponse.data is List) {
                for (var item in progressResponse.data) {
                    progressMap[item['module_id']] = item;
                }
            }
          } catch (e) {
             print("Error fetching progress: $e");
          }
      }
      
      return modulesData.map((e) {
        final m = TrainingModule.fromJson(e);
        
        double progress = m.progress;
        // Check local cache first for immediate UI update? No, use backend merged data
        // But we can fallback to local prefs if backend fails or for offline support
        final localProgress = prefs.getDouble('module_progress_${m.id}') ?? m.progress;
        
        // Use Backend Progress if available
        if (progressMap.containsKey(m.id)) {
            final progData = progressMap[m.id];
            progress = double.tryParse(progData['progress'].toString()) ?? 0.0;
        } else {
            progress = localProgress; // Fallback to local
        }

        return TrainingModule(
          id: m.id,
          title: m.title,
          description: m.description,
          role: m.role,
          category: m.category,
          thumbnail: m.thumbnail,
          progress: progress,
          duration: m.duration,
        );
      }).toList();
    } catch (e) {
      throw Exception('Failed to fetch training modules: $e');
    }
  }

  Future<void> updateProgress(int moduleId, double progress, {List<int>? completedMaterials}) async {
    final prefs = await SharedPreferences.getInstance();
    
    // 1. Optimistic Local Update
    await prefs.setDouble('module_progress_$moduleId', progress);
    await prefs.setInt('last_accessed_module', moduleId);
    
    // Update local state immediately
    state = AsyncValue.data(
        state.value?.map((m) => m.id == moduleId ? 
            TrainingModule(
                id: m.id, title: m.title, description: m.description, 
                role: m.role, category: m.category, thumbnail: m.thumbnail, 
                progress: progress, duration: m.duration
            ) : m
        ).toList() ?? []
    );

    // 2. Sync to Backend
    final franchiseId = prefs.getInt('franchiseId');
    if (franchiseId != null) {
        try {
            await _apiService.client.post('admin/training/progress', data: {
                'userId': franchiseId,
                'moduleId': moduleId,
                'progress': progress,
                'materialIds': completedMaterials ?? [],
                'isCompleted': progress >= 1.0
            });
        } catch (e) {
            print("Failed to sync progress: $e");
        }
    }
  }
  
  Future<int?> getLastAccessedModuleId() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getInt('last_accessed_module');
  }

  Future<bool> createModule(Map<String, dynamic> data) async {
    try {
      final response = await _apiService.client.post('admin/training/modules', data: data);
      if (response.statusCode == 200 || response.statusCode == 201) {
        ref.invalidateSelf();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateModule(int id, Map<String, dynamic> data) async {
    try {
      final response = await _apiService.client.put('admin/training/modules', data: {...data, 'id': id});
      if (response.statusCode == 200) {
        ref.invalidateSelf();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> deleteModule(int id) async {
    try {
      final response = await _apiService.client.delete('admin/training/modules?id=$id');
      if (response.statusCode == 200) {
        ref.invalidateSelf();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  // Material Methods
  Future<bool> createMaterial(Map<String, dynamic> data) async {
    try {
      final response = await _apiService.client.post('admin/training/materials', data: data);
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }

  Future<bool> updateMaterial(int id, Map<String, dynamic> data) async {
    try {
      final response = await _apiService.client.put('admin/training/materials', data: {...data, 'id': id});
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  Future<bool> deleteMaterial(int id) async {
    try {
      final response = await _apiService.client.delete('admin/training/materials?id=$id');
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
