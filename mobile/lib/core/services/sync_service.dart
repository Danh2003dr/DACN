import 'package:hive_flutter/hive_flutter.dart';
import '../utils/logger.dart';
import '../../data/models/offline_scan_model.dart';
import '../../core/api/dio_client.dart';
import '../../core/constants/app_constants.dart';
import 'connectivity_service.dart';

class SyncService {
  final ConnectivityService _connectivityService;
  final DioClient _dioClient;
  static const String _boxName = 'offline_scans';
  Box<OfflineScanModel>? _box;

  SyncService(this._connectivityService, this._dioClient) {
    _init();
  }

  Future<void> _init() async {
    try {
      // Check if adapter is registered
      if (!Hive.isAdapterRegistered(0)) {
        // Adapter should be registered in main.dart, but register here as fallback
        try {
          Hive.registerAdapter(OfflineScanModelAdapter());
        } catch (e) {
          AppLogger.e(
              'Error registering adapter (might already be registered): $e');
        }
      }
      _box = await Hive.openBox<OfflineScanModel>(_boxName);
      AppLogger.d('✅ Offline scans box opened');

      // Listen to connectivity changes
      _connectivityService.connectivityStream.listen((isConnected) {
        if (isConnected) {
          _syncOfflineScans();
        }
      });

      // Initial sync if online
      if (_connectivityService.isConnected) {
        _syncOfflineScans();
      }
    } catch (e) {
      AppLogger.e('Error initializing SyncService: $e');
    }
  }

  Future<void> addOfflineScan(String qrData,
      {Map<String, dynamic>? mockData}) async {
    try {
      if (_box == null) {
        await _init();
      }

      final scan = OfflineScanModel(
        qrData: qrData,
        scannedAt: DateTime.now(),
        mockData: mockData,
        synced: false,
      );

      await _box!.add(scan);
      AppLogger.d('✅ Offline scan saved: $qrData');

      // Try to sync immediately if online
      if (_connectivityService.isConnected) {
        _syncOfflineScans();
      }
    } catch (e) {
      AppLogger.e('Error adding offline scan: $e');
    }
  }

  Future<List<OfflineScanModel>> getOfflineScans() async {
    try {
      if (_box == null) {
        await _init();
      }
      return _box!.values.where((scan) => !scan.synced).toList();
    } catch (e) {
      AppLogger.e('Error getting offline scans: $e');
      return [];
    }
  }

  Future<void> _syncOfflineScans() async {
    try {
      if (_box == null || !_connectivityService.isConnected) {
        return;
      }

      final unsyncedScans = _box!.values.where((scan) => !scan.synced).toList();

      if (unsyncedScans.isEmpty) {
        AppLogger.d('No offline scans to sync');
        return;
      }

      AppLogger.d('🔄 Syncing ${unsyncedScans.length} offline scans...');

      for (final scan in unsyncedScans) {
        try {
          // Try to verify the drug on server
          final response = await _dioClient.post(
            '${AppConstants.drugs}/scan-qr',
            data: {'qrData': scan.qrData},
          );

          if (response.statusCode == 200) {
            // Mark as synced - update in box
            final index = _box!.values.toList().indexOf(scan);
            if (index != -1) {
              scan.synced = true;
              await _box!.putAt(index, scan);
              AppLogger.d('✅ Synced scan: ${scan.qrData}');
            }
          }
        } catch (e) {
          AppLogger.e('Error syncing scan ${scan.qrData}: $e');
          // Continue with next scan
        }
      }

      // Clean up synced scans (optional - keep for history or delete)
      // await _cleanupSyncedScans();
    } catch (e) {
      AppLogger.e('Error in sync process: $e');
    }
  }

  Future<void> clearAllScans() async {
    try {
      if (_box == null) return;
      await _box!.clear();
      AppLogger.d('🧹 Cleared all offline scans');
    } catch (e) {
      AppLogger.e('Error clearing scans: $e');
    }
  }
}
