import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import '../../core/api_service.dart';

final authProvider = AsyncNotifierProvider<AuthNotifier, bool>(() {
  return AuthNotifier();
});

class AuthNotifier extends AsyncNotifier<bool> {
  final ApiService _apiService = ApiService();

  @override
  Future<bool> build() async {
    return _checkLoginStatus();
  }

  Future<bool> _checkLoginStatus() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      // Support legacy isAdmin or new isLoggedIn
      return prefs.getBool('isLoggedIn') ?? prefs.getBool('isAdmin') ?? false;
    } catch (e) {
      return false;
    }
  }

  Future<void> login(String username, String password) async {
    state = const AsyncValue.loading();
    try {
      final response = await _apiService.client.post('/api/auth/login', data: {
        'username': username,
        'password': password,
      });

      if (response.data['success'] == true) {
        final prefs = await SharedPreferences.getInstance();
        final role = response.data['role'] ?? 'admin';
        
        await prefs.setBool('isLoggedIn', true);
        await prefs.setString('userRole', role);
        
        if (role == 'franchise') {
             final franchise = response.data['franchise'];
             await prefs.setInt('franchiseId', franchise['id']);
             await prefs.setString('franchiseName', franchise['name']);
        }
        
        state = const AsyncValue.data(true);
      } else {
        state = AsyncValue.error(response.data['message'] ?? 'Login failed', StackTrace.current);
      }
    } catch (e, st) {
      String errorMessage = 'An unexpected error occurred';
      if (e is DioException) {
        if (e.type == DioExceptionType.connectionTimeout || e.type == DioExceptionType.receiveTimeout) {
          errorMessage = 'Connection Timeout. Check your network.';
        } else if (e.type == DioExceptionType.connectionError) {
           errorMessage = 'Connection Refused. Ensure backend is running at ${_apiService.client.options.baseUrl}';
        } else if (e.response != null) {
          errorMessage = 'Server Error: ${e.response?.statusCode} ${e.response?.statusMessage}';
          if (e.response?.data != null && e.response?.data is Map) {
             errorMessage = e.response?.data['message'] ?? errorMessage;
          }
        } else {
           errorMessage = 'Network Error: ${e.message}';
        }
      } else {
        errorMessage = e.toString();
      }
      state = AsyncValue.error(errorMessage, st);
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('isAdmin', false);
    state = const AsyncValue.data(false);
  }
}
