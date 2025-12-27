import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';

// Activity Log Model
class ActivityLog {
  final int id;
  final int actorId;
  final String actorType;
  final String action;
  final String? entityType;
  final int? entityId;
  final Map<String, dynamic>? details;
  final String? ipAddress;
  final DateTime createdAt;

  ActivityLog({
    required this.id,
    required this.actorId,
    required this.actorType,
    required this.action,
    this.entityType,
    this.entityId,
    this.details,
    this.ipAddress,
    required this.createdAt,
  });

  factory ActivityLog.fromJson(Map<String, dynamic> json) {
    return ActivityLog(
      id: json['id'],
      actorId: json['actor_id'],
      actorType: json['actor_type'],
      action: json['action'],
      entityType: json['entity_type'],
      entityId: json['entity_id'],
      details: json['details'] != null 
          ? (json['details'] is String 
              ? {} 
              : Map<String, dynamic>.from(json['details']))
          : null,
      ipAddress: json['ip_address'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }

  // Get human readable action label
  String get actionLabel {
    switch (action) {
      case 'LOGIN': return 'Logged In';
      case 'LOGOUT': return 'Logged Out';
      case 'ORDER_CREATED': return 'Created Order';
      case 'ORDER_STATUS_CHANGED': return 'Updated Order Status';
      case 'PAYOUT_PROCESSED': return 'Processed Payout';
      case 'PROFILE_UPDATED': return 'Updated Profile';
      case 'PASSWORD_CHANGED': return 'Changed Password';
      case 'SUPPORT_TICKET': return 'Support Action';
      case 'FRANCHISE_APPROVED': return 'Approved Franchise';
      case 'FRANCHISE_REJECTED': return 'Rejected Franchise';
      case 'PRODUCT_ADDED': return 'Added Product';
      case 'PRODUCT_UPDATED': return 'Updated Product';
      default: return action.replaceAll('_', ' ');
    }
  }
}

// State class
class ActivityLogsState {
  final List<ActivityLog> logs;
  final bool isLoading;
  final String? error;
  final int currentPage;
  final int totalPages;
  final String? actionFilter;
  final DateTime? startDate;
  final DateTime? endDate;

  ActivityLogsState({
    this.logs = const [],
    this.isLoading = false,
    this.error,
    this.currentPage = 1,
    this.totalPages = 1,
    this.actionFilter,
    this.startDate,
    this.endDate,
  });

  ActivityLogsState copyWith({
    List<ActivityLog>? logs,
    bool? isLoading,
    String? error,
    int? currentPage,
    int? totalPages,
    String? actionFilter,
    DateTime? startDate,
    DateTime? endDate,
  }) {
    return ActivityLogsState(
      logs: logs ?? this.logs,
      isLoading: isLoading ?? this.isLoading,
      error: error,
      currentPage: currentPage ?? this.currentPage,
      totalPages: totalPages ?? this.totalPages,
      actionFilter: actionFilter ?? this.actionFilter,
      startDate: startDate ?? this.startDate,
      endDate: endDate ?? this.endDate,
    );
  }
}

// Provider
final activityLogsProvider = NotifierProvider<ActivityLogsNotifier, ActivityLogsState>(() {
  return ActivityLogsNotifier();
});

class ActivityLogsNotifier extends Notifier<ActivityLogsState> {
  final ApiService _apiService = ApiService();

  @override
  ActivityLogsState build() {
    fetchLogs();
    return ActivityLogsState();
  }

  Future<void> fetchLogs({int page = 1, bool append = false}) async {
    if (!append) {
      state = state.copyWith(isLoading: true, error: null);
    }

    try {
      final prefs = await SharedPreferences.getInstance();
      final role = prefs.getString('userRole') ?? 'admin';
      final franchiseId = prefs.getInt('franchiseId');

      String endpoint;
      if (role == 'admin') {
        endpoint = 'admin/activity-logs?page=$page&limit=20';
      } else {
        endpoint = 'franchise/activity-logs?franchiseId=$franchiseId&page=$page&limit=20';
      }

      // Add filters
      if (state.actionFilter != null) {
        endpoint += '&action=${state.actionFilter}';
      }
      if (state.startDate != null) {
        endpoint += '&start_date=${state.startDate!.toIso8601String().split('T')[0]}';
      }
      if (state.endDate != null) {
        endpoint += '&end_date=${state.endDate!.toIso8601String().split('T')[0]}';
      }

      final response = await _apiService.client.get(endpoint);
      final data = response.data;

      final logs = (data['logs'] as List)
          .map((json) => ActivityLog.fromJson(json))
          .toList();

      final pagination = data['pagination'];

      state = state.copyWith(
        logs: append ? [...state.logs, ...logs] : logs,
        isLoading: false,
        currentPage: pagination['page'],
        totalPages: pagination['totalPages'],
      );
    } catch (e) {
      print('Activity Logs Error: $e');
      state = state.copyWith(
        isLoading: false,
        error: 'Failed to load activity logs',
      );
    }
  }

  void setActionFilter(String? action) {
    state = state.copyWith(actionFilter: action);
    fetchLogs();
  }

  void setDateRange(DateTime? start, DateTime? end) {
    state = state.copyWith(startDate: start, endDate: end);
    fetchLogs();
  }

  void clearFilters() {
    state = ActivityLogsState();
    fetchLogs();
  }

  Future<void> loadMore() async {
    if (state.currentPage < state.totalPages && !state.isLoading) {
      await fetchLogs(page: state.currentPage + 1, append: true);
    }
  }

  Future<void> refresh() async {
    await fetchLogs();
  }
}

// Action types for filtering
const List<String> activityActionTypes = [
  'LOGIN',
  'LOGOUT',
  'ORDER_CREATED',
  'ORDER_STATUS_CHANGED',
  'PAYOUT_PROCESSED',
  'PROFILE_UPDATED',
  'PASSWORD_CHANGED',
  'SUPPORT_TICKET',
  'FRANCHISE_APPROVED',
  'FRANCHISE_REJECTED',
  'PRODUCT_ADDED',
  'PRODUCT_UPDATED',
];
