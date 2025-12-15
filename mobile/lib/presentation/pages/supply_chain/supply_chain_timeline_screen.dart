import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:intl/intl.dart';
import 'package:timeline_tile/timeline_tile.dart';

import '../../../core/api/api_endpoints.dart';
import '../../../core/providers/services_provider.dart';
import '../../../core/utils/logger.dart';
import '../../../data/models/supply_chain_model.dart';
import '../../../data/models/supply_chain_step_model.dart';

class SupplyChainTimelineScreen extends ConsumerStatefulWidget {
  final String? supplyChainId;
  final String? drugId;
  final SupplyChainModel? supplyChain;

  const SupplyChainTimelineScreen({
    super.key,
    this.supplyChainId,
    this.drugId,
    this.supplyChain,
  });

  @override
  ConsumerState<SupplyChainTimelineScreen> createState() =>
      _SupplyChainTimelineScreenState();
}

class _SupplyChainTimelineScreenState
    extends ConsumerState<SupplyChainTimelineScreen> {
  SupplyChainModel? _supplyChain;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadSupplyChain();
  }

  Future<void> _loadSupplyChain() async {
    // Nếu đã có supply chain từ parameter, dùng luôn
    if (widget.supplyChain != null) {
      setState(() {
        _supplyChain = widget.supplyChain;
        _isLoading = false;
      });
      return;
    }

    // Nếu có supplyChainId, load từ API
    if (widget.supplyChainId != null) {
      try {
        setState(() {
          _isLoading = true;
          _error = null;
        });

        final dioClient = ref.read(dioClientProvider);
        final response = await dioClient.get(
          ApiEndpoints.supplyChainById(widget.supplyChainId!),
        );

        if (response.statusCode == 200 && response.data['success'] == true) {
          final data = response.data['data'];
          setState(() {
            _supplyChain = SupplyChainModel.fromJson(data);
            _isLoading = false;
          });
        } else {
          setState(() {
            _error = 'Không thể tải thông tin chuỗi cung ứng';
            _isLoading = false;
          });
        }
      } catch (e) {
        AppLogger.e('Error loading supply chain: $e');
        setState(() {
          _error = 'Lỗi khi tải dữ liệu: ${e.toString()}';
          _isLoading = false;
        });
      }
    } else {
      setState(() {
        _error = 'Thiếu thông tin chuỗi cung ứng';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hành trình thuốc'),
        elevation: 0,
      ),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? _buildErrorView()
              : _supplyChain == null || _supplyChain!.steps.isEmpty
                  ? _buildEmptyView()
                  : _buildTimelineView(),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.error_outline,
              size: 64,
              color: Colors.red,
            ),
            const SizedBox(height: 16),
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge,
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () {
                context.pop();
              },
              child: const Text('Quay lại'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24.0),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(
              Icons.timeline_outlined,
              size: 64,
              color: Colors.grey,
            ),
            const SizedBox(height: 16),
            Text(
              'Chưa có thông tin hành trình',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 8),
            Text(
              'Chuỗi cung ứng này chưa có bước nào được ghi nhận',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Colors.grey,
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildTimelineView() {
    final steps = _supplyChain!.steps
        .map((step) => step is SupplyChainStepModel
            ? step
            : SupplyChainStepModel.fromEntity(step))
        .toList();

    return RefreshIndicator(
      onRefresh: _loadSupplyChain,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header Info
            _buildHeaderInfo(),
            const SizedBox(height: 24),
            // Timeline
            ...steps.asMap().entries.map((entry) {
              final index = entry.key;
              final step = entry.value;
              final isLast = index == steps.length - 1;
              return TimelineStepWidget(
                step: step,
                isFirst: index == 0,
                isLast: isLast,
                supplyChainHash: _supplyChain!.blockchainHash,
              );
            }),
          ],
        ),
      ),
    );
  }

  Widget _buildHeaderInfo() {
    return Card(
      elevation: 2,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Text(
                    _supplyChain!.drugName ?? 'Thuốc',
                    style: Theme.of(context).textTheme.titleLarge?.copyWith(
                          fontWeight: FontWeight.bold,
                        ),
                  ),
                ),
                _buildStatusChip(_supplyChain!.status),
              ],
            ),
            if (_supplyChain!.blockchainHash != null) ...[
              const SizedBox(height: 12),
              const Divider(),
              const SizedBox(height: 12),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(
                    Icons.link,
                    size: 16,
                    color: Colors.blue,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Blockchain Hash',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.grey,
                                  ),
                        ),
                        const SizedBox(height: 4),
                        SelectableText(
                          _supplyChain!.blockchainHash!,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    fontFamily: 'monospace',
                                    fontSize: 11,
                                  ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
            if (_supplyChain!.createdAt != null) ...[
              const SizedBox(height: 12),
              Row(
                children: [
                  const Icon(
                    Icons.calendar_today,
                    size: 16,
                    color: Colors.grey,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    'Tạo lúc: ${DateFormat('dd/MM/yyyy HH:mm').format(_supplyChain!.createdAt!)}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey,
                        ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStatusChip(String status) {
    Color color;
    String label;

    switch (status.toLowerCase()) {
      case 'completed':
      case 'hoàn thành':
        color = Colors.green;
        label = 'Hoàn thành';
        break;
      case 'in_progress':
      case 'đang xử lý':
        color = Colors.blue;
        label = 'Đang xử lý';
        break;
      case 'pending':
      case 'chờ xử lý':
        color = Colors.orange;
        label = 'Chờ xử lý';
        break;
      case 'cancelled':
      case 'đã hủy':
        color = Colors.red;
        label = 'Đã hủy';
        break;
      case 'issue':
      case 'có vấn đề':
        color = Colors.red;
        label = 'Có vấn đề';
        break;
      default:
        color = Colors.grey;
        label = status;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color, width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: color,
          fontSize: 12,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }
}

class TimelineStepWidget extends StatelessWidget {
  final SupplyChainStepModel step;
  final bool isFirst;
  final bool isLast;
  final String? supplyChainHash;

  const TimelineStepWidget({
    super.key,
    required this.step,
    required this.isFirst,
    required this.isLast,
    required this.supplyChainHash,
  });

  @override
  Widget build(BuildContext context) {
    final stepStatus = _getStepStatus();
    final stepColor = _getStepColor(stepStatus);
    final stepIcon = _getStepIcon(step.type);
    final stepLabel = _getStepTypeLabel(step.type);

    return TimelineTile(
      isFirst: isFirst,
      isLast: isLast,
      beforeLineStyle: LineStyle(
        color: stepStatus == 'completed'
            ? stepColor
            : stepStatus == 'in_progress'
                ? stepColor.withOpacity(0.3)
                : Colors.grey.shade300,
        thickness: 3,
      ),
      indicatorStyle: IndicatorStyle(
        width: 40,
        height: 40,
        indicator: Container(
          decoration: BoxDecoration(
            color: stepStatus == 'completed'
                ? stepColor
                : stepStatus == 'in_progress'
                    ? stepColor.withOpacity(0.2)
                    : Colors.grey.shade200,
            shape: BoxShape.circle,
            border: Border.all(
              color: stepColor,
              width: 3,
            ),
          ),
          child: Icon(
            stepIcon,
            color: stepStatus == 'completed'
                ? Colors.white
                : stepStatus == 'in_progress'
                    ? stepColor
                    : Colors.grey,
            size: 20,
          ),
        ),
      ),
      endChild: Padding(
        padding: const EdgeInsets.only(left: 16, bottom: 24),
        child: _buildStepContent(context, stepStatus, stepColor, stepLabel),
      ),
    );
  }

  Widget _buildStepContent(
    BuildContext context,
    String stepStatus,
    Color stepColor,
    String stepLabel,
  ) {
    return Card(
      elevation: 2,
      margin: EdgeInsets.zero,
      child: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header với label và status
            Row(
              children: [
                Expanded(
                  child: Text(
                    stepLabel,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.bold,
                          color: stepColor,
                        ),
                  ),
                ),
                _buildStepStatusBadge(stepStatus, stepColor),
                if (step.isVerified) ...[
                  const SizedBox(width: 8),
                  Container(
                    padding: const EdgeInsets.symmetric(
                      horizontal: 8,
                      vertical: 4,
                    ),
                    decoration: BoxDecoration(
                      color: Colors.green.shade50,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: Colors.green.shade300),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Icon(
                          Icons.verified,
                          size: 14,
                          color: Colors.green.shade700,
                        ),
                        const SizedBox(width: 4),
                        Text(
                          'Đã xác minh',
                          style: TextStyle(
                            fontSize: 11,
                            color: Colors.green.shade700,
                            fontWeight: FontWeight.w600,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ],
            ),
            const SizedBox(height: 12),
            // Location
            if (step.location != null) ...[
              Row(
                children: [
                  Icon(Icons.location_on,
                      size: 16, color: Colors.grey.shade600),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      step.location!,
                      style: Theme.of(context).textTheme.bodyMedium,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
            // Description
            if (step.description != null) ...[
              Text(
                step.description!,
                style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                      color: Colors.grey.shade700,
                    ),
              ),
              const SizedBox(height: 8),
            ],
            // Performed By
            if (step.performedBy != null) ...[
              Row(
                children: [
                  Icon(Icons.person, size: 16, color: Colors.grey.shade600),
                  const SizedBox(width: 8),
                  Text(
                    'Thực hiện bởi: ${step.performedBy}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
            // Timestamp
            if (step.timestamp != null) ...[
              Row(
                children: [
                  Icon(Icons.access_time,
                      size: 16, color: Colors.grey.shade600),
                  const SizedBox(width: 8),
                  Text(
                    DateFormat('dd/MM/yyyy HH:mm').format(step.timestamp!),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey.shade600,
                        ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
            ],
            // Blockchain Hash từ metadata hoặc supply chain
            if (_getBlockchainHash() != null) ...[
              const Divider(),
              const SizedBox(height: 8),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Icon(
                    Icons.link,
                    size: 16,
                    color: Colors.blue.shade700,
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Blockchain Hash',
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    color: Colors.grey.shade600,
                                    fontWeight: FontWeight.w600,
                                  ),
                        ),
                        const SizedBox(height: 4),
                        SelectableText(
                          _getBlockchainHash()!,
                          style:
                              Theme.of(context).textTheme.bodySmall?.copyWith(
                                    fontFamily: 'monospace',
                                    fontSize: 11,
                                    color: Colors.blue.shade700,
                                  ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ],
            // Metadata (nếu có)
            if (step.metadata != null && step.metadata!.isNotEmpty) ...[
              const Divider(),
              const SizedBox(height: 8),
              ExpansionTile(
                title: Text(
                  'Thông tin chi tiết',
                  style: Theme.of(context).textTheme.bodySmall?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                ),
                children: [
                  ...step.metadata!.entries.map((entry) {
                    return Padding(
                      padding: const EdgeInsets.symmetric(
                        horizontal: 16,
                        vertical: 4,
                      ),
                      child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Expanded(
                            flex: 2,
                            child: Text(
                              '${entry.key}:',
                              style: Theme.of(context)
                                  .textTheme
                                  .bodySmall
                                  ?.copyWith(
                                    fontWeight: FontWeight.w600,
                                  ),
                            ),
                          ),
                          Expanded(
                            flex: 3,
                            child: Text(
                              entry.value.toString(),
                              style: Theme.of(context).textTheme.bodySmall,
                            ),
                          ),
                        ],
                      ),
                    );
                  }),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildStepStatusBadge(String status, Color color) {
    String label;
    Color badgeColor;

    switch (status) {
      case 'completed':
        label = 'Đã xong';
        badgeColor = Colors.green;
        break;
      case 'in_progress':
        label = 'Đang xử lý';
        badgeColor = Colors.blue;
        break;
      case 'issue':
        label = 'Có vấn đề';
        badgeColor = Colors.red;
        break;
      default:
        label = 'Chờ xử lý';
        badgeColor = Colors.orange;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: badgeColor.withOpacity(0.1),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: badgeColor, width: 1),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: badgeColor,
          fontSize: 11,
          fontWeight: FontWeight.w600,
        ),
      ),
    );
  }

  String _getStepStatus() {
    // Logic để xác định trạng thái dựa trên step data
    if (step.isVerified) {
      return 'completed';
    }
    if (step.timestamp != null) {
      return 'in_progress';
    }
    // Có thể kiểm tra metadata để xác định có vấn đề không
    if (step.metadata?['hasIssue'] == true ||
        step.metadata?['status'] == 'issue') {
      return 'issue';
    }
    return 'pending';
  }

  Color _getStepColor(String status) {
    switch (status) {
      case 'completed':
        return Colors.green;
      case 'in_progress':
        return Colors.blue;
      case 'issue':
        return Colors.red;
      default:
        return Colors.orange;
    }
  }

  IconData _getStepIcon(String type) {
    switch (type) {
      case 'manufacturing':
        return Icons.factory;
      case 'transportation':
        return Icons.local_shipping;
      case 'storage':
        return Icons.warehouse;
      case 'delivery':
        return Icons.local_hospital;
      case 'inspection':
        return Icons.verified_user;
      case 'quality_check':
        return Icons.check_circle;
      default:
        return Icons.circle;
    }
  }

  String _getStepTypeLabel(String type) {
    switch (type) {
      case 'manufacturing':
        return 'Sản xuất';
      case 'transportation':
        return 'Vận chuyển';
      case 'storage':
        return 'Lưu kho';
      case 'delivery':
        return 'Giao hàng';
      case 'inspection':
        return 'Kiểm định';
      case 'quality_check':
        return 'Kiểm tra chất lượng';
      default:
        return type;
    }
  }

  String? _getBlockchainHash() {
    // Ưu tiên lấy từ metadata của step
    if (step.metadata?['blockchainHash'] != null) {
      return step.metadata!['blockchainHash'] as String?;
    }
    if (step.metadata?['transactionHash'] != null) {
      return step.metadata!['transactionHash'] as String?;
    }
    // Nếu không có, dùng supply chain hash
    return supplyChainHash;
  }
}
