import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/foundation.dart';
import 'dart:io';
import '../../core/api_service.dart';

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
      
      final response = await _apiService.client.get('community/posts?userId=$userId');
      if (response.data is List) {
        return (response.data as List).map((e) => CommunityPost.fromJson(e)).toList();
      }
      return [];
    } catch (e) {
      print('Feed Error: $e');
      return [];
    }
  }

  Future<String?> createPost(String content, String? imageUrl) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      debugPrint('SharedPrefs Keys: ${prefs.getKeys()}');
      final userId = prefs.getInt('franchiseId');
      final userName = prefs.getString('franchiseName') ?? 'Franchise Owner';
      final role = prefs.getString('userRole') ?? 'franchise';

      print('CreatePost: userId=$userId, userName=$userName, role=$role');

      if (userId == null) return 'User ID not found. Please relogin.';

      final data = {
        'userId': userId,
        'userName': userName,
        'userImage': '', 
        'contentText': content,
        'imageUrl': imageUrl,
        'role': role
      };

      final response = await _apiService.client.post('community/posts', data: data);
      
      if (response.statusCode == 200) {
        ref.invalidateSelf(); // Refresh feed
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

    try {
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('franchiseId');
      
      await _apiService.client.post('community/interactions', data: {
        'userId': userId,
        'postId': postId,
        'type': 'like'
      });
    } catch (e) {
      // Revert if failed (optional, but good practice)
      ref.invalidateSelf();
    }
  }

  Future<String?> uploadImage(File file) async {
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
            'friend_image': e['image']
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

class CommunityActions {
  final Ref ref;
  CommunityActions(this.ref);
// ... existing methods


  Future<bool> sendFriendRequest(int friendId) async {
    try {
      final api = ApiService();
      final prefs = await SharedPreferences.getInstance();
      final userId = prefs.getInt('franchiseId');
      
      await api.client.post('community/friends', data: {
        'userId': userId,
        'friendId': friendId,
        'action': 'request'
      });
      return true;
    } catch (e) {
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
  
  Friend({required this.id, required this.userId, required this.friendId, required this.friendName, required this.friendImage});

  factory Friend.fromJson(Map<String, dynamic> json) {
    return Friend(
      id: json['id'],
      userId: json['user_id'],
      friendId: json['friend_id'] ?? 0, // In requests, this might be the sender
      friendName: (json['f_name'] != null ? json['f_name'] + ' ' + (json['l_name']??'') : json['friend_name']) ?? 'User',
      friendImage: json['image'] ?? json['friend_image'] ?? '',
    );
  }
}
