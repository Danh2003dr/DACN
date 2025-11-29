import '../utils/logger.dart';

// Stub implementation for web platform
class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  bool _isInitialized = false;
  String? _fcmToken;

  String? get fcmToken => _fcmToken;

  Future<void> init() async {
    if (_isInitialized) {
      AppLogger.d('NotificationService already initialized (web stub)');
      return;
    }

    AppLogger.d(
        '⚠️ NotificationService: Web platform - using stub implementation');
    _isInitialized = true;
  }

  Future<void> subscribeToTopic(String topic) async {
    AppLogger.d('⚠️ subscribeToTopic: Not available on web');
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    AppLogger.d('⚠️ unsubscribeFromTopic: Not available on web');
  }
}
