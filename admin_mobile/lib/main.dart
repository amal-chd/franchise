import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:shared_preferences/shared_preferences.dart';
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
      title: 'The Kada Franchise',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF2563EB)),
        useMaterial3: true,
        textTheme: GoogleFonts.interTextTheme(),
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

    if (role == 'franchise') {
      return const FranchiseDashboardScreen();
    }
    
    return const DashboardScreen();
  }
}
