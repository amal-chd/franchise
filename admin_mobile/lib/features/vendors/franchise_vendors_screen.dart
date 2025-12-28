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
        title: 'Vendor Network',
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
            Hero(
              tag: 'app_logo', 
              child: Material(
                color: Colors.transparent,
                child: Image.asset(
                  'assets/images/logo_text.png', 
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
            itemCount: state.vendors.length,
            itemBuilder: (context, index) {
              final vendor = state.vendors[index];
              final isActive = (vendor['status'] == 1 || vendor['active'] == 1);
              
              return Padding(
                padding: const EdgeInsets.only(bottom: 16),
                child: PremiumGlassCard(
                  padding: 12,
                  child: ListTile(
                    contentPadding: const EdgeInsets.symmetric(horizontal: 12),
                    leading: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(14),
                        image: vendor['logo'] != null 
                            ? DecorationImage(
                                image: NetworkImage('http://192.168.31.247:3000/storage/app/public/store/${vendor['logo']}'),
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
                         color: isActive ? const Color(0xFF10B981).withOpacity(0.1) : const Color(0xFFEF4444).withOpacity(0.1),
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
}

