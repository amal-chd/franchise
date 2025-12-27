import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_service.dart';

class SupportTicket {
  final int id;
  final String name;
  final String email;
  final String subject;
  final String message;
  final String status;
  final String? reply;
  final String franchiseName;
  final String zoneName;

  SupportTicket({
    required this.id,
    required this.name,
    required this.email,
    required this.subject,
    required this.message,
    required this.status,
    this.reply,
    this.franchiseName = '',
    this.zoneName = '',
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: json['id'] ?? 0,
      name: json['name'] ?? 'Unknown',
      email: json['email'] ?? '',
      subject: json['subject'] ?? 'No Subject',
      message: json['message'] ?? '',
      status: json['status'] ?? 'Pending',
      reply: json['latest_reply'] ?? json['reply'],
      franchiseName: json['franchise_name'] ?? json['name'] ?? 'Unknown Franchise',
      zoneName: json['zone_name'] ?? 'N/A',
    );
  }
}

final supportProvider = AsyncNotifierProvider<SupportNotifier, List<SupportTicket>>(() {
  return SupportNotifier();
});

class SupportNotifier extends AsyncNotifier<List<SupportTicket>> {
  final ApiService _apiService = ApiService();

  @override
  Future<List<SupportTicket>> build() async {
    return _fetchTickets();
  }

  Future<List<SupportTicket>> _fetchTickets() async {
    try {
      final response = await _apiService.client.get('admin/support/tickets');
      if (response.data != null && response.data is List) {
        final data = response.data as List;
        return data.map((e) => SupportTicket.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      print('Support fetch error: $e');
      rethrow;
    }
  }

  Future<void> fetchTickets() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchTickets());
  }

  Future<bool> replyToTicket(SupportTicket ticket, String replyMessage) async {
    try {
      final response = await _apiService.client.post('admin/support/reply', data: {
        'ticketId': ticket.id,
        'message': replyMessage,
        'userEmail': ticket.email,
        'userName': ticket.name,
        'ticketSubject': ticket.subject,
      });

      if (response.statusCode == 200) {
        fetchTickets(); // Refresh
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
