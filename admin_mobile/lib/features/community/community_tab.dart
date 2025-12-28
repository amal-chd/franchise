import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:cached_network_image/cached_network_image.dart';
import 'community_provider.dart';
import 'create_post_screen.dart';
import 'friends_screen.dart';
import 'search_users_screen.dart';
import 'franchise_profile_screen.dart';
import '../chat/chat_screen.dart';
import '../../widgets/modern_header.dart'; // Ensure correct path

class CommunityTab extends ConsumerWidget {
  const CommunityTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final feedAsync = ref.watch(communityFeedProvider);

    return Scaffold(
      backgroundColor: Colors.grey[100],
      appBar: ModernDashboardHeader(
        title: '',
        isHome: false,
        leadingWidget: Padding(
          padding: const EdgeInsets.only(left: 8.0),
          child: Hero(
            tag: 'app_logo_community', 
            child: Material(
              color: Colors.transparent,
              child: Image.asset(
                'assets/images/logo_text.png', 
                height: 24,
                color: Colors.white,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.people, color: Colors.white),
              ),
            ),
          ),
        ),
        showLeading: false, 
        actions: [
            IconButton(
                icon: const Icon(Icons.add_box_outlined, color: Colors.black),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const CreatePostScreen())),
            ),
            IconButton(
                icon: const Icon(Icons.search, color: Colors.black),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SearchUsersScreen())),
            ),
            IconButton(
                icon: const Icon(Icons.people_alt_outlined, color: Colors.black),
                onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FriendsScreen())),
            )
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
            // Navigate to Admin Support Chat
            // We need to import ChatScreen or check where it is.
            // Assuming it's in features/chat/chat_screen.dart
             Navigator.push(context, MaterialPageRoute(builder: (_) => const ChatScreen()));
        },
        backgroundColor: const Color(0xFF2563EB),
        child: const Icon(Icons.support_agent, color: Colors.white),
      ),
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
                  Text(post.userName, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                  const Spacer(),
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
                errorWidget: (context, url, error) => Container(
                    height: 200, 
                    color: Colors.grey[200], 
                    child: const Center(child: Icon(Icons.broken_image))
                ),
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
