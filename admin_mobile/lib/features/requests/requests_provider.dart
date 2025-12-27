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
      id: json['id'],
      name: json['name'],
      email: json['email'],
      city: json['city'] ?? '',
      status: json['status'],
      phone: json['phone'],
      kycUrl: json['aadhar_url'],
      planSelected: json['plan_selected'] ?? 'free',
      upiId: json['upi_id'],
      bankAccountNumber: json['bank_account_number'],
      ifscCode: json['ifsc_code'],
      bankName: json['bank_name'],
      zoneId: json['zone_id'],
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
    return (response.data as List).map((e) => FranchiseRequest.fromJson(e)).toList();
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
