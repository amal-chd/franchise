import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'home_provider.dart';
import '../requests/requests_provider.dart';
import '../shop/shop_provider.dart';
import '../payouts/payouts_provider.dart';
import '../auth/auth_provider.dart';
import '../../widgets/premium_widgets.dart';

class HomeTab extends ConsumerWidget {
  final Function(int)? onNavigate;
  const HomeTab({super.key, this.onNavigate});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Watch all data streams
    final analyticsAsync = ref.watch(analyticsProvider);
    final requestsAsync = ref.watch(requestsProvider);
    final ordersAsync = ref.watch(adminOrdersProvider);
    final payoutsAsync = ref.watch(payoutsProvider);

    // Calculate Aggregates
    int pendingRequests = 0;
    requestsAsync.whenData((d) => pendingRequests = d.where((r) => r.status == 'pending_verification' || r.status == 'under_review').length);

    int pendingOrders = 0;
    int totalOrders = 0;
    ordersAsync.whenData((d) {
      pendingOrders = d.orders.where((o) => o.status == 'pending').length;
      totalOrders = d.orders.length;
    });

    int pendingPayouts = 0;
    payoutsAsync.whenData((d) => pendingPayouts = d.payouts.length);

    int activeFranchises = 0;
    analyticsAsync.whenData((d) => activeFranchises = d['approved'] ?? 0);

    return Container(
      color: const Color(0xFFF8FAFC),
      child: RefreshIndicator(
        onRefresh: () async {
          ref.refresh(analyticsProvider.future);
          ref.read(requestsProvider.notifier).fetchRequests();
          ref.read(adminOrdersProvider.notifier).refresh();
          ref.refresh(payoutsProvider);
        },
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Modern Header
              _buildModernHeader(context, ref),
              const SizedBox(height: 32),

              // Premium Revenue Card
              _buildRevenueCard(analyticsAsync, activeFranchises, pendingPayouts, totalOrders),
              const SizedBox(height: 32),

              // Quick Actions
              const PremiumSectionHeader(title: 'Quick Actions'),
              const SizedBox(height: 16),
              _buildQuickActions(context),
              const SizedBox(height: 16),

              // Advanced Insights Section
              // Advanced Insights Section
              analyticsAsync.when(
                data: (data) {
                  final trends = data['trends'] ?? {};
                  
                  // Safe extraction of lists (API might return Map/Object instead of Array)
                  dynamic statusDistRaw = trends['statusDistribution'];
                  List statusDistList = [];
                  if (statusDistRaw is List) {
                    statusDistList = statusDistRaw;
                  } else if (statusDistRaw is Map) {
                    statusDistList = statusDistRaw.values.toList();
                  }

                  dynamic zonePerfRaw = trends['zonePerformance'];
                  List zonePerfList = [];
                  if (zonePerfRaw is List) {
                    zonePerfList = zonePerfRaw;
                  } else if (zonePerfRaw is Map) {
                    zonePerfList = zonePerfRaw.values.toList();
                  }

                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const SizedBox(height: 8),

                      Row(
                        children: [
                          Expanded(
                            child: DashboardChartContainer(
                              title: 'ORDER HEALTH',
                              height: 200,
                              chart: OrderHealthPie(data: statusDistList),
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: DashboardChartContainer(
                              title: 'TOP ZONES',
                              height: 200,
                              chart: ZonePerformanceBars(data: zonePerfList),
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 40),

                    ],
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, s) => const SizedBox(),
              ),
              
              // Overview Stats Grid
              const PremiumSectionHeader(title: 'Platform Overview'),
              const SizedBox(height: 16),
              _buildStatsGrid(pendingRequests, pendingOrders, activeFranchises, pendingPayouts),
              const SizedBox(height: 40),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildModernHeader(BuildContext context, WidgetRef ref) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              DateFormat('EEEE, d MMMM').format(DateTime.now()),
              style: GoogleFonts.inter(fontSize: 13, color: Colors.grey[500], fontWeight: FontWeight.w500),
            ),
            const SizedBox(height: 4),
            Text(
              'Hello, Admin 👋',
              style: GoogleFonts.outfit(fontSize: 28, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
            ),
          ],
        ),
        const SizedBox(),
      ],
    );
  }

  Widget _buildRevenueCard(AsyncValue<dynamic> analyticsAsync, int activeFranchises, int pendingPayouts, int totalOrders) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(28),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(32),
        boxShadow: [
          BoxShadow(color: const Color(0xFF0F172A).withOpacity(0.25), blurRadius: 25, offset: const Offset(0, 15)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(
                'TOTAL REVENUE',
                style: GoogleFonts.inter(color: Colors.white60, fontSize: 11, fontWeight: FontWeight.w700, letterSpacing: 1),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
                child: Row(
                  children: [
                    const Icon(Icons.auto_graph_rounded, color: Color(0xFF10B981), size: 14),
                    const SizedBox(width: 4),
                    Text('STABLE', style: GoogleFonts.inter(color: Colors.white70, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          analyticsAsync.when(
            data: (data) {
              final revenue = (data['totalRevenue'] ?? 0).toDouble();
              return Text(
                '₹ ${NumberFormat('#,##,###').format(revenue)}',
                style: GoogleFonts.outfit(color: Colors.white, fontSize: 38, fontWeight: FontWeight.bold),
              );
            },
            loading: () => const SizedBox(height: 48, child: Center(child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))),
            error: (_, __) => Text('₹ 0', style: GoogleFonts.outfit(color: Colors.white, fontSize: 38, fontWeight: FontWeight.bold)),
          ),
          const SizedBox(height: 32),
          Row(
            children: [
              _buildRevenueSubStat('Franchises', activeFranchises.toString(), Icons.storefront),
              Container(width: 1, height: 30, color: Colors.white10, margin: const EdgeInsets.symmetric(horizontal: 16)),
              _buildRevenueSubStat('Orders', totalOrders.toString(), Icons.shopping_bag_rounded),
              Container(width: 1, height: 30, color: Colors.white10, margin: const EdgeInsets.symmetric(horizontal: 16)),
              _buildRevenueSubStat('Payouts', pendingPayouts.toString(), Icons.payments_outlined),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildRevenueSubStat(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: const Color(0xFF60A5FA), size: 14),
            const SizedBox(width: 6),
            Text(label, style: GoogleFonts.inter(color: Colors.white54, fontSize: 11)),
          ],
        ),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
    );
  }

  Widget _buildQuickActions(BuildContext context) {
    return SizedBox(
      height: 110,
      child: ListView(
        scrollDirection: Axis.horizontal,
        physics: const BouncingScrollPhysics(),
        children: [
          _quickActionItem(context, 'Merchandise', Icons.receipt_long_rounded, const Color(0xFFEC4899), 14),
          _quickActionItem(context, 'Partners', Icons.person_add_outlined, const Color(0xFF8B5CF6), 5),
          _quickActionItem(context, 'Payouts', Icons.payments_rounded, const Color(0xFF10B981), 7),
          _quickActionItem(context, 'Leaderboard', Icons.leaderboard_rounded, const Color(0xFF3B82F6), 8),
        ],
      ),
    );
  }

  Widget _quickActionItem(BuildContext context, String title, IconData icon, Color color, int index) {
    return Padding(
      padding: const EdgeInsets.only(right: 20),
      child: Column(
        children: [
          Container(
            width: 64,
            height: 64,
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(20),
              boxShadow: [
                BoxShadow(color: color.withOpacity(0.1), blurRadius: 15, offset: const Offset(0, 8)),
              ],
            ),
            child: Material(
              color: Colors.transparent,
              child: InkWell(
                onTap: () {
                  if (onNavigate != null) {
                    onNavigate!(index);
                  } else {
                    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Navigate to $title')));
                  }
                },
                borderRadius: BorderRadius.circular(20),
                child: Center(child: Icon(icon, color: color, size: 28)),
              ),
            ),
          ),
          const SizedBox(height: 12),
          Text(title, style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B))),
        ],
      ),
    );
  }

  Widget _buildStatsGrid(int pendingRequests, int pendingOrders, int activeFranchises, int pendingPayouts) {
    return GridView.count(
      crossAxisCount: 2,
      crossAxisSpacing: 20,
      mainAxisSpacing: 20,
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      childAspectRatio: 1.1,
      children: [
        _buildStatTile('Requests', pendingRequests.toString(), Icons.person_search_outlined, const Color(0xFFF59E0B), pendingRequests > 0),
        _buildStatTile('Orders', pendingOrders.toString(), Icons.shopping_cart_outlined, const Color(0xFF3B82F6), pendingOrders > 0),
        _buildStatTile('Partners', activeFranchises.toString(), Icons.groups_outlined, const Color(0xFF10B981), false),
        _buildStatTile('Payouts', pendingPayouts.toString(), Icons.currency_rupee_outlined, const Color(0xFFEF4444), pendingPayouts > 0),
      ],
    );
  }

  Widget _buildStatTile(String title, String value, IconData icon, Color color, bool isAlert) {
    return PremiumGlassCard(
      padding: 20,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(16)),
                child: Icon(icon, color: color, size: 20),
              ),
              if (isAlert)
                Container(
                  width: 8,
                  height: 8,
                  decoration: const BoxDecoration(color: Color(0xFFEF4444), shape: BoxShape.circle),
                ),
            ],
          ),
          const SizedBox(height: 16),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: GoogleFonts.outfit(fontSize: 26, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
              Text(title.toUpperCase(), style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w800, letterSpacing: 1)),
            ],
          )
        ],
      ),
    );
  }

  void _showProfileDialog(BuildContext context, WidgetRef ref) {
    final nameController = TextEditingController();
    final phoneController = TextEditingController();
    final emailController = TextEditingController(text: 'thekadaapp@gmail.com');
    final passwordController = TextEditingController();
    
    showGeneralDialog(
      context: context,
      barrierDismissible: true,
      barrierLabel: '',
      transitionDuration: const Duration(milliseconds: 300),
      pageBuilder: (context, anim1, anim2) => Center(
        child: Material(
          color: Colors.transparent,
          child: Container(
            width: MediaQuery.of(context).size.width * 0.85,
            padding: const EdgeInsets.all(32),
            decoration: BoxDecoration(
              color: Colors.white,
              borderRadius: BorderRadius.circular(32),
              boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 30)],
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text('Admin Profile', style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
                const SizedBox(height: 24),
                _dialogField(nameController, 'Full Name', Icons.person_outline),
                const SizedBox(height: 16),
                _dialogField(emailController, 'Email', Icons.email_outlined, enabled: false),
                const SizedBox(height: 16),
                _dialogField(phoneController, 'Phone', Icons.phone_outlined),
                const SizedBox(height: 16),
                _dialogField(passwordController, 'New Password', Icons.lock_outline, obscure: true),
                const SizedBox(height: 32),
                Row(
                  mainAxisAlignment: MainAxisAlignment.end,
                  children: [
                    TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
                    const SizedBox(width: 12),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: const Color(0xFF0F172A),
                        foregroundColor: Colors.white,
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                      ),
                      onPressed: () async {
                        Navigator.pop(context);
                        // Profile update logic...
                      },
                      child: const Text('Save Changes'),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
      transitionBuilder: (context, anim1, anim2, child) => ScaleTransition(scale: anim1, child: FadeTransition(opacity: anim1, child: child)),
    );
  }

  Widget _dialogField(TextEditingController ctrl, String label, IconData icon, {bool enabled = true, bool obscure = false}) {
    return TextField(
      controller: ctrl,
      enabled: enabled,
      obscureText: obscure,
      style: GoogleFonts.inter(fontSize: 15),
      decoration: InputDecoration(
        labelText: label,
        prefixIcon: Icon(icon, size: 20),
        filled: !enabled,
        fillColor: Colors.grey[100],
        border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
        enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey[200]!)),
      ),
    );
  }
}
