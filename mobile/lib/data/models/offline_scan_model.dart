import 'package:hive/hive.dart';

part 'offline_scan_model.g.dart';

@HiveType(typeId: 0)
class OfflineScanModel extends HiveObject {
  @HiveField(0)
  final String qrData;

  @HiveField(1)
  final DateTime scannedAt;

  @HiveField(2)
  final Map<String, dynamic>? mockData;

  @HiveField(3)
  bool synced;

  OfflineScanModel({
    required this.qrData,
    required this.scannedAt,
    this.mockData,
    this.synced = false,
  });

  Map<String, dynamic> toJson() {
    return {
      'qrData': qrData,
      'scannedAt': scannedAt.toIso8601String(),
      'mockData': mockData,
      'synced': synced,
    };
  }

  factory OfflineScanModel.fromJson(Map<String, dynamic> json) {
    return OfflineScanModel(
      qrData: json['qrData'] as String,
      scannedAt: DateTime.parse(json['scannedAt'] as String),
      mockData: json['mockData'] as Map<String, dynamic>?,
      synced: json['synced'] as bool? ?? false,
    );
  }
}
