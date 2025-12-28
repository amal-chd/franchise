import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'api_service.dart';

/// Global key for showing snackbars from anywhere
final GlobalKey<ScaffoldMessengerState> scaffoldMessengerKey = GlobalKey<ScaffoldMessengerState>();

/// Chat notification state
class ChatNotificationState {
  final int unreadCount;
  final String? lastMessageSender;
  final String? lastMessagePreview;
  final int? sessionId;

  ChatNotificationState({
    this.unreadCount = 0,
    this.lastMessageSender,
    this.lastMessagePreview,
    this.sessionId,
  });
}

/// Provider for chat notification state using Notifier pattern
final chatNotificationProvider = NotifierProvider<ChatNotificationNotifier, ChatNotificationState>(() {
  return ChatNotificationNotifier();
});

class ChatNotificationNotifier extends Notifier<ChatNotificationState> {
  Timer? _pollingTimer;
  final ApiService _apiService = ApiService();
  int _lastKnownMessageId = 0;
  int? _currentSessionId;

  @override
  ChatNotificationState build() {
    return ChatNotificationState();
  }

  /// Start polling for new messages
  void startPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = Timer.periodic(const Duration(seconds: 10), (_) => _checkForNewMessages());
    _checkForNewMessages(); // Initial check
  }

  /// Stop polling
  void stopPolling() {
    _pollingTimer?.cancel();
    _pollingTimer = null;
  }

  /// Set current session being viewed (to avoid notifying for active chat)
  void setCurrentSession(int? sessionId) {
    _currentSessionId = sessionId;
  }

  /// Reset unread count (when user views chat)
  void markAsRead() {
    state = ChatNotificationState(unreadCount: 0);
  }

  Future<void> _checkForNewMessages() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final role = prefs.getString('userRole');

      if (role == 'admin') {
        await _checkAdminMessages();
      } else if (role == 'franchise') {
        await _checkFranchiseMessages(prefs);
      }
    } catch (e) {
      debugPrint('Chat notification check error: $e');
    }
  }

  Future<void> _checkAdminMessages() async {
    try {
      final response = await _apiService.client.get('admin/chat/sessions');
      if (response.data == null) return;
      
      List sessions = [];
      if (response.data is List) {
        sessions = response.data as List;
      } else if (response.data is Map && response.data['sessions'] != null) {
        sessions = response.data['sessions'] as List;
      }
      
      int totalUnread = 0;
      String? latestSender;
      String? latestMessage;
      int? latestSessionId;
      int maxMessageIdFound = _lastKnownMessageId;

      for (var session in sessions) {
        final lastMsgId = session['last_message_id'] as int? ?? 0;
        final senderType = session['last_sender_type'] as String?;
        
        if (lastMsgId > _lastKnownMessageId && senderType == 'franchise') {
          totalUnread++;
          if (lastMsgId > maxMessageIdFound) {
            maxMessageIdFound = lastMsgId;
            latestSender = session['franchise_name'] ?? 'Franchise';
            latestMessage = session['last_message_preview'] ?? 'Value';
            latestSessionId = session['id'];
          }
        }
      }

      if (totalUnread > 0) {
        if (_currentSessionId != latestSessionId) {
          _showNotification(latestSender ?? 'New Message', latestMessage ?? 'You have a new message');
        }
        _lastKnownMessageId = maxMessageIdFound;
        state = ChatNotificationState(
          unreadCount: totalUnread,
          lastMessageSender: latestSender,
          lastMessagePreview: latestMessage,
          sessionId: latestSessionId,
        );
      }
    } catch (e) {
      debugPrint('Admin chat check error: $e');
    }
  }

  Future<void> _checkFranchiseMessages(SharedPreferences prefs) async {
    try {
      final franchiseId = prefs.getInt('franchiseId');
      if (franchiseId == null) return;

      final sessionResponse = await _apiService.client.get('chat/session?franchiseId=$franchiseId');
      if (sessionResponse.data == null) return;

      final session = sessionResponse.data;
      final sessionId = session['id'];
      final lastMsgId = session['last_message_id'] as int? ?? 0;
      final senderType = session['last_sender_type'] as String?;

      if (lastMsgId > _lastKnownMessageId && senderType == 'admin') {
        if (_currentSessionId != sessionId) {
          _showNotification('Admin Support', session['last_message_preview'] ?? 'You have a new message');
        }
        _lastKnownMessageId = lastMsgId;
        state = ChatNotificationState(
          unreadCount: state.unreadCount + 1, // Franchise usually expects 1 active thread
          lastMessageSender: 'Admin',
          lastMessagePreview: session['last_message_preview'],
          sessionId: sessionId,
        );
      }
    } catch (e) {
      debugPrint('Franchise chat check error: $e');
    }
  }

  void _showNotification(String title, String message) {
    final messenger = scaffoldMessengerKey.currentState;
    if (messenger != null) {
      messenger.showSnackBar(
        SnackBar(
          content: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withOpacity(0.2),
                  borderRadius: BorderRadius.circular(8),
                ),
                child: const Icon(Icons.chat_bubble_rounded, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(title, style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14)),
                    Text(
                      message.length > 50 ? '${message.substring(0, 50)}...' : message,
                      style: const TextStyle(fontSize: 12, color: Colors.white70),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
          backgroundColor: const Color(0xFF2563EB),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
          duration: const Duration(seconds: 4),
          margin: const EdgeInsets.all(16),
          action: SnackBarAction(
            label: 'View',
            textColor: Colors.white,
            onPressed: () {},
          ),
        ),
      );
    }
  }
}
