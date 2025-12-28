import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../auth/auth_provider.dart';
import '../dashboard/franchise_provider.dart';
import '../../widgets/premium_widgets.dart';
import '../pricing/plan_upgrade_screen.dart';
import 'profile_provider.dart';
import 'personal_info_screen.dart';
import 'banking_details_screen.dart';
import 'security_settings_screen.dart';

import '../../widgets/modern_header.dart'; // Add import

class FranchiseProfileTab extends ConsumerStatefulWidget {
  const FranchiseProfileTab({super.key});

  @override
  ConsumerState<FranchiseProfileTab> createState() => _FranchiseProfileTabState();
}

class _FranchiseProfileTabState extends ConsumerState<FranchiseProfileTab> {
  @override
  void initState() {
    super.initState();
    // Refresh profile on entry
    Future.microtask(() => ref.read(profileProvider.notifier).refresh());
  }

  @override
  Widget build(BuildContext context) {
    final franchiseAsync = ref.watch(franchiseProvider);
    final profileAsync = ref.watch(profileProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: ModernDashboardHeader(
        title: 'My Profile',
        leadingWidget: Padding(
          padding: const EdgeInsets.only(left: 8.0),
          child: Hero(
            tag: 'app_logo', 
            child: Material(
              color: Colors.transparent,
              child: Image.asset(
                'assets/images/logo_text.png', 
                height: 24,
                color: Colors.white,
                errorBuilder: (context, error, stackTrace) => const Icon(Icons.person, color: Colors.white),
              ),
            ),
          ),
        ),
        isHome: false,
        showLeading: false, 
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(profileProvider.notifier).refresh(),
        color: const Color(0xFF2563EB),
        child: SingleChildScrollView(
          physics: const AlwaysScrollableScrollPhysics(parent: BouncingScrollPhysics()),
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              // Profile Header
              profileAsync.when(
                data: (profile) => _buildProfileHeader(profile),
                loading: () => const PremiumSkeleton(width: double.infinity, height: 120),
                error: (_, __) => _buildProfileHeader(null),
              ),
              const SizedBox(height: 32),
              
              // Stats Summary (Quick View)
              franchiseAsync.when(
                data: (state) => _buildQuickStats(state),
                loading: () => const PremiumSkeleton(width: double.infinity, height: 100),
                error: (_, __) => const SizedBox(),
              ),
              
              const SizedBox(height: 32),
              
              // Settings Groups
              _buildSectionTitle('ACCOUNT DETAILS'),
              const SizedBox(height: 16),
              _buildSettingsItem(
                icon: Icons.person_outline_rounded,
                title: 'Personal Information',
                subtitle: 'Name, Email, Mobile, City',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PersonalInfoScreen())),
              ),
              _buildSettingsItem(
                icon: Icons.stars_rounded,
                title: 'Manage Plan',
                subtitle: 'View and upgrade your partnership',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PlanUpgradeScreen())),
              ),
              _buildSettingsItem(
                icon: Icons.account_balance_rounded,
                title: 'Banking & Payouts',
                subtitle: 'Transfer methods and bank details',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const BankingDetailsScreen())),
              ),
              
              const SizedBox(height: 32),
              _buildSectionTitle('PREFERENCES & SECURITY'),
              const SizedBox(height: 16),
              _buildSettingsItem(
                icon: Icons.security_rounded,
                title: 'Security',
                subtitle: 'Change password and access',
                onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SecuritySettingsScreen())),
              ),
              _buildSettingsItem(
                icon: Icons.notifications_none_rounded,
                title: 'Notifications',
                subtitle: 'Manage system alerts and updates',
                onTap: () {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Notification settings coming soon')));
                },
              ),
              
              const SizedBox(height: 48),
              
              // Logout Button
              SizedBox(
                width: double.infinity,
                child: ElevatedButton.icon(
                  onPressed: () => _handleLogout(context),
                  icon: const Icon(Icons.logout_rounded, size: 18),
                  label: const Text('Logout Session'),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFEF4444),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 18),
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                    elevation: 0,
                  ),
                ),
              ),
              const SizedBox(height: 24),
              Text(
                'Professional Edition 2.1.5',
                style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w800, color: const Color(0xFFCBD5E1), letterSpacing: 1),
              ),
              const SizedBox(height: 20),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileHeader(FranchiseProfile? profile) {
    return Column(
      children: [
        Container(
          padding: const EdgeInsets.all(4),
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            border: Border.all(color: const Color(0xFF2563EB).withOpacity(0.1), width: 4),
          ),
          child: CircleAvatar(
            radius: 50,
            backgroundColor: const Color(0xFF0F172A),
            child: Text(
              (profile?.name ?? "P").substring(0, 1).toUpperCase(),
              style: GoogleFonts.outfit(fontSize: 40, fontWeight: FontWeight.bold, color: Colors.white),
            ),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          profile?.name ?? 'Partner',
          style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        const SizedBox(height: 4),
        Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
          decoration: BoxDecoration(
            color: const Color(0xFF2563EB).withOpacity(0.08),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Text(
            'Partner ID: #${profile?.id ?? "???"}',
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w800, color: const Color(0xFF2563EB), letterSpacing: 0.5),
          ),
        ),
      ],
    );
  }

  Widget _buildQuickStats(FranchiseState state) {
    return Row(
      children: [
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFF1F5F9)),
            ),
            child: Column(
              children: [
                Text('TOTAL EARNINGS', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFF94A3B8), letterSpacing: 0.5)),
                const SizedBox(height: 8),
                Text('₹${state.stats.totalRevenue.toInt()}', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
              ],
            ),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              border: Border.all(color: const Color(0xFFF1F5F9)),
            ),
            child: Column(
              children: [
                Text('DELIVERED', style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: const Color(0xFF94A3B8), letterSpacing: 0.5)),
                const SizedBox(height: 8),
                Text('${state.stats.deliveredOrders}', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Align(
      alignment: Alignment.centerLeft,
      child: Text(
        title,
        style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: const Color(0xFF94A3B8), letterSpacing: 1.5),
      ),
    );
  }

  Widget _buildSettingsItem({
    required IconData icon,
    required String title,
    required String subtitle,
    required VoidCallback onTap,
  }) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: ListTile(
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        leading: Container(
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(
            color: const Color(0xFFF1F5F9),
            borderRadius: BorderRadius.circular(14),
          ),
          child: Icon(icon, color: const Color(0xFF2563EB), size: 20),
        ),
        title: Text(title, style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.w700, color: const Color(0xFF1E293B))),
        subtitle: Padding(
          padding: const EdgeInsets.only(top: 2),
          child: Text(subtitle, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B), fontWeight: FontWeight.w500)),
        ),
        trailing: const Icon(Icons.arrow_forward_ios_rounded, size: 14, color: Color(0xFFCBD5E1)),
      ),
    );
  }

  void _handleLogout(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('End Session?', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to logout from this device?', style: GoogleFonts.inter(color: const Color(0xFF64748B))),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context), 
            child: Text('Cancel', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.w600))
          ),
          Container(
            margin: const EdgeInsets.only(right: 8),
            child: ElevatedButton(
              onPressed: () {
                Navigator.pop(context);
                ref.read(authProvider.notifier).logout();
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFFEF4444),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                elevation: 0,
              ),
              child: Text('Logout', style: GoogleFonts.inter(color: Colors.white, fontWeight: FontWeight.bold)),
            ),
          ),
        ],
      ),
    );
  }
}
