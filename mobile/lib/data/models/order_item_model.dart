import 'package:json_annotation/json_annotation.dart';

import '../../domain/entities/order_item_entity.dart';

part 'order_item_model.g.dart';

@JsonSerializable()
class OrderItemModel extends OrderItemEntity {
  const OrderItemModel({
    required super.id,
    required super.orderId,
    required super.drugId,
    super.drugName,
    required super.quantity,
    super.unitPrice,
    super.totalPrice,
  });

  factory OrderItemModel.fromJson(Map<String, dynamic> json) =>
      _$OrderItemModelFromJson(json);

  Map<String, dynamic> toJson() => _$OrderItemModelToJson(this);

  factory OrderItemModel.fromEntity(OrderItemEntity entity) {
    return OrderItemModel(
      id: entity.id,
      orderId: entity.orderId,
      drugId: entity.drugId,
      drugName: entity.drugName,
      quantity: entity.quantity,
      unitPrice: entity.unitPrice,
      totalPrice: entity.totalPrice,
    );
  }
}
