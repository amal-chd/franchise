import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../franchise_features/franchise_features_provider.dart';
import '../../widgets/premium_widgets.dart';

class AdminLeaderboardScreen extends ConsumerStatefulWidget {
  const AdminLeaderboardScreen({super.key});

  @override
  ConsumerState<AdminLeaderboardScreen> createState() => _AdminLeaderboardScreenState();
}

class _AdminLeaderboardScreenState extends ConsumerState<AdminLeaderboardScreen> {
  String? _selectedMonth;

  @override
  Widget build(BuildContext context) {
    final leaderboardAsync = ref.watch(leaderboardProvider);

    return RefreshIndicator(
        onRefresh: () async {
          if (_selectedMonth != null) {
            await ref.read(leaderboardProvider.notifier).refreshWithMonth(_selectedMonth!);
          } else {
            ref.invalidate(leaderboardProvider);
          }
        },
        child: leaderboardAsync.when(
          data: (data) => SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            physics: const BouncingScrollPhysics(),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    PremiumSectionHeader(title: 'Overview'),
                    IconButton(
                      icon: Container(
                        padding: const EdgeInsets.all(8),
                        decoration: BoxDecoration(color: const Color(0xFF0F172A).withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
                        child: const Icon(Icons.calendar_month_rounded, size: 20, color: Color(0xFF0F172A)),
                      ),
                      onPressed: () => _showMonthPicker(context),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                _buildSummaryCard(data),
                const SizedBox(height: 32),
                PremiumSectionHeader(title: 'Zone Rankings'),
                const SizedBox(height: 16),
                if (data.leaderboard.isEmpty)
                  const IllustrativeState(
                    icon: Icons.leaderboard_rounded,
                    title: 'No Data Available',
                    subtitle: 'Operational rankings will appear here once data for the selected month is processed.',
                  )
                else
                  ...data.leaderboard.map((entry) => _buildRankItem(entry)),
                const SizedBox(height: 32),
              ],
            ),
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => IllustrativeState(
            icon: Icons.error_outline_rounded,
            title: 'Data Unavailable',
            subtitle: 'We encountered an error while fetching the leaderboard data. Please try again.',
            onRetry: () => ref.invalidate(leaderboardProvider),
          ),
        ),
      );
  }

  Widget _buildSummaryCard(LeaderboardData data) {
    return PremiumGlassCard(
      color: const Color(0xFF2563EB),
      padding: 24,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_formatMonth(data.month).toUpperCase(), style: GoogleFonts.inter(color: Colors.white60, fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 1.5)),
                  const SizedBox(height: 4),
                  Text('Zone Excellence', style: GoogleFonts.outfit(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                ],
              ),
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(16)),
                child: const Icon(Icons.stars_rounded, color: Color(0xFFFACC15), size: 30),
              ),
            ],
          ),
          const SizedBox(height: 24),
          Row(
            children: [
              _buildSummaryItem('Total Orders', '${data.totalOrders}', Icons.shopping_bag_rounded),
              const SizedBox(width: 40),
              _buildSummaryItem('Active Zones', '${data.activeZones}', Icons.location_on_rounded),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildSummaryItem(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.white54, size: 12),
            const SizedBox(width: 6),
            Text(label.toUpperCase(), style: GoogleFonts.inter(color: Colors.white54, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.outfit(color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildRankItem(LeaderboardEntry entry) {
    final isTop3 = entry.rank <= 3;
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: PremiumGlassCard(
        padding: 0,
        child: ListTile(
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
          leading: _buildRankBadge(entry.rank),
          title: Text(entry.zoneName, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF0F172A))),
          subtitle: Text(entry.franchiseName, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
          trailing: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            crossAxisAlignment: CrossAxisAlignment.end,
            children: [
              Text('${entry.totalOrders}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20, color: const Color(0xFF2563EB))),
              Text('ORDERS', style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w900, color: const Color(0xFF94A3B8))),
            ],
          ),
          onTap: () => _showZoneDetails(context, entry),
        ),
      ),
    );
  }

  Widget _buildRankBadge(int rank) {
    Color color;
    IconData icon;
    switch (rank) {
      case 1: color = Colors.amber; icon = Icons.emoji_events_rounded; break;
      case 2: color = Colors.blueGrey[300]!; icon = Icons.military_tech_rounded; break;
      case 3: color = Colors.brown[300]!; icon = Icons.workspace_premium_rounded; break;
      default: color = Colors.grey[100]!; icon = Icons.tag;
    }

    return Container(
      width: 44,
      height: 44,
      decoration: BoxDecoration(color: color.withOpacity(rank <= 3 ? 1 : 0.5), shape: BoxShape.circle),
      child: rank <= 3 
          ? Icon(icon, color: Colors.white, size: 24)
          : Center(child: Text('#$rank', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF64748B)))),
    );
  }

  String _formatMonth(String monthStr) {
    try {
      final date = DateTime.parse('$monthStr-01');
      return DateFormat('MMMM yyyy').format(date);
    } catch (e) {
      return monthStr;
    }
  }

  void _showMonthPicker(BuildContext context) async {
    final currentDate = DateTime.now();
    final months = List.generate(6, (index) {
      final month = DateTime(currentDate.year, currentDate.month - index, 1);
      return DateFormat('yyyy-MM').format(month);
    });

    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(24))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Historical Performance', style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ...months.map((month) => ListTile(
              title: Text(_formatMonth(month)),
              onTap: () {
                setState(() => _selectedMonth = month);
                ref.read(leaderboardProvider.notifier).refreshWithMonth(month);
                Navigator.pop(context);
              },
            )),
          ],
        ),
      ),
    );
  }

  void _showZoneDetails(BuildContext context, LeaderboardEntry entry) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      shape: const RoundedRectangleBorder(borderRadius: BorderRadius.vertical(top: Radius.circular(32))),
      builder: (context) => Container(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                _buildRankBadge(entry.rank),
                const SizedBox(width: 16),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(entry.zoneName, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold)),
                    Text('Partner: ${entry.franchiseName}', style: GoogleFonts.inter(color: Colors.grey)),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 32),
            _buildMetricGrid(entry),
            const SizedBox(height: 32),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: Colors.white, padding: const EdgeInsets.all(16), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16))),
                onPressed: () => Navigator.pop(context),
                child: const Text('Dismiss'),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildMetricGrid(LeaderboardEntry entry) {
    return GridView.count(
      shrinkWrap: true,
      crossAxisCount: 2,
      mainAxisSpacing: 16,
      crossAxisSpacing: 16,
      childAspectRatio: 2.2,
      physics: const NeverScrollableScrollPhysics(),
      children: [
        _buildMetricItem('Total Orders', '${entry.totalOrders}'),
        _buildMetricItem('Revenue', '₹${entry.totalRevenue.toStringAsFixed(0)}'),
        _buildMetricItem('Avg Order', '₹${entry.avgOrderValue.toStringAsFixed(0)}'),
        _buildMetricItem('Completed', '${entry.completedOrders}'),
      ],
    );
  }

  Widget _buildMetricItem(String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(16)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Text(label.toUpperCase(), style: GoogleFonts.inter(fontSize: 8, fontWeight: FontWeight.w900, color: const Color(0xFF64748B), letterSpacing: 0.5)),
          const SizedBox(height: 2),
          Text(value, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
        ],
      ),
    );
  }
}
