import 'package:go_router/go_router.dart';
import '../utils/logger.dart';

class NotificationNavigator {
  static GoRouter? _router;

  static void setRouter(GoRouter router) {
    _router = router;
  }

  static void navigateFromNotification(Map<String, dynamic> data) {
    if (_router == null) {
      AppLogger.w('Router not set for notification navigation');
      return;
    }

    final type = data['type'] as String?;
    final drugId = data['drugId'] as String?;
    final chainId = data['chainId'] as String?;
    final qrData = data['qrData'] as String?;

    if (type != null) {
      switch (type) {
        case 'drug_verification':
        case 'drug_recall':
          if (drugId != null) {
            // Navigate to drug detail (if route exists)
            AppLogger.d('Navigating to drug: $drugId');
            // _router!.go('/drug/$drugId');
          } else if (qrData != null) {
            AppLogger.d('Navigating to drug verification with QR: $qrData');
            _router!.go('/drug-verification', extra: {'qrData': qrData});
          }
          break;
        case 'supply_chain_update':
          if (chainId != null) {
            AppLogger.d('Navigating to supply chain: $chainId');
            // _router!.go('/supply-chain/$chainId');
          }
          break;
        case 'verification_history':
          AppLogger.d('Navigating to verification history');
          _router!.go('/verification-history');
          break;
        default:
          AppLogger.w('Unknown notification type: $type');
      }
    }
  }

  static void navigateFromPayload(String? payload) {
    if (payload == null || _router == null) return;

    try {
      // Parse payload format: "type:id" or "type:data"
      final parts = payload.split(':');
      if (parts.length >= 2) {
        final type = parts[0];
        final id = parts[1];
        navigateFromNotification({'type': type, 'drugId': id});
      }
    } catch (e) {
      AppLogger.e('Error parsing notification payload: $e');
    }
  }
}

