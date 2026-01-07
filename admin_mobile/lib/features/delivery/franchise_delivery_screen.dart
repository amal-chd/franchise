import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../dashboard/franchise_provider.dart';
import '../../widgets/premium_widgets.dart';

import '../../widgets/modern_header.dart'; // Add import

class FranchiseDeliveryScreen extends ConsumerWidget {
  const FranchiseDeliveryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final franchiseState = ref.watch(franchiseProvider);

    return Scaffold(
      appBar: ModernDashboardHeader(
        title: '',
        leadingWidget: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.15), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.white),
              ),
              onPressed: () => Navigator.of(context).pop(),
            ),
            GestureDetector(
              onTap: () => Navigator.of(context).popUntil((route) => route.isFirst),
              child: Hero(
                tag: 'franchise_app_logo_delivery', 
                child: Image.asset(
                  'assets/images/header_logo_new.png', 
                  height: 24,
                  color: Colors.white,
                  errorBuilder: (context, error, stackTrace) => const SizedBox(),
                ),
              ),
            ),
          ],
        ),
        showLeading: true,
        isHome: false,
      ),
      body: franchiseState.when(
        data: (state) {
          final total = state.deliveryMen.length;
          final active = state.deliveryMen.where((d) => (d['status'] == 1 && d['active'] == 1)).length;

          if (state.deliveryMen.isEmpty) {
            return const IllustrativeState(
              icon: Icons.local_shipping_rounded,
              title: 'No Delivery Fleet',
              subtitle: 'You currently have no delivery personnel assigned to your zone.',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: state.deliveryMen.length + 1, // +1 for Stats
            itemBuilder: (context, index) {
              if (index == 0) {
                 return Padding(
                   padding: const EdgeInsets.only(bottom: 20),
                   child: Container(
                     padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                     decoration: BoxDecoration(
                       color: Colors.white,
                       borderRadius: BorderRadius.circular(12),
                       boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
                     ),
                     child: Row(
                       mainAxisAlignment: MainAxisAlignment.center,
                       children: [
                         _buildStatItem('Total Fleet', '$total ($active Active)', Colors.blue),
                       ],
                     ),
                   ),
                 );
              }

              final dm = state.deliveryMen[index - 1];
              final isActive = (dm['status'] == 1 && dm['active'] == 1);
              
              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  onTap: () => _showDeliveryDetails(context, dm),
                  leading: CircleAvatar(
                    backgroundImage: dm['image'] != null ? NetworkImage('https://thekada.in/storage/app/public/delivery-man/${dm['image']}') : null,
                    backgroundColor: Colors.grey[200],
                    child: dm['image'] == null ? const Icon(Icons.person, color: Colors.grey) : null,
                  ),
                  title: Text('${dm['f_name']} ${dm['l_name']}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                  subtitle: Text(dm['phone'] ?? 'No Phone', style: GoogleFonts.inter(fontSize: 12)),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                       Container(
                         padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                         decoration: BoxDecoration(
                           color: isActive ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                           borderRadius: BorderRadius.circular(8),
                         ),
                         child: Text(
                           isActive ? 'Active' : 'Inactive',
                           style: TextStyle(
                             color: isActive ? Colors.green : Colors.red,
                             fontSize: 10,
                             fontWeight: FontWeight.bold
                           )
                         ),
                      ),
                      const SizedBox(height: 4),
                       Text('${dm['current_orders']} Active Orders', style: const TextStyle(fontSize: 10, color: Colors.grey)),
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
    );
  }

  void _showDeliveryDetails(BuildContext context, Map<String, dynamic> dm) {
    final isActive = (dm['status'] == 1 && dm['active'] == 1);
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.75,
        decoration: const BoxDecoration(
          color: Color(0xFFF8FAFC),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            // Handle Bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2)
                ),
              ),
            ),
            
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Delivery Person Header
                    Center(
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 50,
                            backgroundImage: dm['image'] != null
                                ? NetworkImage('https://thekada.in/storage/app/public/delivery-man/${dm['image']}')
                                : null,
                            backgroundColor: const Color(0xFFF1F5F9),
                            child: dm['image'] == null
                                ? const Icon(Icons.person, size: 50, color: Color(0xFF94A3B8))
                                : null,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            '${dm['f_name'] ?? ''} ${dm['l_name'] ?? ''}'.trim(),
                            style: GoogleFonts.outfit(
                              fontSize: 24,
                              fontWeight: FontWeight.bold,
                              color: const Color(0xFF0F172A),
                            ),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 8),
                          Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                            decoration: BoxDecoration(
                              color: isActive ? Colors.green.withValues(alpha: 0.1) : Colors.red.withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              isActive ? 'ACTIVE' : 'INACTIVE',
                              style: GoogleFonts.inter(
                                color: isActive ? Colors.green : Colors.red,
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Contact Information
                    _buildSection('Contact Information', [
                      _buildDetailRow(Icons.phone_outlined, 'Phone', dm['phone'] ?? 'Not provided'),
                      if (dm['email'] != null)
                        _buildDetailRow(Icons.email_outlined, 'Email', dm['email']),
                    ]),
                    
                    const SizedBox(height: 24),
                    
                    // Work Details
                    _buildSection('Work Details', [
                      _buildDetailRow(Icons.delivery_dining_outlined, 'Current Orders', '${dm['current_orders'] ?? 0}'),
                      if (dm['vehicle_type'] != null)
                        _buildDetailRow(Icons.two_wheeler_outlined, 'Vehicle', dm['vehicle_type']),
                      if (dm['rating'] != null)
                        _buildDetailRow(Icons.star_outline, 'Rating', '${dm['rating']} ⭐'),
                    ]),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.outfit(
            fontWeight: FontWeight.bold,
            fontSize: 16,
            color: const Color(0xFF0F172A),
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [
              BoxShadow(
                color: Colors.grey.shade100,
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildDetailRow(IconData icon, String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: const Color(0xFFF1F5F9),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, size: 18, color: const Color(0xFF64748B)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF94A3B8),
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontWeight: FontWeight.w600,
                    color: const Color(0xFF334155),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatItem(String label, String value, Color color) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: color)),
        Text(label, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey[600])),
      ],
    );
  }
}

