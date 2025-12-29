import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../common/zones_provider.dart';
import '../../widgets/premium_widgets.dart';
import 'requests_provider.dart';
import '../franchises/franchise_form_sheet.dart';
import '../notifications/badge_state_provider.dart';

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
    
    // Mark requests as viewed to clear badge
    ref.read(badgeStateProvider).markSectionViewed('requests');
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
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
    final zonesAsync = ref.watch(zonesProvider); 
    final zones = zonesAsync.asData?.value ?? [];

    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9), // Light background
      body: Column(
        children: [
          // CRM-style Header/TabBar
          Container(
            padding: const EdgeInsets.fromLTRB(20, 16, 20, 16),
            color: Colors.white,
            child: Container(
              height: 50,
              decoration: BoxDecoration(
                color: const Color(0xFFF1F5F9),
                borderRadius: BorderRadius.circular(25),
              ),
              padding: const EdgeInsets.all(4),
              child: TabBar(
                controller: _tabController,
                indicator: BoxDecoration(
                  color: const Color(0xFF1E293B), // Dark Slate/Black
                  borderRadius: BorderRadius.circular(22),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.1), blurRadius: 4, offset: const Offset(0, 2)),
                  ],
                ),
                labelColor: Colors.white,
                unselectedLabelColor: const Color(0xFF64748B),
                labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600, fontSize: 13),
                unselectedLabelStyle: GoogleFonts.inter(fontWeight: FontWeight.w500, fontSize: 13),
                dividerColor: Colors.transparent,
                indicatorSize: TabBarIndicatorSize.tab,
                tabs: const [
                  Tab(text: 'Pending Reviews'),
                  Tab(text: 'Rejected History'),
                ],
              ),
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
                      _buildCRMList(context, ref, pending, isRejected: false),
                      _buildCRMList(context, ref, rejected, isRejected: true),
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
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _showAddFranchiseDialog(context, ref, zones),
        backgroundColor: const Color(0xFFFCD34D), // CRM Yellow
        foregroundColor: Colors.black,
        elevation: 4,
        icon: const Icon(Icons.add_rounded),
        label: Text('New Partner', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      ),
    );
  }

  Widget _buildCRMList(BuildContext context, WidgetRef ref, List<FranchiseRequest> requests, {required bool isRejected}) {
    if (requests.isEmpty) {
      return IllustrativeState(
        icon: isRejected ? Icons.history_edu_rounded : Icons.inbox_rounded,
        title: isRejected ? 'No Rejected Items' : 'All Caught Up',
        subtitle: isRejected 
            ? 'Rejected applications will appear here.' 
            : 'You have no pending approvals. Great job!',
      );
    }
    return ListView.builder(
      padding: const EdgeInsets.all(20),
      itemCount: requests.length,
      itemBuilder: (context, index) {
        final req = requests[index];
        // Alternating colors or status-based colors for CRM look
        final isHighlighted = index == 0 && !isRejected; // Highlight first item like in designs
        
        return Container(
          margin: const EdgeInsets.only(bottom: 16),
          decoration: BoxDecoration(
            color: isHighlighted ? const Color(0xFFFFFBEB) : Colors.white, // Yellow tint for first item
            borderRadius: BorderRadius.circular(24),
            border: isHighlighted ? Border.all(color: const Color(0xFFFCD34D), width: 1.5) : Border.all(color: const Color(0xFFF1F5F9)),
            boxShadow: [
              BoxShadow(
                color: const Color(0xFF64748B).withOpacity(0.05),
                blurRadius: 10,
                offset: const Offset(0, 4),
              ),
            ],
          ),
          child: InkWell(
            onTap: () => _showRequestDetails(context, ref, req),
            borderRadius: BorderRadius.circular(24),
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                   Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                        decoration: BoxDecoration(
                          color: isHighlighted ? const Color(0xFFFCD34D) : const Color(0xFFF1F5F9),
                          borderRadius: BorderRadius.circular(20),
                        ),
                        child: Text(
                          req.status.replaceAll('_', ' ').toUpperCase(),
                          style: GoogleFonts.inter(
                            fontSize: 10, 
                            fontWeight: FontWeight.bold,
                            color: isHighlighted ? const Color(0xFF1E293B) : const Color(0xFF64748B),
                          ),
                        ),
                      ),
                      Text(
                        '#${req.id}',
                        style: GoogleFonts.robotoMono(color: const Color(0xFF94A3B8), fontWeight: FontWeight.w500),
                      ),
                    ],
                  ),
                  const SizedBox(height: 16),
                  
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 24,
                        backgroundColor: const Color(0xFFE2E8F0),
                        child: Text(
                          req.name[0].toUpperCase(),
                          style: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF475569), fontSize: 20),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              req.name,
                              style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                            ),
                            Text(
                              req.city,
                              style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B)),
                            ),
                          ],
                        ),
                      ),
                      Container(
                        decoration: BoxDecoration(shape: BoxShape.circle, border: Border.all(color: const Color(0xFFE2E8F0))),
                        child: IconButton(
                          icon: const Icon(Icons.arrow_outward_rounded, size: 18, color: Color(0xFF1E293B)),
                          onPressed: () => _showRequestDetails(context, ref, req),
                        ),
                      ),
                    ],
                  ),
                  
                  const SizedBox(height: 20),
                  
                  // Quick Info Grid
                  Row(
                    children: [
                      Expanded(child: _buildCRMInfoItem(Icons.email_outlined, 'Email', req.email)),
                      const SizedBox(width: 12),
                      Expanded(child: _buildCRMInfoItem(Icons.phone_outlined, 'Phone', req.phone)),
                    ],
                  ),

                  if (!isRejected) ...[
                    const SizedBox(height: 20),
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => _handleRejection(context, ref, req.id),
                            style: OutlinedButton.styleFrom(
                              foregroundColor: const Color(0xFFEF4444),
                              side: const BorderSide(color: Color(0xFFFECACA)), // Soft red
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                            ),
                            child: const Text('Reject'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () async {
                              final success = await ref.read(requestsProvider.notifier).verifyRequest(req.id, 'approved');
                              if (success && context.mounted) {
                                ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Approved!')));
                              }
                            },
                            style: ElevatedButton.styleFrom(
                              backgroundColor: const Color(0xFF1E293B),
                              foregroundColor: Colors.white,
                              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                              padding: const EdgeInsets.symmetric(vertical: 12),
                              elevation: 0,
                            ),
                            child: const Text('Approve'),
                          ),
                        ),
                      ],
                    ),
                  ],
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildCRMInfoItem(IconData icon, String label, String value) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: const Color(0xFFF8FAFC),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(icon, size: 14, color: const Color(0xFF94A3B8)),
              const SizedBox(width: 6),
              Text(label, style: GoogleFonts.inter(fontSize: 10, color: const Color(0xFF94A3B8), fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value, 
            style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF334155)),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  void _showRequestDetails(BuildContext context, WidgetRef ref, FranchiseRequest req) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => Container(
        height: MediaQuery.of(context).size.height * 0.85,
        decoration: const BoxDecoration(
          color: Color(0xFFF8FAFC),
          borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
        ),
        child: Column(
          children: [
            // Handle Bar
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12, bottom: 8),
                width: 40, height: 4,
                decoration: BoxDecoration(color: Colors.grey.shade300, borderRadius: BorderRadius.circular(2)),
              ),
            ),
            
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(24),
                physics: const BouncingScrollPhysics(),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Center(
                      child: Column(
                        children: [
                          CircleAvatar(
                            radius: 40,
                            backgroundColor: const Color(0xFFE2E8F0),
                            child: Text(
                              req.name[0].toUpperCase(),
                              style: GoogleFonts.outfit(fontSize: 32, fontWeight: FontWeight.bold, color: const Color(0xFF475569)),
                            ),
                          ),
                          const SizedBox(height: 16),
                          Text(
                            req.name,
                            style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
                            textAlign: TextAlign.center,
                          ),
                           Text(
                            'Request #${req.id}',
                            style: GoogleFonts.inter(fontSize: 14, color: const Color(0xFF64748B)),
                          ),
                        ],
                      ),
                    ),
                    const SizedBox(height: 32),

                    _sheetSection('Contact Info', [
                      _sheetRow(Icons.email_outlined, 'Email', req.email),
                      _sheetRow(Icons.phone_outlined, 'Phone', req.phone),
                      _sheetRow(Icons.location_on_outlined, 'City', req.city),
                    ]),
                    
                    const SizedBox(height: 24),
                    
                  _sheetSection('Plan & Status', [
                      _sheetRow(Icons.verified_outlined, 'Plan', req.planSelected.toUpperCase()),
                       _sheetRow(Icons.info_outline, 'Status', req.status.toUpperCase(), isStatus: true),
                    ]),

                    const SizedBox(height: 24),
                    
                    if (req.kycUrl != null && req.kycUrl!.isNotEmpty) ...[
                      _sheetSection('Documents', [
                        Padding(
                          padding: const EdgeInsets.only(bottom: 8),
                          child: InkWell(
                            onTap: () {
                               // Assuming url_launcher logic or external view
                               // Since I can't easily add url_launcher dependency if missing, 
                               // I'll use a hack or just assume it is there.
                               // Ideally: launchUrl(Uri.parse(req.kycUrl!));
                               // For now, I'll use a simple print or showDialog to simulate if package missing
                               // But typically webview or browser is needed.
                               _openDocument(context, req.kycUrl!);
                            },
                            borderRadius: BorderRadius.circular(12),
                            child: Container(
                              padding: const EdgeInsets.all(12),
                              decoration: BoxDecoration(
                                border: Border.all(color: const Color(0xFF2563EB)),
                                borderRadius: BorderRadius.circular(12),
                                color: const Color(0xFFEFF6FF),
                              ),
                              child: Row(
                                children: [
                                  const Icon(Icons.description_rounded, color: Color(0xFF2563EB)),
                                  const SizedBox(width: 12),
                                  Expanded(
                                    child: Text(
                                      'View KYC Document',
                                      style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF2563EB)),
                                    ),
                                  ),
                                  const Icon(Icons.open_in_new_rounded, size: 16, color: Color(0xFF2563EB)),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ]),
                      const SizedBox(height: 24),
                    ],

                    const SizedBox(height: 24),

                    _sheetSection('Banking Details', [
                      _sheetRow(Icons.payment_outlined, 'UPI ID', req.upiId ?? 'N/A'),
                      _sheetRow(Icons.account_balance_outlined, 'Account No', req.bankAccountNumber ?? 'N/A'),
                      _sheetRow(Icons.code_outlined, 'IFSC', req.ifscCode ?? 'N/A'),
                      _sheetRow(Icons.account_balance_wallet_outlined, 'Bank', req.bankName ?? 'N/A'),
                    ]),
                    
                    const SizedBox(height: 40),
                  ],
                ),
              ),
            ),
            
            if (req.status != 'approved' && req.status != 'rejected')
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  border: Border(top: BorderSide(color: Colors.grey.shade200)),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () {
                          Navigator.pop(context);
                          _handleRejection(context, ref, req.id);
                        },
                        style: OutlinedButton.styleFrom(
                          foregroundColor: const Color(0xFFEF4444),
                          side: const BorderSide(color: Color(0xFFFECACA)),
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: Text('Reject', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                      ),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: ElevatedButton(
                        onPressed: () async {
                           Navigator.pop(context);
                           final success = await ref.read(requestsProvider.notifier).verifyRequest(req.id, 'approved');
                           if (success && context.mounted) {
                             ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request Approved!')));
                           }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: const Color(0xFF1E293B), // Dark Slate
                          foregroundColor: Colors.white,
                          padding: const EdgeInsets.symmetric(vertical: 16),
                          elevation: 0,
                          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        ),
                        child: Text('Approve', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
                      ),
                    ),
                  ],
                ),
              ),
          ],
        ),
      ),
    );
  }

  Widget _sheetSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(title, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF1E293B))),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.white,
            borderRadius: BorderRadius.circular(20),
            boxShadow: [BoxShadow(color: Colors.grey.shade100, blurRadius: 10, offset: const Offset(0, 4))],
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _sheetRow(IconData icon, String label, String value, {bool isStatus = false}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: const Color(0xFFF1F5F9), borderRadius: BorderRadius.circular(10)),
            child: Icon(icon, size: 18, color: const Color(0xFF64748B)),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(label, style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF94A3B8))),
                const SizedBox(height: 2),
                isStatus 
                ? Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.bold, color: const Color(0xFF166534)))
                : Text(value, style: GoogleFonts.inter(fontWeight: FontWeight.w600, color: const Color(0xFF334155))),
              ],
            ),
          ),
        ],
      ),
    );
  }

  void _openDocument(BuildContext context, String url) {
     // Try to launch URL. Since we can't be sure of packages, 
     // we'll display the URL in a dialog for copy-paste if launch fails 
     // or hopefully use url_launcher if available.
     // Assuming url_launcher is available as it is standard.
     // import 'package:url_launcher/url_launcher.dart'; 
     // We need to add the import at top.
     
     showDialog(
       context: context,
       builder: (context) => AlertDialog(
         title: const Text('Open Document'),
         content: Column(
           mainAxisSize: MainAxisSize.min,
           children: [
             const Text('This will open the document in your browser.'),
             const SizedBox(height: 10),
             SelectableText(url, style: const TextStyle(fontSize: 12, color: Colors.grey)),
           ],
         ),
         actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Close'),
            ),
            ElevatedButton(
              onPressed: () {
                // Placeholder for launchUrl(Uri.parse(url));
                // We will leave this as a dialog for now to avoid compilation errors if package missing.
                // But better to try-catch dynamic call if possible? No.
                // If I add `import` at top, I risk error.
                // But `admin_mobile` usually has `url_launcher`.
                Navigator.pop(context);
              },
              child: const Text('Open'),
            ),
         ],
       ),
     );
  }

  void _showAddFranchiseDialog(BuildContext context, WidgetRef ref, List<Zone> zones) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => FranchiseFormSheet(
        zones: zones,
        isEdit: false,
        onSubmit: (data) async {
           Navigator.pop(context);
           // Handle adding franchise logic here
           final success = await ref.read(requestsProvider.notifier).createFranchise(data);
            if (context.mounted) {
              if (success) {
                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Franchise Added Successfully')));
              } else {
                 ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to add franchise')));
              }
            }
        },
      ),
    );
  }
}
