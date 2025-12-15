import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../../core/services/biometric_service.dart';
import '../../../presentation/blocs/auth_provider.dart';
import '../../../presentation/blocs/user_provider.dart';
import '../../../presentation/blocs/theme_provider.dart';
import '../../widgets/custom_card.dart';

final biometricServiceProvider = Provider<BiometricService>((ref) {
  return BiometricService();
});

final biometricEnabledProvider =
    StateNotifierProvider<BiometricEnabledNotifier, bool>((ref) {
  return BiometricEnabledNotifier();
});

class BiometricEnabledNotifier extends StateNotifier<bool> {
  BiometricEnabledNotifier() : super(false) {
    _loadBiometricEnabled();
  }

  Future<void> _loadBiometricEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getBool('biometric_enabled') ?? false;
  }

  Future<void> setEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('biometric_enabled', enabled);
    state = enabled;
  }
}

final notificationsEnabledProvider =
    StateNotifierProvider<NotificationsEnabledNotifier, bool>((ref) {
  return NotificationsEnabledNotifier();
});

class NotificationsEnabledNotifier extends StateNotifier<bool> {
  NotificationsEnabledNotifier() : super(true) {
    _loadNotificationsEnabled();
  }

  Future<void> _loadNotificationsEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getBool('notifications_enabled') ?? true;
  }

  Future<void> setEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', enabled);
    state = enabled;
  }
}

final languageProvider = StateNotifierProvider<LanguageNotifier, String>((ref) {
  return LanguageNotifier();
});

class LanguageNotifier extends StateNotifier<String> {
  LanguageNotifier() : super('vi') {
    _loadLanguage();
  }

  Future<void> _loadLanguage() async {
    final prefs = await SharedPreferences.getInstance();
    state = prefs.getString('language') ?? 'vi';
  }

  Future<void> setLanguage(String language) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('language', language);
    state = language;
  }
}

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _biometricAvailable = false;

  @override
  void initState() {
    super.initState();
    _checkBiometricSupport();
  }

  Future<void> _checkBiometricSupport() async {
    final biometricService = ref.read(biometricServiceProvider);
    final isSupported = await biometricService.isDeviceSupported();
    final canCheck = await biometricService.canCheckBiometrics();

    if (mounted) {
      setState(() {
        _biometricAvailable = isSupported && canCheck;
      });
    }
  }

  Future<void> _handleLogout(BuildContext context) async {
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
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Đăng xuất'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
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
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final biometricEnabled = ref.watch(biometricEnabledProvider);
    final notificationsEnabled = ref.watch(notificationsEnabledProvider);
    final language = ref.watch(languageProvider);
    final themeMode = ref.watch(themeProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Cài đặt'),
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            // Security Section
            CustomCard(
              padding: EdgeInsets.zero,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Bảo mật',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  // Biometric Auth
                  if (_biometricAvailable)
                    ListTile(
                      leading: Icon(
                        Icons.fingerprint,
                        color: colorScheme.primary,
                      ),
                      title: const Text('Xác thực sinh trắc học'),
                      subtitle: const Text('Sử dụng vân tay hoặc Face ID'),
                      trailing: Switch(
                        value: biometricEnabled,
                        onChanged: (value) {
                          ref
                              .read(biometricEnabledProvider.notifier)
                              .setEnabled(value);
                        },
                      ),
                    ),
                  if (_biometricAvailable)
                    Divider(height: 1, color: colorScheme.outlineVariant),
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
                    onTap: () => context.push('/change-password'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Notifications Section
            CustomCard(
              padding: EdgeInsets.zero,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Thông báo',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  ListTile(
                    leading: Icon(
                      Icons.notifications_outlined,
                      color: colorScheme.primary,
                    ),
                    title: const Text('Bật thông báo'),
                    subtitle: const Text('Nhận thông báo từ ứng dụng'),
                    trailing: Switch(
                      value: notificationsEnabled,
                      onChanged: (value) {
                        ref
                            .read(notificationsEnabledProvider.notifier)
                            .setEnabled(value);
                      },
                    ),
                  ),
                  Divider(height: 1, color: colorScheme.outlineVariant),
                  ListTile(
                    leading: Icon(
                      Icons.notifications_active,
                      color: colorScheme.primary,
                    ),
                    title: const Text('Lịch sử thông báo'),
                    subtitle: const Text('Xem tất cả thông báo đã nhận'),
                    trailing: Icon(
                      Icons.chevron_right,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    onTap: () => context.push('/notifications'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Appearance Section
            CustomCard(
              padding: EdgeInsets.zero,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Giao diện',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  // Dark Mode
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
                  // Language
                  ListTile(
                    leading: Icon(
                      Icons.language,
                      color: colorScheme.primary,
                    ),
                    title: const Text('Ngôn ngữ'),
                    subtitle: Text(
                      language == 'vi' ? 'Tiếng Việt' : 'English',
                    ),
                    trailing: DropdownButton<String>(
                      value: language,
                      items: const [
                        DropdownMenuItem(
                          value: 'vi',
                          child: Text('Tiếng Việt'),
                        ),
                        DropdownMenuItem(
                          value: 'en',
                          child: Text('English'),
                        ),
                      ],
                      onChanged: (value) {
                        if (value != null) {
                          ref
                              .read(languageProvider.notifier)
                              .setLanguage(value);
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text(
                                  'Cần khởi động lại ứng dụng để áp dụng ngôn ngữ mới'),
                            ),
                          );
                        }
                      },
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // About Section
            CustomCard(
              padding: EdgeInsets.zero,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Text(
                      'Thông tin',
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  ListTile(
                    leading: Icon(
                      Icons.info_outline,
                      color: colorScheme.primary,
                    ),
                    title: const Text('Về ứng dụng'),
                    subtitle: const Text('Phiên bản 1.0.0'),
                    trailing: Icon(
                      Icons.chevron_right,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    onTap: () {
                      showAboutDialog(
                        context: context,
                        applicationName: 'Quản lý nguồn gốc thuốc',
                        applicationVersion: '1.0.0',
                        applicationIcon: Icon(
                          Icons.medical_services,
                          size: 48,
                          color: colorScheme.primary,
                        ),
                        children: [
                          const SizedBox(height: 16),
                          const Text(
                            'Ứng dụng quản lý và xác minh nguồn gốc xuất xứ thuốc sử dụng công nghệ Blockchain.',
                          ),
                        ],
                      );
                    },
                  ),
                  Divider(height: 1, color: colorScheme.outlineVariant),
                  ListTile(
                    leading: Icon(
                      Icons.privacy_tip_outlined,
                      color: colorScheme.primary,
                    ),
                    title: const Text('Chính sách bảo mật'),
                    subtitle: const Text('Xem chính sách bảo mật'),
                    trailing: Icon(
                      Icons.chevron_right,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    onTap: () => context.push('/privacy-policy'),
                  ),
                  Divider(height: 1, color: colorScheme.outlineVariant),
                  ListTile(
                    leading: Icon(
                      Icons.description_outlined,
                      color: colorScheme.primary,
                    ),
                    title: const Text('Điều khoản sử dụng'),
                    subtitle: const Text('Xem điều khoản sử dụng'),
                    trailing: Icon(
                      Icons.chevron_right,
                      color: colorScheme.onSurfaceVariant,
                    ),
                    onTap: () => context.push('/terms-of-service'),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Logout
            CustomCard(
              padding: EdgeInsets.zero,
              child: ListTile(
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
                onTap: () => _handleLogout(context),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
