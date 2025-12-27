import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../dashboard/franchise_provider.dart';
import '../../widgets/premium_widgets.dart';

class FranchiseDeliveryScreen extends ConsumerWidget {
  const FranchiseDeliveryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final franchiseState = ref.watch(franchiseProvider);

    return Scaffold(
      appBar: PreferredSize(
        preferredSize: const Size.fromHeight(60),
        child: AppBar(
          title: Text('Logistic Fleet', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A))),
          backgroundColor: Colors.white.withOpacity(0.8),
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
      body: franchiseState.when(
        data: (state) {
          if (state.deliveryMen.isEmpty) {
            return const IllustrativeState(
              icon: Icons.local_shipping_rounded,
              title: 'No Delivery Fleet',
              subtitle: 'You currently have no delivery personnel assigned to your zone.',
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: state.deliveryMen.length,
            itemBuilder: (context, index) {
              final dm = state.deliveryMen[index];
              return Card(
                elevation: 2,
                margin: const EdgeInsets.only(bottom: 16),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: ListTile(
                  leading: CircleAvatar(
                    backgroundImage: dm['image'] != null ? NetworkImage('http://192.168.31.247:3000/storage/app/public/delivery-man/${dm['image']}') : null,
                    backgroundColor: Colors.grey[200],
                    child: dm['image'] == null ? const Icon(Icons.person, color: Colors.grey) : null,
                  ),
                  title: Text('${dm['f_name']} ${dm['l_name']}', style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                  subtitle: Text(dm['phone'] ?? 'No Phone', style: GoogleFonts.inter(fontSize: 12)),
                  trailing: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                       Container(
                         padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                         decoration: BoxDecoration(
                           color: (dm['status'] == 1 && dm['active'] == 1) ? Colors.green.withOpacity(0.1) : Colors.red.withOpacity(0.1),
                           borderRadius: BorderRadius.circular(8),
                         ),
                         child: Text(
                           (dm['status'] == 1 && dm['active'] == 1) ? 'Active' : 'Inactive',
                           style: TextStyle(
                             color: (dm['status'] == 1 && dm['active'] == 1) ? Colors.green : Colors.red,
                             fontSize: 10,
                             fontWeight: FontWeight.bold
                           )
                         ),
                      ),
                      const SizedBox(height: 4),
                       Text('${dm['current_orders']} Active Orders', style: const TextStyle(fontSize: 10, color: Colors.grey)),
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
    );
  }
}

