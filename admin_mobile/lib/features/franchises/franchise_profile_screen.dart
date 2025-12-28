import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../requests/requests_provider.dart';
import '../payouts/payouts_provider.dart';
import '../common/zones_provider.dart';
import '../../widgets/premium_widgets.dart';
import '../../widgets/modern_header.dart';
import 'franchise_form_sheet.dart';

class FranchiseProfileScreen extends ConsumerWidget {
  final int franchiseId;
  final String franchiseName;

  const FranchiseProfileScreen({super.key, required this.franchiseId, required this.franchiseName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(requestsProvider);
    final zonesAsync = ref.watch(zonesProvider);
    final zones = zonesAsync.asData?.value ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Light CRM Body
      appBar: ModernDashboardHeader(
        title: 'Partner Profile',
        subtitle: franchiseName,
        leadingIcon: Icons.arrow_back_rounded,
        onLeadingPressed: () => Navigator.pop(context),
        trailingWidget: GestureDetector(
           onTap: () {
             // Handle Star/Favorite logic if needed
           },
           child: Container(
             width: 40, 
             height: 40,
             decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), shape: BoxShape.circle),
             child: const Icon(Icons.star_outline_rounded, color: Colors.white, size: 20),
           ),
        ),
      ),
      body: requestsAsync.when(
        data: (requests) {
          try {
            final franchise = requests.firstWhere((r) => r.id == franchiseId);
            
            return SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              physics: const BouncingScrollPhysics(),
              child: Column(
                children: [
                   // Profile Header (CRM Style)
                   Column(
                    children: [
                      CircleAvatar(
                        radius: 50,
                        backgroundColor: const Color(0xFFE2E8F0),
                        child: Text(
                          franchise.name[0].toUpperCase(),
                          style: GoogleFonts.outfit(fontSize: 40, fontWeight: FontWeight.bold, color: const Color(0xFF475569)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        franchise.name,
                        style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                      ),
                      const SizedBox(height: 4),
                      Text(
                        'Franchise Partner • ${franchise.city}',
                        style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B)),
                      ),
                      const SizedBox(height: 24),
                      
                      // Action Row (Quick Actions)
                      Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          _buildQuickAction(Icons.edit_outlined, () {
                            _showEditSheet(context, ref, franchise, zones);
                          }),
                          const SizedBox(width: 16),
                          _buildQuickAction(Icons.email_outlined, () {
                            // Email Action
                          }),
                          const SizedBox(width: 16),
                          _buildQuickAction(Icons.phone_outlined, () {
                            // Phone Action
                          }),
                          const SizedBox(width: 16),
                          _buildQuickAction(Icons.calendar_today_rounded, () {}),
                        ],
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 32),
                  
                  // Detailed Info Section
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: Colors.white,
                      borderRadius: BorderRadius.circular(30),
                      boxShadow: [BoxShadow(color: const Color(0xFF64748B).withOpacity(0.05), blurRadius: 20, offset: const Offset(0, 10))],
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Detailed Information', style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                         const SizedBox(height: 20),
                         _buildDetailRow('Email', franchise.email),
                         _buildDetailRow('Phone', franchise.phone),
                         _buildDetailRow('City', franchise.city),
                         _buildDetailRow('Plan', franchise.planSelected.toUpperCase()),
                         _buildDetailRow('Status', franchise.status.toUpperCase(), isStatus: true),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Financial / Banking Card (Yellow/Black Style)
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(24),
                    decoration: BoxDecoration(
                      color: const Color(0xFFFCD34D), // CRM Yellow
                      borderRadius: BorderRadius.circular(30),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Container(
                              padding: const EdgeInsets.all(12),
                              decoration: const BoxDecoration(color: Colors.black, shape: BoxShape.circle),
                              child: const Icon(Icons.account_balance_rounded, color: Colors.white, size: 24),
                            ),
                            const Icon(Icons.arrow_outward_rounded, color: Colors.black, size: 28),
                          ],
                        ),
                        const SizedBox(height: 24),
                        Text('Banking Details', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: Colors.black54)),
                        const SizedBox(height: 8),
                        Text(
                          franchise.bankAccountNumber ?? 'Not Provided',
                          style: GoogleFonts.robotoMono(fontSize: 20, fontWeight: FontWeight.bold, color: Colors.black, letterSpacing: -0.5),
                        ),
                        const SizedBox(height: 20),
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text('BANK', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black45)),
                                Text(franchise.bankName?.toUpperCase() ?? 'N/A', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black)),
                              ],
                            ),
                            Column(
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text('IFSC', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.bold, color: Colors.black45)),
                                Text(franchise.ifscCode?.toUpperCase() ?? 'N/A', style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: Colors.black)),
                              ],
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          } catch (e) {
            return const Center(child: Text('Profile Not Found'));
          }
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, st) => Center(child: Text('Error: $err')),
      ),
    );
  }

  void _showEditSheet(BuildContext context, WidgetRef ref, dynamic franchise, List<Zone> zones) {
     showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FranchiseFormSheet(
        initialData: {
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
        zones: zones,
        isEdit: true,
        onSubmit: (data) async {
          Navigator.pop(context);
          final success = await ref.read(requestsProvider.notifier).updateFranchise(franchise.id, data);
          if (context.mounted) {
            if (success) {
              ref.read(payoutsProvider.notifier).loadData();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Profile Updated Successfully')),
              );
            } else {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Failed to update profile')),
              );
            }
          }
        },
      ),
    );
  }

  Widget _buildQuickAction(IconData icon, VoidCallback onTap) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 50, height: 50,
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: const Color(0xFFE2E8F0)),
          boxShadow: [
             BoxShadow(color: const Color(0xFF64748B).withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4)),
          ],
        ),
        child: Icon(icon, color: const Color(0xFF64748B), size: 22),
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isStatus = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500)),
          isStatus 
            ? Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: const Color(0xFFDCFCE7), borderRadius: BorderRadius.circular(8)),
                child: Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12, color: const Color(0xFF166534))),
              )
            : Text(value, style: GoogleFonts.inter(color: const Color(0xFF334155), fontWeight: FontWeight.w600)),
        ],
      ),
    );
  }
}
