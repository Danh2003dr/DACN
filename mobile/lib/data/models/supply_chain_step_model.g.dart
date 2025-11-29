// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'supply_chain_step_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

SupplyChainStepModel _$SupplyChainStepModelFromJson(
        Map<String, dynamic> json) =>
    SupplyChainStepModel(
      id: json['id'] as String,
      supplyChainId: json['supplyChainId'] as String,
      type: json['type'] as String,
      location: json['location'] as String?,
      description: json['description'] as String?,
      performedBy: json['performedBy'] as String?,
      timestamp: json['timestamp'] == null
          ? null
          : DateTime.parse(json['timestamp'] as String),
      metadata: json['metadata'] as Map<String, dynamic>?,
      isVerified: json['isVerified'] as bool? ?? false,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$SupplyChainStepModelToJson(
        SupplyChainStepModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'supplyChainId': instance.supplyChainId,
      'type': instance.type,
      'location': instance.location,
      'description': instance.description,
      'performedBy': instance.performedBy,
      'timestamp': instance.timestamp?.toIso8601String(),
      'metadata': instance.metadata,
      'isVerified': instance.isVerified,
      'createdAt': instance.createdAt?.toIso8601String(),
    };
