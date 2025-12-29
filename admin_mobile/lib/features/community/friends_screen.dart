import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'community_provider.dart';
import 'friend_chat_screen.dart';
import '../../widgets/modern_header.dart';

class FriendsScreen extends ConsumerStatefulWidget {
  const FriendsScreen({super.key});

  @override
  ConsumerState<FriendsScreen> createState() => _FriendsScreenState();
}

class _FriendsScreenState extends ConsumerState<FriendsScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  Widget build(BuildContext context) {
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
                tag: 'franchise_app_logo_friends', 
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
          TabBar(
            controller: _tabController,
            labelColor: const Color(0xFF2563EB),
            unselectedLabelColor: Colors.grey,
            labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold),
            indicatorColor: const Color(0xFF2563EB),
            tabs: const [
              Tab(text: 'My Friends'),
              Tab(text: 'Requests'),
            ],
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: const [
                MyFriendsList(),
                FriendRequestsList(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class MyFriendsList extends ConsumerWidget {
  const MyFriendsList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final friendsAsync = ref.watch(friendsProvider);

    return friendsAsync.when(
      data: (friends) {
        if (friends.isEmpty) return const Center(child: Text('No friends yet'));
        return ListView.separated(
          itemCount: friends.length,
          padding: const EdgeInsets.all(16),
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final friend = friends[index];
            return ListTile(
              leading: CircleAvatar(
                backgroundColor: Colors.grey[200], 
                child: Text(friend.friendName[0].toUpperCase()),
              ),
              title: Text(friend.friendName, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
              trailing: IconButton(
                icon: const Icon(Icons.chat_bubble_outline, color: Colors.blue),
                onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => FriendChatScreen(friendId: friend.friendId, friendName: friend.friendName)));
                },
              ),
            );
          },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Center(child: Text('Error: $e')),
    );
  }
}

class FriendRequestsList extends ConsumerWidget {
  const FriendRequestsList({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(friendRequestsProvider);

    return requestsAsync.when(
      data: (requests) {
        if (requests.isEmpty) return const Center(child: Text('No pending requests'));
        return ListView.separated(
          itemCount: requests.length,
          padding: const EdgeInsets.all(16),
          separatorBuilder: (_, __) => const SizedBox(height: 12),
          itemBuilder: (context, index) {
            final req = requests[index];
            return Card(
              elevation: 0,
              color: Colors.grey[50], 
              child: Padding(
                padding: const EdgeInsets.all(12.0),
                child: Row(
                  children: [
                    CircleAvatar(child: Text(req.friendName[0].toUpperCase())),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(req.friendName, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                    ),
                    Row(
                      children: [
                        IconButton(
                          icon: const Icon(Icons.check, color: Colors.green),
                          onPressed: () => ref.read(communityActionsProvider).respondToRequest(req.friendId, true),
                        ),
                        IconButton(
                          icon: const Icon(Icons.close, color: Colors.red),
                          onPressed: () => ref.read(communityActionsProvider).respondToRequest(req.friendId, false),
                        ),
                      ],
                    )
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
}
