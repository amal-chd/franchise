import 'dart:ui';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../../core/api_service.dart';
import 'auth_provider.dart';
import 'franchise_registration_screen.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;

  void _handleLogin() {
    final username = _usernameController.text.trim();
    final password = _passwordController.text.trim();

    if (username.isEmpty || password.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Please enter credentials', style: GoogleFonts.inter()),
          backgroundColor: Colors.redAccent,
          behavior: SnackBarBehavior.floating,
        ),
      );
      return;
    }

    ref.read(authProvider.notifier).login(username, password);
  }

  void _showForgotPasswordDialog() {
    final emailController = TextEditingController();
    bool isLoading = false;

    showDialog(
      context: context,
      builder: (context) => StatefulBuilder(
        builder: (context, setDialogState) => AlertDialog(
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          title: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: const Color(0xFF2563EB).withOpacity(0.1),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Icon(Icons.lock_reset_rounded, color: Color(0xFF2563EB), size: 22),
              ),
              const SizedBox(width: 12),
              Text('Reset Password', style: GoogleFonts.outfit(fontWeight: FontWeight.bold, fontSize: 18)),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Enter your registered email address. We\'ll send you a temporary password.',
                style: GoogleFonts.inter(color: const Color(0xFF64748B), fontSize: 13),
              ),
              const SizedBox(height: 20),
              TextField(
                controller: emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: InputDecoration(
                  hintText: 'your@email.com',
                  hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8)),
                  prefixIcon: const Icon(Icons.email_outlined, color: Color(0xFF64748B)),
                  filled: true,
                  fillColor: const Color(0xFFF8FAFC),
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  enabledBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFFE2E8F0)),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(14),
                    borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2),
                  ),
                ),
              ),
            ],
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Text('Cancel', style: GoogleFonts.inter(color: const Color(0xFF64748B))),
            ),
            ElevatedButton(
              onPressed: isLoading ? null : () async {
                if (emailController.text.trim().isEmpty) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Please enter your email', style: GoogleFonts.inter()),
                      backgroundColor: Colors.redAccent,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                  return;
                }

                setDialogState(() => isLoading = true);

                try {
                  final apiService = ApiService();
                  final response = await apiService.client.post('auth/forgot-password', data: {
                    'email': emailController.text.trim(),
                  });

                  Navigator.pop(context);
                  
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Row(
                        children: [
                          const Icon(Icons.check_circle_rounded, color: Colors.white, size: 20),
                          const SizedBox(width: 12),
                          Expanded(child: Text('If this email exists, a password has been sent.', style: GoogleFonts.inter(fontWeight: FontWeight.w600))),
                        ],
                      ),
                      backgroundColor: const Color(0xFF10B981),
                      behavior: SnackBarBehavior.floating,
                      duration: const Duration(seconds: 5),
                    ),
                  );
                } catch (e) {
                  setDialogState(() => isLoading = false);
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(
                      content: Text('Failed to send reset email. Please try again.', style: GoogleFonts.inter()),
                      backgroundColor: Colors.redAccent,
                      behavior: SnackBarBehavior.floating,
                    ),
                  );
                }
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: const Color(0xFF2563EB),
                foregroundColor: Colors.white,
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
              ),
              child: isLoading
                ? const SizedBox(width: 20, height: 20, child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2))
                : Text('Send Reset Email', style: GoogleFonts.inter(fontWeight: FontWeight.bold)),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authProvider);

    ref.listen(authProvider, (previous, next) {
      if (next is AsyncError) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text(next.error.toString(), style: GoogleFonts.inter()),
            backgroundColor: Colors.redAccent,
            behavior: SnackBarBehavior.floating,
          ),
        );
      }
    });

    final size = MediaQuery.of(context).size;

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      body: Stack(
        children: [
          // Subtle Decorative Accents
          Positioned(
            top: -100,
            right: -50,
            child: _buildDecorativeCircle(250, const Color(0xFF2563EB).withOpacity(0.04)),
          ),
          Positioned(
            bottom: -50,
            left: -80,
            child: _buildDecorativeCircle(200, const Color(0xFF7C3AED).withOpacity(0.04)),
          ),

          SafeArea(
            child: Center(
              child: SingleChildScrollView(
                padding: const EdgeInsets.symmetric(horizontal: 32.0, vertical: 24.0),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Logo Section
                    Hero(
                      tag: 'app_logo',
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        decoration: BoxDecoration(
                          color: Colors.white,
                          shape: BoxShape.circle,
                          boxShadow: [
                            BoxShadow(color: Colors.black.withOpacity(0.03), blurRadius: 20, offset: const Offset(0, 10)),
                          ],
                        ),
                        child: Image.asset(
                          'assets/images/logo.png',
                          height: 70,
                          errorBuilder: (context, error, stackTrace) => 
                             const Icon(Icons.storefront_rounded, size: 70, color: Color(0xFF2563EB)),
                        ),
                      ),
                    ),
                    const SizedBox(height: 32),
                    Text(
                      'Partner Portal',
                      style: GoogleFonts.outfit(
                        fontSize: 32, 
                        fontWeight: FontWeight.bold, 
                        color: const Color(0xFF0F172A),
                        letterSpacing: -0.5,
                      ),
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Excellence in Franchise Management',
                      style: GoogleFonts.inter(
                        color: const Color(0xFF64748B),
                        fontSize: 14,
                        fontWeight: FontWeight.w500,
                      ),
                    ),
                    const SizedBox(height: 48),

                    // Login Card
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 28),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(32),
                        boxShadow: [
                          BoxShadow(color: Colors.black.withOpacity(0.04), blurRadius: 40, offset: const Offset(0, 20)),
                        ],
                        border: Border.all(color: const Color(0xFFF1F5F9)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _buildModernTextField(
                            controller: _usernameController,
                            label: 'CREDENTIALS',
                            hint: 'User ID or Email',
                            icon: Icons.alternate_email_rounded,
                          ),
                          const SizedBox(height: 24),
                          _buildModernTextField(
                            controller: _passwordController,
                            label: 'SECURITY',
                            hint: 'Password',
                            icon: Icons.lock_outline_rounded,
                            isPassword: true,
                          ),
                          const SizedBox(height: 12),
                          Align(
                            alignment: Alignment.centerRight,
                            child: TextButton(
                              onPressed: _showForgotPasswordDialog,
                              child: Text(
                                'Forgot Password?',
                                style: GoogleFonts.inter(fontSize: 12, fontWeight: FontWeight.w600, color: const Color(0xFF64748B)),
                              ),
                            ),
                          ),
                          const SizedBox(height: 28),
                          
                          _buildPremiumButton(authState),
                        ],
                      ),
                    ),
                    
                    const SizedBox(height: 40),
                    _buildRegistrationFooter(),
                  ],
                ),
              ),
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

  Widget _buildModernTextField({
    required TextEditingController controller,
    required String label,
    required String hint,
    required IconData icon,
    bool isPassword = false,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          label,
          style: GoogleFonts.inter(
            color: const Color(0xFF94A3B8),
            fontSize: 10,
            fontWeight: FontWeight.w900,
            letterSpacing: 1.5,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          decoration: BoxDecoration(
            color: const Color(0xFFF8FAFC),
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: const Color(0xFFF1F5F9)),
          ),
          child: TextField(
            controller: controller,
            obscureText: isPassword ? _obscurePassword : false,
            style: GoogleFonts.inter(color: const Color(0xFF0F172A), fontWeight: FontWeight.w600),
            decoration: InputDecoration(
              hintText: hint,
              hintStyle: GoogleFonts.inter(color: const Color(0xFF94A3B8), fontSize: 13, fontWeight: FontWeight.w500),
              prefixIcon: Icon(icon, color: const Color(0xFF64748B), size: 20),
              suffixIcon: isPassword ? IconButton(
                icon: Icon(
                  _obscurePassword ? Icons.visibility_outlined : Icons.visibility_off_outlined,
                  color: const Color(0xFF64748B),
                  size: 20,
                ),
                onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
              ) : null,
              border: InputBorder.none,
              contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
            ),
          ),
        ),
      ],
    );
  }

  Widget _buildPremiumButton(AsyncValue authState) {
    final isLoading = authState is AsyncLoading;
    
    return Container(
      height: 58,
      decoration: BoxDecoration(
        borderRadius: BorderRadius.circular(18),
        gradient: const LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
        ),
        boxShadow: [
          BoxShadow(
            color: const Color(0xFF2563EB).withOpacity(0.2),
            blurRadius: 15,
            offset: const Offset(0, 8),
          ),
        ],
      ),
      child: ElevatedButton(
        onPressed: isLoading ? null : _handleLogin,
        style: ElevatedButton.styleFrom(
          backgroundColor: Colors.transparent,
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
        ),
        child: isLoading
            ? const SizedBox(
                width: 22, 
                height: 22, 
                child: CircularProgressIndicator(color: Colors.white, strokeWidth: 2.5),
              )
            : Text(
                'Sign In Now',
                style: GoogleFonts.inter(
                  fontSize: 15, 
                  fontWeight: FontWeight.bold, 
                  color: Colors.white,
                  letterSpacing: 0.5,
                ),
              ),
      ),
    );
  }

  Widget _buildRegistrationFooter() {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Text(
          'Don\'t have a Franchise?',
          style: GoogleFonts.inter(color: const Color(0xFF64748B), fontWeight: FontWeight.w500),
        ),
        TextButton(
          onPressed: () {
            Navigator.push(
              context, 
              MaterialPageRoute(builder: (_) => const FranchiseRegistrationScreen()),
            );
          },
          child: Text(
            'Get Started',
            style: GoogleFonts.inter(
              color: const Color(0xFF2563EB),
              fontWeight: FontWeight.w800,
            ),
          ),
        ),
      ],
    );
  }
}
