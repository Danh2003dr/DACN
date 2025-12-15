import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/providers/services_provider.dart';
import '../../../data/models/offline_scan_model.dart';
import '../../widgets/custom_card.dart';
import '../../widgets/custom_button.dart';

final offlineScansProvider =
    FutureProvider<List<OfflineScanModel>>((ref) async {
  final syncService = ref.read(syncServiceProvider);
  return await syncService.getOfflineScans();
});

class OfflineScansScreen extends ConsumerWidget {
  const OfflineScansScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;
    final scansAsync = ref.watch(offlineScansProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Quét ngoại tuyến'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.sync),
            onPressed: () async {
              final syncService = ref.read(syncServiceProvider);
              // Trigger manual sync
              await syncService.getOfflineScans();
              ref.invalidate(offlineScansProvider);

              if (context.mounted) {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(content: Text('Đang đồng bộ...')),
                );
              }
            },
            tooltip: 'Đồng bộ tất cả',
          ),
        ],
      ),
      body: scansAsync.when(
        data: (scans) {
          if (scans.isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.cloud_done,
                    size: 64,
                    color: colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(height: 16),
                  Text(
                    'Không có quét ngoại tuyến',
                    style: theme.textTheme.titleLarge?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Tất cả quét đã được đồng bộ',
                    style: theme.textTheme.bodyMedium?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            );
          }

          return Column(
            children: [
              // Header Stats
              Container(
                padding: const EdgeInsets.all(16),
                color: colorScheme.surfaceVariant,
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceAround,
                  children: [
                    _buildStatItem(
                      context,
                      'Tổng số',
                      scans.length.toString(),
                      Icons.qr_code_scanner,
                      colorScheme.primary,
                    ),
                    _buildStatItem(
                      context,
                      'Chưa đồng bộ',
                      scans.where((s) => !s.synced).length.toString(),
                      Icons.cloud_off,
                      colorScheme.error,
                    ),
                    _buildStatItem(
                      context,
                      'Đã đồng bộ',
                      scans.where((s) => s.synced).length.toString(),
                      Icons.cloud_done,
                      colorScheme.tertiary,
                    ),
                  ],
                ),
              ),

              // Sync All Button
              Padding(
                padding: const EdgeInsets.all(16),
                child: CustomButton(
                  text: 'Đồng bộ tất cả',
                  onPressed: () async {
                    final syncService = ref.read(syncServiceProvider);
                    // Trigger sync
                    await syncService.getOfflineScans();
                    ref.invalidate(offlineScansProvider);

                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(content: Text('Đang đồng bộ...')),
                      );
                    }
                  },
                  variant: ButtonVariant.primary,
                  icon: Icons.sync,
                  isFullWidth: true,
                ),
              ),

              // Scans List
              Expanded(
                child: ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: scans.length,
                  itemBuilder: (context, index) {
                    final scan = scans[index];
                    return _buildScanCard(
                        context, scan, ref, theme, colorScheme);
                  },
                ),
              ),
            ],
          );
        },
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                Icons.error_outline,
                size: 64,
                color: colorScheme.error,
              ),
              const SizedBox(height: 16),
              Text(
                'Lỗi khi tải dữ liệu',
                style: theme.textTheme.titleLarge?.copyWith(
                  color: colorScheme.error,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                error.toString(),
                style: theme.textTheme.bodySmall,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(offlineScansProvider),
                child: const Text('Thử lại'),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildStatItem(
    BuildContext context,
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Icon(icon, color: color, size: 32),
        const SizedBox(height: 8),
        Text(
          value,
          style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                fontWeight: FontWeight.bold,
                color: color,
              ),
        ),
        Text(
          label,
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }

  Widget _buildScanCard(
    BuildContext context,
    OfflineScanModel scan,
    WidgetRef ref,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');
    final statusColor = scan.synced ? Colors.green : Colors.orange;
    final statusText = scan.synced ? 'Đã đồng bộ' : 'Chờ đồng bộ';

    return CustomCard(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header
          Row(
            children: [
              // Status Badge
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                decoration: BoxDecoration(
                  color: statusColor.withOpacity(0.1),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: statusColor),
                ),
                child: Text(
                  statusText,
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
              const Spacer(),
              // Date
              Text(
                dateFormat.format(scan.scannedAt),
                style: theme.textTheme.bodySmall?.copyWith(
                  color: colorScheme.onSurfaceVariant,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // QR Data
          Row(
            children: [
              Icon(Icons.qr_code, size: 16, color: colorScheme.primary),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  'QR: ${scan.qrData}',
                  style: theme.textTheme.bodyMedium,
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          // Actions
          if (!scan.synced) ...[
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                TextButton.icon(
                  onPressed: () async {
                    final syncService = ref.read(syncServiceProvider);
                    final success = await syncService.retrySingleScan(scan);

                    ref.invalidate(offlineScansProvider);

                    if (context.mounted) {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          content: Text(success
                              ? 'Đồng bộ thành công'
                              : 'Đồng bộ thất bại. Vui lòng thử lại sau.'),
                          backgroundColor: success ? Colors.green : Colors.red,
                        ),
                      );
                    }
                  },
                  icon: const Icon(Icons.refresh, size: 18),
                  label: const Text('Thử lại'),
                ),
                const SizedBox(width: 8),
                TextButton.icon(
                  onPressed: () async {
                    final confirmed = await showDialog<bool>(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Xóa quét'),
                        content:
                            const Text('Bạn có chắc chắn muốn xóa quét này?'),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context, false),
                            child: const Text('Hủy'),
                          ),
                          TextButton(
                            onPressed: () => Navigator.pop(context, true),
                            style: TextButton.styleFrom(
                                foregroundColor: Colors.red),
                            child: const Text('Xóa'),
                          ),
                        ],
                      ),
                    );

                    if (confirmed == true) {
                      final syncService = ref.read(syncServiceProvider);
                      final deleted = await syncService.deleteScan(scan);
                      ref.invalidate(offlineScansProvider);

                      if (context.mounted) {
                        ScaffoldMessenger.of(context).showSnackBar(
                          SnackBar(
                            content: Text(deleted ? 'Đã xóa' : 'Lỗi khi xóa'),
                            backgroundColor:
                                deleted ? Colors.green : Colors.red,
                          ),
                        );
                      }
                    }
                  },
                  icon: const Icon(Icons.delete_outline, size: 18),
                  label: const Text('Xóa'),
                  style:
                      TextButton.styleFrom(foregroundColor: colorScheme.error),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }
}
