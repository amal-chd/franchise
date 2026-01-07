import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../dashboard/franchise_provider.dart';
import '../../widgets/premium_widgets.dart';

import '../../widgets/modern_header.dart'; // Add import

class FranchiseVendorsScreen extends ConsumerWidget {
  const FranchiseVendorsScreen({super.key});

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
                tag: 'franchise_app_logo_vendors', 
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
          final total = state.vendors.length;
          final active = state.vendors.where((v) => (v['status'] == 1 || v['active'] == 1)).length;

          if (state.vendors.isEmpty) {
            return const IllustrativeState(
              icon: Icons.storefront_rounded,
              title: 'No Local Vendors',
              subtitle: 'There are currently no active vendors registered in your service zone.',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(24),
            physics: const BouncingScrollPhysics(),
            itemCount: state.vendors.length + 1, // +1 for Stats
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
                         _buildStatItem('Total Vendors', '$total ($active Active)', Colors.blue),
                       ],
                     ),
                   ),
                 );
              }

              final vendor = state.vendors[index - 1];
              final isActive = (vendor['status'] == 1 || vendor['active'] == 1);
              
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: PremiumGlassCard(
                  padding: 12,
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                    onTap: () => _showVendorDetails(context, vendor),
                    leading: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(14),
                        image: vendor['logo'] != null 
                            ? DecorationImage(
                                image: NetworkImage('https://thekada.in/storage/app/public/store/${vendor['logo']}'),
                                fit: BoxFit.cover,
                              )
                            : null,
                      ),
                      child: vendor['logo'] == null ? const Icon(Icons.store_rounded, color: Color(0xFF94A3B8)) : null,
                    ),
                    title: Text(vendor['name'] ?? 'Unknown Store', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF0F172A))),
                    subtitle: Text(vendor['address'] ?? 'No Address Provided', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B)), maxLines: 1, overflow: TextOverflow.ellipsis),
                    trailing: Container(
                       padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                       decoration: BoxDecoration(
                         color: isActive ? const Color(0xFF10B981).withValues(alpha: 0.1) : const Color(0xFFEF4444).withValues(alpha: 0.1),
                         borderRadius: BorderRadius.circular(10),
                       ),
                       child: Text(
                         isActive ? 'ACTIVE' : 'INACTIVE',
                         style: GoogleFonts.inter(
                           color: isActive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                           fontSize: 9,
                           fontWeight: FontWeight.w900,
                           letterSpacing: 0.5,
                         )
                       ),
                    ),
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

  void _showVendorDetails(BuildContext context, Map<String, dynamic> vendor) {
    final isActive = (vendor['status'] == 1 || vendor['active'] == 1);
    
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
                    // Vendor Header
                    Center(
                      child: Column(
                        children: [
                          Container(
                            width: 80,
                            height: 80,
                            decoration: BoxDecoration(
                              color: const Color(0xFFF1F5F9),
                              borderRadius: BorderRadius.circular(20),
                              image: vendor['logo'] != null
                                  ? DecorationImage(
                                      image: NetworkImage('https://thekada.in/storage/app/public/store/${vendor['logo']}'),
                                      fit: BoxFit.cover,
                                    )
                                  : null,
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.1),
                                  blurRadius: 10,
                                  offset: const Offset(0, 4),
                                ),
                              ],
                            ),
                            child: vendor['logo'] == null 
                                ? const Icon(Icons.store_rounded, size: 40, color: Color(0xFF94A3B8))
                                : null,
                          ),
                          const SizedBox(height: 16),
                          Text(
                            vendor['name'] ?? 'Unknown Vendor',
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
                              color: isActive ? const Color(0xFF10B981).withValues(alpha: 0.1) : const Color(0xFFEF4444).withValues(alpha: 0.1),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Text(
                              isActive ? 'ACTIVE' : 'INACTIVE',
                              style: GoogleFonts.inter(
                                color: isActive ? const Color(0xFF10B981) : const Color(0xFFEF4444),
                                fontSize: 12,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 32),
                    
                    // Store Information
                    _buildSection('Store Information', [
                      _buildDetailRow(Icons.location_on_outlined, 'Address', vendor['address'] ?? 'Not provided'),
                      if (vendor['phone'] != null)
                        _buildDetailRow(Icons.phone_outlined, 'Phone', vendor['phone']),
                      if (vendor['email'] != null)
                        _buildDetailRow(Icons.email_outlined, 'Email', vendor['email']),
                    ]),
                    
                    const SizedBox(height: 24),
                    
                    // Additional Details
                    if (vendor['rating'] != null || vendor['minimum_order'] != null) ...[
                      _buildSection('Additional Details', [
                        if (vendor['rating'] != null)
                          _buildDetailRow(Icons.star_outline, 'Rating', '${vendor['rating']} ⭐'),
                        if (vendor['minimum_order'] != null)
                          _buildDetailRow(Icons.shopping_cart_outlined, 'Min Order', '₹${vendor['minimum_order']}'),
                      ]),
                    ],
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

