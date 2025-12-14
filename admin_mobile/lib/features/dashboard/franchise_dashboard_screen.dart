import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../auth/auth_provider.dart';

class FranchiseDashboardScreen extends ConsumerStatefulWidget {
  const FranchiseDashboardScreen({super.key});

  @override
  ConsumerState<FranchiseDashboardScreen> createState() => _FranchiseDashboardScreenState();
}

class _FranchiseDashboardScreenState extends ConsumerState<FranchiseDashboardScreen> {
  String _franchiseName = 'Partner';

  @override
  void initState() {
    super.initState();
    _loadName();
  }

  Future<void> _loadName() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      _franchiseName = prefs.getString('franchiseName') ?? 'Partner';
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Image.asset('assets/images/logo_text.png', height: 28),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.logout, color: Colors.red),
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
      backgroundColor: Colors.grey[50],
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Welcome back,', style: GoogleFonts.poppins(color: Colors.grey[600], fontSize: 14)),
            Text(_franchiseName, style: GoogleFonts.poppins(color: const Color(0xFF0F172A), fontSize: 24, fontWeight: FontWeight.bold)),
            const SizedBox(height: 24),
            
            // Stats Card
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF1E293B)]),
                borderRadius: BorderRadius.circular(16),
                boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.2), blurRadius: 10, offset: const Offset(0, 4))],
              ),
              child: Column(
                children: [
                   Row(
                     mainAxisAlignment: MainAxisAlignment.spaceBetween,
                     children: [
                       Column(
                         crossAxisAlignment: CrossAxisAlignment.start,
                         children: [
                           const Text('Total Revenue', style: TextStyle(color: Colors.white70)),
                           const SizedBox(height: 4),
                           Text('₹0', style: GoogleFonts.poppins(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold)),
                         ],
                       ),
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(color: Colors.white24, borderRadius: BorderRadius.circular(12)),
                          child: const Icon(Icons.analytics, color: Colors.white),
                        )
                     ],
                   ),
                   const SizedBox(height: 20),
                   Row(
                     children: [
                        _buildStat('Active Orders', '0'),
                        const SizedBox(width: 24),
                        _buildStat('Today\'s Payout', '₹0'),
                     ],
                   )
                ],
              ),
            ),
            
             const SizedBox(height: 24),
             Text('Recent Activity', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 18)),
             const SizedBox(height: 16),
             
             Center(
               child: Column(
                 children: [
                   const Icon(Icons.inbox_outlined, size: 48, color: Colors.grey),
                   const SizedBox(height: 8),
                   Text('No recent activity', style: GoogleFonts.inter(color: Colors.grey)),
                 ],
               ),
             ),
             
             const SizedBox(height: 24),
             SizedBox(
               width: double.infinity,
               child: OutlinedButton(
                 onPressed: () {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Feature coming soon')));
                 },
                 child: const Text('View All Transactions'),
               ),
             )
          ],
        ),
      ),
    );
  }
  
  Widget _buildStat(String label, String value) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: const TextStyle(color: Colors.white60, fontSize: 12)),
        Text(value, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16)),
      ],
    );
  }
}
