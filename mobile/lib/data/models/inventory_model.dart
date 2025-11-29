import 'package:json_annotation/json_annotation.dart';

import '../../domain/entities/inventory_entity.dart';

part 'inventory_model.g.dart';

@JsonSerializable()
class InventoryModel extends InventoryEntity {
  const InventoryModel({
    required super.id,
    required super.drugId,
    super.drugName,
    required super.location,
    required super.quantity,
    super.reservedQuantity,
    super.unit,
    super.lastUpdated,
    super.updatedBy,
    super.createdAt,
  });

  factory InventoryModel.fromJson(Map<String, dynamic> json) =>
      _$InventoryModelFromJson(json);

  Map<String, dynamic> toJson() => _$InventoryModelToJson(this);

  factory InventoryModel.fromEntity(InventoryEntity entity) {
    return InventoryModel(
      id: entity.id,
      drugId: entity.drugId,
      drugName: entity.drugName,
      location: entity.location,
      quantity: entity.quantity,
      reservedQuantity: entity.reservedQuantity,
      unit: entity.unit,
      lastUpdated: entity.lastUpdated,
      updatedBy: entity.updatedBy,
      createdAt: entity.createdAt,
    );
  }
}
