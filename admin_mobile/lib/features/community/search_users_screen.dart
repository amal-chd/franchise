import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'community_provider.dart';
import 'franchise_profile_screen.dart';
import '../../widgets/modern_header.dart';

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
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: ModernDashboardHeader(
        title: 'Find People',
        isHome: false,
        showLeading: true,
        leadingWidget: IconButton(
          icon: Container(
             padding: const EdgeInsets.all(8),
             decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
             child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.white),
          ),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: Column(
        children: [
          // Search Input
          Container(
             padding: const EdgeInsets.fromLTRB(16, 24, 16, 16),
             color: Colors.white,
             child: Container(
               decoration: BoxDecoration(
                 color: Colors.grey[100],
                 borderRadius: BorderRadius.circular(12),
                 border: Border.all(color: Colors.grey[200]!),
               ),
               child: TextField(
                 controller: _searchCtrl,
                 autofocus: true,
                 style: GoogleFonts.inter(fontSize: 16),
                 decoration: InputDecoration(
                   hintText: 'Search franchise owners...',
                   hintStyle: GoogleFonts.inter(color: Colors.grey[500]),
                   prefixIcon: Icon(Icons.search, color: Colors.grey[400]),
                   border: InputBorder.none,
                   contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
                   suffixIcon: _query.isNotEmpty 
                      ? IconButton(
                          icon: const Icon(Icons.clear, color: Colors.grey), 
                          onPressed: () {
                             _searchCtrl.clear();
                             setState(() => _query = '');
                          }
                        ) 
                      : null,
                 ),
                 onChanged: (val) => setState(() => _query = val),
               ),
             ),
          ),
          
          Expanded(
            child: searchAsync.when(
              data: (users) {
                 if (users.isEmpty && _query.isNotEmpty) {
                    return Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.search_off_rounded, size: 64, color: Colors.grey[300]),
                          const SizedBox(height: 16),
                          Text('No users found', style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 16)),
                        ],
                      ),
                    );
                 }
                 if (_query.isEmpty) {
                     return Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            Icon(Icons.person_search_rounded, size: 64, color: Colors.grey[300]),
                            const SizedBox(height: 16),
                            Text('Search for community members', style: GoogleFonts.inter(color: Colors.grey[500], fontSize: 16)),
                          ],
                        ),
                     );
                 }
                 
                  return ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: users.length,
                    separatorBuilder: (_,__) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final user = users[index];
                      return InkWell(
                        onTap: () {
                            Navigator.push(context, MaterialPageRoute(builder: (_) => FranchiseProfileScreen(
                                userId: user.friendId,
                                userName: user.friendName,
                                userImage: user.friendImage,
                                initialStatus: user.friendshipStatus,
                            )));
                        },
                        child: Container(
                          padding: const EdgeInsets.all(12),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(16),
                            boxShadow: [
                               BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 10, offset: const Offset(0, 4)),
                            ],
                          ),
                          child: Row(
                            children: [
                              CircleAvatar(
                                radius: 26,
                                backgroundColor: const Color(0xFFEFF6FF), // blue-50
                                child: Text(
                                  user.friendName.isNotEmpty ? user.friendName[0].toUpperCase() : '?',
                                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF2563EB), fontSize: 20),
                                ),
                              ),
                              const SizedBox(width: 16),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      user.friendName, 
                                      style: GoogleFonts.outfit(fontWeight: FontWeight.w600, fontSize: 16, color: Colors.grey[900])
                                    ),
                                    const SizedBox(height: 2),
                                    if (user.location.isNotEmpty)
                                      Row(
                                        children: [
                                          Icon(Icons.location_on_outlined, size: 12, color: Colors.grey[500]),
                                          const SizedBox(width: 4),
                                          Expanded(
                                            child: Text(
                                              user.location, 
                                              style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500]),
                                              maxLines: 1,
                                              overflow: TextOverflow.ellipsis,
                                            ),
                                          ),
                                        ],
                                      )
                                    else
                                       Text('Franchise Owner', style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[500])),
                                  ],
                                ),
                              ),
                              _buildActionButton(user),
                            ],
                          ),
                        ),
                      );
                    },
                  );
              },
              loading: () => const Center(child: CircularProgressIndicator()),
              error: (e, s) => Center(child: Text('Error: $e')),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildActionButton(Friend user) {
     if (user.friendshipStatus == 'none') {
        return ElevatedButton(
          onPressed: () async {
              final success = await ref.read(communityActionsProvider).sendFriendRequest(user.friendId);
              if (success) ref.invalidate(userSearchProvider);
          },
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF2563EB),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            elevation: 0,
          ),
          child: Text('Add', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
        );
     } else if (user.friendshipStatus == 'sent') {
        return Container(
           padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
           decoration: BoxDecoration(
              color: Colors.green[50],
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: Colors.green[200]!)
           ),
           child: Row(
             mainAxisSize: MainAxisSize.min,
             children: [
                Icon(Icons.check, size: 14, color: Colors.green[700]),
                const SizedBox(width: 4),
                Text('Sent', style: GoogleFonts.inter(color: Colors.green[700], fontWeight: FontWeight.w600, fontSize: 12)),
             ],
           ),
        );
     } else if (user.friendshipStatus == 'received') {
        return Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            InkWell(
               onTap: () async {
                  await ref.read(communityActionsProvider).respondToRequest(user.friendId, true);
                  ref.invalidate(userSearchProvider);
               },
               child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                  decoration: BoxDecoration(color: const Color(0xFF2563EB), borderRadius: BorderRadius.circular(20)),
                  child: Text('Accept', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 12)),
               ),
            ),
          ],
        );
     } else if (user.friendshipStatus == 'friend') {
        return Container(
           padding: const EdgeInsets.all(8),
           decoration: BoxDecoration(color: Colors.blue[50], shape: BoxShape.circle),
           child: const Icon(Icons.person, color: Color(0xFF2563EB), size: 18),
        );
     }
     return const SizedBox.shrink();
  }
}
