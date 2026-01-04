import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'core/chat_notification_service.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/dashboard/franchise_dashboard_screen.dart';

import 'package:supabase_flutter/supabase_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Supabase.initialize(
    url: 'https://fycmxngjomyadzthuzpf.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5Y214bmdqb215YWR6dGh1enBmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjcwMjk2MTMsImV4cCI6MjA4MjYwNTYxM30.eDEoEdetWnSmqhE490SgJTr1B8-hOtjBeZe2tynbQ0k',
  );

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
        brightness: Brightness.light,
        scaffoldBackgroundColor: const Color(0xFFF8F9FD), // Soft blue-grey background
        
        // Color System
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF7C3AED), // Zomo Purple
          primary: const Color(0xFF7C3AED),
          secondary: const Color(0xFF25C6FA), // Zomo Cyan
          tertiary: const Color(0xFFFF4C8B), // Zomo Pink accent
          surface: Colors.white,
          background: const Color(0xFFF8F9FD),
        ),

        // Typography
        textTheme: GoogleFonts.poppinsTextTheme(
          Theme.of(context).textTheme,
        ).apply(
          bodyColor: const Color(0xFF2D3748),
          displayColor: const Color(0xFF1A202C),
        ),

        // Component Styling
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: const Color(0xFFF1F5F9), // Soft grey fill
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
            borderSide: BorderSide.none, // No border by default
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
            borderSide: BorderSide.none,
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(20),
            borderSide: const BorderSide(color: Color(0xFF7C3AED), width: 1.5),
          ),
          contentPadding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
          hintStyle: GoogleFonts.poppins(color: const Color(0xFFA0AEC0), fontSize: 14),
        ),

        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: const Color(0xFF7C3AED),
            foregroundColor: Colors.white,
            elevation: 8,
            shadowColor: const Color(0xFF7C3AED).withOpacity(0.4),
            padding: const EdgeInsets.symmetric(vertical: 18, horizontal: 32),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(30)),
            textStyle: GoogleFonts.poppins(fontWeight: FontWeight.w600, fontSize: 16),
          ),
        ),

        cardTheme: CardThemeData(
          color: Colors.white,
          elevation: 10,
          shadowColor: const Color(0xFF90A4AE).withOpacity(0.15),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(24)),
          margin: EdgeInsets.zero,
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
