import 'package:dartz/dartz.dart';

import '../../core/errors/failures.dart';
import '../entities/task_entity.dart';

abstract class TaskRepository {
  Future<Either<Failure, List<TaskEntity>>> getTasks({
    int page = 1,
    int limit = 10,
    String? status,
    String? priority,
    String? type,
    String? search,
  });

  Future<Either<Failure, TaskEntity>> getTaskById(String taskId);

  Future<Either<Failure, TaskEntity>> createTask(Map<String, dynamic> taskData);

  Future<Either<Failure, TaskEntity>> updateTask(
    String taskId,
    Map<String, dynamic> updateData,
  );

  Future<Either<Failure, TaskEntity>> addTaskUpdate(
    String taskId,
    Map<String, dynamic> updateData,
  );

  Future<Either<Failure, TaskEntity>> rateTask(
    String taskId,
    int rating,
    String? comment,
  );

  Future<Either<Failure, Map<String, dynamic>>> getTaskStats();
}
