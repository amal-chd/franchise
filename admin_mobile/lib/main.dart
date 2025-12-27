import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/chat_notification_service.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/dashboard/franchise_dashboard_screen.dart';

void main() {
  runApp(const ProviderScope(child: AdminApp()));
}

class AdminApp extends ConsumerWidget {
  const AdminApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final authState = ref.watch(authProvider);

    return MaterialApp(
      scaffoldMessengerKey: scaffoldMessengerKey,
      title: 'The Kada Franchise',
      debugShowCheckedModeBanner: false,
      scrollBehavior: const MaterialScrollBehavior().copyWith(
        physics: const BouncingScrollPhysics(),
      ),
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2563EB),
          primary: const Color(0xFF2563EB),
          secondary: const Color(0xFF0F172A),
          surface: Colors.white,
          background: const Color(0xFFF8FAFC),
        ),
        
        // Corporate Typography System
        textTheme: GoogleFonts.interTextTheme(
          const TextTheme(
            displayLarge: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            displayMedium: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            displaySmall: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            headlineLarge: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            headlineMedium: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
            titleLarge: TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF0F172A)),
          ),
        ).copyWith(
          // Using Outfit for titles/headings
          headlineLarge: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
          headlineMedium: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
          titleLarge: GoogleFonts.outfit(fontWeight: FontWeight.bold, color: const Color(0xFF0F172A)),
        ),

        // Premium Component Styling
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: Colors.white,
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey[200]!)),
          enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: BorderSide(color: Colors.grey[200]!)),
          focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(16), borderSide: const BorderSide(color: Color(0xFF2563EB), width: 2)),
          labelStyle: GoogleFonts.inter(color: Colors.grey[600], fontSize: 14),
          floatingLabelStyle: GoogleFonts.inter(color: const Color(0xFF2563EB), fontWeight: FontWeight.bold),
          contentPadding: const EdgeInsets.symmetric(horizontal: 20, vertical: 16),
        ),
        
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF0F172A),
            foregroundColor: Colors.white,
            padding: const EdgeInsets.symmetric(vertical: 16, horizontal: 24),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
            textStyle: GoogleFonts.inter(fontWeight: FontWeight.bold, fontSize: 16),
            elevation: 0,
          ),
        ),

        cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 2,
          shadowColor: Colors.black.withOpacity(0.1),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
        ),
        
        appBarTheme: AppBarTheme(
          backgroundColor: const Color(0xFFF8FAFC),
          elevation: 0,
          centerTitle: true,
          titleTextStyle: GoogleFonts.outfit(color: const Color(0xFF0F172A), fontSize: 20, fontWeight: FontWeight.bold),
          iconTheme: const IconThemeData(color: Color(0xFF0F172A)),
        ),
      ),
      home: authState.when(
        data: (isLoggedIn) => isLoggedIn ? const RoleDispatcher() : const LoginScreen(),
        loading: () => const Scaffold(
          body: Center(child: CircularProgressIndicator()),
        ),
        error: (err, stack) => const LoginScreen(),
      ),
    );
  }
}

class RoleDispatcher extends StatefulWidget {
  const RoleDispatcher({super.key});

  @override
  State<RoleDispatcher> createState() => _RoleDispatcherState();
}

class _RoleDispatcherState extends State<RoleDispatcher> {
  String? role;

  @override
  void initState() {
    super.initState();
    _checkRole();
  }

  Future<void> _checkRole() async {
    final prefs = await SharedPreferences.getInstance();
    setState(() {
      role = prefs.getString('userRole') ?? 'admin';
    });
  }

  @override
  Widget build(BuildContext context) {
    if (role == null) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    // Start chat notification polling
    return Consumer(
      builder: (context, ref, child) {
        // Start polling when dashboard loads
        WidgetsBinding.instance.addPostFrameCallback((_) {
          ref.read(chatNotificationProvider.notifier).startPolling();
        });

        if (role == 'franchise') {
          return const FranchiseDashboardScreen();
        }
        return const DashboardScreen();
      },
    );
  }
}
