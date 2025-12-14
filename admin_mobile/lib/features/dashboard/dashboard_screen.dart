import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../auth/auth_provider.dart';
import '../home/home_tab.dart';
import '../requests/requests_tab.dart';
import '../franchises/franchises_tab.dart';
import '../payouts/payouts_tab.dart';
import '../cms/cms_tab.dart';
import '../support/support_tab.dart';
import '../careers/careers_tab.dart';
import '../training/training_tab.dart';
import '../newsletter/newsletter_tab.dart';
import '../pricing/pricing_tab.dart';

class DashboardScreen extends ConsumerStatefulWidget {
  const DashboardScreen({super.key});

  @override
  ConsumerState<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends ConsumerState<DashboardScreen> {
  int _selectedIndex = 0;

  static const List<Widget> _widgetOptions = <Widget>[
    HomeTab(),
    RequestsTab(),
    FranchisesTab(), // New Tab
    PayoutsTab(),
    CmsTab(),
    SupportTab(),
    CareersTab(),
    TrainingTab(),
    NewsletterTab(),
    PricingTab(),
  ];

  static const List<String> _titles = [
    'Dashboard',
    'Franchise Requests',
    'Active Franchises', // New Title
    'Payouts',
    'CMS Manager',
    'Support Tickets',
    'Careers',
    'Training Modules',
    'Newsletter',
    'Pricing',
  ];

  void _onItemTapped(int index) {
    setState(() {
      _selectedIndex = index;
    });
    Navigator.pop(context); // Close drawer
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: _selectedIndex == 0
            ? Image.asset('assets/images/logo_text.png', height: 32)
            : Text(_titles[_selectedIndex], style: const TextStyle(color: Color(0xFF1E293B), fontWeight: FontWeight.bold)),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF1E293B),
        elevation: 0,
        centerTitle: true,
        leading: _selectedIndex != 0
            ? IconButton(
                icon: const Icon(Icons.arrow_back),
                onPressed: () => setState(() => _selectedIndex = 0),
              )
            : null,
      ),
      drawer: Drawer(
        child: Column(
          children: [
            UserAccountsDrawerHeader(
              decoration: const BoxDecoration(
                color: Color(0xFF2563EB),
              ),
              accountName: const Text('Admin User'),
              accountEmail: const Text('admin@thekada.in'),
              currentAccountPicture: Container(
                padding: const EdgeInsets.all(4),
                decoration: const BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.white,
                ),
                child: Image.asset('assets/images/logo.png'),
              ),
            ),
            Expanded(
              child: ListView(
                padding: EdgeInsets.zero,
                children: [
                  _buildDrawerItem(0, 'Dashboard', Icons.dashboard),
                  _buildDrawerItem(1, 'Franchise Requests', Icons.person_add),
                  _buildDrawerItem(2, 'Active Franchises', Icons.store),
                  _buildDrawerItem(3, 'Payouts', Icons.payments),
                  _buildDrawerItem(4, 'CMS Manager', Icons.edit_document),
                  _buildDrawerItem(5, 'Support Tickets', Icons.support_agent),
                  _buildDrawerItem(6, 'Careers', Icons.work),
                  _buildDrawerItem(7, 'Training Modules', Icons.school),
                  _buildDrawerItem(8, 'Newsletter', Icons.email),
                  _buildDrawerItem(9, 'Pricing & Plans', Icons.price_change),
                ],
              ),
            ),
            const Divider(),
            ListTile(
              leading: const Icon(Icons.logout, color: Colors.red),
              title: const Text('Logout', style: TextStyle(color: Colors.red)),
              onTap: () {
                ref.read(authProvider.notifier).logout();
              },
            ),
            const SizedBox(height: 20),
          ],
        ),
      ),
      body: _widgetOptions[_selectedIndex],
    );
  }

  Widget _buildDrawerItem(int index, String title, IconData icon) {
    return ListTile(
      leading: Icon(
        icon,
        color: _selectedIndex == index ? const Color(0xFF2563EB) : Colors.grey,
      ),
      title: Text(
        title,
        style: TextStyle(
          color: _selectedIndex == index ? const Color(0xFF2563EB) : Colors.black87,
          fontWeight: _selectedIndex == index ? FontWeight.bold : FontWeight.normal,
        ),
      ),
      selected: _selectedIndex == index,
      selectedTileColor: const Color(0xFFF0F9FF),
      onTap: () => _onItemTapped(index),
    );
  }
}
