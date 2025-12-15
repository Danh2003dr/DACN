import 'package:dartz/dartz.dart';
import 'package:dio/dio.dart';

import '../../core/api/dio_client.dart';
import '../../core/api/api_endpoints.dart';
import '../../core/errors/failures.dart';
import '../../domain/entities/task_entity.dart';
import '../../domain/repositories_interfaces/task_repository.dart';
import '../models/task_model.dart';

class TaskRepositoryImpl implements TaskRepository {
  final DioClient dioClient;

  TaskRepositoryImpl(this.dioClient);

  @override
  Future<Either<Failure, List<TaskEntity>>> getTasks({
    int page = 1,
    int limit = 10,
    String? status,
    String? priority,
    String? type,
    String? search,
  }) async {
    try {
      final queryParams = <String, dynamic>{
        'page': page,
        'limit': limit,
      };

      if (status != null && status.isNotEmpty) {
        queryParams['status'] = status;
      }
      if (priority != null && priority.isNotEmpty) {
        queryParams['priority'] = priority;
      }
      if (type != null && type.isNotEmpty) {
        queryParams['type'] = type;
      }
      if (search != null && search.isNotEmpty) {
        queryParams['search'] = search;
      }

      final response = await dioClient.get(
        ApiEndpoints.tasks,
        queryParameters: queryParams,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        try {
          // Debug: Log response structure
          print('🔍 [Tasks] Response data structure:');
          print('🔍 [Tasks] response.data keys: ${response.data.keys}');
          print(
              '🔍 [Tasks] response.data[data] type: ${response.data['data']?.runtimeType}');

          // Kiểm tra nhiều cách truy cập data
          dynamic tasksData;
          if (response.data['data'] is Map) {
            tasksData = response.data['data']['tasks'];
          } else if (response.data['data'] is List) {
            tasksData = response.data['data'];
          } else {
            tasksData = response.data['tasks'];
          }

          tasksData = tasksData as List<dynamic>? ?? [];
          print('🔍 [Tasks] Found ${tasksData.length} tasks in response');

          final tasks = <TaskModel>[];

          for (var i = 0; i < tasksData.length; i++) {
            try {
              final taskJson = tasksData[i] as Map<String, dynamic>;
              print(
                  '🔍 [Tasks] Parsing task $i: ${taskJson['title'] ?? taskJson['_id'] ?? 'N/A'}');
              final task = TaskModel.fromJson(taskJson);
              tasks.add(task);
              print('✅ [Tasks] Successfully parsed task $i');
            } catch (e, stackTrace) {
              print('⚠️ Error parsing task $i: $e');
              print('⚠️ Task JSON: ${tasksData[i]}');
              print('⚠️ Stack trace: $stackTrace');
              // Continue với task tiếp theo thay vì fail toàn bộ
            }
          }

          print(
              '✅ [Tasks] Successfully parsed ${tasks.length}/${tasksData.length} tasks');
          return Right(tasks);
        } catch (e, stackTrace) {
          print('❌ Error parsing tasks list: $e');
          print('❌ Stack trace: $stackTrace');
          print('❌ Response data: ${response.data}');
          print('❌ Response data type: ${response.data.runtimeType}');
          return Left(ServerFailure('Lỗi khi parse dữ liệu nhiệm vụ: $e'));
        }
      } else {
        return Left(ServerFailure(
          response.data['message'] ?? 'Lỗi khi lấy danh sách nhiệm vụ',
        ));
      }
    } on DioException catch (e) {
      if (e.response != null) {
        return Left(ServerFailure(
          e.response?.data['message'] ?? 'Lỗi server',
        ));
      } else {
        return Left(NetworkFailure('Lỗi kết nối mạng'));
      }
    } catch (e) {
      return Left(ServerFailure('Lỗi không xác định: $e'));
    }
  }

  @override
  Future<Either<Failure, TaskEntity>> getTaskById(String taskId) async {
    try {
      final response = await dioClient.get(ApiEndpoints.taskById(taskId));

      if (response.statusCode == 200 && response.data['success'] == true) {
        final taskData = response.data['data']['task'] as Map<String, dynamic>;
        final task = TaskModel.fromJson(taskData);

        return Right(task);
      } else {
        return Left(ServerFailure(
          response.data['message'] ?? 'Lỗi khi lấy thông tin nhiệm vụ',
        ));
      }
    } on DioException catch (e) {
      if (e.response != null) {
        return Left(ServerFailure(
          e.response?.data['message'] ?? 'Lỗi server',
        ));
      } else {
        return Left(NetworkFailure('Lỗi kết nối mạng'));
      }
    } catch (e) {
      return Left(ServerFailure('Lỗi không xác định: $e'));
    }
  }

  @override
  Future<Either<Failure, TaskEntity>> createTask(
    Map<String, dynamic> taskData,
  ) async {
    try {
      final response = await dioClient.post(
        ApiEndpoints.tasks,
        data: taskData,
      );

      if (response.statusCode == 201 && response.data['success'] == true) {
        final taskData = response.data['data']['task'] as Map<String, dynamic>;
        final task = TaskModel.fromJson(taskData);

        return Right(task);
      } else {
        return Left(ServerFailure(
          response.data['message'] ?? 'Lỗi khi tạo nhiệm vụ',
        ));
      }
    } on DioException catch (e) {
      if (e.response != null) {
        return Left(ServerFailure(
          e.response?.data['message'] ?? 'Lỗi server',
        ));
      } else {
        return Left(NetworkFailure('Lỗi kết nối mạng'));
      }
    } catch (e) {
      return Left(ServerFailure('Lỗi không xác định: $e'));
    }
  }

  @override
  Future<Either<Failure, TaskEntity>> updateTask(
    String taskId,
    Map<String, dynamic> updateData,
  ) async {
    try {
      final response = await dioClient.put(
        ApiEndpoints.taskById(taskId),
        data: updateData,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final taskData = response.data['data']['task'] as Map<String, dynamic>;
        final task = TaskModel.fromJson(taskData);

        return Right(task);
      } else {
        return Left(ServerFailure(
          response.data['message'] ?? 'Lỗi khi cập nhật nhiệm vụ',
        ));
      }
    } on DioException catch (e) {
      if (e.response != null) {
        return Left(ServerFailure(
          e.response?.data['message'] ?? 'Lỗi server',
        ));
      } else {
        return Left(NetworkFailure('Lỗi kết nối mạng'));
      }
    } catch (e) {
      return Left(ServerFailure('Lỗi không xác định: $e'));
    }
  }

  @override
  Future<Either<Failure, TaskEntity>> addTaskUpdate(
    String taskId,
    Map<String, dynamic> updateData,
  ) async {
    try {
      final response = await dioClient.post(
        ApiEndpoints.taskUpdates(taskId),
        data: updateData,
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final taskData = response.data['data']['task'] as Map<String, dynamic>;
        final task = TaskModel.fromJson(taskData);

        return Right(task);
      } else {
        return Left(ServerFailure(
          response.data['message'] ?? 'Lỗi khi thêm cập nhật',
        ));
      }
    } on DioException catch (e) {
      if (e.response != null) {
        return Left(ServerFailure(
          e.response?.data['message'] ?? 'Lỗi server',
        ));
      } else {
        return Left(NetworkFailure('Lỗi kết nối mạng'));
      }
    } catch (e) {
      return Left(ServerFailure('Lỗi không xác định: $e'));
    }
  }

  @override
  Future<Either<Failure, TaskEntity>> rateTask(
    String taskId,
    int rating,
    String? comment,
  ) async {
    try {
      final response = await dioClient.post(
        ApiEndpoints.taskRate(taskId),
        data: {
          'rating': rating,
          'comment': comment ?? '',
        },
      );

      if (response.statusCode == 200 && response.data['success'] == true) {
        final taskData = response.data['data']['task'] as Map<String, dynamic>;
        final task = TaskModel.fromJson(taskData);

        return Right(task);
      } else {
        return Left(ServerFailure(
          response.data['message'] ?? 'Lỗi khi đánh giá nhiệm vụ',
        ));
      }
    } on DioException catch (e) {
      if (e.response != null) {
        return Left(ServerFailure(
          e.response?.data['message'] ?? 'Lỗi server',
        ));
      } else {
        return Left(NetworkFailure('Lỗi kết nối mạng'));
      }
    } catch (e) {
      return Left(ServerFailure('Lỗi không xác định: $e'));
    }
  }

  @override
  Future<Either<Failure, Map<String, dynamic>>> getTaskStats() async {
    try {
      final response = await dioClient.get(ApiEndpoints.taskStats);

      if (response.statusCode == 200 && response.data['success'] == true) {
        final stats = response.data['data']['stats'] as Map<String, dynamic>;
        return Right(stats);
      } else {
        return Left(ServerFailure(
          response.data['message'] ?? 'Lỗi khi lấy thống kê',
        ));
      }
    } on DioException catch (e) {
      if (e.response != null) {
        return Left(ServerFailure(
          e.response?.data['message'] ?? 'Lỗi server',
        ));
      } else {
        return Left(NetworkFailure('Lỗi kết nối mạng'));
      }
    } catch (e) {
      return Left(ServerFailure('Lỗi không xác định: $e'));
    }
  }
}
