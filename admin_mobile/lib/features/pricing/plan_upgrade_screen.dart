import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
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

  Future<Map<String, dynamic>?> createOrder(int amount) async {
    try {
      final response = await _apiService.client.post('mobile/payment/create-order', data: {
        'amount': amount,
        'currency': 'INR'
      });
      if (response.statusCode == 200) {
        return response.data;
      }
      return null;
    } catch (e) {
      print('Create Order Error: $e');
      return null;
    }
  }

  Future<bool> verifyAndUpgrade(Map<String, dynamic> data) async {
    state = const AsyncValue.loading();
    try {
      final response = await _apiService.client.post('mobile/payment/verify-upgrade', data: data);
      
      if (response.statusCode == 200) {
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
  String currentPlan = 'Standard'; 
  late Razorpay _razorpay;
  
  // Upgrade details temp storage
  String? _pendingNewPlan;
  int? _pendingAmount;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
    _loadCurrentPlan();
  }

  Future<void> _loadCurrentPlan() async {
     // Ideally reload profile or check prefs
     final prefs = await SharedPreferences.getInstance();
     // If you have stored plan in prefs, load it. Otherwise default to Standard.
     // For now assume standard or passed in logic? 
     // Use a provider if available, but for now we stick to hardcoded/default.
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    if (_pendingNewPlan == null) return;
    
    final prefs = await SharedPreferences.getInstance();
    final franchiseId = prefs.getInt('franchiseId');
    if (franchiseId == null) return;

    final data = {
      'razorpay_payment_id': response.paymentId,
      'razorpay_order_id': response.orderId,
      'razorpay_signature': response.signature,
      'franchiseId': franchiseId,
      'oldPlan': currentPlan,
      'newPlan': _pendingNewPlan!.toLowerCase(),
      'amount': _pendingAmount
    };

    final success = await ref.read(planUpgradeProvider.notifier).verifyAndUpgrade(data);
    
    if (mounted) {
      if (success) {
         setState(() {
           currentPlan = _pendingNewPlan!;
         });
         ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Plan upgraded successfully!'), backgroundColor: Colors.green));
      } else {
         ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment verified but upgrade failed. Contact Support.')));
      }
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Payment Failed: ${response.message}'), backgroundColor: Colors.red));
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('External Wallet: ${response.walletName}')));
  }

  Future<void> _initiatePayment(String plan, int amountInRupees) async {
      _pendingNewPlan = plan;
      _pendingAmount = amountInRupees * 100; // Paise

      // 1. Create Order
      final orderData = await ref.read(planUpgradeProvider.notifier).createOrder(_pendingAmount!);
      if (orderData == null) {
         if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to create order')));
         return;
      }

      // 2. Open Checkout
      final options = {
        'key': orderData['key_id'],
        'amount': _pendingAmount, 
        'name': 'The Kada Franchise',
        'description': 'Upgrade to $plan Plan',
        'order_id': orderData['id'], 
        'prefill': {
          'contact': '9000090000', // Should ideally fetch user details
          'email': 'franchise@thekada.in'
        },
        'external': {
          'wallets': ['paytm']
        }
      };

      try {
        _razorpay.open(options);
      } catch (e) {
        print('Error: $e');
      }
  }

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
            _buildPlanCard('Standard', 'Basic features', 0, Colors.grey),
            _buildPlanCard('Premium', 'Advanced features + Higher Revenue Share', 5000, Colors.blue),
            _buildPlanCard('Elite', 'All features + Highest Revenue Share', 10000, Colors.purple),
          ],
        ),
      ),
    );
  }

  Widget _buildPlanCard(String planName, String description, int price, MaterialColor color) {
    final isCurrent = planName.toLowerCase() == currentPlan.toLowerCase();

    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(
          color: isCurrent ? Colors.green : Colors.grey.shade200, 
          width: isCurrent ? 2 : 1
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Text(planName, style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: color[700])),
              if (isCurrent) 
                const Chip(label: Text('Current', style: TextStyle(color: Colors.white)), backgroundColor: Colors.green)
              else 
                Text('₹$price', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
            ],
          ),
          const SizedBox(height: 8),
          Text(description, style: TextStyle(color: Colors.grey[600])),
          const SizedBox(height: 16),
          if (!isCurrent)
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: () => _initiatePayment(planName, price),
                style: ElevatedButton.styleFrom(
                  backgroundColor: color[600],
                  padding: const EdgeInsets.symmetric(vertical: 12),
                ),
                child: const Text('Pay & Upgrade', style: TextStyle(color: Colors.white)),
              ),
            )
        ],
      ),
    );
  }
}
