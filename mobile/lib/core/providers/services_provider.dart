import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/api/dio_client.dart';
import '../../core/services/connectivity_service.dart';
import '../../core/services/sync_service.dart';

final dioClientProvider = Provider<DioClient>((ref) {
  return DioClient();
});

final connectivityServiceProvider = Provider<ConnectivityService>((ref) {
  return ConnectivityService();
});

final syncServiceProvider = Provider<SyncService>((ref) {
  final connectivityService = ref.read(connectivityServiceProvider);
  final dioClient = DioClient();
  return SyncService(connectivityService, dioClient);
});
