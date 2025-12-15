/// API Endpoints cho Drug Traceability System
///
/// Tất cả các endpoints được định nghĩa ở đây để dễ quản lý và maintain
class ApiEndpoints {
  // Base URL được lấy từ AppConfig
  // Không cần định nghĩa ở đây vì đã có trong AppConfig.apiBaseUrl

  // ==================== AUTH ENDPOINTS ====================
  static const String login = '/auth/login';
  static const String logout = '/auth/logout';
  static const String refreshToken = '/auth/refresh';
  static const String changePassword = '/auth/change-password';
  static const String forgotPassword = '/auth/forgot-password';
  static const String resetPassword = '/auth/reset-password';
  static const String verifyEmail = '/auth/verify-email';
  static const String resendVerification = '/auth/resend-verification';
  static const String getCurrentUser = '/auth/me';
  static const String updateProfile = '/auth/profile';

  // ==================== DRUG ENDPOINTS ====================
  static const String drugs = '/drugs';
  static String drugById(String id) => '/drugs/$id';
  static String drugByQR(String qrCode) => '/drugs/qr/$qrCode';
  static const String scanQR = '/drugs/scan-qr';
  static const String verifyDrug = '/drugs/verify';
  static String drugSupplyChains(String drugId) =>
      '/drugs/$drugId/supply-chains';
  static String drugBlockchainTransactions(String drugId) =>
      '/drugs/$drugId/blockchain-transactions';

  // ==================== SUPPLY CHAIN ENDPOINTS ====================
  static const String supplyChains = '/supply-chain';
  static String supplyChainById(String id) => '/supply-chain/$id';
  static String supplyChainSteps(String id) => '/supply-chain/$id/steps';
  static String addSupplyChainStep(String id) => '/supply-chain/$id/steps';

  // ==================== BLOCKCHAIN ENDPOINTS ====================
  static const String blockchain = '/blockchain';
  static const String blockchainTransactions = '/blockchain/transactions';
  static String blockchainTransactionById(String id) =>
      '/blockchain/transactions/$id';
  static const String blockchainVerify = '/blockchain/verify';
  static const String blockchainDrugs = '/blockchain/drugs';
  static String blockchainDrugById(String drugId) =>
      '/blockchain/drugs/$drugId';

  // ==================== INVENTORY ENDPOINTS ====================
  static const String inventory = '/inventory';
  static String inventoryById(String id) => '/inventory/$id';
  static const String inventoryItems = '/inventory/items';
  static String inventoryItemById(String id) => '/inventory/items/$id';
  static String inventoryByDrugId(String drugId) => '/inventory/drug/$drugId';

  // ==================== ORDER ENDPOINTS ====================
  static const String orders = '/orders';
  static String orderById(String id) => '/orders/$id';
  static String shipOrder(String id) => '/orders/$id/ship';
  static String deliverOrder(String id) => '/orders/$id/deliver';
  static String cancelOrder(String id) => '/orders/$id/cancel';
  static String confirmOrder(String id) => '/orders/$id/confirm';
  static String processOrder(String id) => '/orders/$id/process';

  // ==================== OFFLINE SYNC ENDPOINTS ====================
  static const String syncScans = '/scans/sync';
  static const String offlineScans = '/scans/offline';
  static String offlineScanById(String id) => '/scans/offline/$id';
  static String retryOfflineScan(String id) => '/scans/offline/$id/retry';

  // ==================== VERIFICATION HISTORY ENDPOINTS ====================
  static const String verificationHistory = '/verifications';
  static String verificationById(String id) => '/verifications/$id';
  static const String exportVerifications = '/verifications/export';

  // ==================== NOTIFICATION ENDPOINTS ====================
  static const String notifications = '/notifications';
  static String notificationById(String id) => '/notifications/$id';
  static const String markAllRead = '/notifications/read-all';
  static String markAsRead(String id) => '/notifications/$id/read';
  static String deleteNotification(String id) => '/notifications/$id';

  // ==================== SETTINGS ENDPOINTS ====================
  static const String settings = '/settings';
  static const String notificationSettings = '/settings/notifications';
  static const String biometricSettings = '/settings/biometric';

  // ==================== REPORTS ENDPOINTS ====================
  static const String reports = '/reports';
  static const String verificationReport = '/reports/verifications';
  static const String exportReport = '/reports/export';

  // ==================== TASK ENDPOINTS ====================
  static const String tasks = '/tasks';
  static String taskById(String id) => '/tasks/$id';
  static String taskUpdates(String id) => '/tasks/$id/updates';
  static String taskRate(String id) => '/tasks/$id/rate';
  static const String taskStats = '/tasks/stats';

  // ==================== HELPER METHODS ====================

  /// Build full URL với base URL từ AppConfig
  /// Note: Thường không cần dùng vì DioClient đã có baseUrl
  static String buildUrl(String endpoint) {
    // Base URL sẽ được thêm tự động bởi DioClient
    return endpoint;
  }

  /// Replace path parameters trong endpoint
  /// Example: replaceParams('/drugs/:id', {'id': '123'}) => '/drugs/123'
  static String replaceParams(String endpoint, Map<String, String> params) {
    String result = endpoint;
    params.forEach((key, value) {
      result = result.replaceAll(':$key', value);
    });
    return result;
  }
}
