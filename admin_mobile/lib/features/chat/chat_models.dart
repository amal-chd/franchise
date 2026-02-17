import 'package:intl/intl.dart';

class ChatSession {
  final int id;
  final int franchiseId;
  final String? franchiseUuid;
  final String status;
  final String? lastMessage;
  final DateTime? lastMessageTime;
  final DateTime? lastSeenAdmin;
  final DateTime? lastSeenFranchise;

  ChatSession({
    required this.id,
    required this.franchiseId,
    this.franchiseUuid,
    required this.status,
    this.lastMessage,
    this.lastMessageTime,
    this.lastSeenAdmin,
    this.lastSeenFranchise,
  });

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      id: json['id'],
      franchiseId: json['franchise_id'] ?? 0,
      franchiseUuid: json['franchise_uuid'],
      status: json['status'] ?? 'open',
      lastMessage: json['last_message'],
      lastMessageTime: json['last_message_time'] != null 
          ? DateTime.parse(json['last_message_time']).toLocal() 
          : null,
      lastSeenAdmin: json['last_seen_admin'] != null 
          ? DateTime.parse(json['last_seen_admin']).toLocal() 
          : null,
      lastSeenFranchise: json['last_seen_franchise'] != null 
          ? DateTime.parse(json['last_seen_franchise']).toLocal() 
          : null,
    );
  }
}

class ChatMessage {
  final int id;
  final int sessionId;
  final String senderType; // 'franchise' or 'admin'
  final String? message;
  final String? attachmentUrl;
  final String? attachmentType;
  final String status;
  final DateTime createdAt;
  final DateTime? readAt;

  ChatMessage({
    required this.id,
    required this.sessionId,
    required this.senderType,
    this.message,
    this.attachmentUrl,
    this.attachmentType,
    required this.status,
    required this.createdAt,
    this.readAt,
  });

  bool get isMe => senderType == 'franchise';

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    return ChatMessage(
      id: json['id'],
      sessionId: json['session_id'],
      senderType: json['sender_type'] ?? 'unknown',
      message: json['message'],
      attachmentUrl: json['attachment_url'],
      attachmentType: json['attachment_type'],
      status: json['status'] ?? 'sent',
      createdAt: DateTime.parse(json['created_at']).toLocal(),
      readAt: json['read_at'] != null ? DateTime.parse(json['read_at']).toLocal() : null,
    );
  }
}
