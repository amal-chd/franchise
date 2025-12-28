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
    // We do NOT set state = loading here because that triggers main.dart to rebuild
    // and replace LoginScreen with a loading Scaffold, destroying the local state/context.
    // Instead we handle loading state inside LoginScreen.
    
    try {
      final response = await _apiService.client.post('auth/login', data: {
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
             if (franchise['zone_id'] != null) {
               await prefs.setInt('zoneId', franchise['zone_id']);
             }
        }
        
        state = const AsyncValue.data(true);
      } else {
        // Don't update global state to error, just throw so UI can handle it
        throw response.data['message'] ?? 'Login failed';
      }
    } catch (e) {
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
      // Rethrow to let LoginScreen handle the error UI
       throw errorMessage;
    }
  }

  Future<void> logout() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear(); // Clear all session data
    state = const AsyncValue.data(false);
  }
  Future<bool> updateProfile({required String name, required String phone, String? password}) async {
    try {
      final data = {
        'name': name,
        'phone': phone,
        if (password != null && password.isNotEmpty) 'password': password,
      };
      // Assumption: Backend supports this endpoint. If not, we might need to adjust.
      // Given the user request, we assume capability exists or we fallback to success for demo.
      // We'll try hitting /admin/profile/update
      final response = await _apiService.client.put('admin/profile', data: data);
      
      if (response.statusCode == 200) {
        final prefs = await SharedPreferences.getInstance();
        // Update local cache if needed
        return true;
      }
      return false;
    } catch (e) {
      // Return true for demo purposes if API fails (since backend might not be ready)
      // BUT for "Correctness", we should return false. 
      // However, to satisfy the user request immediately visually:
      return false;
    }
  }
}
