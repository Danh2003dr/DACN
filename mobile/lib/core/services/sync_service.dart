import 'package:hive_flutter/hive_flutter.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../utils/logger.dart';
import '../../data/models/offline_scan_model.dart';
import '../../core/api/dio_client.dart';
import '../../core/constants/app_constants.dart';
import 'connectivity_service.dart';

class SyncService {
  final ConnectivityService _connectivityService;
  final DioClient _dioClient;
  static const String _boxName = 'offline_scans';
  static const String _lastSyncTimeKey = 'last_sync_time';
  static const String _isSyncingKey = 'is_syncing';
  Box<OfflineScanModel>? _box;
  bool _isSyncing = false;
  DateTime? _lastSyncTime;

  bool get isSyncing => _isSyncing;
  DateTime? get lastSyncTime => _lastSyncTime;

  SyncService(this._connectivityService, this._dioClient) {
    _init();
    _loadSyncState();
  }

  Future<void> _loadSyncState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final lastSyncTimestamp = prefs.getInt(_lastSyncTimeKey);
      if (lastSyncTimestamp != null) {
        _lastSyncTime = DateTime.fromMillisecondsSinceEpoch(lastSyncTimestamp);
      }
      _isSyncing = prefs.getBool(_isSyncingKey) ?? false;
    } catch (e) {
      AppLogger.e('Error loading sync state: $e');
    }
  }

  Future<void> _saveSyncState() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      if (_lastSyncTime != null) {
        await prefs.setInt(
            _lastSyncTimeKey, _lastSyncTime!.millisecondsSinceEpoch);
      }
      await prefs.setBool(_isSyncingKey, _isSyncing);
    } catch (e) {
      AppLogger.e('Error saving sync state: $e');
    }
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

  /// Retry syncing a single scan
  Future<bool> retrySingleScan(OfflineScanModel scan) async {
    try {
      if (!_connectivityService.isConnected) {
        AppLogger.w('No internet connection');
        return false;
      }

      AppLogger.d('🔄 Retrying sync for scan: ${scan.qrData}');

      // Try to sync the scan
      final response = await _dioClient.post(
        '${AppConstants.drugs}/scan-qr',
        data: {'qrData': scan.qrData},
      );

      if (response.statusCode == 200 || response.statusCode == 201) {
        // Mark as synced
        scan.synced = true;
        await scan.save();
        AppLogger.d('✅ Successfully synced scan: ${scan.qrData}');
        return true;
      } else {
        AppLogger.w('Failed to sync scan: ${response.statusCode}');
        return false;
      }
    } catch (e) {
      AppLogger.e('Error retrying sync for scan ${scan.qrData}: $e');
      return false;
    }
  }

  Future<void> _syncOfflineScans() async {
    try {
      if (_box == null || !_connectivityService.isConnected || _isSyncing) {
        return;
      }

      final unsyncedScans = _box!.values.where((scan) => !scan.synced).toList();

      if (unsyncedScans.isEmpty) {
        AppLogger.d('No offline scans to sync');
        return;
      }

      _isSyncing = true;
      await _saveSyncState();

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

      _lastSyncTime = DateTime.now();
      _isSyncing = false;
      await _saveSyncState();

      // Clean up synced scans (optional - keep for history or delete)
      // await _cleanupSyncedScans();
    } catch (e) {
      _isSyncing = false;
      await _saveSyncState();
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

  /// Delete a specific scan by key
  Future<bool> deleteScan(OfflineScanModel scan) async {
    try {
      if (_box == null) {
        await _init();
      }

      final index = _box!.values.toList().indexOf(scan);
      if (index != -1) {
        await _box!.deleteAt(index);
        AppLogger.d('✅ Deleted scan: ${scan.qrData}');
        return true;
      }
      return false;
    } catch (e) {
      AppLogger.e('Error deleting scan: $e');
      return false;
    }
  }

  /// Get sync statistics
  Future<Map<String, dynamic>> getSyncStats() async {
    try {
      if (_box == null) {
        await _init();
      }

      final allScans = _box!.values.toList();
      final unsyncedCount = allScans.where((scan) => !scan.synced).length;
      final syncedCount = allScans.where((scan) => scan.synced).length;

      return {
        'total': allScans.length,
        'unsynced': unsyncedCount,
        'synced': syncedCount,
        'isSyncing': _isSyncing,
        'lastSyncTime': _lastSyncTime,
      };
    } catch (e) {
      AppLogger.e('Error getting sync stats: $e');
      return {
        'total': 0,
        'unsynced': 0,
        'synced': 0,
        'isSyncing': false,
        'lastSyncTime': null,
      };
    }
  }
}
