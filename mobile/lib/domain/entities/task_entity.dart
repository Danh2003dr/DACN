import 'package:equatable/equatable.dart';

class TaskUpdateEntity extends Equatable {
  final String? id;
  final String status;
  final int progress;
  final String updateText;
  final String? updatedById;
  final String? updatedByName;
  final DateTime updatedAt;
  final bool isPublic;

  const TaskUpdateEntity({
    this.id,
    required this.status,
    required this.progress,
    required this.updateText,
    this.updatedById,
    this.updatedByName,
    required this.updatedAt,
    this.isPublic = true,
  });

  @override
  List<Object?> get props => [
        id,
        status,
        progress,
        updateText,
        updatedById,
        updatedByName,
        updatedAt,
        isPublic,
      ];
}

class TaskEntity extends Equatable {
  final String id;
  final String title;
  final String description;
  final String type;
  final String priority;
  final String status;
  final int progress;
  final DateTime startDate;
  final DateTime dueDate;
  final DateTime? completedAt;
  final String assignedToId;
  final String? assignedToName;
  final String assignedById;
  final String? assignedByName;
  final String? relatedSupplyChainId;
  final String? relatedDrugId;
  final String? batchNumber;
  final List<TaskUpdateEntity> updates;
  final List<String> tags;
  final String category;
  final DateTime createdAt;
  final DateTime updatedAt;
  final bool isArchived;

  const TaskEntity({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.priority,
    required this.status,
    required this.progress,
    required this.startDate,
    required this.dueDate,
    this.completedAt,
    required this.assignedToId,
    this.assignedToName,
    required this.assignedById,
    this.assignedByName,
    this.relatedSupplyChainId,
    this.relatedDrugId,
    this.batchNumber,
    this.updates = const [],
    this.tags = const [],
    this.category = 'other',
    required this.createdAt,
    required this.updatedAt,
    this.isArchived = false,
  });

  bool get isOverdue {
    return dueDate.isBefore(DateTime.now()) && status != 'completed';
  }

  int get daysUntilDue {
    final now = DateTime.now();
    final diff = dueDate.difference(now);
    return diff.inDays;
  }

  @override
  List<Object?> get props => [
        id,
        title,
        description,
        type,
        priority,
        status,
        progress,
        startDate,
        dueDate,
        completedAt,
        assignedToId,
        assignedToName,
        assignedById,
        assignedByName,
        relatedSupplyChainId,
        relatedDrugId,
        batchNumber,
        updates,
        tags,
        category,
        createdAt,
        updatedAt,
        isArchived,
      ];
}
