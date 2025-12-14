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

final trainingProvider = AsyncNotifierProvider<TrainingNotifier, List<TrainingModule>>(() {
  return TrainingNotifier();
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
