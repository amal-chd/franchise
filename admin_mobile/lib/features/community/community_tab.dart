import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:shimmer/shimmer.dart'; 
import 'package:share_plus/share_plus.dart'; // Added share_plus
import 'community_provider.dart';
import 'create_post_screen.dart';
import 'friends_screen.dart';
import 'search_users_screen.dart';
import 'franchise_profile_screen.dart';
import '../chat/chat_screen.dart';
import '../chat/inbox_screen.dart'; // Add InboxScreen
import 'friend_chat_screen.dart'; // Ensure FriendChatScreen is available
import '../../widgets/modern_header.dart';

class CommunityTab extends ConsumerStatefulWidget {
  const CommunityTab({super.key});

  @override
  ConsumerState<CommunityTab> createState() => _CommunityTabState();
}

class _CommunityTabState extends ConsumerState<CommunityTab> {
  String userRole = 'franchise';
  final ScrollController _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _loadUserRole();
    _scrollController.addListener(_onScroll);
  }

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  void _onScroll() {
    if (_scrollController.position.pixels >= _scrollController.position.maxScrollExtent - 200) {
      ref.read(communityFeedProvider.notifier).loadMore();
    }
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
                  MaterialPageRoute(builder: (_) => const InboxScreen()),
                );
              },
              backgroundColor: const Color(0xFF2563EB),
              child: const Icon(Icons.mail_outline_rounded, color: Colors.white),
            )
          : null,
      body: RefreshIndicator(
        onRefresh: () => ref.read(communityFeedProvider.notifier).refresh(),
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
              controller: _scrollController,
              padding: const EdgeInsets.only(bottom: 80),
              itemCount: posts.length + 1, // +1 for loading indicator at bottom
              itemBuilder: (context, index) {
                if (index == posts.length) {
                  // Bottom loading indicator
                  return const Padding(
                    padding: EdgeInsets.all(16.0),
                    child: Center(child: SizedBox(width: 24, height: 24, child: CircularProgressIndicator(strokeWidth: 2))),
                  );
                }
                return PostCard(
                  post: posts[index], 
                  onCommentTap: () => _showComments(context, ref, posts[index].id),
                  onMessageTap: () {
                      // Navigate to P2P Chat
                      Navigator.push(context, MaterialPageRoute(builder: (_) => FriendChatScreen(
                          friendId: posts[index].userId, // Legacy ID
                          friendName: posts[index].userName
                      )));
                  },
                );
              },
            );
          },
          loading: () => const SkeletonFeed(),
          error: (err, stack) => Center(
            child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                    const Icon(Icons.error_outline, color: Colors.red, size: 40),
                    const SizedBox(height: 16),
                    Text('Failed to load feed', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                    const SizedBox(height: 8),
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

  void _showComments(BuildContext context, WidgetRef ref, int postId) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => CommentsSheet(postId: postId),
    );
  }
}

class CommentsSheet extends ConsumerStatefulWidget {
  final int postId;
  const CommentsSheet({super.key, required this.postId});

  @override
  ConsumerState<CommentsSheet> createState() => _CommentsSheetState();
}

class _CommentsSheetState extends ConsumerState<CommentsSheet> {
  final TextEditingController _commentController = TextEditingController();
  final ScrollController _scrollController = ScrollController();
  bool _isPosting = false;

  void _postComment() async {
    final text = _commentController.text.trim();
    if (text.isEmpty) return;

    setState(() => _isPosting = true);
    
    final success = await ref.read(commentActionsProvider).postComment(widget.postId, text);
    
    if (mounted) {
      setState(() => _isPosting = false);
      if (success) {
        _commentController.clear();
        ref.refresh(commentsProvider(widget.postId)); // Refresh comments
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to post comment')));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final commentsAsync = ref.watch(commentsProvider(widget.postId));

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, sheetController) => Container(
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
              child: commentsAsync.when(
                data: (comments) {
                   if (comments.isEmpty) {
                     return Center(child: Text('No comments yet', style: GoogleFonts.inter(color: Colors.grey)));
                   }
                   return ListView.builder(
                     controller: sheetController,
                     itemCount: comments.length,
                     padding: const EdgeInsets.all(16),
                     itemBuilder: (context, index) {
                       final comment = comments[index];
                       return Padding(
                         padding: const EdgeInsets.only(bottom: 16),
                         child: Row(
                           crossAxisAlignment: CrossAxisAlignment.start,
                           children: [
                             CircleAvatar(
                               radius: 16,
                               backgroundColor: Colors.grey[200],
                               backgroundImage: comment.userImage.isNotEmpty ? NetworkImage(comment.userImage) : null,
                               child: comment.userImage.isEmpty ? Text(comment.userName[0].toUpperCase()) : null,
                             ),
                             const SizedBox(width: 12),
                             Expanded(
                               child: Column(
                                 crossAxisAlignment: CrossAxisAlignment.start,
                                 children: [
                                   Container(
                                     padding: const EdgeInsets.all(12),
                                     decoration: BoxDecoration(
                                       color: Colors.grey[100],
                                       borderRadius: BorderRadius.circular(12),
                                     ),
                                     child: Column(
                                       crossAxisAlignment: CrossAxisAlignment.start,
                                       children: [
                                          Text(comment.userName, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13)),
                                          const SizedBox(height: 4),
                                          Text(comment.content, style: GoogleFonts.inter(fontSize: 14)),
                                       ],
                                     ),
                                   ),
                                   const SizedBox(height: 4),
                                   Text(
                                     _formatDate(comment.createdAt), // Simple formatter
                                     style: GoogleFonts.inter(fontSize: 11, color: Colors.grey),
                                   )
                                 ],
                               ),
                             ),
                           ],
                         ),
                       );
                     },
                   );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, s) => Center(child: Text('Error loading comments')),
              ),
            ),
            // Comment input
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: Colors.grey[50],
                border: Border(top: BorderSide(color: Colors.grey[200]!)),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _commentController,
                      decoration: InputDecoration(
                        hintText: 'Add a comment...',
                        hintStyle: GoogleFonts.inter(fontSize: 14),
                        border: OutlineInputBorder(
                            borderRadius: BorderRadius.circular(24),
                            borderSide: BorderSide.none
                        ),
                        filled: true,
                        fillColor: Colors.white,
                        contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10)
                      ),
                    ),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    style: IconButton.styleFrom(
                        backgroundColor: const Color(0xFF2563EB),
                        padding: const EdgeInsets.all(10)
                    ),
                    icon: _isPosting 
                        ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                        : const Icon(Icons.send, color: Colors.white, size: 20),
                    onPressed: _isPosting ? null : _postComment,
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
  
  String _formatDate(DateTime date) {
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
  }
}

class SkeletonFeed extends StatelessWidget {
  const SkeletonFeed({super.key});

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      itemCount: 5,
      padding: const EdgeInsets.all(16),
      itemBuilder: (context, index) {
        return Container(
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(12)),
          child: Shimmer.fromColors(
            baseColor: Colors.grey[300]!,
            highlightColor: Colors.grey[100]!,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const CircleAvatar(radius: 20),
                      const SizedBox(width: 10),
                      Container(width: 120, height: 16, color: Colors.white),
                    ],
                  ),
                ),
                Container(width: double.infinity, height: 200, color: Colors.white),
                Padding(
                  padding: const EdgeInsets.all(12),
                  child: Column(
                    children: [
                         Container(width: double.infinity, height: 12, color: Colors.white),
                         const SizedBox(height: 6),
                         Container(width: 200, height: 12, color: Colors.white),
                    ],
                  ),
                )
              ],
            ),
          ),
        );
      },
    );
  }
}

class PostCard extends ConsumerWidget {
  final CommunityPost post;
  final VoidCallback onCommentTap;
  final VoidCallback onMessageTap; // New callback
  
  const PostCard({super.key, required this.post, required this.onCommentTap, required this.onMessageTap});

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
                    child: post.userImage.isEmpty ? Text(post.userName[0].toUpperCase()) : null,
                    backgroundImage: post.userImage.isNotEmpty ? NetworkImage(post.userImage) : null,
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            Text(post.userName, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                            const SizedBox(width: 6),
                            if (post.role == 'admin') // Use role field now if available, or fallback
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
                        // Optional: Location or handle
                      ],
                    ),
                  ),
                  const Icon(Icons.more_horiz),
                ],
              ),
            ),
          ),
          
          // Content Text (Highlighted & Moved)
          if (post.contentText.isNotEmpty)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              child: Text(
                post.contentText,
                style: GoogleFonts.inter(fontSize: 16, color: Colors.black87, height: 1.4),
              ),
            ),
          if (post.contentText.isNotEmpty) const SizedBox(height: 8),

          // Image
          if (post.imageUrl.isNotEmpty)
            CachedNetworkImage(
                imageUrl: post.imageUrl,
                width: double.infinity,
                fit: BoxFit.cover,
                placeholder: (context, url) => Container(
                    height: 300,
                    color: Colors.grey[100],
                    child: const Center(
                      child: CircularProgressIndicator(),
                    ),
                ),
                errorWidget: (context, url, error) => const SizedBox(),
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
                  visualDensity: VisualDensity.compact,
                ),
                const SizedBox(width: 16),
                IconButton(
                    icon: const Icon(Icons.chat_bubble_outline),
                    onPressed: onCommentTap,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    visualDensity: VisualDensity.compact,
                ),
                const SizedBox(width: 16),
                IconButton(
                    icon: const Icon(Icons.send_outlined),
                    onPressed: onMessageTap,
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                    visualDensity: VisualDensity.compact,
                ),
              ],
            ),
          ),
          
          // Likes & Comments Count (Footer)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // "Liked by..." Section
                if (post.likesCount > 0)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 6),
                    child: RichText(
                      text: TextSpan(
                        style: GoogleFonts.inter(fontSize: 13, color: Colors.black),
                        children: [
                          const TextSpan(text: 'Liked by '),
                           if (post.recentLikerName != null)
                            TextSpan(
                              text: post.recentLikerName,
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          if (post.likesCount > 1) ...[
                            const TextSpan(text: ' and '),
                            TextSpan(
                              text: '${post.likesCount - 1} others',
                              style: const TextStyle(fontWeight: FontWeight.bold),
                            ),
                          ]
                        ],
                      ),
                    ),
                  ),

                // Comment Preview (Recent Comment)
                if (post.recentCommentUser != null && post.recentCommentText != null) ...[
                   Padding(
                     padding: const EdgeInsets.only(bottom: 4),
                     child: RichText(
                       maxLines: 2,
                       overflow: TextOverflow.ellipsis,
                       text: TextSpan(
                         style: GoogleFonts.inter(fontSize: 13, color: Colors.black),
                         children: [
                           TextSpan(text: '${post.recentCommentUser} ', style: const TextStyle(fontWeight: FontWeight.bold)),
                           TextSpan(text: post.recentCommentText),
                         ],
                       ),
                     ),
                   ),
                ],
                
                if (post.commentsCount > 0)
                  Padding(
                    padding: const EdgeInsets.only(top: 2.0),
                    child: GestureDetector(
                        onTap: onCommentTap,
                        child: Text(
                          'View all ${post.commentsCount} comments', 
                          style: GoogleFonts.inter(color: Colors.grey, fontSize: 13),
                        )
                    ),
                  ),
                  
                const SizedBox(height: 4),
                Text(
                     _formatDate(post.createdAt),
                     style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[400]),
                ),
                const SizedBox(height: 12),
              ],
            ),
          ),
        ],
      ),
    );
  }
  
  String _formatDate(DateTime date) {
      final now = DateTime.now();
      final diff = now.difference(date);
      if (diff.inMinutes < 1) return 'Just now';
      if (diff.inHours < 24) return '${diff.inHours}h ago';
      return '${diff.inDays}d ago';
  }
}
