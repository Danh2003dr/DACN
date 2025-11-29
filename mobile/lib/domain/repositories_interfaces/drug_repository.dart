import 'package:dartz/dartz.dart';

import '../../core/errors/failures.dart';
import '../entities/drug_entity.dart';
import '../entities/supply_chain_entity.dart';
import '../entities/blockchain_transaction_entity.dart';

abstract class DrugRepository {
  Future<Either<Failure, Map<String, dynamic>>> verifyDrug(String qrData);

  Future<Either<Failure, DrugEntity>> getDrugById(String drugId);

  Future<Either<Failure, List<DrugEntity>>> getDrugs({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
  });

  Future<Either<Failure, List<SupplyChainEntity>>> getDrugSupplyChains(
    String drugId,
  );

  Future<Either<Failure, List<BlockchainTransactionEntity>>>
      getDrugBlockchainTransactions(String drugId);
}
