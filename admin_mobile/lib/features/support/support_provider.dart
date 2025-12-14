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

  SupportTicket({
    required this.id,
    required this.name,
    required this.email,
    required this.subject,
    required this.message,
    required this.status,
    this.reply,
  });

  factory SupportTicket.fromJson(Map<String, dynamic> json) {
    return SupportTicket(
      id: json['id'],
      name: json['name'],
      email: json['email'],
      subject: json['subject'],
      message: json['message'],
      status: json['status'],
      reply: json['reply'],
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
    final response = await _apiService.client.get('/api/admin/support/tickets');
    return (response.data as List).map((e) => SupportTicket.fromJson(e)).toList();
  }

  Future<void> fetchTickets() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchTickets());
  }

  Future<bool> replyToTicket(int id, String replyMessage) async {
    try {
      final response = await _apiService.client.post('/api/admin/support/reply', data: {
        'id': id,
        'reply': replyMessage,
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
