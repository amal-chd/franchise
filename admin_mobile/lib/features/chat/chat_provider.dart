import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import 'chat_models.dart';
import 'chat_service.dart';

// --- SERVICE PROVIDER ---
final chatServiceProvider = Provider((ref) => ChatService());

// --- FRANCHISE CHAT PROVIDERS ---

// 1. Session Provider
final chatSessionProvider = FutureProvider<ChatSession?>((ref) async {
  final service = ref.watch(chatServiceProvider);
  final user = Supabase.instance.client.auth.currentUser;
  
  if (user == null) return null;

  final prefs = await SharedPreferences.getInstance();
  final franchiseId = prefs.getInt('franchiseId') ?? 0;

  return service.getSession(
    franchiseId: franchiseId,
    franchiseUuid: user.id,
  );
});

// 2. Messages Stream Provider
final chatMessagesProvider = StreamProvider<List<ChatMessage>>((ref) {
  final sessionAsync = ref.watch(chatSessionProvider);

  return sessionAsync.when(
    data: (session) {
      if (session == null) return const Stream.empty();
      return ref.watch(chatServiceProvider).getMessagesStream(session.id);
    },
    loading: () => const Stream.empty(),
    error: (_, __) => const Stream.empty(),
  );
});

// 3. Controller Provider
final chatControllerProvider = Provider((ref) => ChatController(ref));

class ChatController {
  final Ref ref;
  ChatController(this.ref);

  Future<bool> sendMessage(String? message, {String? attachmentUrl, String? attachmentType}) async {
    final session = await ref.read(chatSessionProvider.future);
    if (session == null) return false;

    return ref.read(chatServiceProvider).sendMessage(
      sessionId: session.id,
      message: message,
      attachmentUrl: attachmentUrl,
      attachmentType: attachmentType,
    );
  }

  Future<String?> uploadFile(XFile file) {
    return ref.read(chatServiceProvider).uploadFile(file);
  }

  Future<void> markMessagesAsRead(int sessionId) {
    return ref.read(chatServiceProvider).markAdminMessagesAsRead(sessionId);
  }
}


// --- ADMIN CHAT PROVIDERS (Legacy/Shared Codebase Support) ---
// Keeping these to ensure Admin side works if this app is shared, 
// using correct Schema now.

class AdminChatSession {
  final int id;
  final int franchiseId;
  final String franchiseName;
  final String? lastMessage;
  final DateTime? lastMessageTime;
  final String status;

  AdminChatSession({
    required this.id,
    required this.franchiseId,
    required this.franchiseName,
    this.lastMessage,
    this.lastMessageTime,
    required this.status,
  });
}

final adminChatSessionsProvider = FutureProvider<List<AdminChatSession>>((ref) async {
  // Realtime subscription binding would go here if needed
  
  try {
    final data = await Supabase.instance.client
        .from('admin_chat_sessions')
        .select()
        .order('last_message_time', ascending: false);

    return (data as List).map<AdminChatSession>((s) {
      return AdminChatSession(
        id: s['id'],
        franchiseId: s['franchise_id'] ?? 0,
        franchiseName: s['franchise_name'] ?? 'Franchise #${s['franchise_id']}',
        lastMessage: s['last_message'], // Correct Schema
        lastMessageTime: s['last_message_time'] != null 
            ? DateTime.parse(s['last_message_time']).toLocal() 
            : null,
        status: s['status'] ?? 'open',
      );
    }).toList();
  } catch (e) {
    // ignore: avoid_print
    print('Admin Sessions Error: $e');
    return [];
  }
});

final adminChatMessagesFamilyProvider = StreamProvider.family<List<ChatMessage>, int>((ref, sessionId) {
   return Supabase.instance.client
       .from('admin_chats')
       .stream(primaryKey: ['id'])
       .eq('session_id', sessionId)
       .order('created_at', ascending: true)
       .map((data) => data.map((e) => ChatMessage.fromJson(e)).toList());
});

final adminChatControllerProvider = Provider((ref) => AdminChatController(ref));

class AdminChatController {
  final Ref ref;
  AdminChatController(this.ref);

  Future<bool> sendMessage(int sessionId, String? message, {String? attachmentUrl, String? attachmentType}) async {
      try {
        await Supabase.instance.client.from('admin_chats').insert({
            'session_id': sessionId,
            'message': message,
            'sender_type': 'admin',
            'attachment_url': attachmentUrl,
            'attachment_type': attachmentType,
            'status': 'sent'
        });
        
        await Supabase.instance.client.from('admin_chat_sessions').update({
           'last_message': message ?? (attachmentType == 'image' ? 'Image' : 'File'),
           'last_message_time': DateTime.now().toUtc().toIso8601String()
        }).eq('id', sessionId);
        
        return true;
      } catch (e) {
        // ignore: avoid_print
        print('Admin Send Error: $e');
        return false;
      }
  }
  Future<AdminChatSession?> startNewChat(int franchiseId, String email) async {
    try {
      // 1. Check for existing session
      final existing = await Supabase.instance.client
          .from('admin_chat_sessions')
          .select()
          .eq('franchise_id', franchiseId)
          .maybeSingle();

      if (existing != null) {
          return AdminChatSession(
              id: existing['id'],
              franchiseId: existing['franchise_id'],
              franchiseName: existing['franchise_name'] ?? 'Franchise #$franchiseId',
              lastMessage: existing['last_message'],
              lastMessageTime: existing['last_message_time'] != null ? DateTime.parse(existing['last_message_time']).toLocal() : null,
              status: existing['status'] ?? 'open'
          );
      }

      // 2. Create new session
      final newSession = await Supabase.instance.client
          .from('admin_chat_sessions')
          .insert({
            'franchise_id': franchiseId,
            'franchise_name': 'Franchise #$franchiseId', // Placeholder name
            'status': 'open',
            'created_at': DateTime.now().toUtc().toIso8601String(),
          })
          .select()
          .single();

      return AdminChatSession(
          id: newSession['id'],
          franchiseId: newSession['franchise_id'],
          franchiseName: newSession['franchise_name'] ?? 'New Franchise',
          status: newSession['status'] ?? 'open'
      );
    } catch (e) {
      print('Start Chat Error: $e');
      return null;
    }
  }

  Future<void> markMessagesAsRead(int sessionId) async {
      try {
        await Supabase.instance.client
            .from('admin_chats')
            .update({
              'status': 'read',
              'read_at': DateTime.now().toUtc().toIso8601String()
            })
            .eq('session_id', sessionId)
            .eq('sender_type', 'franchise') // Admin reads franchise messages
            .isFilter('read_at', null);
      } catch (e) {
        print('Mark Read Error: $e');
      }
  }
}
