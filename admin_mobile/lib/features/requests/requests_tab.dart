import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import 'requests_provider.dart';

class RequestsTab extends ConsumerWidget {
  const RequestsTab({super.key});

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return Colors.green;
      case 'rejected':
        return Colors.red;
      case 'pending_verification':
      case 'under_review':
        return Colors.orange;
      default:
        return Colors.grey;
    }
  }

  Future<void> _handleRejection(BuildContext context, WidgetRef ref, int id) async {
    final reasonController = TextEditingController();
    
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Reject Request'),
        content: TextField(
          controller: reasonController,
          decoration: const InputDecoration(hintText: 'Enter rejection reason'),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.red, foregroundColor: Colors.white),
            onPressed: () async {
              Navigator.pop(context);
              if (reasonController.text.isNotEmpty) {
                 final success = await ref.read(requestsProvider.notifier).verifyRequest(id, 'rejected', reason: reasonController.text);
                 if (success && context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request Rejected')));
                 }
              }
            },
            child: const Text('Confirm Reject'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(requestsProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        onRefresh: () => ref.read(requestsProvider.notifier).fetchRequests(),
        child: requestsAsync.when(
          data: (requests) {
            // Filter for Pending only
            final filteredRequests = requests.where((r) => r.status == 'pending_verification' || r.status == 'under_review').toList();
            
            if (filteredRequests.isEmpty) {
              return const Center(child: Text('No pending requests found'));
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: filteredRequests.length,
              itemBuilder: (context, index) {
                final req = filteredRequests[index];
                return Card(
                  elevation: 2,
                  margin: const EdgeInsets.only(bottom: 16),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              '#${req.id}',
                              style: GoogleFonts.robotoMono(fontWeight: FontWeight.bold, color: Colors.grey),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: _getStatusColor(req.status).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: _getStatusColor(req.status)),
                              ),
                              child: Text(
                                req.status.toUpperCase().replaceAll('_', ' '),
                                style: TextStyle(
                                  color: _getStatusColor(req.status),
                                  fontSize: 10,
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        _buildInfoRow(Icons.person, req.name),
                        _buildInfoRow(Icons.location_on, req.city),
                        _buildInfoRow(Icons.email, req.email),
                        _buildInfoRow(Icons.phone, req.phone),
                        if (req.kycUrl != null)
                          Padding(
                             padding: const EdgeInsets.only(top: 8),
                             child: InkWell(
                               onTap: () => launchUrl(Uri.parse(req.kycUrl!)),
                               child: const Text('View KYC Document', style: TextStyle(color: Colors.blue, decoration: TextDecoration.underline)),
                             ),
                          ),
                        
                        const Divider(height: 24),
                        
                        if (req.status != 'approved' && req.status != 'rejected')
                           Row(
                             children: [
                               Expanded(
                                 child: OutlinedButton.icon(
                                   icon: const Icon(Icons.close, color: Colors.red, size: 16),
                                   label: const Text('Reject', style: TextStyle(color: Colors.red)),
                                   style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.red)),
                                   onPressed: () => _handleRejection(context, ref, req.id),
                                 ),
                               ),
                               const SizedBox(width: 12),
                               Expanded(
                                 child: ElevatedButton.icon(
                                   icon: const Icon(Icons.check, size: 16),
                                   label: const Text('Approve'),
                                   style: ElevatedButton.styleFrom(
                                     backgroundColor: Colors.green,
                                     foregroundColor: Colors.white,
                                   ),
                                   onPressed: () async {
                                      final success = await ref.read(requestsProvider.notifier).verifyRequest(req.id, 'approved');
                                      if (success && context.mounted) {
                                        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request Approved')));
                                      }
                                   },
                                 ),
                               ),
                             ],
                           ),
                           
                        if (req.status == 'approved' || req.status == 'rejected')
                           SizedBox(
                             width: double.infinity,
                             child: OutlinedButton.icon(
                               icon: const Icon(Icons.delete, color: Colors.red, size: 16),
                               label: const Text('Delete', style: TextStyle(color: Colors.red)),
                                style: OutlinedButton.styleFrom(side: const BorderSide(color: Colors.red)),
                               onPressed: () async {
                                  final confirm = await showDialog<bool>(
                                    context: context,
                                    builder: (c) => AlertDialog(
                                      title: const Text('Confirm Delete'),
                                      content: const Text('Are you sure? This cannot be undone.'),
                                      actions: [
                                        TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                                        TextButton(onPressed: () => Navigator.pop(c, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
                                      ],
                                    ),
                                  );
                                  if (confirm == true) {
                                     await ref.read(requestsProvider.notifier).deleteRequest(req.id);
                                  }
                               },
                             ),
                           ),
                      ],
                    ),
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err', style: const TextStyle(color: Colors.red))),
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddFranchiseDialog(context, ref),
        backgroundColor: const Color(0xFF0F172A),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  void _showAddFranchiseDialog(BuildContext context, WidgetRef ref) {
    final nameCtrl = TextEditingController();
    final emailCtrl = TextEditingController();
    final phoneCtrl = TextEditingController();
    final cityCtrl = TextEditingController();
    final upiCtrl = TextEditingController();
    final accountCtrl = TextEditingController();
    final ifscCtrl = TextEditingController();
    final bankNameCtrl = TextEditingController();
    
    String plan = 'free';
    String status = 'pending_verification';

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Add Franchise'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
                TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email')),
                TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone')),
                TextField(controller: cityCtrl, decoration: const InputDecoration(labelText: 'City')),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: plan,
                  decoration: const InputDecoration(labelText: 'Plan'),
                  items: const [
                    DropdownMenuItem(value: 'free', child: Text('Starter (Free)')),
                    DropdownMenuItem(value: 'standard', child: Text('Standard')),
                    DropdownMenuItem(value: 'premium', child: Text('Premium')),
                    DropdownMenuItem(value: 'elite', child: Text('Elite')),
                  ],
                  onChanged: (val) => setState(() => plan = val!),
                ),
                DropdownButtonFormField<String>(
                  value: status,
                  decoration: const InputDecoration(labelText: 'Status'),
                  items: const [
                    DropdownMenuItem(value: 'pending_verification', child: Text('Pending Verification')),
                    DropdownMenuItem(value: 'under_review', child: Text('Under Review')),
                    DropdownMenuItem(value: 'approved', child: Text('Approved')),
                    DropdownMenuItem(value: 'rejected', child: Text('Rejected')),
                  ],
                  onChanged: (val) => setState(() => status = val!),
                ),
                const SizedBox(height: 16),
                const Text('Banking Details', style: TextStyle(fontWeight: FontWeight.bold)),
                TextField(controller: upiCtrl, decoration: const InputDecoration(labelText: 'UPI ID')),
                TextField(controller: accountCtrl, decoration: const InputDecoration(labelText: 'Account No')),
                TextField(controller: ifscCtrl, decoration: const InputDecoration(labelText: 'IFSC Code')),
                TextField(controller: bankNameCtrl, decoration: const InputDecoration(labelText: 'Bank Name')),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: Colors.white),
              onPressed: () async {
                final data = {
                  'name': nameCtrl.text,
                  'email': emailCtrl.text,
                  'phone': phoneCtrl.text,
                  'city': cityCtrl.text,
                  'plan_selected': plan,
                  'status': status,
                  'upi_id': upiCtrl.text,
                  'bank_account_number': accountCtrl.text,
                  'ifsc_code': ifscCtrl.text,
                  'bank_name': bankNameCtrl.text,
                };
                
                final success = await ref.read(requestsProvider.notifier).createFranchise(data);
                if (!context.mounted) return;
                
                if (success) {
                  Navigator.pop(context);
                  ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Franchise Added Successfully')));
                } else {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to add franchise')));
                }
              },
              child: const Text('Add'),
            ),
          ],
        ),
      ),
    );
  }
  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: Colors.grey[600]),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: GoogleFonts.inter(fontSize: 14))),
        ],
      ),
    );
  }
}
