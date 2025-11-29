import 'package:dartz/dartz.dart';

import '../../core/errors/failures.dart';
import '../entities/user_entity.dart';

abstract class AuthRepository {
  Future<Either<Failure, Map<String, dynamic>>> login(
    String identifier,
    String password,
  );

  Future<Either<Failure, void>> logout();

  Future<Either<Failure, UserEntity?>> getCurrentUser();

  Future<Either<Failure, bool>> checkBiometricSupport();

  Future<Either<Failure, bool>> authenticateWithBiometric();

  Future<Either<Failure, void>> saveCredentials(
    String identifier,
    String password,
  );

  Future<Either<Failure, Map<String, String>?>> getSavedCredentials();

  Future<Either<Failure, void>> clearSavedCredentials();
}
