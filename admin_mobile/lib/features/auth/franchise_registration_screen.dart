import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_html/flutter_html.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:file_picker/file_picker.dart';
import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart'; // For MediaType
import 'package:razorpay_flutter/razorpay_flutter.dart';
import '../../core/api_service.dart';

class FranchiseRegistrationScreen extends ConsumerStatefulWidget {
  const FranchiseRegistrationScreen({super.key});

  @override
  ConsumerState<FranchiseRegistrationScreen> createState() => _FranchiseRegistrationScreenState();
}

class _FranchiseRegistrationScreenState extends ConsumerState<FranchiseRegistrationScreen> {
  int _currentStep = 0;
  bool _isLoading = false;
  int? _franchiseId; // Stores the newly created franchise ID
  late Razorpay _razorpay;

  // Step 1: Details
  final _formKeyDetails = GlobalKey<FormState>();
  final _nameCtrl = TextEditingController();
  final _emailCtrl = TextEditingController();
  final _phoneCtrl = TextEditingController();
  final _cityCtrl = TextEditingController();
  final _passwordCtrl = TextEditingController();
  
  // Banking (Optional)
  final _upiCtrl = TextEditingController();
  final _bankNameCtrl = TextEditingController();
  final _accountCtrl = TextEditingController();
  final _ifscCtrl = TextEditingController();

  // Step 2: KYC
  File? _kycFile;

  // Step 3: Pricing
  String _selectedPlan = ''; 

  // Step 4: Agreement
  bool _agreementAccepted = false;
  String _agreementHtml = '<p>Loading Agreement...</p>';

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
    super.dispose();
    _razorpay.clear();
  }

  void _handlePaymentSuccess(PaymentSuccessResponse response) {
    // Payment success logic
    // You might want to verify the signature on the backend here
    // For now, we proceed to finalize the plan
    _finalizePlan(_selectedPlan);
  }

  void _handlePaymentError(PaymentFailureResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("Payment Failed: ${response.message}")),
    );
  }

  void _handleExternalWallet(ExternalWalletResponse response) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text("External Wallet Selected: ${response.walletName}")),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.white,
      appBar: AppBar(
        title: const Text('Partner Application'),
        backgroundColor: Colors.white,
        foregroundColor: const Color(0xFF0F172A),
        elevation: 0,
      ),
      body: _isLoading 
        ? const Center(child: CircularProgressIndicator())
        : Column(
            children: [
              _buildCustomStepper(),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    children: [
                       if (_currentStep == 0) _buildDetailsStep(),
                       if (_currentStep == 1) _buildKycStep(),
                       if (_currentStep == 2) _buildPricingStep(),
                       if (_currentStep == 3) _buildAgreementStep(),
                       
                       const SizedBox(height: 32),
                       
                       // Controls
                       Row(
                        children: [
                          if (_currentStep > 0)
                            Expanded(
                              child: OutlinedButton(
                                onPressed: () => setState(() => _currentStep--),
                                style: OutlinedButton.styleFrom(
                                  padding: const EdgeInsets.symmetric(vertical: 16),
                                  side: const BorderSide(color: Colors.grey),
                                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                                ),
                                child: const Text('Back', style: TextStyle(color: Colors.black)),
                              ),
                            ),
                          if (_currentStep > 0) const SizedBox(width: 16),
                          Expanded(
                            flex: 2,
                            child: ElevatedButton(
                              onPressed: _handleStepContinue,
                              style: ElevatedButton.styleFrom(
                                backgroundColor: const Color(0xFF0F172A),
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 16),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(8)),
                              ),
                              child: Text(_currentStep == 3 ? 'Sign & Complete' : 'Next'),
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
    );
  }

  Widget _buildCustomStepper() {
    return Container(
      padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
      color: Colors.grey[50],
      child: Row(
        children: [
          _stepIndicator(0, 'Details', _currentStep >= 0),
          _connector(_currentStep >= 1),
          _stepIndicator(1, 'KYC', _currentStep >= 1),
          _connector(_currentStep >= 2),
          _stepIndicator(2, 'Plan', _currentStep >= 2),
          _connector(_currentStep >= 3),
          _stepIndicator(3, 'Sign', _currentStep >= 3),
        ],
      ),
    );
  }

  Widget _stepIndicator(int step, String label, bool isActive) {
     return Column(
       children: [
         CircleAvatar(
           radius: 12,
           backgroundColor: isActive ? const Color(0xFF0F172A) : Colors.grey[300],
           child: isActive 
             ? const Icon(Icons.check, size: 14, color: Colors.white) 
             : Text((step + 1).toString(), style: const TextStyle(fontSize: 10, color: Colors.white)),
         ),
         const SizedBox(height: 4),
         Text(label, style: TextStyle(fontSize: 10, fontWeight: isActive ? FontWeight.bold : FontWeight.normal, color: isActive ? Colors.black : Colors.grey)),
       ],
     );
  }

  Widget _connector(bool isActive) {
    return Expanded(
      child: Container(
        height: 2,
        margin: const EdgeInsets.only(bottom: 14, left: 4, right: 4), // Align with circle center
        color: isActive ? const Color(0xFF0F172A) : Colors.grey[300],
      ),
    );
  }
  
  Widget _buildDetailsStep() {
    return Form(
      key: _formKeyDetails,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text('Personal Information', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          TextFormField(controller: _nameCtrl, decoration: _inputDec('Full Name', Icons.person), validator: (v) => v!.isEmpty ? 'Required' : null),
          const SizedBox(height: 12),
          TextFormField(controller: _emailCtrl, decoration: _inputDec('Email', Icons.email), keyboardType: TextInputType.emailAddress, validator: (v) => v!.isEmpty ? 'Required' : null),
          const SizedBox(height: 12),
          TextFormField(controller: _phoneCtrl, decoration: _inputDec('Phone', Icons.phone), keyboardType: TextInputType.phone, validator: (v) => v!.isEmpty ? 'Required' : null),
          const SizedBox(height: 12),
          TextFormField(controller: _cityCtrl, decoration: _inputDec('City', Icons.location_city), validator: (v) => v!.isEmpty ? 'Required' : null),
          const SizedBox(height: 12),
          TextFormField(controller: _passwordCtrl, decoration: _inputDec('Set Password', Icons.lock), obscureText: true, validator: (v) => v!.length < 6 ? 'Min 6 chars' : null),
          const SizedBox(height: 24),
          Text('Payout Details (Optional)', style: GoogleFonts.poppins(fontWeight: FontWeight.bold, fontSize: 16)),
          const SizedBox(height: 16),
          TextFormField(controller: _upiCtrl, decoration: _inputDec('UPI ID', Icons.payment)),
          const SizedBox(height: 12),
          TextFormField(controller: _bankNameCtrl, decoration: _inputDec('Bank Name', Icons.account_balance)),
          const SizedBox(height: 12),
          TextFormField(controller: _accountCtrl, decoration: _inputDec('Account Number', Icons.numbers)),
          const SizedBox(height: 12),
          TextFormField(controller: _ifscCtrl, decoration: _inputDec('IFSC Code', Icons.code)),
        ],
      ),
    );
  }

  Widget _buildKycStep() {
    return Column(
      children: [
        const Text('Upload Aadhar or PAN Card', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 8),
        const Text('Supported formats: JPG, PNG, PDF', style: TextStyle(color: Colors.grey)),
        const SizedBox(height: 24),
        GestureDetector(
          onTap: _pickFile,
          child: Container(
            height: 150,
            width: double.infinity,
            decoration: BoxDecoration(
              color: Colors.grey[100],
              border: Border.all(color: Colors.grey[300]!),
              borderRadius: BorderRadius.circular(12),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.cloud_upload_outlined, size: 48, color: Colors.blue[700]),
                const SizedBox(height: 8),
                Text(
                  _kycFile != null ? _kycFile!.path.split('/').last : 'Tap to Upload Document',
                  textAlign: TextAlign.center,
                  style: TextStyle(color: Colors.blue[700], fontWeight: FontWeight.w600),
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPricingStep() {
    return Column(
      children: [
        const Text('Choose Your Plan', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        _planCard('Starter (Free)', 'free', '50% Revenue Share', Colors.green),
        _planCard('Standard (₹499/yr)', 'basic', '60% Revenue Share', Colors.blue),
        _planCard('Premium (₹999/yr)', 'premium', '70% Revenue Share', Colors.red),
        _planCard('Elite (₹2499/yr)', 'elite', '80% Revenue Share', Colors.orange),
      ],
    );
  }

  Widget _buildAgreementStep() {
    return Column(
      children: [
        const Text('Franchise Partner Agreement', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
        const SizedBox(height: 16),
        Container(
          height: 300,
          padding: const EdgeInsets.all(12),
          decoration: BoxDecoration(border: Border.all(color: Colors.grey[300]!), borderRadius: BorderRadius.circular(8)),
          child: SingleChildScrollView(
            child: Html(
              data: _agreementHtml,
              style: {
                "body": Style(margin: Margins.zero, padding: HtmlPaddings.zero, fontSize: FontSize(14)),
                "p": Style(lineHeight: LineHeight(1.5)),
              },
            ),
          ),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Checkbox(value: _agreementAccepted, onChanged: (v) => setState(() => _agreementAccepted = v!)),
            const Expanded(child: Text('I have read and agree to the terms')),
          ],
        )
      ],
    );
  }
  
  Widget _planCard(String title, String value, String subtitle, Color color) {
    final isSelected = _selectedPlan == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedPlan = value),
      child: Container(
        margin: const EdgeInsets.only(bottom: 12),
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          border: Border.all(color: isSelected ? color : Colors.grey[200]!, width: isSelected ? 2 : 1),
          borderRadius: BorderRadius.circular(12),
          color: isSelected ? color.withOpacity(0.05) : Colors.white,
        ),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16, color: color)),
                  Text(subtitle, style: const TextStyle(color: Colors.grey)),
                ],
              ),
            ),
            if (isSelected) Icon(Icons.check_circle, color: color),
          ],
        ),
      ),
    );
  }
  
  InputDecoration _inputDec(String label, IconData icon) {
    return InputDecoration(
      labelText: label,
      prefixIcon: Icon(icon, color: Colors.grey),
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
    );
  }

  Future<void> _pickFile() async {
    FilePickerResult? result = await FilePicker.platform.pickFiles(type: FileType.custom, allowedExtensions: ['jpg', 'pdf', 'png', 'jpeg']);
    if (result != null) {
      setState(() => _kycFile = File(result.files.single.path!));
    }
  }

  Future<void> _handleStepContinue() async {
    if (_currentStep == 0) {
      if (!_formKeyDetails.currentState!.validate()) return;
      await _submitDetails();
    } else if (_currentStep == 1) {
      if (_kycFile == null) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please upload KYC document')));
          return;
      }
      await _submitKyc();
    } else if (_currentStep == 2) {
      if (_selectedPlan.isEmpty) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please select a plan')));
          return;
      }
      await _submitPricing();
    } else {
      if (!_agreementAccepted) {
          ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Please accept the agreement')));
          return;
      }
      await _submitAgreement();
    }
  }
  
  Future<void> _submitDetails() async {
    setState(() => _isLoading = true);
    final data = {
      'name': _nameCtrl.text.trim(),
      'email': _emailCtrl.text.trim(),
      'phone': _phoneCtrl.text.trim(),
      'city': _cityCtrl.text.trim(),
      'password': _passwordCtrl.text.trim(),
      'upi_id': _upiCtrl.text.trim(),
      'bank_account_number': _accountCtrl.text.trim(),
      'ifsc_code': _ifscCtrl.text.trim(),
      'bank_name': _bankNameCtrl.text.trim(),
    };
    
    try {
        final api = ApiService();
        final res = await api.client.post('/api/franchise/register', data: data);
        if (res.statusCode == 200 || res.statusCode == 201) {
            _franchiseId = res.data['franchiseId'] ?? res.data['requestId']; 
            setState(() { _currentStep++; _isLoading = false; });
        } else {
             throw _parseError(res);
        }
    } catch (e) {
        setState(() => _isLoading = false);
        _showError(e);
    }
  }

  Future<void> _submitKyc() async {
    setState(() => _isLoading = true);
    try {
      final api = ApiService();
      String fileName = _kycFile!.path.split('/').last;
      
      // Determine media type
      MediaType? mediaType;
      if (fileName.toLowerCase().endsWith('.pdf')) {
        mediaType = MediaType('application', 'pdf');
      } else if (fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg')) {
        mediaType = MediaType('image', 'jpeg');
      } else if (fileName.toLowerCase().endsWith('.png')) {
        mediaType = MediaType('image', 'png');
      }

      // Ensure requestId is sent as string for FormData
      FormData formData = FormData.fromMap({
        'file': await MultipartFile.fromFile(
            _kycFile!.path, 
            filename: fileName,
            contentType: mediaType
        ),
        'requestId': _franchiseId.toString(), 
      });

      final res = await api.client.post('/api/kyc', data: formData);
      
      if (res.statusCode == 200) {
        setState(() { _currentStep++; _isLoading = false; });
      } else {
        throw _parseError(res);
      }
    } catch (e) {
      setState(() => _isLoading = false);
      _showError(e);
    }
  }

  Future<void> _submitPricing() async {
    if (_selectedPlan == 'free') {
       await _finalizePlan('free');
       return;
    }
    
    setState(() => _isLoading = true);
    try {
       final api = ApiService();
       final res = await api.client.post('/api/pricing/create-order', data: {
         'requestId': _franchiseId,
         'plan': _selectedPlan
       });
       
       if (res.data['isFree'] == true) {
          setState(() { _currentStep++; _isLoading = false; });
       } else {
          _openRazorpay(res.data);
       }
    } catch (e) {
       setState(() => _isLoading = false);
       _showError(e);
    }
  }
  
  void _openRazorpay(Map<String, dynamic> orderData) {
     var options = {
       'key': orderData['keyId'],
       'amount': orderData['amount'],
       'name': 'The Kada Franchise',
       'description': 'Franchise Fee Payment',
       'order_id': orderData['orderId'], 
       'prefill': {
         'contact': _phoneCtrl.text,
         'email': _emailCtrl.text
       },
       'external': {
         'wallets': ['paytm']
       }
     };

     try {
       _razorpay.open(options);
     } catch (e) {
       debugPrint('Error: $e');
     }
  }

  Future<void> _finalizePlan(String plan) async {
     setState(() => _isLoading = true);
     try {
       final api = ApiService();
       final res = await api.client.get('/api/content');
       setState(() {
          _agreementHtml = res.data['agreement_text'] ?? '<p>Standard Agreement...</p>';
          _currentStep++; 
          _isLoading = false;
       });
     } catch (e) {
        setState(() {
           _agreementHtml = '<p>Could not load agreement. Please check network.</p>';
           _currentStep++; 
           _isLoading = false;
        });
     }
  }
  
  Future<void> _submitAgreement() async {
      setState(() => _isLoading = true);
      try {
         final api = ApiService();
         final res = await api.client.post('/api/agreement', data: { 'requestId': _franchiseId });
         
         if (res.statusCode == 200) {
            _showSuccessDialog();
         } else {
            throw _parseError(res);
         }
      } catch (e) {
         setState(() => _isLoading = false);
         _showError(e);
      }
  }

  // Improved Error Handling
  String _parseError(dynamic error) {
      if (error is DioException) {
         if (error.response?.data != null && error.response!.data is Map) {
             return error.response!.data['message'] ?? 'Server Error';
         }
         return 'Network Error: ${error.message}';
      }
      return error.toString();
  }

  void _showError(dynamic error) {
      final message = _parseError(error);
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
          content: Text(message),
          backgroundColor: Colors.red,
          behavior: SnackBarBehavior.floating,
      ));
  }

  void _showSuccessDialog() {
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (context) => AlertDialog(
            title: const Text('Application Submitted!'),
            content: const Text('Welcome to The Kada Family. Your application is under review. You can login to check your status.'),
            actions: [
                TextButton(
                    onPressed: () {
                        Navigator.pop(context); // Close dialog
                        Navigator.pop(context); // Close screen
                    },
                    child: const Text('OK'),
                )
            ],
        ),
      );
  }
}
