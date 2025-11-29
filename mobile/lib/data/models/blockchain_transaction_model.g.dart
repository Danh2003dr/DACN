// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'blockchain_transaction_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

BlockchainTransactionModel _$BlockchainTransactionModelFromJson(
        Map<String, dynamic> json) =>
    BlockchainTransactionModel(
      id: json['id'] as String,
      transactionHash: json['transactionHash'] as String,
      blockNumber: (json['blockNumber'] as num?)?.toInt(),
      drugId: json['drugId'] as String?,
      drugName: json['drugName'] as String?,
      from: json['from'] as String?,
      to: json['to'] as String?,
      gasUsed: (json['gasUsed'] as num?)?.toInt(),
      gasPrice: json['gasPrice'] as String?,
      timestamp: json['timestamp'] == null
          ? null
          : DateTime.parse(json['timestamp'] as String),
      status: json['status'] as String? ?? 'pending',
      network: json['network'] as String? ?? 'ethereum',
      contractAddress: json['contractAddress'] as String?,
      value: json['value'] as String?,
      transactionType: json['transactionType'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      confirmations: (json['confirmations'] as num?)?.toInt(),
    );

Map<String, dynamic> _$BlockchainTransactionModelToJson(
        BlockchainTransactionModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'transactionHash': instance.transactionHash,
      'blockNumber': instance.blockNumber,
      'drugId': instance.drugId,
      'drugName': instance.drugName,
      'from': instance.from,
      'to': instance.to,
      'gasUsed': instance.gasUsed,
      'gasPrice': instance.gasPrice,
      'timestamp': instance.timestamp?.toIso8601String(),
      'status': instance.status,
      'network': instance.network,
      'contractAddress': instance.contractAddress,
      'value': instance.value,
      'transactionType': instance.transactionType,
      'metadata': instance.metadata,
      'confirmations': instance.confirmations,
    };
