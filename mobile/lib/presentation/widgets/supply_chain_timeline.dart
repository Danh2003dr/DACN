import 'package:flutter/material.dart';
import 'package:intl/intl.dart';

import '../../data/models/supply_chain_model.dart';
import '../../data/models/supply_chain_step_model.dart';

class SupplyChainTimeline extends StatelessWidget {
  final SupplyChainModel supplyChain;

  const SupplyChainTimeline({
    super.key,
    required this.supplyChain,
  });

  @override
  Widget build(BuildContext context) {
    if (supplyChain.steps.isEmpty) {
      return const Text('Chưa có thông tin chuỗi cung ứng');
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Trạng thái: ${supplyChain.status}',
          style: Theme.of(context).textTheme.titleMedium,
        ),
        const SizedBox(height: 16),
        ...supplyChain.steps.asMap().entries.map((entry) {
          final index = entry.key;
          final stepEntity = entry.value;
          final isLast = index == supplyChain.steps.length - 1;

          // Convert to model if needed
          final step = stepEntity is SupplyChainStepModel
              ? stepEntity
              : SupplyChainStepModel.fromEntity(stepEntity);

          return _buildTimelineItem(context, step, isLast);
        }),
      ],
    );
  }

  Widget _buildTimelineItem(
    BuildContext context,
    SupplyChainStepModel step,
    bool isLast,
  ) {
    IconData icon;
    Color iconColor;

    switch (step.type) {
      case 'manufacturing':
        icon = Icons.factory;
        iconColor = Colors.blue;
        break;
      case 'transportation':
        icon = Icons.local_shipping;
        iconColor = Colors.orange;
        break;
      case 'storage':
        icon = Icons.warehouse;
        iconColor = Colors.purple;
        break;
      case 'delivery':
        icon = Icons.local_hospital;
        iconColor = Colors.green;
        break;
      default:
        icon = Icons.circle;
        iconColor = Colors.grey;
    }

    return Row(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Timeline line and icon
        Column(
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: iconColor.withOpacity(0.1),
                shape: BoxShape.circle,
                border: Border.all(color: iconColor, width: 2),
              ),
              child: Icon(icon, color: iconColor, size: 20),
            ),
            if (!isLast)
              Container(
                width: 2,
                height: 60,
                color: Colors.grey.shade300,
              ),
          ],
        ),
        const SizedBox(width: 12),
        // Content
        Expanded(
          child: Padding(
            padding: const EdgeInsets.only(bottom: 16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: Text(
                        _getStepTypeLabel(step.type),
                        style:
                            Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                      ),
                    ),
                    if (step.isVerified)
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
                                fontSize: 12,
                                color: Colors.green.shade700,
                                fontWeight: FontWeight.w600,
                              ),
                            ),
                          ],
                        ),
                      ),
                  ],
                ),
                if (step.location != null) ...[
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Icon(Icons.location_on, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Expanded(
                        child: Text(
                          step.location!,
                          style: Theme.of(context).textTheme.bodySmall,
                        ),
                      ),
                    ],
                  ),
                ],
                if (step.description != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    step.description!,
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
                if (step.timestamp != null) ...[
                  const SizedBox(height: 4),
                  Text(
                    DateFormat('dd/MM/yyyy HH:mm').format(step.timestamp!),
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: Colors.grey,
                        ),
                  ),
                ],
              ],
            ),
          ),
        ),
      ],
    );
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
      default:
        return type;
    }
  }
}
