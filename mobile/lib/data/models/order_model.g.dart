// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'order_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

OrderModel _$OrderModelFromJson(Map<String, dynamic> json) => OrderModel(
      id: json['id'] as String,
      orderNumber: json['orderNumber'] as String,
      status: json['status'] as String? ?? 'pending',
      supplierId: json['supplierId'] as String?,
      supplierName: json['supplierName'] as String?,
      totalAmount: (json['totalAmount'] as num?)?.toDouble(),
      orderDate: json['orderDate'] == null
          ? null
          : DateTime.parse(json['orderDate'] as String),
      expectedDeliveryDate: json['expectedDeliveryDate'] == null
          ? null
          : DateTime.parse(json['expectedDeliveryDate'] as String),
      notes: json['notes'] as String?,
      createdBy: json['createdBy'] as String?,
      createdAt: json['createdAt'] == null
          ? null
          : DateTime.parse(json['createdAt'] as String),
      updatedAt: json['updatedAt'] == null
          ? null
          : DateTime.parse(json['updatedAt'] as String),
    );

Map<String, dynamic> _$OrderModelToJson(OrderModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'orderNumber': instance.orderNumber,
      'status': instance.status,
      'supplierId': instance.supplierId,
      'supplierName': instance.supplierName,
      'totalAmount': instance.totalAmount,
      'orderDate': instance.orderDate?.toIso8601String(),
      'expectedDeliveryDate': instance.expectedDeliveryDate?.toIso8601String(),
      'notes': instance.notes,
      'createdBy': instance.createdBy,
      'createdAt': instance.createdAt?.toIso8601String(),
      'updatedAt': instance.updatedAt?.toIso8601String(),
    };
