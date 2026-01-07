import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_service.dart'; // For upload

class ChatMessage {
  final int id;
  final String message;
  final String senderType; 
  final DateTime createdAt;
  final String? attachmentUrl;
  final String? attachmentType;
  final String status; // 'sent', 'delivered', 'read'
  final DateTime? readAt;

  ChatMessage({
    required this.id,
    required this.message,
    required this.senderType,
    required this.createdAt,
    this.attachmentUrl,
    this.attachmentType,
    this.status = 'sent',
    this.readAt,
  });

  factory ChatMessage.fromJson(Map<String, dynamic> json) {
    var status = json['status'] ?? 'sent';
    final readAt = json['read_at'] != null ? DateTime.parse(json['read_at']) : null;
    
    // Explicitly infer status for UI if read_at is present
    if (readAt != null) {
      status = 'read';
    }

    return ChatMessage(
      id: json['id'],
      message: json['message'] ?? '',
      senderType: json['sender_type'],
      createdAt: DateTime.parse(json['created_at']),
      attachmentUrl: json['attachment_url'],
      attachmentType: json['attachment_type'],
      status: status,
      readAt: readAt,
    );
  }
}

class ChatSession {
  final int id;
  final String status;
  final int franchiseId;
  final DateTime? lastSeenAdmin;

  ChatSession({
    required this.id, 
    required this.status,
    this.franchiseId = 0,
    this.lastSeenAdmin,
  });

  factory ChatSession.fromJson(Map<String, dynamic> json) {
    return ChatSession(
      id: json['id'],
      status: json['status'] ?? 'open',
      franchiseId: json['franchise_id'] ?? 0,
      lastSeenAdmin: json['last_seen_admin'] != null 
          ? DateTime.parse(json['last_seen_admin']) 
          : null,
    );
  }
}

// Check for active session or create one
final chatSessionProvider = FutureProvider<ChatSession?>((ref) async {
  final user = Supabase.instance.client.auth.currentUser;
  final prefs = await SharedPreferences.getInstance();
  final franchiseId = prefs.getInt('franchiseId') ?? 0;
  
  if (user == null && franchiseId == 0) return null;

  try {
    // 1. Try finding by UUID (Most reliable)
    if (user != null) {
        final byUuid = await Supabase.instance.client
            .from('admin_chat_sessions')
            .select()
            .eq('franchise_uuid', user.id)
            .maybeSingle();
            
        if (byUuid != null) {
            return ChatSession.fromJson(byUuid);
        }
    }

    // 2. Fallback: Find by Franchise ID
    if (franchiseId != 0) {
        final byId = await Supabase.instance.client
            .from('admin_chat_sessions')
            .select()
            .eq('franchise_id', franchiseId)
            .maybeSingle();
            
        if (byId != null) {
            // Self-heal: Update UUID if missing
            if (user != null && byId['franchise_uuid'] == null) {
                 await Supabase.instance.client
                     .from('admin_chat_sessions')
                     .update({'franchise_uuid': user.id})
                     .eq('id', byId['id']);
            }
            return ChatSession.fromJson(byId);
        }
    }

    // 3. Create if not found
    final data = await Supabase.instance.client
        .from('admin_chat_sessions')
        .insert({
            'franchise_id': franchiseId,
            'franchise_uuid': user?.id,
            'status': 'open'
        })
        .select()
        .single();
    
    return ChatSession.fromJson(data);
  } catch (e) {
    print('Session Error: $e');
    return null;
  }
});

// Messages Provider (Stream)
final chatMessagesProvider = StreamProvider<List<ChatMessage>>((ref) {
   // Watch session to get ID
   final sessionAsync = ref.watch(chatSessionProvider);
   
   return sessionAsync.when(
       data: (session) {
           if (session == null) return const Stream.empty();
           
           return Supabase.instance.client
               .from('admin_chats')
               .stream(primaryKey: ['id'])
               .eq('session_id', session.id)
               .order('created_at', ascending: true)
               .map((data) => data.map((e) => ChatMessage.fromJson(e)).toList());
       },
       loading: () => const Stream.empty(),
       error: (e, s) => const Stream.empty()
   );
});


// Controller for sending messages & presence
final chatControllerProvider = Provider((ref) => ChatController(ref));

class ChatController {
  final Ref ref;
  ChatController(this.ref);

  Future<bool> sendMessage(String? message, {String? attachmentUrl, String? attachmentType}) async {
    final session = await ref.read(chatSessionProvider.future);
    if (session == null) return false; 

    try {
      await Supabase.instance.client.from('admin_chats').insert({
          'session_id': session.id,
          'message': message,
          'sender_type': 'franchise',
          'attachment_url': attachmentUrl,
          'attachment_type': attachmentType,
          'status': 'sent'
      });
      return true;
    } catch (e) {
      print('Send Error: $e');
      return false;
    }
  }

  Future<String?> uploadFile(XFile file) async {
      return await ApiService().uploadFile(file, folder: 'chat');
  }

  Future<void> markMessagesAsRead(int sessionId) async {
    // Mark all 'admin' messages in this session as read where read_at is null
    try {
      await Supabase.instance.client
          .from('admin_chats')
          .update({
            'read_at': DateTime.now().toUtc().toIso8601String(),
            'status': 'read'
          })
          .eq('session_id', sessionId)
          .eq('sender_type', 'admin')
          .isFilter('read_at', null);
    } catch (e) {
      print('Mark Read Error: $e');
    }
  }

  Future<void> updateLastSeen(int sessionId) async {
    try {
      await Supabase.instance.client
          .from('admin_chat_sessions')
          .update({
            'last_seen_franchise': DateTime.now().toUtc().toIso8601String()
          })
          .eq('id', sessionId);
    } catch (e) {
      print('Update Last Seen Error: $e');
    }
  }
}

// Admin Providers (Optional, if Admin app uses same codebase)
// ... Keeping minimal Admin stubs or migrating similarly if needed.
// For now focusing on Franchise side features.

// ... existing ChatMessage and ChatSession classes ...

// Admin Chat Session Model
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

// Realtime Listener for Sessions List
final adminSessionsRealtimeProvider = StreamProvider<List<Map<String, dynamic>>>((ref) {
  return Supabase.instance.client
      .from('admin_chat_sessions')
      .stream(primaryKey: ['id']);
});

// Admin Sessions Provider (Fetches sessions + profiles)
final adminChatSessionsProvider = FutureProvider<List<AdminChatSession>>((ref) async {
  // Ensure we are listening to realtime updates
  ref.watch(adminSessionsRealtimeProvider); 

  try {
      final response = await ApiService().client.get('/admin/chat/sessions');
      // The API returns a list of sessions
      final List<dynamic> data = response.data;
      
      return data.map<AdminChatSession>((s) {
        return AdminChatSession(
          id: s['id'],
          franchiseId: s['franchise_id'] ?? 0,
          franchiseName: s['franchise_name'] ?? 'Franchise #${s['franchise_id']}',
          lastMessage: s['last_message_preview'],
          lastMessageTime: s['last_message_at'] != null 
              ? DateTime.parse(s['last_message_at']).toLocal() 
              : null,
          status: s['status'] ?? 'open',
        );
      }).toList();
  } catch (e) {
      print('Admin Sessions Error: $e');
      return [];
  }
});

// Admin Message Stream
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

  Future<AdminChatSession?> startNewChat(int franchiseId, String franchiseEmail) async {
    try {
        print('Starting chat with Franchise ID: $franchiseId, Email: $franchiseEmail');
        
        // 1. Get Franchise UUID from profiles using EMAIL
        // Because MySQL ID and Supabase franchise_id are out of sync.
        final profile = await Supabase.instance.client
            .from('profiles')
            .select()
            .eq('email', franchiseEmail) 
            .maybeSingle(); 
            
            
        if (profile == null) {
            print('Profile not found for franchise Email: $franchiseEmail');
            // Attempt to search by franchise_id (legacy) if passed?
            // Or just return a helpful error.
             throw 'User has not logged in to the new app yet (Profile missing). Ask them to login once.';
        }
        
        final franchiseUuid = profile['id'];
        print('Found profile: $franchiseUuid');

        // 2. Check existing session by UUID
        var existing = await Supabase.instance.client
            .from('admin_chat_sessions')
            .select()
            .eq('franchise_uuid', franchiseUuid)
            .maybeSingle();
            
        // Fallback: Check by legacy ID if UUID session not found (rare but possible migration case)
        if (existing == null) {
             existing = await Supabase.instance.client
            .from('admin_chat_sessions')
            .select()
            .eq('franchise_id', franchiseId)
            .maybeSingle();
        }

        if (existing != null) {
           print('Found existing session: ${existing['id']}');
           return AdminChatSession(
             id: existing['id'], 
             franchiseId: franchiseId, 
             franchiseName: profile['username'] ?? 'User',
             status: existing['status']
           );
        }

        // 3. Create
        print('Creating new session...');
        final newSession = await Supabase.instance.client
            .from('admin_chat_sessions')
            .insert({
               'franchise_id': franchiseId,
               'franchise_uuid': franchiseUuid,
               'status': 'open',
               // 'created_at' defaults to now() usually
            })
            .select()
            .single();
            
        print('New session created: ${newSession['id']}');
        return AdminChatSession(
           id: newSession['id'],
           franchiseId: franchiseId,
           franchiseName: profile['username'] ?? 'User',
           status: 'open'
        );
    } catch (e) {
        print('Start Chat Error: $e');
        if (e is String) rethrow; // Pass custom messages
        throw 'Failed to start chat: $e';
    }
  }

  Future<void> markMessagesAsRead(int sessionId) async {
    try {
      await Supabase.instance.client
          .from('admin_chats')
          .update({
            'read_at': DateTime.now().toUtc().toIso8601String(),
            'status': 'read'
          })
          .eq('session_id', sessionId)
          .eq('sender_type', 'franchise')
          .isFilter('read_at', null); // Only unread messages
    } catch (e) {
      print('Admin Mark Read Error: $e');
    }
  }

  Future<bool> sendMessage(int sessionId, String? message, {String? attachmentUrl, String? attachmentType}) async {
      try {
        await Supabase.instance.client.from('admin_chats').insert({
            'session_id': sessionId,
            'message': message,
            'sender_type': 'admin',
            'attachment_url': attachmentUrl,
            'attachment_type': attachmentType
        });
        
        // Update session last message
        await Supabase.instance.client.from('admin_chat_sessions').update({
           'last_message': message ?? (attachmentType == 'image' ? 'Image' : 'File'),
           'last_message_time': DateTime.now().toIso8601String()
        }).eq('id', sessionId);
        
        return true;
      } catch (e) {
        print('Admin Send Error: $e');
        return false;
      }
  }
}
