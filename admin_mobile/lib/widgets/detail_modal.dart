import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class DetailModal extends StatelessWidget {
  final String title;
  final Widget? headerWidget;
  final List<Widget> children;
  final List<Widget>? actions;

  const DetailModal({
    super.key,
    required this.title,
    this.headerWidget,
    required this.children,
    this.actions,
  });

  static void show({
    required BuildContext context,
    required String title,
    Widget? headerWidget,
    required List<Widget> children,
    List<Widget>? actions,
  }) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DetailModal(
        title: title,
        headerWidget: headerWidget,
        children: children,
        actions: actions,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Container(
      height: MediaQuery.of(context).size.height * 0.75,
      decoration: const BoxDecoration(
        color: Color(0xFFF8FAFC),
        borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
      ),
      child: Column(
        children: [
          // Handle Bar
          Center(
            child: Container(
              margin: const EdgeInsets.only(top: 12, bottom: 8),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey.shade300,
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),

          Expanded(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              physics: const BouncingScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Header
                  if (headerWidget != null)
                    Center(child: headerWidget!)
                  else
                    Center(
                      child: Text(
                        title,
                        style: GoogleFonts.outfit(
                          fontSize: 24,
                          fontWeight: FontWeight.bold,
                          color: const Color(0xFF0F172A),
                        ),
                        textAlign: TextAlign.center,
                      ),
                    ),

                  const SizedBox(height: 32),

                  // Content
                  ...children,

                  // Actions
                  if (actions != null && actions!.isNotEmpty) ...[
                    const SizedBox(height: 24),
                    ...actions!,
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  static Widget buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: GoogleFonts.inter(
            fontSize: 14,
            fontWeight: FontWeight.bold,
            color: const Color(0xFF64748B),
            letterSpacing: 0.5,
          ),
        ),
        const SizedBox(height: 16),
        ...children,
      ],
    );
  }

  static Widget buildDetailRow(IconData icon, String label, String value, {Color? iconColor}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 16),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: (iconColor ?? const Color(0xFF2563EB)).withOpacity(0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(
              icon,
              size: 18,
              color: iconColor ?? const Color(0xFF2563EB),
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  label,
                  style: GoogleFonts.inter(
                    fontSize: 12,
                    color: const Color(0xFF94A3B8),
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  value,
                  style: GoogleFonts.inter(
                    fontSize: 15,
                    color: const Color(0xFF0F172A),
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  static Widget buildStatusBadge(String status, {bool isActive = false, Color? activeColor, Color? inactiveColor}) {
    final color = isActive 
        ? (activeColor ?? const Color(0xFF10B981)) 
        : (inactiveColor ?? const Color(0xFFEF4444));
    
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Text(
        status.toUpperCase(),
        style: GoogleFonts.inter(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}
