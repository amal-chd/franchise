import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../franchise_features/franchise_features_provider.dart';
import '../../widgets/premium_widgets.dart';

import '../../widgets/modern_header.dart'; // Add import

class ImprovedPayoutsScreen extends ConsumerStatefulWidget {
  const ImprovedPayoutsScreen({super.key});

  @override
  ConsumerState<ImprovedPayoutsScreen> createState() => _ImprovedPayoutsScreenState();
}

class _ImprovedPayoutsScreenState extends ConsumerState<ImprovedPayoutsScreen> {
  DateTime? _dateFrom;
  DateTime? _dateTo;

  @override
  Widget build(BuildContext context) {
    final payoutsAsync = ref.watch(payoutsProvider);

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
                tag: 'franchise_app_logo_payouts', 
                child: Material(
                  color: Colors.transparent,
                  child: Image.asset(
                    'assets/images/header_logo_new.png', 
                    height: 24,
                    color: Colors.white,
                    errorBuilder: (context, error, stackTrace) => const SizedBox(),
                  ),
                ),
              ),
            ),
          ],
        ),
        showLeading: true,
        trailingWidget: IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.date_range_rounded, size: 20, color: Colors.white),
          ),
          onPressed: () => _showDateFilterDialog(context),
        ),
      ),
      backgroundColor: Colors.grey[50],
      body: RefreshIndicator(
        onRefresh: () => ref.read(payoutsProvider.notifier).refreshWithFilter(
              _dateFrom != null ? DateFormat('yyyy-MM-dd').format(_dateFrom!) : null,
              _dateTo != null ? DateFormat('yyyy-MM-dd').format(_dateTo!) : null,
            ),
        child: payoutsAsync.when(
          data: (data) => SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Summary Cards
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
                              Text('TOTAL EARNINGS', style: GoogleFonts.inter(color: Colors.white38, fontSize: 11, fontWeight: FontWeight.w800, letterSpacing: 1.5)),
                              const SizedBox(height: 8),
                              Text(
                                '₹${data.summary.totalEarnings.toStringAsFixed(2)}',
                                style: GoogleFonts.outfit(color: Colors.white, fontSize: 32, fontWeight: FontWeight.bold),
                              ),
                            ],
                          ),
                          Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(
                              color: const Color(0xFF2563EB).withOpacity(0.2),
                              borderRadius: BorderRadius.circular(16),
                            ),
                            child: const Icon(Icons.account_balance_wallet_rounded, color: Color(0xFF60A5FA), size: 32),
                          ),
                        ],
                      ),
                      const SizedBox(height: 32),
                      Row(
                        children: [
                          _buildStatChip('Orders', '${data.summary.totalOrders}', Icons.shopping_cart_rounded),
                          const SizedBox(width: 24),
                          _buildStatChip('Kitchen', '₹${data.summary.restaurantEarnings.toInt()}', Icons.restaurant_rounded),
                          const SizedBox(width: 24),
                          _buildStatChip('Logistics', '₹${data.summary.deliveryEarnings.toInt()}', Icons.local_shipping_rounded),
                        ],
                      ),
                    ],
                  ),
                ),

                const SizedBox(height: 20),

                // Today's Pending
                if (data.summary.todaysPendingOrders > 0)
                  Container(
                    padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(
                      color: Colors.orange[50],
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.orange[200]!),
                    ),
                    child: Row(
                      children: [
                        Icon(Icons.pending_actions, color: Colors.orange[700], size: 24),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Today\'s Pending Payout',
                                style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14),
                              ),
                              Text(
                                '${data.summary.todaysPendingOrders} orders • ₹${data.summary.todaysPendingAmount.toStringAsFixed(2)}',
                                style: TextStyle(color: Colors.grey[700], fontSize: 12),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),

                const SizedBox(height: 24),

                // Payout History Header
                PremiumSectionHeader(
                  title: 'Settlement History',
                  actionLabel: (_dateFrom != null || _dateTo != null) ? 'Clear Filter' : null,
                  onAction: () {
                    setState(() {
                      _dateFrom = null;
                      _dateTo = null;
                    });
                    ref.read(payoutsProvider.notifier).refreshWithFilter(null, null);
                  },
                ),
                const SizedBox(height: 16),

                if (data.payouts.isEmpty)
                  const IllustrativeState(
                    icon: Icons.receipt_long_rounded,
                    title: 'No Settlements Yet',
                    subtitle: 'All your processed payouts will appear here once they are settled by the administrator.',
                  )
                else
                  ...data.payouts.map((payout) => Padding(
                        padding: const EdgeInsets.only(bottom: 12),
                        child: PremiumGlassCard(
                          padding: 16,
                          child: ListTile(
                            contentPadding: EdgeInsets.zero,
                            leading: Container(
                              padding: const EdgeInsets.all(10),
                              decoration: BoxDecoration(color: const Color(0xFF10B981).withOpacity(0.1), borderRadius: BorderRadius.circular(14)),
                              child: const Icon(Icons.verified_rounded, color: Color(0xFF10B981), size: 20),
                            ),
                            title: Text(
                              _formatPayoutDate(payout.date),
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF0F172A)),
                            ),
                            subtitle: Text('${payout.totalOrders} orders included', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF64748B))),
                            trailing: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              crossAxisAlignment: CrossAxisAlignment.end,
                              children: [
                                Text(
                                  '₹${payout.totalEarnings.toStringAsFixed(2)}',
                                  style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF10B981)),
                                ),
                                Text(
                                  'SETTLED',
                                  style: GoogleFonts.inter(fontSize: 9, fontWeight: FontWeight.w900, color: const Color(0xFF64748B), letterSpacing: 0.5),
                                ),
                              ],
                            ),
                            onTap: () => _showPayoutDetails(context, payout),
                          ),
                        ),
                      )),
              ],
            ),
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => IllustrativeState(
            icon: Icons.error_outline_rounded,
            title: 'Connection Issue',
            subtitle: 'We encountered an error while fetching your financial data. $err',
            onRetry: () => ref.invalidate(payoutsProvider),
            retryLabel: 'Retry Sync',
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
            Text(label.toUpperCase(), style: GoogleFonts.inter(color: Colors.white38, fontSize: 9, fontWeight: FontWeight.w800, letterSpacing: 1)),
          ],
        ),
        const SizedBox(height: 4),
        Text(value, style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
      ],
    );
  }

  String _formatPayoutDate(String dateStr) {
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMMM dd, yyyy').format(date);
    } catch (e) {
      return dateStr;
    }
  }

  void _showDateFilterDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Filter by Date Range', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              ListTile(
                title: const Text('From Date'),
                subtitle: Text(_dateFrom != null ? DateFormat('yyyy-MM-dd').format(_dateFrom!) : 'Not set'),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _dateFrom ?? DateTime.now(),
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now(),
                  );
                  if (date != null) {
                    setState(() => _dateFrom = date);
                  }
                },
              ),
              ListTile(
                title: const Text('To Date'),
                subtitle: Text(_dateTo != null ? DateFormat('yyyy-MM-dd').format(_dateTo!) : 'Not set'),
                trailing: const Icon(Icons.calendar_today),
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _dateTo ?? DateTime.now(),
                    firstDate: DateTime(2020),
                    lastDate: DateTime.now(),
                  );
                  if (date != null) {
                    setState(() => _dateTo = date);
                  }
                },
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            onPressed: () {
              ref.read(payoutsProvider.notifier).refreshWithFilter(
                    _dateFrom != null ? DateFormat('yyyy-MM-dd').format(_dateFrom!) : null,
                    _dateTo != null ? DateFormat('yyyy-MM-dd').format(_dateTo!) : null,
                  );
              Navigator.pop(context);
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }

  void _showPayoutDetails(BuildContext context, PayoutEntry payout) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Payout Details', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            _buildDetailRow('Date', _formatPayoutDate(payout.date)),
            _buildDetailRow('Orders', '${payout.totalOrders}'),
            _buildDetailRow('Restaurant Earnings', '₹${payout.restaurantEarnings.toStringAsFixed(2)}'),
            _buildDetailRow('Delivery Earnings', '₹${payout.deliveryEarnings.toStringAsFixed(2)}'),
            const Divider(),
            _buildDetailRow('Total Earnings', '₹${payout.totalEarnings.toStringAsFixed(2)}'),
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
