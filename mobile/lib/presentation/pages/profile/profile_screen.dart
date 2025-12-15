import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/dio_client.dart';
import '../../../data/repositories_impl/auth_repository_impl.dart';
import '../../../domain/repositories_interfaces/auth_repository.dart';
import '../../../presentation/blocs/auth_provider.dart';
import '../../../presentation/blocs/user_provider.dart';
import '../../../presentation/blocs/theme_provider.dart';
import '../../widgets/custom_card.dart';

final profileAuthRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(DioClient());
});

class ProfileScreen extends ConsumerWidget {
  const ProfileScreen({super.key});

  Future<void> _handleLogout(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Đăng xuất'),
        content: const Text('Bạn có chắc chắn muốn đăng xuất?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(
              foregroundColor: Colors.red,
            ),
            child: const Text('Đăng xuất'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final authRepo = ref.read(profileAuthRepositoryProvider);
        await authRepo.logout();

        final authNotifier = ref.read(authProvider.notifier);
        await authNotifier.logout();

        final userNotifier = ref.read(userProvider.notifier);
        await userNotifier.clearUser();

        if (context.mounted) {
          context.go('/login');
        }
      } catch (e) {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi đăng xuất: $e')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final userState = ref.watch(userProvider);
    final themeMode = ref.watch(themeProvider);

    final user = userState.user;
    final userName = user?.name ?? 'Người dùng';
    final userRole = user?.role ?? 'N/A';
    final userEmail = user?.email ?? '';

    return Scaffold(
      appBar: AppBar(
        title: const Text('Hồ sơ'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Header with Avatar
            CustomCard(
              padding: const EdgeInsets.all(24),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: colorScheme.primaryContainer,
                    child: Text(
                      userName.isNotEmpty ? userName[0].toUpperCase() : 'U',
                      style: theme.textTheme.headlineLarge?.copyWith(
                        color: colorScheme.onPrimaryContainer,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    userName,
                    style: theme.textTheme.headlineSmall?.copyWith(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  if (userEmail.isNotEmpty) ...[
                    const SizedBox(height: 4),
                    Text(
                      userEmail,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        color: colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                  const SizedBox(height: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 12,
                      vertical: 6,
                    ),
                    decoration: BoxDecoration(
                      color: colorScheme.secondaryContainer,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      userRole,
                      style: theme.textTheme.labelMedium?.copyWith(
                        color: colorScheme.onSecondaryContainer,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // Settings List
            CustomCard(
              padding: EdgeInsets.zero,
              child: Column(
                children: [
                  // Change Password
                  ListTile(
                    leading: Icon(
                      Icons.lock_outline,
                      color: colorScheme.primary,
                    ),
                    title: const Text('Đổi mật khẩu'),
                    subtitle: const Text('Thay đổi mật khẩu tài khoản'),
                    trailing: Icon(
                      Icons.chevron_right,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    onTap: () {
                      context.push('/change-password');
                    },
                  ),
                  Divider(height: 1, color: colorScheme.outlineVariant),

                  // Dark Mode Toggle
                  ListTile(
                    leading: Icon(
                      themeMode == ThemeMode.dark
                          ? Icons.dark_mode
                          : themeMode == ThemeMode.light
                              ? Icons.light_mode
                              : Icons.brightness_auto,
                      color: colorScheme.primary,
                    ),
                    title: const Text('Chế độ tối'),
                    subtitle: Text(
                      themeMode == ThemeMode.dark
                          ? 'Bật'
                          : themeMode == ThemeMode.light
                              ? 'Tắt'
                              : 'Theo hệ thống',
                    ),
                    trailing: Switch(
                      value: themeMode == ThemeMode.dark,
                      onChanged: (value) {
                        ref.read(themeProvider.notifier).setThemeMode(
                              value ? ThemeMode.dark : ThemeMode.light,
                            );
                      },
                    ),
                  ),
                  Divider(height: 1, color: colorScheme.outlineVariant),

                  // Logout
                  ListTile(
                    leading: Icon(
                      Icons.logout,
                      color: colorScheme.error,
                    ),
                    title: Text(
                      'Đăng xuất',
                      style: TextStyle(color: colorScheme.error),
                    ),
                    subtitle: const Text('Đăng xuất khỏi tài khoản'),
                    trailing: Icon(
                      Icons.chevron_right,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    onTap: () => _handleLogout(context, ref),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),

            // App Info
            CustomCard(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Thông tin ứng dụng',
                    style: theme.textTheme.titleMedium?.copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Phiên bản: 1.0.0',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
