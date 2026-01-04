import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_service.dart';

class Subscriber {
  final int id;
  final String email;
  final DateTime subscribedAt;

  Subscriber({required this.id, required this.email, required this.subscribedAt});

  factory Subscriber.fromJson(Map<String, dynamic> json) {
    return Subscriber(
      id: json['id'],
      email: json['email'],
      subscribedAt: DateTime.parse(json['subscribed_at']),
    );
  }
}

final newsletterProvider = AsyncNotifierProvider<NewsletterNotifier, List<Subscriber>>(() {
  return NewsletterNotifier();
});

class NewsletterNotifier extends AsyncNotifier<List<Subscriber>> {
  final ApiService _apiService = ApiService();

  @override
  Future<List<Subscriber>> build() async {
    return _fetchSubscribers();
  }

  Future<List<Subscriber>> _fetchSubscribers() async {
    try {
      final response = await _apiService.client.get('/admin/newsletter');
      
      List data = [];
      if (response.data is List) {
        data = response.data as List;
      } else if (response.data is Map && response.data['data'] != null) {
        data = response.data['data'] as List;
      }
      
      return data.map((e) => Subscriber.fromJson(e)).toList();
    } catch (e) {
      throw Exception('Failed to fetch subscribers');
    }
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchSubscribers());
  }

  Future<bool> sendBulkEmail({
    required String subject,
    required String html,
    required String recipientType,
    List<String>? customRecipients,
  }) async {
    try {
      final response = await _apiService.client.post(
        '/admin/newsletter/send-bulk',
        data: {
          'subject': subject,
          'html': html,
          'recipientType': recipientType,
          'customRecipients': customRecipients,
        },
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
