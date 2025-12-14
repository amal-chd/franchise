import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'chat_provider.dart';

class AdminChatTab extends ConsumerWidget {
  const AdminChatTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final sessionsAsync = ref.watch(adminChatSessionsProvider);

    return Scaffold(
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
                child: ListTile(
                  leading: CircleAvatar(child: Text('#${session.id}')),
                  title: Text('Session #${session.id}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                  subtitle: Text('Status: ${session.status}'),
                  trailing: const Icon(Icons.arrow_forward_ios, size: 16),
                  onTap: () {
                     Navigator.push(context, MaterialPageRoute(builder: (_) => AdminChatScreen(sessionId: session.id)));
                  },
                ),
              );
            },
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
      ),
    );
  }
}

class AdminChatScreen extends ConsumerStatefulWidget {
  final int sessionId;
  const AdminChatScreen({super.key, required this.sessionId});

  @override
  ConsumerState<AdminChatScreen> createState() => _AdminChatScreenState();
}

class _AdminChatScreenState extends ConsumerState<AdminChatScreen> {
  final TextEditingController _msgCtrl = TextEditingController();

  @override
  Widget build(BuildContext context) {
    final messagesAsync = ref.watch(adminChatMessagesFamilyProvider(widget.sessionId));

    return Scaffold(
      appBar: AppBar(title: Text('Chat #${widget.sessionId}')),
      body: Column(
        children: [
          Expanded(
            child: messagesAsync.when(
              data: (messages) {
                if (messages.isEmpty) return const Center(child: Text('No messages yet'));
                return ListView.builder(
                   reverse: true,
                   padding: const EdgeInsets.all(16),
                   itemCount: messages.length,
                   itemBuilder: (context, index) {
                      final msg = messages[index]; // Note: index 0 is newest if reverse is true? 
                      // Actually standard ListView reverse means index 0 is at bottom. 
                      // Assuming API returns newest last? 
                      // Let's assume standard 'messages' is chronological (oldest first). 
                      // To show newest at bottom, ListView normally renders top to bottom.
                      // If we want auto-scroll to bottom, usually reverse=true and list reversed.
                      // Let's keep it simple for now: standard list, user scrolls down.
                      
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
