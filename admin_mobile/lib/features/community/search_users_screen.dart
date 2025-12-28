import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'community_provider.dart';
import 'franchise_profile_screen.dart';

class SearchUsersScreen extends ConsumerStatefulWidget {
  const SearchUsersScreen({super.key});

  @override
  ConsumerState<SearchUsersScreen> createState() => _SearchUsersScreenState();
}

class _SearchUsersScreenState extends ConsumerState<SearchUsersScreen> {
  final _searchCtrl = TextEditingController();
  String _query = '';

  @override
  Widget build(BuildContext context) {
    final searchAsync = ref.watch(userSearchProvider(_query));

    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: const BackButton(color: Colors.black),
        title: TextField(
          controller: _searchCtrl,
          autofocus: true,
          decoration: InputDecoration(
            hintText: 'Search franchise owners...',
            border: InputBorder.none,
            hintStyle: GoogleFonts.inter(color: Colors.grey),
          ),
          style: GoogleFonts.inter(),
          onChanged: (val) {
             setState(() => _query = val);
          },
        ),
      ),
      body: searchAsync.when(
        data: (users) {
           if (users.isEmpty && _query.isNotEmpty) {
               return const Center(child: Text('No users found'));
           }
           if (_query.isEmpty) {
               return const Center(child: Text('Type to search'));
           }
           
           return ListView.separated(
             padding: const EdgeInsets.all(16),
             itemCount: users.length,
             separatorBuilder: (_,__) => const SizedBox(height: 12),
             itemBuilder: (context, index) {
               final user = users[index];
               return ListTile(
                 onTap: () {
                     Navigator.push(context, MaterialPageRoute(builder: (_) => FranchiseProfileScreen(
                         userId: user.friendId,
                         userName: user.friendName,
                         userImage: user.friendImage
                     )));
                 },
                 leading: CircleAvatar(
                   child: Text(user.friendName.isNotEmpty ? user.friendName[0] : '?'),
                 ),
                 title: Text(user.friendName, style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
                 trailing: const Icon(Icons.arrow_forward_ios, size: 14),
               );
             },
           );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, s) => Center(child: Text('Error: $e')),
      ),
    );
  }
}
