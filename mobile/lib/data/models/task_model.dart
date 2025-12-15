import 'package:json_annotation/json_annotation.dart';

import '../../domain/entities/task_entity.dart';

part 'task_model.g.dart'; // Chỉ cho TaskUpdateModel

@JsonSerializable()
class TaskUpdateModel extends TaskUpdateEntity {
  const TaskUpdateModel({
    super.id,
    required super.status,
    required super.progress,
    required super.updateText,
    super.updatedById,
    super.updatedByName,
    required super.updatedAt,
    super.isPublic,
  });

  factory TaskUpdateModel.fromJson(Map<String, dynamic> json) {
    // Handle updatedAt có thể là String hoặc Date/timestamp
    DateTime updatedAt;
    if (json['updatedAt'] is String) {
      updatedAt = DateTime.parse(json['updatedAt'] as String);
    } else if (json['updatedAt'] is num) {
      updatedAt = DateTime.fromMillisecondsSinceEpoch(
          (json['updatedAt'] as num).toInt());
    } else {
      updatedAt = DateTime.now();
    }

    return TaskUpdateModel(
      id: json['id'] as String? ?? json['_id']?.toString(),
      status: json['status'] as String,
      progress: (json['progress'] as num).toInt(),
      updateText: json['updateText'] as String,
      updatedById: json['updatedById'] as String?,
      updatedByName: json['updatedByName'] as String?,
      updatedAt: updatedAt,
      isPublic: json['isPublic'] as bool? ?? true,
    );
  }

  Map<String, dynamic> toJson() => _$TaskUpdateModelToJson(this);

  factory TaskUpdateModel.fromEntity(TaskUpdateEntity entity) {
    return TaskUpdateModel(
      id: entity.id,
      status: entity.status,
      progress: entity.progress,
      updateText: entity.updateText,
      updatedById: entity.updatedById,
      updatedByName: entity.updatedByName,
      updatedAt: entity.updatedAt,
      isPublic: entity.isPublic,
    );
  }
}

// Note: TaskModel không dùng @JsonSerializable vì có custom fromJson
// và field updates cần override từ TaskEntity
class TaskModel extends TaskEntity {
  @override
  final List<TaskUpdateModel> updates;

  const TaskModel({
    required super.id,
    required super.title,
    required super.description,
    required super.type,
    required super.priority,
    required super.status,
    required super.progress,
    required super.startDate,
    required super.dueDate,
    super.completedAt,
    required super.assignedToId,
    super.assignedToName,
    required super.assignedById,
    super.assignedByName,
    super.relatedSupplyChainId,
    super.relatedDrugId,
    super.batchNumber,
    this.updates = const [],
    super.tags = const [],
    super.category = 'other',
    required super.createdAt,
    required super.updatedAt,
    super.isArchived = false,
  }) : super(updates: updates);

  factory TaskModel.fromJson(Map<String, dynamic> json) {
    // Handle nested updates
    final updatesJson = json['updates'] as List<dynamic>? ?? [];
    final updates = updatesJson
        .map((update) =>
            TaskUpdateModel.fromJson(update as Map<String, dynamic>))
        .toList();

    // Handle assignedTo and assignedBy (can be object or string)
    String assignedToId;
    String? assignedToName;
    if (json['assignedTo'] is Map) {
      final assignedTo = json['assignedTo'] as Map<String, dynamic>;
      assignedToId =
          assignedTo['_id']?.toString() ?? assignedTo['id']?.toString() ?? '';
      assignedToName = assignedTo['fullName'] as String?;
    } else {
      assignedToId = json['assignedTo']?.toString() ?? '';
    }

    String assignedById;
    String? assignedByName;
    if (json['assignedBy'] is Map) {
      final assignedBy = json['assignedBy'] as Map<String, dynamic>;
      assignedById =
          assignedBy['_id']?.toString() ?? assignedBy['id']?.toString() ?? '';
      assignedByName = assignedBy['fullName'] as String?;
    } else {
      assignedById = json['assignedBy']?.toString() ?? '';
    }

    // Handle updates with populated updatedBy
    final processedUpdates = updates.map((update) {
      if (json['updates'] != null) {
        final updateIndex = updates.indexOf(update);
        if (updateIndex < (json['updates'] as List).length) {
          final originalUpdate = (json['updates'] as List)[updateIndex];
          if (originalUpdate is Map && originalUpdate['updatedBy'] is Map) {
            final updatedBy =
                originalUpdate['updatedBy'] as Map<String, dynamic>;
            return TaskUpdateModel(
              id: update.id,
              status: update.status,
              progress: update.progress,
              updateText: update.updateText,
              updatedById:
                  updatedBy['_id']?.toString() ?? updatedBy['id']?.toString(),
              updatedByName: updatedBy['fullName'] as String?,
              updatedAt: update.updatedAt,
              isPublic: update.isPublic,
            );
          }
        }
      }
      return update;
    }).toList();

    return TaskModel(
      id: json['_id']?.toString() ?? json['id']?.toString() ?? '',
      title: json['title'] as String,
      description: json['description'] as String,
      type: json['type'] as String? ?? 'other',
      priority: json['priority'] as String? ?? 'medium',
      status: json['status'] as String? ?? 'pending',
      progress: (json['progress'] as num?)?.toInt() ?? 0,
      startDate: json['startDate'] != null
          ? (json['startDate'] is String
              ? DateTime.parse(json['startDate'] as String)
              : DateTime.fromMillisecondsSinceEpoch(
                  (json['startDate'] as num).toInt()))
          : DateTime.now(),
      dueDate: json['dueDate'] != null
          ? (json['dueDate'] is String
              ? DateTime.parse(json['dueDate'] as String)
              : DateTime.fromMillisecondsSinceEpoch(
                  (json['dueDate'] as num).toInt()))
          : DateTime.now(),
      completedAt: json['completedAt'] != null
          ? (json['completedAt'] is String
              ? DateTime.parse(json['completedAt'] as String)
              : DateTime.fromMillisecondsSinceEpoch(
                  (json['completedAt'] as num).toInt()))
          : null,
      assignedToId: assignedToId,
      assignedToName: assignedToName,
      assignedById: assignedById,
      assignedByName: assignedByName,
      relatedSupplyChainId: json['relatedSupplyChain'] is Map
          ? (json['relatedSupplyChain'] as Map)['_id']?.toString()
          : json['relatedSupplyChain']?.toString(),
      relatedDrugId: json['relatedDrug'] is Map
          ? (json['relatedDrug'] as Map)['_id']?.toString()
          : json['relatedDrug']?.toString(),
      batchNumber: json['batchNumber'] as String?,
      updates: processedUpdates,
      tags:
          (json['tags'] as List<dynamic>?)?.map((e) => e.toString()).toList() ??
              [],
      category: json['category'] as String? ?? 'other',
      createdAt: json['createdAt'] != null
          ? (json['createdAt'] is String
              ? DateTime.parse(json['createdAt'] as String)
              : DateTime.fromMillisecondsSinceEpoch(
                  (json['createdAt'] as num).toInt()))
          : DateTime.now(),
      updatedAt: json['updatedAt'] != null
          ? (json['updatedAt'] is String
              ? DateTime.parse(json['updatedAt'] as String)
              : DateTime.fromMillisecondsSinceEpoch(
                  (json['updatedAt'] as num).toInt()))
          : DateTime.now(),
      isArchived: json['isArchived'] as bool? ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      '_id': id,
      'id': id,
      'title': title,
      'description': description,
      'type': type,
      'priority': priority,
      'status': status,
      'progress': progress,
      'startDate': startDate.toIso8601String(),
      'dueDate': dueDate.toIso8601String(),
      'completedAt': completedAt?.toIso8601String(),
      'assignedTo': assignedToId,
      'assignedBy': assignedById,
      'relatedSupplyChain': relatedSupplyChainId,
      'relatedDrug': relatedDrugId,
      'batchNumber': batchNumber,
      'updates': updates.map((e) => e.toJson()).toList(),
      'tags': tags,
      'category': category,
      'createdAt': createdAt.toIso8601String(),
      'updatedAt': updatedAt.toIso8601String(),
      'isArchived': isArchived,
    };
  }

  factory TaskModel.fromEntity(TaskEntity entity) {
    return TaskModel(
      id: entity.id,
      title: entity.title,
      description: entity.description,
      type: entity.type,
      priority: entity.priority,
      status: entity.status,
      progress: entity.progress,
      startDate: entity.startDate,
      dueDate: entity.dueDate,
      completedAt: entity.completedAt,
      assignedToId: entity.assignedToId,
      assignedToName: entity.assignedToName,
      assignedById: entity.assignedById,
      assignedByName: entity.assignedByName,
      relatedSupplyChainId: entity.relatedSupplyChainId,
      relatedDrugId: entity.relatedDrugId,
      batchNumber: entity.batchNumber,
      updates:
          entity.updates.map((e) => TaskUpdateModel.fromEntity(e)).toList(),
      tags: entity.tags,
      category: entity.category,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      isArchived: entity.isArchived,
    );
  }
}
