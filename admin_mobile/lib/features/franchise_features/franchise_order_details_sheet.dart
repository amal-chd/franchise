
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart'; // Added for ProviderScope if needed, but we'll use Consumer if we can, or just manual dio.
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import '../../widgets/premium_widgets.dart';
import 'franchise_features_provider.dart'; // For accessing provider if needed, or we pass API client.

// We need a ConsumerWidget to access providers easily
class FranchiseOrderDetailsSheet extends ConsumerStatefulWidget {
  final Map<String, dynamic> orderSummary; // The data we already have from the list
  final int zoneId;

  const FranchiseOrderDetailsSheet({
    super.key,
    required this.orderSummary,
    required this.zoneId,
  });

  @override
  ConsumerState<FranchiseOrderDetailsSheet> createState() => _FranchiseOrderDetailsSheetState();
}

class _FranchiseOrderDetailsSheetState extends ConsumerState<FranchiseOrderDetailsSheet> {
  bool _isLoading = true;
  Map<String, dynamic>? _orderDetails;
  List<Map<String, dynamic>> _items = [];
  String? _error;

  @override
  void initState() {
    super.initState();
    _fetchDetails();
  }

  Future<void> _fetchDetails() async {
    try {
      final apiService = ref.read(franchiseOrdersProvider.notifier).apiService;
      // Use the widget.orderSummary['id'] and widget.zoneId
      final response = await apiService.client.get('/franchise/orders/${widget.orderSummary['id']}?zoneId=${widget.zoneId}');
      
      if (mounted) {
        setState(() {
          _orderDetails = response.data as Map<String, dynamic>;
          _items = (_orderDetails!['items'] as List?)?.cast<Map<String, dynamic>>() ?? [];
          _isLoading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _error = e.toString();
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    // If loading, show skeletons but use orderSummary for header
    // If error, show error
    // If success, show full details
    
    // Status fallback from summary if details not loaded yet
    final status = _orderDetails != null 
        ? (_orderDetails!['order_status'] ?? 'pending').toString().toLowerCase()
        : (widget.orderSummary['order_status'] ?? 'pending').toString().toLowerCase();

    return Container(
      height: MediaQuery.of(context).size.height * 0.85,
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        borderRadius: BorderRadius.vertical(top: Radius.circular(32)),
      ),
      child: Column(
        children: [
          // Handle Bar
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2)
              ),
            ),
          ),

          // Header
          Padding(
            padding: const EdgeInsets.fromLTRB(24, 8, 24, 20),
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'ORDER #${widget.orderSummary['id']}',
                      style: GoogleFonts.outfit(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                        color: const Color(0xFF0F172A),
                      ),
                    ),
                    const SizedBox(height: 4),
                    Text(
                      _formatDate(_orderDetails?['created_at'] ?? widget.orderSummary['created_at']),
                      style: GoogleFonts.inter(
                        fontSize: 13,
                        color: const Color(0xFF64748B),
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                  ],
                ),
                Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: Colors.black.withOpacity(0.05),
                        blurRadius: 10,
                        offset: const Offset(0, 4),
                      ),
                    ],
                  ),
                  child: IconButton(
                    icon: const Icon(Icons.close_rounded, color: Color(0xFF0F172A)),
                    onPressed: () => Navigator.pop(context),
                  ),
                ),
              ],
            ),
          ),

          Expanded(
            child: _error != null 
                ? IllustrativeState(
                    icon: Icons.error_outline_rounded,
                    title: 'Failed to Load',
                    subtitle: _error!,
                    onRetry: _fetchDetails,
                  )
                : SingleChildScrollView(
                    padding: const EdgeInsets.fromLTRB(24, 0, 24, 40),
                    physics: const BouncingScrollPhysics(),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Status Badge
                        Center(
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                            decoration: BoxDecoration(
                              color: _getStatusColor(status).withOpacity(0.1),
                              borderRadius: BorderRadius.circular(20),
                              border: Border.all(color: _getStatusColor(status).withOpacity(0.2)),
                            ),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                Container(
                                  width: 8,
                                  height: 8,
                                  decoration: BoxDecoration(
                                    color: _getStatusColor(status),
                                    shape: BoxShape.circle,
                                  ),
                                ),
                                const SizedBox(width: 8),
                                Text(
                                  status.toUpperCase(),
                                  style: GoogleFonts.outfit(
                                    fontWeight: FontWeight.bold,
                                    fontSize: 14,
                                    color: _getStatusColor(status),
                                    letterSpacing: 1,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                        
                        const SizedBox(height: 32),

                        // Customer Section
                        _buildSectionHeader('CUSTOMER DETAILS'),
                        const SizedBox(height: 12),
                        PremiumGlassCard(
                          padding: 20,
                          borderRadius: 20,
                          child: _isLoading 
                              ? const Column(
                                  children: [
                                    PremiumSkeleton(width: double.infinity, height: 20),
                                    SizedBox(height: 16),
                                    PremiumSkeleton(width: double.infinity, height: 20),
                                  ],
                                )
                              : Column(
                                  children: [
                                    _buildInfoRow(
                                      Icons.person_outline_rounded,
                                      'Name',
                                      _orderDetails?['user_name'] ?? 'Guest User',
                                    ),
                                    const Divider(height: 24, color: Color(0xFFF1F5F9)),
                                    _buildInfoRow(
                                      Icons.phone_outlined,
                                      'Phone',
                                      _orderDetails?['user_phone'] ?? 'N/A',
                                    ),
                                    if (_orderDetails?['delivery_address'] != null) ...[
                                      const Divider(height: 24, color: Color(0xFFF1F5F9)),
                                      _buildInfoRow(
                                        Icons.location_on_outlined,
                                        'Address',
                                        _orderDetails!['delivery_address'],
                                        isMultiline: true,
                                      ),
                                    ],
                                  ],
                                ),
                        ),

                        const SizedBox(height: 24),

                        // Order Items
                        _buildSectionHeader('ORDER ITEMS'),
                        const SizedBox(height: 12),
                        PremiumGlassCard(
                          padding: 0,
                          borderRadius: 20,
                          child: _isLoading 
                              ? Padding(
                                  padding: const EdgeInsets.all(20),
                                  child: Column(
                                    children: const [
                                      PremiumSkeleton(width: double.infinity, height: 60),
                                      SizedBox(height: 16),
                                      PremiumSkeleton(width: double.infinity, height: 60),
                                    ],
                                  ),
                                )
                              : Column(
                                  children: [
                                    if (_items.isEmpty)
                                      Padding(
                                        padding: const EdgeInsets.all(24),
                                        child: Center(
                                          child: Text(
                                            'No items found',
                                            style: GoogleFonts.inter(color: const Color(0xFF94A3B8)),
                                          ),
                                        ),
                                      )
                                    else
                                      ListView.separated(
                                        shrinkWrap: true,
                                        physics: const NeverScrollableScrollPhysics(),
                                        padding: const EdgeInsets.all(20),
                                        itemCount: _items.length,
                                        separatorBuilder: (context, index) => const Divider(height: 24, color: Color(0xFFF1F5F9)),
                                        itemBuilder: (context, index) {
                                          final item = _items[index];
                                          return Row(
                                            crossAxisAlignment: CrossAxisAlignment.start,
                                            children: [
                                              Container(
                                                width: 48,
                                                height: 48,
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFFF1F5F9),
                                                  borderRadius: BorderRadius.circular(12),
                                                ),
                                                child: Center(
                                                  child: Text(
                                                    '${item['quantity']}x',
                                                    style: GoogleFonts.outfit(
                                                      fontWeight: FontWeight.bold,
                                                      fontSize: 16,
                                                      color: const Color(0xFF64748B),
                                                    ),
                                                  ),
                                                ),
                                              ),
                                              const SizedBox(width: 16),
                                              Expanded(
                                                child: Column(
                                                  crossAxisAlignment: CrossAxisAlignment.start,
                                                  children: [
                                                    Text(
                                                      item['item_name'] ?? 'Unknown Item',
                                                      style: GoogleFonts.outfit(
                                                        fontWeight: FontWeight.w600,
                                                        fontSize: 15,
                                                        color: const Color(0xFF0F172A),
                                                      ),
                                                    ),
                                                    const SizedBox(height: 4),
                                                    Text(
                                                      item['variant'] ?? 'Standard',
                                                      style: GoogleFonts.inter(
                                                        fontSize: 12,
                                                        color: const Color(0xFF94A3B8),
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                              Text(
                                                '₹${(double.tryParse(item['price']?.toString() ?? '0') ?? 0) * (int.tryParse(item['quantity']?.toString() ?? '0') ?? 0)}',
                                                style: GoogleFonts.outfit(
                                                  fontWeight: FontWeight.bold,
                                                  fontSize: 16,
                                                  color: const Color(0xFF0F172A),
                                                ),
                                              ),
                                            ],
                                          );
                                        },
                                      ),
                                  ],
                                ),
                        ),

                        const SizedBox(height: 24),

                        // Bill Details
                        _buildSectionHeader('BILLING DETAILS'),
                        const SizedBox(height: 12),
                        PremiumGlassCard(
                          padding: 24,
                          borderRadius: 20,
                          child: _isLoading 
                              ? const Column(
                                  children: [
                                    PremiumSkeleton(width: double.infinity, height: 20),
                                    SizedBox(height: 12),
                                    PremiumSkeleton(width: double.infinity, height: 30),
                                  ],
                                )
                              : Column(
                                  children: [
                                     _buildBillRow('Payment Method', _orderDetails?['payment_method'] ?? 'N/A', isBold: false),
                                     const SizedBox(height: 12),
                                     _buildBillRow('Subtotal', '₹${_orderDetails?['order_amount']}', isBold: false),
                                     const Padding(
                                       padding: EdgeInsets.symmetric(vertical: 16),
                                       child: Divider(height: 1, color: Color(0xFFE2E8F0)),
                                     ),
                                     _buildBillRow('Grand Total', '₹${_orderDetails?['order_amount']}', isBold: true, isLarge: true, color: const Color(0xFF2563EB)),
                                  ],
                                ),
                        ),
                      ],
                    ),
                  ),
          ),
        ],
      ),
    );
  }

  Widget _buildSectionHeader(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4),
      child: Text(
        title,
        style: GoogleFonts.inter(
          fontSize: 11,
          fontWeight: FontWeight.w900,
          color: const Color(0xFF94A3B8),
          letterSpacing: 1.5,
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String label, String value, {bool isMultiline = false}) {
    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Icon(icon, size: 20, color: const Color(0xFF64748B)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                label,
                style: GoogleFonts.inter(
                  fontSize: 12,
                  color: const Color(0xFF94A3B8),
                  fontWeight: FontWeight.w500,
                ),
              ),
              const SizedBox(height: 2),
              Text(
                value,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  color: const Color(0xFF0F172A),
                  fontWeight: FontWeight.w600,
                  height: 1.4,
                ),
                maxLines: isMultiline ? 3 : 1,
                overflow: isMultiline ? TextOverflow.ellipsis : null,
              ),
            ],
          ),
        ),
      ],
    );
  }

  Widget _buildBillRow(String label, String value, {bool isBold = false, bool isLarge = false, Color? color}) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.spaceBetween,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            fontSize: isLarge ? 16 : 14,
            fontWeight: isBold ? FontWeight.bold : FontWeight.normal,
            color: isBold ? const Color(0xFF0F172A) : const Color(0xFF64748B),
          ),
        ),
        Text(
          value,
          style: GoogleFonts.outfit(
            fontSize: isLarge ? 24 : 16,
            fontWeight: isBold ? FontWeight.bold : FontWeight.w500,
            color: color ?? const Color(0xFF0F172A),
          ),
        ),
      ],
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'delivered': return const Color(0xFF10B981);
      case 'pending': return const Color(0xFFF59E0B);
      case 'processing': return const Color(0xFF8B5CF6);
      case 'confirmed': return const Color(0xFF2563EB);
      case 'canceled': return const Color(0xFFEF4444);
      default: return const Color(0xFF64748B);
    }
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
}
