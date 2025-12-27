import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_service.dart';

class Zone {
  final int id;
  final String name;

  Zone({required this.id, required this.name});

  factory Zone.fromJson(Map<String, dynamic> json) {
    return Zone(
      id: json['id'],
      name: json['name'],
    );
  }
}

final zonesProvider = AsyncNotifierProvider<ZonesNotifier, List<Zone>>(() {
  return ZonesNotifier();
});

class ZonesNotifier extends AsyncNotifier<List<Zone>> {
  final ApiService _apiService = ApiService();

  @override
  Future<List<Zone>> build() async {
    return _fetchZones();
  }

  Future<List<Zone>> _fetchZones() async {
    try {
      final response = await _apiService.client.get('admin/zone/list');
      // Assuming response.data is List or { 'zones': [...] } or similar.
      // Based on typical stack, usually it returns list directly or wrapped.
      // Will assume standard list return based on other providers.
      // If endpoint is unknown, I might need to guess or check backend code if available.
      // Assuming: GET /admin/zone/list -> [{id: 1, name: 'Zone A'}, ...]
      if (response.data is List) {
         return (response.data as List).map((e) => Zone.fromJson(e)).toList();
      } else if (response.data is Map && response.data['zones'] != null) {
         return (response.data['zones'] as List).map((e) => Zone.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      print('Error fetching zones: $e');
      return [];
    }
  }
}
