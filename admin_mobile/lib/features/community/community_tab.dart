import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'community_provider.dart';
import 'create_post_screen.dart';
import 'friends_screen.dart';
import 'search_users_screen.dart';
import 'franchise_profile_screen.dart';
import '../chat/chat_screen.dart';
import '../../widgets/modern_header.dart'; // Ensure correct path
import '../auth/auth_provider.dart';

class CommunityTab extends ConsumerStatefulWidget {
  const CommunityTab({super.key});

  @override
  ConsumerState<CommunityTab> createState() => _CommunityTabState();
}

class _CommunityTabState extends ConsumerState<CommunityTab> {
  String userRole = 'franchise';

  @override
  void initState() {
    super.initState();
    _loadUserRole();
  }

  Future<void> _loadUserRole() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      userRole = prefs.getString('userRole') ?? 'franchise';
    });
  }

  @override
  Widget build(BuildContext context) {
    final feedAsync = ref.watch(communityFeedProvider);
    final canPop = Navigator.of(context).canPop();
    
    // Get user role to determine which buttons to show
    // final userRoleAsync = ref.watch(userRoleProvider);
    // final userRole = userRoleAsync.value ?? 'franchise';

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: ModernDashboardHeader(
        title: '',
        isHome: false,
        showLeading: canPop,
        leadingWidget: canPop
            ? Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  IconButton(
                    icon: Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.white),
                    ),
                    onPressed: () => Navigator.of(context).pop(),
                  ),
                  GestureDetector(
                    onTap: () => Navigator.of(context).popUntil((route) => route.isFirst),
                    child: Hero(
                      tag: 'franchise_app_logo_community',
                      child: Material(
                        color: Colors.transparent,
                        child: Image.asset(
                          'assets/images/header_logo_new.png',
                          height: 24,
                          color: Colors.white,
                          errorBuilder: (context, error, stackTrace) => const Icon(Icons.people, color: Colors.white),
                        ),
                      ),
                    ),
                  ),
                ],
              )
            : Padding(
                padding: const EdgeInsets.only(left: 8.0),
                child: GestureDetector(
                  onTap: () => Navigator.of(context).popUntil((route) => route.isFirst),
                  child: Hero(
                    tag: 'franchise_app_logo_community',
                    child: Material(
                      color: Colors.transparent,
                      child: Image.asset(
                        'assets/images/header_logo_new.png',
                        height: 24,
                        color: Colors.white,
                        errorBuilder: (context, error, stackTrace) => const Icon(Icons.people, color: Colors.white),
                      ),
                    ),
                  ),
                ),
              ),
        actions: [
          IconButton(
            icon: const Icon(Icons.add_box_outlined, color: Colors.white),
            onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePostScreen())),
          ),
          // Show search and friends buttons only for franchise users
          if (userRole == 'franchise') ...[
            IconButton(
              icon: const Icon(Icons.search, color: Colors.white),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchUsersScreen())),
            ),
            IconButton(
              icon: const Icon(Icons.people_alt_outlined, color: Colors.white),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FriendsScreen())),
            ),
          ],
        ],
      ),
      floatingActionButton: userRole == 'franchise' 
          ? FloatingActionButton(
              onPressed: () {
                Navigator.push(
                  context,
                  MaterialPageRoute(builder: (_) => const ChatScreen()),
                );
              },
              backgroundColor: const Color(0xFF2563EB),
              child: const Icon(Icons.support_agent, color: Colors.white),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(communityFeedProvider.future),
        child: feedAsync.when(
          data: (posts) {
            if (posts.isEmpty) {
                return Center(
                    child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                            Icon(Icons.feed_outlined, size: 60, color: Colors.grey[400]),
                            const SizedBox(height: 16),
                            Text('No posts yet! Be the first to share.', style: GoogleFonts.inter(fontSize: 16, color: Colors.grey[600]))
                        ],
                    )
                );
            }
            return ListView.builder(
              itemCount: posts.length,
              itemBuilder: (context, index) {
                return PostCard(post: posts[index]);
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(
            child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 40),
                    const SizedBox(height: 16),
                    Text('Failed to load feed', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                    Text(err.toString(), style: GoogleFonts.inter(color: Colors.grey, fontSize: 12), textAlign: TextAlign.center),
                    const SizedBox(height: 16),
                    ElevatedButton(
                        onPressed: () => ref.refresh(communityFeedProvider),
                        child: const Text('Retry'),
                    )
                ],
            )
          ),
        ),
      ),
    );
  }

  void _showComments(BuildContext context, WidgetRef ref, post) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.7,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: const BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
          ),
          padding: EdgeInsets.only(
            bottom: MediaQuery.of(context).viewInsets.bottom,
          ),
          child: Column(
            children: [
              // Handle
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey[300],
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Title
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Comments', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.pop(context),
                    ),
                  ],
                ),
              ),
              const Divider(),
              // Comments list
              Expanded(
                child: ListView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  children: [
                    Center(
                      child: Text(
                        'Comments coming soon!',
                        style: GoogleFonts.inter(color: Colors.grey),
                      ),
                    ),
                  ],
                ),
              ),
              // Comment input
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: Colors.grey[100],
                  border: Border(top: BorderSide(color: Colors.grey[300]!)),
                ),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 16,
                      backgroundColor: const Color(0xFF2563EB),
                      child: const Icon(Icons.person, size: 16, color: Colors.white),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: TextField(
                        decoration: InputDecoration(
                          hintText: 'Add a comment...',
                          hintStyle: GoogleFonts.inter(fontSize: 14),
                          border: InputBorder.none,
                        ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.send, color: Color(0xFF2563EB)),
                      onPressed: () {
                        // Will implement comment posting
                        ScaffoldMessenger.of(context).showSnackBar(
                          const SnackBar(content: Text('Comment posting coming soon!')),
                        );
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  void _sharePost(BuildContext context, WidgetRef ref, post) async {
    // Get friends list
    final friendsAsync = ref.read(friendsProvider);
    
    friendsAsync.when(
      data: (friends) {
        if (friends.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('No friends to share with. Add friends first!')),
          );
          return;
        }
        
        // Show friends picker
        showModalBottomSheet(
          context: context,
          builder: (context) => Container(
            padding: const EdgeInsets.all(16),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Share with', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold)),
                const SizedBox(height: 16),
                ...friends.map((friend) => ListTile(
                  leading: CircleAvatar(
                    child: Text(friend.friendName[0].toUpperCase()),
                  ),
                  title: Text(friend.friendName),
                  onTap: () {
                    Navigator.pop(context);
                    // Will implement sending post to chat
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(content: Text('Sharing to ${friend.friendName}...')),
                    );
                  },
                )).toList(),
              ],
            ),
          ),
        );
      },
      loading: () {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Loading friends...')),
        );
      },
      error: (e, s) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Error loading friends')),
        );
      },
    );
  }
}

class PostCard extends ConsumerWidget {
  final CommunityPost post;
  const PostCard({super.key, required this.post});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      color: Colors.white,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          InkWell(
            onTap: () {
                Navigator.push(context, MaterialPageRoute(builder: (_) => FranchiseProfileScreen(
                    userId: post.userId, 
                    userName: post.userName, 
                    userImage: post.userImage
                )));
            },
            child: Padding(
              padding: const EdgeInsets.all(12),
              child: Row(
                children: [
                  CircleAvatar(
                    backgroundColor: Colors.grey[200],
                    child: Text(post.userName[0].toUpperCase()),
                    // backgroundImage: post.userImage.isNotEmpty ? NetworkImage(post.userImage) : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Row(
                      children: [
                        Text(post.userName, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                        const SizedBox(width: 6),
                        // Admin badge - check if userId is 1 or role is admin
                        if (post.userId == 1)
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                            decoration: BoxDecoration(
                              gradient: const LinearGradient(
                                colors: [Color(0xFF2563EB), Color(0xFF1E40AF)],
                              ),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: Text(
                              'ADMIN',
                              style: GoogleFonts.inter(
                                color: Colors.white,
                                fontSize: 10,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                      ],
                    ),
                  ),
                  const Icon(Icons.more_horiz),
                ],
              ),
            ),
          ),
          
          // Image
          if (post.imageUrl.isNotEmpty)
            CachedNetworkImage(
                imageUrl: post.imageUrl,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                    height: 300,
                    color: Colors.grey[200],
                    child: const Center(
                      child: CircularProgressIndicator(),
                    ),
                ),
                errorWidget: (context, url, error) {
                  print('Image load error: $error for URL: $url');
                  return Container(
                      height: 200, 
                      color: Colors.grey[200], 
                      child: Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.broken_image, size: 50),
                            const SizedBox(height: 8),
                            Text('Failed to load image', 
                              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
                          ],
                        ),
                      ),
                  );
                },
            ),

          // Actions
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            child: Row(
              children: [
                IconButton(
                  icon: Icon(post.isLikedByMe ? Icons.favorite : Icons.favorite_border, 
                            color: post.isLikedByMe ? Colors.red : Colors.black),
                  onPressed: () => ref.read(communityFeedProvider.notifier).toggleLike(post.id),
                  padding: EdgeInsets.zero,
                  constraints: const BoxConstraints(),
                ),
                const SizedBox(width: 16),
                const Icon(Icons.chat_bubble_outline),
                const SizedBox(width: 16),
                const Icon(Icons.send),
              ],
            ),
          ),
          
          // Content & Likes
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                if (post.likesCount > 0)
                  Text('${post.likesCount} likes', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                const SizedBox(height: 4),
                RichText(
                  text: TextSpan(
                    style: GoogleFonts.inter(color: Colors.black),
                    children: [
                      TextSpan(text: '${post.userName} ', style: const TextStyle(fontWeight: FontWeight.bold)),
                      TextSpan(text: post.contentText),
                    ],
                  ),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
