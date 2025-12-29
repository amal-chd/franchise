import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'dart:async';
import '../../core/api_service.dart';
import '../../widgets/modern_header.dart';

// Provider for specific friend chat messages
final friendChatMessagesProvider = FutureProvider.family.autoDispose<List<Map<String, dynamic>>, int>((ref, friendId) async {
  final api = ApiService();
  final prefs = await SharedPreferences.getInstance();
  final userId = prefs.getInt('franchiseId');
  if (userId == null) return [];

  final response = await api.client.get('community/chat/messages?userId=$userId&friendId=$friendId');
  if (response.data is List) {
    return List<Map<String, dynamic>>.from(response.data);
  }
  return [];
});

class FriendChatScreen extends ConsumerStatefulWidget {
  final int friendId;
  final String friendName;
  
  const FriendChatScreen({super.key, required this.friendId, required this.friendName});

  @override
  ConsumerState<FriendChatScreen> createState() => _FriendChatScreenState();
}

class _FriendChatScreenState extends ConsumerState<FriendChatScreen> {
  final TextEditingController _msgCtrl = TextEditingController();
  final ScrollController _scrollCtrl = ScrollController();
  Timer? _timer;
  int? _currentUserId;

  @override
  void initState() {
    super.initState();
    _loadUserId();
    // Auto refresh
    _timer = Timer.periodic(const Duration(seconds: 3), (timer) {
      ref.refresh(friendChatMessagesProvider(widget.friendId));
    });
  }

  Future<void> _loadUserId() async {
      final prefs = await SharedPreferences.getInstance();
      setState(() {
          _currentUserId = prefs.getInt('franchiseId');
      });
  }

  @override
  void dispose() {
    _timer?.cancel();
    _msgCtrl.dispose();
    super.dispose();
  }

  Future<void> _sendMessage() async {
      if (_msgCtrl.text.trim().isEmpty) return;
      final msg = _msgCtrl.text.trim();
      _msgCtrl.clear();

      final api = ApiService();
      await api.client.post('community/chat/messages', data: {
          'senderId': _currentUserId,
          'receiverId': widget.friendId,
          'message': msg,
          'attachmentUrl': null 
      });
      ref.refresh(friendChatMessagesProvider(widget.friendId));
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(friendChatMessagesProvider(widget.friendId));

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: ModernDashboardHeader(
        title: '',
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
            GestureDetector(
              onTap: () => Navigator.of(context).popUntil((route) => route.isFirst),
              child: Hero(
                tag: 'franchise_app_logo_friend_chat', 
                child: Material(
                  color: Colors.transparent,
                  child: Image.asset(
                    'assets/images/header_logo_new.png', 
                    height: 24,
                    color: Colors.white,
                    errorBuilder: (context, error, stackTrace) => const SizedBox(),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              data: (messages) {
                if (messages.isEmpty) return const Center(child: Text('Start a conversation!'));
                return ListView.builder(
                  reverse: false, // Messages come ASC from DB, so display normal with scroll to bottom or reverse? 
                  // usually ASC means oldest top. So List needs to build normally but we prefer bottom.
                  // For simplicity, let's just make it auto-scroll to bottom.
                  controller: _scrollCtrl,
                  padding: const EdgeInsets.all(16),
                  itemCount: messages.length,
                  itemBuilder: (context, index) {
                    final m = messages[index];
                    final isMe = m['sender_id'] == _currentUserId;
                    return Align(
                      alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                      child: Container(
                        margin: const EdgeInsets.only(bottom: 8),
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: isMe ? Colors.blue : Colors.grey[100],
                          borderRadius: BorderRadius.circular(12),
                        ),
                        child: Text(
                          m['message'] ?? '',
                          style: TextStyle(color: isMe ? Colors.white : Colors.black),
                        ),
                      ),
                    );
                  },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, s) => Center(child: Text('Error: $e')),
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
          )
        ],
      ),
    );
  }
}
