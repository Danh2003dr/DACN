import 'package:dio/dio.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../../config/env/app_config.dart';
import '../constants/app_constants.dart';
import '../utils/logger.dart';

class DioClient {
  late Dio _dio;
  static DioClient? _instance;

  DioClient._internal() {
    final baseUrl = AppConfig.apiBaseUrl;
    print('🌐 API Base URL: $baseUrl');

    _dio = Dio(
      BaseOptions(
        baseUrl: baseUrl,
        connectTimeout: Duration(milliseconds: AppConfig.apiTimeout),
        receiveTimeout: Duration(milliseconds: AppConfig.apiTimeout),
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      ),
    );

    _setupInterceptors();
  }

  factory DioClient() {
    _instance ??= DioClient._internal();
    return _instance!;
  }

  void _setupInterceptors() {
    // Request Interceptor
    _dio.interceptors.add(
      InterceptorsWrapper(
        onRequest: (options, handler) async {
          // Add Bearer token from SharedPreferences
          final prefs = await SharedPreferences.getInstance();
          final token = prefs.getString(AppConstants.tokenKey);

          if (token != null) {
            options.headers['Authorization'] = 'Bearer $token';
          }

          AppLogger.d('Request: ${options.method} ${options.path}');
          if (token != null) {
            AppLogger.d('Token: ${token.substring(0, 20)}... (length: ${token.length})');
          } else {
            AppLogger.w('⚠️ No token found in SharedPreferences');
          }
          if (options.data != null) {
            AppLogger.d('Request Data: ${options.data}');
          }

          return handler.next(options);
        },
        onResponse: (response, handler) {
          AppLogger.d(
            'Response: ${response.statusCode} ${response.requestOptions.path}',
          );
          return handler.next(response);
        },
        onError: (error, handler) async {
          AppLogger.e(
            'Error: ${error.response?.statusCode} ${error.requestOptions.path}',
          );
          AppLogger.e('Error Message: ${error.message}');
          AppLogger.e(
              'Request URL: ${error.requestOptions.baseUrl}${error.requestOptions.path}');

          // Handle network errors (no response)
          if (error.response == null) {
            AppLogger.e('Network Error: ${error.type} - ${error.message}');
            AppLogger.e(
                'Check if backend server is running at: ${error.requestOptions.baseUrl}');
          }

          // Handle 401 - Unauthorized
          if (error.response?.statusCode == 401) {
            final prefs = await SharedPreferences.getInstance();
            await prefs.remove(AppConstants.tokenKey);
            await prefs.remove(AppConstants.userKey);

            // TODO: Navigate to login page
            // This will be handled by AuthProvider
          }

          // Handle 500 - Server Error
          if (error.response?.statusCode == 500) {
            // Check if skipErrorHandler is set
            final skipErrorHandler =
                error.requestOptions.extra['skipErrorHandler'] as bool? ??
                    false;
            if (!skipErrorHandler) {
              // Show error message (will be handled by UI layer)
              AppLogger.e('Server Error: ${error.response?.data}');
            }
          }

          return handler.next(error);
        },
      ),
    );
  }

  // GET request
  Future<Response> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool skipErrorHandler = false,
  }) async {
    try {
      final response = await _dio.get(
        path,
        queryParameters: queryParameters,
        options: options?.copyWith(
              extra: {...?options.extra, 'skipErrorHandler': skipErrorHandler},
            ) ??
            Options(extra: {'skipErrorHandler': skipErrorHandler}),
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // POST request
  Future<Response> post(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool skipErrorHandler = false,
  }) async {
    try {
      final response = await _dio.post(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options?.copyWith(
              extra: {...?options.extra, 'skipErrorHandler': skipErrorHandler},
            ) ??
            Options(extra: {'skipErrorHandler': skipErrorHandler}),
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // PUT request
  Future<Response> put(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool skipErrorHandler = false,
  }) async {
    try {
      final response = await _dio.put(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options?.copyWith(
              extra: {...?options.extra, 'skipErrorHandler': skipErrorHandler},
            ) ??
            Options(extra: {'skipErrorHandler': skipErrorHandler}),
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // DELETE request
  Future<Response> delete(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool skipErrorHandler = false,
  }) async {
    try {
      final response = await _dio.delete(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options?.copyWith(
              extra: {...?options.extra, 'skipErrorHandler': skipErrorHandler},
            ) ??
            Options(extra: {'skipErrorHandler': skipErrorHandler}),
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  // PATCH request
  Future<Response> patch(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
    bool skipErrorHandler = false,
  }) async {
    try {
      final response = await _dio.patch(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options?.copyWith(
              extra: {...?options.extra, 'skipErrorHandler': skipErrorHandler},
            ) ??
            Options(extra: {'skipErrorHandler': skipErrorHandler}),
      );
      return response;
    } catch (e) {
      rethrow;
    }
  }

  Dio get dio => _dio;
}
