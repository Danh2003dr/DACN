import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/dio_client.dart';
import '../../../core/providers/services_provider.dart';
import '../../../data/repositories_impl/drug_repository_impl.dart';
import '../../../domain/repositories_interfaces/drug_repository.dart';
import '../../../domain/usecases/verify_drug_usecase.dart';
import '../../widgets/app_input.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/loading_overlay.dart';

final manualDrugRepositoryProvider = Provider<DrugRepository>((ref) {
  final connectivityService = ref.read(connectivityServiceProvider);
  final syncService = ref.read(syncServiceProvider);
  return DrugRepositoryImpl(
    DioClient(),
    connectivityService: connectivityService,
    syncService: syncService,
  );
});

final manualVerifyDrugUseCaseProvider = Provider<VerifyDrugUseCase>((ref) {
  return VerifyDrugUseCase(ref.read(manualDrugRepositoryProvider));
});

class ManualVerificationScreen extends ConsumerStatefulWidget {
  const ManualVerificationScreen({super.key});

  @override
  ConsumerState<ManualVerificationScreen> createState() =>
      _ManualVerificationScreenState();
}

class _ManualVerificationScreenState
    extends ConsumerState<ManualVerificationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _codeController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  @override
  void dispose() {
    _codeController.dispose();
    super.dispose();
  }

  Future<void> _handleVerify() async {
    if (_formKey.currentState!.validate()) {
      setState(() {
        _isLoading = true;
        _errorMessage = null;
      });

      try {
        final code = _codeController.text.trim();

        // Navigate to verification screen with the code
        if (mounted) {
          context.pushNamed(
            'drug-verification',
            extra: {'qrData': code},
          );
        }
      } catch (e) {
        setState(() {
          _errorMessage = 'Lỗi: ${e.toString()}';
        });
      } finally {
        if (mounted) {
          setState(() {
            _isLoading = false;
          });
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return LoadingOverlay(
      isLoading: _isLoading,
      message: 'Đang xác minh...',
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Xác minh thuốc thủ công'),
        ),
        body: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // Icon
                Icon(
                  Icons.verified_user,
                  size: 80,
                  color: colorScheme.primary,
                ),
                const SizedBox(height: 24),

                // Title
                Text(
                  'Nhập mã để xác minh',
                  style: theme.textTheme.headlineMedium?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 8),
                Text(
                  'Nhập mã lô, mã thuốc hoặc blockchain ID',
                  style: theme.textTheme.bodyMedium?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 32),

                // Error message
                if (_errorMessage != null)
                  Container(
                    padding: const EdgeInsets.all(12),
                    margin: const EdgeInsets.only(bottom: 16),
                    decoration: BoxDecoration(
                      color: colorScheme.errorContainer,
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Row(
                      children: [
                        Icon(
                          Icons.error_outline,
                          color: colorScheme.onErrorContainer,
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _errorMessage!,
                            style: TextStyle(
                              color: colorScheme.onErrorContainer,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),

                // Code input
                AppInput(
                  label: 'Mã xác minh',
                  hint: 'Nhập mã lô, mã thuốc hoặc blockchain ID',
                  controller: _codeController,
                  prefixIcon: Icons.qr_code,
                  keyboardType: TextInputType.text,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Vui lòng nhập mã xác minh';
                    }
                    if (value.trim().length < 3) {
                      return 'Mã phải có ít nhất 3 ký tự';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 8),

                // Helper text
                Text(
                  'Bạn có thể nhập:\n• Số lô sản xuất (Batch Number)\n• Mã thuốc (Drug ID)\n• Blockchain ID',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                ),
                const SizedBox(height: 32),

                // Verify button
                CustomButton(
                  text: 'Xác minh',
                  onPressed: _handleVerify,
                  variant: ButtonVariant.primary,
                  size: ButtonSize.large,
                  isFullWidth: true,
                  icon: Icons.search,
                  isLoading: _isLoading,
                ),
                const SizedBox(height: 16),

                // Alternative: QR Scanner
                CustomButton(
                  text: 'Quét QR Code',
                  onPressed: () => context.push('/scanner'),
                  variant: ButtonVariant.outline,
                  size: ButtonSize.medium,
                  isFullWidth: true,
                  icon: Icons.qr_code_scanner,
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
