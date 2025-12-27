import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../shop_provider.dart';

class OrdersFilterPanel extends ConsumerStatefulWidget {
  final VoidCallback onApply;
  
  const OrdersFilterPanel({super.key, required this.onApply});

  @override
  ConsumerState<OrdersFilterPanel> createState() => _OrdersFilterPanelState();
}

class _OrdersFilterPanelState extends ConsumerState<OrdersFilterPanel> {
  final TextEditingController _searchController = TextEditingController();

  @override
  void initState() {
    super.initState();
    // Initialize search controller with current filter value
    WidgetsBinding.instance.addPostFrameCallback((_) {
      final filter = ref.read(ordersFilterProvider);
      _searchController.text = filter.search ?? '';
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final filter = ref.watch(ordersFilterProvider);

    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: Colors.white,
        boxShadow: [
          BoxShadow(
            color: Colors.grey.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          // Search Bar
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search by Order ID, Razorpay ID, Franchise...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: _searchController.text.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: () {
                        _searchController.clear();
                        ref.read(ordersFilterProvider.notifier).setSearch(null);
                        widget.onApply();
                      },
                    )
                  : null,
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
              ),
              filled: true,
              fillColor: Colors.grey[50],
            ),
            onChanged: (value) {
              // Debounce search
              Future.delayed(const Duration(milliseconds: 500), () {
                if (_searchController.text == value) {
                  ref.read(ordersFilterProvider.notifier).setSearch(value.isEmpty ? null : value);
                  widget.onApply();
                }
              });
            },
          ),
          const SizedBox(height: 16),

          // Status Filter
          Text('Order Status', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) {
              final isSelected = filter.statuses.contains(status);
              return FilterChip(
                label: Text(status.toUpperCase()),
                selected: isSelected,
                onSelected: (selected) {
                  final newStatuses = List<String>.from(filter.statuses);
                  if (selected) {
                    newStatuses.add(status);
                  } else {
                    newStatuses.remove(status);
                  }
                  ref.read(ordersFilterProvider.notifier).setStatusFilter(newStatuses);
                  widget.onApply();
                },
                selectedColor: _getStatusColor(status).withOpacity(0.2),
                checkmarkColor: _getStatusColor(status),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // Payment Status Filter
          Text('Payment Status', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12)),
          const SizedBox(height: 8),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: ['pending', 'paid', 'failed', 'refunded'].map((payment) {
              final isSelected = filter.paymentStatuses.contains(payment);
              return FilterChip(
                label: Text(payment.toUpperCase()),
                selected: isSelected,
                onSelected: (selected) {
                  final newPayments = List<String>.from(filter.paymentStatuses);
                  if (selected) {
                    newPayments.add(payment);
                  } else {
                    newPayments.remove(payment);
                  }
                  ref.read(ordersFilterProvider.notifier).setPaymentFilter(newPayments);
                  widget.onApply();
                },
                selectedColor: _getPaymentColor(payment).withOpacity(0.2),
                checkmarkColor: _getPaymentColor(payment),
              );
            }).toList(),
          ),
          const SizedBox(height: 16),

          // Sort Options
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Sort By', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      value: filter.sortBy,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      items: [
                        DropdownMenuItem(value: 'created_at', child: Text('Date', style: GoogleFonts.inter(fontSize: 12))),
                        DropdownMenuItem(value: 'total_amount', child: Text('Amount', style: GoogleFonts.inter(fontSize: 12))),
                        DropdownMenuItem(value: 'status', child: Text('Status', style: GoogleFonts.inter(fontSize: 12))),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          ref.read(ordersFilterProvider.notifier).setSorting(value, filter.sortOrder);
                          widget.onApply();
                        }
                      },
                    ),
                  ],
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Order', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 12)),
                    const SizedBox(height: 4),
                    DropdownButtonFormField<String>(
                      value: filter.sortOrder,
                      decoration: InputDecoration(
                        contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                      ),
                      items: [
                        DropdownMenuItem(value: 'desc', child: Text('Newest First', style: GoogleFonts.inter(fontSize: 12))),
                        DropdownMenuItem(value: 'asc', child: Text('Oldest First', style: GoogleFonts.inter(fontSize: 12))),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          ref.read(ordersFilterProvider.notifier).setSorting(filter.sortBy, value);
                          widget.onApply();
                        }
                      },
                    ),
                  ],
                ),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Clear Filters Button
          if (filter.statuses.isNotEmpty || 
              filter.paymentStatuses.isNotEmpty || 
              filter.search != null)
            Center(
              child: TextButton.icon(
                onPressed: () {
                  _searchController.clear();
                  ref.read(ordersFilterProvider.notifier).clearFilters();
                  widget.onApply();
                },
                icon: const Icon(Icons.clear_all),
                label: const Text('Clear All Filters'),
                style: TextButton.styleFrom(
                  foregroundColor: Colors.red,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'pending':
        return Colors.orange;
      case 'processing':
        return Colors.blue;
      case 'shipped':
        return Colors.purple;
      case 'delivered':
        return Colors.green;
      case 'cancelled':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  Color _getPaymentColor(String payment) {
    switch (payment) {
      case 'pending':
        return Colors.orange;
      case 'paid':
        return Colors.green;
      case 'failed':
        return Colors.red;
      case 'refunded':
        return Colors.grey;
      default:
        return Colors.grey;
    }
  }
}
