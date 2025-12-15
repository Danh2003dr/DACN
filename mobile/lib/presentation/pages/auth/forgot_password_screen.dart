import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../widgets/app_input.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/custom_card.dart';
import '../../widgets/loading_overlay.dart';
import '../../../core/providers/services_provider.dart';
import 'package:fluttertoast/fluttertoast.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _isLoading = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _handleForgotPassword() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    setState(() {
      _isLoading = true;
    });

    try {
      final dioClient = ref.read(dioClientProvider);

      // Call API to send reset password email
      await dioClient.post(
        '/auth/forgot-password',
        data: {
          'email': _emailController.text.trim(),
        },
      );

      if (mounted) {
        Fluttertoast.showToast(
          msg: 'Email đặt lại mật khẩu đã được gửi. Vui lòng kiểm tra hộp thư.',
          toastLength: Toast.LENGTH_LONG,
        );
        context.pop();
      }
    } catch (e) {
      if (mounted) {
        Fluttertoast.showToast(
          msg: 'Lỗi: ${e.toString()}',
          toastLength: Toast.LENGTH_LONG,
        );
      }
    } finally {
      if (mounted) {
        setState(() {
          _isLoading = false;
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quên mật khẩu'),
        elevation: 0,
      ),
      body: LoadingOverlay(
        isLoading: _isLoading,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                const SizedBox(height: 32),
                // Icon
                Icon(
                  Icons.lock_reset,
                  size: 80,
                  color: colorScheme.primary,
                ),
                const SizedBox(height: 24),
                // Title
                Text(
                  'Quên mật khẩu?',
                  style: theme.textTheme.headlineSmall?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                // Subtitle
                Text(
                  'Nhập email của bạn để nhận link đặt lại mật khẩu',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),
                // Email input
                AppInput(
                  controller: _emailController,
                  hint: 'Email',
                  keyboardType: TextInputType.emailAddress,
                  prefixIcon: Icons.email_outlined,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Vui lòng nhập email';
                    }
                    if (!value.contains('@')) {
                      return 'Email không hợp lệ';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 24),
                // Submit button
                CustomButton(
                  text: 'Gửi email đặt lại mật khẩu',
                  onPressed: _handleForgotPassword,
                  variant: ButtonVariant.primary,
                  isFullWidth: true,
                  icon: Icons.send,
                ),
                const SizedBox(height: 16),
                // Back to login
                TextButton(
                  onPressed: () => context.pop(),
                  child: const Text('Quay lại đăng nhập'),
                ),
                const SizedBox(height: 24),
                // Info card
                CustomCard(
                  padding: const EdgeInsets.all(16),
                  child: Row(
                    children: [
                      Icon(
                        Icons.info_outline,
                        color: colorScheme.primary,
                      ),
                      const SizedBox(width: 12),
                      Expanded(
                        child: Text(
                          'Nếu email không có trong hệ thống, bạn sẽ không nhận được email đặt lại mật khẩu.',
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
