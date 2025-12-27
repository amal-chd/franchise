import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../shop_provider.dart';

class BulkActionsBar extends ConsumerWidget {
  final int selectedCount;
  final List<int> selectedOrderIds;

  const BulkActionsBar({
    super.key,
    required this.selectedCount,
    required this.selectedOrderIds,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: const Color(0xFF2563EB),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 8,
            offset: const Offset(0, -2),
          ),
        ],
      ),
      child: Row(
        children: [
          // Selection count
          Expanded(
            child: Text(
              '$selectedCount item${selectedCount > 1 ? 's' : ''} selected',
              style: GoogleFonts.poppins(
                color: Colors.white,
                fontWeight: FontWeight.bold,
                fontSize: 16,
              ),
            ),
          ),

          // Bulk Actions
          IconButton(
            onPressed: () => _showBulkStatusDialog(context, ref),
            icon: const Icon(Icons.edit, color: Colors.white),
            tooltip: 'Update Status',
          ),
          IconButton(
            onPressed: () => _exportOrders(context, ref),
            icon: const Icon(Icons.download, color: Colors.white),
            tooltip: 'Export',
          ),
          IconButton(
            onPressed: () => _clearSelection(ref),
            icon: const Icon(Icons.close, color: Colors.white),
            tooltip: 'Clear Selection',
          ),
        ],
      ),
    );
  }

  void _showBulkStatusDialog(BuildContext context, WidgetRef ref) {
    String selectedStatus = 'processing';

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Update ${selectedCount} Orders', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
        content: StatefulBuilder(
          builder: (context, setState) => Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Set status for all selected orders:', style: GoogleFonts.inter(fontSize: 14)),
              const SizedBox(height: 16),
              DropdownButtonFormField<String>(
                value: selectedStatus,
                decoration: const InputDecoration(
                  labelText: 'New Status',
                  border: OutlineInputBorder(),
                ),
                items: ['pending', 'processing', 'shipped', 'delivered', 'cancelled']
                    .map((e) => DropdownMenuItem(
                          value: e,
                          child: Text(e.toUpperCase()),
                        ))
                    .toList(),
                onChanged: (val) => setState(() => selectedStatus = val!),
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
            style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF2563EB)),
            onPressed: () async {
              Navigator.pop(context);
              
              // Show loading
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Updating orders...')),
              );

              // Perform bulk update
              final result = await ref.read(adminOrdersProvider.notifier).bulkOperation(
                    'update_status',
                    selectedOrderIds,
                    {'status': selectedStatus},
                  );

              if (context.mounted) {
                if (result['success'] == true) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('${result['successCount']} orders updated successfully'),
                      backgroundColor: Colors.green,
                    ),
                  );
                  _clearSelection(ref);
                } else {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text(result['message'] ?? 'Bulk update failed'),
                      backgroundColor: Colors.red,
                    ),
                  );
                }
              }
            },
            child: const Text('Update All'),
          ),
        ],
      ),
    );
  }

  void _exportOrders(BuildContext context, WidgetRef ref) async {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Exporting orders...')),
    );

    final result = await ref.read(adminOrdersProvider.notifier).bulkOperation(
          'export',
          selectedOrderIds,
          null,
        );

    if (context.mounted) {
      if (result['success'] == true) {
        // In a real app, you'd download the CSV file
        // For now, just show success message
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${selectedCount} orders exported'),
            backgroundColor: Colors.green,
            action: SnackBarAction(
              label: 'VIEW',
              textColor: Colors.white,
              onPressed: () {
                // Show the CSV data in a dialog
                showDialog(
                  context: context,
                  builder: (context) => AlertDialog(
                    title: const Text('Export Data'),
                    content: SingleChildScrollView(
                      child: Text(
                        result['csvData'] ?? '',
                        style: const TextStyle(fontFamily: 'monospace', fontSize: 10),
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
              },
            ),
          ),
        );
      }
    }
  }

  void _clearSelection(WidgetRef ref) {
    ref.read(selectedOrdersProvider.notifier).clearSelection();
  }
}
