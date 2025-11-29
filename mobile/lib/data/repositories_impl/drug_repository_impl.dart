import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../core/api/dio_client.dart';
import '../../core/constants/app_constants.dart';
import '../../core/errors/failures.dart';
import '../../core/services/connectivity_service.dart';
import '../../core/services/sync_service.dart';
import '../../domain/entities/drug_entity.dart';
import '../../domain/entities/supply_chain_entity.dart';
import '../../domain/entities/blockchain_transaction_entity.dart';
import '../../domain/repositories_interfaces/drug_repository.dart';
import '../models/drug_model.dart';
import '../models/supply_chain_model.dart';
import '../models/blockchain_transaction_model.dart';

class DrugRepositoryImpl implements DrugRepository {
  final DioClient dioClient;
  final ConnectivityService? connectivityService;
  final SyncService? syncService;

  DrugRepositoryImpl(
    this.dioClient, {
    this.connectivityService,
    this.syncService,
  });

  @override
  Future<Either<Failure, Map<String, dynamic>>> verifyDrug(
    String qrData,
  ) async {
    // Check connectivity
    final isOnline = await connectivityService?.checkConnectivity() ?? true;

    if (!isOnline) {
      // Save to offline scans
      await syncService?.addOfflineScan(qrData);

      // Return mock/cached data for offline mode
      return Right({
        'drug': DrugModel(
          id: qrData,
          name: 'Thuốc (Offline)',
          batchNumber: qrData,
          expiryDate: DateTime.now().add(const Duration(days: 365)),
          manufacturer: 'Đang tải...',
        ),
        'blockchain': null,
        'blockchainInfo': null,
        'risk': null,
        'message':
            'Đang ở chế độ offline. Dữ liệu sẽ được đồng bộ khi có kết nối.',
        'warning': 'Chế độ offline - Dữ liệu chưa được xác minh',
        'alertType': 'warning',
        'isOffline': true,
      });
    }

    try {
      final response = await dioClient.post(
        '${AppConstants.drugs}/scan-qr',
        data: {'qrData': qrData},
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final data = response.data['data'];
        final rawDrugData = data['drug'] as Map<String, dynamic>;
        final blockchainData = data['blockchain'];
        final blockchainInfo = data['blockchainInfo'];
        final risk = data['risk'];

        // Clean drug data - handle nested objects
        final drugData = Map<String, dynamic>.from(rawDrugData);

        // Convert manufacturer from object to string if needed
        if (drugData['manufacturer'] is Map) {
          final manufacturerObj =
              drugData['manufacturer'] as Map<String, dynamic>;
          drugData['manufacturer'] = manufacturerObj['fullName'] ??
              manufacturerObj['name'] ??
              manufacturerObj['organizationInfo']?['name'] ??
              manufacturerObj.toString();
        }

        // Ensure id is present
        drugData['id'] = drugData['id'] ??
            drugData['_id']?.toString() ??
            drugData['drugId']?.toString() ??
            '';

        final drug = DrugModel.fromJson(drugData);

        return Right({
          'drug': drug,
          'blockchain': blockchainData,
          'blockchainInfo': blockchainInfo,
          'risk': risk,
          'message': response.data['message'],
          'warning': response.data['warning'],
          'alertType': response.data['alertType'],
        });
      } else {
        final message = response.data['message'] ?? 'Không thể xác minh thuốc';
        final alertType = response.data['alertType'];
        final data = response.data['data'];

        // Even if success is false, we might have drug data (e.g., expired, recalled)
        if (data != null && data['drug'] != null) {
          final rawDrugData = data['drug'] as Map<String, dynamic>;

          // Clean drug data - handle nested objects
          final drugData = Map<String, dynamic>.from(rawDrugData);

          // Convert manufacturer from object to string if needed
          if (drugData['manufacturer'] is Map) {
            final manufacturerObj =
                drugData['manufacturer'] as Map<String, dynamic>;
            drugData['manufacturer'] = manufacturerObj['fullName'] ??
                manufacturerObj['name'] ??
                manufacturerObj['organizationInfo']?['name'] ??
                manufacturerObj.toString();
          }

          // Ensure id is present
          drugData['id'] = drugData['id'] ??
              drugData['_id']?.toString() ??
              drugData['drugId']?.toString() ??
              '';

          final drug = DrugModel.fromJson(drugData);

          return Right({
            'drug': drug,
            'blockchain': data['blockchain'],
            'blockchainInfo': data['blockchainInfo'],
            'risk': data['risk'],
            'message': message,
            'warning': data['warning'] ?? response.data['warning'],
            'alertType': alertType,
            'isValid': false,
          });
        }

        return Left(NotFoundFailure(message));
      }
    } on DioException catch (e) {
      if (e.response != null) {
        final message =
            e.response?.data['message'] ?? 'Không thể xác minh thuốc';
        return Left(ServerFailure(message));
      } else {
        return const Left(NetworkFailure('Không thể kết nối đến server'));
      }
    } catch (e) {
      return Left(UnknownFailure('Lỗi không xác định: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, DrugEntity>> getDrugById(String drugId) async {
    try {
      final response = await dioClient.get('${AppConstants.drugs}/$drugId');

      if (response.statusCode == 200 && response.data['success'] == true) {
        final drugData = response.data['data']['drug'] as Map<String, dynamic>;
        final drug = DrugModel.fromJson(drugData);
        return Right(drug);
      } else {
        final message = response.data['message'] ?? 'Không tìm thấy thuốc';
        return Left(NotFoundFailure(message));
      }
    } on DioException catch (e) {
      if (e.response?.statusCode == 404) {
        return const Left(NotFoundFailure('Không tìm thấy thuốc'));
      } else if (e.response != null) {
        final message = e.response?.data['message'] ?? 'Lỗi server';
        return Left(ServerFailure(message));
      } else {
        return const Left(NetworkFailure('Không thể kết nối đến server'));
      }
    } catch (e) {
      return Left(UnknownFailure('Lỗi không xác định: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, List<DrugEntity>>> getDrugs({
    int page = 1,
    int limit = 20,
    String? search,
    String? status,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }
      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }

      final response = await dioClient.get(
        AppConstants.drugs,
        queryParameters: queryParams,
        skipErrorHandler: true,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final drugsData = response.data['data']['drugs'] as List<dynamic>;
        final drugs = drugsData
            .map((drugJson) =>
                DrugModel.fromJson(drugJson as Map<String, dynamic>))
            .toList();
        return Right(drugs);
      } else {
        return const Left(ServerFailure('Không thể lấy danh sách thuốc'));
      }
    } on DioException catch (e) {
      if (e.response != null) {
        final message = e.response?.data['message'] ?? 'Lỗi server';
        return Left(ServerFailure(message));
      } else {
        return const Left(NetworkFailure('Không thể kết nối đến server'));
      }
    } catch (e) {
      return Left(UnknownFailure('Lỗi không xác định: ${e.toString()}'));
    }
  }

  @override
  Future<Either<Failure, List<SupplyChainEntity>>> getDrugSupplyChains(
    String drugId,
  ) async {
    try {
      final response = await dioClient.get(
        '${AppConstants.supplyChains}?drugId=$drugId',
        skipErrorHandler: true,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final chainsData =
            response.data['data']['supplyChains'] as List<dynamic>;
        final chains = chainsData
            .map((chainJson) =>
                SupplyChainModel.fromJson(chainJson as Map<String, dynamic>))
            .toList();
        return Right(chains);
      } else {
        return const Right([]); // Return empty list if no supply chains
      }
    } on DioException catch (_) {
      // Return empty list on error
      return const Right([]);
    } catch (_) {
      return const Right([]);
    }
  }

  @override
  Future<Either<Failure, List<BlockchainTransactionEntity>>>
      getDrugBlockchainTransactions(String drugId) async {
    try {
      final response = await dioClient.get(
        '${AppConstants.blockchain}/transactions',
        queryParameters: {'drugId': drugId},
        skipErrorHandler: true,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final transactionsData =
            response.data['data']['transactions'] as List<dynamic>;
        final transactions = transactionsData
            .map((txJson) => BlockchainTransactionModel.fromJson(
                txJson as Map<String, dynamic>))
            .toList();
        return Right(transactions);
      } else {
        return const Right([]); // Return empty list if no transactions
      }
    } on DioException catch (_) {
      // Return empty list on error
      return const Right([]);
    } catch (_) {
      return const Right([]);
    }
  }
}
