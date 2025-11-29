import 'package:local_auth/local_auth.dart';
import 'package:local_auth_android/local_auth_android.dart';
import 'package:local_auth_darwin/local_auth_darwin.dart';

class BiometricService {
  final LocalAuthentication _localAuth = LocalAuthentication();

  /// Check if device supports biometric authentication
  Future<bool> isDeviceSupported() async {
    try {
      return await _localAuth.isDeviceSupported();
    } catch (e) {
      return false;
    }
  }

  /// Check if biometrics are available (enrolled)
  Future<bool> canCheckBiometrics() async {
    try {
      return await _localAuth.canCheckBiometrics;
    } catch (e) {
      return false;
    }
  }

  /// Get available biometric types
  Future<List<BiometricType>> getAvailableBiometrics() async {
    try {
      return await _localAuth.getAvailableBiometrics();
    } catch (e) {
      return [];
    }
  }

  /// Authenticate with biometrics
  Future<bool> authenticate({
    String localizedReason = 'Xác thực danh tính của bạn',
    bool useErrorDialogs = true,
    bool stickyAuth = true,
  }) async {
    try {
      final isSupported = await isDeviceSupported();
      if (!isSupported) {
        return false;
      }

      final canCheck = await canCheckBiometrics();
      if (!canCheck) {
        return false;
      }

      final result = await _localAuth.authenticate(
        localizedReason: localizedReason,
        options: AuthenticationOptions(
          useErrorDialogs: useErrorDialogs,
          stickyAuth: stickyAuth,
          biometricOnly: true,
        ),
        authMessages: const [
          AndroidAuthMessages(
            signInTitle: 'Xác thực sinh trắc học',
            cancelButton: 'Hủy',
            biometricHint: '',
            biometricNotRecognized: 'Không nhận diện được',
            biometricSuccess: 'Xác thực thành công',
            deviceCredentialsRequiredTitle: 'Yêu cầu xác thực',
            deviceCredentialsSetupDescription:
                'Cần thiết lập xác thực thiết bị',
          ),
          IOSAuthMessages(
            cancelButton: 'Hủy',
            goToSettingsButton: 'Cài đặt',
            goToSettingsDescription: 'Vui lòng thiết lập xác thực',
            lockOut: 'Đã bị khóa, vui lòng thử lại sau',
          ),
        ],
      );

      return result;
    } catch (e) {
      print('Biometric authentication error: $e');
      return false;
    }
  }

  /// Stop authentication (if in progress)
  Future<void> stopAuthentication() async {
    try {
      await _localAuth.stopAuthentication();
    } catch (e) {
      print('Stop authentication error: $e');
    }
  }
}
