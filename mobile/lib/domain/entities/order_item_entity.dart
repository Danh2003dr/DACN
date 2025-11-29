import 'package:equatable/equatable.dart';

class OrderItemEntity extends Equatable {
  final String id;
  final String orderId;
  final String drugId;
  final String? drugName;
  final int quantity;
  final double? unitPrice;
  final double? totalPrice;

  const OrderItemEntity({
    required this.id,
    required this.orderId,
    required this.drugId,
    this.drugName,
    required this.quantity,
    this.unitPrice,
    this.totalPrice,
  });

  @override
  List<Object?> get props => [
    id,
    orderId,
    drugId,
    drugName,
    quantity,
    unitPrice,
    totalPrice,
  ];
}
