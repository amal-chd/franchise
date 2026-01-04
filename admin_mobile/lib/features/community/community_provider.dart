import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:image_picker/image_picker.dart';
import '../../core/api_service.dart'; // Still used for upload if needed

// Models
class CommunityPost {
  final int id;
  final int userId;
  final String userName;
  final String userImage;
  final String contentText;
  final String imageUrl;
  final int likesCount;
  final int commentsCount;
  final bool isLikedByMe;
  final String role; 
  final DateTime createdAt;
  final String? recentLikerName; // New
  final String? recentCommentUser; // New
  final String? recentCommentText; // New

  CommunityPost({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userImage,
    required this.contentText,
    required this.imageUrl,
    this.likesCount = 0,
    this.commentsCount = 0,
    this.isLikedByMe = false,
    required this.createdAt,
    this.role = 'franchise',
    this.recentLikerName,
    this.recentCommentUser,
    this.recentCommentText,
  });

  factory CommunityPost.fromJson(Map<String, dynamic> json) {
    return CommunityPost(
      id: json['id'],
      userId: json['user_id'] ?? 0,
      userName: json['user_name'] ?? 'Unknown',
      userImage: json['user_image'] ?? '',
      contentText: json['content_text'] ?? '',
      imageUrl: json['image_url'] ?? '',
      likesCount: json['likes_count'] ?? 0,
      commentsCount: json['comments_count'] ?? 0,
      isLikedByMe: json['is_liked_by_me'] ?? false,
      createdAt: DateTime.parse(json['created_at']),
      role: json['role'] ?? 'franchise',
      recentLikerName: json['recent_liker_name'],
      recentCommentUser: json['recent_comment_user'],
      recentCommentText: json['recent_comment_text'],
    );
  }
}

// Provider
final communityFeedProvider = AsyncNotifierProvider<CommunityFeedNotifier, List<CommunityPost>>(() {
  return CommunityFeedNotifier();
});

// Realtime Listener for Community Feed
final communityFeedRealtimeProvider = StreamProvider<List<Map<String, dynamic>>>((ref) {
  return Supabase.instance.client
      .from('community_posts')
      .stream(primaryKey: ['id']);
});

class CommunityFeedNotifier extends AsyncNotifier<List<CommunityPost>> {

  int _page = 1;
  bool _hasMore = true;
  bool _isLoadingMore = false;
  static const int _limit = 10;

  @override
  Future<List<CommunityPost>> build() async {
    // Listen to realtime changes
    ref.watch(communityFeedRealtimeProvider);
    
    _page = 1;
    _hasMore = true;
    return _fetchFeed(page: 1);
  }

  Future<List<CommunityPost>> _fetchFeed({required int page}) async {
    try {
      var userId = Supabase.instance.client.auth.currentUser?.id;
      final prefs = await SharedPreferences.getInstance();
      
      if (userId == null && prefs.getString('userRole') == 'admin') {
          userId = '00000000-0000-0000-0000-000000000001';
      }

      if (userId == null) return [];

      final data = await Supabase.instance.client.rpc('get_community_feed', params: {
        'current_user_id': userId,
        'page_number': page,
        'page_size': _limit
      });
      
      final List<CommunityPost> newPosts = [];
      if (data is List) {
        newPosts.addAll(data.map((e) => CommunityPost.fromJson(e)).toList());
      }
      
      _hasMore = newPosts.length >= _limit;
      return newPosts;
    } catch (e) {
      print('Feed Error: $e');
      return [];
    }
  }

  Future<void> refresh() async {
    state = const AsyncValue.loading();
    _page = 1;
    _hasMore = true;
    final posts = await _fetchFeed(page: 1);
    state = AsyncValue.data(posts);
  }

  Future<void> loadMore() async {
    if (_isLoadingMore || !_hasMore) return;
    
    _isLoadingMore = true;
    final currentPosts = state.value ?? [];
    
    try {
      final nextPosts = await _fetchFeed(page: _page + 1);
      if (nextPosts.isNotEmpty) {
        _page++;
        state = AsyncValue.data([...currentPosts, ...nextPosts]);
      }
    } catch (e) {
      print('Load More Error: $e');
    } finally {
      _isLoadingMore = false;
    }
  }

  Future<String?> createPost(String content, String? imageUrl) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      var userId = Supabase.instance.client.auth.currentUser?.id;
      final role = prefs.getString('userRole');

      // Handle Legacy Admin who is not signed into Supabase Auth
      if (userId == null && role == 'admin') {
          userId = '00000000-0000-0000-0000-000000000001'; // Static Admin UUID
      }

      if (userId == null) return 'Not logged in';

      print('DEBUG: Attempting to create post for User UUID: $userId');

      final userName = prefs.getString('franchiseName') ?? (role == 'admin' ? 'The Kada Admin' : 'User');
      final userIdInt = prefs.getInt('franchiseId') ?? (role == 'admin' ? 1 : 0);

      // Check if profile exists first (Debugging step)
      final profileCheck = await Supabase.instance.client
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle();
      
      if (profileCheck == null) {
          print('DEBUG: Profile NOT found for $userId. Creating one...');
          // Auto-create profile failsafe
          try {
             await Supabase.instance.client.from('profiles').insert({
                 'id': userId,
                 'username': userName,
                 'email': role == 'admin' ? 'admin@thekada.in' : 'unknown@user.com',
                 'franchise_id': userIdInt > 0 ? userIdInt : null, 
                 'role': role ?? 'franchise'
             });
             print('DEBUG: Profile created successfully.');
          } catch (createErr) {
             print('DEBUG: Failed to create profile: $createErr');
             return 'Profile missing and creation failed: $createErr';
          }
      }

      // Insert logic
      final response = await Supabase.instance.client.from('community_posts').insert({
        'user_id': userId,
        'content_text': content,
        'image_url': imageUrl,
        'role': role ?? 'franchise' 
      }).select().single();

      // Legacy Optimistic Update (Optional since Realtime is active)
      // But we keep it to be safe
       return null;
    } catch (e) {
      print('Post Error: $e');
      return 'Error: $e';
    }
  }

  Future<void> toggleLike(int postId) async {
    var userId = Supabase.instance.client.auth.currentUser?.id;
    final prefs = await SharedPreferences.getInstance();
    
    if (userId == null && prefs.getString('userRole') == 'admin') {
         userId = '00000000-0000-0000-0000-000000000001';
    }

    if (userId == null) return;
    
    // Optimistic Update
    final current = state.value ?? [];
    
    // Find post to update
    final updatedPosts = current.map((p) {
        if (p.id == postId) {
            return CommunityPost(
                id: p.id,
                userId: p.userId,
                userName: p.userName,
                userImage: p.userImage,
                contentText: p.contentText,
                imageUrl: p.imageUrl,
                createdAt: p.createdAt,
                likesCount: p.isLikedByMe ? p.likesCount - 1 : p.likesCount + 1,
                commentsCount: p.commentsCount,
                isLikedByMe: !p.isLikedByMe
            );
        }
        return p;
    }).toList();
    
    state = AsyncValue.data(updatedPosts);

    try {
       // Toggle logic via client
       // Check existing
       final existing = await Supabase.instance.client
           .from('community_interactions')
           .select('id')
           .eq('user_id', userId!)
           .eq('post_id', postId)
           .eq('type', 'like')
           .maybeSingle();

       if (existing != null) {
           await Supabase.instance.client.from('community_interactions').delete().eq('id', existing['id']);
       } else {
           await Supabase.instance.client.from('community_interactions').insert({
               'user_id': userId,
               'post_id': postId,
               'type': 'like'
           });
       }
    } catch (e) {
        // Rollback
        state = AsyncValue.data(current);
        print('Like Error: $e');
    }
  }
  
  Future<String?> uploadImage(XFile file) async {
     // Use ApiService for upload as before
     return await ApiService().uploadFile(file, folder: 'community_posts');
  }
}

// Friends Provider
final friendsProvider = FutureProvider<List<Friend>>((ref) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return [];

    final data = await Supabase.instance.client
        .from('friendships')
        .select('*, user:user_id(*), friend:friend_id(*)')
        .or('user_id.eq.${user.id},friend_id.eq.${user.id}')
        .eq('status', 'accepted');
    
    if (data is List) {
        return data.map((f) {
            final isMyRequest = f['user_id'] == user.id;
            // 'user' and 'friend' relations are objects (from join)
            final other = isMyRequest ? f['friend'] : f['user'];
            
            // Safety check if other is null (deleted user)
            if (other == null) return null;
            
            return Friend.fromJson({
                'id': f['id'],
                'user_id': user.userMetadata?['legacy_id'] ?? 0,
                'friend_id': other['franchise_id'] ?? 0, 
                'friend_name': other['username'] ?? 'Unknown',
                'friend_image': other['avatar_url'] ?? '',
                'friendship_status': 'friend',
                'location': '' 
            });
        }).whereType<Friend>().toList();
    }
    return [];
});

final friendRequestsProvider = FutureProvider<List<Friend>>((ref) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return [];

    // Requests I received (I am friend_id)
    final data = await Supabase.instance.client
        .from('friendships')
        .select('*, sender:user_id(*)')
        .eq('friend_id', user.id)
        .eq('status', 'pending');
        
    if (data is List) {
        return data.map((r) {
            final sender = r['sender'];
            if (sender == null) return null;
            
            return Friend.fromJson({
                'id': r['id'], // friendship id
                'user_id': user.userMetadata?['legacy_id'] ?? 0,
                'friend_id': sender['franchise_id'] ?? 0,
                'friend_name': sender['username'] ?? 'Unknown',
                'friend_image': sender['avatar_url'] ?? '',
                'friendship_status': 'received',
            });
        }).whereType<Friend>().toList();
    }
    return [];
});

final userSearchProvider = FutureProvider.family.autoDispose<List<Friend>, String>((ref, query) async {
  if (query.isEmpty) return [];
  final user = Supabase.instance.client.auth.currentUser;
  
  try {
     final data = await Supabase.instance.client.rpc('search_users', params: {
       'search_query': query,
       'current_user_id': user?.id
     });
     
     if (data is List) {
         return data.map((u) => Friend.fromJson({
             'id': 0,
             'user_id': 0,
             'friend_id': u['legacy_id'],
             'friend_name': u['user_name'],
             'friend_image': u['user_image'],
             'friendship_status': u['friendship_status'],
             'location': u['location']
         })).toList();
     }
     return [];
  } catch (e) {
      print('Search Error: $e');
      return [];
  }
});

final userPostsProvider = FutureProvider.family.autoDispose<List<CommunityPost>, int>((ref, authorId) async {
  final user = Supabase.instance.client.auth.currentUser;
  if (user == null) return [];
  
  try {
     final authorProfile = await Supabase.instance.client
         .from('profiles')
         .select('id')
         .eq('franchise_id', authorId)
         .maybeSingle();
         
     if (authorProfile == null) return [];
     
     final data = await Supabase.instance.client.rpc('get_community_feed', params: {
        'current_user_id': user.id,
        'filter_author_id': authorProfile['id']
     });
     
      if (data is List) {
        return data.map((e) => CommunityPost.fromJson(e)).toList();
      }
      return [];
  } catch (e) {
      return [];
  }
});

class CommunityActions {
  final Ref ref;
  CommunityActions(this.ref);

  Future<bool> sendFriendRequest(int friendId) async {
     final user = Supabase.instance.client.auth.currentUser;
     if (user == null) return false;
     
     // Resolve friend int -> uuid
     final friendProfile = await Supabase.instance.client.from('profiles').select('id').eq('franchise_id', friendId).maybeSingle();
     if (friendProfile == null) return false;
     
     try {
       await Supabase.instance.client.from('friendships').insert({
         'user_id': user.id,
         'friend_id': friendProfile['id'],
         'status': 'pending'
       });
       return true;
     } catch (e) {
       return false;
     }
  }

  Future<bool> respondToRequest(int friendId, bool accept) async {
     // friendId is legacy INT from UI (which comes from friend request list friend_id -> sender legacy id)
     final user = Supabase.instance.client.auth.currentUser;
     if (user == null) return false;

     final friendProfile = await Supabase.instance.client.from('profiles').select('id').eq('franchise_id', friendId).maybeSingle();
     if (friendProfile == null) return false;

     try {
       if (accept) {
           await Supabase.instance.client.from('friendships').update({'status': 'accepted'})
               .eq('user_id', friendProfile['id']) // Sender
               .eq('friend_id', user.id); // Me
       } else {
           await Supabase.instance.client.from('friendships').delete()
               .eq('user_id', friendProfile['id'])
               .eq('friend_id', user.id);
       }
       ref.refresh(friendsProvider);
       ref.refresh(friendRequestsProvider);
       return true;
     } catch (e) {
       return false;
     }
  }
}

final communityActionsProvider = Provider((ref) => CommunityActions(ref));

class Friend {
  final int id; 
  final int userId;
  final int friendId;
  final String friendName;
  final String friendImage;
  final String friendshipStatus; 
  final String location;
  
  Friend({
    required this.id, 
    required this.userId, 
    required this.friendId, 
    required this.friendName, 
    required this.friendImage,
    this.friendshipStatus = 'none',
    this.location = '',
  });

  factory Friend.fromJson(Map<String, dynamic> json) {
    return Friend(
      id: json['id'] ?? 0,
      userId: json['user_id'] ?? 0,
      friendId: json['other_user_id'] ?? json['friend_id'] ?? 0, 
      friendName: (json['f_name'] != null ? json['f_name'] + ' ' + (json['l_name']??'') : json['friend_name']) ?? 'User',
      friendImage: json['image'] ?? json['friend_image'] ?? '',
      friendshipStatus: json['friendship_status'] ?? 'none',
      location: json['location'] ?? json['city'] ?? '',
    );
  }
}

// Comment Model
class PostComment {
  final int id;
  final int userId;
  final String userName;
  final String userImage;
  final String content;
  final DateTime createdAt;

  PostComment({
    required this.id,
    required this.userId,
    required this.userName,
    required this.userImage,
    required this.content,
    required this.createdAt
  });

  factory PostComment.fromJson(Map<String, dynamic> json) {
    return PostComment(
      id: json['id'],
      userId: json['user_id'] ?? 0,
      userName: json['user_name'] ?? 'Unknown',
      userImage: json['user_image'] ?? '',
      content: json['content'] ?? '',
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

final commentsProvider = FutureProvider.family.autoDispose<List<PostComment>, int>((ref, postId) async {
  try {
     final data = await Supabase.instance.client.rpc('get_post_comments', params: {
       'target_post_id': postId
     });
     
     if (data is List) {
       return data.map((e) => PostComment.fromJson(e)).toList();
     }
     return [];
  } catch (e) {
    return [];
  }
});

class CommentActions {
  Future<bool> postComment(int postId, String content) async {
    final user = Supabase.instance.client.auth.currentUser;
    if (user == null) return false;

    try {
        await Supabase.instance.client.from('community_interactions').insert({
            'user_id': user.id,
            'post_id': postId,
            'type': 'comment',
            'comment_text': content
        });
        return true;
    } catch (e) {
      print('Post Comment Error: $e');
      return false;
    }
  }
}

final commentActionsProvider = Provider((ref) => CommentActions());
