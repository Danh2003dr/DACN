import 'package:equatable/equatable.dart';

class DrugEntity extends Equatable {
  final String id;
  final String name;
  final String? description;
  final String? manufacturer;
  final String? batchNumber;
  final String? drugId;
  final DateTime? manufactureDate;
  final DateTime? expiryDate;
  final String? qrCode;
  final String? image;
  final Map<String, dynamic>? metadata;
  final String? createdBy;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const DrugEntity({
    required this.id,
    required this.name,
    this.description,
    this.manufacturer,
    this.batchNumber,
    this.drugId,
    this.manufactureDate,
    this.expiryDate,
    this.qrCode,
    this.image,
    this.metadata,
    this.createdBy,
    this.createdAt,
    this.updatedAt,
  });

  @override
  List<Object?> get props => [
    id,
    name,
    description,
    manufacturer,
    batchNumber,
    drugId,
    manufactureDate,
    expiryDate,
    qrCode,
    image,
    metadata,
    createdBy,
    createdAt,
    updatedAt,
  ];
}
