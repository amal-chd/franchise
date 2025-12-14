import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'shop_provider.dart';

class AdminShopTab extends ConsumerStatefulWidget {
  const AdminShopTab({super.key});

  @override
  ConsumerState<AdminShopTab> createState() => _AdminShopTabState();
}

class _AdminShopTabState extends ConsumerState<AdminShopTab> {
  @override
  Widget build(BuildContext context) {
    final productsState = ref.watch(adminProductsProvider);

    return Scaffold(
      backgroundColor: Colors.grey[50],
      body: productsState.when(
        data: (products) => ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: products.length,
          itemBuilder: (context, index) {
            final product = products[index];
            return Card(
              margin: const EdgeInsets.only(bottom: 12),
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
              child: ListTile(
                leading: ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(product.imageUrl, width: 50, height: 50, fit: BoxFit.cover, errorBuilder: (_,__,___) => const Icon(Icons.image)),
                ),
                title: Text(product.name, style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                subtitle: Text('Stock: ${product.stock} • ₹${product.price}'),
                trailing: const Icon(Icons.edit, color: Colors.blue),
                onTap: () {
                  // TODO: Edit Product
                },
              ),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddProductDialog(context),
        backgroundColor: const Color(0xFF2563EB),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddProductDialog(BuildContext context) {
    final nameCtrl = TextEditingController();
    final descCtrl = TextEditingController();
    final priceCtrl = TextEditingController();
    final imageCtrl = TextEditingController();
    final stockCtrl = TextEditingController();
    final categoryCtrl = TextEditingController(text: 'Merchandise');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Add Product'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
              TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description')),
              TextField(controller: priceCtrl, decoration: const InputDecoration(labelText: 'Price'), keyboardType: TextInputType.number),
              TextField(controller: stockCtrl, decoration: const InputDecoration(labelText: 'Stock'), keyboardType: TextInputType.number),
              TextField(controller: imageCtrl, decoration: const InputDecoration(labelText: 'Image URL')),
              TextField(controller: categoryCtrl, decoration: const InputDecoration(labelText: 'Category')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.isEmpty || priceCtrl.text.isEmpty) return;

              final newProduct = {
                 'name': nameCtrl.text,
                 'description': descCtrl.text,
                 'price': double.tryParse(priceCtrl.text) ?? 0.0,
                 'stock': int.tryParse(stockCtrl.text) ?? 0,
                 'image_url': imageCtrl.text,
                 'category': categoryCtrl.text
              };

              final success = await ref.read(adminProductsProvider.notifier).addProduct(newProduct);
              if (context.mounted) {
                Navigator.pop(context);
                if (success) {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Product Added')));
                } else {
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Failed to add product')));
                }
              }
            },
            child: const Text('Add'),
          )
        ],
      ),
    );
  }
}
