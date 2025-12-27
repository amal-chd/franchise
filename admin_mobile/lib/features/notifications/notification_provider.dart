import 'dart:convert';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_service.dart';
import 'notification_model.dart';
import 'package:shared_preferences/shared_preferences.dart';

final notificationProvider = AsyncNotifierProvider<NotificationNotifier, List<NotificationModel>>(() {
  return NotificationNotifier();
});

class NotificationNotifier extends AsyncNotifier<List<NotificationModel>> {
  final ApiService _apiService = ApiService();

  @override
  Future<List<NotificationModel>> build() async {
    return _fetchNotifications();
  }

  Future<List<NotificationModel>> _fetchNotifications() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final role = prefs.getString('userRole');
      final userData = prefs.getString('userData');
      
      String? userId;
      String? franchiseId;

      if (role == 'admin') {
        userId = '1'; 
      } else if (role == 'franchise' && userData != null) {
        final user = jsonDecode(userData);
        franchiseId = user['id'].toString();
      }

      if (userId == null && franchiseId == null) {
        return [];
      }

      final queryParams = <String, String>{};
      if (userId != null) queryParams['userId'] = userId;
      if (franchiseId != null) queryParams['franchiseId'] = franchiseId;

      final queryString = queryParams.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');

      final response = await _apiService.client.get('notifications?$queryString');
      
      if (response.data != null && response.data is List) {
        final data = response.data as List;
        return data.map((json) => NotificationModel.fromJson(json)).toList();
      } else {
        return [];
      }
    } catch (e) {
      print('Notification fetch error: $e');
      return [];
    }
  }

  Future<void> fetchNotifications() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchNotifications());
  }

  Future<void> markAsRead(int notificationId) async {
    try {
      await _apiService.client.put('notifications', data: {'id': notificationId});
      await fetchNotifications();
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }

  int get unreadCount {
    return state.maybeWhen(
      data: (notifications) => notifications.where((n) => !n.isRead).length,
      orElse: () => 0,
    );
  }
}
