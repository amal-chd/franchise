import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../core/api_service.dart';

// Cache configuration
const String ANALYTICS_CACHE_KEY = 'analytics_cache';
const String ANALYTICS_CACHE_TIMESTAMP_KEY = 'analytics_cache_timestamp';
const int ANALYTICS_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

final analyticsProvider = FutureProvider<Map<String, dynamic>>((ref) async {
  final _apiService = ApiService();
  final prefs = await SharedPreferences.getInstance();
  
  // Check cache first
  final cachedDataJson = prefs.getString(ANALYTICS_CACHE_KEY);
  final cachedTimestamp = prefs.getInt(ANALYTICS_CACHE_TIMESTAMP_KEY) ?? 0;
  final now = DateTime.now().millisecondsSinceEpoch;
  final cacheAge = now - cachedTimestamp;
  
  // If cache is valid and fresh, return it immediately
  if (cachedDataJson != null && cacheAge < ANALYTICS_CACHE_TTL_MS) {
    print('DEBUG: Serving analytics from cache (age: ${(cacheAge / 1000).toStringAsFixed(1)}s)');
    
    try {
      final cachedData = json.decode(cachedDataJson) as Map<String, dynamic>;
      
      // Fetch fresh data in background (don't await)
      _fetchAndCacheAnalytics(_apiService, prefs).then((_) {
        print('DEBUG: Background analytics refresh completed');
      }).catchError((e) {
        print('DEBUG: Background analytics refresh failed: $e');
      });
      
      return {
        ...cachedData,
        '_cached': true,
      };
    } catch (e) {
      print('DEBUG: Failed to parse cached analytics: $e');
      // Fall through to fetch fresh data
    }
  }
  
  // Cache is invalid or expired, fetch fresh data
  print('DEBUG: Fetching fresh analytics (cache age: ${(cacheAge / 1000).toStringAsFixed(1)}s)');
  return await _fetchAndCacheAnalytics(_apiService, prefs);
});

Future<Map<String, dynamic>> _fetchAndCacheAnalytics(
  ApiService apiService, 
  SharedPreferences prefs
) async {
  final response = await apiService.client.get('/admin/analytics');
  final data = response.data;
  
  final result = {
    'totalRequests': data['totalRequests'],
    'approved': data['activeFranchises'],
    'pending': data['pendingVerification'],
    'rejected': 0,
    'totalRevenue': data['totalRevenue'] ?? 0,
    'trends': data['trends'] ?? {},
  };
  
  // Cache the result
  try {
    await prefs.setString(ANALYTICS_CACHE_KEY, json.encode(result));
    await prefs.setInt(ANALYTICS_CACHE_TIMESTAMP_KEY, DateTime.now().millisecondsSinceEpoch);
    print('DEBUG: Analytics cached successfully');
  } catch (e) {
    print('DEBUG: Failed to cache analytics: $e');
  }
  
  return result;
}
