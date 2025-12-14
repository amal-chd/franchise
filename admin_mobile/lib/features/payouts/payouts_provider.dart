import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_service.dart';

class FranchisePayout {
  final int id;
  final String name;
  final String planSelected;
  final String? bankName;
  final String? bankAccountNumber;
  final String? ifscCode;
  final String? upiId;

  FranchisePayout({
    required this.id,
    required this.name,
    required this.planSelected,
    this.bankName,
    this.bankAccountNumber,
    this.ifscCode,
    this.upiId,
  });

  factory FranchisePayout.fromJson(Map<String, dynamic> json) {
    return FranchisePayout(
      id: json['id'],
      name: json['full_name'] ?? json['name'] ?? 'Unknown',
      planSelected: json['plan_selected'] ?? 'standard',
      bankName: json['bank_name'],
      bankAccountNumber: json['bank_account_number']?.toString(),
      ifscCode: json['ifsc_code'],
      upiId: json['upi_id']?.toString(),
    );
  }
}

class PayoutHistoryItem {
  final int id;
  final String franchiseName;
  final String city;
  final String amount;
  final String revenueReported;
  final int ordersCount;
  final String payoutDate;
  final String status;

  PayoutHistoryItem({
    required this.id,
    required this.franchiseName,
    required this.city,
    required this.amount,
    required this.revenueReported,
    required this.ordersCount,
    required this.payoutDate,
    required this.status,
  });

  factory PayoutHistoryItem.fromJson(Map<String, dynamic> json) {
    return PayoutHistoryItem(
      id: json['id'],
      franchiseName: json['franchise_name'] ?? 'Unknown',
      city: json['city'] ?? '',
      amount: json['amount']?.toString() ?? '0',
      revenueReported: json['revenue_reported']?.toString() ?? '0',
      ordersCount: json['orders_count'] ?? 0,
      payoutDate: json['payout_date'] ?? '',
      status: json['status'] ?? 'processed',
    );
  }
}

class PayoutsState {
  final List<FranchisePayout> payouts;
  final List<PayoutHistoryItem> history;
  final Map<String, dynamic> settings;
  final bool isLoading;

  PayoutsState({
    required this.payouts,
    required this.history,
    required this.settings,
    this.isLoading = false,
  });

  PayoutsState copyWith({
    List<FranchisePayout>? payouts,
    List<PayoutHistoryItem>? history,
    Map<String, dynamic>? settings,
    bool? isLoading,
  }) {
    return PayoutsState(
      payouts: payouts ?? this.payouts,
      history: history ?? this.history,
      settings: settings ?? this.settings,
      isLoading: isLoading ?? this.isLoading,
    );
  }
}

final payoutsProvider = AsyncNotifierProvider<PayoutsNotifier, PayoutsState>(() {
  return PayoutsNotifier();
});

class PayoutsNotifier extends AsyncNotifier<PayoutsState> {
  final ApiService _apiService = ApiService();

  @override
  Future<PayoutsState> build() async {
    return _loadData();
  }

  Future<PayoutsState> _loadData() async {
    final now = DateTime.now();
    final responses = await Future.wait([
        _apiService.client.get('/api/admin/payouts'),
        _apiService.client.get('/api/admin/settings'),
        _apiService.client.get('/api/admin/payouts/history?month=${now.month}&year=${now.year}'),
    ]);

    List<FranchisePayout> payoutsData = [];
    if (responses[0].data is List) {
      payoutsData = (responses[0].data as List).map((e) => FranchisePayout.fromJson(e)).toList();
    } else if (responses[0].data is Map && responses[0].data['data'] is List) {
        payoutsData = (responses[0].data['data'] as List).map((e) => FranchisePayout.fromJson(e)).toList();
    }

    final settingsData = responses[1].data as Map<String, dynamic>;
    
    List<PayoutHistoryItem> historyData = [];
    if (responses[2].data is List) {
      historyData = (responses[2].data as List).map((e) => PayoutHistoryItem.fromJson(e)).toList();
    }

    return PayoutsState(
      payouts: payoutsData,
      history: historyData,
      settings: settingsData,
      isLoading: false,
    );
  }

  Future<void> loadData() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _loadData());
  }

  Future<void> fetchHistory(int month, int year) async {
    final prevState = state.value;
    if (prevState == null) return;
    
    try {
      final response = await _apiService.client.get('/api/admin/payouts/history?month=$month&year=$year');
      List<PayoutHistoryItem> historyData = [];
      if (response.data is List) {
        historyData = (response.data as List).map((e) => PayoutHistoryItem.fromJson(e)).toList();
      }
      state = AsyncValue.data(prevState.copyWith(history: historyData));
    } catch (e) {
      // Keep old state on error
      state = AsyncValue.data(prevState); 
    }
  }

  Future<bool> processPayout({
    required int franchiseId,
    required double amount,
    required double revenue,
    required int orders,
    required double sharePercentage,
    required double platformFee,
    required double totalDeduction,
    required String invoiceBase64,
  }) async {
    try {
      final response = await _apiService.client.post('/api/admin/payouts/process', data: {
        'franchise_id': franchiseId,
        'amount': amount,
        'revenue_reported': revenue,
        'orders_count': orders,
        'share_percentage': sharePercentage,
        'platform_fee_per_order': platformFee,
        'total_fee_deducted': totalDeduction,
        'invoice_base64': invoiceBase64,
      });

      return response.statusCode == 200;
    } catch (e) {
      print('Process Payout Error: $e');
      return false;
    }
  }
}
