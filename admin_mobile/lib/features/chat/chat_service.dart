import 'package:supabase_flutter/supabase_flutter.dart';
import 'chat_models.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_service.dart';

class ChatService {
  final SupabaseClient _client = Supabase.instance.client;
  final ApiService _apiService = ApiService();

  // Get or Create Session
  Future<ChatSession?> getSession({int? franchiseId, String? franchiseUuid}) async {
    if (franchiseId == null && franchiseUuid == null) return null;

      // 1. Try finding by UUID first (Most reliable)
      dynamic data;
      if (franchiseUuid != null) {
        data = await _client
            .from('admin_chat_sessions')
            .select()
            .eq('franchise_uuid', franchiseUuid)
            .maybeSingle();
      }

      // 2. Fallback: Find by ID
      if (data == null && franchiseId != null && franchiseId > 0) {
        data = await _client
            .from('admin_chat_sessions')
            .select()
            .eq('franchise_id', franchiseId)
            .maybeSingle();

        // Heal verification: If found by ID but UUID is missing/different, update it
        if (data != null && franchiseUuid != null) {
           await _client.from('admin_chat_sessions').update({
             'franchise_uuid': franchiseUuid
           }).eq('id', data['id']);
        }
      }

      // 3. Create if not found
      if (data == null) {
        // Ensure we have at least one identifier
        if ((franchiseId == null || franchiseId == 0) && franchiseUuid == null) return null;

        data = await _client
            .from('admin_chat_sessions')
            .insert({
              'franchise_id': franchiseId ?? 0,
              'franchise_uuid': franchiseUuid,
              'status': 'open',
              'created_at': DateTime.now().toUtc().toIso8601String(),
            })
            .select()
            .single();
      }

      return ChatSession.fromJson(data);
  }

  // Stream Messages
  Stream<List<ChatMessage>> getMessagesStream(int sessionId) {
    return _client
        .from('admin_chats')
        .stream(primaryKey: ['id'])
        .eq('session_id', sessionId)
        .order('created_at', ascending: true)
        .map((rows) => rows.map((e) => ChatMessage.fromJson(e)).toList());
  }

  // Send Message
  Future<bool> sendMessage({
    required int sessionId, 
    String? message, 
    String? attachmentUrl, 
    String? attachmentType
  }) async {
    try {
      await _client.from('admin_chats').insert({
        'session_id': sessionId,
        'sender_type': 'franchise',
        'message': message,
        'attachment_url': attachmentUrl,
        'attachment_type': attachmentType,
        'status': 'sent',
      });

      // Update Session Last Message
      await _client.from('admin_chat_sessions').update({
        'last_message': message ?? (attachmentType == 'image' ? 'Image' : 'File'),
        'last_message_time': DateTime.now().toUtc().toIso8601String(),
        'last_seen_franchise': DateTime.now().toUtc().toIso8601String(),
      }).eq('id', sessionId);

      return true;
    } catch (e) {
      // ignore: avoid_print
      print('ChatService Error (sendMessage): $e');
      return false;
    }
  }

  // Mark Messages as Read
  Future<void> markAdminMessagesAsRead(int sessionId) async {
    try {
      await _client
          .from('admin_chats')
          .update({
            'status': 'read',
            'read_at': DateTime.now().toUtc().toIso8601String(),
          })
          .eq('session_id', sessionId)
          .eq('sender_type', 'admin') // We only read Admin's messages
          .isFilter('read_at', null);
    } catch (e) {
      // ignore: avoid_print
      print('ChatService Error (markRead): $e');
    }
  }

  Future<String?> uploadFile(XFile file) async {
    return _apiService.uploadFile(file, folder: 'chat');
  }
}
