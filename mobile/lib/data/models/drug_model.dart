import 'package:json_annotation/json_annotation.dart';

import '../../domain/entities/drug_entity.dart';

part 'drug_model.g.dart';

@JsonSerializable()
class DrugModel extends DrugEntity {
  const DrugModel({
    required super.id,
    required super.name,
    super.description,
    super.manufacturer,
    super.batchNumber,
    super.drugId,
    super.manufactureDate,
    super.expiryDate,
    super.qrCode,
    super.image,
    super.metadata,
    super.createdBy,
    super.createdAt,
    super.updatedAt,
  });

  factory DrugModel.fromJson(Map<String, dynamic> json) =>
      _$DrugModelFromJson(json);

  Map<String, dynamic> toJson() => _$DrugModelToJson(this);

  factory DrugModel.fromEntity(DrugEntity entity) {
    return DrugModel(
      id: entity.id,
      name: entity.name,
      description: entity.description,
      manufacturer: entity.manufacturer,
      batchNumber: entity.batchNumber,
      drugId: entity.drugId,
      manufactureDate: entity.manufactureDate,
      expiryDate: entity.expiryDate,
      qrCode: entity.qrCode,
      image: entity.image,
      metadata: entity.metadata,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }
}
