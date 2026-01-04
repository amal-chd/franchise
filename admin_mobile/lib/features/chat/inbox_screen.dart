import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../widgets/modern_header.dart';
import 'inbox_provider.dart';
import '../community/friend_chat_screen.dart';
import 'chat_screen.dart';
import 'admin_chat_tab.dart'; // Ensure this is accessible

class InboxScreen extends ConsumerStatefulWidget {
  const InboxScreen({super.key});

  @override
  ConsumerState<InboxScreen> createState() => _InboxScreenState();
}

class _InboxScreenState extends ConsumerState<InboxScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  String _userRole = 'franchise';

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _loadUserRole();
  }

  Future<void> _loadUserRole() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _userRole = prefs.getString('userRole') ?? 'franchise';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: ModernDashboardHeader(
        title: 'Inbox',
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
          ],
        ),
      ),
      body: Column(
        children: [
          Container(
            color: Colors.white,
            child: TabBar(
              controller: _tabController,
              labelColor: const Color(0xFF2563EB),
              unselectedLabelColor: Colors.grey,
              labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold),
              indicatorColor: const Color(0xFF2563EB),
              tabs: const [
                Tab(text: 'Messages'),
                Tab(text: 'Support'),
              ],
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                const _MessagesList(),
                _userRole == 'admin' ? const AdminChatTab() : const ChatScreen(isEmbedded: true),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _MessagesList extends ConsumerWidget {
  const _MessagesList();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final inboxAsync = ref.watch(inboxProvider);

    return inboxAsync.when(
      data: (conversations) {
        if (conversations.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.chat_bubble_outline, size: 64, color: Colors.grey[400]),
                const SizedBox(height: 16),
                Text('No messages yet', style: GoogleFonts.outfit(fontSize: 18, color: Colors.grey[600])),
              ],
            ),
          );
        }

        return ListView.separated(
          itemCount: conversations.length,
          padding: const EdgeInsets.all(16),
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final conv = conversations[index];
            return Container(
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(16),
                boxShadow: [
                  BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 10, offset: const Offset(0, 2)),
                ],
              ),
              child: ListTile(
                onTap: () {
                   if (conv.otherUserLegacyId != null) {
                       Navigator.push(context, MaterialPageRoute(builder: (_) => FriendChatScreen(
                           friendId: conv.otherUserLegacyId!,
                           friendName: conv.otherUserName
                       )));
                   }
                },
                contentPadding: const EdgeInsets.all(12),
                leading: CircleAvatar(
                  radius: 28,
                  backgroundColor: Colors.grey[200],
                  backgroundImage: conv.otherUserAvatar.isNotEmpty ? NetworkImage(conv.otherUserAvatar) : null,
                  child: conv.otherUserAvatar.isEmpty ? Text(conv.otherUserName[0].toUpperCase()) : null,
                ),
                title: Text(conv.otherUserName, style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                subtitle: Text(
                  conv.lastMessage,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: GoogleFonts.inter(fontSize: 13, color: conv.unreadCount > 0 ? Colors.black87 : Colors.grey),
                ),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      _formatDate(conv.lastMessageTime),
                      style: GoogleFonts.inter(fontSize: 11, color: Colors.grey),
                    ),
                    if (conv.unreadCount > 0) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.all(6),
                        decoration: const BoxDecoration(color: Color(0xFF2563EB), shape: BoxShape.circle),
                        child: Text(
                          conv.unreadCount.toString(),
                          style: GoogleFonts.inter(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                        ),
                      ),
                    ]
                  ],
                ),
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Center(child: Text('Error: $e')),
    );
  }

  String _formatDate(DateTime date) {
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inMinutes < 1) return 'now';
      if (diff.inHours < 24) return DateFormat('h:mm a').format(date);
      if (diff.inDays < 7) return DateFormat('E').format(date);
      return DateFormat('MMM d').format(date);
  }
}
