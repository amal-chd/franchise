import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:convert';
import '../../core/api_service.dart';

// Cache configuration
const String FRANCHISE_CACHE_KEY = 'franchise_data_cache';
const String FRANCHISE_CACHE_TIMESTAMP_KEY = 'franchise_data_cache_timestamp';
const int FRANCHISE_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

class FranchiseStats {
  final double totalRevenue;
  final int deliveredOrders;
  final double todaysPayout;

  FranchiseStats({
    this.totalRevenue = 0,
    this.deliveredOrders = 0,
    this.todaysPayout = 0,
  });

  factory FranchiseStats.fromJson(Map<String, dynamic> json) {
    return FranchiseStats(
      totalRevenue: double.tryParse(json['totalRevenue']?.toString() ?? '0') ?? 0,
      deliveredOrders: int.tryParse(json['deliveredOrders']?.toString() ?? '0') ?? 0,
      todaysPayout: double.tryParse(json['todaysPayout']?.toString() ?? '0') ?? 0,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'totalRevenue': totalRevenue,
      'deliveredOrders': deliveredOrders,
      'todaysPayout': todaysPayout,
    };
  }
}


class FranchiseState {
  final FranchiseStats stats;
  final List<dynamic> vendors;
  final List<dynamic> deliveryMen;
  final List<dynamic> recentOrders;
  final bool isLoading;

  FranchiseState({
    required this.stats,
    this.vendors = const [],
    this.deliveryMen = const [],
    this.recentOrders = const [],
    this.isLoading = false,
  });

  FranchiseState copyWith({
    FranchiseStats? stats,
    List<dynamic>? vendors,
    List<dynamic>? deliveryMen,
    List<dynamic>? recentOrders,
    bool? isLoading,
  }) {
    return FranchiseState(
      stats: stats ?? this.stats,
      vendors: vendors ?? this.vendors,
      deliveryMen: deliveryMen ?? this.deliveryMen,
      recentOrders: recentOrders ?? this.recentOrders,
      isLoading: isLoading ?? this.isLoading,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'stats': stats.toJson(),
      'vendors': vendors,
      'deliveryMen': deliveryMen,
      'recentOrders': recentOrders,
    };
  }

  factory FranchiseState.fromJson(Map<String, dynamic> json) {
    return FranchiseState(
      stats: FranchiseStats.fromJson(json['stats'] ?? {}),
      vendors: json['vendors'] ?? [],
      deliveryMen: json['deliveryMen'] ?? [],
      recentOrders: json['recentOrders'] ?? [],
    );
  }
}

final franchiseProvider = AsyncNotifierProvider<FranchiseNotifier, FranchiseState>(() {
  return FranchiseNotifier();
});

class FranchiseNotifier extends AsyncNotifier<FranchiseState> {
  final ApiService _apiService = ApiService();

  @override
  Future<FranchiseState> build() async {
    return _loadData(useCache: true);
  }

  Future<FranchiseState> _loadData({bool useCache = true}) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final zoneId = prefs.getInt('zoneId');

      if (zoneId == null) {
        print('DEBUG: No Zone ID found in SharedPreferences');
        return FranchiseState(stats: FranchiseStats());
      }
      
      print('DEBUG: Fetching Franchise Data for Zone ID: $zoneId');

      // Check cache first
      if (useCache) {
        final cachedDataJson = prefs.getString('$FRANCHISE_CACHE_KEY\_$zoneId');
        final cachedTimestamp = prefs.getInt('$FRANCHISE_CACHE_TIMESTAMP_KEY\_$zoneId') ?? 0;
        final now = DateTime.now().millisecondsSinceEpoch;
        final cacheAge = now - cachedTimestamp;

        if (cachedDataJson != null && cacheAge < FRANCHISE_CACHE_TTL_MS) {
          print('DEBUG: Serving franchise data from cache (age: ${(cacheAge / 1000).toStringAsFixed(1)}s)');
          
          try {
            final cachedData = json.decode(cachedDataJson);
            final cachedState = FranchiseState.fromJson(cachedData);
            
            // Fetch fresh data in background
            _fetchAndCacheFranchiseData(zoneId, prefs).then((freshState) {
              // Update state with fresh data
              state = AsyncValue.data(freshState);
              print('DEBUG: Background franchise data refresh completed');
            }).catchError((e) {
              print('DEBUG: Background franchise data refresh failed: $e');
            });
            
            return cachedState;
          } catch (e) {
            print('DEBUG: Failed to parse cached franchise data: $e');
          }
        }
      }

      // Cache miss or expired, fetch fresh data
      print('DEBUG: Fetching fresh franchise data');
      return await _fetchAndCacheFranchiseData(zoneId, prefs);
    } catch (e) {
      print('Franchise Data Load Error: $e');
      return FranchiseState(stats: FranchiseStats());
    }
  }

  Future<FranchiseState> _fetchAndCacheFranchiseData(int zoneId, SharedPreferences prefs) async {
    // Fetch all data in parallel
      print('DEBUG: FranchiseNotifier fetching data for Zone: $zoneId');
      final responses = await Future.wait([
        _apiService.client.get('franchise/stats?zoneId=$zoneId'),
        _apiService.client.get('franchise/vendors?zoneId=$zoneId'),
        _apiService.client.get('franchise/delivery?zoneId=$zoneId'),
        _apiService.client.get('franchise/orders?zoneId=$zoneId'),
      ]);
      print('DEBUG: All Franchise APIs responded successfully');

    final statsData = responses[0].data;
    final vendorsData = responses[1].data is List ? responses[1].data as List : [];
    final deliveryData = responses[2].data is List ? responses[2].data as List : [];
    final ordersData = responses[3].data is List ? responses[3].data as List : [];

    final newState = FranchiseState(
      stats: FranchiseStats.fromJson(statsData),
      vendors: vendorsData,
      deliveryMen: deliveryData,
      recentOrders: ordersData,
      isLoading: false,
    );

    // Cache the result
    try {
      await prefs.setString('$FRANCHISE_CACHE_KEY\_$zoneId', json.encode(newState.toJson()));
      await prefs.setInt('$FRANCHISE_CACHE_TIMESTAMP_KEY\_$zoneId', DateTime.now().millisecondsSinceEpoch);
      print('DEBUG: Franchise data cached successfully');
    } catch (e) {
      print('DEBUG: Failed to cache franchise data: $e');
    }

    return newState;
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _loadData(useCache: false));
  }
}
