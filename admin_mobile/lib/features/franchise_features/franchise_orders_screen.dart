import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../franchise_features/franchise_features_provider.dart';
import '../../widgets/premium_widgets.dart';

import '../../widgets/modern_header.dart'; // Add import

class FranchiseOrdersScreen extends ConsumerStatefulWidget {
  const FranchiseOrdersScreen({super.key});

  @override
  ConsumerState<FranchiseOrdersScreen> createState() => _FranchiseOrdersScreenState();
}

class _FranchiseOrdersScreenState extends ConsumerState<FranchiseOrdersScreen> {
  DateTime? _dateFrom;
  DateTime? _dateTo;

  @override
  Widget build(BuildContext context) {
    final ordersAsync = ref.watch(franchiseOrdersProvider);
    final filter = ref.watch(franchiseOrdersFilterProvider);
    final canPop = Navigator.of(context).canPop();

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
              onPressed: () => Navigator.of(context).maybePop(),
            ),
            GestureDetector(
              onTap: () => Navigator.of(context).popUntil((route) => route.isFirst),
              child: Hero(
                tag: 'franchise_app_logo_orders', 
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
        trailingWidget: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.tune_rounded, size: 20, color: Colors.white),
              ),
              onPressed: () => _showFilterDialog(context),
            ),
            IconButton(
              icon: Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(color: Colors.white.withOpacity(0.2), borderRadius: BorderRadius.circular(12)),
                child: const Icon(Icons.refresh_rounded, size: 20, color: Colors.white),
              ),
              onPressed: () => ref.read(franchiseOrdersProvider.notifier).refresh(),
            ),
          ],
        ),
      ),
      backgroundColor: Colors.grey[50],
      body: Column(
        children: [
          // Filter chips display
          if (filter.dateFrom != null || filter.dateTo != null || filter.status != null)
            Container(
              padding: const EdgeInsets.all(16),
              color: Colors.white,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Active Filters:', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12)),
                  const SizedBox(height: 8),
                  Wrap(
                    spacing: 8,
                    children: [
                      if (filter.dateFrom != null)
                        Chip(
                          label: Text('From: ${filter.dateFrom}', style: const TextStyle(fontSize: 11)),
                          onDeleted: () {
                            ref.read(franchiseOrdersFilterProvider.notifier).setDateRange(null, filter.dateTo);
                            ref.read(franchiseOrdersProvider.notifier).refresh();
                          },
                          deleteIconColor: Colors.red,
                        ),
                      if (filter.dateTo != null)
                        Chip(
                          label: Text('To: ${filter.dateTo}', style: const TextStyle(fontSize: 11)),
                          onDeleted: () {
                            ref.read(franchiseOrdersFilterProvider.notifier).setDateRange(filter.dateFrom, null);
                            ref.read(franchiseOrdersProvider.notifier).refresh();
                          },
                          deleteIconColor: Colors.red,
                        ),
                      if (filter.status != null)
                        Chip(
                          label: Text(filter.status!.toUpperCase(), style: const TextStyle(fontSize: 11)),
                          onDeleted: () {
                            ref.read(franchiseOrdersFilterProvider.notifier).setStatus(null);
                            ref.read(franchiseOrdersProvider.notifier).refresh();
                          },
                          deleteIconColor: Colors.red,
                        ),
                      TextButton.icon(
                        onPressed: () {
                          ref.read(franchiseOrdersFilterProvider.notifier).clearFilters();
                          ref.read(franchiseOrdersProvider.notifier).refresh();
                        },
                        icon: const Icon(Icons.clear_all, size: 16),
                        label: const Text('Clear All'),
                        style: TextButton.styleFrom(foregroundColor: Colors.red),
                      ),
                    ],
                  ),
                ],
              ),
            ),

          // Orders list
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.read(franchiseOrdersProvider.notifier).refresh(),
              child: ordersAsync.when(
                data: (orders) {
                  if (orders.isEmpty) {
                    return const IllustrativeState(
                      icon: Icons.assignment_rounded,
                      title: 'No Active Orders',
                      subtitle: 'We couldn\'t find any orders matching your current filters. Fresh orders will appear here.',
                    );
                  }

                  return ListView.builder(
                    padding: const EdgeInsets.all(24),
                    physics: const BouncingScrollPhysics(),
                    itemCount: orders.length,
                    itemBuilder: (context, index) {
                      final order = orders[index];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 16),
                        child: PremiumGlassCard(
                          padding: 0,
                          child: InkWell(
                            onTap: () => _showOrderDetails(context, order),
                            borderRadius: BorderRadius.circular(20),
                            child: Padding(
                              padding: const EdgeInsets.all(20),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(
                                              'ORDER #${order['id']}',
                                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF0F172A)),
                                            ),
                                            const SizedBox(height: 4),
                                            Text(
                                              _formatDate(order['created_at']),
                                              style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w600),
                                            ),
                                          ],
                                        ),
                                      ),
                                      _buildStatusChip(order['order_status']),
                                    ],
                                  ),
                                  const SizedBox(height: 20),
                                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                  const SizedBox(height: 20),
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text('CUSTOMER', style: GoogleFonts.inter(fontSize: 9, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                                          const SizedBox(height: 4),
                                          Text(order['user_name'] ?? 'N/A', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF1E293B), fontSize: 13)),
                                        ],
                                      ),
                                      Column(
                                        crossAxisAlignment: CrossAxisAlignment.end,
                                        children: [
                                          Text('AMOUNT', style: GoogleFonts.inter(fontSize: 9, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                                          const SizedBox(height: 4),
                                          Text(
                                            '₹${order['order_amount']}',
                                            style: GoogleFonts.outfit(fontSize: 20, fontWeight: FontWeight.bold, color: const Color(0xFF2563EB)),
                                          ),
                                        ],
                                      ),
                                    ],
                                  ),
                                ],
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
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    switch (status.toLowerCase()) {
      case 'delivered':
        color = Colors.green;
        break;
      case 'pending':
        color = Colors.orange;
        break;
      case 'confirmed':
        color = Colors.blue;
        break;
      case 'processing':
        color = Colors.purple;
        break;
      case 'canceled':
        color = Colors.red;
        break;
      default:
        color = Colors.grey;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: color.withOpacity(0.3)),
      ),
      child: Text(
        status.toUpperCase(),
        style: TextStyle(fontSize: 11, fontWeight: FontWeight.bold, color: color),
      ),
    );
  }

  String _formatDate(String? dateStr) {
    if (dateStr == null) return 'N/A';
    try {
      final date = DateTime.parse(dateStr);
      return DateFormat('MMM dd, yyyy • hh:mm a').format(date);
    } catch (e) {
      return dateStr;
    }
  }

  void _showFilterDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Filter Orders', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              // Date From
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
              // Date To
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
              // Status filter
              DropdownButtonFormField<String>(
                decoration: const InputDecoration(labelText: 'Status'),
                value: ref.read(franchiseOrdersFilterProvider).status,
                items: ['All', 'pending', 'confirmed', 'processing', 'delivered', 'canceled']
                    .map((s) => DropdownMenuItem(
value: s == 'All' ? null : s,
                          child: Text(s.toUpperCase()),
                        ))
                    .toList(),
                onChanged: (val) {},
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
              final dateFrom = _dateFrom != null ? DateFormat('yyyy-MM-dd').format(_dateFrom!) : null;
              final dateTo = _dateTo != null ? DateFormat('yyyy-MM-dd').format(_dateTo!) : null;
              
              ref.read(franchiseOrdersFilterProvider.notifier).setDateRange(dateFrom, dateTo);
              ref.read(franchiseOrdersProvider.notifier).refresh();
              
              Navigator.pop(context);
            },
            child: const Text('Apply'),
          ),
        ],
      ),
    );
  }


  void _showOrderDetails(BuildContext context, Map<String, dynamic> order) async {
    // Show loading dialog first
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: Text('Order #${order['id']}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: const Center(
          child: Padding(
            padding: EdgeInsets.all(20),
            child: CircularProgressIndicator(),
          ),
        ),
      ),
    );

    try {
      // Fetch full order details with items
      final apiService = ref.read(franchiseOrdersProvider.notifier).apiService;
      final prefs = await ref.read(sharedPreferencesProvider.future);
      final zoneId = prefs.getInt('zoneId');
      
      final response = await apiService.client.get('/franchise/orders/${order['id']}?zoneId=$zoneId');
      
      // Close loading dialog
      Navigator.pop(context);
      
      final orderDetails = response.data as Map<String, dynamic>;
      final items = (orderDetails['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];

      // Show full details dialog
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: Text('Order #${order['id']}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisSize: MainAxisSize.min,
              children: [
                _buildDetailRow('Customer', orderDetails['user_name'] ?? 'N/A'),
                _buildDetailRow('Phone', orderDetails['user_phone'] ?? 'N/A'),
                _buildDetailRow('Status', orderDetails['order_status'] ?? 'N/A'),
                _buildDetailRow('Payment', orderDetails['payment_method'] ?? 'N/A'),
                _buildDetailRow('Date', _formatDate(orderDetails['created_at'])),
                if (orderDetails['delivery_address'] != null)
                  _buildDetailRow('Address', orderDetails['delivery_address']),
                
                const Divider(height: 24),
                
                // Items section
                Text('Items', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14)),
                const SizedBox(height: 8),
                
                if (items.isEmpty)
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text('No items found', style: TextStyle(color: Colors.grey[600], fontSize: 12)),
                  )
                else
                  ...items.map((item) => Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.grey[100],
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                item['item_name'] ?? 'Unknown Item',
                                style: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
                              ),
                              const SizedBox(height: 4),
                              Text(
                                'Qty: ${item['quantity']} × ₹${item['price']}',
                                style: TextStyle(fontSize: 11, color: Colors.grey[700]),
                              ),
                            ],
                          ),
                        ),
                        Text(
                          '₹${(double.tryParse(item['price']?.toString() ?? '0') ?? 0) * (int.tryParse(item['quantity']?.toString() ?? '0') ?? 0)}',
                          style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14),
                        ),
                      ],
                    ),
                  )).toList(),
                
                const Divider(height: 24),
                
                // Total
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Total Amount', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 14)),
                    Text(
                      '₹${orderDetails['order_amount']}',
                      style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF2563EB)),
                    ),
                  ],
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    } catch (e) {
      // Close loading dialog
      Navigator.pop(context);
      
      // Show error dialog
      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Error'),
          content: Text('Failed to load order details: $e'),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
          ],
        ),
      );
    }
  }


  Widget _buildDetailRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 80,
            child: Text(label, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 12)),
          ),
          Expanded(child: Text(value, style: GoogleFonts.inter(fontSize: 12))),
        ],
      ),
    );
  }
}
