import 'package:json_annotation/json_annotation.dart';

import '../../domain/entities/supply_chain_entity.dart';
import '../../domain/entities/supply_chain_step_entity.dart';
import 'supply_chain_step_model.dart';

part 'supply_chain_model.g.dart';

@JsonSerializable(explicitToJson: true)
class SupplyChainModel extends SupplyChainEntity {
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  final List<SupplyChainStepEntity> steps;

  const SupplyChainModel({
    required super.id,
    required super.drugId,
    super.drugName,
    this.steps = const [],
    super.status,
    super.blockchainHash,
    super.createdBy,
    super.createdAt,
    super.updatedAt,
  });

  factory SupplyChainModel.fromJson(Map<String, dynamic> json) {
    // Convert steps from JSON
    final stepsJson = json['steps'] as List<dynamic>?;
    final steps = stepsJson != null
        ? stepsJson
            .map(
              (step) =>
                  SupplyChainStepModel.fromJson(step as Map<String, dynamic>),
            )
            .toList()
        : <SupplyChainStepEntity>[];

    return SupplyChainModel(
      id: json['_id'] as String? ?? json['id'] as String,
      drugId: json['drugId'] as String,
      drugName: json['drugId']?['name'] as String?,
      steps: steps,
      status: json['status'] as String? ?? 'pending',
      blockchainHash: json['blockchainHash'] as String?,
      createdBy: json['createdBy'] as String?,
      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'] as String)
          : null,
      updatedAt: json['updatedAt'] != null
          ? DateTime.parse(json['updatedAt'] as String)
          : null,
    );
  }

  Map<String, dynamic> toJson() {
    final json = _$SupplyChainModelToJson(this);
    json['steps'] = steps.map((step) {
      if (step is SupplyChainStepModel) {
        return step.toJson();
      }
      return SupplyChainStepModel.fromEntity(step).toJson();
    }).toList();
    return json;
  }

  factory SupplyChainModel.fromEntity(SupplyChainEntity entity) {
    return SupplyChainModel(
      id: entity.id,
      drugId: entity.drugId,
      drugName: entity.drugName,
      steps: entity.steps,
      status: entity.status,
      blockchainHash: entity.blockchainHash,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }
}
