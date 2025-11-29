import 'package:equatable/equatable.dart';

import 'supply_chain_step_entity.dart';

class SupplyChainEntity extends Equatable {
  final String id;
  final String drugId;
  final String? drugName;
  final List<SupplyChainStepEntity> steps;
  final String status;
  final String? blockchainHash;
  final String? createdBy;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const SupplyChainEntity({
    required this.id,
    required this.drugId,
    this.drugName,
    this.steps = const [],
    this.status = 'pending',
    this.blockchainHash,
    this.createdBy,
    this.createdAt,
    this.updatedAt,
  });

  @override
  List<Object?> get props => [
    id,
    drugId,
    drugName,
    steps,
    status,
    blockchainHash,
    createdBy,
    createdAt,
    updatedAt,
  ];
}
