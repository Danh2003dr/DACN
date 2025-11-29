import 'package:json_annotation/json_annotation.dart';

import '../../domain/entities/order_entity.dart';
import '../../domain/entities/order_item_entity.dart';
import 'order_item_model.dart';

part 'order_model.g.dart';

@JsonSerializable(explicitToJson: true)
class OrderModel extends OrderEntity {
  @JsonKey(includeFromJson: false, includeToJson: false)
  @override
  final List<OrderItemEntity> items;

  const OrderModel({
    required super.id,
    required super.orderNumber,
    super.status,
    super.supplierId,
    super.supplierName,
    this.items = const [],
    super.totalAmount,
    super.orderDate,
    super.expectedDeliveryDate,
    super.notes,
    super.createdBy,
    super.createdAt,
    super.updatedAt,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    // Convert items from JSON
    final itemsJson = json['items'] as List<dynamic>?;
    final items = itemsJson != null
        ? itemsJson
            .map(
              (item) => OrderItemModel.fromJson(item as Map<String, dynamic>),
            )
            .toList()
        : <OrderItemEntity>[];

    return OrderModel(
      id: json['_id'] as String? ?? json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      status: json['status'] as String? ?? 'pending',
      supplierId: json['supplierId'] as String?,
      supplierName: json['supplierId']?['name'] as String?,
      items: items,
      totalAmount: (json['totalAmount'] as num?)?.toDouble(),
      orderDate: json['orderDate'] != null
          ? DateTime.parse(json['orderDate'] as String)
          : null,
      expectedDeliveryDate: json['expectedDeliveryDate'] != null
          ? DateTime.parse(json['expectedDeliveryDate'] as String)
          : null,
      notes: json['notes'] as String?,
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
    final json = _$OrderModelToJson(this);
    json['items'] = items.map((item) {
      if (item is OrderItemModel) {
        return item.toJson();
      }
      return OrderItemModel.fromEntity(item).toJson();
    }).toList();
    return json;
  }

  factory OrderModel.fromEntity(OrderEntity entity) {
    return OrderModel(
      id: entity.id,
      orderNumber: entity.orderNumber,
      status: entity.status,
      supplierId: entity.supplierId,
      supplierName: entity.supplierName,
      items: entity.items,
      totalAmount: entity.totalAmount,
      orderDate: entity.orderDate,
      expectedDeliveryDate: entity.expectedDeliveryDate,
      notes: entity.notes,
      createdBy: entity.createdBy,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    );
  }
}
