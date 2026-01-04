import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/api_service.dart';

class Conversation {
  final String otherUserId;
  final int? otherUserLegacyId;
  final String otherUserName;
  final String otherUserAvatar;
  final String lastMessage;
  final DateTime lastMessageTime;
  final int unreadCount;

  Conversation({
    required this.otherUserId,
    this.otherUserLegacyId,
    required this.otherUserName,
    required this.otherUserAvatar,
    required this.lastMessage,
    required this.lastMessageTime,
    required this.unreadCount,
  });

  factory Conversation.fromJson(Map<String, dynamic> json) {
    return Conversation(
      otherUserId: json['otherUserId'],
      otherUserLegacyId: json['otherUserLegacyId'],
      otherUserName: json['otherUserName'] ?? 'Unknown',
      otherUserAvatar: json['otherUserAvatar'] ?? '',
      lastMessage: json['lastMessage'] ?? '',
      lastMessageTime: DateTime.parse(json['lastMessageTime']),
      unreadCount: json['unreadCount'] ?? 0,
    );
  }
}

final inboxProvider = FutureProvider<List<Conversation>>((ref) async {
  final prefs = await SharedPreferences.getInstance();
  final franchiseId = prefs.getInt('franchiseId');
  if (franchiseId == null) return [];

  try {
    final response = await ApiService().client.get('chat/conversations?userId=$franchiseId');
    if (response.statusCode == 200 && response.data is List) {
      return (response.data as List).map((e) => Conversation.fromJson(e)).toList();
    }
    return [];
  } catch (e) {
    print('Inbox Error: $e');
    return [];
  }
});
