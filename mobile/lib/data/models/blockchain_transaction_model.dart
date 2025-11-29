import 'package:json_annotation/json_annotation.dart';

import '../../domain/entities/blockchain_transaction_entity.dart';

part 'blockchain_transaction_model.g.dart';

@JsonSerializable()
class BlockchainTransactionModel extends BlockchainTransactionEntity {
  const BlockchainTransactionModel({
    required super.id,
    required super.transactionHash,
    super.blockNumber,
    super.drugId,
    super.drugName,
    super.from,
    super.to,
    super.gasUsed,
    super.gasPrice,
    super.timestamp,
    super.status,
    super.network,
    super.contractAddress,
    super.value,
    super.transactionType,
    super.metadata,
    super.confirmations,
  });

  factory BlockchainTransactionModel.fromJson(Map<String, dynamic> json) {
    return BlockchainTransactionModel(
      id: json['_id'] as String? ?? json['id'] as String,
      transactionHash: json['transactionHash'] as String,
      blockNumber: json['blockNumber'] as int?,
      drugId: json['drugId']?['_id'] as String? ?? json['drugId'] as String?,
      drugName: json['drugId']?['name'] as String?,
      from: json['from'] as String?,
      to: json['to'] as String?,
      gasUsed: json['gasUsed'] as int?,
      gasPrice: json['gasPrice'] as String?,
      timestamp: json['timestamp'] != null
          ? DateTime.parse(json['timestamp'] as String)
          : null,
      status: json['status'] as String? ?? 'pending',
      network: json['network'] as String? ?? 'ethereum',
      contractAddress: json['contractAddress'] as String?,
      value: json['value'] as String?,
      transactionType: json['transactionType'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      confirmations: json['confirmations'] as int?,
    );
  }

  Map<String, dynamic> toJson() => _$BlockchainTransactionModelToJson(this);

  factory BlockchainTransactionModel.fromEntity(
    BlockchainTransactionEntity entity,
  ) {
    return BlockchainTransactionModel(
      id: entity.id,
      transactionHash: entity.transactionHash,
      blockNumber: entity.blockNumber,
      drugId: entity.drugId,
      drugName: entity.drugName,
      from: entity.from,
      to: entity.to,
      gasUsed: entity.gasUsed,
      gasPrice: entity.gasPrice,
      timestamp: entity.timestamp,
      status: entity.status,
      network: entity.network,
      contractAddress: entity.contractAddress,
      value: entity.value,
      transactionType: entity.transactionType,
      metadata: entity.metadata,
      confirmations: entity.confirmations,
    );
  }
}
