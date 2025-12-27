import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import '../requests/requests_provider.dart';
import '../../widgets/premium_widgets.dart';

class FranchiseProfileScreen extends ConsumerWidget {
  final int franchiseId;
  final String franchiseName;

  const FranchiseProfileScreen({super.key, required this.franchiseId, required this.franchiseName});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final requestsAsync = ref.watch(requestsProvider);

    return Scaffold(
      backgroundColor: const Color(0xFFF8FAFC),
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        title: Text('Franchise Profile', style: GoogleFonts.outfit(color: Colors.white, fontWeight: FontWeight.bold)),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leadingWidth: 70,
        leading: Navigator.of(context).canPop() ? IconButton(
          icon: Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(color: Colors.white.withOpacity(0.1), borderRadius: BorderRadius.circular(12)),
            child: const Icon(Icons.arrow_back_ios_new_rounded, size: 18, color: Colors.white),
          ),
          onPressed: () => Navigator.of(context).pop(),
        ) : null,
        systemOverlayStyle: SystemUiOverlayStyle.light,
      ),
      body: requestsAsync.when(
        data: (requests) {
          try {
            final franchise = requests.firstWhere((r) => r.id == franchiseId);
            return SingleChildScrollView(
              physics: const BouncingScrollPhysics(),
              child: Column(
                children: [
                   const SizedBox(height: 100), // Height for the transparent app bar
                  // Premium Header
                  _buildHeader(context, franchise),
                  
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _sectionTitle('Contact Information'),
                        _buildInfoGrid([
                          _infoTile(Icons.email_outlined, 'Email', franchise.email),
                          _infoTile(Icons.phone_outlined, 'Phone', franchise.phone),
                          _infoTile(Icons.location_city_outlined, 'City', franchise.city),
                          _infoTile(Icons.star_outline, 'Active Plan', franchise.planSelected.toUpperCase(), color: Colors.blue),
                        ]),
                        
                        const SizedBox(height: 32),
                        _sectionTitle('Banking & Payouts'),
                        _buildBankCard(context, franchise),
                      ],
                    ),
                  ),
                ],
              ),
            );
          } catch (e) {
            return const IllustrativeState(
              icon: Icons.person_search_rounded,
              title: 'Not Found',
              subtitle: 'We couldn\'t locate the details for this specific partner profile.',
            );
          }
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, st) => IllustrativeState(
          icon: Icons.error_outline_rounded,
          title: 'Profile Sync Error',
          subtitle: 'An unexpected error occurred while retrieving this partner profile. $err',
          onRetry: () => ref.invalidate(requestsProvider),
          retryLabel: 'Sync Profile',
        ),
      ),
    );
  }

  Widget _buildHeader(BuildContext context, dynamic franchise) {
    return Container(
      width: double.infinity,
      height: 280,
      decoration: const BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [Color(0xFF0F172A), Color(0xFF1E293B)],
        ),
        borderRadius: BorderRadius.only(
          bottomLeft: Radius.circular(40),
          bottomRight: Radius.circular(40),
        ),
      ),
      child: SafeArea(
        bottom: false,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(4),
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                border: Border.all(color: Colors.white.withOpacity(0.2), width: 2),
              ),
              child: CircleAvatar(
                radius: 45,
                backgroundColor: Colors.blue[600],
                child: Text(
                  franchise.name.substring(0, 1).toUpperCase(),
                  style: GoogleFonts.outfit(fontSize: 36, fontWeight: FontWeight.bold, color: Colors.white),
                ),
              ),
            ),
            const SizedBox(height: 16),
            Text(
              franchise.name,
              style: GoogleFonts.outfit(fontSize: 24, fontWeight: FontWeight.bold, color: Colors.white),
            ),
            const SizedBox(height: 4),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
              decoration: BoxDecoration(
                color: Colors.white.withOpacity(0.1),
                borderRadius: BorderRadius.circular(20),
              ),
              child: Text(
                'Partner ID: #${franchise.id}',
                style: GoogleFonts.inter(fontSize: 12, color: Colors.white70),
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _sectionTitle(String title) {
    return Padding(
      padding: const EdgeInsets.only(left: 4, bottom: 16),
      child: Text(
        title,
        style: GoogleFonts.outfit(fontSize: 18, fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
      ),
    );
  }

  Widget _buildInfoGrid(List<Widget> children) {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(24),
      ),
      child: GridView.count(
        crossAxisCount: 2,
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        childAspectRatio: 1.6,
        children: children,
      ),
    );
  }

  Widget _infoTile(IconData icon, String label, String value, {Color? color}) {
    return Padding(
      padding: const EdgeInsets.all(12.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Row(
            children: [
              Icon(icon, size: 16, color: color ?? Colors.grey[400]),
              const SizedBox(width: 8),
              Text(label, style: GoogleFonts.inter(fontSize: 11, color: Colors.grey[500], fontWeight: FontWeight.w600)),
            ],
          ),
          const SizedBox(height: 4),
          Text(
            value,
            style: GoogleFonts.inter(fontSize: 14, fontWeight: FontWeight.bold, color: const Color(0xFF1E293B)),
            overflow: TextOverflow.ellipsis,
          ),
        ],
      ),
    );
  }

  Widget _buildBankCard(BuildContext context, dynamic franchise) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(24),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF2563EB), Color(0xFF1D4ED8)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(24),
        boxShadow: [
          BoxShadow(color: const Color(0xFF2563EB).withOpacity(0.3), blurRadius: 20, offset: const Offset(0, 10)),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const Icon(Icons.account_balance_wallet_outlined, color: Colors.white, size: 32),
              Image.asset('assets/images/logo.png', height: 24, color: Colors.white70, errorBuilder: (_,__,___) => const SizedBox()),
            ],
          ),
          const SizedBox(height: 24),
          Text(
            franchise.bankAccountNumber ?? 'Not Provided',
            style: GoogleFonts.outfit(fontSize: 22, color: Colors.white, letterSpacing: 2, fontWeight: FontWeight.bold),
          ),
          const SizedBox(height: 8),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('BANK NAME', style: GoogleFonts.inter(fontSize: 10, color: Colors.white60)),
                  Text(franchise.bankName?.toUpperCase() ?? 'N/A', style: GoogleFonts.inter(fontSize: 14, color: Colors.white, fontWeight: FontWeight.bold)),
                ],
              ),
              Column(
                crossAxisAlignment: CrossAxisAlignment.end,
                children: [
                  Text('IFSC CODE', style: GoogleFonts.inter(fontSize: 10, color: Colors.white60)),
                  Text(franchise.ifscCode?.toUpperCase() ?? 'N/A', style: GoogleFonts.inter(fontSize: 14, color: Colors.white, fontWeight: FontWeight.bold)),
                ],
              ),
            ],
          ),
          const Divider(height: 32, color: Colors.white24),
          Row(
            children: [
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('UPI ID', style: GoogleFonts.inter(fontSize: 10, color: Colors.white60)),
                    Text(franchise.upiId ?? 'N/A', style: GoogleFonts.inter(fontSize: 14, color: Colors.white, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              IconButton(
                icon: const Icon(Icons.copy, color: Colors.white70, size: 20),
                onPressed: () {
                   Clipboard.setData(ClipboardData(text: franchise.upiId ?? ''));
                   ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('UPI ID Copied')));
                },
              ),
            ],
          ),
        ],
      ),
    );
  }
}
