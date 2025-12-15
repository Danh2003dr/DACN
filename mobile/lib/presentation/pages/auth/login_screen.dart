import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/services/biometric_service.dart';
import '../../../domain/repositories_interfaces/auth_repository.dart';
import '../../../domain/usecases/login_usecase.dart';
import '../../../presentation/blocs/auth_provider.dart';
import '../../../presentation/blocs/user_provider.dart';
import '../../../data/models/user_model.dart';
import '../../../data/repositories_impl/auth_repository_impl.dart';
import '../../../core/api/dio_client.dart';
import '../../../presentation/widgets/app_input.dart';
import '../../../presentation/widgets/custom_button.dart';
import '../../../presentation/widgets/loading_overlay.dart';

final authRepositoryProvider = Provider<AuthRepository>((ref) {
  return AuthRepositoryImpl(DioClient());
});

final loginUseCaseProvider = Provider<LoginUseCase>((ref) {
  return LoginUseCase(ref.read(authRepositoryProvider));
});

final biometricServiceProvider = Provider<BiometricService>((ref) {
  return BiometricService();
});

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _formKey = GlobalKey<FormState>();
  final _identifierController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _obscurePassword = true;
  bool _isLoading = false;
  bool _rememberMe = false;
  bool _biometricAvailable = false;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _checkBiometricSupport();
    _loadSavedCredentials();
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

  Future<void> _loadSavedCredentials() async {
    final authRepo = ref.read(authRepositoryProvider);
    final result = await authRepo.getSavedCredentials();

    result.fold(
      (failure) => null,
      (credentials) {
        if (credentials != null && mounted) {
          setState(() {
            _identifierController.text = credentials['identifier'] ?? '';
            _passwordController.text = credentials['password'] ?? '';
            _rememberMe = true;
          });
        }
      },
    );
  }

  @override
  void dispose() {
    _identifierController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _handleLogin() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      try {
        final loginUseCase = ref.read(loginUseCaseProvider);
        final identifier = _identifierController.text.trim();
        final password = _passwordController.text;

        final result = await loginUseCase(identifier, password);

        result.fold(
          (failure) {
            setState(() {
              _errorMessage = failure.message;
              _isLoading = false;
            });
          },
          (data) async {
            final token = data['token'] as String;
            final user = data['user'] as UserModel;

            // Save credentials if remember me is checked
            if (_rememberMe) {
              final authRepo = ref.read(authRepositoryProvider);
              await authRepo.saveCredentials(identifier, password);
            } else {
              final authRepo = ref.read(authRepositoryProvider);
              await authRepo.clearSavedCredentials();
            }

            // Update auth state
            final authNotifier = ref.read(authProvider.notifier);
            await authNotifier.login(token);

            // Update user state
            final userNotifier = ref.read(userProvider.notifier);
            await userNotifier.setUser(user);

            if (mounted) {
              context.go('/home');
            }
          },
        );
      } catch (e) {
        setState(() {
          _errorMessage = 'Lỗi không xác định: ${e.toString()}';
          _isLoading = false;
        });
      }
    }
  }

  Future<void> _handleBiometricLogin() async {
    final biometricService = ref.read(biometricServiceProvider);
    final authenticated = await biometricService.authenticate(
      localizedReason: 'Xác thực danh tính để đăng nhập',
    );

    if (authenticated) {
      // Load saved credentials and login
      final authRepo = ref.read(authRepositoryProvider);
      final result = await authRepo.getSavedCredentials();

      result.fold(
        (failure) {
          setState(() {
            _errorMessage = 'Không tìm thấy thông tin đăng nhập đã lưu';
          });
        },
        (credentials) async {
          if (credentials != null) {
            _identifierController.text = credentials['identifier']!;
            _passwordController.text = credentials['password']!;
            await _handleLogin();
          } else {
            setState(() {
              _errorMessage = 'Chưa có thông tin đăng nhập đã lưu';
            });
          }
        },
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return LoadingOverlay(
      isLoading: _isLoading,
      message: 'Đang đăng nhập...',
      child: Scaffold(
        body: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Form(
                key: _formKey,
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    // Logo
                    Icon(
                      Icons.medical_services,
                      size: 80,
                      color: Theme.of(context).colorScheme.primary,
                    ),
                    const SizedBox(height: 32),
                    // Title
                    Text(
                      'Đăng nhập',
                      style: Theme.of(context).textTheme.displaySmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      'Chào mừng bạn trở lại',
                      style: Theme.of(context).textTheme.bodyMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    // Error message
                    if (_errorMessage != null)
                      Container(
                        padding: const EdgeInsets.all(12),
                        margin: const EdgeInsets.only(bottom: 16),
                        decoration: BoxDecoration(
                          color: Theme.of(context).colorScheme.errorContainer,
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Row(
                          children: [
                            Icon(
                              Icons.error_outline,
                              color: Theme.of(context).colorScheme.error,
                            ),
                            const SizedBox(width: 8),
                            Expanded(
                              child: Text(
                                _errorMessage!,
                                style: TextStyle(
                                  color: Theme.of(context).colorScheme.error,
                                ),
                              ),
                            ),
                          ],
                        ),
                      ),
                    // Email/Username Field
                    AppInput(
                      key: const ValueKey('identifier_input'),
                      label: 'Email hoặc Username',
                      hint: 'Nhập email hoặc username',
                      controller: _identifierController,
                      prefixIcon: Icons.person,
                      keyboardType: TextInputType.emailAddress,
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Vui lòng nhập email hoặc username';
                        }
                        if (value.trim().length < 3) {
                          return 'Tên đăng nhập phải có ít nhất 3 ký tự';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    // Password Field
                    AppInput(
                      key: const ValueKey('password_input'),
                      label: 'Mật khẩu',
                      hint: 'Nhập mật khẩu của bạn',
                      controller: _passwordController,
                      obscureText: _obscurePassword,
                      prefixIcon: Icons.lock,
                      suffixIcon: IconButton(
                        icon: Icon(
                          _obscurePassword
                              ? Icons.visibility
                              : Icons.visibility_off,
                        ),
                        onPressed: () {
                          // Toggle visibility - text is preserved by controller
                          setState(() {
                            _obscurePassword = !_obscurePassword;
                          });
                        },
                      ),
                      validator: (value) {
                        if (value == null || value.isEmpty) {
                          return 'Vui lòng nhập mật khẩu';
                        }
                        if (value.length < 6) {
                          return 'Mật khẩu phải có ít nhất 6 ký tự';
                        }
                        return null;
                      },
                    ),
                    const SizedBox(height: 16),
                    // Remember Me & Forgot Password
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        Row(
                          children: [
                            Checkbox(
                              value: _rememberMe,
                              onChanged: (value) {
                                setState(() {
                                  _rememberMe = value ?? false;
                                });
                              },
                            ),
                            const Text('Ghi nhớ đăng nhập'),
                          ],
                        ),
                        TextButton(
                          onPressed: () => context.push('/forgot-password'),
                          child: const Text('Quên mật khẩu?'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 24),
                    // Login Button
                    CustomButton(
                      text: 'Đăng nhập',
                      onPressed: _handleLogin,
                      variant: ButtonVariant.primary,
                      size: ButtonSize.large,
                      isFullWidth: true,
                      isLoading: _isLoading,
                    ),
                    // Biometric Login
                    if (_biometricAvailable) ...[
                      const SizedBox(height: 16),
                      const Divider(),
                      const SizedBox(height: 16),
                      CustomButton(
                        text: 'Đăng nhập bằng sinh trắc học',
                        onPressed: _handleBiometricLogin,
                        variant: ButtonVariant.outline,
                        size: ButtonSize.medium,
                        icon: Icons.fingerprint,
                        isFullWidth: true,
                        isLoading: _isLoading,
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
