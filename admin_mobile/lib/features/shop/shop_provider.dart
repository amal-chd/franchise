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
      price: double.tryParse(json['price'].toString()) ?? 0.0,
      imageUrl: json['image_url'] ?? '',
      category: json['category'] ?? 'Merchandise',
      stock: int.tryParse(json['stock'].toString()) ?? 0,
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
      final response = await _apiService.client.get('shop/products');
      List data = [];
      if (response.data is List) {
        data = response.data as List;
      } else if (response.data is Map && response.data['products'] != null) {
        data = response.data['products'] as List;
      } else if (response.data is Map && response.data['data'] != null) {
        data = response.data['data'] as List;
      }
      return data.map((e) => Product.fromJson(e)).toList();
    } catch (e) {
      throw Exception('Failed to fetch products');
    }
  }
}

// Admin Products Provider
final adminProductsProvider = AsyncNotifierProvider<AdminProductsNotifier, List<Product>>(() {
  return AdminProductsNotifier();
});

class AdminProductsNotifier extends AsyncNotifier<List<Product>> {
  final ApiService _apiService = ApiService();

  @override
  Future<List<Product>> build() async {
    return _fetchProducts();
  }

  Future<List<Product>> _fetchProducts() async {
    try {
      final response = await _apiService.client.get('shop/products?admin=true');
      List data = [];
      if (response.data is List) {
        data = response.data as List;
      } else if (response.data is Map && response.data['products'] != null) {
        data = response.data['products'] as List;
      } else if (response.data is Map && response.data['data'] != null) {
        data = response.data['data'] as List;
      }
      return data.map((e) => Product.fromJson(e)).toList();
    } catch (e) {
      throw Exception('Failed to fetch admin products');
    }
  }

  Future<bool> addProduct(Map<String, dynamic> productData) async {
    try {
      final response = await _apiService.client.post('shop/products', data: productData);
      if (response.statusCode == 200 || response.statusCode == 201) {
        state = await AsyncValue.guard(() => _fetchProducts()); // Refresh list
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> editProduct(int id, Map<String, dynamic> productData) async {
    try {
      final response = await _apiService.client.put('shop/products', data: {'id': id, ...productData});
      if (response.statusCode == 200) {
         state = await AsyncValue.guard(() => _fetchProducts());
         return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<bool> deleteProduct(int id) async {
    try {
      final response = await _apiService.client.delete('shop/products?id=$id');
      if (response.statusCode == 200) {
         state = await AsyncValue.guard(() => _fetchProducts());
         return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
}

// Enhanced Order Model
class OrderModel {
  final int id;
  final int franchiseId;
  final String? franchiseName;
  final String? zoneName;
  final int? zoneId;
  final double totalAmount;
  final String status;
  final String paymentStatus;
  final String? razorpayOrderId;
  final String createdAt;
  final String? updatedAt;
  final int itemsCount;

  OrderModel({
    required this.id,
    required this.franchiseId,
    this.franchiseName,
    this.zoneName,
    this.zoneId,
    required this.totalAmount,
    required this.status,
    required this.paymentStatus,
    this.razorpayOrderId,
    required this.createdAt,
    this.updatedAt,
    this.itemsCount = 0,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'],
      franchiseId: json['franchise_id'],
      franchiseName: json['franchise_name'],
      zoneName: json['zone_name'],
      zoneId: json['zone_id'],
      totalAmount: double.tryParse(json['total_amount']?.toString() ?? '0') ?? 0,
      status: json['status'] ?? 'pending',
      paymentStatus: json['payment_status'] ?? 'pending',
      razorpayOrderId: json['razorpay_order_id'],
      createdAt: json['created_at'] ?? '',
      updatedAt: json['updated_at'],
      itemsCount: json['items_count'] ?? 0,
    );
  }
}

// Orders Filter State
class OrdersFilter {
  final List<String> statuses;
  final List<String> paymentStatuses;
  final String? search;
  final String? dateFrom;
  final String? dateTo;
  final String sortBy;
  final String sortOrder;
  final int? zoneId;

  OrdersFilter({
    this.statuses = const [],
    this.paymentStatuses = const [],
    this.search,
    this.dateFrom,
    this.dateTo,
    this.sortBy = 'created_at',
    this.sortOrder = 'desc',
    this.zoneId,
  });

  OrdersFilter copyWith({
    List<String>? statuses,
    List<String>? paymentStatuses,
    String? search,
    String? dateFrom,
    String? dateTo,
    String? sortBy,
    String? sortOrder,
    int? zoneId,
    bool clearSearch = false,
  }) {
    return OrdersFilter(
      statuses: statuses ?? this.statuses,
      paymentStatuses: paymentStatuses ?? this.paymentStatuses,
      search: clearSearch ? null : (search ?? this.search),
      dateFrom: dateFrom ?? this.dateFrom,
      dateTo: dateTo ?? this.dateTo,
      sortBy: sortBy ?? this.sortBy,
      sortOrder: sortOrder ?? this.sortOrder,
      zoneId: zoneId ?? this.zoneId,
    );
  }

  Map<String, String> toQueryParams() {
    final params = <String, String>{};
    if (statuses.isNotEmpty) params['status'] = statuses.join(',');
    if (paymentStatuses.isNotEmpty) params['paymentStatus'] = paymentStatuses.join(',');
    if (search != null && search!.isNotEmpty) params['search'] = search!;
    if (dateFrom != null) params['dateFrom'] = dateFrom!;
    if (dateTo != null) params['dateTo'] = dateTo!;
    if (zoneId != null) params['zoneId'] = zoneId.toString();
    params['sortBy'] = sortBy;
    params['sortOrder'] = sortOrder;
    return params;
  }
}

// Paginated Orders Response
class PaginatedOrders {
  final List<OrderModel> orders;
  final int page;
  final int limit;
  final int total;
  final int totalPages;
  final bool hasMore;

  PaginatedOrders({
    required this.orders,
    required this.page,
    required this.limit,
    required this.total,
    required this.totalPages,
    required this.hasMore,
  });

  factory PaginatedOrders.fromJson(Map<String, dynamic> json) {
    List ordersList = [];
    final ordersData = json['orders'];
    if (ordersData is List) {
      ordersList = ordersData;
    } else if (ordersData is Map && ordersData['data'] is List) {
       ordersList = ordersData['data'];
    }

    return PaginatedOrders(
      orders: ordersList.map((e) => OrderModel.fromJson(e)).toList(),
      page: json['pagination']?['page'] ?? 1,
      limit: json['pagination']?['limit'] ?? 10,
      total: json['pagination']?['total'] ?? 0,
      totalPages: json['pagination']?['totalPages'] ?? 1,
      hasMore: json['pagination']?['hasMore'] ?? false,
    );
  }
}

// Orders Filter Provider
final ordersFilterProvider = NotifierProvider<OrdersFilterNotifier, OrdersFilter>(() {
  return OrdersFilterNotifier();
});

class OrdersFilterNotifier extends Notifier<OrdersFilter> {
  @override
  OrdersFilter build() {
    return OrdersFilter();
  }

  void setStatusFilter(List<String> statuses) {
    state = state.copyWith(statuses: statuses);
  }

  void setPaymentFilter(List<String> paymentStatuses) {
    state = state.copyWith(paymentStatuses: paymentStatuses);
  }

  void setSearch(String? search) {
    state = state.copyWith(search: search, clearSearch: search == null);
  }

  void setDateRange(String? from, String? to) {
    state = state.copyWith(dateFrom: from, dateTo: to);
  }

  void setSorting(String sortBy, String sortOrder) {
    state = state.copyWith(sortBy: sortBy, sortOrder: sortOrder);
  }

  void clearFilters() {
    state = OrdersFilter();
  }
}

// Selected Orders Provider (for bulk operations)
final selectedOrdersProvider = NotifierProvider<SelectedOrdersNotifier, Set<int>>(() {
  return SelectedOrdersNotifier();
});

class SelectedOrdersNotifier extends Notifier<Set<int>> {
  @override
  Set<int> build() {
    return {};
  }

  void toggle(int orderId) {
    if (state.contains(orderId)) {
      state = {...state}..remove(orderId);
    } else {
      state = {...state, orderId};
    }
  }

  void selectAll(List<int> orderIds) {
    state = orderIds.toSet();
  }

  void clearSelection() {
    state = {};
  }
}

// Admin Orders Provider with Pagination
final adminOrdersProvider = AsyncNotifierProvider<AdminOrdersNotifier, PaginatedOrders>(() {
  return AdminOrdersNotifier();
});

class AdminOrdersNotifier extends AsyncNotifier<PaginatedOrders> {
  final ApiService _apiService = ApiService();
  int _currentPage = 1;

  @override
  Future<PaginatedOrders> build() async {
    return _fetchOrders(page: 1);
  }

  Future<PaginatedOrders> _fetchOrders({required int page}) async {
    try {
      final filter = ref.read(ordersFilterProvider);
      final params = {
        'admin': 'true',
        'page': page.toString(),
        'limit': '50',
        ...filter.toQueryParams(),
      };

      final queryString = params.entries
          .map((e) => '${e.key}=${Uri.encodeComponent(e.value)}')
          .join('&');

      final response = await _apiService.client.get('shop/orders?$queryString');
      _currentPage = page;
      
      dynamic responseData = response.data;
      if (responseData is List) {
        responseData = <String, dynamic>{
          'orders': responseData,
          'pagination': <String, dynamic>{
             'page': page,
             'limit': 50,
             'total': responseData.length,
             'totalPages': 1,
             'hasMore': false
          }
        };
      } else if (responseData is Map && responseData['orders'] == null && responseData['data'] is List) {
           responseData = <String, dynamic>{
          'orders': responseData['data'],
          'pagination': <String, dynamic>{
             'page': page,
             'limit': 50,
             'total': (responseData['data'] as List).length,
             'totalPages': 1,
             'hasMore': false
          }
        };
      }
      
      return PaginatedOrders.fromJson(responseData);
    } catch (e) {
      print('Orders fetch error: $e');
      throw Exception('Failed to fetch orders');
    }
  }

  Future<void> loadNextPage() async {
    final currentState = state.value;
    if (currentState != null && currentState.hasMore) {
      state = const AsyncValue.loading();
      state = await AsyncValue.guard(() => _fetchOrders(page: _currentPage + 1));
    }
  }

  Future<void> refresh() async {
    _currentPage = 1;
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchOrders(page: 1));
  }

  Future<bool> updateStatus(int orderId, String status, {String? paymentStatus, String? notes}) async {
    try {
      final response = await _apiService.client.put('shop/orders', data: {
        'id': orderId,
        'status': status,
        if (paymentStatus != null) 'paymentStatus': paymentStatus,
        if (notes != null) 'notes': notes,
      });

      if (response.statusCode == 200) {
        await refresh();
        return true;
      }
      return false;
    } catch (e) {
      print('Status update error: $e');
      return false;
    }
  }

  Future<Map<String, dynamic>> bulkOperation(String action, List<int> orderIds, Map<String, dynamic>? data) async {
    try {
      final response = await _apiService.client.post('shop/orders/bulk', data: {
        'action': action,
        'orderIds': orderIds,
        if (data != null) 'data': data,
      });

      if (response.statusCode == 200) {
        await refresh();
        return {'success': true, ...response.data};
      }
      return {'success': false, 'message': 'Bulk operation failed'};
    } catch (e) {
      print('Bulk operation error: $e');
      return {'success': false, 'message': e.toString()};
    }
  }
}

// Shop Filter Provider
final shopFilterProvider = NotifierProvider<ShopFilterNotifier, ShopFilterState>(() {
  return ShopFilterNotifier();
});

class ShopFilterState {
  final String searchQuery;
  final String selectedCategory;

  ShopFilterState({this.searchQuery = '', this.selectedCategory = 'All'});

  ShopFilterState copyWith({String? searchQuery, String? selectedCategory}) {
    return ShopFilterState(
      searchQuery: searchQuery ?? this.searchQuery,
      selectedCategory: selectedCategory ?? this.selectedCategory,
    );
  }
}

class ShopFilterNotifier extends Notifier<ShopFilterState> {
  @override
  ShopFilterState build() => ShopFilterState();

  void setSearch(String query) {
    state = state.copyWith(searchQuery: query);
  }

  void setCategory(String category) {
    state = state.copyWith(selectedCategory: category);
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

  void addToCart(Product product, {int quantity = 1}) {
    final existingIndex = state.indexWhere((item) => item.product.id == product.id);
    if (existingIndex >= 0) {
      state[existingIndex].quantity += quantity;
      state = [...state];
    } else {
      state = [...state, CartItem(product: product, quantity: quantity)];
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

  Future<Map<String, dynamic>?> placeOrder(List<CartItem> items, double totalAmount) async {
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

      final response = await _apiService.client.post('shop/orders', data: orderData);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        state = const AsyncValue.data(true);
        // Return JSON directly so UI can use it for Razorpay
        return response.data as Map<String, dynamic>; 
      }
      state = const AsyncValue.data(false);
      return null;
    } catch (e) {
      state = AsyncValue.error(e, StackTrace.current);
      return null;
    }
  }

  Future<bool> verifyPayment(Map<String, dynamic> data) async {
    try {
      final response = await _apiService.client.post('shop/verify', data: data);
      return response.statusCode == 200 && response.data['success'] == true;
    } catch (e) {
      return false;
    }
  }
}
