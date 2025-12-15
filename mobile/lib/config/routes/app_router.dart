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
import '../../presentation/pages/auth/change_password_screen.dart';
import '../../presentation/pages/history/verification_history_screen.dart';
import '../../presentation/pages/offline/offline_scans_screen.dart';
import '../../presentation/pages/settings/settings_screen.dart';
import '../../presentation/pages/settings/privacy_policy_screen.dart';
import '../../presentation/pages/settings/terms_of_service_screen.dart';
import '../../presentation/pages/auth/forgot_password_screen.dart';
import '../../presentation/pages/notifications/notifications_screen.dart';
import '../../presentation/pages/search/search_drugs_screen.dart';
import '../../presentation/pages/supply_chain/supply_chain_timeline_screen.dart';
import '../../presentation/pages/tasks/tasks_list_screen.dart';
import '../../presentation/pages/tasks/task_detail_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    initialLocation: '/splash',
    redirect: (context, state) async {
      final prefs = await SharedPreferences.getInstance();
      final token = prefs.getString(AppConstants.tokenKey);
      final isAuthenticated = token != null;

      final currentLocation = state.matchedLocation;

      // Public routes that don't require authentication
      final publicRoutes = ['/login', '/splash'];

      // If not authenticated and trying to access protected route
      if (!isAuthenticated && !publicRoutes.contains(currentLocation)) {
        return '/login';
      }

      // If authenticated and on login page, redirect to home
      if (isAuthenticated && currentLocation == '/login') {
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
        path: '/forgot-password',
        name: 'forgot-password',
        builder: (context, state) => const ForgotPasswordScreen(),
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
      GoRoute(
        path: '/change-password',
        name: 'change-password',
        builder: (context, state) => const ChangePasswordScreen(),
      ),
      GoRoute(
        path: '/verification-history',
        name: 'verification-history',
        builder: (context, state) => const VerificationHistoryScreen(),
      ),
      GoRoute(
        path: '/offline-scans',
        name: 'offline-scans',
        builder: (context, state) => const OfflineScansScreen(),
      ),
      GoRoute(
        path: '/settings',
        name: 'settings',
        builder: (context, state) => const SettingsScreen(),
      ),
      GoRoute(
        path: '/privacy-policy',
        name: 'privacy-policy',
        builder: (context, state) => const PrivacyPolicyScreen(),
      ),
      GoRoute(
        path: '/terms-of-service',
        name: 'terms-of-service',
        builder: (context, state) => const TermsOfServiceScreen(),
      ),
      GoRoute(
        path: '/notifications',
        name: 'notifications',
        builder: (context, state) => const NotificationsScreen(),
      ),
      GoRoute(
        path: '/search',
        name: 'search',
        builder: (context, state) => const SearchDrugsScreen(),
      ),
      GoRoute(
        path: '/supply-chain-timeline',
        name: 'supply-chain-timeline',
        builder: (context, state) {
          final extra = state.extra as Map<String, dynamic>?;
          return SupplyChainTimelineScreen(
            supplyChainId: extra?['supplyChainId'] as String?,
            drugId: extra?['drugId'] as String?,
            supplyChain: extra?['supplyChain'] as dynamic,
          );
        },
      ),
      GoRoute(
        path: '/tasks',
        name: 'tasks',
        builder: (context, state) => const TasksListScreen(),
      ),
      GoRoute(
        path: '/tasks/:id',
        name: 'task-detail',
        builder: (context, state) {
          final taskId = state.pathParameters['id']!;
          return TaskDetailScreen(taskId: taskId);
        },
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
