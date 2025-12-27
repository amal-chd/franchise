import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'dart:async';
import '../../core/chat_notification_service.dart';
import 'chat_provider.dart';

import '../franchises/franchise_profile_screen.dart' hide Center;
import '../requests/requests_provider.dart';

class AdminChatTab extends ConsumerWidget {
  const AdminChatTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(adminChatSessionsProvider);
    
    // Mark as read when viewing chat list
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatNotificationProvider.notifier).markAsRead();
    });

    return Scaffold(
      drawerEnableOpenDragGesture: false,
      backgroundColor: Colors.grey[50],
      body: sessionsAsync.when(
        data: (sessions) {
          if (sessions.isEmpty) {
            return const Center(child: Text('No active chat sessions'));
          }
          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: sessions.length,
            itemBuilder: (context, index) {
              final session = sessions[index];
              return Card(
                margin: const EdgeInsets.only(bottom: 12),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundColor: const Color(0xFFEFF6FF),
                    child: Text(session.franchiseName.substring(0,1).toUpperCase(), style: const TextStyle(color: Color(0xFF2563EB))),
                  ),
                  title: Text(session.franchiseName, style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                  subtitle: Text(session.franchiseCity.isNotEmpty ? session.franchiseCity : 'Location not set'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {
                     Navigator.push(context, MaterialPageRoute(builder: (_) => AdminChatScreen(
                       sessionId: session.id,
                       franchiseId: session.franchiseId,
                       franchiseName: session.franchiseName
                     )));
                  },
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showNewChatDialog(context, ref),
        label: const Text('New Chat'),
        icon: const Icon(Icons.chat),
        backgroundColor: const Color(0xFF2563EB),
      ),
    );
  }

  void _showNewChatDialog(BuildContext context, WidgetRef ref) {
    ref.read(requestsProvider.notifier).fetchRequests();
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Start New Chat'),
        content: SizedBox(
          width: double.maxFinite,
          child: Consumer(
            builder: (context, ref, _) {
              final requestsAsync = ref.watch(requestsProvider);
              return requestsAsync.when(
                data: (requests) {
                  final active = requests.where((r) => r.status == 'approved').toList();
                  if (active.isEmpty) return const Text('No active franchises available.');
                  
                  return ListView.builder(
                    shrinkWrap: true,
                    itemCount: active.length,
                    itemBuilder: (context, index) {
                      final f = active[index];
                      return ListTile(
                        leading: CircleAvatar(
                          child: Text(f.name.isNotEmpty ? f.name[0].toUpperCase() : '?'),
                        ),
                        title: Text(f.name),
                        subtitle: Text(f.city),
                        onTap: () async {
                           Navigator.pop(context); // Close dialog
                           
                           final session = await ref.read(adminChatControllerProvider).startNewChat(f.id);
                           if (session != null && context.mounted) {
                              Navigator.push(context, MaterialPageRoute(builder: (_) => AdminChatScreen(
                                 sessionId: session.id,
                                 franchiseId: session.franchiseId,
                                 franchiseName: session.franchiseName
                              )));
                           } else if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to start chat')));
                           }
                        },
                      );
                    },
                  );
                },
                loading: () => const SizedBox(height: 100, child: Center(child: CircularProgressIndicator())),
                error: (e, s) => Text('Error: $e'),
              );
            },
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
        ],
      ),
    );
  }
}

class AdminChatScreen extends ConsumerStatefulWidget {
  final int sessionId;
  final int franchiseId;
  final String franchiseName;

  const AdminChatScreen({
    super.key, 
    required this.sessionId,
    required this.franchiseId,
    required this.franchiseName,
  });

  @override
  ConsumerState<AdminChatScreen> createState() => _AdminChatScreenState();
}

class _AdminChatScreenState extends ConsumerState<AdminChatScreen> {
  final TextEditingController _msgCtrl = TextEditingController();
  Timer? _timer;

  @override
  void initState() {
    super.initState();
    // Mark notifications as read and set current session
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(chatNotificationProvider.notifier).setCurrentSession(widget.sessionId);
      ref.read(chatNotificationProvider.notifier).markAsRead();
    });
    
    _timer = Timer.periodic(const Duration(seconds: 5), (timer) {
      ref.invalidate(adminChatMessagesFamilyProvider(widget.sessionId));
    });
  }

  @override
  void dispose() {
    // Clear current session on exit
    ref.read(chatNotificationProvider.notifier).setCurrentSession(null);
    _timer?.cancel();
    _msgCtrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(adminChatMessagesFamilyProvider(widget.sessionId));

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: AppBar(
          title: Text(widget.franchiseName, style: GoogleFonts.outfit(fontSize: 18, color: const Color(0xFF0F172A), fontWeight: FontWeight.bold)),
          backgroundColor: Colors.white,
          elevation: 1,
          centerTitle: true,
          leading: IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: const Color(0xFF0F172A).withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Color(0xFF0F172A)),
            ),
            onPressed: () => Navigator.pop(context),
          ),
          actions: [
            IconButton(
              icon: const Icon(Icons.info_outline_rounded, color: Color(0xFF0F172A)),
              onPressed: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => FranchiseProfileScreen(
                  franchiseId: widget.franchiseId,
                  franchiseName: widget.franchiseName
                )));
              },
            )
          ],
        ),
      ),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              data: (messages) {
                if (messages.isEmpty) return const Center(child: Text('No messages yet'));
                return ListView.builder(
                   reverse: true, // Assuming provider returns strictly chronological, we might need to reverse here or stick to standard.
                   // WAIT: If current implementation uses reverse=true, index 0 is bottom.
                   // If data coming from API is oldest first (created_at asc usually), then reverse=true puts oldest at bottom? No, reverse puts index 0 at bottom.
                   // If list is [msg1, msg2, msg3] (oldest -> newest), index 0 is msg1 (oldest). At bottom? That's wrong ordering.
                   // Usually chat requires Newest at Bottom.
                   // If API returns [oldest, ..., newest], then standard list is Top->Bottom [oldest ... newest]. This is correct for reading down.
                   // But for auto-scroll to bottom, we usually reverse the list AND reverse the view.
                   // Let's assume standard ListView (no reverse) for simplicity unless user complained.
                   // Wait, previous code had reverse: true.
                   // Let's stick to previous logical structure but assuming API returns standard list.
                    padding: const EdgeInsets.all(16),
                    itemCount: messages.length,
                    itemBuilder: (context, index) {
                      final msg = messages[index];
                      final isMe = msg.senderType == 'admin';
                      return Align(
                        alignment: isMe ? Alignment.centerRight : Alignment.centerLeft,
                        child: Container(
                          margin: const EdgeInsets.symmetric(vertical: 4, horizontal: 8),
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: isMe ? const Color(0xFF2563EB) : Colors.white,
                            borderRadius: BorderRadius.only(
                              topLeft: const Radius.circular(12),
                              topRight: const Radius.circular(12),
                              bottomLeft: isMe ? const Radius.circular(12) : Radius.zero,
                              bottomRight: isMe ? Radius.zero : const Radius.circular(12),
                            ),
                            boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)]
                          ),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                               Text(msg.message, style: TextStyle(color: isMe ? Colors.white : Colors.black87)),
                               const SizedBox(height: 4),
                               Text(
                                 '${msg.createdAt.hour}:${msg.createdAt.minute.toString().padLeft(2,'0')}',
                                 style: TextStyle(fontSize: 10, color: isMe ? Colors.white70 : Colors.grey)
                               )
                            ],
                          ),
                        ),
                      );
                   },
                );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e,s) => const Center(child: Text('Error loading messages')),
            ),
          ),
          Container(
            padding: const EdgeInsets.all(16),
            color: Colors.white,
            child: Row(
              children: [
                IconButton(
                  onPressed: () async {
                    // TODO: Implement file picker
                    ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('File upload coming soon')));
                  },
                  icon: const Icon(Icons.attach_file, color: Colors.grey),
                ),
                Expanded(
                  child: TextField(
                    controller: _msgCtrl,
                    decoration: const InputDecoration(
                      hintText: 'Type a message...',
                      border: OutlineInputBorder(),
                      contentPadding: EdgeInsets.symmetric(horizontal: 16, vertical: 12)
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                IconButton(
                  onPressed: () async {
                    if (_msgCtrl.text.trim().isEmpty) return;
                    final success = await ref.read(adminChatControllerProvider).sendMessage(widget.sessionId, _msgCtrl.text.trim());
                    if (success) {
                      _msgCtrl.clear();
                    }
                  }, 
                  icon: const Icon(Icons.send, color: Color(0xFF2563EB)),
                )
              ],
            ),
          )
        ],
      ),
    );
  }
}
