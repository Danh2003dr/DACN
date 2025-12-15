// GENERATED CODE - DO NOT MODIFY BY HAND

part of 'task_model.dart';

// **************************************************************************
// JsonSerializableGenerator
// **************************************************************************

TaskUpdateModel _$TaskUpdateModelFromJson(Map<String, dynamic> json) =>
    TaskUpdateModel(
      id: json['id'] as String?,
      status: json['status'] as String,
      progress: (json['progress'] as num).toInt(),
      updateText: json['updateText'] as String,
      updatedById: json['updatedById'] as String?,
      updatedByName: json['updatedByName'] as String?,
      updatedAt: DateTime.parse(json['updatedAt'] as String),
      isPublic: json['isPublic'] as bool? ?? true,
    );

Map<String, dynamic> _$TaskUpdateModelToJson(TaskUpdateModel instance) =>
    <String, dynamic>{
      'id': instance.id,
      'status': instance.status,
      'progress': instance.progress,
      'updateText': instance.updateText,
      'updatedById': instance.updatedById,
      'updatedByName': instance.updatedByName,
      'updatedAt': instance.updatedAt.toIso8601String(),
      'isPublic': instance.isPublic,
    };
