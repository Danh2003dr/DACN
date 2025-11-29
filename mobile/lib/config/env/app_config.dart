import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'package:flutter/foundation.dart' show kIsWeb;

class AppConfig {
  // Check if dotenv is initialized
  static bool get _isInitialized {
    try {
      dotenv.env; // Try to access to check if initialized
      return true;
    } catch (e) {
      return false;
    }
  }

  // API Configuration
  // For Web: use localhost or 127.0.0.1
  // For Android Emulator: use 10.0.2.2 instead of localhost
  // For Physical Device: use your computer's IP address (e.g., 192.168.x.x)
  static String get apiBaseUrl {
    // Default URLs based on platform
    final String defaultUrl;
    if (kIsWeb) {
      // Web platform - use localhost
      defaultUrl = 'http://localhost:5000/api';
    } else {
      // Mobile platform (Android/iOS) - use 10.0.2.2 for emulator
      defaultUrl = 'http://10.0.2.2:5000/api';
    }

    if (!_isInitialized) {
      return defaultUrl;
    }

    try {
      final url = dotenv.get('API_BASE_URL', fallback: defaultUrl);

      // Only replace localhost with 10.0.2.2 on mobile, not on web
      if (!kIsWeb && (url.contains('localhost') || url.contains('127.0.0.1'))) {
        return url
            .replaceAll('localhost', '10.0.2.2')
            .replaceAll('127.0.0.1', '10.0.2.2');
      }

      return url;
    } catch (e) {
      return defaultUrl;
    }
  }

  // Environment
  static String get envType {
    if (!_isInitialized) return 'dev';
    try {
      return dotenv.get('ENV_TYPE', fallback: 'dev');
    } catch (e) {
      return 'dev';
    }
  }

  static bool get isDevelopment => envType == 'dev';
  static bool get isProduction => envType == 'prod';
  static bool get isStaging => envType == 'staging';

  // App Configuration
  static String get appName {
    if (!_isInitialized) return 'Drug Traceability System';
    try {
      return dotenv.get('APP_NAME', fallback: 'Drug Traceability System');
    } catch (e) {
      return 'Drug Traceability System';
    }
  }

  static String get appVersion {
    if (!_isInitialized) return '1.0.0';
    try {
      return dotenv.get('APP_VERSION', fallback: '1.0.0');
    } catch (e) {
      return '1.0.0';
    }
  }

  // Firebase Configuration (if needed)
  static String? get firebaseProjectId {
    if (!_isInitialized) return null;
    try {
      return dotenv.env['FIREBASE_PROJECT_ID'];
    } catch (e) {
      return null;
    }
  }

  static String? get firebaseApiKey {
    if (!_isInitialized) return null;
    try {
      return dotenv.env['FIREBASE_API_KEY'];
    } catch (e) {
      return null;
    }
  }

  // API Timeout
  static const int apiTimeout = 30000; // 30 seconds

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;
}
