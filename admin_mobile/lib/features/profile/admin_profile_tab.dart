import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../auth/auth_provider.dart';
import 'profile_provider.dart';
import 'personal_info_screen.dart';
import 'security_settings_screen.dart';
import '../notifications/notification_screen.dart';
import '../activity_logs/activity_logs_screen.dart';
import '../../widgets/premium_widgets.dart';

class AdminProfileTab extends ConsumerWidget {
  const AdminProfileTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final profileAsync = ref.watch(profileProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: RefreshIndicator(
        onRefresh: () => ref.read(profileProvider.notifier).refresh(),
        child: SingleChildScrollView(
          physics: const BouncingScrollPhysics(),
          padding: const EdgeInsets.all(24),
          child: Column(
            children: [
              const SizedBox(height: 48), // Top padding for no AppBar
              // Profile Header
              profileAsync.when(
                data: (profile) => _buildProfileHeader(profile),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (_, __) => _buildProfileHeader(null),
              ),
              const SizedBox(height: 32),
            
            // Settings Groups
            _buildSectionTitle('ACCOUNT CONTROLS'),
            const SizedBox(height: 16),
            _buildSettingsItem(
              icon: Icons.person_outline_rounded,
              title: 'Personal Info',
              subtitle: 'Manage your administrative identity',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const PersonalInfoScreen())),
            ),
            _buildSettingsItem(
              icon: Icons.admin_panel_settings_rounded,
              title: 'System Access',
              subtitle: 'Manage administrative permissions',
              onTap: () => _showComingSoon(context, 'System Access Management'),
            ),
            _buildSettingsItem(
              icon: Icons.security_rounded,
              title: 'Security Settings',
              subtitle: 'Update password and auth methods',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const SecuritySettingsScreen())),
            ),
            _buildSettingsItem(
              icon: Icons.history_rounded,
              title: 'Activity Logs',
              subtitle: 'Review your recent system actions',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ActivityLogsScreen())),
            ),
            
            const SizedBox(height: 32),
            _buildSectionTitle('SYSTEM PREFERENCES'),
            const SizedBox(height: 16),
            _buildSettingsItem(
              icon: Icons.notifications_none_rounded,
              title: 'Alert Preferences',
              subtitle: 'Manage system notification triggers',
              onTap: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationScreen())),
            ),
            _buildSettingsItem(
              icon: Icons.language_rounded,
              title: 'Localization',
              subtitle: 'Regional settings and timezones',
              onTap: () => _showComingSoon(context, 'Localization Preferences'),
            ),
            
            const SizedBox(height: 48),
            
            // Logout Button
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: () => _handleLogout(context, ref),
                icon: const Icon(Icons.logout_rounded, size: 18),
                label: const Text('End Secure Session'),
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
              'Admin Core v3.0.1 (Stable)',
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
          child: const CircleAvatar(
            radius: 50,
            backgroundColor: Color(0xFF0F172A),
            child: Icon(Icons.person_rounded, size: 50, color: Colors.white),
          ),
        ),
        const SizedBox(height: 16),
        Text(
          profile?.name ?? 'Admin',
          style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
        Text(
          profile?.email ?? 'admin@thekada.in',
          style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
        ),
      ],
    );
  }

  void _showComingSoon(BuildContext context, String title) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('$title functionality is being finalized'),
        behavior: SnackBarBehavior.floating,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
        backgroundColor: const Color(0xFF0F172A),
      ),
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

  void _handleLogout(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Terminate Session?', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: Text('Are you sure you want to logout from the admin portal?', style: GoogleFonts.inter(color: const Color(0xFF64748B))),
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
