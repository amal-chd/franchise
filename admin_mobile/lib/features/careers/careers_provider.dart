import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_service.dart';

class JobPosting {
  final int id;
  final String title;
  final String department;
  final String location;
  final String type;
  final String status;

  JobPosting({
    required this.id,
    required this.title,
    required this.department,
    required this.location,
    required this.type,
    required this.status,
  });

  factory JobPosting.fromJson(Map<String, dynamic> json) {
    return JobPosting(
      id: json['id'],
      title: json['title'],
      department: json['department'],
      location: json['location'],
      type: json['type'],
      status: json['status'] == 1 ? 'Active' : 'Inactive',
    );
  }
}

final careersProvider = AsyncNotifierProvider<CareersNotifier, List<JobPosting>>(() {
  return CareersNotifier();
});

class CareersNotifier extends AsyncNotifier<List<JobPosting>> {
  final ApiService _apiService = ApiService();

  @override
  Future<List<JobPosting>> build() async {
    return _fetchJobs();
  }

  Future<List<JobPosting>> _fetchJobs() async {
    final response = await _apiService.client.get('admin/careers');
    return (response.data as List).map((e) => JobPosting.fromJson(e)).toList();
  }

  Future<void> fetchJobs() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchJobs());
  }

  Future<bool> addJob(Map<String, dynamic> jobData) async {
    try {
      final response = await _apiService.client.post('admin/careers', data: jobData);
      if (response.statusCode == 200 || response.statusCode == 201) {
        fetchJobs();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
