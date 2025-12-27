import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:razorpay_flutter/razorpay_flutter.dart';
import 'shop_provider.dart';

class ShopScreen extends ConsumerWidget {
  const ShopScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(productsProvider);
    final cart = ref.watch(cartProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text('Franchise Shop', style: GoogleFonts.poppins(color: const Color(0xFF1E293B), fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        actions: [
          Stack(
            children: [
              IconButton(
                icon: const Icon(Icons.shopping_cart, color: Color(0xFF1E293B)),
                onPressed: () {
                  Navigator.push(context, MaterialPageRoute(builder: (_) => const CartScreen()));
                },
              ),
              if (cart.isNotEmpty)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(color: Colors.red, shape: BoxShape.circle),
                    constraints: const BoxConstraints(minWidth: 16, minHeight: 16),
                    child: Text(
                      '${cart.fold(0, (sum, item) => sum + item.quantity)}',
                      style: const TextStyle(color: Colors.white, fontSize: 10, fontWeight: FontWeight.bold),
                      textAlign: TextAlign.center,
                    ),
                  ),
                )
            ],
          )
        ],
      ),
      backgroundColor: Colors.grey[50],
      body: RefreshIndicator(
        onRefresh: () => ref.refresh(productsProvider.future),
        child: productsAsync.when(
          data: (products) {
            if (products.isEmpty) {
              return Center(child: Text('No products available.', style: GoogleFonts.inter(color: Colors.grey)));
            }
            return GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.75,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: products.length,
              itemBuilder: (context, index) {
                final product = products[index];
                return Container(
                  decoration: BoxDecoration(
                    color: Colors.white,
                    borderRadius: BorderRadius.circular(12),
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10)],
                  ),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Expanded(
                        child: Container(
                          decoration: BoxDecoration(
                            color: Colors.grey[200],
                            borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                            image: product.imageUrl.isNotEmpty
                                ? DecorationImage(image: NetworkImage(product.imageUrl), fit: BoxFit.cover)
                                : null,
                          ),
                          child: product.imageUrl.isEmpty
                              ? const Center(child: Icon(Icons.image, color: Colors.grey))
                              : null,
                        ),
                      ),
                      Padding(
                        padding: const EdgeInsets.all(12),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(product.name, style: GoogleFonts.poppins(fontWeight: FontWeight.bold), maxLines: 1, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 4),
                            Text('₹${product.price}', style: GoogleFonts.inter(color: const Color(0xFF2563EB), fontWeight: FontWeight.bold)),
                            const SizedBox(height: 8),
                            SizedBox(
                              width: double.infinity,
                              height: 32,
                              child: ElevatedButton(
                                onPressed: () {
                                  ref.read(cartProvider.notifier).addToCart(product);
                                  ScaffoldMessenger.of(context).hideCurrentSnackBar();
                                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('${product.name} added to cart')));
                                },
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: const Color(0xFF1E293B),
                                  padding: EdgeInsets.zero,
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: const Text('Add', style: TextStyle(color: Colors.white, fontSize: 12)),
                              ),
                            )
                          ],
                        ),
                      )
                    ],
                  ),
                );
              },
            );
          },
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (err, stack) => Center(child: Text('Error: $err')),
        ),
      ),
    );
  }
}

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  late Razorpay _razorpay;
  Map<String, dynamic>? _currentOrderData;

  @override
  void initState() {
    super.initState();
    _razorpay = Razorpay();
    _razorpay.on(Razorpay.EVENT_PAYMENT_SUCCESS, _handlePaymentSuccess);
    _razorpay.on(Razorpay.EVENT_PAYMENT_ERROR, _handlePaymentError);
    _razorpay.on(Razorpay.EVENT_EXTERNAL_WALLET, _handleExternalWallet);
  }

  @override
  void dispose() {
    _razorpay.clear();
    super.dispose();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) async {
    if (_currentOrderData == null) return;

    final verifyData = {
      'razorpay_order_id': response.orderId,
      'razorpay_payment_id': response.paymentId,
      'razorpay_signature': response.signature,
      'orderId': _currentOrderData!['orderId'],
    };

    final verified = await ref.read(orderProvider.notifier).verifyPayment(verifyData);
    
    if (context.mounted) {
      if (verified) {
        ref.read(cartProvider.notifier).clearCart();
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Successful! Order Placed.'), backgroundColor: Colors.green));
      } else {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Payment Verification Failed'), backgroundColor: Colors.red));
      }
    }
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Payment Failed: ${response.message}"), backgroundColor: Colors.red),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("External Wallet Selected: ${response.walletName}")),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);
    final totalAmount = cart.fold(0.0, (sum, item) => sum + (item.product.price * item.quantity));

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: AppBar(
          title: Text('My Cart', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A))),
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
      body: cart.isEmpty
          ? Center(child: Text('Your cart is empty', style: GoogleFonts.inter(color: Colors.grey)))
          : Column(
              children: [
                Expanded(
                  child: ListView.separated(
                    padding: const EdgeInsets.all(16),
                    itemCount: cart.length,
                    separatorBuilder: (_, __) => const SizedBox(height: 12),
                    itemBuilder: (context, index) {
                      final item = cart[index];
                      return Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          borderRadius: BorderRadius.circular(12),
                          border: Border.all(color: Colors.grey[200]!),
                        ),
                        child: Row(
                          children: [
                            Container(
                              width: 60,
                              height: 60,
                              decoration: BoxDecoration(
                                color: Colors.grey[100],
                                borderRadius: BorderRadius.circular(8),
                                image: item.product.imageUrl.isNotEmpty
                                    ? DecorationImage(image: NetworkImage(item.product.imageUrl), fit: BoxFit.cover)
                                    : null,
                              ),
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(item.product.name, style: GoogleFonts.poppins(fontWeight: FontWeight.w600)),
                                  Text('₹${item.product.price}', style: const TextStyle(color: Colors.grey)),
                                ],
                              ),
                            ),
                            Row(
                              children: [
                                IconButton(
                                  icon: const Icon(Icons.remove, size: 16),
                                  onPressed: () => ref.read(cartProvider.notifier).updateQuantity(item.product.id, item.quantity - 1),
                                ),
                                Text('${item.quantity}', style: const TextStyle(fontWeight: FontWeight.bold)),
                                IconButton(
                                  icon: const Icon(Icons.add, size: 16),
                                  onPressed: () => ref.read(cartProvider.notifier).updateQuantity(item.product.id, item.quantity + 1),
                                ),
                              ],
                            )
                          ],
                        ),
                      );
                    },
                  ),
                ),
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(
                    color: Colors.white,
                    boxShadow: [BoxShadow(color: Colors.black.withOpacity(0.05), blurRadius: 10, offset: const Offset(0, -5))],
                  ),
                  child: Column(
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Text('Total', style: GoogleFonts.poppins(fontSize: 16, fontWeight: FontWeight.bold)),
                          Text('₹$totalAmount', style: GoogleFonts.poppins(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF2563EB))),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 50,
                        child: ElevatedButton(
                          onPressed: () async {
                             final orderData = await ref.read(orderProvider.notifier).placeOrder(cart, totalAmount);
                             
                             if (orderData != null) {
                               setState(() => _currentOrderData = orderData);
                               
                               var options = {
                                 'key': orderData['keyId'],
                                 'amount': orderData['amount'],
                                 'name': 'The Kada Franchise',
                                 'description': 'Shop Order #${orderData['orderId']}',
                                 'order_id': orderData['razorpayOrderId'], 
                                 'prefill': {
                                   'contact': '', // Could prefill from user profile
                                   'email': ''
                                 },
                                 'external': {
                                   'wallets': ['paytm']
                                 }
                               };

                               try {
                                 _razorpay.open(options);
                               } catch (e) {
                                 if (context.mounted) {
                                   ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error launching payment: $e')));
                                 }
                               }
                             } else if (context.mounted) {
                               ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to initiate order. Try again.')));
                             }
                          },
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF1E293B),
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                          ),
                          child: const Text('Pay & Order', style: TextStyle(color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold)),
                        ),
                      ),
                    ],
                  ),
                )
              ],
            ),
    );
  }
}
