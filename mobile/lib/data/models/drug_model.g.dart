// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'drug_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

DrugModel _$DrugModelFromJson(Map<String, dynamic> json) => DrugModel(
      id: json['id'] as String,
      name: json['name'] as String,
      description: json['description'] as String?,
      manufacturer: json['manufacturer'] as String?,
      batchNumber: json['batchNumber'] as String?,
      drugId: json['drugId'] as String?,
      manufactureDate: json['manufactureDate'] == null
          ? null
          : DateTime.parse(json['manufactureDate'] as String),
      expiryDate: json['expiryDate'] == null
          ? null
          : DateTime.parse(json['expiryDate'] as String),
      qrCode: json['qrCode'] as String?,
      image: json['image'] as String?,
      metadata: json['metadata'] as Map<String, dynamic>?,
      createdBy: json['createdBy'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$DrugModelToJson(DrugModel instance) => <String, dynamic>{
      'id': instance.id,
      'name': instance.name,
      'description': instance.description,
      'manufacturer': instance.manufacturer,
      'batchNumber': instance.batchNumber,
      'drugId': instance.drugId,
      'manufactureDate': instance.manufactureDate?.toIso8601String(),
      'expiryDate': instance.expiryDate?.toIso8601String(),
      'qrCode': instance.qrCode,
      'image': instance.image,
      'metadata': instance.metadata,
      'createdBy': instance.createdBy,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };
