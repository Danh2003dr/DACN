import 'package:equatable/equatable.dart';

class SupplyChainStepEntity extends Equatable {
  final String id;
  final String supplyChainId;
  final String type; // 'manufacturing', 'transportation', 'storage', 'delivery'
  final String? location;
  final String? description;
  final String? performedBy;
  final DateTime? timestamp;
  final Map<String, dynamic>? metadata;
  final bool isVerified;
  final DateTime? createdAt;

  const SupplyChainStepEntity({
    required this.id,
    required this.supplyChainId,
    required this.type,
    this.location,
    this.description,
    this.performedBy,
    this.timestamp,
    this.metadata,
    this.isVerified = false,
    this.createdAt,
  });

  @override
  List<Object?> get props => [
    id,
    supplyChainId,
    type,
    location,
    description,
    performedBy,
    timestamp,
    metadata,
    isVerified,
    createdAt,
  ];
}
