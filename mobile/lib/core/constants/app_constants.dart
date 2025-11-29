class AppConstants {
  // App Info
  static const String appName = 'Drug Traceability System';
  static const String appVersion = '1.0.0';

  // Storage Keys
  static const String tokenKey = 'auth_token';
  static const String userKey = 'user_data';
  static const String themeKey = 'theme_mode';
  static const String languageKey = 'language';

  // API Endpoints (relative paths)
  static const String authLogin = '/auth/login';
  static const String authRegister = '/auth/register';
  static const String authLogout = '/auth/logout';
  static const String authRefresh = '/auth/refresh-token';

  static const String users = '/users';
  static const String drugs = '/drugs';
  static const String supplyChains = '/supply-chains';
  static const String inventory = '/inventory';
  static const String orders = '/orders';
  static const String blockchain = '/blockchain';
  static const String auditLogs = '/audit-logs';
  static const String notifications = '/notifications';
  static const String tasks = '/tasks';
  static const String reports = '/reports';
  static const String suppliers = '/suppliers';
  static const String invoices = '/invoices';

  // Pagination
  static const int defaultPageSize = 20;
  static const int maxPageSize = 100;

  // Timeouts
  static const int apiTimeout = 30000; // 30 seconds
  static const int connectionTimeout = 10000; // 10 seconds

  // Cache Duration
  static const int cacheDurationMinutes = 5;

  // Validation
  static const int minPasswordLength = 8;
  static const int maxPasswordLength = 128;
  static const int minUsernameLength = 3;
  static const int maxUsernameLength = 50;
}
