import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import '../../core/api_service.dart';

class ChatMessage {
  final int id;
  final String message;
  final String senderType; // 'admin' or 'franchise'
  final DateTime createdAt;

  final String? attachmentUrl;
  final String? attachmentType; // 'image', 'audio', 'file'

  ChatMessage({
    required this.id,
    required this.message,
    required this.senderType,
    required this.createdAt,
    this.attachmentUrl,
    this.attachmentType,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      message: json['message'] ?? '',
      senderType: json['sender_type'],
      createdAt: DateTime.parse(json['created_at']),
      attachmentUrl: json['attachment_url'],
      attachmentType: json['attachment_type'],
    );
  }
}

class ChatSession {
  final int id;
  final String status;
  final String franchiseName;
  final String franchiseEmail;
  final String franchiseCity;
  final int franchiseId;

  ChatSession({
    required this.id, 
    required this.status,
    this.franchiseName = 'Unknown',
    this.franchiseEmail = '',
    this.franchiseCity = '',
    this.franchiseId = 0,
  });

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      id: json['id'],
      status: json['status'],
      franchiseName: json['franchise_name'] ?? 'Franchise #${json['franchise_id']}',
      franchiseEmail: json['franchise_email'] ?? '',
      franchiseCity: json['franchise_city'] ?? '',
      franchiseId: json['franchise_id'] ?? 0,
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

    final response = await api.client.get('chat/session?franchiseId=$franchiseId');
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
      final response = await _apiService.client.get('chat/messages?sessionId=${session.id}');
      List data = [];
      if (response.data is List) {
        data = response.data as List;
      } else if (response.data is Map && response.data['messages'] != null) {
        data = response.data['messages'] as List;
      }
      return data.map((e) => ChatMessage.fromJson(e)).toList();
    } catch (e) {
      return [];
    }
  }
  
// Refresh messages silently
  Future<void> refresh() async {
      // Do not set state to loading to avoid flicker
      final newMessages = await _fetchMessages();
      state = AsyncValue.data(newMessages);
  }

  Future<bool> sendMessage(String? message, {String? attachmentUrl, String? attachmentType}) async {
    final session = await ref.read(chatSessionProvider.future);
    if (session == null) return false; 

    try {
      final prefs = await SharedPreferences.getInstance();
      final franchiseId = prefs.getInt('franchiseId');
      
      final response = await _apiService.client.post('chat/messages', data: {
        'sessionId': session.id,
        'message': message,
        'senderType': 'franchise',
        'senderId': franchiseId ?? 0,
        'attachmentUrl': attachmentUrl,
        'attachmentType': attachmentType
      });

      if (response.statusCode == 200) {
        await refresh(); // Silent refresh
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<String?> uploadFile(File file) async {
      // Use the centralized upload method
      return await _apiService.uploadFile(file, folder: 'chat');
  }
}

// Admin: Fetch All Sessions
final adminChatSessionsProvider = FutureProvider<List<ChatSession>>((ref) async {
  final api = ApiService();
  try {
    final response = await api.client.get('admin/chat/sessions');
    List data = [];
    if (response.data is List) {
      data = response.data as List;
    } else if (response.data is Map && response.data['sessions'] != null) {
      data = response.data['sessions'] as List;
    }
    return data.map((e) => ChatSession.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});

// Admin: Messages for a specific session (Simple Fetch)
final adminChatMessagesFamilyProvider = FutureProvider.family<List<ChatMessage>, int>((ref, sessionId) async {
  final api = ApiService();
  try {
    final response = await api.client.get('chat/messages?sessionId=$sessionId');
    List data = [];
    if (response.data is List) {
      data = response.data as List;
    } else if (response.data is Map && response.data['messages'] != null) {
      data = response.data['messages'] as List;
    }
    return data.map((e) => ChatMessage.fromJson(e)).toList();
  } catch (e) {
    return [];
  }
});

// Admin Chat Controller for Actions
final adminChatControllerProvider = Provider((ref) => AdminChatController(ref));

class AdminChatController {
  final Ref ref;
  final ApiService _apiService = ApiService();

  AdminChatController(this.ref);

  Future<bool> sendMessage(int sessionId, String? message, {String? attachmentUrl, String? attachmentType}) async {
    try {
      final response = await _apiService.client.post('chat/messages', data: {
        'sessionId': sessionId,
        'message': message,
        'senderType': 'admin',
        'senderId': 0,
        'attachmentUrl': attachmentUrl,
        'attachmentType': attachmentType
      });

      if (response.statusCode == 200) {
        // Refresh provider
        ref.invalidate(adminChatMessagesFamilyProvider(sessionId));
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<String?> uploadFile(File file) async {
      return await _apiService.uploadFile(file, folder: 'chat_admin');
  }
  Future<ChatSession?> startNewChat(int franchiseId) async {
    try {
      final response = await _apiService.client.get('chat/session?franchiseId=$franchiseId');
      if (response.data != null) {
        final session = ChatSession.fromJson(response.data);
        // Refresh session list so it appears in the list
        ref.invalidate(adminChatSessionsProvider);
        return session;
      }
      return null;
    } catch (e) {
      return null;
    }
  }
}
