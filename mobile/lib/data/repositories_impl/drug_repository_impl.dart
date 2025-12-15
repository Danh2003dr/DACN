import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../core/api/dio_client.dart';
import '../../core/api/api_endpoints.dart';
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
        ApiEndpoints.scanQR,
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

        // Convert manufacturerId (populated) to string if needed
        if (drugData['manufacturerId'] is Map) {
          final manufacturerIdObj =
              drugData['manufacturerId'] as Map<String, dynamic>;
          drugData['manufacturerId'] = manufacturerIdObj['_id']?.toString() ??
              manufacturerIdObj['id']?.toString() ??
              manufacturerIdObj.toString();
        }

        // Convert description from object to string if needed
        if (drugData['description'] is Map) {
          drugData['description'] = drugData['description'].toString();
        }

        // Convert qrCode from object to string if needed
        if (drugData['qrCode'] is Map) {
          final qrCodeObj = drugData['qrCode'] as Map<String, dynamic>;
          drugData['qrCode'] = qrCodeObj['data']?.toString() ??
              qrCodeObj['code']?.toString() ??
              qrCodeObj.toString();
        }

        // Convert image from object to string if needed
        if (drugData['image'] is Map) {
          final imageObj = drugData['image'] as Map<String, dynamic>;
          drugData['image'] = imageObj['url']?.toString() ??
              imageObj['path']?.toString() ??
              imageObj.toString();
        }

        // Convert createdBy from object to string if needed
        if (drugData['createdBy'] is Map) {
          final createdByObj = drugData['createdBy'] as Map<String, dynamic>;
          drugData['createdBy'] = createdByObj['_id']?.toString() ??
              createdByObj['id']?.toString() ??
              createdByObj.toString();
        }

        // Convert batchNumber from object to string if needed
        if (drugData['batchNumber'] is Map) {
          drugData['batchNumber'] = drugData['batchNumber'].toString();
        }

        // Convert drugId from object to string if needed
        if (drugData['drugId'] is Map) {
          drugData['drugId'] = drugData['drugId'].toString();
        }

        // Convert dates from various formats to ISO string if needed
        if (drugData['manufactureDate'] != null &&
            drugData['manufactureDate'] is! String) {
          if (drugData['manufactureDate'] is DateTime) {
            drugData['manufactureDate'] =
                (drugData['manufactureDate'] as DateTime).toIso8601String();
          } else {
            drugData['manufactureDate'] =
                drugData['manufactureDate'].toString();
          }
        }

        if (drugData['expiryDate'] != null &&
            drugData['expiryDate'] is! String) {
          if (drugData['expiryDate'] is DateTime) {
            drugData['expiryDate'] =
                (drugData['expiryDate'] as DateTime).toIso8601String();
          } else {
            drugData['expiryDate'] = drugData['expiryDate'].toString();
          }
        }

        if (drugData['createdAt'] != null && drugData['createdAt'] is! String) {
          if (drugData['createdAt'] is DateTime) {
            drugData['createdAt'] =
                (drugData['createdAt'] as DateTime).toIso8601String();
          } else {
            drugData['createdAt'] = drugData['createdAt'].toString();
          }
        }

        if (drugData['updatedAt'] != null && drugData['updatedAt'] is! String) {
          if (drugData['updatedAt'] is DateTime) {
            drugData['updatedAt'] =
                (drugData['updatedAt'] as DateTime).toIso8601String();
          } else {
            drugData['updatedAt'] = drugData['updatedAt'].toString();
          }
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

          // Convert manufacturerId (populated) to string if needed
          if (drugData['manufacturerId'] is Map) {
            final manufacturerIdObj =
                drugData['manufacturerId'] as Map<String, dynamic>;
            drugData['manufacturerId'] = manufacturerIdObj['_id']?.toString() ??
                manufacturerIdObj['id']?.toString() ??
                manufacturerIdObj.toString();
          }

          // Convert description from object to string if needed
          if (drugData['description'] is Map) {
            drugData['description'] = drugData['description'].toString();
          }

          // Convert qrCode from object to string if needed
          if (drugData['qrCode'] is Map) {
            final qrCodeObj = drugData['qrCode'] as Map<String, dynamic>;
            drugData['qrCode'] = qrCodeObj['data']?.toString() ??
                qrCodeObj['code']?.toString() ??
                qrCodeObj.toString();
          }

          // Convert image from object to string if needed
          if (drugData['image'] is Map) {
            final imageObj = drugData['image'] as Map<String, dynamic>;
            drugData['image'] = imageObj['url']?.toString() ??
                imageObj['path']?.toString() ??
                imageObj.toString();
          }

          // Convert createdBy from object to string if needed
          if (drugData['createdBy'] is Map) {
            final createdByObj = drugData['createdBy'] as Map<String, dynamic>;
            drugData['createdBy'] = createdByObj['_id']?.toString() ??
                createdByObj['id']?.toString() ??
                createdByObj.toString();
          }

          // Convert batchNumber from object to string if needed
          if (drugData['batchNumber'] is Map) {
            drugData['batchNumber'] = drugData['batchNumber'].toString();
          }

          // Convert drugId from object to string if needed
          if (drugData['drugId'] is Map) {
            drugData['drugId'] = drugData['drugId'].toString();
          }

          // Convert dates from various formats to ISO string if needed
          if (drugData['manufactureDate'] != null &&
              drugData['manufactureDate'] is! String) {
            if (drugData['manufactureDate'] is DateTime) {
              drugData['manufactureDate'] =
                  (drugData['manufactureDate'] as DateTime).toIso8601String();
            } else {
              drugData['manufactureDate'] =
                  drugData['manufactureDate'].toString();
            }
          }

          if (drugData['expiryDate'] != null &&
              drugData['expiryDate'] is! String) {
            if (drugData['expiryDate'] is DateTime) {
              drugData['expiryDate'] =
                  (drugData['expiryDate'] as DateTime).toIso8601String();
            } else {
              drugData['expiryDate'] = drugData['expiryDate'].toString();
            }
          }

          if (drugData['createdAt'] != null &&
              drugData['createdAt'] is! String) {
            if (drugData['createdAt'] is DateTime) {
              drugData['createdAt'] =
                  (drugData['createdAt'] as DateTime).toIso8601String();
            } else {
              drugData['createdAt'] = drugData['createdAt'].toString();
            }
          }

          if (drugData['updatedAt'] != null &&
              drugData['updatedAt'] is! String) {
            if (drugData['updatedAt'] is DateTime) {
              drugData['updatedAt'] =
                  (drugData['updatedAt'] as DateTime).toIso8601String();
            } else {
              drugData['updatedAt'] = drugData['updatedAt'].toString();
            }
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
        final statusCode = e.response?.statusCode;
        final message =
            e.response?.data['message'] ?? 'Không thể xác minh thuốc';

        // Handle 404 specifically - might still have data
        if (statusCode == 404) {
          final data = e.response?.data['data'];
          if (data != null && data['drug'] != null) {
            // Even 404 might have drug data
            final rawDrugData = data['drug'] as Map<String, dynamic>;
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

            // Convert manufacturerId (populated) to string if needed
            if (drugData['manufacturerId'] is Map) {
              final manufacturerIdObj =
                  drugData['manufacturerId'] as Map<String, dynamic>;
              drugData['manufacturerId'] =
                  manufacturerIdObj['_id']?.toString() ??
                      manufacturerIdObj['id']?.toString() ??
                      manufacturerIdObj.toString();
            }

            // Convert description from object to string if needed
            if (drugData['description'] is Map) {
              drugData['description'] = drugData['description'].toString();
            }

            // Convert qrCode from object to string if needed
            if (drugData['qrCode'] is Map) {
              final qrCodeObj = drugData['qrCode'] as Map<String, dynamic>;
              drugData['qrCode'] = qrCodeObj['data']?.toString() ??
                  qrCodeObj['code']?.toString() ??
                  qrCodeObj.toString();
            }

            // Convert image from object to string if needed
            if (drugData['image'] is Map) {
              final imageObj = drugData['image'] as Map<String, dynamic>;
              drugData['image'] = imageObj['url']?.toString() ??
                  imageObj['path']?.toString() ??
                  imageObj.toString();
            }

            // Convert createdBy from object to string if needed
            if (drugData['createdBy'] is Map) {
              final createdByObj =
                  drugData['createdBy'] as Map<String, dynamic>;
              drugData['createdBy'] = createdByObj['_id']?.toString() ??
                  createdByObj['id']?.toString() ??
                  createdByObj.toString();
            }

            // Convert batchNumber from object to string if needed
            if (drugData['batchNumber'] is Map) {
              drugData['batchNumber'] = drugData['batchNumber'].toString();
            }

            // Convert drugId from object to string if needed
            if (drugData['drugId'] is Map) {
              drugData['drugId'] = drugData['drugId'].toString();
            }

            // Convert dates from various formats to ISO string if needed
            if (drugData['manufactureDate'] != null &&
                drugData['manufactureDate'] is! String) {
              if (drugData['manufactureDate'] is DateTime) {
                drugData['manufactureDate'] =
                    (drugData['manufactureDate'] as DateTime).toIso8601String();
              } else {
                drugData['manufactureDate'] =
                    drugData['manufactureDate'].toString();
              }
            }

            if (drugData['expiryDate'] != null &&
                drugData['expiryDate'] is! String) {
              if (drugData['expiryDate'] is DateTime) {
                drugData['expiryDate'] =
                    (drugData['expiryDate'] as DateTime).toIso8601String();
              } else {
                drugData['expiryDate'] = drugData['expiryDate'].toString();
              }
            }

            if (drugData['createdAt'] != null &&
                drugData['createdAt'] is! String) {
              if (drugData['createdAt'] is DateTime) {
                drugData['createdAt'] =
                    (drugData['createdAt'] as DateTime).toIso8601String();
              } else {
                drugData['createdAt'] = drugData['createdAt'].toString();
              }
            }

            if (drugData['updatedAt'] != null &&
                drugData['updatedAt'] is! String) {
              if (drugData['updatedAt'] is DateTime) {
                drugData['updatedAt'] =
                    (drugData['updatedAt'] as DateTime).toIso8601String();
              } else {
                drugData['updatedAt'] = drugData['updatedAt'].toString();
              }
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
              'warning': data['warning'] ?? e.response?.data['warning'],
              'alertType': e.response?.data['alertType'],
              'isValid': false,
            });
          }
          return Left(NotFoundFailure(message));
        }

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
      final response = await dioClient.get(ApiEndpoints.drugById(drugId));

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
        ApiEndpoints.drugs,
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
        ApiEndpoints.supplyChains,
        queryParameters: {'drugId': drugId},
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
        ApiEndpoints.blockchainTransactions,
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
