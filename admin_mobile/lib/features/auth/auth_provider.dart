import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
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
      
      // Check if logged in
      final isLoggedIn = prefs.getBool('isLoggedIn') ?? prefs.getBool('isAdmin') ?? false;
      
      if (isLoggedIn) {
      if (isLoggedIn) {
        // Always sync latest profile data (Zone ID, Franchise ID) to handle backend changes
        if (isFranchise) {
           print('DEBUG: Syncing latest Franchise Profile...');
           try {
             final user = Supabase.instance.client.auth.currentUser;
             if (user != null && user.email != null) {
                // Fetch Zone ID from API
                final profileResponse = await _apiService.client.get('/franchise/profile?email=${user.email}');
                if (profileResponse.statusCode == 200 && profileResponse.data != null) {
                   var zIdVal = profileResponse.data['zone_id'];
                   final zId = zIdVal is int ? zIdVal : int.tryParse(zIdVal.toString()) ?? 0;
                   
                   if (zId > 0) {
                      await prefs.setInt('zoneId', zId);
                      
                      // Also save Franchise ID
                      var fIdVal = profileResponse.data['id'];
                      final fId = fIdVal is int ? fIdVal : int.tryParse(fIdVal.toString()) ?? 0;
                      if (fId > 0) {
                        await prefs.setInt('franchiseId', fId);
                      }
                      
                      print('DEBUG: Zone ID $zId synced from backend');
                   } else {
                      print('DEBUG: Zone ID from backend is 0/Invalid. Keeping local if exists.');
                   }
                }
             }
           } catch (e) {
             print('DEBUG: Failed to sync profile (using cached): $e');
             // Swallowing error to allow offline login with cached data
           }
        }
      }
      }

      return isLoggedIn;
    } catch (e) {
      return false;
    }
  }

  Future<void> login(String username, String password) async {
    // We do NOT set state = loading here because that triggers main.dart to rebuild
    // and replace LoginScreen with a loading Scaffold, destroying the local state/context.
    // Instead we handle loading state inside LoginScreen.
    
    try {
      if (username == 'admin') {
         // Legacy Admin Login
         final response = await _apiService.client.post('auth/login', data: {
            'username': username,
            'password': password,
         });

         if (response.data['success'] == true) {
            final prefs = await SharedPreferences.getInstance();
            await prefs.setBool('isLoggedIn', true);
            await prefs.setString('userRole', 'admin');
            state = const AsyncValue.data(true);
         } else {
            throw response.data['message'] ?? 'Login failed';
         }
      } else {
         // Supabase Login for Franchise
         // Note: username must be email
         
         // 1. Authenticate with Supabase
         final response = await Supabase.instance.client.auth.signInWithPassword(
             email: username,
             password: password,
         );
         
         if (response.user != null) {
             final user = response.user!;
             final prefs = await SharedPreferences.getInstance();
             
             // 2. Fetch Profile from Supabase standard table or metadata
             // Metadata was populated during migration (legacy_id, username)
             final meta = user.userMetadata ?? {};
             
             await prefs.setBool('isLoggedIn', true);
             await prefs.setString('userRole', 'franchise'); // meta['role'] ??
             await prefs.setString('franchiseUuid', user.id);
             
             // Legacy Compatibility
             if (meta['legacy_id'] != null) {
                 await prefs.setInt('franchiseId', meta['legacy_id'] is int ? meta['legacy_id'] : int.tryParse(meta['legacy_id'].toString()) ?? 0);
             }
             if (meta['username'] != null) {
                 await prefs.setString('franchiseName', meta['username']);
             }
             
             // FETCH ZONE ID (Required for Franchise Panel Data)
             // FETCH ZONE ID from Franchise DB (via backend API)
             try {
               print('DEBUG: Fetching Zone ID from Franchise DB for ${user.email}');
               
               // Use the new API endpoint that queries MySQL directly
               final profileResponse = await _apiService.client.get('/franchise/profile?email=${user.email}');
               
               if (profileResponse.statusCode == 200 && profileResponse.data != null) {
                 var zoneIdVal = profileResponse.data['zone_id'];
                 final zId = zoneIdVal is int ? zoneIdVal : int.tryParse(zoneIdVal.toString()) ?? 0;
                 
                 if (zId > 0) {
                    await prefs.setInt('zoneId', zId);
                    
                    // Also save Franchise ID
                    var fIdVal = profileResponse.data['id'];
                    final fId = fIdVal is int ? fIdVal : int.tryParse(fIdVal.toString()) ?? 0;
                    if (fId > 0) {
                      await prefs.setInt('franchiseId', fId);
                    }

                    print('DEBUG: Zone ID $zId saved to preferences (Source: Franchise DB)');
                 } else {
                    print('DEBUG: Zone ID found but is 0 or invalid');
                 }
               } else {
                 print('DEBUG: Failed to fetch profile from Franchise DB');
               }

             } catch (e) {
               print('DEBUG: Error fetching Zone ID from API: $e');
               // Fallback: If API fails, keep whatever was in profile/metadata (if we had that logic before, currently replaced)
             }
             
             state = const AsyncValue.data(true);
         } else {
             throw 'Login failed';
         }
      }
    } catch (e) {
      String errorMessage = 'An unexpected error occurred';
      if (e is AuthException) {
          errorMessage = e.message;
      } else if (e is DioException) {
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
