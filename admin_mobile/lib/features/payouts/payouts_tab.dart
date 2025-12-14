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
      final weekStart = date.subtract(Duration(days: date.weekday - 1));
      final weekEnd = weekStart.add(const Duration(days: 6));
      final key = 'Week of ${DateFormat('MMM d').format(weekStart)} - ${DateFormat('MMM d').format(weekEnd)}';
      
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

    return Scaffold(
      backgroundColor: Colors.transparent,
      body: Column(
        children: [
          Container(
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
                       if (payouts.isEmpty) return const Center(child: Text('No payouts pending.'));
                       
                       return ListView.builder(
                        padding: const EdgeInsets.all(16),
                        itemCount: payouts.length,
                        itemBuilder: (context, index) {
                          final p = payouts[index];
                          final hasBankDetails = p.bankAccountNumber != null || p.upiId != null;

                          return Card(
                            margin: const EdgeInsets.only(bottom: 16),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                            child: Padding(
                              padding: const EdgeInsets.all(16),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                    children: [
                                      Text(p.name, style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
                                      if (!hasBankDetails)
                                        const Tooltip(
                                          message: 'Missing Bank Details',
                                          child: Icon(Icons.warning_amber_rounded, color: Colors.orange, size: 20),
                                        )
                                    ],
                                  ),
                                  Text('${p.planSelected.toUpperCase()} Plan', style: TextStyle(color: Colors.blue[800], fontWeight: FontWeight.bold, fontSize: 12)),
                                  const Divider(),
                                  if (p.bankName != null) Text('Bank: ${p.bankName} (${p.bankAccountNumber})'),
                                  if (p.ifscCode != null) Text('IFSC: ${p.ifscCode}'),
                                  if (p.upiId != null) Text('UPI: ${p.upiId}'),
                                  if (!hasBankDetails)
                                    Padding(
                                      padding: const EdgeInsets.only(top: 8.0),
                                      child: Text('⚠️ No Bank/UPI details found.', style: TextStyle(color: Colors.orange[800], fontSize: 12, fontWeight: FontWeight.bold)),
                                    ),
                                  const SizedBox(height: 12),
                                  SizedBox(
                                    width: double.infinity,
                                    child: ElevatedButton(
                                      style: ElevatedButton.styleFrom(backgroundColor: const Color(0xFF0F172A), foregroundColor: Colors.white),
                                      onPressed: hasBankDetails ? () => _showProcessModal(context, p, payoutsState.settings) : null,
                                      child: const Text('Calculate & Process'),
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
                              items: List.generate(12, (index) {
                                return DropdownMenuItem(
                                  value: index + 1,
                                  child: Text(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][index]),
                                );
                              }),
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
                            return const Center(child: Text('No history found.'));
                          }
                          
                          final groupedHistory = _groupHistoryByWeek(payoutsState.history);

                          return ListView.builder(
                            padding: const EdgeInsets.symmetric(horizontal: 16),
                            itemCount: groupedHistory.length,
                            itemBuilder: (context, index) {
                              final weekKey = groupedHistory.keys.elementAt(index);
                              final items = groupedHistory[weekKey]!;

                              return Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Padding(
                                    padding: const EdgeInsets.symmetric(vertical: 8.0),
                                    child: Text(weekKey, style: TextStyle(color: Colors.grey[600], fontWeight: FontWeight.bold, fontSize: 12)),
                                  ),
                                  ...items.map((h) => Card(
                                    margin: const EdgeInsets.only(bottom: 12),
                                    elevation: 0,
                                    color: Colors.white,
                                    shape: RoundedRectangleBorder(
                                      side: BorderSide(color: Colors.green.shade100),
                                      borderRadius: BorderRadius.circular(8),
                                    ),
                                    child: Padding(
                                      padding: const EdgeInsets.all(12),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text(h.franchiseName, style: const TextStyle(fontWeight: FontWeight.bold)),
                                              Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                                                decoration: BoxDecoration(
                                                  color: Colors.green[50],
                                                  borderRadius: BorderRadius.circular(4),
                                                ),
                                                child: Text(
                                                  '₹${double.parse(h.amount).toStringAsFixed(0)}',
                                                  style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green[700]),
                                                ),
                                              ),
                                            ],
                                          ),
                                          const SizedBox(height: 4),
                                          Text(
                                            'Processed on ${DateFormat('MMM d, y h:mm a').format(DateTime.parse(h.payoutDate).toLocal())}',
                                            style: TextStyle(color: Colors.grey[600], fontSize: 12),
                                          ),
                                          const SizedBox(height: 8),
                                          Row(
                                            mainAxisAlignment: MainAxisAlignment.spaceBetween,
                                            children: [
                                              Text('Ref Rev: ₹${double.parse(h.revenueReported).toStringAsFixed(0)} • ${h.ordersCount} Orders', style: const TextStyle(fontSize: 12)),
                                              IconButton(
                                                icon: const Icon(Icons.picture_as_pdf, color: Colors.red, size: 20),
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
            TextField(controller: revenueController, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Total Revenue Reported (₹)')),
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
  
  void _calculateAndShowConfirmation(BuildContext context, FranchisePayout p, String revStr, String ordStr, Map<String, dynamic> settings) {
      double revenue = double.tryParse(revStr) ?? 0;
      int orders = int.tryParse(ordStr) ?? 0;
      
      double sharePercent = 60;
      if (p.planSelected == 'premium') sharePercent = double.tryParse(settings['pricing_premium_share']?.toString() ?? '70') ?? 70;
      if (p.planSelected == 'elite') sharePercent = double.tryParse(settings['pricing_elite_share']?.toString() ?? '80') ?? 80;
      if (p.planSelected == 'basic') sharePercent = double.tryParse(settings['pricing_basic_share']?.toString() ?? '60') ?? 60;

      double platformCharge = double.tryParse(settings['payout_platform_charge']?.toString() ?? '0') ?? 0;
      double totalDeduction = orders * platformCharge;
      double grossShare = (revenue * sharePercent) / 100;
      double netPayout = (grossShare - totalDeduction) < 0 ? 0 : (grossShare - totalDeduction);

      showDialog(
        context: context,
        builder: (context) => AlertDialog(
          title: const Text('Confirm Payout'),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
               Text('Revenue: ₹$revenue'),
               Text('Plan Share: $sharePercent%'),
               Text('Gross Share: ₹${grossShare.toStringAsFixed(2)}'),
               Text('Deductions: ₹${totalDeduction.toStringAsFixed(2)} ($orders orders x ₹$platformCharge)'),
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
                    revenue,
                    orders,
                    netPayout
                   );
                   
                  final String base64Pdf = base64Encode(pdfBytes);

                  final success = await ref.read(payoutsProvider.notifier).processPayout(
                    franchiseId: p.id,
                    amount: netPayout,
                    revenue: revenue,
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
}
