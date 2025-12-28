import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../requests/requests_provider.dart';
import '../payouts/payouts_provider.dart';
import '../common/zones_provider.dart';
import '../../widgets/premium_widgets.dart';
import 'franchise_form_sheet.dart';

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
    final zones = zonesAsync.asData?.value ?? [];
    
    return Container(
      color: const Color(0xFFF1F5F9), // Light background
      child: Column(
        children: [
          // Search Bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            color: Colors.white,
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search partners...',
                hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8)),
                prefixIcon: const Icon(Icons.search, color: Color(0xFF94A3B8)),
                filled: true,
                fillColor: const Color(0xFFF8FAFC),
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                  borderSide: BorderSide.none,
                ),
                contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
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
                  // Filter for Approved/Active franchises only
                  final activeFranchises = requests.where((r) => r.status == 'approved').toList();

                  // Apply search filter
                  final filteredFranchises = activeFranchises.where((f) {
                    final query = _searchQuery.toLowerCase();
                    return f.name.toLowerCase().contains(query) ||
                           f.email.toLowerCase().contains(query) ||
                           f.city.toLowerCase().contains(query);
                  }).toList();

                  if (filteredFranchises.isEmpty) {
                    return IllustrativeState(
                      icon: Icons.search_off_rounded,
                      title: 'No Partners Found',
                      subtitle: _searchQuery.isEmpty 
                        ? 'Your franchise network is currently empty. Approved partners will appear here.'
                        : 'No partners found matching "$_searchQuery".',
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(20),
                    itemCount: filteredFranchises.length,
                    itemBuilder: (context, index) {
                      final franchise = filteredFranchises[index];
                      // Highlight the first card for visual variety as per CRM style
                      final isFeatured = index == 0 && _searchQuery.isEmpty; 

                      return Container(
                        margin: const EdgeInsets.only(bottom: 20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(24),
                          border: Border.all(color: const Color(0xFFE2E8F0)),
                          boxShadow: [
                            BoxShadow(
                              color: const Color(0xFF64748B).withOpacity(0.05),
                              blurRadius: 15,
                              offset: const Offset(0, 4),
                            ),
                          ],
                        ),
                        child:Padding(
                          padding: const EdgeInsets.all(20),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                children: [
                                  Row(
                                    children: [
                                      CircleAvatar(
                                        radius: 20,
                                        backgroundColor: isFeatured ? const Color(0xFFFCD34D) : const Color(0xFFF1F5F9),
                                        child: Text(
                                          franchise.name[0].toUpperCase(),
                                          style: GoogleFonts.outfit(
                                            color: const Color(0xFF1E293B), 
                                            fontWeight: FontWeight.bold
                                          ),
                                        ),
                                      ),
                                      const SizedBox(width: 12),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            franchise.name,
                                            style: GoogleFonts.outfit(
                                              fontWeight: FontWeight.bold, 
                                              fontSize: 16, 
                                              color: const Color(0xFF1E293B)
                                            ),
                                          ),
                                          if (franchise.planSelected != 'free')
                                            Text(
                                              franchise.planSelected.toUpperCase(),
                                              style: GoogleFonts.inter(
                                                fontSize: 10, 
                                                fontWeight: FontWeight.w600, 
                                                color: const Color(0xFF64748B)
                                              ),
                                            ),
                                        ],
                                      ),
                                    ],
                                  ),
                                  Container(
                                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                    decoration: BoxDecoration(
                                      color: const Color(0xFFDCFCE7), // Light green
                                      borderRadius: BorderRadius.circular(20),
                                      border: Border.all(color: const Color(0xFF86EFAC)),
                                    ),
                                    child: Text(
                                      'ACTIVE', 
                                      style: GoogleFonts.inter(
                                        color: const Color(0xFF166534), 
                                        fontSize: 10, 
                                        fontWeight: FontWeight.w800
                                      ),
                                    ),
                                  ),
                                ],
                              ),
                              const SizedBox(height: 20),
                              
                              Row(
                                children: [
                                  Expanded(child: _buildCRMInfoItem(Icons.location_on_rounded, franchise.city)),
                                  const SizedBox(width: 12),
                                  Expanded(child: _buildCRMInfoItem(Icons.phone_rounded, franchise.phone)),
                                ],
                              ),

                              const SizedBox(height: 20),
                              
                              SizedBox(
                                width: double.infinity,
                                child: ElevatedButton(
                                  style: ElevatedButton.styleFrom(
                                    backgroundColor: const Color(0xFF1E293B), // Dark Slate
                                    foregroundColor: Colors.white,
                                    elevation: 0,
                                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                                    padding: const EdgeInsets.symmetric(vertical: 14),
                                  ),
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
                                    },
                                    zones
                                  ),
                                  child: Row(
                                    mainAxisAlignment: MainAxisAlignment.center,
                                    children: [
                                      const Icon(Icons.settings_rounded, size: 18),
                                      const SizedBox(width: 8),
                                      Text('Manage Partner', style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 14)),
                                    ],
                                  ),
                                ),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => Center(child: Text('Error: $err')),
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildCRMInfoItem(IconData icon, String text) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF94A3B8)),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              text, 
              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF475569), fontWeight: FontWeight.w500),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }

  void _showEditDialog(BuildContext context, WidgetRef ref, int franchiseId, Map<String, dynamic> currentData, List<Zone> zones) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FranchiseFormSheet(
        initialData: currentData,
        zones: zones,
        isEdit: true,
        onSubmit: (data) async {
          Navigator.pop(context);
          final success = await ref.read(requestsProvider.notifier).updateFranchise(franchiseId, data);
          if (context.mounted) {
            if (success) {
              ref.read(payoutsProvider.notifier).loadData();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Franchise Updated Successfully')),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Failed to update franchise')),
              );
            }
          }
        },
      ),
    );
  }
}
