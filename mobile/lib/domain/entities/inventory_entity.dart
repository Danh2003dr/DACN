import 'package:equatable/equatable.dart';

class InventoryEntity extends Equatable {
  final String id;
  final String drugId;
  final String? drugName;
  final String location;
  final int quantity;
  final int? reservedQuantity;
  final String? unit;
  final DateTime? lastUpdated;
  final String? updatedBy;
  final DateTime? createdAt;

  const InventoryEntity({
    required this.id,
    required this.drugId,
    this.drugName,
    required this.location,
    required this.quantity,
    this.reservedQuantity,
    this.unit,
    this.lastUpdated,
    this.updatedBy,
    this.createdAt,
  });

  int get availableQuantity => quantity - (reservedQuantity ?? 0);

  @override
  List<Object?> get props => [
    id,
    drugId,
    drugName,
    location,
    quantity,
    reservedQuantity,
    unit,
    lastUpdated,
    updatedBy,
    createdAt,
  ];
}
