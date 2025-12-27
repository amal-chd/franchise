import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../franchise_features/franchise_features_provider.dart';
import '../../widgets/premium_widgets.dart';

class FranchiseLeaderboardScreen extends ConsumerStatefulWidget {
  const FranchiseLeaderboardScreen({super.key});

  @override
  ConsumerState<FranchiseLeaderboardScreen> createState() => _FranchiseLeaderboardScreenState();
}

class _FranchiseLeaderboardScreenState extends ConsumerState<FranchiseLeaderboardScreen> {
  String? _selectedMonth;

  @override
  Widget build(BuildContext context) {
    final leaderboardAsync = ref.watch(leaderboardProvider);

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: AppBar(
          title: Text('Zone Excellence', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A))),
          backgroundColor: Colors.white.withOpacity(0.8),
          elevation: 0,
          centerTitle: true,
          leadingWidth: 70,
          leading: Navigator.canPop(context) ? IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A).withOpacity(0.05),
                borderRadius: BorderRadius.circular(12),
              ),
              child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Color(0xFF0F172A)),
            ),
            onPressed: () => Navigator.of(context).maybePop(),
          ) : null,
          actions: [
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: const Color(0xFF0F172A).withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.calendar_month_rounded, size: 20, color: Color(0xFF0F172A)),
              ),
              onPressed: () => _showMonthPicker(context),
            ),
            const SizedBox(width: 8),
          ],
        ),
      ),
      backgroundColor: Colors.grey[50],
      body: RefreshIndicator(
        onRefresh: () async {
          if (_selectedMonth != null) {
            await ref.read(leaderboardProvider.notifier).refreshWithMonth(_selectedMonth!);
          } else {
            ref.invalidate(leaderboardProvider);
          }
        },
        child: leaderboardAsync.when(
          data: (data) => SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Stats Card
                // Summary Card
                PremiumGlassCard(
                  color: const Color(0xFF0F172A),
                  padding: 28,
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(_formatMonth(data.month).toUpperCase(), style: GoogleFonts.inter(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.5)),
                              const SizedBox(height: 8),
                              Text(
                                'Performance',
                                style: GoogleFonts.outfit(color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2563EB).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Icon(Icons.emoji_events_rounded, color: Color(0xFFFACC15), size: 32),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      Row(
                        children: [
                          _buildStatChip('Active Zones', '${data.activeZones}', Icons.location_on_rounded),
                          const SizedBox(width: 32),
                          _buildStatChip('Total Orders', '${data.totalOrders}', Icons.shopping_cart_rounded),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 32),
                PremiumSectionHeader(title: 'Top Performing Zones'),
                const SizedBox(height: 16),

                if (data.leaderboard.isEmpty)
                  const IllustrativeState(
                    icon: Icons.leaderboard_rounded,
                    title: 'No Data Yet',
                    subtitle: 'Performance rankings will be available once the month\'s operational data is finalized.',
                  )
                else
                  ...data.leaderboard.asMap().entries.map((entry) {
                    final index = entry.key;
                    final leaderEntry = entry.value;
                    final isTop3 = index < 3;
                    
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 12),
                      child: PremiumGlassCard(
                        padding: 0,
                        color: isTop3 ? null : Colors.white,
                        child: Container(
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(24),
                            gradient: isTop3
                                ? LinearGradient(
                                    colors: _getRankGradient(index),
                                    begin: Alignment.topLeft,
                                    end: Alignment.bottomRight,
                                  )
                                : null,
                          ),
                          child: ListTile(
                            contentPadding: const EdgeInsets.all(16),
                            leading: _buildRankBadge(leaderEntry.rank),
                            title: Text(
                              leaderEntry.zoneName,
                              style: GoogleFonts.outfit(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                                color: isTop3 ? Colors.white : const Color(0xFF0F172A),
                              ),
                            ),
                            subtitle: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(
                                  leaderEntry.franchiseName,
                                  style: GoogleFonts.inter(
                                    fontSize: 12,
                                    color: isTop3 ? Colors.white70 : const Color(0xFF64748B),
                                    fontWeight: FontWeight.w600,
                                  ),
                                ),
                                const SizedBox(height: 4),
                                Row(
                                  children: [
                                    Icon(
                                      Icons.local_shipping_rounded,
                                      size: 14,
                                      color: isTop3 ? Colors.white70 : const Color(0xFF94A3B8),
                                    ),
                                    const SizedBox(width: 4),
                                    Text(
                                      '${leaderEntry.completedOrders}/${leaderEntry.totalOrders} completed',
                                      style: GoogleFonts.inter(
                                        fontSize: 11,
                                        color: isTop3 ? Colors.white70 : const Color(0xFF94A3B8),
                                      ),
                                    ),
                                  ],
                                ),
                              ],
                            ),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '${leaderEntry.totalOrders}',
                                  style: GoogleFonts.outfit(
                                    fontSize: 24,
                                    fontWeight: FontWeight.bold,
                                    color: isTop3 ? Colors.white : const Color(0xFF2563EB),
                                  ),
                                ),
                                Text(
                                  'ORDERS',
                                  style: GoogleFonts.inter(
                                    fontSize: 9,
                                    fontWeight: FontWeight.w900,
                                    color: isTop3 ? Colors.white70 : const Color(0xFF64748B),
                                    letterSpacing: 0.5,
                                  ),
                                ),
                              ],
                            ),
                            onTap: () => _showZoneDetails(context, leaderEntry),
                          ),
                        ),
                      ),
                    );
                  }),
              ],
            ),
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => IllustrativeState(
            icon: Icons.error_outline_rounded,
            title: 'Analytic Error',
            subtitle: 'We couldn\'t load the seasonal performance data. $err',
            onRetry: () => ref.invalidate(leaderboardProvider),
            retryLabel: 'Refresh Leaderboard',
          ),
        ),
      ),
    );
  }

  Widget _buildStatChip(String label, String value, IconData icon) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(icon, color: Colors.white38, size: 10),
            const SizedBox(width: 4),
            Text(label.toUpperCase(), style: GoogleFonts.inter(color: Colors.white38, fontSize: 9, fontWeight: FontWeight.w900, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 18)),
      ],
    );
  }

  Widget _buildRankBadge(int rank) {
    Color color;
    IconData icon;

    switch (rank) {
      case 1:
        color = Colors.amber;
        icon = Icons.emoji_events;
        break;
      case 2:
        color = Colors.grey[400]!;
        icon = Icons.military_tech;
        break;
      case 3:
        color = Colors.brown[300]!;
        icon = Icons.workspace_premium;
        break;
      default:
        color = Colors.grey[300]!;
        icon = Icons.tag;
    }

    return Container(
      width: 50,
      height: 50,
      decoration: BoxDecoration(
        color: rank <= 3 ? color : Colors.grey[200],
        shape: BoxShape.circle,
      ),
      child: rank <= 3
          ? Icon(icon, color: Colors.white, size: 28)
          : Center(
              child: Text(
                '#$rank',
                style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
              ),
            ),
    );
  }

  List<Color> _getRankGradient(int index) {
    switch (index) {
      case 0: // Gold
        return [const Color(0xFFFFD700), const Color(0xFFFFA500)];
      case 1: // Silver
        return [const Color(0xFFC0C0C0), const Color(0xFF808080)];
      case 2: // Bronze
        return [const Color(0xFFCD7F32), const Color(0xFF8B4513)];
      default:
        return [Colors.white, Colors.white];
    }
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
    final sixMonthsAgo = DateTime(currentDate.year, currentDate.month - 5, 1);

    final months = List.generate(6, (index) {
      final month = DateTime(sixMonthsAgo.year, sixMonthsAgo.month + index, 1);
      return DateFormat('yyyy-MM').format(month);
    }).reversed.toList();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Select Month', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: SizedBox(
          width: double.maxFinite,
          child: ListView.builder(
            shrinkWrap: true,
            itemCount: months.length,
            itemBuilder: (context, index) {
              final month = months[index];
              return ListTile(
                title: Text(_formatMonth(month)),
                onTap: () {
                  setState(() => _selectedMonth = month);
                  ref.read(leaderboardProvider.notifier).refreshWithMonth(month);
                  Navigator.pop(context);
                },
              );
            },
          ),
        ),
      ),
    );
  }

  void _showZoneDetails(BuildContext context, LeaderboardEntry entry) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('${entry.zoneName} Details', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('Rank', '#${entry.rank}'),
            _buildDetailRow('Franchise', entry.franchiseName),
            _buildDetailRow('Total Orders', '${entry.totalOrders}'),
            _buildDetailRow('Completed', '${entry.completedOrders}'),
            _buildDetailRow('Completion Rate', '${((entry.completedOrders / entry.totalOrders) * 100).toStringAsFixed(1)}%'),
            _buildDetailRow('Total Revenue', '₹${entry.totalRevenue.toStringAsFixed(2)}'),
            _buildDetailRow('Avg Order Value', '₹${entry.avgOrderValue.toStringAsFixed(2)}'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value) {
   return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 14)),
          Text(value, style: GoogleFonts.inter(fontSize: 14)),
        ],
      ),
    );
  }
}
