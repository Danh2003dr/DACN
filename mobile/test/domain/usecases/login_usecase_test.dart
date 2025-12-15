import 'package:dartz/dartz.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:drug_traceability_mobile/domain/usecases/login_usecase.dart';
import 'package:drug_traceability_mobile/domain/repositories_interfaces/auth_repository.dart';
import 'package:drug_traceability_mobile/core/errors/failures.dart';

class MockAuthRepository extends Mock implements AuthRepository {}

void main() {
  late LoginUseCase useCase;
  late MockAuthRepository mockRepository;

  setUp(() {
    mockRepository = MockAuthRepository();
    useCase = LoginUseCase(mockRepository);
  });

  const tIdentifier = 'test@example.com';
  const tPassword = 'password123';
  const tToken = 'test_token';
  final tUser = {
    'id': '1',
    'email': 'test@example.com',
    'fullName': 'Test User',
  };

  test('should return user data when login is successful', () async {
    // Arrange
    when(() => mockRepository.login(tIdentifier, tPassword))
        .thenAnswer((_) async => Right({
              'token': tToken,
              'user': tUser,
            }));

    // Act
    final result = await useCase(tIdentifier, tPassword);

    // Assert
    expect(result, isA<Right<Failure, Map<String, dynamic>>>());
    result.fold(
      (failure) => fail('should not return failure'),
      (data) {
        expect(data['token'], tToken);
        expect(data['user'], tUser);
      },
    );
    verify(() => mockRepository.login(tIdentifier, tPassword)).called(1);
  });

  test('should return ServerFailure when login fails', () async {
    // Arrange
    when(() => mockRepository.login(tIdentifier, tPassword))
        .thenAnswer((_) async => const Left(ServerFailure('Invalid credentials')));

    // Act
    final result = await useCase(tIdentifier, tPassword);

    // Assert
    expect(result, isA<Left<Failure, Map<String, dynamic>>>());
    result.fold(
      (failure) => expect(failure, isA<ServerFailure>()),
      (data) => fail('should not return data'),
    );
    verify(() => mockRepository.login(tIdentifier, tPassword)).called(1);
  });
}

