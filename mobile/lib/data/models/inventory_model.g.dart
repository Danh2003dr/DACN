// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'inventory_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

InventoryModel _$InventoryModelFromJson(Map<String, dynamic> json) =>
    InventoryModel(
      id: json['id'] as String,
      drugId: json['drugId'] as String,
      drugName: json['drugName'] as String?,
      location: json['location'] as String,
      quantity: (json['quantity'] as num).toInt(),
      reservedQuantity: (json['reservedQuantity'] as num?)?.toInt(),
      unit: json['unit'] as String?,
      lastUpdated: json['lastUpdated'] == null
          ? null
          : DateTime.parse(json['lastUpdated'] as String),
      updatedBy: json['updatedBy'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
    );

Map<String, dynamic> _$InventoryModelToJson(InventoryModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'drugId': instance.drugId,
      'drugName': instance.drugName,
      'location': instance.location,
      'quantity': instance.quantity,
      'reservedQuantity': instance.reservedQuantity,
      'unit': instance.unit,
      'lastUpdated': instance.lastUpdated?.toIso8601String(),
      'updatedBy': instance.updatedBy,
      'createdAt': instance.createdAt?.toIso8601String(),
    };
