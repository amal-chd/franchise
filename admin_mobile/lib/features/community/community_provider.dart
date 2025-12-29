import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
// import 'dart:io';
import '../../core/api_service.dart';
import 'package:image_picker/image_picker.dart';

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
  final DateTime createdAt;

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
  });

  factory CommunityPost.fromJson(Map<String, dynamic> json) {
    return CommunityPost(
      id: json['id'],
      userId: json['user_id'],
      userName: json['user_name'] ?? 'Unknown User',
      userImage: json['user_image'] ?? '',
      contentText: json['content_text'] ?? '',
      imageUrl: json['image_url'] ?? '',
      likesCount: json['likes_count'] ?? 0,
      commentsCount: json['comments_count'] ?? 0,
      isLikedByMe: (json['is_liked_by_me'] ?? 0) > 0,
      createdAt: DateTime.parse(json['created_at']),
    );
  }
}

// Provider
final communityFeedProvider = AsyncNotifierProvider<CommunityFeedNotifier, List<CommunityPost>>(() {
  return CommunityFeedNotifier();
});

class CommunityFeedNotifier extends AsyncNotifier<List<CommunityPost>> {
  final ApiService _apiService = ApiService();

  @override
  Future<List<CommunityPost>> build() async {
    return _fetchFeed();
  }

  Future<List<CommunityPost>> _fetchFeed() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('franchiseId');
      
      print('Fetching feed for userId: $userId');
      final response = await _apiService.client.get('community/posts?userId=$userId');
      print('Feed response status: ${response.statusCode}');
      print('Feed response data type: ${response.data.runtimeType}');
      print('Feed response data: ${response.data}');
      
      if (response.data is List) {
        final posts = (response.data as List).map((e) => CommunityPost.fromJson(e)).toList();
        print('Successfully parsed ${posts.length} posts');
        return posts;
      }
      print('Response data is not a list');
      return [];
    } catch (e, stackTrace) {
      print('Feed Error: $e');
      print('Stack trace: $stackTrace');
      return [];
    }
  }

  Future<String?> createPost(String content, String? imageUrl) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      debugPrint('SharedPrefs Keys: ${prefs.getKeys()}');
      
      // Get user ID - check both franchiseId and adminId
      int? userId = prefs.getInt('franchiseId');
      if (userId == null) {
        userId = prefs.getInt('adminId');
      }
      
      final userName = prefs.getString('franchiseName') ?? 
                       prefs.getString('adminName') ?? 
                       'Admin';
      final role = prefs.getString('userRole') ?? 'franchise';

      print('CreatePost: userId=$userId, userName=$userName, role=$role');

      // For admin, use ID 1 if not found
      if (userId == null && role == 'admin') {
        userId = 1;
        print('Using admin default userId=1');
      }

      if (userId == null) return 'User ID not found. Please relogin.';

      final data = {
        'userId': userId,
        'userName': userName,
        'userImage': '', 
        'contentText': content,
        'imageUrl': imageUrl,
        'role': role
      };

      print('Sending post data: $data');
      final response = await _apiService.client.post('community/posts', data: data);
      
      print('Post response status: ${response.statusCode}');
      print('Post response data: ${response.data}');
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        print('Post created successfully!');
        print('Response includes post ID: ${response.data['id']}');
        
        // Optimistically add the new post to the current state
        final currentPosts = state.value ?? [];
        final newPost = CommunityPost(
          id: response.data['id'] ?? DateTime.now().millisecondsSinceEpoch,
          userId: userId,
          userName: userName,
          userImage: '',
          contentText: content,
          imageUrl: imageUrl ?? '', // Ensure imageUrl is not null for the model
          likesCount: 0,
          isLikedByMe: false,
          commentsCount: 0,
          createdAt: DateTime.now(), // Use DateTime object
        );
        
        // Update state with new post at the beginning
        state = AsyncValue.data([newPost, ...currentPosts]);
        
        // After 2 seconds, refresh from backend to verify post was saved
        Future.delayed(const Duration(seconds: 2), () async {
          print('Refreshing feed from backend to verify post persistence...');
          try {
            final freshPosts = await _fetchFeed();
            state = AsyncValue.data(freshPosts);
            print('Feed refreshed with ${freshPosts.length} posts from backend');
          } catch (e) {
            print('Failed to refresh feed: $e');
            // Keep optimistic update if refresh fails
          }
        });
        
        return null; // Success
      }
      print('Post Failed: ${response.statusCode} - ${response.data}');
      return 'Server Error: ${response.statusCode}';
    } catch (e) {
      print('Post Exception: $e');
      return 'Error: $e';
    }
  }

  Future<void> toggleLike(int postId) async {
    // Optimistic Update
    final currentState = state.value ?? [];
    state = AsyncValue.data(currentState.map((post) {
      if (post.id == postId) {
        return CommunityPost(
          id: post.id,
          userId: post.userId,
          userName: post.userName,
          userImage: post.userImage,
          contentText: post.contentText,
          imageUrl: post.imageUrl,
          likesCount: post.isLikedByMe ? post.likesCount - 1 : post.likesCount + 1,
          isLikedByMe: !post.isLikedByMe,
          commentsCount: post.commentsCount,
          createdAt: post.createdAt,
        );
      }
      return post;
    }).toList());

    // API Call
    try {
      await _apiService.client.post('community/interactions', data: {
        'userId': (await SharedPreferences.getInstance()).getInt('franchiseId'),
        'postId': postId,
        'type': 'like'
      });
    } catch (e) {
      // Rollback on error
      ref.invalidateSelf();
    }
  }

  Future<String?> uploadImage(XFile file) async {
    return await _apiService.uploadFile(file, folder: 'community_posts');
  }
}

// Friends Provider
final friendsProvider = FutureProvider<List<Friend>>((ref) async {
  final api = ApiService();
  final prefs = await SharedPreferences.getInstance();
  final userId = prefs.getInt('franchiseId');
  if (userId == null) return [];

  final response = await api.client.get('community/friends?userId=$userId&status=accepted');
  if (response.data is List) {
    return (response.data as List).map((e) => Friend.fromJson(e)).toList();
  }
  return [];
});

final friendRequestsProvider = FutureProvider<List<Friend>>((ref) async {
  final api = ApiService();
  final prefs = await SharedPreferences.getInstance();
  final userId = prefs.getInt('franchiseId');
  if (userId == null) return [];

  final response = await api.client.get('community/friends?userId=$userId&status=pending');
  if (response.data is List) {
    return (response.data as List).map((e) => Friend.fromJson(e)).toList();
  }
  return [];
});

final userSearchProvider = FutureProvider.family.autoDispose<List<Friend>, String>((ref, query) async {
  if (query.isEmpty) return [];
  print('Searching users with query: $query');
  final api = ApiService();
  final prefs = await SharedPreferences.getInstance();
  final userId = prefs.getInt('franchiseId');
  
  try {
    final response = await api.client.get('community/users?q=$query&userId=$userId');
    print('Search Response: ${response.statusCode} - ${response.data}');
    
    if (response.data is List) {
        final users = (response.data as List).map((e) => Friend.fromJson({
            'id': 0, 
            'user_id': 0, 
            'friend_id': e['id'], 
            'friend_name': (e['f_name'] ?? '') + ' ' + (e['l_name'] ?? ''),
            'friend_image': e['image'],
            'friendship_status': e['friendship_status'],
            'location': e['location']
        })).toList();
        print('Parsed ${users.length} users');
        return users;
    }
    return [];
  } catch (e) {
    print('Search Error: $e');
    return [];
  }
});

final userPostsProvider = FutureProvider.family.autoDispose<List<CommunityPost>, int>((ref, authorId) async {
  final api = ApiService();
  final prefs = await SharedPreferences.getInstance();
  final userId = prefs.getInt('franchiseId') ?? 1;
  
  try {
    // Add timestamp to prevent caching issues
    final timestamp = DateTime.now().millisecondsSinceEpoch;
    final url = 'community/posts?userId=$userId&authorId=$authorId&t=$timestamp';
    print('Fetching user posts from: $url');
    final response = await api.client.get(url);
    
    if (response.data is List) {
        final posts = (response.data as List).map((e) => CommunityPost.fromJson(e)).toList();
        print('Fetched ${posts.length} posts for author $authorId');
        return posts;
    }
    return [];
  } catch (e) {
    print('User Posts Error: $e');
    return [];
  }
});

class CommunityActions {
  final Ref ref;
  CommunityActions(this.ref);
// ... existing methods


  Future<bool> sendFriendRequest(int friendId) async {
    try {
      final api = ApiService();
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('franchiseId');
      
      print('Sending friend request from $userId to $friendId');
      
      final response = await api.client.post('community/friends', data: {
        'userId': userId,
        'friendId': friendId,
        'action': 'request'
      });
      
      print('Friend Request Response: ${response.statusCode} - ${response.data}');
      return true;
    } catch (e) {
      print('Friend Request Error: $e');
      return false;
    }
  }

  Future<bool> respondToRequest(int friendId, bool accept) async {
    try {
      final api = ApiService();
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('franchiseId'); // interacting user

      await api.client.post('community/friends', data: {
        'userId': userId, 
        'friendId': friendId, // The one who sent request
        'action': accept ? 'accept' : 'reject'
      });
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
  final int id; // Friendship ID
  final int userId;
  final int friendId;
  final String friendName;
  final String friendImage;
  final String friendshipStatus; // none, sent, received, friend
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
      friendId: json['other_user_id'] ?? json['friend_id'] ?? 0, // Prioritize normalized ID
      friendName: (json['f_name'] != null ? json['f_name'] + ' ' + (json['l_name']??'') : json['friend_name']) ?? 'User',
      friendImage: json['image'] ?? json['friend_image'] ?? '',
      friendshipStatus: json['friendship_status'] ?? 'none',
      location: json['location'] ?? json['city'] ?? '',
    );
  }
}
