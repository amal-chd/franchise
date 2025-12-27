import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../requests/requests_provider.dart';
import '../payouts/payouts_provider.dart';
import '../common/zones_provider.dart';
import '../../widgets/premium_widgets.dart';

class FranchisesTab extends ConsumerWidget {
  const FranchisesTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(requestsProvider);
    final zonesAsync = ref.watch(zonesProvider);
    final zones = zonesAsync.asData?.value ?? [];
    
    print('DEBUG: Zones loaded: ${zones.length}');
    zones.forEach((z) => print('  Zone ${z.id}: ${z.name}'));

    return Container(
      color: const Color(0xFFF8FAFC),
      child: RefreshIndicator(
        onRefresh: () => ref.read(requestsProvider.notifier).fetchRequests(),
        child: requestsAsync.when(
          data: (requests) {
            // Filter for Approved/Active franchises only
            final activeFranchises = requests.where((r) => r.status == 'approved').toList();

            if (activeFranchises.isEmpty) {
              return const IllustrativeState(
                icon: Icons.store_rounded,
                title: 'No Active Partners',
                subtitle: 'Your franchise network is currently empty. Approved partners will appear here.',
              );
            }

            return ListView.builder(
              padding: const EdgeInsets.all(24),
              itemCount: activeFranchises.length,
              itemBuilder: (context, index) {
                final franchise = activeFranchises[index];
                return Padding(
                  padding: const EdgeInsets.only(bottom: 24),
                  child: PremiumGlassCard(
                    padding: 20,
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Text(
                              franchise.name,
                              style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A)),
                            ),
                            Container(
                              padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                              decoration: BoxDecoration(
                                color: const Color(0xFF10B981).withOpacity(0.1),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text('ACTIVE', style: GoogleFonts.inter(color: const Color(0xFF10B981), fontSize: 10, fontWeight: FontWeight.w900)),
                            ),
                          ],
                        ),
                        const SizedBox(height: 16),
                        _buildInfoRow(Icons.location_on_outlined, franchise.city),
                        _buildInfoRow(Icons.email_outlined, franchise.email),
                        _buildInfoRow(Icons.phone_outlined, franchise.phone),
                        const SizedBox(height: 16),
                        const Divider(height: 1, color: Color(0xFFF1F5F9)),
                        const SizedBox(height: 16),
                        SizedBox(
                          width: double.infinity,
                          child: ElevatedButton(
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFFF8FAFC),
                              foregroundColor: const Color(0xFF334155),
                              elevation: 0,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            onPressed: () => _showEditDialog(context, ref, franchise, zones),
                            child: Row(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.edit_note_rounded, size: 20),
                                const SizedBox(width: 8),
                                Text('Manage Partner', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 14)),
                              ],
                            ),
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

  void _showEditDialog(BuildContext context, WidgetRef ref, FranchiseRequest f, List<Zone> zones) {
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
    int? selectedZoneId = f.zoneId;

    const allowedPlans = ['free', 'standard', 'premium', 'elite'];
    if (!allowedPlans.contains(plan)) {
      plan = 'free';
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
                const SizedBox(height: 12),
                // Zone Dropdown
                DropdownButtonFormField<int>(
                  value: zones.any((z) => z.id == selectedZoneId) ? selectedZoneId : null,
                  decoration: const InputDecoration(labelText: 'Zone', isDense: true),
                  items: [
                   const DropdownMenuItem<int>(value: null, child: Text('Select Zone')),
                    // Deduplicate zones by ID before mapping to DropdownMenuItem
                    ...zones.fold<Map<int, Zone>>({}, (map, zone) {
                      map[zone.id] = zone;
                      return map;
                    }).values.map((z) => DropdownMenuItem<int>(
                      value: z.id,
                      child: Text(z.name),
                    )),
                  ],
                  onChanged: (val) => setState(() => selectedZoneId = val),
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
                  'zone_id': selectedZoneId,
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
