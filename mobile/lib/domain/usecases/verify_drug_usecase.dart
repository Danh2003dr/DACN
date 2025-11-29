import 'package:dartz/dartz.dart';

import '../../core/errors/failures.dart';
import '../repositories_interfaces/drug_repository.dart';

class VerifyDrugUseCase {
  final DrugRepository repository;

  VerifyDrugUseCase(this.repository);

  Future<Either<Failure, Map<String, dynamic>>> call(String qrData) async {
    return await repository.verifyDrug(qrData);
  }
}
