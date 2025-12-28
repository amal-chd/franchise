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
    const AdminShopTab(),
    const SupportTab(),
    const AdminChatTab(),
    const AdminProfileTab(),
    // Secondary screens (only accessible via sidebar)
    const RequestsTab(),
    const FranchisesTab(),
    const PayoutsTab(),
    const AdminLeaderboardScreen(),
    const CmsTab(),
    const CareersTab(),
    const TrainingTab(),
    const NewsletterTab(),
    const PricingTab(),
    const AdminOrdersTab(), // Index 14
    const ZoneReportsScreen(), // Index 15
  ];

  static const List<String> _titles = [
    'Dashboard',
    'Shop Management',
    'Customer Support',
    'Live Chat',
    'Administrator',
    'Partner Requests',
    'Franchises',
    'Payouts',
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
      title = 'Welcome, Admin';
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
          ? null // Profile tab might have its own fancy header
          : ModernDashboardHeader(
              title: title,
              subtitle: subtitle,
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
          PremiumNavItem(icon: Icons.shopping_bag_rounded, label: 'Shop'),
          PremiumNavItem(icon: Icons.support_agent_rounded, label: 'Support'),
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
      backgroundColor: Colors.white,
      child: Column(
        children: [
          Expanded(
            child: ListView(
              padding: const EdgeInsets.only(top: 60),
              children: [
                _buildDrawerItem(0, 'Home', Icons.home_rounded),
                _buildDrawerItem(14, 'Merchandise Orders', Icons.receipt_long_rounded,
                  badgeCount: ref.watch(adminOrdersProvider).value?.orders.where((o) => o.status == 'pending').length),
                _buildDrawerItem(5, 'Partner Requests', Icons.person_add_rounded, 
                  badgeCount: ref.watch(requestsProvider).value?.where((e) => e.status == 'pending').length),
                _buildDrawerItem(6, 'Franchises', Icons.business_rounded),
                _buildDrawerItem(1, 'Shop Management', Icons.shopping_bag_rounded),
                _buildDrawerItem(7, 'Payouts', Icons.payments_rounded,
                  badgeCount: ref.watch(payoutsProvider).value?.payouts.length),
                _buildDrawerItem(8, 'Zone Leaderboard', Icons.leaderboard_rounded),
                _buildDrawerItem(15, 'Zone Reports', Icons.pie_chart_rounded),
                _buildDrawerItem(9, 'CMS', Icons.article_rounded),
                _buildDrawerItem(2, 'Support Tickets', Icons.support_agent_rounded,
                  badgeCount: ref.watch(supportProvider).value?.where((e) => e.status == 'Pending').length),
                _buildDrawerItem(3, 'Admin Chat', Icons.chat_rounded,
                  badgeCount: ref.watch(chatNotificationProvider).unreadCount > 0 ? ref.watch(chatNotificationProvider).unreadCount : null),
                _buildDrawerItem(10, 'Careers', Icons.work_rounded),
                _buildDrawerItem(11, 'Training', Icons.school_rounded),
                _buildDrawerItem(12, 'Newsletter', Icons.email_rounded),
                _buildDrawerItem(13, 'Pricing', Icons.sell_rounded),
              ],
          ),
        ),
        const SizedBox(height: 20),
      ],
    ),
  );
}


  Widget _drawerSection(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 12, bottom: 12),
      child: Text(title, style: GoogleFonts.inter(color: Colors.white24, fontSize: 10, fontWeight: FontWeight.w800, letterSpacing: 1.5)),
    );
  }

  Widget _buildDrawerItem(int index, String title, IconData icon, {int? badgeCount}) {
    final isSelected = _selectedIndex == index;
    return ListTile(
      selected: isSelected,
      leading: Stack(
        clipBehavior: Clip.none,
        children: [
          Icon(icon, color: isSelected ? const Color(0xFF2563EB) : Colors.grey[600]),
          if (badgeCount != null && badgeCount > 0)
            Positioned(
              top: -6,
              right: -6,
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 5, vertical: 1),
                decoration: BoxDecoration(color: const Color(0xFFEF4444), borderRadius: BorderRadius.circular(10)),
                child: Text(badgeCount.toString(), style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.bold)),
              ),
            ),
        ],
      ),
      title: Text(
        title,
        style: TextStyle(
          color: isSelected ? const Color(0xFF2563EB) : Colors.black87,
          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      onTap: () {
        Navigator.pop(context);
        _onItemTapped(index);
      },
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
