import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../requests/requests_provider.dart';
import '../payouts/payouts_provider.dart';

class FranchisesTab extends ConsumerWidget {
  const FranchisesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(requestsProvider);

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: RefreshIndicator(
        onRefresh: () => ref.read(requestsProvider.notifier).fetchRequests(),
        child: requestsAsync.when(
          data: (requests) {
            // Filter for Approved/Active franchises only
            final activeFranchises = requests.where((r) => r.status == 'approved').toList();

            if (activeFranchises.isEmpty) {
              return const Center(child: Text('No active franchises found.'));
            }

            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: activeFranchises.length,
              itemBuilder: (context, index) {
                final franchise = activeFranchises[index];
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
                              franchise.name,
                              style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                              decoration: BoxDecoration(
                                color: Colors.green.withOpacity(0.1),
                                borderRadius: BorderRadius.circular(8),
                                border: Border.all(color: Colors.green),
                              ),
                              child: const Text('ACTIVE', style: TextStyle(color: Colors.green, fontSize: 10, fontWeight: FontWeight.bold)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 8),
                        _buildInfoRow(Icons.location_on, franchise.city),
                        _buildInfoRow(Icons.email, franchise.email),
                        _buildInfoRow(Icons.phone, franchise.phone),
                        const Divider(),
                        SizedBox(
                          width: double.infinity,
                          child: OutlinedButton.icon(
                            icon: const Icon(Icons.edit, size: 16),
                            label: const Text('Edit Details'),
                            onPressed: () => _showEditDialog(context, ref, franchise),
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
          error: (err, stack) => Center(child: Text('Error: $err')),
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

  void _showEditDialog(BuildContext context, WidgetRef ref, FranchiseRequest f) {
    final nameCtrl = TextEditingController(text: f.name);
    final emailCtrl = TextEditingController(text: f.email);
    final phoneCtrl = TextEditingController(text: f.phone);
    final cityCtrl = TextEditingController(text: f.city);
    final upiCtrl = TextEditingController(text: f.upiId);
    final accountCtrl = TextEditingController(text: f.bankAccountNumber);
    final ifscCtrl = TextEditingController(text: f.ifscCode);
    final bankNameCtrl = TextEditingController(text: f.bankName);
    final passCtrl = TextEditingController();
    
    String plan = f.planSelected;
    const allowedPlans = ['free', 'standard', 'premium', 'elite'];
    if (!allowedPlans.contains(plan)) {
      print('WARNING: Invalid plan value from DB: "$plan". Defaulting to "free".');
      plan = 'free';
    } else {
      print('Editing plan: "$plan"');
    }
    
    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setState) => AlertDialog(
          title: const Text('Edit Franchise'),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name', isDense: true)),
                TextField(controller: emailCtrl, decoration: const InputDecoration(labelText: 'Email', isDense: true)),
                TextField(controller: phoneCtrl, decoration: const InputDecoration(labelText: 'Phone', isDense: true)),
                TextField(controller: cityCtrl, decoration: const InputDecoration(labelText: 'City', isDense: true)),
                const SizedBox(height: 12),
                DropdownButtonFormField<String>(
                  value: plan,
                  decoration: const InputDecoration(labelText: 'Plan', isDense: true),
                  items: const [
                    DropdownMenuItem(value: 'free', child: Text('Starter (Free)')),
                    DropdownMenuItem(value: 'standard', child: Text('Standard')),
                    DropdownMenuItem(value: 'premium', child: Text('Premium')),
                    DropdownMenuItem(value: 'elite', child: Text('Elite')),
                  ],
                  onChanged: (val) => setState(() => plan = val!),
                ),
                const SizedBox(height: 16),
                const Text('Banking Details', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                TextField(controller: upiCtrl, decoration: const InputDecoration(labelText: 'UPI ID', isDense: true)),
                TextField(controller: accountCtrl, decoration: const InputDecoration(labelText: 'Account No', isDense: true)),
                TextField(controller: ifscCtrl, decoration: const InputDecoration(labelText: 'IFSC Code', isDense: true)),
                TextField(controller: bankNameCtrl, decoration: const InputDecoration(labelText: 'Bank Name', isDense: true)),
                const SizedBox(height: 16),
                const Text('Security', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 13)),
                TextField(
                  controller: passCtrl,
                  decoration: const InputDecoration(
                    labelText: 'New Password (Optional)', 
                    isDense: true,
                    helperText: 'Leave empty to keep current password'
                  ),
                  obscureText: true,
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
              style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: Colors.white),
              onPressed: () async {
                final data = {
                  'name': nameCtrl.text,
                  'email': emailCtrl.text,
                  'phone': phoneCtrl.text,
                  'city': cityCtrl.text,
                  'plan_selected': plan,
                  'status': f.status,
                  'upi_id': upiCtrl.text,
                  'bank_account_number': accountCtrl.text,
                  'ifsc_code': ifscCtrl.text,
                  'bank_name': bankNameCtrl.text,
                };
                
                if (passCtrl.text.isNotEmpty) {
                  data['password'] = passCtrl.text;
                }
                
                Navigator.pop(context);
                
                final success = await ref.read(requestsProvider.notifier).updateFranchise(f.id, data);
                 if (success && context.mounted) {
                   ref.read(payoutsProvider.notifier).loadData();
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Franchise Updated Successfully')));
                 } else if (context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to update')));
                 }
              },
              child: const Text('Save'),
            ),
          ],
        ),
      ),
    );
  }
}
