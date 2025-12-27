import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:intl/intl.dart';
import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'payouts_provider.dart';
import '../../widgets/premium_widgets.dart';

class PayoutsTab extends ConsumerStatefulWidget {
  const PayoutsTab({super.key});

  @override
  ConsumerState<PayoutsTab> createState() => _PayoutsTabState();
}

class _PayoutsTabState extends ConsumerState<PayoutsTab> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  int _selectedMonth = DateTime.now().month;
  int _selectedYear = DateTime.now().year;

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

  Map<String, List<PayoutHistoryItem>> _groupHistoryByWeek(List<PayoutHistoryItem> history) {
    final Map<String, List<PayoutHistoryItem>> groups = {};
    for (var item in history) {
      if (item.payoutDate.isEmpty) continue;
      final date = DateTime.parse(item.payoutDate);
      final monthName = DateFormat('MMMM y').format(date); // Group by Month if showing All
      
      // If filtering by specific month, group by week. If All, group by Month.
      String key;
      if (_selectedMonth == 0) {
         key = monthName;
      } else {
         final weekStart = date.subtract(Duration(days: date.weekday - 1));
         final weekEnd = weekStart.add(const Duration(days: 6));
         key = 'Week of ${DateFormat('MMM d').format(weekStart)} - ${DateFormat('MMM d').format(weekEnd)}';
      }
      
      if (!groups.containsKey(key)) {
        groups[key] = [];
      }
      groups[key]!.add(item);
    }
    return groups;
  }

  @override
  Widget build(BuildContext context) {
    final payoutsAsync = ref.watch(payoutsProvider);

    return Container(
      color: const Color(0xFFF8FAFC),
      child: Column(
        children: [
          Container(
            color: Colors.white,
            child: Material(
              color: Colors.white,
              child: TabBar(
                controller: _tabController,
                labelColor: const Color(0xFF0F172A),
                unselectedLabelColor: Colors.grey,
                indicatorColor: const Color(0xFF0F172A),
                tabs: const [
                  Tab(text: 'Pending Payouts'),
                  Tab(text: 'Payout History'),
                ],
              ),
            ),
          ),
          Expanded(
            child: TabBarView(
              controller: _tabController,
              children: [
                // Pending Payouts Tab
                RefreshIndicator(
                  onRefresh: () => ref.read(payoutsProvider.notifier).loadData(),
                  child: payoutsAsync.when(
                    data: (payoutsState) {
                       final payouts = payoutsState.payouts;
                       if (payouts.isEmpty) {
                         return const IllustrativeState(
                           icon: Icons.payments_rounded,
                           title: 'No Pending Payouts',
                           subtitle: 'All approved partners have been paid. New pending payouts will appear here.',
                         );
                       }
                       
                       return ListView.builder(
                        padding: const EdgeInsets.all(24),
                        itemCount: payouts.length,
                        itemBuilder: (context, index) {
                          final p = payouts[index];
                          final hasBankDetails = p.bankAccountNumber != null || p.upiId != null;

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
                                      Text(p.name, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A))),
                                      if (!hasBankDetails)
                                        Container(
                                          padding: const EdgeInsets.all(6),
                                          decoration: BoxDecoration(color: const Color(0xFFF59E0B).withOpacity(0.1), shape: BoxShape.circle),
                                          child: const Icon(Icons.warning_amber_rounded, color: Color(0xFFF59E0B), size: 16),
                                        )
                                    ],
                                  ),
                                  const SizedBox(height: 4),
                                  Text('${p.planSelected.toUpperCase()} PLAN', style: GoogleFonts.inter(color: const Color(0xFF2563EB), fontWeight: FontWeight.w900, fontSize: 10,
 letterSpacing: 1)),
                                  const SizedBox(height: 16),
                                  const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                  const SizedBox(height: 16),
                                  if (p.bankName != null) _buildDetailRow(Icons.account_balance_rounded, '${p.bankName} (${p.bankAccountNumber})'),
                                  if (p.upiId != null) _buildDetailRow(Icons.account_balance_wallet_rounded, p.upiId!),
                                  if (!hasBankDetails)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 8.0),
                                      child: Text('⚠️ MISSING PAYMENT DESTINATION', style: GoogleFonts.inter(color: const Color(0xFFF59E0B), fontSize: 10, fontWeight: FontWeight.w900, letterSpacing: 0.5)),
                                    ),
                                  const SizedBox(height: 24),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      style: ElevatedButton.styleFrom(
                                        backgroundColor: hasBankDetails ? const Color(0xFF0F172A) : const Color(0xFFF1F5F9),
                                        foregroundColor: hasBankDetails ? Colors.white : const Color(0xFF94A3B8),
                                      ),
                                      onPressed: hasBankDetails ? () => _showProcessModal(context, p, payoutsState.settings) : null,
                                      child: Text(hasBankDetails ? 'Process Settlement' : 'Bank Details Required'),
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

                // History Tab
                Column(
                  children: [
                    Padding(
                      padding: const EdgeInsets.all(16.0),
                      child: Row(
                        children: [
                          Expanded(
                            child: DropdownButtonFormField<int>(
                              value: _selectedMonth,
                              decoration: const InputDecoration(
                                labelText: 'Month',
                                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                border: OutlineInputBorder(),
                              ),
                              items: [
                                const DropdownMenuItem(value: 0, child: Text('All')),
                                ...List.generate(12, (index) {
                                  return DropdownMenuItem(
                                    value: index + 1,
                                    child: Text(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]),
                                  );
                                })
                              ],
                              onChanged: (val) {
                                setState(() => _selectedMonth = val!);
                                ref.read(payoutsProvider.notifier).fetchHistory(_selectedMonth, _selectedYear);
                              },
                            ),
                          ),
                          const SizedBox(width: 16),
                          Expanded(
                            child: DropdownButtonFormField<int>(
                              value: _selectedYear,
                              decoration: const InputDecoration(
                                labelText: 'Year',
                                contentPadding: EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                                border: OutlineInputBorder(),
                              ),
                              items: [2024, 2025, 2026].map((y) => DropdownMenuItem(value: y, child: Text(y.toString()))).toList(),
                              onChanged: (val) {
                                setState(() => _selectedYear = val!);
                                ref.read(payoutsProvider.notifier).fetchHistory(_selectedMonth, _selectedYear);
                              },
                            ),
                          ),
                        ],
                      ),
                    ),
                    Expanded(
                      child: payoutsAsync.when(
                        data: (payoutsState) {
                          if (payoutsState.history.isEmpty) {
                            return const IllustrativeState(
                              icon: Icons.history_rounded,
                              title: 'Clear History',
                              subtitle: 'No payout records found for the selected period.',
                            );
                          }
                          
                          final groupedHistory = _groupHistoryByWeek(payoutsState.history);

                          return ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 24),
                            physics: const BouncingScrollPhysics(),
                            itemCount: groupedHistory.length,
                            itemBuilder: (context, index) {
                              final weekKey = groupedHistory.keys.elementAt(index);
                              final items = groupedHistory[weekKey]!;

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.fromLTRB(4, 24, 0, 12),
                                    child: Text(weekKey.toUpperCase(), style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontWeight: FontWeight.w900, fontSize: 10, letterSpacing: 1)),
                                  ),
                                  ...items.map((h) => Padding(
                                    padding: const EdgeInsets.only(bottom: 12),
                                    child: PremiumGlassCard(
                                      padding: 16,
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(h.franchiseName, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF0F172A))),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: const Color(0xFF10B981).withOpacity(0.08),
                                                  borderRadius: BorderRadius.circular(10),
                                                ),
                                                child: Text(
                                                  '₹${double.parse(h.amount).toStringAsFixed(0)}',
                                                  style: GoogleFonts.inter(fontWeight: FontWeight.w900, color: const Color(0xFF10B981), fontSize: 14),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 8),
                                          Text(
                                            DateFormat('MMM d, y • h:mm a').format(DateTime.parse(h.payoutDate).toLocal()),
                                            style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500),
                                          ),
                                          const SizedBox(height: 16),
                                          const Divider(height: 1, color: Color(0xFFF1F5F9)),
                                          const SizedBox(height: 16),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text('Revenue Share: ₹${double.parse(h.revenueReported).toStringAsFixed(0)} • ${h.ordersCount} Orders', style: GoogleFonts.inter(fontSize: 12, color: const Color(0xFF334155), fontWeight: FontWeight.w500)),
                                              IconButton(
                                                icon: Container(
                                                  padding: const EdgeInsets.all(6),
                                                  decoration: BoxDecoration(color: const Color(0xFFEF4444).withOpacity(0.1), borderRadius: BorderRadius.circular(8)),
                                                  child: const Icon(Icons.picture_as_pdf_rounded, color: Color(0xFFEF4444), size: 18),
                                                ),
                                                onPressed: () => _generateAndShareInvoice(h),
                                                tooltip: 'Download Invoice',
                                                padding: EdgeInsets.zero,
                                                constraints: const BoxConstraints(),
                                              )
                                            ],
                                          ),
                                        ],
                                      ),
                                    ),
                                  )),
                                ],
                              );
                            },
                          );
                        },
                        loading: () => const Center(child: CircularProgressIndicator()),
                        error: (err, stack) => Center(child: Text('Error: $err')),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Future<Uint8List> _generatePdf(String franchiseName, String city, String payoutId, String date, double revenue, int orders, double amount) async {
    final doc = pw.Document();
    
    // Load Logo
    final logoImage = await imageFromAssetBundle('assets/images/logo_clean.png');

    doc.addPage(
      pw.Page(
        build: (pw.Context context) {
          return pw.Column(
            crossAxisAlignment: pw.CrossAxisAlignment.start,
            children: [
              pw.Header(
                level: 0,
                child: pw.Row(
                  mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                  children: [
                    pw.Image(logoImage, width: 100),
                    pw.Text('PAYOUT INVOICE', style: pw.TextStyle(fontSize: 20, color: PdfColors.grey)),
                  ],
                ),
              ),
              pw.SizedBox(height: 20),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.start,
                    children: [
                      pw.Text('To:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold)),
                      pw.Text(franchiseName),
                      pw.Text(city),
                    ],
                  ),
                  pw.Column(
                    crossAxisAlignment: pw.CrossAxisAlignment.end,
                    children: [
                      pw.Text('Invoice #: INV-$payoutId'),
                      pw.Text('Date: $date'),
                      pw.Text('Status: PAID', style: pw.TextStyle(color: PdfColors.green)),
                    ],
                  ),
                ],
              ),
              pw.SizedBox(height: 40),
              pw.Table.fromTextArray(
                context: context,
                headers: ['Description', 'Details', 'Amount'],
                data: [
                  ['Franchise Revenue Share', 'Based on Reported Revenue', 'Rs. ${revenue.toStringAsFixed(0)}'],
                  ['Total Orders Processed', '$orders Orders', '-'],
                  ['Net Payout Amount', '', 'Rs. ${amount.toStringAsFixed(0)}'],
                ],
              ),
              pw.SizedBox(height: 20),
              pw.Divider(),
              pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.end,
                children: [
                  pw.Text('Total Paid: ', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold)),
                  pw.Text('Rs. ${amount.toStringAsFixed(0)}', style: pw.TextStyle(fontSize: 14, fontWeight: pw.FontWeight.bold, color: PdfColors.green)),
                ],
              ),
              pw.SizedBox(height: 40),
              pw.Footer(
                title: pw.Text('Thank you for being a partner with The Kada!', style: const pw.TextStyle(fontSize: 10, color: PdfColors.grey)),
              ),
            ],
          );
        },
      ),
    );
    return await doc.save();
  }

  Future<void> _generateAndShareInvoice(PayoutHistoryItem payout) async {
    final pdfBytes = await _generatePdf(
      payout.franchiseName,
      payout.city,
      payout.id.toString(),
      DateFormat('MMM d, y').format(DateTime.parse(payout.payoutDate)),
      double.parse(payout.revenueReported),
      payout.ordersCount,
      double.parse(payout.amount),
    );
    await Printing.sharePdf(bytes: pdfBytes, filename: 'invoice_${payout.id}.pdf');
  }

  void _showProcessModal(BuildContext context, FranchisePayout p, Map<String, dynamic> settings) {
    final revenueController = TextEditingController();
    final ordersController = TextEditingController();
    
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom, left: 16, right: 16, top: 16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('Process Payout for ${p.name}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18)),
            const SizedBox(height: 16),
            TextField(controller: revenueController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Admin Commission Earned (₹)')),
            TextField(controller: ordersController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Total Orders Count')),
            const SizedBox(height: 20),
             ElevatedButton(
              onPressed: () {
                  _calculateAndShowConfirmation(context, p, revenueController.text, ordersController.text, settings);
              },
              child: const Text('Calculate'),
            ),
             const SizedBox(height: 20),
          ],
        ),
      ),
    );
  }
  
  void _calculateAndShowConfirmation(BuildContext context, FranchisePayout p, String commissionStr, String ordStr, Map<String, dynamic> settings) {
      double adminCommission = double.tryParse(commissionStr) ?? 0;
      int orders = int.tryParse(ordStr) ?? 0;
      
      // Get plan share percentage (default to 'free' plan values)
      double sharePercent = 30; // Free plan default
      if (p.planSelected == 'standard') sharePercent = double.tryParse(settings['pricing_standard_share']?.toString() ?? '40') ?? 40;
      if (p.planSelected == 'premium') sharePercent = double.tryParse(settings['pricing_premium_share']?.toString() ?? '50') ?? 50;
      if (p.planSelected == 'elite') sharePercent = double.tryParse(settings['pricing_elite_share']?.toString() ?? '70') ?? 70;

      // FORMULA (matching franchise stats API):
      // Franchise Share = Admin Commission × Plan Share %
      // Net Payout = Franchise Share - Platform Charges
      double franchiseShare = (adminCommission * sharePercent) / 100;
      
      double platformCharge = double.tryParse(settings['payout_platform_charge']?.toString() ?? '7') ?? 7;
      double totalDeduction = orders * platformCharge;
      double netPayout = (franchiseShare - totalDeduction) < 0 ? 0 : (franchiseShare - totalDeduction);

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Confirm Payout'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
               Text('Admin Commission: ₹$adminCommission'),
               Text('Plan Share: $sharePercent%'),
               Text('Franchise Share: ₹${franchiseShare.toStringAsFixed(2)}'),
               Text('Platform Charges: ₹${totalDeduction.toStringAsFixed(2)} ($orders orders x ₹$platformCharge)'),
               const Divider(),
               Text('NET PAYOUT: ₹${netPayout.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 18, color: Colors.green)),
               const SizedBox(height: 10),
               const Text('📧 Invoice will be sent to franchise owner.', style: TextStyle(fontSize: 12, fontStyle: FontStyle.italic)),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () async {
                  Navigator.pop(context); // Close dialog
                  Navigator.pop(context); // Close modal
                  
                  // Generate PDF for Email
                  final pdfBytes = await _generatePdf(
                    p.name,
                    'Kochi', // Default city if not available in this view, strictly backend knows better but fine for PDF
                    'NEW',
                    DateFormat('MMM d, y').format(DateTime.now()),
                    adminCommission,
                    orders,
                    netPayout
                   );
                   
                  final String base64Pdf = base64Encode(pdfBytes);

                  final success = await ref.read(payoutsProvider.notifier).processPayout(
                    franchiseId: p.id,
                    amount: netPayout,
                    revenue: adminCommission,
                    orders: orders,
                    sharePercentage: sharePercent,
                    platformFee: platformCharge,
                    totalDeduction: totalDeduction,
                    invoiceBase64: base64Pdf,
                  );
                  
                  if (success && context.mounted) {
                     ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payout Processed & Invoice Sent!')));
                     ref.read(payoutsProvider.notifier).loadData();
                  }
              },
              child: const Text('Confirm & Process'),
            )
          ],
        ),
      );
  }

  Widget _buildDetailRow(IconData icon, String text) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Icon(icon, size: 16, color: const Color(0xFF64748B)),
          const SizedBox(width: 8),
          Expanded(child: Text(text, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF334155)))),
        ],
      ),
    );
  }
}
