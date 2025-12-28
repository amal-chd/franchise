import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api_service.dart';

class FranchiseRequest {
  final int id;
  final String name;
  final String email;
  final String city;
  final String status;
  final String phone;
  final String? kycUrl;
  final String planSelected;
  final String? upiId;
  final String? bankAccountNumber;
  final String? ifscCode;
  final String? bankName;
  final int? zoneId;

  FranchiseRequest({
    required this.id,
    required this.name,
    required this.email,
    required this.city,
    required this.status,
    required this.phone,
    this.kycUrl,
    required this.planSelected,
    this.upiId,
    this.bankAccountNumber,
    this.ifscCode,
    this.bankName,
    this.zoneId,
  });

  factory FranchiseRequest.fromJson(Map<String, dynamic> json) {
    return FranchiseRequest(
      id: int.tryParse(json['id'].toString()) ?? 0,
      name: json['name'] ?? 'Unknown Name',
      email: json['email'] ?? 'No Email',
      city: json['city']?.toString() ?? '',
      status: json['status'] ?? 'pending',
      phone: json['phone']?.toString() ?? 'No Phone',
      kycUrl: json['aadhar_url']?.toString(),
      planSelected: json['plan_selected'] ?? 'free',
      upiId: json['upi_id']?.toString(),
      bankAccountNumber: json['bank_account_number']?.toString(),
      ifscCode: json['ifsc_code']?.toString(),
      bankName: json['bank_name']?.toString(),
      zoneId: int.tryParse(json['zone_id']?.toString() ?? ''),
    );
  }
}

final requestsProvider = AsyncNotifierProvider<RequestsNotifier, List<FranchiseRequest>>(() {
  return RequestsNotifier();
});

class RequestsNotifier extends AsyncNotifier<List<FranchiseRequest>> {
  final ApiService _apiService = ApiService();

  @override
  Future<List<FranchiseRequest>> build() async {
    return _fetchRequests();
  }

  Future<List<FranchiseRequest>> _fetchRequests() async {
    final response = await _apiService.client.get('admin/requests');
    List data = [];
    if (response.data is List) {
      data = response.data as List;
    } else if (response.data is Map && response.data['data'] != null) {
      data = response.data['data'] as List;
    }
    return data.map((e) => FranchiseRequest.fromJson(e)).toList();
  }

  Future<bool> createFranchise(Map<String, dynamic> data) async {
    try {
      final response = await _apiService.client.post('admin/franchises', data: data);
      if (response.statusCode == 200 || response.statusCode == 201) {
        await refresh(); // Reload list
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }

  Future<void> fetchRequests() async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() => _fetchRequests());
  }

  Future<void> refresh() => fetchRequests();

  Future<bool> verifyRequest(int id, String status, {String? reason}) async {
    try {
      final response = await _apiService.client.post('admin/verify', data: {
        'id': id,
        'status': status,
        if (reason != null) 'rejectionReason': reason,
      });

      if (response.statusCode == 200 || response.statusCode == 201) {
        fetchRequests();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  
  Future<bool> deleteRequest(int id) async {
     try {
      final response = await _apiService.client.delete('admin/franchises?id=$id');
      if (response.statusCode == 200) {
        fetchRequests();
        return true;
      }
      return false;
    } catch (e) {
      return false;
    }
  }
  Future<bool> updateFranchise(int id, Map<String, dynamic> data) async {
    try {
      final response = await _apiService.client.put('admin/franchises', data: {'id': id, ...data});
      if (response.statusCode == 200) {
        await refresh();
        return true;
      }
      return false;
    } catch (e) {
      print('Update Error: $e');
      return false;
    }
  }

  Future<bool> registerPublicly(Map<String, dynamic> data) async {
    try {
      final response = await _apiService.client.post('franchise/register', data: data);
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      print('Registration Error: $e');
      return false;
    }
  }
}
