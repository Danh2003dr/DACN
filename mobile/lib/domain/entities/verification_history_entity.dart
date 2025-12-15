import 'package:equatable/equatable.dart';

class VerificationHistoryEntity extends Equatable {
  final String id;
  final String drugId;
  final String? drugName;
  final String? batchNumber;
  final String qrCode;
  final DateTime verifiedAt;
  final String status; // 'valid', 'expired', 'recalled', 'invalid', 'warning'
  final String? message;
  final bool isBlockchainVerified;
  final String? blockchainTransactionHash;
  final Map<String, dynamic>? drugData; // Full drug data snapshot

  const VerificationHistoryEntity({
    required this.id,
    required this.drugId,
    this.drugName,
    this.batchNumber,
    required this.qrCode,
    required this.verifiedAt,
    required this.status,
    this.message,
    this.isBlockchainVerified = false,
    this.blockchainTransactionHash,
    this.drugData,
  });

  @override
  List<Object?> get props => [
        id,
        drugId,
        drugName,
        batchNumber,
        qrCode,
        verifiedAt,
        status,
        message,
        isBlockchainVerified,
        blockchainTransactionHash,
        drugData,
      ];
}
