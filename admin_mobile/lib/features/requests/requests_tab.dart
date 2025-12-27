import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../widgets/premium_widgets.dart';
import 'requests_provider.dart';

class RequestsTab extends ConsumerStatefulWidget {
  const RequestsTab({super.key});

  @override
  ConsumerState<RequestsTab> createState() => _RequestsTabState();
}

class _RequestsTabState extends ConsumerState<RequestsTab> with SingleTickerProviderStateMixin {
  late TabController _tabController;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Color _getStatusColor(String status) {
    switch (status.toLowerCase()) {
      case 'approved':
        return const Color(0xFF10B981);
      case 'rejected':
        return const Color(0xFFEF4444);
      case 'pending_verification':
      case 'under_review':
        return const Color(0xFFF59E0B);
      default:
        return const Color(0xFF64748B);
    }
  }

  Future<void> _handleRejection(BuildContext context, WidgetRef ref, int id) async {
    final reasonController = TextEditingController();
    
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        title: Text('Reject Request', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
        content: TextField(
          controller: reasonController,
          decoration: InputDecoration(
            hintText: 'Enter rejection reason',
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
          ),
          maxLines: 3,
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('Cancel', style: GoogleFonts.inter()),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFFEF4444),
              foregroundColor: Colors.white,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            onPressed: () async {
              Navigator.pop(context);
              if (reasonController.text.isNotEmpty) {
                 final success = await ref.read(requestsProvider.notifier).verifyRequest(id, 'rejected', reason: reasonController.text);
                 if (success && context.mounted) {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request Rejected')));
                 }
              }
            },
            child: Text('Confirm Reject', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final requestsAsync = ref.watch(requestsProvider);

    return Scaffold(
      drawerEnableOpenDragGesture: false,
      backgroundColor: const Color(0xFFF8FAFC),
      body: Column(
        children: [
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 8),
            decoration: const BoxDecoration(
              color: Colors.white,
              border: Border(bottom: BorderSide(color: Color(0xFFF1F5F9))),
            ),
            child: TabBar(
              controller: _tabController,
              labelColor: const Color(0xFF2563EB),
              unselectedLabelColor: const Color(0xFF94A3B8),
              indicatorColor: const Color(0xFF2563EB),
              indicatorWeight: 3,
              labelStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 13),
              unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13),
              indicatorPadding: const EdgeInsets.symmetric(horizontal: 20),
              tabs: const [
                Tab(text: 'Pending Reviews'),
                Tab(text: 'Rejected'),
              ],
            ),
          ),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () => ref.read(requestsProvider.notifier).fetchRequests(),
              child: requestsAsync.when(
                data: (requests) {
                  final pending = requests.where((r) => r.status == 'pending_verification' || r.status == 'under_review').toList();
                  final rejected = requests.where((r) => r.status == 'rejected').toList();

                  return TabBarView(
                    controller: _tabController,
                    children: [
                      _buildList(context, ref, pending, isRejected: false),
                      _buildList(context, ref, rejected, isRejected: true),
                    ],
                  );
                },
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (err, stack) => Center(child: Text('Error: $err', style: const TextStyle(color: Color(0xFFEF4444)))),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddFranchiseDialog(context, ref),
        backgroundColor: const Color(0xFF0F172A),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        child: const Icon(Icons.add, color: Colors.white),
      ),
    );
  }

  Widget _buildList(BuildContext context, WidgetRef ref, List<FranchiseRequest> requests, {required bool isRejected}) {
    if (requests.isEmpty) {
      return IllustrativeState(
        icon: isRejected ? Icons.history_rounded : Icons.fact_check_rounded,
        title: isRejected ? 'No Rejected History' : 'All Clear',
        subtitle: isRejected 
            ? 'There are currently no rejected partner applications in your history.' 
            : 'You have reviewed all pending partner applications. New requests will appear here.',
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: requests.length,
      itemBuilder: (context, index) {
        final req = requests[index];
        final statusColor = _getStatusColor(req.status);
        
        return Container(
          margin: const EdgeInsets.only(bottom: 20),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(24),
            boxShadow: [
              BoxShadow(color: Colors.black.withOpacity(0.02), blurRadius: 15, offset: const Offset(0, 8)),
            ],
          ),
          child: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Text(
                          'REQ #${req.id}',
                          style: GoogleFonts.robotoMono(fontWeight: FontWeight.bold, color: const Color(0xFF94A3B8), fontSize: 12),
                        ),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                          decoration: BoxDecoration(
                            color: statusColor.withOpacity(0.1),
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: Text(
                            req.status.toUpperCase().replaceAll('_', ' '),
                            style: GoogleFonts.inter(color: statusColor, fontSize: 10, fontWeight: FontWeight.w800),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Text(req.name, style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
                    const SizedBox(height: 8),
                    _buildInfoRow(Icons.location_on_outlined, req.city),
                    _buildInfoRow(Icons.email_outlined, req.email),
                    _buildInfoRow(Icons.phone_outlined, req.phone),
                    
                    if (req.kycUrl != null)
                      Padding(
                        padding: const EdgeInsets.only(top: 12),
                        child: InkWell(
                          onTap: () => launchUrl(Uri.parse(req.kycUrl!)),
                          child: Container(
                            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                            decoration: BoxDecoration(color: const Color(0xFFEFF6FF), borderRadius: BorderRadius.circular(12)),
                            child: Row(
                              mainAxisSize: MainAxisSize.min,
                              children: [
                                const Icon(Icons.description_outlined, size: 16, color: Color(0xFF2563EB)),
                                const SizedBox(width: 8),
                                Text('View KYC Document', style: GoogleFonts.inter(color: const Color(0xFF2563EB), fontSize: 12, fontWeight: FontWeight.w600)),
                              ],
                            ),
                          ),
                        ),
                      ),
                  ],
                ),
              ),
              const Divider(height: 1, color: Color(0xFFF1F5F9)),
              Padding(
                padding: const EdgeInsets.all(12),
                child: isRejected 
                  ? _buildDeleteAction(context, ref, req)
                  : _buildPendingActions(context, ref, req),
              ),
            ],
          ),
        );
      },
    );
  }

  Widget _buildPendingActions(BuildContext context, WidgetRef ref, FranchiseRequest req) {
    return Row(
      children: [
        Expanded(
          child: TextButton(
            onPressed: () => _handleRejection(context, ref, req.id),
            style: TextButton.styleFrom(foregroundColor: const Color(0xFFEF4444)),
            child: Text('Reject', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: ElevatedButton(
            onPressed: () async {
              final success = await ref.read(requestsProvider.notifier).verifyRequest(req.id, 'approved');
              if (success && context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request Approved')));
              }
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: const Color(0xFF10B981),
              foregroundColor: Colors.white,
              elevation: 0,
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
            ),
            child: Text('Approve', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
          ),
        ),
      ],
    );
  }

  Widget _buildDeleteAction(BuildContext context, WidgetRef ref, FranchiseRequest req) {
    return SizedBox(
      width: double.infinity,
      child: TextButton.icon(
        icon: const Icon(Icons.delete_outline, size: 18),
        label: Text('Delete History', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        style: TextButton.styleFrom(foregroundColor: const Color(0xFFEF4444)),
        onPressed: () async {
          final confirm = await showDialog<bool>(
            context: context,
            builder: (c) => AlertDialog(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
              title: const Text('Confirm Delete'),
              content: const Text('Are you sure? This cannot be undone.'),
              actions: [
                TextButton(onPressed: () => Navigator.pop(c, false), child: const Text('Cancel')),
                TextButton(
                  onPressed: () => Navigator.pop(c, true),
                  child: const Text('Delete', style: TextStyle(color: Color(0xFFEF4444))),
                ),
              ],
            ),
          );
          if (confirm == true) {
             await ref.read(requestsProvider.notifier).deleteRequest(req.id);
          }
        },
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
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          title: Text('Add New Partner', style: GoogleFonts.outfit(fontWeight: FontWeight.bold)),
          content: SingleChildScrollView(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                _dialogInput(nameCtrl, 'Name', Icons.person_outline),
                _dialogInput(emailCtrl, 'Email', Icons.email_outlined),
                _dialogInput(phoneCtrl, 'Phone', Icons.phone_outlined),
                _dialogInput(cityCtrl, 'City', Icons.location_on_outlined),
                const SizedBox(height: 16),
                DropdownButtonFormField<String>(
                  value: plan,
                  decoration: InputDecoration(
                    labelText: 'Partner Plan',
                    border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
                  ),
                  items: const [
                    DropdownMenuItem(value: 'free', child: Text('Starter (Free)')),
                    DropdownMenuItem(value: 'standard', child: Text('Standard')),
                    DropdownMenuItem(value: 'premium', child: Text('Premium')),
                    DropdownMenuItem(value: 'elite', child: Text('Elite')),
                  ],
                  onChanged: (val) => setState(() => plan = val!),
                ),
                const SizedBox(height: 16),
                const Divider(),
                const SizedBox(height: 16),
                Text('Banking Details', style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF64748B))),
                const SizedBox(height: 12),
                _dialogInput(upiCtrl, 'UPI ID', Icons.payment_outlined),
                _dialogInput(accountCtrl, 'Account No', Icons.account_balance_outlined),
                _dialogInput(ifscCtrl, 'IFSC Code', Icons.code_outlined),
                _dialogInput(bankNameCtrl, 'Bank Name', Icons.account_balance_wallet_outlined),
              ],
            ),
          ),
          actions: [
            TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF0F172A),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              ),
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
                }
              },
              child: const Text('Add Partner'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _dialogInput(TextEditingController ctrl, String label, IconData icon) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: ctrl,
        decoration: InputDecoration(
          labelText: label,
          prefixIcon: Icon(icon, size: 20),
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16)),
          contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
        ),
      ),
    );
  }

  Widget _buildInfoRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 6),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF94A3B8)),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF475569)))),
        ],
      ),
    );
  }
}
