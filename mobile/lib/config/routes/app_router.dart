import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/constants/app_constants.dart';
import '../../presentation/pages/splash/splash_page.dart';
import '../../presentation/pages/auth/login_screen.dart';
import '../../presentation/pages/home/home_page.dart';
import '../../presentation/pages/scanner/qr_scanner_screen.dart';
import '../../presentation/pages/drug_verification/drug_verification_screen.dart';
import '../../presentation/pages/drug_verification/manual_verification_screen.dart';
import '../../presentation/pages/profile/profile_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) async {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(AppConstants.tokenKey);
      final isAuthenticated = token != null;

      final isLoginRoute = state.matchedLocation == '/login';
      final isSplashRoute = state.matchedLocation == '/splash';

      // If not authenticated and trying to access protected route
      if (!isAuthenticated && !isLoginRoute && !isSplashRoute) {
        return '/login';
      }

      // If authenticated and on login page, redirect to home
      if (isAuthenticated && isLoginRoute) {
        return '/home';
      }

      // Allow navigation
      return null;
    },
    routes: [
      GoRoute(
        path: '/splash',
        name: 'splash',
        builder: (context, state) => const SplashPage(),
      ),
      GoRoute(
        path: '/login',
        name: 'login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/home',
        name: 'home',
        builder: (context, state) => const HomePage(),
      ),
      GoRoute(
        path: '/scanner',
        name: 'scanner',
        builder: (context, state) => const QRScannerScreen(),
      ),
      GoRoute(
        path: '/drug-verification',
        name: 'drug-verification',
        builder: (context, state) {
          final qrData = state.extra as Map<String, dynamic>?;
          if (qrData == null || qrData['qrData'] == null) {
            return Scaffold(
              appBar: AppBar(title: const Text('Lỗi')),
              body: const Center(child: Text('Thiếu dữ liệu QR code')),
            );
          }
          return DrugVerificationScreen(qrData: qrData['qrData'] as String);
        },
      ),
      GoRoute(
        path: '/manual-verification',
        name: 'manual-verification',
        builder: (context, state) => const ManualVerificationScreen(),
      ),
      GoRoute(
        path: '/profile',
        name: 'profile',
        builder: (context, state) => const ProfileScreen(),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: Colors.red),
            const SizedBox(height: 16),
            Text('Error: ${state.error}'),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: () => context.go('/login'),
              child: const Text('Quay về đăng nhập'),
            ),
          ],
        ),
      ),
    ),
  );
});

class AppRouter {
  static GoRouter router(WidgetRef ref) => ref.read(routerProvider);
}
