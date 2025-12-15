import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../core/api/dio_client.dart';
import '../../core/api/api_endpoints.dart';
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
        ApiEndpoints.login,
        data: {
          'identifier': identifier,
          'password': password,
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final responseData = response.data;

        // Kiểm tra và lấy data object
        if (responseData['data'] == null) {
          return const Left(ServerFailure('Dữ liệu phản hồi không hợp lệ'));
        }

        final data = responseData['data'] as Map<String, dynamic>;

        // Lấy token - xử lý an toàn
        String? token;
        if (data['token'] != null) {
          if (data['token'] is String) {
            token = data['token'] as String;
          } else {
            // Nếu token là object, thử lấy string từ nó
            token = data['token'].toString();
          }
        }

        if (token == null || token.isEmpty) {
          return const Left(ServerFailure('Không nhận được token từ server'));
        }

        // Lấy user data - xử lý an toàn
        Map<String, dynamic>? userData;
        if (data['user'] != null) {
          if (data['user'] is Map<String, dynamic>) {
            userData = data['user'] as Map<String, dynamic>;
          } else if (data['user'] is Map) {
            userData = Map<String, dynamic>.from(data['user'] as Map);
          } else {
            return const Left(ServerFailure('Dữ liệu user không hợp lệ'));
          }
        }

        if (userData == null) {
          return const Left(
              ServerFailure('Không nhận được thông tin user từ server'));
        }

        // Save token
        final prefs = await SharedPreferences.getInstance();
        await prefs.setString(AppConstants.tokenKey, token);

        // Save user data as JSON string
        try {
          final userJson = userData.toString(); // Temporary, sẽ parse sau
          await prefs.setString(AppConstants.userKey, userJson);
        } catch (e) {
          // Ignore error saving user data
          print('Warning: Could not save user data: $e');
        }

        // Parse user - Map backend fields to UserModel fields
        try {
          // Backend trả về: id, username, email, fullName, role, organizationId, patientId, organizationInfo, mustChangePassword, lastLogin
          // UserModel cần: id, email, name, phone, role, avatar, isActive, createdAt, updatedAt
          final mappedUserData = <String, dynamic>{
            'id':
                userData['id']?.toString() ?? userData['_id']?.toString() ?? '',
            'email': userData['email']?.toString() ?? '',
            'name': userData['fullName']?.toString() ??
                userData['name']?.toString(),
            'phone': userData['phone']?.toString(),
            'role': userData['role']?.toString() ?? 'user',
            'avatar': userData['avatar']?.toString(),
            'isActive': userData['isActive'] ?? true,
            'createdAt': userData['createdAt']?.toString(),
            'updatedAt': userData['updatedAt']?.toString(),
          };

          // Validate required fields
          if (mappedUserData['id'] == null || mappedUserData['id']!.isEmpty) {
            return const Left(ServerFailure('Thông tin user thiếu ID'));
          }
          if (mappedUserData['email'] == null ||
              mappedUserData['email']!.isEmpty) {
            return const Left(ServerFailure('Thông tin user thiếu email'));
          }

          final userModel = UserModel.fromJson(mappedUserData);

          // Save user data as JSON string for later use
          try {
            final prefs = await SharedPreferences.getInstance();
            await prefs.setString(
                AppConstants.userKey, userModel.toJson().toString());
          } catch (e) {
            // Ignore error saving user data
            print('Warning: Could not save user data: $e');
          }

          return Right({
            'token': token,
            'user': userModel,
          });
        } catch (e) {
          print('Error parsing user data: $e');
          print('User data received: $userData');
          return Left(
              UnknownFailure('Lỗi khi parse user data: ${e.toString()}'));
        }
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

  @override
  Future<Either<Failure, void>> changePassword(
    String currentPassword,
    String newPassword,
    String confirmPassword,
  ) async {
    try {
      final response = await dioClient.put(
        ApiEndpoints.changePassword,
        data: {
          'currentPassword': currentPassword,
          'newPassword': newPassword,
          'confirmPassword': confirmPassword,
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        return const Right(null);
      } else {
        final message = response.data['message'] ?? 'Đổi mật khẩu thất bại';
        return Left(ServerFailure(message));
      }
    } on DioException catch (e) {
      if (e.response != null) {
        final statusCode = e.response?.statusCode;
        final responseData = e.response?.data;

        // Xử lý lỗi 403 - Forbidden (có thể do token không hợp lệ)
        if (statusCode == 403) {
          final message = responseData?['message'] ??
              'Bạn không có quyền thực hiện thao tác này. Vui lòng đăng nhập lại.';
          return Left(ServerFailure(message));
        }

        // Xử lý lỗi 401 - Unauthorized (token hết hạn hoặc không hợp lệ)
        if (statusCode == 401) {
          final message = responseData?['message'] ??
              'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
          return Left(ServerFailure(message));
        }

        final message = responseData?['message'] ??
            responseData?['error'] ??
            'Đổi mật khẩu thất bại';
        return Left(ServerFailure(message));
      } else {
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
}
