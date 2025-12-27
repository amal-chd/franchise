import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'profile_provider.dart';

class BankingDetailsScreen extends ConsumerStatefulWidget {
  const BankingDetailsScreen({super.key});

  @override
  ConsumerState<BankingDetailsScreen> createState() => _BankingDetailsScreenState();
}

class _BankingDetailsScreenState extends ConsumerState<BankingDetailsScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _upiController;
  late TextEditingController _bankNameController;
  late TextEditingController _accountController;
  late TextEditingController _ifscController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final profile = ref.read(profileProvider).value;
    _upiController = TextEditingController(text: profile?.upiId);
    _bankNameController = TextEditingController(text: profile?.bankName);
    _accountController = TextEditingController(text: profile?.bankAccountNumber);
    _ifscController = TextEditingController(text: profile?.ifscCode);
  }

  @override
  void dispose() {
    _upiController.dispose();
    _bankNameController.dispose();
    _accountController.dispose();
    _ifscController.dispose();
    super.dispose();
  }

  Future<void> _saveBanking() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    final profile = ref.read(profileProvider).value;
    if (profile == null) return;

    final updatedProfile = profile.copyWith(
      upiId: _upiController.text.trim(),
      bankName: _bankNameController.text.trim(),
      bankAccountNumber: _accountController.text.trim(),
      ifscCode: _ifscController.text.trim(),
    );

    final success = await ref.read(profileProvider.notifier).updateProfile(updatedProfile);
    
    setState(() => _isSaving = false);
    
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Banking details updated'), backgroundColor: Color(0xFF10B981)),
      );
      Navigator.pop(context);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Update failed'), backgroundColor: Color(0xFFEF4444)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Banking & Payouts', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A))),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172A), size: 18),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              _buildSectionTitle('PAYMENT METHODS'),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _upiController,
                label: 'UPI ID',
                icon: Icons.account_balance_wallet_outlined,
                hint: 'example@upi',
              ),
              const SizedBox(height: 32),
              _buildSectionTitle('BANK ACCOUNT'),
              const SizedBox(height: 16),
              _buildTextField(
                controller: _bankNameController,
                label: 'BANK NAME',
                icon: Icons.account_balance_rounded,
                hint: 'e.g. HDFC Bank',
              ),
              const SizedBox(height: 20),
              _buildTextField(
                controller: _accountController,
                label: 'ACCOUNT NUMBER',
                icon: Icons.numbers_rounded,
                hint: '0000 0000 0000',
              ),
              const SizedBox(height: 20),
              _buildTextField(
                controller: _ifscController,
                label: 'IFSC CODE',
                icon: Icons.code_rounded,
                hint: 'IFSC0001234',
              ),
              const SizedBox(height: 48),
              SizedBox(
                width: double.infinity,
                height: 58,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveBanking,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF2563EB),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: _isSaving 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Text('Save Banking Details', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: GoogleFonts.inter(fontSize: 11, fontWeight: FontWeight.w900, color: const Color(0xFF94A3B8), letterSpacing: 1.5),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 10, fontWeight: FontWeight.bold, letterSpacing: 0.5),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontWeight: FontWeight.w600),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 14, fontWeight: FontWeight.w500),
            prefixIcon: Icon(icon, color: const Color(0xFF2563EB), size: 20),
            filled: true,
            fillColor: Colors.white,
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFFF1F5F9))),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const Color(0xFF2563EB) != null ? const BorderSide(color: Color(0xFF2563EB)) : BorderSide.none),
            contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
          ),
        ),
      ],
    );
  }
}
