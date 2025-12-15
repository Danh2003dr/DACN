import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/services/verification_history_service.dart';
import '../../../core/services/export_service.dart';
import '../../../domain/entities/verification_history_entity.dart';
import '../../widgets/custom_card.dart';
import '../../widgets/loading_overlay.dart';
import 'package:fluttertoast/fluttertoast.dart';

final verificationHistoryServiceProvider =
    Provider<VerificationHistoryService>((ref) {
  final service = VerificationHistoryService();
  service.init();
  return service;
});

class VerificationHistoryScreen extends ConsumerStatefulWidget {
  const VerificationHistoryScreen({super.key});

  @override
  ConsumerState<VerificationHistoryScreen> createState() =>
      _VerificationHistoryScreenState();
}

class _VerificationHistoryScreenState
    extends ConsumerState<VerificationHistoryScreen> {
  List<VerificationHistoryEntity> _allVerifications = [];
  List<VerificationHistoryEntity> _filteredVerifications = [];
  bool _isLoading = true;
  String? _errorMessage;

  // Filter states
  DateTime? _startDate;
  DateTime? _endDate;
  String? _selectedStatus;
  final TextEditingController _searchController = TextEditingController();

  // Status options
  final List<String> _statusOptions = [
    'all',
    'valid',
    'expired',
    'recalled',
    'invalid',
    'warning',
  ];

  @override
  void initState() {
    super.initState();
    _loadVerifications();
    _searchController.addListener(_onSearchChanged);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadVerifications() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final service = ref.read(verificationHistoryServiceProvider);
      final verifications = await service.getAllVerifications();

      setState(() {
        _allVerifications = verifications;
        _applyFilters();
        _isLoading = false;
      });
    } catch (e) {
      setState(() {
        _errorMessage = 'Lỗi khi tải lịch sử: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  void _onSearchChanged() {
    _applyFilters();
  }

  void _applyFilters() {
    final service = ref.read(verificationHistoryServiceProvider);

    service
        .getVerifications(
      startDate: _startDate,
      endDate: _endDate,
      status: _selectedStatus == 'all' || _selectedStatus == null
          ? null
          : _selectedStatus,
      searchQuery:
          _searchController.text.isEmpty ? null : _searchController.text,
    )
        .then((filtered) {
      if (mounted) {
        setState(() {
          _filteredVerifications = filtered;
        });
      }
    });
  }

  Future<void> _selectDateRange() async {
    final DateTimeRange? picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(2020),
      lastDate: DateTime.now(),
      initialDateRange: _startDate != null && _endDate != null
          ? DateTimeRange(start: _startDate!, end: _endDate!)
          : null,
      locale: const Locale('vi', 'VN'),
    );

    if (picked != null) {
      setState(() {
        _startDate = picked.start;
        _endDate = picked.end;
      });
      _applyFilters();
    }
  }

  void _clearDateFilter() {
    setState(() {
      _startDate = null;
      _endDate = null;
    });
    _applyFilters();
  }

  void _onStatusChanged(String? status) {
    setState(() {
      _selectedStatus = status;
    });
    _applyFilters();
  }

  Future<void> _deleteVerification(String id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Xóa lịch sử'),
        content: const Text('Bạn có chắc chắn muốn xóa mục này?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('Hủy'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Xóa'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final service = ref.read(verificationHistoryServiceProvider);
        await service.deleteVerification(id);
        await _loadVerifications();

        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Đã xóa thành công')),
          );
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Lỗi khi xóa: ${e.toString()}')),
          );
        }
      }
    }
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'valid':
        return Colors.green;
      case 'expired':
        return Colors.orange;
      case 'recalled':
        return Colors.red;
      case 'invalid':
        return Colors.red;
      case 'warning':
        return Colors.amber;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'valid':
        return 'Hợp lệ';
      case 'expired':
        return 'Hết hạn';
      case 'recalled':
        return 'Đã thu hồi';
      case 'invalid':
        return 'Không hợp lệ';
      case 'warning':
        return 'Cảnh báo';
      default:
        return status;
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final colorScheme = theme.colorScheme;

    return Scaffold(
      appBar: AppBar(
        title: const Text('Lịch sử xác minh'),
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.filter_list),
            onPressed: () {
              // Show filter dialog
              showModalBottomSheet(
                context: context,
                builder: (context) => _buildFilterSheet(context),
              );
            },
            tooltip: 'Lọc',
          ),
        ],
      ),
      body: LoadingOverlay(
        isLoading: _isLoading,
        child: Column(
          children: [
            // Search Bar
            Padding(
              padding: const EdgeInsets.all(16),
              child: TextField(
                controller: _searchController,
                decoration: InputDecoration(
                  hintText: 'Tìm kiếm theo tên thuốc, mã lô, QR code...',
                  prefixIcon: const Icon(Icons.search),
                  suffixIcon: _searchController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _searchController.clear();
                          },
                        )
                      : null,
                  border: OutlineInputBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
            ),

            // Active Filters
            if (_startDate != null ||
                _endDate != null ||
                (_selectedStatus != null && _selectedStatus != 'all'))
              Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Wrap(
                  spacing: 8,
                  runSpacing: 8,
                  children: [
                    if (_startDate != null || _endDate != null)
                      Chip(
                        label: Text(
                          _startDate != null && _endDate != null
                              ? '${DateFormat('dd/MM/yyyy').format(_startDate!)} - ${DateFormat('dd/MM/yyyy').format(_endDate!)}'
                              : _startDate != null
                                  ? 'Từ ${DateFormat('dd/MM/yyyy').format(_startDate!)}'
                                  : 'Đến ${DateFormat('dd/MM/yyyy').format(_endDate!)}',
                        ),
                        onDeleted: _clearDateFilter,
                        deleteIcon: const Icon(Icons.close, size: 18),
                      ),
                    if (_selectedStatus != null && _selectedStatus != 'all')
                      Chip(
                        label: Text(_getStatusText(_selectedStatus!)),
                        onDeleted: () => _onStatusChanged('all'),
                        deleteIcon: const Icon(Icons.close, size: 18),
                      ),
                  ],
                ),
              ),

            // Results Count
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    'Tìm thấy ${_filteredVerifications.length} kết quả',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: colorScheme.onSurfaceVariant,
                    ),
                  ),
                  if (_filteredVerifications.isNotEmpty)
                    PopupMenuButton<String>(
                      icon: const Icon(Icons.download),
                      onSelected: (value) async {
                        final exportService = ExportService();
                        try {
                          if (value == 'csv') {
                            await exportService
                                .exportToCSV(_filteredVerifications);
                            Fluttertoast.showToast(
                              msg: 'Đã xuất file CSV thành công',
                              toastLength: Toast.LENGTH_SHORT,
                            );
                          } else if (value == 'pdf') {
                            await exportService
                                .exportToPDF(_filteredVerifications);
                            Fluttertoast.showToast(
                              msg: 'Đã xuất file PDF thành công',
                              toastLength: Toast.LENGTH_SHORT,
                            );
                          }
                        } catch (e) {
                          Fluttertoast.showToast(
                            msg: 'Lỗi khi xuất file: $e',
                            toastLength: Toast.LENGTH_LONG,
                          );
                        }
                      },
                      itemBuilder: (context) => [
                        const PopupMenuItem(
                          value: 'csv',
                          child: Row(
                            children: [
                              Icon(Icons.table_chart, size: 20),
                              SizedBox(width: 8),
                              Text('Xuất CSV'),
                            ],
                          ),
                        ),
                        const PopupMenuItem(
                          value: 'pdf',
                          child: Row(
                            children: [
                              Icon(Icons.picture_as_pdf, size: 20),
                              SizedBox(width: 8),
                              Text('Xuất PDF'),
                            ],
                          ),
                        ),
                      ],
                    ),
                ],
              ),
            ),

            const SizedBox(height: 8),

            // List
            Expanded(
              child: _errorMessage != null
                  ? Center(
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
                            _errorMessage!,
                            style: TextStyle(color: colorScheme.error),
                            textAlign: TextAlign.center,
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton(
                            onPressed: _loadVerifications,
                            child: const Text('Thử lại'),
                          ),
                        ],
                      ),
                    )
                  : _filteredVerifications.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(
                                Icons.history,
                                size: 64,
                                color: colorScheme.onSurfaceVariant,
                              ),
                              const SizedBox(height: 16),
                              Text(
                                _allVerifications.isEmpty
                                    ? 'Chưa có lịch sử xác minh'
                                    : 'Không tìm thấy kết quả',
                                style: theme.textTheme.bodyLarge?.copyWith(
                                  color: colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredVerifications.length,
                          itemBuilder: (context, index) {
                            final verification = _filteredVerifications[index];
                            return _buildVerificationCard(
                              context,
                              verification,
                              theme,
                              colorScheme,
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildVerificationCard(
    BuildContext context,
    VerificationHistoryEntity verification,
    ThemeData theme,
    ColorScheme colorScheme,
  ) {
    final statusColor = _getStatusColor(verification.status);
    final dateFormat = DateFormat('dd/MM/yyyy HH:mm');

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
                  _getStatusText(verification.status),
                  style: TextStyle(
                    color: statusColor,
                    fontWeight: FontWeight.w600,
                    fontSize: 12,
                  ),
                ),
              ),
              const Spacer(),
              // Date
              Flexible(
                child: Text(
                  dateFormat.format(verification.verifiedAt),
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                  overflow: TextOverflow.ellipsis,
                  maxLines: 1,
                ),
              ),
              const SizedBox(width: 4),
              // Delete button
              IconButton(
                icon: const Icon(Icons.delete_outline, size: 20),
                onPressed: () => _deleteVerification(verification.id),
                color: colorScheme.error,
                tooltip: 'Xóa',
                padding: EdgeInsets.zero,
                constraints: const BoxConstraints(
                  minWidth: 40,
                  minHeight: 40,
                ),
              ),
            ],
          ),
          const SizedBox(height: 12),
          // Drug Name
          if (verification.drugName != null) ...[
            Text(
              verification.drugName!,
              style: theme.textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.w600,
              ),
            ),
            const SizedBox(height: 4),
          ],
          // Batch Number
          if (verification.batchNumber != null) ...[
            Row(
              children: [
                Icon(Icons.inventory_2, size: 16, color: colorScheme.primary),
                const SizedBox(width: 4),
                Expanded(
                  child: Text(
                    'Mã lô: ${verification.batchNumber}',
                    style: theme.textTheme.bodyMedium,
                    overflow: TextOverflow.ellipsis,
                    maxLines: 1,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
          ],
          // QR Code
          Row(
            children: [
              Icon(Icons.qr_code, size: 16, color: colorScheme.primary),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  'QR: ${verification.qrCode}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: colorScheme.onSurfaceVariant,
                  ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
          // Message
          if (verification.message != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: colorScheme.surfaceVariant,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.info_outline,
                    size: 16,
                    color: colorScheme.onSurfaceVariant,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      verification.message!,
                      style: theme.textTheme.bodySmall,
                      overflow: TextOverflow.visible,
                      maxLines: 3,
                    ),
                  ),
                ],
              ),
            ),
          ],
          // Blockchain Badge
          if (verification.isBlockchainVerified) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                Icon(
                  Icons.verified,
                  size: 16,
                  color: Colors.blue,
                ),
                const SizedBox(width: 4),
                Text(
                  'Đã xác minh trên Blockchain',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: Colors.blue,
                    fontWeight: FontWeight.w500,
                  ),
                ),
              ],
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildFilterSheet(BuildContext context) {
    final theme = Theme.of(context);

    return Container(
      padding: const EdgeInsets.all(24),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            'Lọc lịch sử',
            style: theme.textTheme.titleLarge?.copyWith(
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 24),
          // Date Range
          ListTile(
            leading: const Icon(Icons.calendar_today),
            title: const Text('Khoảng thời gian'),
            subtitle: Text(
              _startDate != null && _endDate != null
                  ? '${DateFormat('dd/MM/yyyy').format(_startDate!)} - ${DateFormat('dd/MM/yyyy').format(_endDate!)}'
                  : 'Chọn khoảng thời gian',
            ),
            trailing: _startDate != null || _endDate != null
                ? IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: _clearDateFilter,
                  )
                : null,
            onTap: _selectDateRange,
          ),
          const Divider(),
          // Status Filter
          ListTile(
            leading: const Icon(Icons.filter_alt),
            title: const Text('Trạng thái'),
            trailing: DropdownButton<String>(
              value: _selectedStatus ?? 'all',
              items: _statusOptions.map((status) {
                return DropdownMenuItem(
                  value: status,
                  child: Text(
                    status == 'all' ? 'Tất cả' : _getStatusText(status),
                  ),
                );
              }).toList(),
              onChanged: _onStatusChanged,
            ),
          ),
          const SizedBox(height: 24),
          // Apply Button
          ElevatedButton(
            onPressed: () {
              Navigator.pop(context);
              _applyFilters();
            },
            child: const Text('Áp dụng'),
          ),
        ],
      ),
    );
  }
}
