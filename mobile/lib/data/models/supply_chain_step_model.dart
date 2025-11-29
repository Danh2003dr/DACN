import 'package:json_annotation/json_annotation.dart';

import '../../domain/entities/supply_chain_step_entity.dart';

part 'supply_chain_step_model.g.dart';

@JsonSerializable()
class SupplyChainStepModel extends SupplyChainStepEntity {
  const SupplyChainStepModel({
    required super.id,
    required super.supplyChainId,
    required super.type,
    super.location,
    super.description,
    super.performedBy,
    super.timestamp,
    super.metadata,
    super.isVerified,
    super.createdAt,
  });

  factory SupplyChainStepModel.fromJson(Map<String, dynamic> json) =>
      _$SupplyChainStepModelFromJson(json);

  Map<String, dynamic> toJson() => _$SupplyChainStepModelToJson(this);

  factory SupplyChainStepModel.fromEntity(SupplyChainStepEntity entity) {
    return SupplyChainStepModel(
      id: entity.id,
      supplyChainId: entity.supplyChainId,
      type: entity.type,
      location: entity.location,
      description: entity.description,
      performedBy: entity.performedBy,
      timestamp: entity.timestamp,
      metadata: entity.metadata,
      isVerified: entity.isVerified,
      createdAt: entity.createdAt,
    );
  }
}
