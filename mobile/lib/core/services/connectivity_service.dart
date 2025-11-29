import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';
import '../utils/logger.dart';

class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<ConnectivityResult>? _subscription;
  final _connectivityController = StreamController<bool>.broadcast();

  Stream<bool> get connectivityStream => _connectivityController.stream;
  bool _isConnected = true;

  ConnectivityService() {
    _init();
  }

  Future<void> _init() async {
    // Check initial connectivity
    await checkConnectivity();

    // Listen to connectivity changes
    _subscription = _connectivity.onConnectivityChanged.listen(
      (ConnectivityResult result) {
        _updateConnectionStatus(result);
      },
    );
  }

  Future<bool> checkConnectivity() async {
    try {
      final result = await _connectivity.checkConnectivity();
      return _updateConnectionStatus(result);
    } catch (e) {
      AppLogger.e('Error checking connectivity: $e');
      return false;
    }
  }

  bool _updateConnectionStatus(ConnectivityResult result) {
    final isConnected = result == ConnectivityResult.mobile ||
        result == ConnectivityResult.wifi ||
        result == ConnectivityResult.ethernet;

    if (_isConnected != isConnected) {
      _isConnected = isConnected;
      _connectivityController.add(isConnected);
      AppLogger.d(
          'Connectivity changed: ${isConnected ? "Online" : "Offline"}');
    }

    return isConnected;
  }

  bool get isConnected => _isConnected;

  void dispose() {
    _subscription?.cancel();
    _connectivityController.close();
  }
}
