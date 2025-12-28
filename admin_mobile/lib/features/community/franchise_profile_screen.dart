import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'friend_chat_screen.dart';
import '../../widgets/modern_header.dart'; // Ensure correct path

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'community_provider.dart';

class FranchiseProfileScreen extends ConsumerWidget {
  final int userId;
  final String userName;
  final String userImage;

  const FranchiseProfileScreen({
    super.key,
    required this.userId,
    required this.userName,
    required this.userImage,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: ModernDashboardHeader(
        title: userName,
        isHome: false,
        showLeading: true,
      ),
      body: SingleChildScrollView(
        child: Column(
          children: [
            const SizedBox(height: 30),
            CircleAvatar(
              radius: 50,
              backgroundColor: Colors.grey[200],
              child: Text(userName[0].toUpperCase(), style: const TextStyle(fontSize: 40)),
            ),
            const SizedBox(height: 16),
            Text(userName, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 8),
            Text('Franchise Owner', style: GoogleFonts.inter(color: Colors.grey[600])),
            
            const SizedBox(height: 24),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                ElevatedButton(
                  onPressed: () async {
                    final success = await ref.read(communityActionsProvider).sendFriendRequest(userId);
                    if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(success ? 'Request Sent' : 'Request Failed or Already Sent')));
                    }
                  },
                  child: const Text('Connect'),
                ),
                const SizedBox(width: 12),
                OutlinedButton(
                  onPressed: () {
                    Navigator.push(context, MaterialPageRoute(builder: (_) => FriendChatScreen(friendId: userId, friendName: userName)));
                  },
                  child: const Text('Message'),
                ),
              ],
            ),
            
            const SizedBox(height: 32),
            const Divider(),
            // Grid of posts would go here
            Center(
                child: Padding(
                  padding: const EdgeInsets.all(32.0),
                  child: Text('No posts yet', style: GoogleFonts.inter(color: Colors.grey)),
                ),
            ),
          ],
        ),
      ),
    );
  }
}
