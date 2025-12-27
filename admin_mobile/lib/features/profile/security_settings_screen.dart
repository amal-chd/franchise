import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'profile_provider.dart';

class SecuritySettingsScreen extends ConsumerStatefulWidget {
  const SecuritySettingsScreen({super.key});

  @override
  ConsumerState<SecuritySettingsScreen> createState() => _SecuritySettingsScreenState();
}

class _SecuritySettingsScreenState extends ConsumerState<SecuritySettingsScreen> {
  final _formKey = GlobalKey<FormState>();
  final _currentPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();
  bool _isSaving = false;
  bool _obscureCurrent = true;
  bool _obscureNew = true;
  bool _obscureConfirm = true;

  @override
  void dispose() {
    _currentPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _updatePassword() async {
    if (!_formKey.currentState!.validate()) return;

    if (_newPasswordController.text != _confirmPasswordController.text) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Text('Passwords do not match', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            ],
          ),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      return;
    }

    setState(() => _isSaving = true);
    final profile = ref.read(profileProvider).value;
    if (profile == null) return;

    final success = await ref.read(profileProvider.notifier).updateProfile(profile, password: _newPasswordController.text.trim());
    
    setState(() => _isSaving = false);
    
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Text('Password updated successfully', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            ],
          ),
          backgroundColor: const Color(0xFF10B981),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
      Navigator.of(context).maybePop();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.error_outline_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Text('Failed to update password', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
            ],
          ),
          backgroundColor: const Color(0xFFEF4444),
          behavior: SnackBarBehavior.floating,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      appBar: AppBar(
        title: Text('Security Settings', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A))),
        centerTitle: true,
        backgroundColor: Colors.white,
        elevation: 0,
        leading: IconButton(
          icon: const Icon(Icons.arrow_back_ios_new_rounded, color: Color(0xFF0F172A), size: 18),
          onPressed: () => Navigator.of(context).maybePop(),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Security Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Row(
                  children: [
                    Container(
                      width: 56,
                      height: 56,
                      decoration: BoxDecoration(
                        color: Colors.white.withOpacity(0.15),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(Icons.shield_rounded, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Change Password', style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('Keep your account secure', style: GoogleFonts.inter(color: Colors.white70, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

              // Warning Card
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: const Color(0xFFFEF3C7),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFFF59E0B).withOpacity(0.3)),
                ),
                child: Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFFF59E0B).withOpacity(0.15),
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: const Icon(Icons.info_outline_rounded, color: Color(0xFFD97706), size: 18),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        'Choose a strong password with at least 8 characters including numbers and symbols.',
                        style: GoogleFonts.inter(color: const Color(0xFF92400E), fontSize: 12, fontWeight: FontWeight.w500),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Form Card
              Container(
                padding: const EdgeInsets.all(24),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(24),
                  boxShadow: [
                    BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 20, offset: const Offset(0, 4)),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    _buildPasswordField(
                      controller: _currentPasswordController,
                      label: 'Current Password',
                      hint: 'Enter current password',
                      obscure: _obscureCurrent,
                      onToggle: () => setState(() => _obscureCurrent = !_obscureCurrent),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                    const SizedBox(height: 24),
                    Container(height: 1, color: const Color(0xFFF1F5F9)),
                    const SizedBox(height: 24),
                    _buildPasswordField(
                      controller: _newPasswordController,
                      label: 'New Password',
                      hint: 'At least 6 characters',
                      obscure: _obscureNew,
                      onToggle: () => setState(() => _obscureNew = !_obscureNew),
                      validator: (v) => v!.length < 6 ? 'Minimum 6 characters' : null,
                    ),
                    const SizedBox(height: 20),
                    _buildPasswordField(
                      controller: _confirmPasswordController,
                      label: 'Confirm New Password',
                      hint: 'Re-enter new password',
                      obscure: _obscureConfirm,
                      onToggle: () => setState(() => _obscureConfirm = !_obscureConfirm),
                      validator: (v) => v!.isEmpty ? 'Required' : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Update Button
              SizedBox(
                width: double.infinity,
                height: 58,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _updatePassword,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF10B981),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: _isSaving 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.lock_rounded, size: 20),
                          const SizedBox(width: 10),
                          Text('Update Password', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
                        ],
                      ),
                ),
              ),
              const SizedBox(height: 16),

              // Cancel Link
              Center(
                child: TextButton(
                  onPressed: () => Navigator.of(context).maybePop(),
                  child: Text('Cancel', style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.w600)),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildPasswordField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required bool obscure,
    required VoidCallback onToggle,
    String? Function(String?)? validator,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(color: const Color(0xFF374151), fontSize: 13, fontWeight: FontWeight.w600),
        ),
        const SizedBox(height: 8),
        TextFormField(
          controller: controller,
          obscureText: obscure,
          validator: validator,
          style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontWeight: FontWeight.w500, fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(color: const Color(0xFFCBD5E1), fontSize: 14),
            prefixIcon: Container(
              margin: const EdgeInsets.only(left: 12, right: 8),
              child: const Icon(Icons.lock_outline_rounded, color: Color(0xFF64748B), size: 20),
            ),
            prefixIconConstraints: const BoxConstraints(minWidth: 48),
            suffixIcon: IconButton(
              icon: Icon(
                obscure ? Icons.visibility_outlined : Icons.visibility_off_outlined, 
                color: const Color(0xFF94A3B8), 
                size: 20,
              ),
              onPressed: onToggle,
            ),
            filled: true,
            fillColor: const Color(0xFFF8FAFC),
            enabledBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFE2E8F0), width: 1.5),
            ),
            focusedBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
            ),
            errorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFEF4444), width: 1.5),
            ),
            focusedErrorBorder: OutlineInputBorder(
              borderRadius: BorderRadius.circular(14),
              borderSide: const BorderSide(color: Color(0xFFEF4444), width: 2),
            ),
            contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 16),
          ),
        ),
      ],
    );
  }
}
