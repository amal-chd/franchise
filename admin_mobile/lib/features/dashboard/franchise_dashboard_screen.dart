import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../auth/auth_provider.dart';
import '../shop/shop_screen.dart';
import '../chat/chat_screen.dart';
import '../training/franchise_training_tab.dart';
import '../pricing/plan_upgrade_screen.dart';

class FranchiseDashboardScreen extends ConsumerStatefulWidget {
  const FranchiseDashboardScreen({super.key});

  @override
  ConsumerState<FranchiseDashboardScreen> createState() => _FranchiseDashboardScreenState();
}

class _FranchiseDashboardScreenState extends ConsumerState<FranchiseDashboardScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _widgetOptions = <Widget>[
    FranchiseHomeTab(),
    ShopScreen(),
    FranchiseTrainingTab(),
    ChatScreen(),
    PlanUpgradeScreen(),
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(
        index: _selectedIndex,
        children: _widgetOptions,
      ),
      bottomNavigationBar: BottomNavigationBar(
        items: const <BottomNavigationBarItem>[
          BottomNavigationBarItem(
            icon: Icon(Icons.dashboard_outlined),
            activeIcon: Icon(Icons.dashboard),
            label: 'Home',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.shopping_bag_outlined),
            activeIcon: Icon(Icons.shopping_bag),
            label: 'Shop',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.school_outlined),
            activeIcon: Icon(Icons.school),
            label: 'Training',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.chat_bubble_outline),
            activeIcon: Icon(Icons.chat_bubble),
            label: 'Support',
          ),
          BottomNavigationBarItem(
            icon: Icon(Icons.credit_card_outlined),
            activeIcon: Icon(Icons.credit_card),
            label: 'Plan',
          ),
        ],
        currentIndex: _selectedIndex,
        selectedItemColor: const Color(0xFF2563EB),
        unselectedItemColor: const Color(0xFF94A3B8),
        onTap: _onItemTapped,
        type: BottomNavigationBarType.fixed,
        showUnselectedLabels: true,
        selectedLabelStyle: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600),
        unselectedLabelStyle: GoogleFonts.inter(fontSize: 12),
      ),
    );
  }
}

class FranchiseHomeTab extends ConsumerStatefulWidget {
  const FranchiseHomeTab({super.key});

  @override
  ConsumerState<FranchiseHomeTab> createState() => _FranchiseHomeTabState();
}

class _FranchiseHomeTabState extends ConsumerState<FranchiseHomeTab> {
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
