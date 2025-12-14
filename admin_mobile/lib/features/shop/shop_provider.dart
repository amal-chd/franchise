import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

class Product {
  final int id;
  final String name;
  final String description;
  final double price;
  final String imageUrl;
  final String category;
  final int stock;

  Product({
    required this.id,
    required this.name,
    required this.description,
    required this.price,
    required this.imageUrl,
    required this.category,
    required this.stock,
  });

  factory Product.fromJson(Map<String, dynamic> json) {
    return Product(
      id: json['id'],
      name: json['name'] ?? '',
      description: json['description'] ?? '',
      price: (json['price'] is int) ? (json['price'] as int).toDouble() : (json['price'] ?? 0.0),
      imageUrl: json['image_url'] ?? '',
      category: json['category'] ?? 'Merchandise',
      stock: json['stock'] ?? 0,
    );
  }
}

class CartItem {
  final Product product;
  int quantity;

  CartItem({required this.product, this.quantity = 1});
}

// Products Provider
final productsProvider = AsyncNotifierProvider<ProductsNotifier, List<Product>>(() {
  return ProductsNotifier();
});

class ProductsNotifier extends AsyncNotifier<List<Product>> {
  final ApiService _apiService = ApiService();

  @override
  Future<List<Product>> build() async {
    return _fetchProducts();
  }

  Future<List<Product>> _fetchProducts() async {
    try {
      final response = await _apiService.client.get('/api/shop/products');
      final data = response.data as List;
      return data.map((e) => Product.fromJson(e)).toList();
    } catch (e) {
      throw Exception('Failed to fetch products');
    }
  }
}

// Cart Provider
final cartProvider = NotifierProvider<CartNotifier, List<CartItem>>(() {
  return CartNotifier();
});

class CartNotifier extends Notifier<List<CartItem>> {
  @override
  List<CartItem> build() {
    return [];
  }

  void addToCart(Product product) {
    final existingIndex = state.indexWhere((item) => item.product.id == product.id);
    if (existingIndex >= 0) {
      state[existingIndex].quantity++;
      state = [...state];
    } else {
      state = [...state, CartItem(product: product)];
    }
  }

  void removeFromCart(int productId) {
    state = state.where((item) => item.product.id != productId).toList();
  }
  
  void updateQuantity(int productId, int quantity) {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    final index = state.indexWhere((item) => item.product.id == productId);
    if (index >= 0) {
      state[index].quantity = quantity;
      state = [...state];
    }
  }

  void clearCart() {
    state = [];
  }

  double get totalAmount {
    return state.fold(0, (sum, item) => sum + (item.product.price * item.quantity));
  }
}

// Order Provider (for placing orders)
final orderProvider = AsyncNotifierProvider<OrderNotifier, bool>(() {
  return OrderNotifier();
});

class OrderNotifier extends AsyncNotifier<bool> {
  final ApiService _apiService = ApiService();

  @override
  Future<bool> build() async {
    return false;
  }

  Future<bool> placeOrder(List<CartItem> items, double totalAmount) async {
    state = const AsyncValue.loading();
    try {
      final prefs = await SharedPreferences.getInstance();
      final franchiseId = prefs.getInt('franchiseId');

      if (franchiseId == null) throw Exception('Franchise ID not found');

      final orderData = {
        'franchiseId': franchiseId,
        'items': items.map((item) => {
          'productId': item.product.id,
          'quantity': item.quantity,
          'price': item.product.price
        }).toList(),
        'totalAmount': totalAmount
      };

      final response = await _apiService.client.post('/api/shop/orders', data: orderData);
      
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
