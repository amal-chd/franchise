import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../requests/requests_provider.dart';
import '../payouts/payouts_provider.dart';
import '../common/zones_provider.dart';
import '../../widgets/premium_widgets.dart';
import 'franchise_form_sheet.dart';
import '../community/franchise_profile_screen.dart';

class FranchisesTab extends ConsumerStatefulWidget {
  const FranchisesTab({super.key});

  @override
  ConsumerState<FranchisesTab> createState() => _FranchisesTabState();
}

class _FranchisesTabState extends ConsumerState<FranchisesTab> {
  final TextEditingController _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final requestsAsync = ref.watch(requestsProvider);
    final zonesAsync = ref.watch(zonesProvider);
    final List<Zone> zones = (zonesAsync.asData?.value ?? []).cast<Zone>().toList();
    
    return Container(
      color: const Color(0xFFF8FAFC),
      child: Column(
        children: [
          // Modern Search Bar
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.03),
                  blurRadius: 10,
                  offset: const Offset(0, 2),
                ),
              ],
            ),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search franchise partners...',
                hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 14),
                prefixIcon: const Icon(Icons.search_rounded, color: Color(0xFF64748B)),
                filled: true,
                fillColor: const Color(0xFFF1F5F9),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(16),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
              ),
              onChanged: (value) {
                setState(() {
                  _searchQuery = value;
                });
              },
            ),
          ),
          
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.read(requestsProvider.notifier).fetchRequests(),
              child: requestsAsync.when(
                data: (requests) {
                  final activeFranchises = requests.where((r) => r.status == 'approved').toList();
                  final filteredFranchises = activeFranchises.where((f) {
                    final query = _searchQuery.toLowerCase();
                    return f.name.toLowerCase().contains(query) ||
                           f.email.toLowerCase().contains(query) ||
                           f.city.toLowerCase().contains(query);
                  }).toList();

                  if (filteredFranchises.isEmpty) {
                    return IllustrativeState(
                      icon: Icons.store_outlined,
                      title: _searchQuery.isEmpty ? 'No Franchise Partners' : 'No Results Found',
                      subtitle: _searchQuery.isEmpty 
                        ? 'Active franchise partners will appear here'
                        : 'Try adjusting your search terms',
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: filteredFranchises.length,
                    itemBuilder: (context, index) {
                      final franchise = filteredFranchises[index];
                      
                      return Container(
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(20),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF2563EB).withOpacity(0.08),
                              blurRadius: 20,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child: Material(
                          color: Colors.transparent,
                          child: InkWell(
                            onTap: () {
                              Navigator.push(
                                context,
                                MaterialPageRoute(
                                  builder: (_) => FranchiseProfileScreen(
                                    userId: franchise.id,
                                    userName: franchise.name,
                                    userImage: '',
                                  ),
                                ),
                              );
                            },
                            borderRadius: BorderRadius.circular(20),
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      // Avatar
                                      Container(
                                        width: 56,
                                        height: 56,
                                        decoration: BoxDecoration(
                                          gradient: const LinearGradient(
                                            colors: [Color(0xFF2563EB), Color(0xFF1E40AF)],
                                            begin: Alignment.topLeft,
                                            end: Alignment.bottomRight,
                                          ),
                                          borderRadius: BorderRadius.circular(16),
                                        ),
                                        child: Center(
                                          child: Text(
                                            franchise.name[0].toUpperCase(),
                                            style: GoogleFonts.outfit(
                                              color: Colors.white,
                                              fontSize: 24,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 16),
                                      
                                      // Info
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              franchise.name,
                                              style: GoogleFonts.outfit(
                                                fontWeight: FontWeight.bold,
                                                fontSize: 17,
                                                color: const Color(0xFF0F172A),
                                              ),
                                            ),
                                            const SizedBox(height: 4),
                                            Row(
                                              children: [
                                                Icon(
                                                  Icons.location_on_rounded,
                                                  size: 14,
                                                  color: const Color(0xFF64748B),
                                                ),
                                                const SizedBox(width: 4),
                                                Text(
                                                  franchise.city,
                                                  style: GoogleFonts.inter(
                                                    fontSize: 13,
                                                    color: const Color(0xFF64748B),
                                                    fontWeight: FontWeight.w500,
                                                  ),
                                                ),
                                              ],
                                            ),
                                          ],
                                        ),
                                      ),
                                      
                                      // Edit Button
                                      IconButton(
                                        onPressed: () => _showEditDialog(
                                          context,
                                          ref,
                                          franchise.id,
                                          {
                                            'name': franchise.name,
                                            'email': franchise.email,
                                            'phone': franchise.phone,
                                            'city': franchise.city,
                                            'plan_selected': franchise.planSelected,
                                            'status': franchise.status,
                                            'upi_id': franchise.upiId,
                                            'bank_account_number': franchise.bankAccountNumber,
                                            'ifsc_code': franchise.ifscCode,
                                            'bank_name': franchise.bankName,
                                            'zone_id': franchise.zoneId,
                                            'aadhar_url': franchise.kycUrl,
                                          },
                                          zones,
                                        ),
                                        icon: Container(
                                          padding: const EdgeInsets.all(8),
                                          decoration: BoxDecoration(
                                            color: const Color(0xFF2563EB).withOpacity(0.1),
                                            borderRadius: BorderRadius.circular(10),
                                          ),
                                          child: const Icon(
                                            Icons.edit_rounded,
                                            color: Color(0xFF2563EB),
                                            size: 18,
                                          ),
                                        ),
                                      ),
                                    ],
                                  ),
                                  
                                  const SizedBox(height: 16),
                                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                  const SizedBox(height: 16),
                                  
                                  // Details Row
                                  Row(
                                    children: [
                                      Expanded(
                                        child: _buildDetailChip(
                                          Icons.phone_rounded,
                                          franchise.phone,
                                          const Color(0xFF10B981),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: _buildDetailChip(
                                          Icons.stars_rounded,
                                          franchise.planSelected.toUpperCase(),
                                          const Color(0xFFF59E0B),
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, _) => IllustrativeState(
                  icon: Icons.error_outline_rounded,
                  title: 'Failed to load',
                  subtitle: 'Unable to fetch franchise list',
                  onRetry: () => ref.read(requestsProvider.notifier).fetchRequests(),
                  retryLabel: 'Try Again',
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailChip(IconData icon, String text, Color color) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: color),
          const SizedBox(width: 6),
          Flexible(
            child: Text(
              text,
              style: GoogleFonts.inter(
                fontSize: 12,
                color: color,
                fontWeight: FontWeight.w600,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  void _showEditDialog(
    BuildContext context,
    WidgetRef ref,
    int franchiseId,
    Map<String, dynamic> initialData,
    List<Zone> zones,
  ) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FranchiseFormSheet(
        initialData: initialData,
        zones: zones,
        isEdit: true,
        onSubmit: (data) async {
          // Just refresh the list after form submission
          if (context.mounted) {
            Navigator.pop(context);
            ref.read(requestsProvider.notifier).fetchRequests();
          }
        },
      ),
    );
  }
}
