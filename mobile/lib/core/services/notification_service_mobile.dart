import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../utils/logger.dart';
import '../utils/notification_navigator.dart';

// Background message handler (must be top-level function)
@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  AppLogger.d('📬 Background message received: ${message.messageId}');
  AppLogger.d('Title: ${message.notification?.title}');
  AppLogger.d('Body: ${message.notification?.body}');
  AppLogger.d('Data: ${message.data}');
}

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;
  NotificationService._internal();

  final FirebaseMessaging _firebaseMessaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();

  bool _isInitialized = false;
  String? _fcmToken;

  String? get fcmToken => _fcmToken;

  Future<void> init() async {
    if (_isInitialized) {
      AppLogger.d('NotificationService already initialized');
      return;
    }

    try {
      // Initialize Firebase Messaging
      await _initializeFirebaseMessaging();

      // Initialize Local Notifications
      await _initializeLocalNotifications();

      // Request permission
      await _requestPermission();

      // Get FCM token
      await _getFCMToken();

      // Setup message handlers
      _setupMessageHandlers();

      _isInitialized = true;
      AppLogger.d('✅ NotificationService initialized');
    } catch (e) {
      AppLogger.e('Error initializing NotificationService: $e');
      // Mark as initialized even on error to prevent retry loops
      _isInitialized = true;
    }
  }

  Future<void> _initializeFirebaseMessaging() async {
    try {
      // Set background message handler
      FirebaseMessaging.onBackgroundMessage(firebaseMessagingBackgroundHandler);

      // Configure settings
      await _firebaseMessaging.setAutoInitEnabled(true);

      AppLogger.d('✅ Firebase Messaging initialized');
    } catch (e) {
      AppLogger.e('Error initializing Firebase Messaging: $e');
      // Continue without Firebase if not available
    }
  }

  Future<void> _initializeLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    AppLogger.d('✅ Local Notifications initialized');
  }

  Future<void> _requestPermission() async {
    try {
      final settings = await _firebaseMessaging.requestPermission(
        alert: true,
        badge: true,
        sound: true,
        provisional: false,
      );

      AppLogger.d('Notification permission: ${settings.authorizationStatus}');

      // Also request for local notifications (Android 13+)
      if (settings.authorizationStatus == AuthorizationStatus.authorized) {
        await _localNotifications
            .resolvePlatformSpecificImplementation<
                AndroidFlutterLocalNotificationsPlugin>()
            ?.requestNotificationsPermission();
      }
    } catch (e) {
      AppLogger.e('Error requesting notification permission: $e');
    }
  }

  Future<void> _getFCMToken() async {
    try {
      _fcmToken = await _firebaseMessaging.getToken();
      AppLogger.d('FCM Token: $_fcmToken');

      // Listen for token refresh
      _firebaseMessaging.onTokenRefresh.listen((newToken) {
        _fcmToken = newToken;
        AppLogger.d('FCM Token refreshed: $newToken');
        // TODO: Send new token to server
      });
    } catch (e) {
      AppLogger.e('Error getting FCM token: $e');
    }
  }

  void _setupMessageHandlers() {
    // Foreground messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      AppLogger.d('📬 Foreground message received: ${message.messageId}');
      _showLocalNotification(message);
    });

    // When app is opened from terminated state
    FirebaseMessaging.onMessageOpenedApp.listen((RemoteMessage message) {
      AppLogger.d('📬 App opened from notification: ${message.messageId}');
      _handleNotificationTap(message);
    });

    // Check if app was opened from notification (terminated state)
    _firebaseMessaging.getInitialMessage().then((RemoteMessage? message) {
      if (message != null) {
        AppLogger.d(
            '📬 App opened from notification (terminated): ${message.messageId}');
        _handleNotificationTap(message);
      }
    });
  }

  Future<void> _showLocalNotification(RemoteMessage message) async {
    try {
      final notification = message.notification;

      if (notification == null) return;

      const androidDetails = AndroidNotificationDetails(
        'drug_traceability_channel',
        'Drug Traceability Notifications',
        channelDescription:
            'Notifications for drug recalls, alerts, and updates',
        importance: Importance.high,
        priority: Priority.high,
        showWhen: true,
      );

      const iosDetails = DarwinNotificationDetails(
        presentAlert: true,
        presentBadge: true,
        presentSound: true,
      );

      const details = NotificationDetails(
        android: androidDetails,
        iOS: iosDetails,
      );

      await _localNotifications.show(
        message.hashCode,
        notification.title ?? 'Thông báo',
        notification.body ?? '',
        details,
        payload: message.data.toString(),
      );
    } catch (e) {
      AppLogger.e('Error showing local notification: $e');
    }
  }

  void _onNotificationTapped(NotificationResponse response) {
    AppLogger.d('Notification tapped: ${response.payload}');
    _navigateFromNotification(response.payload);
  }

  void _handleNotificationTap(RemoteMessage message) {
    final data = message.data;
    AppLogger.d('Handling notification tap with data: $data');
    _navigateFromNotificationData(data);
  }

  void _navigateFromNotification(String? payload) {
    NotificationNavigator.navigateFromPayload(payload);
  }

  void _navigateFromNotificationData(Map<String, dynamic> data) {
    NotificationNavigator.navigateFromNotification(data);
  }

  Future<void> subscribeToTopic(String topic) async {
    try {
      await _firebaseMessaging.subscribeToTopic(topic);
      AppLogger.d('✅ Subscribed to topic: $topic');
    } catch (e) {
      AppLogger.e('Error subscribing to topic: $e');
    }
  }

  Future<void> unsubscribeFromTopic(String topic) async {
    try {
      await _firebaseMessaging.unsubscribeFromTopic(topic);
      AppLogger.d('✅ Unsubscribed from topic: $topic');
    } catch (e) {
      AppLogger.e('Error unsubscribing from topic: $e');
    }
  }
}
