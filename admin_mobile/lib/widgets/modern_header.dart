import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

class ModernDashboardHeader extends StatelessWidget implements PreferredSizeWidget {
  final String title;
  final String? subtitle;
  final VoidCallback? onMenuPressed;
  final VoidCallback? onNotificationPressed;
  final IconData? leadingIcon;
  final VoidCallback? onLeadingPressed;
  final Widget? leadingWidget; // NEW: Custom widget for leading (e.g. Back + Logo)
  final Widget? trailingWidget;
  final int notificationCount;
  final bool isHome;
  final Widget? titleWidget;
  final bool showLeading;

  const ModernDashboardHeader({
    super.key,
    required this.title,
    this.subtitle,
    this.onMenuPressed,
    this.onNotificationPressed,
    this.leadingIcon,
    this.onLeadingPressed,
    this.trailingWidget,
    this.notificationCount = 0,
    this.isHome = false,
    this.titleWidget,
    this.showLeading = true,
    this.leadingWidget,
    this.actions,
  });

  final List<Widget>? actions;

  @override
  Size get preferredSize => const Size.fromHeight(70);

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light,
      child: Container(
        // height: 90, // Removing fixed height to respect SafeArea + content
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              Color(0xFF2563EB), // Blue 600
              Color(0xFF1D4ED8), // Blue 700
            ],
          ),
          borderRadius: BorderRadius.vertical(bottom: Radius.circular(24)),
          boxShadow: [
            BoxShadow(
              color: Color(0x332563EB),
              blurRadius: 15,
              offset: Offset(0, 8),
            ),
          ],
        ),
        child: SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Stack(
              children: [
                // Leading Button (Menu, Custom, or Back + Logo)
                Align(
                  alignment: Alignment.centerLeft,
                  child: leadingWidget ?? (showLeading
                      ? _buildCircularButton(
                          icon: leadingIcon ?? Icons.grid_view_rounded,
                          onTap: onLeadingPressed ?? onMenuPressed,
                        )
                      : null),
                ),

                // Title Section (Absolute Center)
                Align(
                  alignment: Alignment.center,
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 60), // Prevent overlap
                    child: Column(
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (titleWidget != null)
                          titleWidget!
                        else ...[
                          Text(
                            title,
                            style: GoogleFonts.outfit(
                              fontSize: isHome ? 18 : 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.white,
                            ),
                            textAlign: TextAlign.center,
                            overflow: TextOverflow.ellipsis,
                          ),
                          if (subtitle != null) ...[
                            Text(
                              subtitle!,
                              style: GoogleFonts.inter(
                                fontSize: 11,
                                color: Colors.white.withOpacity(0.8),
                              ),
                              textAlign: TextAlign.center,
                            ),
                          ],
                        ],
                      ],
                    ),
                  ),
                ),

                // Trailing Button (Notification or Custom)
                Align(
                  alignment: Alignment.centerRight,
                  child: trailingWidget ?? (actions != null 
                    ? Row(mainAxisSize: MainAxisSize.min, children: actions!) 
                    : Stack(
                        alignment: Alignment.topRight,
                        children: [
                          _buildCircularButton(
                            icon: Icons.notifications_outlined,
                            onTap: onNotificationPressed,
                          ),
                          if (notificationCount > 0)
                            Positioned(
                              top: 2,
                              right: 2,
                              child: Container(
                                width: 8,
                                height: 8,
                                decoration: BoxDecoration(
                                  color: const Color(0xFFEF4444),
                                  borderRadius: BorderRadius.circular(4),
                                  border: Border.all(color: const Color(0xFF1D4ED8), width: 1.5),
                                ),
                              ),
                            ),
                        ],
                      )
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildCircularButton({required IconData icon, VoidCallback? onTap}) {
    return GestureDetector(
      onTap: onTap,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.white.withOpacity(0.15),
          shape: BoxShape.circle,
        ),
        child: Icon(icon, color: Colors.white, size: 20),
      ),
    );
  }
}
