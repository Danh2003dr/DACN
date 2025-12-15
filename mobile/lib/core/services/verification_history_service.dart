import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../../domain/entities/verification_history_entity.dart';
import '../utils/logger.dart';

class VerificationHistoryService {
  static const String _keyPrefix = 'verification_history_';
  static const String _keysListKey = 'verification_history_keys';

  Future<void> init() async {
    // Service sử dụng SharedPreferences, không cần init đặc biệt
    AppLogger.d('✅ VerificationHistoryService initialized');
  }

  /// Lưu một verification vào history
  Future<void> saveVerification(VerificationHistoryEntity entity) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$_keyPrefix${entity.id}';

      final json = {
        'id': entity.id,
        'drugId': entity.drugId,
        'drugName': entity.drugName,
        'batchNumber': entity.batchNumber,
        'qrCode': entity.qrCode,
        'verifiedAt': entity.verifiedAt.toIso8601String(),
        'status': entity.status,
        'message': entity.message,
        'isBlockchainVerified': entity.isBlockchainVerified,
        'blockchainTransactionHash': entity.blockchainTransactionHash,
        'drugData': entity.drugData,
      };

      await prefs.setString(key, jsonEncode(json));

      // Lưu key vào danh sách keys
      final keysList = prefs.getStringList(_keysListKey) ?? [];
      if (!keysList.contains(key)) {
        keysList.add(key);
        await prefs.setStringList(_keysListKey, keysList);
      }

      AppLogger.d('✅ Saved verification: ${entity.id}');
    } catch (e) {
      AppLogger.e('Error saving verification: $e');
    }
  }

  /// Lấy tất cả verifications
  Future<List<VerificationHistoryEntity>> getAllVerifications() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keysList = prefs.getStringList(_keysListKey) ?? [];
      final verifications = <VerificationHistoryEntity>[];

      for (final key in keysList) {
        final jsonString = prefs.getString(key);
        if (jsonString != null) {
          try {
            final json = jsonDecode(jsonString) as Map<String, dynamic>;
            final entity = VerificationHistoryEntity(
              id: json['id'] as String,
              drugId: json['drugId'] as String,
              drugName: json['drugName'] as String?,
              batchNumber: json['batchNumber'] as String?,
              qrCode: json['qrCode'] as String,
              verifiedAt: DateTime.parse(json['verifiedAt'] as String),
              status: json['status'] as String,
              message: json['message'] as String?,
              isBlockchainVerified:
                  json['isBlockchainVerified'] as bool? ?? false,
              blockchainTransactionHash:
                  json['blockchainTransactionHash'] as String?,
              drugData: json['drugData'] as Map<String, dynamic>?,
            );
            verifications.add(entity);
          } catch (e) {
            AppLogger.e('Error parsing verification $key: $e');
          }
        }
      }

      // Sort by newest first
      verifications.sort((a, b) => b.verifiedAt.compareTo(a.verifiedAt));
      return verifications;
    } catch (e) {
      AppLogger.e('Error getting verifications: $e');
      return [];
    }
  }

  /// Lấy verifications với filter
  Future<List<VerificationHistoryEntity>> getVerifications({
    DateTime? startDate,
    DateTime? endDate,
    String? status,
    String? searchQuery,
  }) async {
    try {
      final all = await getAllVerifications();

      return all.where((v) {
        // Filter by date
        if (startDate != null && v.verifiedAt.isBefore(startDate)) {
          return false;
        }
        if (endDate != null &&
            v.verifiedAt.isAfter(endDate.add(const Duration(days: 1)))) {
          return false;
        }

        // Filter by status
        if (status != null && status.isNotEmpty && v.status != status) {
          return false;
        }

        // Filter by search query
        if (searchQuery != null && searchQuery.isNotEmpty) {
          final query = searchQuery.toLowerCase();
          final matchesName =
              v.drugName?.toLowerCase().contains(query) ?? false;
          final matchesBatch =
              v.batchNumber?.toLowerCase().contains(query) ?? false;
          final matchesQrCode = v.qrCode.toLowerCase().contains(query);
          final matchesDrugId = v.drugId.toLowerCase().contains(query);

          if (!matchesName &&
              !matchesBatch &&
              !matchesQrCode &&
              !matchesDrugId) {
            return false;
          }
        }

        return true;
      }).toList();
    } catch (e) {
      AppLogger.e('Error filtering verifications: $e');
      return [];
    }
  }

  /// Xóa một verification
  Future<void> deleteVerification(String id) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final key = '$_keyPrefix$id';
      await prefs.remove(key);

      // Xóa key khỏi danh sách
      final keysList = prefs.getStringList(_keysListKey) ?? [];
      keysList.remove(key);
      await prefs.setStringList(_keysListKey, keysList);

      AppLogger.d('✅ Deleted verification: $id');
    } catch (e) {
      AppLogger.e('Error deleting verification: $e');
    }
  }

  /// Xóa tất cả verifications
  Future<void> clearAll() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keysList = prefs.getStringList(_keysListKey) ?? [];

      // Xóa tất cả keys
      for (final key in keysList) {
        await prefs.remove(key);
      }

      // Xóa danh sách keys
      await prefs.remove(_keysListKey);

      AppLogger.d('✅ Cleared all verifications');
    } catch (e) {
      AppLogger.e('Error clearing verifications: $e');
    }
  }

  /// Lấy số lượng verifications
  Future<int> getCount() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      final keysList = prefs.getStringList(_keysListKey) ?? [];
      return keysList.length;
    } catch (e) {
      AppLogger.e('Error getting count: $e');
      return 0;
    }
  }
}
