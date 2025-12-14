import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_service.dart';

class TrainingModule {
  final int id;
  final String title;
  final String description;
  final String role;
  final String category;
  final String thumbnail;

  TrainingModule({
    required this.id,
    required this.title,
    required this.description,
    required this.role,
    required this.category,
    this.thumbnail = '',
  });

  factory TrainingModule.fromJson(Map<String, dynamic> json) {
    return TrainingModule(
      id: json['id'],
      title: json['title'] ?? '',
      description: json['description'] ?? '',
      role: json['role'] ?? 'franchise',
      category: json['category'] ?? 'General',
      thumbnail: json['thumbnail_url'] ?? '',
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
    final response = await api.client.get('/api/admin/training/materials?moduleId=$moduleId');
    final data = response.data as List;
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
      final response = await _apiService.client.get('/api/admin/training/modules');
      final data = response.data as List;
      return data.map((e) => TrainingModule.fromJson(e)).toList();
    } catch (e) {
      throw Exception('Failed to fetch training modules');
    }
  }

  Future<bool> createModule(Map<String, dynamic> data) async {
    try {
      final response = await _apiService.client.post('/api/admin/training/modules', data: data);
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
      final response = await _apiService.client.put('/api/admin/training/modules', data: {...data, 'id': id});
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
      final response = await _apiService.client.delete('/api/admin/training/modules?id=$id');
      if (response.statusCode == 200) {
        ref.invalidateSelf();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
