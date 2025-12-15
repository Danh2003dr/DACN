import 'package:hive/hive.dart';

import '../../domain/entities/verification_history_entity.dart';

// Note: JSON serialization temporarily disabled - using SharedPreferences directly
// To enable: run `flutter pub run build_runner build`
// part 'verification_history_model.g.dart';

@HiveType(typeId: 1)
class VerificationHistoryModel extends VerificationHistoryEntity {
  const VerificationHistoryModel({
    required super.id,
    required super.drugId,
    super.drugName,
    super.batchNumber,
    required super.qrCode,
    required super.verifiedAt,
    required super.status,
    super.message,
    super.isBlockchainVerified,
    super.blockchainTransactionHash,
    super.drugData,
  });

  // Temporary implementation - will use generated code after build_runner
  factory VerificationHistoryModel.fromJson(Map<String, dynamic> json) {
    return VerificationHistoryModel(
      id: json['id'] as String,
      drugId: json['drugId'] as String,
      drugName: json['drugName'] as String?,
      batchNumber: json['batchNumber'] as String?,
      qrCode: json['qrCode'] as String,
      verifiedAt: DateTime.parse(json['verifiedAt'] as String),
      status: json['status'] as String,
      message: json['message'] as String?,
      isBlockchainVerified: json['isBlockchainVerified'] as bool? ?? false,
      blockchainTransactionHash: json['blockchainTransactionHash'] as String?,
      drugData: json['drugData'] as Map<String, dynamic>?,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'drugId': drugId,
      'drugName': drugName,
      'batchNumber': batchNumber,
      'qrCode': qrCode,
      'verifiedAt': verifiedAt.toIso8601String(),
      'status': status,
      'message': message,
      'isBlockchainVerified': isBlockchainVerified,
      'blockchainTransactionHash': blockchainTransactionHash,
      'drugData': drugData,
    };
  }

  factory VerificationHistoryModel.fromEntity(
      VerificationHistoryEntity entity) {
    return VerificationHistoryModel(
      id: entity.id,
      drugId: entity.drugId,
      drugName: entity.drugName,
      batchNumber: entity.batchNumber,
      qrCode: entity.qrCode,
      verifiedAt: entity.verifiedAt,
      status: entity.status,
      message: entity.message,
      isBlockchainVerified: entity.isBlockchainVerified,
      blockchainTransactionHash: entity.blockchainTransactionHash,
      drugData: entity.drugData,
    );
  }

  VerificationHistoryEntity toEntity() {
    return VerificationHistoryEntity(
      id: id,
      drugId: drugId,
      drugName: drugName,
      batchNumber: batchNumber,
      qrCode: qrCode,
      verifiedAt: verifiedAt,
      status: status,
      message: message,
      isBlockchainVerified: isBlockchainVerified,
      blockchainTransactionHash: blockchainTransactionHash,
      drugData: drugData,
    );
  }
}
