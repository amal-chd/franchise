import "../../widgets/modern_header.dart";
import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/chat_notification_service.dart';
import '../auth/auth_provider.dart';
import '../home/home_tab.dart';
import '../orders/admin_orders_tab.dart';
import '../requests/requests_tab.dart';
import '../franchises/franchises_tab.dart';
import '../payouts/payouts_tab.dart';
import '../cms/cms_tab.dart';
import '../support/support_tab.dart';
import '../careers/careers_tab.dart';
import '../training/training_tab.dart';
import '../newsletter/newsletter_tab.dart';
import '../pricing/pricing_tab.dart';
import '../shop/admin_shop_tab.dart';
import '../chat/admin_chat_tab.dart';
import '../shop/shop_provider.dart';
import '../training/training_provider.dart';
import 'admin_leaderboard_screen.dart';
import '../requests/requests_provider.dart';
import '../support/support_provider.dart';
import '../payouts/payouts_provider.dart';
import '../notifications/notification_screen.dart';
import '../notifications/notification_provider.dart';
import '../profile/admin_profile_tab.dart';
import '../../widgets/premium_widgets.dart';
import '../reports/zone_reports_screen.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _selectedIndex = 0;

  List<Widget> get _widgetOptions => [
    HomeTab(onNavigate: _onItemTapped),
    const PayoutsTab(),
    const ZoneReportsScreen(),
    const AdminChatTab(),
    const AdminProfileTab(),
    // Secondary screens (only accessible via sidebar)
    const RequestsTab(),
    const FranchisesTab(),
    const AdminShopTab(), // Moved from navbar to sidebar/quick actions
    const AdminLeaderboardScreen(),
    const CmsTab(),
    const CareersTab(),
    const TrainingTab(),
    const NewsletterTab(),
    const PricingTab(),
    const AdminOrdersTab(), // Index 14
    const SupportTab(), // Index 15
  ];

  static const List<String> _titles = [
    'Dashboard',
    'Payouts',
    'Customer Support',
    'Live Chat',
    'Administrator',
    'Partner Requests',
    'Franchises',
    'Shop Management', // Moved from navbar
    'Leaderboard',
    'CMS',
    'Careers',
    'Training',
    'Newsletter',
    'Pricing',
    'Merchandise Orders',
    'Zone Reports',
  ];

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;
    setState(() {
      _selectedIndex = index;
    });
    HapticFeedback.lightImpact();
  }

  @override
  void initState() {
    super.initState();
    // Prefetch data for smoother navigation
    Future.microtask(() {
      ref.read(adminProductsProvider.future);
      ref.read(adminOrdersProvider.future);
      ref.read(trainingProvider.future);
      
      // Prefetch Payouts (Current Month/Year)
      final now = DateTime.now();
      ref.read(payoutsProvider.notifier).fetchHistory(now.month, now.year);
    });
  }

  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

 // Import this

  @override
  Widget build(BuildContext context) {
    // Get unread notification count
    final notificationCount = ref.watch(notificationProvider.notifier).unreadCount;
    
    // Determine title and subtitle
    String title = _titles[_selectedIndex];
    String? subtitle;
    
    if (_selectedIndex == 0) {
      title = 'Welcome, Admin 👋';
      subtitle = 'Overview of your business';
    } else if (_selectedIndex == 4) {
      // Profile tab handled its own header in the original code, but we can unify or hide
      // If ProfileTab has its own scaffold/appbar, we might want null here, or keep consistent.
      // The original code hid the appbar for index 4.
    }

    return Scaffold(
      key: _scaffoldKey,
      backgroundColor: const Color(0xFFF8FAFC),
      extendBodyBehindAppBar: _selectedIndex == 4, // Allow profile to go behind if needed
      appBar: (_selectedIndex == 4) 
          ? null 
          : ModernDashboardHeader(
              title: '',
              subtitle: null,
              titleWidget: GestureDetector(
                onTap: () {
                    // Navigate to dashboard home or scroll to top
                    if (_selectedIndex != 0) _onItemTapped(0);
                },
                child: Hero(
                  tag: 'admin_app_logo',
                  child: Image.asset(
                    'assets/images/logo_text.png',
                    height: 24,
                    color: Colors.white,
                    errorBuilder: (context, error, stackTrace) => const SizedBox(),
                  ),
                ),
              ),
              isHome: _selectedIndex == 0,
              notificationCount: notificationCount,
              onMenuPressed: () => _scaffoldKey.currentState?.openDrawer(),
              onNotificationPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationScreen())),
            ),
      drawer: _buildDrawer(context),
      body: IndexedStack(
        index: _selectedIndex,
        children: _widgetOptions,
      ),
      bottomNavigationBar: PremiumBottomNavBar(
        currentIndex: _selectedIndex < 5 ? _selectedIndex : 0,
        onTap: (index) {
          _onItemTapped(index);
        },
        items: [
          PremiumNavItem(icon: Icons.home_rounded, label: 'Home'),
          PremiumNavItem(icon: Icons.payments_rounded, label: 'Payouts'),
          PremiumNavItem(icon: Icons.pie_chart_rounded, label: 'Reports'),
          PremiumNavItem(icon: Icons.chat_bubble_rounded, label: 'Chat'),
          PremiumNavItem(icon: Icons.person_rounded, label: 'Profile'),
        ],
      ),
    );
  }

  Widget _buildNotificationAction() {
    return Consumer(
      builder: (context, ref, child) {
        final unreadCount = ref.watch(notificationProvider.notifier).unreadCount;
        return Stack(
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFF0F172A).withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.notifications_outlined, size: 20),
              ),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationScreen())),
            ),
            if (unreadCount > 0)
              Positioned(
                right: 8,
                top: 14,
                child: Container(
                  width: 10,
                  height: 10,
                  decoration: BoxDecoration(color: const Color(0xFFEF4444), shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildDrawer(BuildContext context) {
    return Drawer(
      elevation: 0,
      backgroundColor: Colors.white,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.horizontal(right: Radius.circular(0))), // Full height
      child: Column(
        children: [
          // Modern Header
          Container(
            padding: const EdgeInsets.fromLTRB(24, 64, 24, 24),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(10),
                  decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                  child: Image.asset('assets/images/logo_text.png', height: 20, color: Colors.white, errorBuilder: (_,__,___) => const Icon(Icons.admin_panel_settings_rounded, color: Colors.white,),),
                ),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Admin Panel', style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                    Text('Management', style: GoogleFonts.inter(color: Colors.white70, fontSize: 12)),
                  ],
                ),
              ],
            ),
          ),
          
          Expanded(
            child: ListView(
              padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
              children: [
                _buildSectionHeader('CORE MANAGEMENT'),
                _buildDrawerItem(6, 'Franchises', Icons.business_rounded), // Unique
                _buildDrawerItem(9, 'CMS', Icons.article_rounded), // Unique
                _buildDrawerItem(15, 'Support Tickets', Icons.support_agent_rounded, isAlert: true,
                  badgeCount: ref.watch(supportProvider).value?.where((e) => e.status == 'Pending').length),

                const SizedBox(height: 24),
                _buildSectionHeader('GROWTH & TOOLS'),
                _buildDrawerItem(10, 'Careers', Icons.work_rounded),
                _buildDrawerItem(11, 'Training', Icons.school_rounded),
                _buildDrawerItem(13, 'Pricing Models', Icons.sell_rounded), // "Pricing" -> "Pricing Models"
                _buildDrawerItem(12, 'Email Marketing', Icons.email_rounded), // "Newsletter" -> "Email Marketing"
              ],
            ),
          ),
          _buildLogoutFooter(),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 12, bottom: 8, top: 4),
      child: Text(title, style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.2)),
    );
  }

  Widget _buildDrawerItem(int index, String title, IconData icon, {int? badgeCount, bool isAlert = false}) {
    final isSelected = _selectedIndex == index;
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(12),
        color: isSelected ? const Color(0xFFEFF6FF) : Colors.transparent,
      ),
      child: ListTile(
        onTap: () {
          Navigator.pop(context);
          _onItemTapped(index);
        },
        dense: true,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
        leading: Icon(icon, color: isSelected ? const Color(0xFF2563EB) : const Color(0xFF64748B), size: 22),
        title: Text(
          title, 
          style: GoogleFonts.outfit(
            color: isSelected ? const Color(0xFF1E293B) : const Color(0xFF475569), 
            fontWeight: isSelected ? FontWeight.w600 : FontWeight.w500,
            fontSize: 14
          )
        ),
        trailing: (badgeCount != null && badgeCount > 0)
          ? Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: isAlert ? const Color(0xFFEF4444) : const Color(0xFF2563EB),
                borderRadius: BorderRadius.circular(20)
              ),
              child: Text('$badgeCount', style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold)),
            )
          : null,
      ),
    );
  }

  Widget _buildLogoutFooter() {
    return Container(
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: Colors.white.withOpacity(0.02),
        border: Border(top: BorderSide(color: Colors.white.withOpacity(0.05))),
      ),
      child: InkWell(
        onTap: () => ref.read(authProvider.notifier).logout(),
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 8),
          child: Row(
            children: [
              const Icon(Icons.power_settings_new_rounded, color: Color(0xFFEF4444), size: 20),
              const SizedBox(width: 12),
              Text('Terminate Session', style: GoogleFonts.inter(color: const Color(0xFFEF4444), fontWeight: FontWeight.bold, fontSize: 14)),
            ],
          ),
        ),
      ),
    );
  }
}
