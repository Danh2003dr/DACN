// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'supply_chain_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SupplyChainModel _$SupplyChainModelFromJson(Map<String, dynamic> json) =>
    SupplyChainModel(
      id: json['id'] as String,
      drugId: json['drugId'] as String,
      drugName: json['drugName'] as String?,
      status: json['status'] as String? ?? 'pending',
      blockchainHash: json['blockchainHash'] as String?,
      createdBy: json['createdBy'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$SupplyChainModelToJson(SupplyChainModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'drugId': instance.drugId,
      'drugName': instance.drugName,
      'status': instance.status,
      'blockchainHash': instance.blockchainHash,
      'createdBy': instance.createdBy,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };
