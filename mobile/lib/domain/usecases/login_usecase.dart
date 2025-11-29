import 'package:dartz/dartz.dart';

import '../../core/errors/failures.dart';
import '../repositories_interfaces/auth_repository.dart';

class LoginUseCase {
  final AuthRepository repository;

  LoginUseCase(this.repository);

  Future<Either<Failure, Map<String, dynamic>>> call(
    String identifier,
    String password,
  ) async {
    return await repository.login(identifier, password);
  }
}
