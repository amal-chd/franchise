import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:image_picker/image_picker.dart';
import 'package:dio/dio.dart';
import 'dart:io';
import 'shop_provider.dart';
import '../../core/api_service.dart';

class AdminShopTab extends ConsumerWidget {
  const AdminShopTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    // Directly show Products view (no more tabs/orders)
    return const _ProductsView();
  }
}

class _ProductsView extends ConsumerWidget {
  const _ProductsView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final productsAsync = ref.watch(adminProductsProvider);

    return Scaffold(
      drawerEnableOpenDragGesture: false,
      body: productsAsync.when(
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
                  child: Image.network(
                    product.imageUrl, 
                    width: 50, 
                    height: 50, 
                    fit: BoxFit.cover, 
                    errorBuilder: (_,__,___) => Container(color: Colors.grey[200], child: const Icon(Icons.image)),
                  ),
                ),
                title: Text(product.name, style: GoogleFonts.poppins(fontWeight: FontWeight.bold)),
                subtitle: Text('Stock: ${product.stock} • ₹${product.price}'),
                trailing: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    IconButton(
                      icon: const Icon(Icons.edit, color: Colors.blue),
                      onPressed: () => showAddProductDialog(context, ref, product: product),
                    ),
                    IconButton(
                      icon: const Icon(Icons.delete, color: Colors.red),
                      onPressed: () => _confirmDelete(context, ref, product.id),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => showAddProductDialog(context, ref),
        backgroundColor: const Color(0xFF2563EB),
        child: const Icon(Icons.add),
      ),
    );
  }

  Future<void> _confirmDelete(BuildContext context, WidgetRef ref, int id) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Product'),
        content: const Text('Are you sure you want to delete this product?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          TextButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete', style: TextStyle(color: Colors.red))),
        ],
      ),
    );

    if (confirm == true) {
      await ref.read(adminProductsProvider.notifier).deleteProduct(id);
    }
  }

  static void showAddProductDialog(BuildContext context, WidgetRef ref, {Product? product}) {
    final nameCtrl = TextEditingController(text: product?.name);
    final descCtrl = TextEditingController(text: product?.description);
    final priceCtrl = TextEditingController(text: product?.price.toString());
    final stockCtrl = TextEditingController(text: product?.stock.toString());
    final imageCtrl = TextEditingController(text: product?.imageUrl);
    final categoryCtrl = TextEditingController(text: product?.category ?? 'Merchandise');

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text(product == null ? 'Add Product' : 'Edit Product'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(controller: nameCtrl, decoration: const InputDecoration(labelText: 'Name')),
              TextField(controller: descCtrl, decoration: const InputDecoration(labelText: 'Description')),
              TextField(controller: priceCtrl, decoration: const InputDecoration(labelText: 'Price'), keyboardType: TextInputType.number),
              TextField(controller: stockCtrl, decoration: const InputDecoration(labelText: 'Stock'), keyboardType: TextInputType.number),
              const SizedBox(height: 8),
              Row(
                children: [
                  Expanded(
                    child: TextField(controller: imageCtrl, decoration: const InputDecoration(labelText: 'Image URL')),
                  ),
                  IconButton(
                    icon: const Icon(Icons.upload_file, color: Colors.blue),
                    onPressed: () async {
                       final picker = ImagePicker();
                       final XFile? image = await picker.pickImage(source: ImageSource.gallery);
                       if (image != null) {
                          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Uploading...')));
                          try {
                            String fileName = image.path.split('/').last;
                            FormData formData = FormData.fromMap({
                              'file': await MultipartFile.fromFile(image.path, filename: fileName),
                            });
                            
                            // Reusing chat upload endpoint for convenience as it is generic
                            final response = await ApiService().client.post('/chat/upload', data: formData);
                            if (response.statusCode == 200) {
                               imageCtrl.text = response.data['fileUrl'];
                               ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload Successful')));
                            }
                          } catch (e) {
                             ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Upload Failed')));
                          }
                       }
                    },
                  )
                ],
              ),
              TextField(controller: categoryCtrl, decoration: const InputDecoration(labelText: 'Category')),
            ],
          ),
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () async {
              if (nameCtrl.text.isEmpty || priceCtrl.text.isEmpty) return;

              final productData = {
                 'name': nameCtrl.text,
                 'description': descCtrl.text,
                 'price': double.tryParse(priceCtrl.text) ?? 0.0,
                 'stock': int.tryParse(stockCtrl.text) ?? 0,
                 'image_url': imageCtrl.text,
                 'category': categoryCtrl.text
              };

              bool success;
              if (product == null) {
                success = await ref.read(adminProductsProvider.notifier).addProduct(productData);
              } else {
                success = await ref.read(adminProductsProvider.notifier).editProduct(product.id, productData);
              }

              if (context.mounted) {
                Navigator.pop(context);
                ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(success ? (product == null ? 'Product Added' : 'Product Updated') : 'Operation Failed')));
              }
            },
            child: Text(product == null ? 'Add' : 'Update'),
          )
        ],
      ),
    );
  }
}

class _OrdersView extends ConsumerStatefulWidget {
  const _OrdersView();

  @override
  ConsumerState<_OrdersView> createState() => _OrdersViewState();
}

class _OrdersViewState extends ConsumerState<_OrdersView> {
  @override
  Widget build(BuildContext context) {
    // This is now deprecated - orders moved to Merchandise Orders
    return const Center(child: Text('Orders moved to Merchandise Orders'));
  }
}
