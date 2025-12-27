import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'profile_provider.dart';

class PersonalInfoScreen extends ConsumerStatefulWidget {
  const PersonalInfoScreen({super.key});

  @override
  ConsumerState<PersonalInfoScreen> createState() => _PersonalInfoScreenState();
}

class _PersonalInfoScreenState extends ConsumerState<PersonalInfoScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _phoneController;
  late TextEditingController _cityController;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final profile = ref.read(profileProvider).value;
    _nameController = TextEditingController(text: profile?.name);
    _phoneController = TextEditingController(text: profile?.phone);
    _cityController = TextEditingController(text: profile?.city);
  }

  @override
  void dispose() {
    _nameController.dispose();
    _phoneController.dispose();
    _cityController.dispose();
    super.dispose();
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);
    final profile = ref.read(profileProvider).value;
    if (profile == null) return;

    final updatedProfile = profile.copyWith(
      name: _nameController.text.trim(),
      phone: _phoneController.text.trim(),
      city: _cityController.text.trim(),
    );

    final success = await ref.read(profileProvider.notifier).updateProfile(updatedProfile);
    
    setState(() => _isSaving = false);
    
    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Row(
            children: [
              const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
              const SizedBox(width: 12),
              Text('Profile updated successfully', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
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
              Text('Failed to update profile', style: GoogleFonts.inter(fontWeight: FontWeight.w600)),
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
        title: Text('Personal Information', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18, color: const Color(0xFF0F172A))),
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
              // Header Card
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
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
                        color: Colors.white.withOpacity(0.2),
                        borderRadius: BorderRadius.circular(16),
                      ),
                      child: const Icon(Icons.person_rounded, color: Colors.white, size: 28),
                    ),
                    const SizedBox(width: 16),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('Edit Your Profile', style: GoogleFonts.outfit(color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold)),
                          const SizedBox(height: 4),
                          Text('Update your personal details below', style: GoogleFonts.inter(color: Colors.white70, fontSize: 12)),
                        ],
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 28),

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
                    _buildSectionHeader('Basic Details', Icons.badge_rounded),
                    const SizedBox(height: 24),
                    _buildPremiumTextField(
                      controller: _nameController,
                      label: 'Full Name',
                      hint: 'Enter your full name',
                      icon: Icons.person_outline_rounded,
                      validator: (v) => v!.isEmpty ? 'Name is required' : null,
                    ),
                    const SizedBox(height: 20),
                    _buildPremiumTextField(
                      controller: _phoneController,
                      label: 'Mobile Number',
                      hint: '+91 9876 543 210',
                      icon: Icons.phone_outlined,
                      keyboardType: TextInputType.phone,
                      validator: (v) => v!.isEmpty ? 'Phone is required' : null,
                    ),
                    const SizedBox(height: 20),
                    _buildPremiumTextField(
                      controller: _cityController,
                      label: 'Service City',
                      hint: 'e.g., Mumbai, Delhi',
                      icon: Icons.location_on_outlined,
                      validator: (v) => v!.isEmpty ? 'City is required' : null,
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              // Save Button
              SizedBox(
                width: double.infinity,
                height: 58,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFF0F172A),
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    elevation: 0,
                  ),
                  child: _isSaving 
                    ? const SizedBox(width: 24, height: 24, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                    : Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.save_rounded, size: 20),
                          const SizedBox(width: 10),
                          Text('Save Changes', style: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16)),
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

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Container(
          padding: const EdgeInsets.all(10),
          decoration: BoxDecoration(
            color: const Color(0xFF2563EB).withOpacity(0.1),
            borderRadius: BorderRadius.circular(12),
          ),
          child: Icon(icon, color: const Color(0xFF2563EB), size: 20),
        ),
        const SizedBox(width: 12),
        Text(title, style: GoogleFonts.outfit(fontSize: 16, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A))),
      ],
    );
  }

  Widget _buildPremiumTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    TextInputType keyboardType = TextInputType.text,
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
          keyboardType: keyboardType,
          validator: validator,
          style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontWeight: FontWeight.w500, fontSize: 15),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: GoogleFonts.inter(color: const Color(0xFFCBD5E1), fontSize: 14),
            prefixIcon: Container(
              margin: const EdgeInsets.only(left: 12, right: 8),
              child: Icon(icon, color: const Color(0xFF64748B), size: 20),
            ),
            prefixIconConstraints: const BoxConstraints(minWidth: 48),
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
