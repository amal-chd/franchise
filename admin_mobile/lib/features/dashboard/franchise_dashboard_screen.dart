import 'dart:ui';
import 'package:flutter/material.dart';
import '../../widgets/modern_header.dart'; // Correctly placed import
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../widgets/premium_widgets.dart';
import '../auth/auth_provider.dart';
import '../shop/shop_screen.dart';
import '../chat/chat_screen.dart';
import '../training/franchise_training_tab.dart';
import '../pricing/plan_upgrade_screen.dart';
import '../vendors/franchise_vendors_screen.dart';
import '../delivery/franchise_delivery_screen.dart';
import '../payouts/franchise_payouts_screen.dart';
import '../franchise_features/franchise_orders_screen.dart';
import '../franchise_features/franchise_leaderboard_screen.dart';
import '../profile/franchise_profile_tab.dart';
import 'franchise_provider.dart';
import '../notifications/notification_screen.dart';
import '../notifications/notification_provider.dart';
import '../community/community_tab.dart';

class FranchiseDashboardScreen extends ConsumerStatefulWidget {
  const FranchiseDashboardScreen({super.key});

  @override
  ConsumerState<FranchiseDashboardScreen> createState() => _FranchiseDashboardScreenState();
}

class _FranchiseDashboardScreenState extends ConsumerState<FranchiseDashboardScreen> {
  int _selectedIndex = 0;

  List<Widget> get _widgetOptions => [
    FranchiseHomeTab(onTabChanged: _onItemTapped),
    const ShopScreen(),
    const FranchiseTrainingTab(),
    const CommunityTab(),
    const FranchiseProfileTab(),
  ];

  void _onItemTapped(int index) {
    if (_selectedIndex == index) return;
    setState(() {
      _selectedIndex = index;
    });
    HapticFeedback.selectionClick();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: IndexedStack(
        index: _selectedIndex,
        children: _widgetOptions,
      ),
      bottomNavigationBar: PremiumBottomNavBar(
        currentIndex: _selectedIndex,
        onTap: _onItemTapped,
        items: [
          PremiumNavItem(icon: Icons.home_rounded, label: 'Home'),
          PremiumNavItem(icon: Icons.shopping_bag_rounded, label: 'Shop'),
          PremiumNavItem(icon: Icons.school_rounded, label: 'Training'),
          PremiumNavItem(icon: Icons.people_rounded, label: 'Community'),
          PremiumNavItem(icon: Icons.person_rounded, label: 'Profile'),
        ],
      ),
    );
  }
}


class FranchiseHomeTab extends ConsumerStatefulWidget {
  final Function(int)? onTabChanged;
  const FranchiseHomeTab({super.key, this.onTabChanged});

  @override
  ConsumerState<FranchiseHomeTab> createState() => _FranchiseHomeTabState();
}

class _FranchiseHomeTabState extends ConsumerState<FranchiseHomeTab> {
  String _franchiseName = 'Partner';

  @override
  void initState() {
    super.initState();
    _loadName();
  }

  Future<void> _loadName() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _franchiseName = prefs.getString('franchiseName') ?? 'Partner';
    });
  }

  @override
  Widget build(BuildContext context) {
    final franchiseAsync = ref.watch(franchiseProvider);
    final notificationCount = ref.watch(notificationProvider.notifier).unreadCount;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: ModernDashboardHeader(
        title: '',
        titleWidget: Hero(
          tag: 'app_logo', 
          child: Image.asset(
            'assets/images/logo_text.png', 
            height: 28,
            color: Colors.white, // Adapting for blue background
            errorBuilder: (context, error, stackTrace) => 
               const Text('FRANCHISE', style: TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 20)),
          ),
        ),
        isHome: true,
        showLeading: false,
        notificationCount: notificationCount,
        onNotificationPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationScreen())),
      ),
      body: RefreshIndicator(
        onRefresh: () => ref.read(franchiseProvider.notifier).refresh(),
        child: franchiseAsync.when(
          data: (state) => SingleChildScrollView(
            physics: const BouncingScrollPhysics(),
            padding: const EdgeInsets.fromLTRB(24, 24, 24, 100),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(),
                const SizedBox(height: 32),
                _buildPremiumRevenueCard(state),
                const SizedBox(height: 32),
                _buildSectionTitle('OPERATIONAL CONTROLS'),
                const SizedBox(height: 16),
                _buildActionGrid(context, franchiseAsync),
                const SizedBox(height: 32),
                _buildSectionTitle('RECENT TRANSACTIONS'),
                const SizedBox(height: 16),
                _buildRecentOrders(state),
              ],
            ),
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
        ),
      ),
    );
  }

  Widget _buildNotificationAction() {
    return Consumer(
      builder: (context, ref, child) {
        // Kept for reference but unused in ModernDashboardHeader which handles its own action
        final unreadCount = ref.watch(notificationProvider.notifier).unreadCount;
        return Stack(
          alignment: Alignment.center,
          children: [
            IconButton(
              icon: const Icon(Icons.notifications_none_rounded, color: Color(0xFF0F172A)),
              onPressed: () => Navigator.push(context, MaterialPageRoute(builder: (_) => const NotificationScreen())),
            ),
            if (unreadCount > 0)
              Positioned(
                right: 8,
                top: 14,
                child: Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(color: const Color(0xFFEF4444), shape: BoxShape.circle, border: Border.all(color: Colors.white, width: 2)),
                ),
              ),
          ],
        );
      },
    );
  }

  Widget _buildHeader() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'WELCOME BACK,',
          style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: const Color(0xFF64748B), letterSpacing: 1.5),
        ),
        const SizedBox(height: 4),
        Text(
          _franchiseName,
          style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),
      ],
    );
  }

  Widget _buildPremiumRevenueCard(FranchiseState state) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        color: const Color(0xFF0F172A),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.2), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text('NET REVENUE', style: GoogleFonts.inter(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1)),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: const Color(0xFF2563EB), borderRadius: BorderRadius.circular(8)),
                child: Text('LIVE', style: GoogleFonts.inter(color: Colors.white, fontSize: 10, fontWeight: FontWeight.w900)),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            '₹${state.stats.totalRevenue.toStringAsFixed(2)}',
            style: GoogleFonts.outfit(color: Colors.white, fontSize: 36, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              _buildMetric('Delivered', '${state.stats.deliveredOrders}', Icons.check_circle_rounded, Colors.green),
              const SizedBox(width: 32),
              _buildMetric('Payouts', '₹${state.stats.todaysPayout.toInt()}', Icons.account_balance_rounded, Colors.blue),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildMetric(String label, String value, IconData icon, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 6),
            Text(label.toUpperCase(), style: GoogleFonts.inter(color: Colors.white24, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w600)),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w800, color: const Color(0xFF94A3B8), letterSpacing: 1.5),
    );
  }

  Widget _buildActionGrid(BuildContext context, AsyncValue<FranchiseState> franchiseAsync) {
    return GridView.count(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      crossAxisCount: 3,
      mainAxisSpacing: 12,
      crossAxisSpacing: 12,
      children: [
        _buildCompactAction(context, Icons.receipt_long_rounded, 'Orders', const Color(0xFF6366F1), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FranchiseOrdersScreen())), count: franchiseAsync.value?.stats.deliveredOrders),
        _buildCompactAction(context, Icons.storefront_rounded, 'Vendors', const Color(0xFF10B981), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FranchiseVendorsScreen()))),
        _buildCompactAction(context, Icons.local_shipping_rounded, 'Fleet', const Color(0xFFF59E0B), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FranchiseDeliveryScreen()))),
        _buildCompactAction(context, Icons.payments_rounded, 'Payouts', const Color(0xFF8B5CF6), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const ImprovedPayoutsScreen()))),
        _buildCompactAction(context, Icons.troubleshoot_rounded, 'Insights', const Color(0xFFEC4899), () => Navigator.push(context, MaterialPageRoute(builder: (_) => const FranchiseLeaderboardScreen()))),
        _buildCompactAction(context, Icons.contact_support_rounded, 'Support', const Color(0xFF22D3EE), () => widget.onTabChanged?.call(3)),
      ],
    );
  }

  Widget _buildCompactAction(BuildContext context, IconData icon, String label, Color color, VoidCallback onTap, {int? count}) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(24),
      child: Container(
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                  child: Icon(icon, color: color, size: 22),
                ),
                if (count != null && count > 0)
                  Positioned(
                    top: -4,
                    right: -4,
                    child: Container(
                      padding: const EdgeInsets.all(4),
                      decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                      child: Text('$count', style: const TextStyle(color: Colors.white, fontSize: 8, fontWeight: FontWeight.w900)),
                    ),
                  ),
              ],
            ),
            const SizedBox(height: 8),
            Text(label, style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentOrders(FranchiseState state) {
    if (state.recentOrders.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 40),
          child: Column(
            children: [
              Icon(Icons.inbox_outlined, size: 40, color: Colors.grey[300]),
              const SizedBox(height: 12),
              Text('No pending activity', style: GoogleFonts.inter(color: Colors.grey[400], fontSize: 13)),
            ],
          ),
        ),
      );
    }
    return Column(
      children: state.recentOrders.take(5).map((order) => Container(
        margin: const EdgeInsets.only(bottom: 12),
        decoration: BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: const Color(0xFFF1F5F9)),
        ),
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
          leading: Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: const Color(0xFFF8FAFC), borderRadius: BorderRadius.circular(14)),
            child: const Icon(Icons.receipt_rounded, color: Color(0xFF64748B), size: 18),
          ),
          title: Text('ORDER #${order['id']}', style: GoogleFonts.robotoMono(fontSize: 13, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
          subtitle: Text(order['order_status'].toString().toUpperCase(), style: GoogleFonts.inter(fontSize: 10, fontWeight: FontWeight.w900, color: order['order_status'] == 'delivered' ? Colors.green : Colors.orange)),
          trailing: Text('₹${order['order_amount']}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF0F172A))),
        ),
      )).toList(),
    );
  }

  Widget _buildStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 12)),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
      ],
    );
  }

  Widget _buildActionCard(BuildContext context, IconData icon, String label, VoidCallback onTap, {int? count}) {
    return InkWell(
      onTap: onTap,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            padding: const EdgeInsets.symmetric(vertical: 16),
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(12),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 4)],
            ),
            child: Column(
              children: [
                Icon(icon, color: const Color(0xFF2563EB), size: 28),
                const SizedBox(height: 8),
                Text(label, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w500)),
              ],
            ),
          ),
          if (count != null && count > 0)
            Positioned(
              top: -8,
              right: -8,
              child: Container(
                padding: const EdgeInsets.all(6),
                decoration: const BoxDecoration(
                  color: Colors.orange,
                  shape: BoxShape.circle,
                  boxShadow: [BoxShadow(color: Colors.black12, blurRadius: 4)],
                ),
                constraints: const BoxConstraints(minWidth: 20, minHeight: 20),
                child: Text(
                  '$count',
                  style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
