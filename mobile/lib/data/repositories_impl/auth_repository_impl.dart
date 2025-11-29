import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/api/dio_client.dart';
import '../../core/constants/app_constants.dart';
import '../../core/errors/failures.dart';
import '../../core/services/biometric_service.dart';
import '../../domain/entities/user_entity.dart';
import '../../domain/repositories_interfaces/auth_repository.dart';
import '../models/user_model.dart';

class AuthRepositoryImpl implements AuthRepository {
  final DioClient dioClient;

  AuthRepositoryImpl(this.dioClient);

  @override
  Future<Either<Failure, Map<String, dynamic>>> login(
    String identifier,
    String password,
  ) async {
    try {
      final response = await dioClient.post(
        AppConstants.authLogin,
        data: {
          'identifier': identifier,
          'password': password,
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final token = data['token'] as String;
        final userData = data['user'] as Map<String, dynamic>;

        // Save token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.tokenKey, token);

        // Parse user
        final userModel = UserModel.fromJson(userData);

        return Right({
          'token': token,
          'user': userModel,
        });
      } else {
        final message = response.data['message'] ?? 'Đăng nhập thất bại';
        return Left(ServerFailure(message));
      }
    } on DioException catch (e) {
      if (e.response != null) {
        final message = e.response?.data['message'] ?? 'Đăng nhập thất bại';
        return Left(ServerFailure(message));
      } else {
        // Network error - provide more helpful message
        String errorMessage = 'Không thể kết nối đến server';
        if (e.type == DioExceptionType.connectionTimeout) {
          errorMessage =
              'Kết nối đến server bị timeout. Vui lòng kiểm tra backend có đang chạy không.';
        } else if (e.type == DioExceptionType.connectionError) {
          errorMessage = 'Không thể kết nối đến server. Vui lòng kiểm tra:\n'
              '1. Backend server có đang chạy không\n'
              '2. API URL có đúng không\n'
              '3. Firewall có block port không';
        }
        return Left(NetworkFailure(errorMessage));
      }
    } catch (e) {
      return Left(UnknownFailure('Lỗi không xác định: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> logout() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(AppConstants.tokenKey);
      await prefs.remove(AppConstants.userKey);
      await prefs.remove('remember_me');
      await prefs.remove('saved_identifier');
      await prefs.remove('saved_password');

      return const Right(null);
    } catch (e) {
      return Left(UnknownFailure('Lỗi khi đăng xuất: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, UserEntity?>> getCurrentUser() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final userJson = prefs.getString(AppConstants.userKey);

      if (userJson != null) {
        // TODO: Parse user from JSON
        return const Right(null);
      }

      return const Right(null);
    } catch (e) {
      return Left(
          UnknownFailure('Lỗi khi lấy thông tin user: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, bool>> checkBiometricSupport() async {
    try {
      final biometricService = BiometricService();
      final isSupported = await biometricService.isDeviceSupported();
      final canCheck = await biometricService.canCheckBiometrics();
      return Right(isSupported && canCheck);
    } catch (e) {
      return Left(
          UnknownFailure('Lỗi khi kiểm tra sinh trắc học: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, bool>> authenticateWithBiometric() async {
    try {
      final biometricService = BiometricService();
      final result = await biometricService.authenticate(
        localizedReason: 'Xác thực danh tính để đăng nhập',
      );
      return Right(result);
    } catch (e) {
      return Left(
          UnknownFailure('Lỗi khi xác thực sinh trắc học: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> saveCredentials(
    String identifier,
    String password,
  ) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString('saved_identifier', identifier);
      await prefs.setString('saved_password', password);
      return const Right(null);
    } catch (e) {
      return Left(UnknownFailure('Lỗi khi lưu thông tin: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, Map<String, String>?>> getSavedCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final identifier = prefs.getString('saved_identifier');
      final password = prefs.getString('saved_password');

      if (identifier != null && password != null) {
        return Right({
          'identifier': identifier,
          'password': password,
        });
      }

      return const Right(null);
    } catch (e) {
      return Left(
          UnknownFailure('Lỗi khi lấy thông tin đã lưu: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, void>> clearSavedCredentials() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove('saved_identifier');
      await prefs.remove('saved_password');
      await prefs.remove('remember_me');
      return const Right(null);
    } catch (e) {
      return Left(UnknownFailure('Lỗi khi xóa thông tin: ${e.toString()}'));
    }
  }
}
