import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../common/zones_provider.dart';
import '../../widgets/modern_header.dart';
import '../../widgets/premium_widgets.dart';

class ZoneReportsScreen extends ConsumerStatefulWidget {
  const ZoneReportsScreen({super.key});

  @override
  ConsumerState<ZoneReportsScreen> createState() => _ZoneReportsScreenState();
}

class _ZoneReportsScreenState extends ConsumerState<ZoneReportsScreen> {
  Map<String, dynamic>? _reportData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    setState(() => _isLoading = true);
    final data = await ref.read(zonesProvider.notifier).fetchZoneReports();
    if (mounted) {
      setState(() {
        _reportData = data;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      body: SafeArea(
        child: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _reportData == null || _reportData!.isEmpty
              ? const Center(child: Text('Failed to load reports'))
              : RefreshIndicator(
                  onRefresh: _loadData,
                  child: SingleChildScrollView(
                    physics: const BouncingScrollPhysics(),
                    padding: const EdgeInsets.all(20),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [

                        // Global Summary Cards
                        Row(
                          children: [
                            Expanded(child: _buildSummaryCard(
                              'Total Revenue', 
                              '₹${_reportData!['total_revenue'] ?? 0}', 
                              Icons.currency_rupee_rounded, 
                              const Color(0xFF10B981) // Emerald
                            )),
                            const SizedBox(width: 16),
                            Expanded(child: _buildSummaryCard(
                              'Total Orders', 
                              '${_reportData!['total_orders'] ?? 0}', 
                              Icons.shopping_bag_rounded, 
                              const Color(0xFF3B82F6) // Blue
                            )),
                          ],
                        ),
                        
                        const SizedBox(height: 24),
                        Text('Zone Performance', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                        const SizedBox(height: 16),

                        // Zone List
                        ListView.builder(
                          physics: const NeverScrollableScrollPhysics(),
                          shrinkWrap: true,
                          itemCount: (_reportData!['zones'] is List) ? (_reportData!['zones'] as List).length : 0,
                          itemBuilder: (context, index) {
                            final zone = (_reportData!['zones'] as List)[index];
                            return _buildZoneCard(zone);
                          },
                        ),
                      ],
                    ),
                  ),
                ),
      ),
    );
  }

  Widget _buildSummaryCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        boxShadow: [BoxShadow(color: color.withOpacity(0.1), blurRadius: 20, offset: const Offset(0, 8))],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: Icon(icon, color: color, size: 24),
          ),
          const SizedBox(height: 16),
          Text(value, style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          Text(title, style: GoogleFonts.inter(fontSize: 13, color: const Color(0xFF64748B))),
        ],
      ),
    );
  }

  Widget _buildZoneCard(dynamic zone) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(20),
        boxShadow: [BoxShadow(color: const Color(0xFF64748B).withOpacity(0.05), blurRadius: 10, offset: const Offset(0, 4))],
      ),
      child: Material(
        color: Colors.transparent,
        borderRadius: BorderRadius.circular(20),
        child: InkWell(
          onTap: () => Navigator.push(context, MaterialPageRoute(builder: (context) => ZoneDetailScreen(zoneId: zone['id'], zoneName: zone['name']))),
          borderRadius: BorderRadius.circular(20),
          child: Padding(
            padding: const EdgeInsets.all(20),
            child: Column(
              children: [
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(zone['name'] ?? 'Unknown Zone', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
                    Icon(Icons.arrow_forward_ios_rounded, size: 16, color: Colors.grey.shade400),
                  ],
                ),
                const Divider(height: 24),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    _buildZoneStat('Orders', '${zone['orders_count'] ?? 0}'),
                    _buildZoneStat('Revenue', '₹${zone['revenue'] ?? 0}'),
                    _buildZoneStat('Shops', '${zone['stores_count'] ?? 0}'),
                    _buildZoneStat('Del. Boys', '${zone['delivery_men_count'] ?? 0}'),
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildZoneStat(String label, String value) {
    return Column(
      children: [
        Text(value, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16, color: const Color(0xFF334155))),
        Text(label, style: GoogleFonts.inter(fontSize: 11, color: const Color(0xFF94A3B8))),
      ],
    );
  }
}

class ZoneDetailScreen extends ConsumerStatefulWidget {
  final int zoneId;
  final String zoneName;

  const ZoneDetailScreen({super.key, required this.zoneId, required this.zoneName});

  @override
  ConsumerState<ZoneDetailScreen> createState() => _ZoneDetailScreenState();
}

class _ZoneDetailScreenState extends ConsumerState<ZoneDetailScreen> with SingleTickerProviderStateMixin {
  late TabController _tabController;
  Map<String, dynamic>? _detailData;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 4, vsync: this);
    _loadDetail();
  }

  Future<void> _loadDetail() async {
    setState(() => _isLoading = true);
    final data = await ref.read(zonesProvider.notifier).fetchZoneDetail(widget.zoneId);
    if (mounted) {
      setState(() {
        _detailData = data;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF1F5F9),
      appBar: AppBar(
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_rounded, color: Colors.black),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(widget.zoneName, style: GoogleFonts.outfit(color: Colors.black, fontWeight: FontWeight.bold)),
        bottom: TabBar(
          controller: _tabController,
          labelColor: const Color(0xFF2563EB),
          unselectedLabelColor: const Color(0xFF64748B),
          indicatorColor: const Color(0xFF2563EB),
          labelStyle: GoogleFonts.inter(fontWeight: FontWeight.w600),
          tabs: const [
            Tab(text: 'Overview'),
            Tab(text: 'Shops'),
            Tab(text: 'Delivery'),
            Tab(text: 'Orders'),
          ],
        ),
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : _detailData == null 
          ? const Center(child: Text('Failed to load details'))
          : TabBarView(
              controller: _tabController,
              children: [
                _buildOverview(),
                _buildShopsList(),
                _buildDeliveryList(),
                _buildOrdersList(),
              ],
            ),
    );
  }

  Widget _buildOverview() {
    final stats = _detailData!['stats'] ?? {};
    final breakdown = (_detailData!['module_breakdown'] is List) ? _detailData!['module_breakdown'] as List : [];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Stats Grid
          GridView.count(
            crossAxisCount: 2,
            crossAxisSpacing: 16,
            mainAxisSpacing: 16,
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            childAspectRatio: 1.5,
            children: [
              _buildDetailCard('Total Revenue', '₹${stats['total_revenue'] ?? 0}', Icons.currency_rupee, Colors.green),
              _buildDetailCard('Total Orders', '${stats['total_orders'] ?? 0}', Icons.shopping_cart, Colors.blue),
              _buildDetailCard('Active Shops', '${stats['total_stores'] ?? 0}', Icons.store, Colors.orange),
              _buildDetailCard('Active Riders', '${stats['total_dm'] ?? 0}', Icons.directions_bike, Colors.purple),
            ],
          ),
          
          const SizedBox(height: 32),
          Text('Module Breakdown', style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B))),
          const SizedBox(height: 16),
          
          Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
            child: Column(
              children: breakdown.map((m) => Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: Row(
                  children: [
                    Expanded(child: Text(m['module_name'] ?? 'Unknown', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
                    Text('${m['store_count'] ?? 0} Shops', style: GoogleFonts.inter(color: Colors.grey)),
                  ],
                ),
              )).toList(),
            ),
          )
        ],
      ),
    );
  }

  Widget _buildShopsList() {
    final shops = (_detailData!['stores_details'] is List) ? _detailData!['stores_details'] as List : [];
    if (shops.isEmpty) return const Center(child: Text('No shops found'));

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: shops.length,
      itemBuilder: (context, index) {
        final shop = shops[index];
        return Card(
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE2E8F0))),
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(backgroundColor: Colors.orange.shade50, child: Icon(Icons.store, color: Colors.orange.shade700)),
            title: Text(shop['name'] ?? 'Unknown Shop', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            subtitle: Text('${shop['module_name'] ?? 'General'} • Rating: ${shop['rating'] ?? 0}', style: GoogleFonts.inter(fontSize: 12)),
            trailing: Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: (shop['status'] == 1 || shop['status'] == 'active') ? Colors.green.shade50 : Colors.red.shade50,
                borderRadius: BorderRadius.circular(8)
              ),
              child: Text(
                (shop['status'] == 1 || shop['status'] == 'active') ? 'Active' : 'Inactive',
                style: TextStyle(color: (shop['status'] == 1 || shop['status'] == 'active') ? Colors.green : Colors.red, fontSize: 10, fontWeight: FontWeight.bold),
              ),
            ),
          ),
        );
      },
    );
  }

  Widget _buildDeliveryList() {
    final riders = (_detailData!['delivery_men_details'] is List) ? _detailData!['delivery_men_details'] as List : [];
    if (riders.isEmpty) return const Center(child: Text('No delivery partners found'));

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: riders.length,
      itemBuilder: (context, index) {
        final rider = riders[index];
        return Card(
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE2E8F0))),
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            leading: CircleAvatar(backgroundColor: Colors.purple.shade50, child: Icon(Icons.person, color: Colors.purple.shade700)),
            title: Text('${rider['f_name'] ?? ''} ${rider['l_name'] ?? ''}', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            subtitle: Text(rider['phone'] ?? 'No Phone', style: GoogleFonts.inter(fontSize: 12)),
            trailing: Icon(
              Icons.circle,
              size: 10,
              color: (rider['status'] == 1 || rider['status'] == 'approved') && rider['active'] == 1 ? Colors.green : Colors.grey,
            ),
          ),
        );
      },
    );
  }

  Widget _buildOrdersList() {
    final orders = (_detailData!['recent_orders'] is List) ? _detailData!['recent_orders'] as List : [];
    if (orders.isEmpty) return const Center(child: Text('No recent orders'));

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: orders.length,
      itemBuilder: (context, index) {
        final order = orders[index];
        return Card(
          elevation: 0,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16), side: const BorderSide(color: Color(0xFFE2E8F0))),
          margin: const EdgeInsets.only(bottom: 12),
          child: ListTile(
            title: Text('Order #${order['id']}', style: GoogleFonts.robotoMono(fontWeight: FontWeight.bold)),
            subtitle: Text(order['created_at'] ?? '', style: GoogleFonts.inter(fontSize: 12)),
            trailing: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.end,
              children: [
                Text('₹${order['order_amount'] ?? 0}', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 16)),
                Text(order['order_status']?.toString().toUpperCase() ?? 'UNKNOWN', style: GoogleFonts.inter(fontSize: 10, color: Colors.blue)),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildDetailCard(String title, String value, IconData icon, Color color) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(color: Colors.white, borderRadius: BorderRadius.circular(20)),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Icon(icon, color: color),
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(value, style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 20)),
              Text(title, style: GoogleFonts.inter(fontSize: 12, color: Colors.grey)),
            ],
          )
        ],
      ),
    );
  }
}
