import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'dart:async';
import '../../widgets/modern_header.dart';

class FriendChatScreen extends ConsumerStatefulWidget {
  final int friendId; // Legacy ID
  final String friendName;
  
  const FriendChatScreen({super.key, required this.friendId, required this.friendName});

  @override
  ConsumerState<FriendChatScreen> createState() => _FriendChatScreenState();
}

class _FriendChatScreenState extends ConsumerState<FriendChatScreen> {
  final TextEditingController _msgCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  
  List<Map<String, dynamic>> _messages = [];
  bool _isLoading = true;
  String? _myUuid;
  String? _friendUuid;
  
  late RealtimeChannel _channel;

  @override
  void initState() {
    super.initState();
    _setupChat();
  }
  
  Future<void> _setupChat() async {
      try {
          final user = Supabase.instance.client.auth.currentUser;
          if (user == null) return;
          _myUuid = user.id;

          // Resolve Friend UUID
          final friendProfile = await Supabase.instance.client
              .from('profiles')
              .select('id')
              .eq('franchise_id', widget.friendId)
              .maybeSingle();
              
          if (friendProfile == null) {
              if (mounted) setState(() => _isLoading = false);
              return;
          }
          _friendUuid = friendProfile['id'];
          
          // Load History
          final history = await Supabase.instance.client.rpc('get_conversation_messages', params: {
              'user1': _myUuid, 
              'user2': _friendUuid
          });
          
          if (mounted) {
              setState(() {
                  _messages = List<Map<String, dynamic>>.from(history);
                  _isLoading = false;
              });
              _scrollToBottom();
          }
          
          // Subscribe to Realtime
          _channel = Supabase.instance.client.channel('public:messages');
          _channel.onPostgresChanges(
              event: PostgresChangeEvent.insert,
              schema: 'public',
              table: 'messages',
              filter: PostgresChangeFilter(
                  type: PostgresChangeFilterType.eq,
                  column: 'receiver_id',
                  value: _myUuid,
              ),
              callback: (payload) {
                  final newMsg = payload.newRecord;
                  if (newMsg['sender_id'] == _friendUuid) {
                      if (mounted) {
                          setState(() {
                             _messages.add(newMsg); 
                          });
                          _scrollToBottom();
                      }
                  }
              }
          ).subscribe();
          
      } catch (e) {
          print('Chat Setup Error: $e');
          if (mounted) setState(() => _isLoading = false);
      }
  }

  @override
  void dispose() {
    _channel.unsubscribe();
    _msgCtrl.dispose();
    _scrollCtrl.dispose();
    super.dispose();
  }
  
  void _scrollToBottom() {
      WidgetsBinding.instance.addPostFrameCallback((_) {
          if (_scrollCtrl.hasClients) {
              _scrollCtrl.animateTo(
                  _scrollCtrl.position.maxScrollExtent, 
                  duration: const Duration(milliseconds: 300), 
                  curve: Curves.easeOut
              );
          }
      });
  }

  Future<void> _sendMessage() async {
      if (_msgCtrl.text.trim().isEmpty || _friendUuid == null || _myUuid == null) return;
      final msg = _msgCtrl.text.trim();
      _msgCtrl.clear();
      
      // Optimistic update
      final tempId = DateTime.now().millisecondsSinceEpoch;
      final tempMsg = {
          'id': tempId,
          'sender_id': _myUuid,
          'receiver_id': _friendUuid,
          'content': msg,
          'created_at': DateTime.now().toIso8601String(),
          'status': 'sending' // internal status
      };
      
      setState(() {
          _messages.add(tempMsg);
      });
      _scrollToBottom();
      
      try {
          final response = await Supabase.instance.client.from('messages').insert({
              'sender_id': _myUuid,
              'receiver_id': _friendUuid,
              'content': msg,
              'status': 'sent'
          }).select().single();
          
          // Update temp message with real one? Or just let it be.
          // Ideally verify.
      } catch (e) {
          // Mark failed?
          print('Send failed: $e');
      }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: ModernDashboardHeader(
        title:  widget.friendName, // Show friend name
        isHome: false,
        showLeading: true,
        leadingWidget: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.white),
              ),
              onPressed: () => Navigator.of(context).pop(),
            ),
            // Logo? Maybe simplify header for chat
            const SizedBox(width: 8,),
            Text(widget.friendName, style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600))
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: _isLoading 
                ? const Center(child: CircularProgressIndicator())
                : _messages.isEmpty 
                    ? const Center(child: Text('Start a conversation!'))
                    : ListView.builder(
                        controller: _scrollCtrl,
                        padding: const EdgeInsets.all(16),
                        itemCount: _messages.length,
                        itemBuilder: (context, index) {
                          final m = _messages[index];
                          final isMe = m['sender_id'] == _myUuid;
                          return _buildMessageBubble(m, isMe);
                        },
                      ),
          ),
          Padding(
            padding: const EdgeInsets.all(16.0),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _msgCtrl,
                    decoration: InputDecoration(
                        hintText: 'Message...',
                        filled: true,
                        fillColor: Colors.grey[100],
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(24), borderSide: BorderSide.none)
                    ),
                  ),
                ),
                const SizedBox(width: 8),
                FloatingActionButton(
                    mini: true,
                    onPressed: _sendMessage,
                    child: const Icon(Icons.send),
                )
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMessageBubble(Map<String, dynamic> msg, bool isMe) {
    return Align(
      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
      child: Container(
        margin: const EdgeInsets.only(bottom: 8),
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.75),
        decoration: BoxDecoration(
          color: isMe ? const Color(0xFF2563EB) : Colors.white,
          borderRadius: BorderRadius.only(
            topLeft: const Radius.circular(16),
            topRight: const Radius.circular(16),
            bottomLeft: Radius.circular(isMe ? 16 : 4),
            bottomRight: Radius.circular(isMe ? 4 : 16),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withOpacity(0.05),
              blurRadius: 4,
              offset: const Offset(0, 2),
            ),
          ],
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              msg['content'] ?? msg['message'] ?? '',
              style: GoogleFonts.inter(
                color: isMe ? Colors.white : const Color(0xFF1E293B),
                fontSize: 15,
              ),
            ),
            const SizedBox(height: 4),
            if (msg['created_at'] != null)
              Text(
                _formatTime(DateTime.parse(msg['created_at'])),
                style: GoogleFonts.inter(
                  fontSize: 11,
                  color: isMe ? Colors.white70 : const Color(0xFF94A3B8),
                ),
              ),
          ],
        ),
      ),
    );
  }

  String _formatTime(DateTime time) {
    return "${time.hour}:${time.minute.toString().padLeft(2, '0')}";
  }
}
