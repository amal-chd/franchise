import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart'; // import shared_preferences
import '../../core/api_service.dart';

final planUpgradeProvider = AsyncNotifierProvider<PlanUpgradeNotifier, bool>(() {
  return PlanUpgradeNotifier();
});

class PlanUpgradeNotifier extends AsyncNotifier<bool> {
  final ApiService _apiService = ApiService();

  @override
  Future<bool> build() async {
    return false;
  }

  Future<bool> requestUpgrade(String newPlan, String currentPlan) async {
    state = const AsyncValue.loading();
    try {
      final prefs = await SharedPreferences.getInstance();
      final franchiseId = prefs.getInt('franchiseId');

      if (franchiseId == null) throw Exception('Franchise ID not found');

      final response = await _apiService.client.post('franchise/plan-upgrade', data: {
        'franchiseId': franchiseId,
        'currentPlan': currentPlan,
        'requestedPlan': newPlan,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        state = const AsyncValue.data(true);
        return true;
      }
      state = const AsyncValue.data(false);
      return false;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return false;
    }
  }
}

class PlanUpgradeScreen extends ConsumerStatefulWidget {
  const PlanUpgradeScreen({super.key});

  @override
  ConsumerState<PlanUpgradeScreen> createState() => _PlanUpgradeScreenState();
}

class _PlanUpgradeScreenState extends ConsumerState<PlanUpgradeScreen> {
  String currentPlan = 'Standard'; // Default, ideally fetch from auth or API

  @override
  Widget build(BuildContext context) {
    final upgradeState = ref.watch(planUpgradeProvider);

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: AppBar(
          title: Text('Membership Plan', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A))),
          backgroundColor: Colors.white,
          elevation: 0,
          centerTitle: true,
          leadingWidth: 70,
          leading: Navigator.of(context).canPop() ? IconButton(
            icon: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(color: const Color(0xFF0F172A).withOpacity(0.05), borderRadius: BorderRadius.circular(12)),
              child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Color(0xFF0F172A)),
            ),
            onPressed: () => Navigator.of(context).pop(),
          ) : null,
        ),
      ),
      backgroundColor: Colors.grey[50],
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Current Plan', style: GoogleFonts.inter(color: Colors.grey[600], fontSize: 14)),
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(16),
              width: double.infinity,
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: Colors.blue.shade100),
                boxShadow: [BoxShadow(color: Colors.blue.withOpacity(0.05), blurRadius: 10)],
              ),
              child: Row(
                children: [
                   const Icon(Icons.star, color: Colors.amber, size: 28),
                   const SizedBox(width: 16),
                   Column(
                     crossAxisAlignment: CrossAxisAlignment.start,
                     children: [
                       Text(currentPlan, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold)),
                       const Text('Active', style: TextStyle(color: Colors.green, fontSize: 12, fontWeight: FontWeight.bold)),
                     ],
                   )
                ],
              ),
            ),
            const SizedBox(height: 32),
            Text('Available Upgrades', style: GoogleFonts.inter(color: Colors.grey[600], fontSize: 14)),
            const SizedBox(height: 16),
            _buildPlanCard('Standard', 'Basic features', Colors.grey),
            _buildPlanCard('Premium', 'Advanced features + Higher Revenue Share', Colors.blue),
            _buildPlanCard('Elite', 'All features + Highest Revenue Share', Colors.purple),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCard(String planName, String description, MaterialColor color) {
    // Determine if this is current plan
    // For now simple mocking
    final isCurrent = planName == currentPlan;

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: isCurrent ? Colors.green : Colors.grey.shade200, width: isCurrent ? 2 : 1),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(planName, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: color[700])),
              if (isCurrent) const Chip(label: Text('Current', style: TextStyle(color: Colors.white)), backgroundColor: Colors.green)
            ],
          ),
          const SizedBox(height: 8),
          Text(description, style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 16),
          if (!isCurrent)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _handleUpgrade(planName),
                style: ElevatedButton.styleFrom(
                  backgroundColor: color[600],
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('Request Upgrade', style: TextStyle(color: Colors.white)),
              ),
            )
        ],
      ),
    );
  }

  Future<void> _handleUpgrade(String plan) async {
    // Confirm dialog
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('Upgrade to $plan?'),
        content: const Text('This will send a request to the admin for approval.'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Confirm')),
        ],
      ),
    );

    if (confirmed == true) {
       final success = await ref.read(planUpgradeProvider.notifier).requestUpgrade(plan.toLowerCase(), currentPlan);
       if (mounted) {
         if (success) {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Request sent successfully')));
         } else {
           ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to send request')));
         }
       }
    }
  }
}
