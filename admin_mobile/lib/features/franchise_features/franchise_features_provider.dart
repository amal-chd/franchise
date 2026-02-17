import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';
import '../auth/auth_provider.dart';

import 'package:flutter/foundation.dart'; // For debugPrint

// Franchise-specific Orders Provider with date filtering
class FranchiseOrdersFilter {
  final String? dateFrom;
  final String? dateTo;
  final String? status;
  
  FranchiseOrdersFilter({this.dateFrom, this.dateTo, this.status});
  
  FranchiseOrdersFilter copyWith({String? dateFrom, String? dateTo, String? status, bool clearDates = false}) {
    return FranchiseOrdersFilter(
      dateFrom: clearDates ? null : (dateFrom ?? this.dateFrom),
      dateTo: clearDates ? null : (dateTo ?? this.dateTo),
      status: status ?? this.status,
    );
  }
  
  Map<String, String> toQueryParams(int zoneId) {
    final params = <String, String>{'zoneId': zoneId.toString()};
    if (dateFrom != null) params['dateFrom'] = dateFrom!;
    if (dateTo != null) params['dateTo'] = dateTo!;
    if (status != null && status!.isNotEmpty) params['status'] = status!;
    return params;
  }
}

// Franchise Orders Filter Provider
final franchiseOrdersFilterProvider = NotifierProvider<FranchiseOrdersFilterNotifier, FranchiseOrdersFilter>(() {
  return FranchiseOrdersFilterNotifier();
});

class FranchiseOrdersFilterNotifier extends Notifier<FranchiseOrdersFilter> {
  @override
  FranchiseOrdersFilter build() {
    return FranchiseOrdersFilter();
  }
  
  void setDateRange(String? from, String? to) {
    state = state.copyWith(dateFrom: from, dateTo: to);
  }
  
  void setStatus(String? status) {
    state = state.copyWith(status: status);
  }
  
  void clearFilters() {
    state = FranchiseOrdersFilter();
  }
}

// Franchise Orders Provider
final franchiseOrdersProvider = AsyncNotifierProvider<FranchiseOrdersNotifier, List<Map<String, dynamic>>>(() {
  return FranchiseOrdersNotifier();
});

class FranchiseOrdersNotifier extends AsyncNotifier<List<Map<String, dynamic>>> {
  final ApiService _apiService = ApiService();
  
  // Public getter for ApiService
  ApiService get apiService => _apiService;
  
  @override
  Future<List<Map<String, dynamic>>> build() async {
    ref.watch(authProvider);
    return _fetchOrders();
  }
  
  Future<List<Map<String, dynamic>>> _fetchOrders() async {
    try {
      final prefs = await ref.read(sharedPreferencesProvider.future);
      int? zoneId = prefs.getInt('zoneId');
      
      if (zoneId == null || zoneId == 0) {
        debugPrint('DEBUG: No Zone ID found in Orders Provider. FALLBACK to 18 (Testing)');
        zoneId = 18;
      }
      
      final filter = ref.read(franchiseOrdersFilterProvider);
      final params = filter.toQueryParams(zoneId!);
      
      final queryString = params.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');
      
      debugPrint('DEBUG: Fetching orders for Zone ID: $zoneId with params: $queryString');
      
      final response = await _apiService.client.get('/franchise/orders?$queryString');
      
      // Check if response contains an error
      if (response.data is Map && response.data['error'] != null) {
        final errorMsg = response.data['error'];
        debugPrint('Orders API error: $errorMsg');
        throw Exception(errorMsg);
      }
      
      // Robust extraction of list
      List<Map<String, dynamic>> ordersList = [];
      dynamic data = response.data;
      
      if (data is List) {
        ordersList = List<Map<String, dynamic>>.from(data);
      } else if (data is Map) {
         if (data['data'] is List) {
           ordersList = List<Map<String, dynamic>>.from(data['data']);
         } else if (data['orders'] is List) {
           ordersList = List<Map<String, dynamic>>.from(data['orders']);
         } else if (data['orders'] is Map && data['orders']['data'] is List) {
           ordersList = List<Map<String, dynamic>>.from(data['orders']['data']);
         }
      } else {
        throw Exception('Invalid response format: Expected List or Map with data/orders');
      }
      
      debugPrint('DEBUG: Fetched ${ordersList.length} orders for Zone $zoneId');
      
      return ordersList;
    } catch (e) {
      debugPrint('Franchise orders fetch error: $e');
      throw Exception('Failed to fetch orders');
    }
  }
  
  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchOrders());
  }
}

// Payouts Model
class PayoutSummary {
  final int totalOrders;
  final double totalEarnings;
  final double restaurantEarnings;
  final double deliveryEarnings;
  final double totalTax;
  final int todaysPendingOrders;
  final double todaysPendingAmount;
  
  PayoutSummary({
    required this.totalOrders,
    required this.totalEarnings,
    required this.restaurantEarnings,
    required this.deliveryEarnings,
    required this.totalTax,
    required this.todaysPendingOrders,
    required this.todaysPendingAmount,
  });
  
  factory PayoutSummary.fromJson(Map<String, dynamic> json) {
    final summary = json['summary'] ?? {};
    final today = json['todaysPending'] ?? {};
    return PayoutSummary(
      totalOrders: summary['totalOrders'] ?? 0,
      totalEarnings: double.tryParse(summary['totalEarnings']?.toString() ?? '0') ?? 0,
      restaurantEarnings: double.tryParse(summary['restaurantEarnings']?.toString() ?? '0') ?? 0,
      deliveryEarnings: double.tryParse(summary['deliveryEarnings']?.toString() ?? '0') ?? 0,
      totalTax: double.tryParse(summary['totalTax']?.toString() ?? '0') ?? 0,
      todaysPendingOrders: today['orders'] ?? 0,
      todaysPendingAmount: double.tryParse(today['amount']?.toString() ?? '0') ?? 0,
    );
  }
}

class PayoutEntry {
  final String date;
  final int totalOrders;
  final double totalEarnings;
  final double restaurantEarnings;
  final double deliveryEarnings;
  
  PayoutEntry({
    required this.date,
    required this.totalOrders,
    required this.totalEarnings,
    required this.restaurantEarnings,
    required this.deliveryEarnings,
  });
  
  factory PayoutEntry.fromJson(Map<String, dynamic> json) {
    return PayoutEntry(
      date: json['payout_date'] ?? '',
      totalOrders: int.tryParse(json['total_orders']?.toString() ?? '0') ?? 0,
      totalEarnings: double.tryParse(json['total_earnings']?.toString() ?? '0') ?? 0,  
      restaurantEarnings: double.tryParse(json['restaurant_earnings']?.toString() ?? '0') ?? 0,
      deliveryEarnings: double.tryParse(json['delivery_earnings']?.toString() ?? '0') ?? 0,
    );
  }
}

class PayoutsData {
  final PayoutSummary summary;
  final List<PayoutEntry> payouts;
  
  PayoutsData({required this.summary, required this.payouts});
}

// Payouts Provider
final payoutsProvider = AsyncNotifierProvider<PayoutsNotifier, PayoutsData>(() {
  return PayoutsNotifier();
});

class PayoutsNotifier extends AsyncNotifier<PayoutsData> {
  final ApiService _apiService = ApiService();
  
  @override
  Future<PayoutsData> build() async {
    ref.watch(authProvider);
    return _fetchPayouts();
  }
  
  Future<PayoutsData> _fetchPayouts({String? dateFrom, String? dateTo}) async {
    try {
      final prefs = await ref.read(sharedPreferencesProvider.future);
      int? zoneId = prefs.getInt('zoneId');
      
      if (zoneId == null || zoneId == 0) {
         debugPrint('DEBUG: No Zone ID found in Payouts Provider. FALLBACK to 18 (Testing)');
         zoneId = 18;
      }
      
      var url = '/franchise/payouts?zoneId=$zoneId';
      if (dateFrom != null) url += '&dateFrom=$dateFrom';
      if (dateTo != null) url += '&dateTo=$dateTo';
      
      final response = await _apiService.client.get(url);
      
      final payoutsRaw = response.data['payouts'];
      List payoutsList = [];
      if (payoutsRaw is List) {
        payoutsList = payoutsRaw;
      } else if (payoutsRaw is Map) {
        payoutsList = payoutsRaw.values.toList();
      }

      return PayoutsData(
        summary: PayoutSummary.fromJson(response.data),
        payouts: payoutsList
            .map((e) => PayoutEntry.fromJson(e))
            .toList(),
      );
    } catch (e) {
      debugPrint('Payouts fetch error: $e');
      throw Exception('Failed to fetch payouts');
    }
  }
  
  Future<void> refreshWithFilter(String? dateFrom, String? dateTo) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchPayouts(dateFrom: dateFrom, dateTo: dateTo));
  }
}

// Leaderboard Model
class LeaderboardEntry {
  final int rank;
  final int zoneId;
  final String zoneName;
  final String franchiseName;
  final int totalOrders;
  final int completedOrders;
  final double totalRevenue;
  final double avgOrderValue;
  
  LeaderboardEntry({
    required this.rank,
    required this.zoneId,
    required this.zoneName,
    required this.franchiseName,
    required this.totalOrders,
    required this.completedOrders,
    required this.totalRevenue,
    required this.avgOrderValue,
  });
  
  factory LeaderboardEntry.fromJson(Map<String, dynamic> json) {
    return LeaderboardEntry(
      rank: json['rank'] ?? 0,
      zoneId: json['zone_id'] ?? 0,
      zoneName: json['zone_name'] ?? 'Unknown',
      franchiseName: json['franchise_name'] ?? 'Unknown',
      totalOrders: int.tryParse(json['total_orders']?.toString() ?? '0') ?? 0,
      completedOrders: int.tryParse(json['completed_orders']?.toString() ?? '0') ?? 0,
      totalRevenue: double.tryParse(json['total_revenue']?.toString() ?? '0') ?? 0,
      avgOrderValue: double.tryParse(json['avg_order_value']?.toString() ?? '0') ?? 0,
    );
  }
}

class LeaderboardData {
  final String month;
  final List<LeaderboardEntry> leaderboard;
  final Map<String, dynamic> historical;
  final int activeZones;
  final int totalOrders;
  
  LeaderboardData({
    required this.month,
    required this.leaderboard,
    required this.historical,
    required this.activeZones,
    required this.totalOrders,
  });
}

// Leaderboard Provider
final leaderboardProvider = AsyncNotifierProvider<LeaderboardNotifier, LeaderboardData>(() {
  return LeaderboardNotifier();
});

class LeaderboardNotifier extends AsyncNotifier<LeaderboardData> {
  final ApiService _apiService = ApiService();
  
  @override
  Future<LeaderboardData> build() async {
    ref.watch(authProvider);
    return _fetchLeaderboard();
  }
  
  Future<LeaderboardData> _fetchLeaderboard({String? month}) async {
    try {
      var url = '/franchise/leaderboard';
      if (month != null) url += '?month=$month';
      
      final response = await _apiService.client.get(url);
      
      final lbRaw = response.data['leaderboard'];
      List lbList = [];
      if (lbRaw is List) {
        lbList = lbRaw;
      } else if (lbRaw is Map) {
        lbList = lbRaw.values.toList();
      }

      return LeaderboardData(
        month: response.data['month'] ?? '',
        leaderboard: lbList
            .map((e) => LeaderboardEntry.fromJson(e))
            .toList(),
        historical: response.data['historical'] ?? {},
        activeZones: response.data['stats']?['activeZones'] ?? 0,
        totalOrders: response.data['stats']?['totalOrders'] ?? 0,
      );
    } catch (e) {
      print('Leaderboard fetch error: $e');
      throw Exception('Failed to fetch leaderboard');
    }
  }
  
  Future<void> refreshWithMonth(String month) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchLeaderboard(month: month));
  }
}

// SharedPreferences Provider
final sharedPreferencesProvider = FutureProvider<SharedPreferences>((ref) async {
  return await SharedPreferences.getInstance();
});
