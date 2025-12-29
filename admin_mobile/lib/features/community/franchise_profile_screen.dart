import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'community_provider.dart';
import 'friend_chat_screen.dart';
import '../chat/chat_screen.dart';

class FranchiseProfileScreen extends ConsumerStatefulWidget {
  final int userId;
  final String userName;
  final String userImage;
  final String? initialStatus;

  const FranchiseProfileScreen({
    super.key,
    required this.userId,
    required this.userName,
    required this.userImage,
    this.initialStatus,
  });

  @override
  ConsumerState<FranchiseProfileScreen> createState() => _FranchiseProfileScreenState();
}

class _FranchiseProfileScreenState extends ConsumerState<FranchiseProfileScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  bool _isSending = false;
  bool _requestSentInfo = false;
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 1, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    // Data Fetching
    final friendsAsync = ref.watch(friendsProvider);
    final requestsAsync = ref.watch(friendRequestsProvider);
    final postsAsync = ref.watch(userPostsProvider(widget.userId));

    // Logic
    bool isFriend = false;
    bool hasReceivedRequest = false;
    friendsAsync.whenData((friends) => isFriend = friends.any((f) => f.friendId == widget.userId));
    requestsAsync.whenData((requests) => hasReceivedRequest = requests.any((r) => r.friendId == widget.userId));

    String status = widget.initialStatus ?? 'none';
    if (isFriend) status = 'friend';
    if (hasReceivedRequest) status = 'received';
    if (_requestSentInfo) status = 'sent';

    return Scaffold(
      backgroundColor: Colors.white,
      body: NestedScrollView(
        controller: _scrollController,
        headerSliverBuilder: (context, innerBoxIsScrolled) {
          return [
            SliverAppBar(
              expandedHeight: 340,
              pinned: true,
              backgroundColor: const Color(0xFF2563EB),
              elevation: 0,
              leading: IconButton(
                icon: Container(
                   padding: const EdgeInsets.all(8),
                   decoration: BoxDecoration(color: Colors.black.withOpacity(0.2), shape: BoxShape.circle),
                   child: const Icon(Icons.arrow_back_ios_new_rounded, color: Colors.white, size: 18),
                ),
                onPressed: () => Navigator.pop(context),
              ),
              flexibleSpace: FlexibleSpaceBar(
                background: Stack(
                  fit: StackFit.expand,
                  children: [
                    // Gradient Background
                    Container(
                      decoration: const BoxDecoration(
                        gradient: LinearGradient(
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                          colors: [Color(0xFF1E40AF), Color(0xFF3B82F6)],
                        ),
                      ),
                    ),
                    // Decorative patterns
                    Positioned(
                      top: -50, right: -50,
                      child: Container(
                        width: 200, height: 200,
                        decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), shape: BoxShape.circle),
                      ),
                    ),
                    
                    // Profile Info Centered in Flexible Space
                    Align(
                      alignment: Alignment.center,
                      child: Padding(
                        padding: const EdgeInsets.only(top: 60), // Adjust for StatusBar
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(4),
                              decoration: BoxDecoration(
                                color: Colors.white.withOpacity(0.2), 
                                shape: BoxShape.circle,
                                border: Border.all(color: Colors.white.withOpacity(0.3), width: 1),
                              ),
                              child: CircleAvatar(
                                radius: 50,
                                backgroundColor: const Color(0xFFEFF6FF),
                                child: Text(
                                  widget.userName.isNotEmpty ? widget.userName[0].toUpperCase() : '?',
                                  style: GoogleFonts.outfit(fontSize: 40, fontWeight: FontWeight.bold, color: const Color(0xFF2563EB)),
                                ),
                              ),
                            ),
                            const SizedBox(height: 16),
                            Text(
                              widget.userName,
                              style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
                            ),
                            const SizedBox(height: 4),
                            // Text(
                            //   widget.userId == 1 ? 'Administrator' : 'Franchise Owner',
                            //   style: GoogleFonts.inter(color: Colors.white.withOpacity(0.8), fontSize: 14),
                            // ),
                            const SizedBox(height: 20),
                            _buildActionButtons(status),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              bottom: PreferredSize(
                preferredSize: const Size.fromHeight(80),
                child: Container(
                  height: 80,
                  decoration: const BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.vertical(top: Radius.circular(30)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                    children: [
                      _buildStatItem('Posts', postsAsync.value?.length.toString() ?? '0'),
                      Container(height: 30, width: 1, color: Colors.grey[200]),
                      _buildStatItem('Friends', isFriend ? '1' : '0'), // Placeholder
                      Container(height: 30, width: 1, color: Colors.grey[200]),
                      _buildStatItem('Joined', '2024'), // Placeholder
                    ],
                  ),
                ),
              ),
            ),
            
            SliverPersistentHeader(
              delegate: _SliverAppBarDelegate(
                TabBar(
                  controller: _tabController,
                  labelColor: const Color(0xFF2563EB),
                  unselectedLabelColor: Colors.grey,
                  indicatorColor: const Color(0xFF2563EB),
                  indicatorWeight: 3,
                  labelStyle: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16),
                  tabs: const [
                    Tab(text: 'Posts'),
                    // Future: Tab(text: 'Photos'),
                  ],
                ),
              ),
              pinned: true,
            ),
          ];
        },
        body: TabBarView(
          controller: _tabController,
          children: [
            _buildPostsGrid(postsAsync),
          ],
        ),
      ),
    );
  }

  Widget _buildPostsGrid(AsyncValue<List<CommunityPost>> postsAsync) {
    return postsAsync.when(
      data: (posts) {
        if (posts.isEmpty) {
          return Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: Colors.blue[50], shape: BoxShape.circle),
                  child: Icon(Icons.grid_on_rounded, size: 40, color: Colors.blue[200]),
                ),
                const SizedBox(height: 16),
                Text('No posts yet', style: GoogleFonts.outfit(fontSize: 18, color: Colors.grey[600], fontWeight: FontWeight.w600)),
                const SizedBox(height: 4),
                Text('User hasn\'t shared anything yet.', style: GoogleFonts.inter(color: Colors.grey[400])),
              ],
            ),
          );
        }
        return GridView.builder(
            padding: const EdgeInsets.all(2),
            gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
              crossAxisCount: 3,
              crossAxisSpacing: 2,
              mainAxisSpacing: 2,
            ),
            itemCount: posts.length,
            itemBuilder: (context, index) {
              final post = posts[index];
              if (post.imageUrl.isEmpty) {
                  return Container(
                    color: Colors.grey[50],
                    padding: const EdgeInsets.all(12),
                    child: Center(
                      child: Text(
                        post.contentText,
                        maxLines: 5,
                        overflow: TextOverflow.ellipsis,
                        style: GoogleFonts.inter(fontSize: 10, color: Colors.grey[800]),
                        textAlign: TextAlign.center,
                      ),
                    ),
                  );
              }
              return Image.network(
                  post.imageUrl, 
                  fit: BoxFit.cover,
                  errorBuilder: (_,__,___) => Container(color: Colors.grey[200], child: const Icon(Icons.error_outline, color: Colors.grey)),
              );
            },
        );
      },
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, s) => Center(child: Text('Failed to load posts', style: GoogleFonts.inter(color: Colors.red))),
    );
  }

  Widget _buildStatItem(String label, String value) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(value, style: GoogleFonts.outfit(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.black87)),
        Text(label, style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 13, fontWeight: FontWeight.w500)),
      ],
    );
  }

  Widget _buildActionButtons(String status) {
    if (widget.userId == 1) { // Admin check
       return ElevatedButton.icon(
         onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatScreen())),
         icon: const Icon(Icons.support_agent, size: 18, color: Color(0xFF2563EB)),
         label: Text('Support', style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: const Color(0xFF2563EB))),
         style: ElevatedButton.styleFrom(
           backgroundColor: Colors.white,
           elevation: 0,
           shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
           padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
         ),
       );
    }

    return FutureBuilder<int?>(
      future: SharedPreferences.getInstance().then((p) => p.getInt('franchiseId')),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const SizedBox(height: 48, width: 48); // placeholder
        final currentUserId = snapshot.data;
        
        if (currentUserId == widget.userId) {
          return Container(
             padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
             decoration: BoxDecoration(
               color: Colors.white.withOpacity(0.2), 
               borderRadius: BorderRadius.circular(20),
               border: Border.all(color: Colors.white.withOpacity(0.3))
             ),
             child: Row(
               mainAxisSize: MainAxisSize.min,
               children: [
                 const Icon(Icons.person_outline, size: 16, color: Colors.white),
                 const SizedBox(width: 8),
                 Text('Your Profile', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
               ],
             ),
          );
        }

        if (status == 'none') {
           return _isSending
               ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
               : ElevatedButton(
                   onPressed: () async {
                      setState(() => _isSending = true);
                      final success = await ref.read(communityActionsProvider).sendFriendRequest(widget.userId);
                      if (mounted) {
                        setState(() { _isSending = false; if (success) _requestSentInfo = true; });
                        if (success) ref.invalidate(friendRequestsProvider);
                        else ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to send request')));
                      }
                   },
                   style: ElevatedButton.styleFrom(
                     backgroundColor: Colors.white,
                     foregroundColor: const Color(0xFF2563EB),
                     padding: const EdgeInsets.symmetric(horizontal: 32, vertical: 12),
                     shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                   ),
                   child: Text('Connect', style: GoogleFonts.inter(fontWeight: FontWeight.w700)),
                 );
        } else if (status == 'sent') {
           return Container(
              padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
              decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(30)),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                   const Icon(Icons.check, size: 18, color: Colors.white),
                   const SizedBox(width: 8),
                   Text('Request Sent', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600)),
                ],
              ),
           );
        } else if (status == 'received') {
           return ElevatedButton(
             onPressed: () async {
                await ref.read(communityActionsProvider).respondToRequest(widget.userId, true);
                if(mounted) Navigator.pop(context); 
             },
             style: ElevatedButton.styleFrom(
               backgroundColor: const Color(0xFF10B981), // Green
               foregroundColor: Colors.white,
               shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
               padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
             ),
             child: Text('Accept Request', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
           );
        } else {
           return ElevatedButton.icon(
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => FriendChatScreen(friendId: widget.userId, friendName: widget.userName))),
              icon: const Icon(Icons.chat_bubble_outline, size: 18),
              label: const Text('Message'),
              style: ElevatedButton.styleFrom(
                 backgroundColor: Colors.white,
                 foregroundColor: const Color(0xFF2563EB),
                 shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
                 padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
           );
        }
      }
    );
  }
}

class _SliverAppBarDelegate extends SliverPersistentHeaderDelegate {
  final TabBar _tabBar;

  _SliverAppBarDelegate(this._tabBar);

  @override
  double get minExtent => _tabBar.preferredSize.height + 1; // +1 for divider
  @override
  double get maxExtent => _tabBar.preferredSize.height + 1;

  @override
  Widget build(BuildContext context, double shrinkOffset, bool overlapsContent) {
    return Container(
      color: Colors.white,
      child: Column(
        children: [
          _tabBar,
          const Divider(height: 1, color: Color(0xFFE5E7EB)),
        ],
      ),
    );
  }

  @override
  bool shouldRebuild(_SliverAppBarDelegate oldDelegate) {
    return false;
  }
}
