import 'dart:io';
import 'dart:ui';
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
    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // Subtle Decorative Accents
          Positioned(
            top: -100,
            left: -50,
            child: _buildDecorativeCircle(250, const Color(0xFF2563EB).withOpacity(0.04)),
          ),
          Positioned(
            bottom: -50,
            right: -80,
            child: _buildDecorativeCircle(200, const Color(0xFF7C3AED).withOpacity(0.04)),
          ),

          SafeArea(
            child: Column(
              children: [
                _buildModernHeader(),
                
                _buildModernStepper(),

                Expanded(
                  child: _isLoading 
                    ? const Center(child: CircularProgressIndicator(color: Color(0xFF2563EB)))
                    : SingleChildScrollView(
                        padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
                        child: Column(
                          children: [
                            Container(
                              padding: const EdgeInsets.all(28),
                              decoration: BoxDecoration(
                                color: Colors.white,
                                borderRadius: BorderRadius.circular(30),
                                border: Border.all(color: const Color(0xFFF1F5F9)),
                                boxShadow: [
                                  BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 40, offset: const Offset(0, 20)),
                                ],
                              ),
                              child: Column(
                                children: [
                                   if (_currentStep == 0) _buildDetailsStep(),
                                   if (_currentStep == 1) _buildKycStep(),
                                   if (_currentStep == 2) _buildPricingStep(),
                                   if (_currentStep == 3) _buildAgreementStep(),
                                ],
                              ),
                            ),
                            
                            const SizedBox(height: 32),
                            _buildNavigationControls(),
                            const SizedBox(height: 24),
                          ],
                        ),
                      ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildDecorativeCircle(double size, Color color) {
    return Container(
      width: size,
      height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
    );
  }

  Widget _buildModernHeader() {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 24, 8),
      child: Row(
        children: [
          IconButton(
            icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172A), size: 18),
            onPressed: () => Navigator.pop(context),
          ),
          const SizedBox(width: 4),
          Text(
            'Partner Application',
            style: GoogleFonts.outfit(
              fontSize: 22,
              fontWeight: FontWeight.bold,
              color: const Color(0xFF0F172A),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildModernStepper() {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
      padding: const EdgeInsets.symmetric(vertical: 20, horizontal: 24),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
        border: Border.all(color: const Color(0xFFF1F5F9)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: List.generate(4, (index) {
          final isActive = _currentStep >= index;
          return Expanded(
            child: Row(
              children: [
                _modernStepIndicator(index, isActive),
                if (index < 3) 
                  Expanded(
                    child: Container(
                      height: 3,
                      margin: const EdgeInsets.symmetric(horizontal: 8),
                      decoration: BoxDecoration(
                        color: isActive ? const Color(0xFF2563EB) : const Color(0xFFF1F5F9),
                        borderRadius: BorderRadius.circular(2),
                      ),
                    ),
                  ),
              ],
            ),
          );
        }),
      ),
    );
  }

  Widget _modernStepIndicator(int step, bool isActive) {
     return Container(
       width: 32,
       height: 32,
       decoration: BoxDecoration(
         shape: BoxShape.circle,
         color: isActive ? const Color(0xFF2563EB) : Colors.white,
         border: Border.all(color: isActive ? const Color(0xFF2563EB) : const Color(0xFFE2E8F0), width: 2),
       ),
       child: Center(
         child: isActive 
           ? const Icon(Icons.check_rounded, size: 16, color: Colors.white)
           : Text(
               (step + 1).toString(), 
               style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.bold),
             ),
       ),
     );
  }

  Widget _buildNavigationControls() {
    return Row(
      children: [
        if (_currentStep > 0)
          Expanded(
            child: OutlinedButton(
              onPressed: () => setState(() => _currentStep--),
              style: OutlinedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 18),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
                side: const BorderSide(color: Color(0xFFE2E8F0)),
              ),
              child: Text('Previous', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.bold)),
            ),
          ),
        if (_currentStep > 0) const SizedBox(width: 16),
        Expanded(
          flex: 2,
          child: _buildPrimaryButton(
            _currentStep == 3 ? 'Complete Now' : 'Continue Step',
            _handleStepContinue,
          ),
        ),
      ],
    );
  }

  Widget _buildPrimaryButton(String title, VoidCallback onTap) {
    return Container(
      height: 60,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)]),
        boxShadow: [
          BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.2), blurRadius: 15, offset: const Offset(0, 8)),
        ],
      ),
      child: ElevatedButton(
        onPressed: onTap,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
        child: Text(title, style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 15, color: Colors.white)),
      ),
    );
  }

  
  Widget _buildDetailsStep() {
    return Form(
      key: _formKeyDetails,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _sectionTitle('PERSONAL PROFILE'),
          _buildFormField(_nameCtrl, 'Full Name', Icons.person_outline_rounded),
          _buildFormField(_emailCtrl, 'Email Address', Icons.email_outlined, type: TextInputType.emailAddress),
          _buildFormField(_phoneCtrl, 'Mobile Number', Icons.phone_outlined, type: TextInputType.phone),
          _buildFormField(_cityCtrl, 'Service City', Icons.location_on_outlined),
          _buildFormField(_passwordCtrl, 'Account Password', Icons.lock_outline_rounded, obscure: true),
          
          const SizedBox(height: 32),
          _sectionTitle('PAYOUT PREFERENCES'),
          _buildFormField(_upiCtrl, 'UPI ID (Recommended)', Icons.account_balance_wallet_outlined),
          _buildFormField(_bankNameCtrl, 'Bank Institution', Icons.account_balance_rounded),
          _buildFormField(_accountCtrl, 'Account Number', Icons.numbers_rounded),
          _buildFormField(_ifscCtrl, 'IFSC Registry Code', Icons.code_rounded),
        ],
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Text(
        title, 
        style: GoogleFonts.inter(fontWeight: FontWeight.w900, fontSize: 11, color: const Color(0xFF94A3B8), letterSpacing: 1.5)
      ),
    );
  }

  Widget _buildFormField(TextEditingController ctrl, String label, IconData icon, {TextInputType type = TextInputType.text, bool obscure = false}) {
    return Container(
      margin: const EdgeInsets.only(bottom: 16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFF1F5F9)),
            ),
            child: TextFormField(
              controller: ctrl,
              keyboardType: type,
              obscureText: obscure,
              style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontSize: 15, fontWeight: FontWeight.w600),
              decoration: InputDecoration(
                hintText: label,
                hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 14, fontWeight: FontWeight.w500),
                prefixIcon: Icon(icon, color: const Color(0xFF64748B), size: 20),
                border: InputBorder.none,
                contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 18),
              ),
              validator: (v) => v!.isEmpty ? 'Required' : null,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildKycStep() {
    return Column(
      children: [
        _sectionTitle('KYC DOCUMENTATION'),
        Text(
          'Please upload a clear copy of your Identity Document (Aadhar/PAN)', 
          textAlign: TextAlign.center,
          style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 14, height: 1.5)
        ),
        const SizedBox(height: 40),
        GestureDetector(
          onTap: _pickFile,
          child: Container(
            height: 200,
            width: double.infinity,
            decoration: BoxDecoration(
              color: const Color(0xFFF8FAFC),
              border: Border.all(color: const Color(0xFFE2E8F0), style: BorderStyle.solid),
              borderRadius: BorderRadius.circular(24),
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: const Color(0xFF2563EB).withOpacity(0.08), shape: BoxShape.circle),
                  child: const Icon(Icons.upload_file_rounded, size: 48, color: Color(0xFF2563EB)),
                ),
                const SizedBox(height: 20),
                Text(
                  _kycFile != null ? _kycFile!.path.split('/').last : 'Upload Credentials',
                  textAlign: TextAlign.center,
                  style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 14),
                ),
                const SizedBox(height: 4),
                Text('PDF, JPG or PNG up to 5MB', style: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 11)),
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
        _sectionTitle('SELECT PARTNERSHIP PLAN'),
        _planCardModern('Starter', 'free', '50% Revenue Share', '₹0', const Color(0xFF10B981)),
        _planCardModern('Standard', 'basic', '60% Revenue Share', '₹499/yr', const Color(0xFF3B82F6)),
        _planCardModern('Premium', 'premium', '70% Revenue Share', '₹999/yr', const Color(0xFF6366F1)),
        _planCardModern('Elite', 'elite', '80% Revenue Share', '₹2,499/yr', const Color(0xFFF59E0B)),
      ],
    );
  }

  Widget _planCardModern(String title, String value, String subsidy, String price, Color color) {
    final isSelected = _selectedPlan == value;
    return GestureDetector(
      onTap: () => setState(() => _selectedPlan = value),
      child: Container(
        margin: const EdgeInsets.only(bottom: 16),
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          color: isSelected ? color.withOpacity(0.04) : const Color(0xFFF8FAFC),
          borderRadius: BorderRadius.circular(20),
          border: Border.all(color: isSelected ? color : const Color(0xFFF1F5F9), width: 2),
        ),
        child: Row(
          children: [
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: color.withOpacity(0.1), borderRadius: BorderRadius.circular(14)),
              child: Icon(Icons.verified_rounded, color: color, size: 22),
            ),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontWeight: FontWeight.bold, fontSize: 17)),
                  Text(subsidy, style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 12, fontWeight: FontWeight.w500)),
                ],
              ),
            ),
            Text(price, style: GoogleFonts.outfit(color: isSelected ? color : const Color(0xFF0F172A), fontWeight: FontWeight.w900, fontSize: 16)),
          ],
        ),
      ),
    );
  }

  Widget _buildAgreementStep() {
    return Column(
      children: [
        _sectionTitle('TERMS & CONDITIONS'),
        Container(
          height: 380,
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            border: Border.all(color: const Color(0xFFF1F5F9)),
            borderRadius: BorderRadius.circular(24),
          ),
          child: ClipRRect(
            borderRadius: BorderRadius.circular(24),
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Html(
                data: _agreementHtml,
                style: {
                  "body": Style(
                    margin: Margins.zero, 
                    padding: HtmlPaddings.zero, 
                    fontSize: FontSize(14),
                    color: const Color(0xFF475569),
                    fontFamily: 'Inter',
                  ),
                  "p": Style(lineHeight: LineHeight(1.6)),
                },
              ),
            ),
          ),
        ),
        const SizedBox(height: 28),
        InkWell(
          onTap: () => setState(() => _agreementAccepted = !_agreementAccepted),
          borderRadius: BorderRadius.circular(12),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 8),
            child: Row(
              children: [
                Container(
                  width: 26,
                  height: 26,
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(8),
                    color: _agreementAccepted ? const Color(0xFF10B981) : Colors.white,
                    border: Border.all(color: _agreementAccepted ? const Color(0xFF10B981) : const Color(0xFFCBD5E1), width: 2),
                  ),
                  child: _agreementAccepted ? const Icon(Icons.check_rounded, size: 18, color: Colors.white) : null,
                ),
                const SizedBox(width: 14),
                Expanded(
                  child: Text(
                    'I confirm that I have read and accepted the partner agreement',
                    style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontSize: 13, fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
        )
      ],
    );
  }
  
  Widget _planCard(String a, String b, String c, Color d) => const SizedBox(); // Dummy
  
  InputDecoration _inputDec(String label, IconData icon) => const InputDecoration(); // Dummy for replacement safety

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
        final res = await api.client.post('franchise/register', data: data);
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

      final res = await api.client.post('kyc', data: formData);
      
      if (res.statusCode == 200 || res.statusCode == 201) {
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
       final res = await api.client.post('pricing/create-order', data: {
         'requestId': _franchiseId,
         'plan': _selectedPlan
       });
       
       if (res.statusCode == 200 || res.statusCode == 201) {
          if (res.data['isFree'] == true) {
             setState(() { _currentStep++; _isLoading = false; });
          } else {
             _openRazorpay(res.data);
          }
       } else {
          throw _parseError(res);
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
       final res = await api.client.get('content');
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
         final res = await api.client.post('agreement', data: { 'requestId': _franchiseId });
         if (res.statusCode == 200 || res.statusCode == 201) {
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
