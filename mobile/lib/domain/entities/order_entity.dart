import 'package:equatable/equatable.dart';

import 'order_item_entity.dart';

class OrderEntity extends Equatable {
  final String id;
  final String orderNumber;
  final String status; // 'pending', 'processing', 'completed', 'cancelled'
  final String? supplierId;
  final String? supplierName;
  final List<OrderItemEntity> items;
  final double? totalAmount;
  final DateTime? orderDate;
  final DateTime? expectedDeliveryDate;
  final String? notes;
  final String? createdBy;
  final DateTime? createdAt;
  final DateTime? updatedAt;

  const OrderEntity({
    required this.id,
    required this.orderNumber,
    this.status = 'pending',
    this.supplierId,
    this.supplierName,
    this.items = const [],
    this.totalAmount,
    this.orderDate,
    this.expectedDeliveryDate,
    this.notes,
    this.createdBy,
    this.createdAt,
    this.updatedAt,
  });

  @override
  List<Object?> get props => [
    id,
    orderNumber,
    status,
    supplierId,
    supplierName,
    items,
    totalAmount,
    orderDate,
    expectedDeliveryDate,
    notes,
    createdBy,
    createdAt,
    updatedAt,
  ];
}
