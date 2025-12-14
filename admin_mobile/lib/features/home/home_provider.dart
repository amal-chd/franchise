import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_service.dart';

final analyticsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final api = ApiService();
  final response = await api.client.get('/api/admin/analytics');
  return response.data;
});
