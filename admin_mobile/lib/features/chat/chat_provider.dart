import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';

class ChatMessage {
  final int id;
  final String message;
  final String senderType; // 'admin' or 'franchise'
  final DateTime createdAt;

  ChatMessage({
    required this.id,
    required this.message,
    required this.senderType,
    required this.createdAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      message: json['message'],
      senderType: json['sender_type'],
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

class ChatSession {
  final int id;
  final String status;

  ChatSession({required this.id, required this.status});

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      id: json['id'],
      status: json['status'],
    );
  }
}

// Check for active session or create one
final chatSessionProvider = FutureProvider<ChatSession?>((ref) async {
  final api = ApiService();
  try {
    final prefs = await SharedPreferences.getInstance();
    final franchiseId = prefs.getInt('franchiseId');
    if (franchiseId == null) return null;

    final response = await api.client.get('/api/chat/session?franchiseId=$franchiseId');
    if (response.data != null) {
      return ChatSession.fromJson(response.data);
    }
  } catch (e) {
    // Session might not exist or error
  }
  return null;
});

// Messages Provider
final chatMessagesProvider = AsyncNotifierProvider<ChatMessagesNotifier, List<ChatMessage>>(() {
  return ChatMessagesNotifier();
});

class ChatMessagesNotifier extends AsyncNotifier<List<ChatMessage>> {
  final ApiService _apiService = ApiService();

  @override
  Future<List<ChatMessage>> build() async {
    return _fetchMessages();
  }

  Future<List<ChatMessage>> _fetchMessages() async {
    final session = await ref.read(chatSessionProvider.future);
    if (session == null) return [];

    try {
      final response = await _apiService.client.get('/api/chat/messages?sessionId=${session.id}');
      final data = response.data as List;
      return data.map((e) => ChatMessage.fromJson(e)).toList();
    } catch (e) {
      return [];
    }
  }
  
  // Refresh messages manually
  Future<void> refresh() async {
      state = const AsyncValue.loading();
      state = await AsyncValue.guard(() => _fetchMessages());
  }

  Future<bool> sendMessage(String message) async {
    final session = await ref.read(chatSessionProvider.future);
    if (session == null) return false; 

    try {
      final prefs = await SharedPreferences.getInstance();
      final franchiseId = prefs.getInt('franchiseId');
      
      final response = await _apiService.client.post('/api/chat/messages', data: {
        'sessionId': session.id,
        'message': message,
        'senderType': 'franchise',
        'senderId': franchiseId ?? 0 
      });

      if (response.statusCode == 200) {
        // Optimistically add message or refresh
        // For now, just refresh
        refresh();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}
