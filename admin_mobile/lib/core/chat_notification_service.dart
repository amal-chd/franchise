import 'dart:async';
import 'package:flutter/material.dart';
import 'package:riverpod/riverpod.dart';
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

  ChatNotificationState copyWith({
    int? unreadCount,
    String? lastMessageSender,
    String? lastMessagePreview,
    int? sessionId,
  }) {
    return ChatNotificationState(
      unreadCount: unreadCount ?? this.unreadCount,
      lastMessageSender: lastMessageSender ?? this.lastMessageSender,
      lastMessagePreview: lastMessagePreview ?? this.lastMessagePreview,
      sessionId: sessionId ?? this.sessionId,
    );
  }
}

/// Provider for chat notification state
final chatNotificationProvider = StateNotifierProvider<ChatNotificationNotifier, ChatNotificationState>((ref) {
  return ChatNotificationNotifier();
});

class ChatNotificationNotifier extends StateNotifier<ChatNotificationState> {
  ChatNotificationNotifier() : super(ChatNotificationState());
  
  Timer? _pollingTimer;
  final ApiService _apiService = ApiService();
  int _lastKnownMessageId = 0;
  String? _currentRole;
  int? _currentSessionId;

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
    state = state.copyWith(unreadCount: 0);
  }

  Future<void> _checkForNewMessages() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final role = prefs.getString('userRole');
      _currentRole = role;

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
      // Get all sessions and check for new messages
      final response = await _apiService.client.get('admin/chat/sessions');
      if (response.data == null) return;

      final sessions = response.data as List;
      int totalUnread = 0;
      String? latestSender;
      String? latestMessage;
      int? latestSessionId;
      int latestMessageId = 0;

      for (var session in sessions) {
        final sessionId = session['id'];
        // Fetch messages for each session
        final msgResponse = await _apiService.client.get('chat/messages?sessionId=$sessionId');
        if (msgResponse.data != null) {
          final messages = msgResponse.data as List;
          // Count messages from franchise that are newer than last known
          for (var msg in messages) {
            if (msg['sender_type'] == 'franchise' && msg['id'] > _lastKnownMessageId) {
              totalUnread++;
              if (msg['id'] > latestMessageId) {
                latestMessageId = msg['id'];
                latestSender = session['franchise_name'] ?? 'Franchise';
                latestMessage = msg['message'];
                latestSessionId = sessionId;
              }
            }
          }
        }
      }

      if (totalUnread > 0 && latestMessageId > _lastKnownMessageId) {
        // Don't notify if viewing this session
        if (_currentSessionId != latestSessionId) {
          _showNotification(latestSender ?? 'New Message', latestMessage ?? 'You have a new message');
        }
        _lastKnownMessageId = latestMessageId;
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

      // Get session
      final sessionResponse = await _apiService.client.get('chat/session?franchiseId=$franchiseId');
      if (sessionResponse.data == null) return;

      final sessionId = sessionResponse.data['id'];
      
      // Get messages
      final msgResponse = await _apiService.client.get('chat/messages?sessionId=$sessionId');
      if (msgResponse.data == null) return;

      final messages = msgResponse.data as List;
      int unreadCount = 0;
      String? latestMessage;
      int latestMessageId = 0;

      for (var msg in messages) {
        if (msg['sender_type'] == 'admin' && msg['id'] > _lastKnownMessageId) {
          unreadCount++;
          if (msg['id'] > latestMessageId) {
            latestMessageId = msg['id'];
            latestMessage = msg['message'];
          }
        }
      }

      if (unreadCount > 0 && latestMessageId > _lastKnownMessageId) {
        // Don't notify if already viewing chat
        if (_currentSessionId != sessionId) {
          _showNotification('Admin Support', latestMessage ?? 'You have a new message');
        }
        _lastKnownMessageId = latestMessageId;
        state = ChatNotificationState(
          unreadCount: unreadCount,
          lastMessageSender: 'Admin',
          lastMessagePreview: latestMessage,
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
                    Text(
                      title,
                      style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 14),
                    ),
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
            onPressed: () {
              // This would navigate to chat - handled by consumer
            },
          ),
        ),
      );
    }
  }
}
