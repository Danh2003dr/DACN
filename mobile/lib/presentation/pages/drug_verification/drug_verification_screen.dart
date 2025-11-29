import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/api/dio_client.dart';
import '../../../core/providers/services_provider.dart';
import '../../../data/repositories_impl/drug_repository_impl.dart';
import '../../../domain/repositories_interfaces/drug_repository.dart';
import '../../../domain/usecases/verify_drug_usecase.dart';
import '../../../data/models/drug_model.dart';
import '../../../data/models/supply_chain_model.dart';
import '../../../data/models/blockchain_transaction_model.dart';
import '../../widgets/supply_chain_timeline.dart';
import '../../widgets/custom_card.dart';
import '../../widgets/custom_button.dart';
import '../../widgets/loading_overlay.dart';

final drugRepositoryProvider = Provider<DrugRepository>((ref) {
  final connectivityService = ref.read(connectivityServiceProvider);
  final syncService = ref.read(syncServiceProvider);
  return DrugRepositoryImpl(
    DioClient(),
    connectivityService: connectivityService,
    syncService: syncService,
  );
});

final verifyDrugUseCaseProvider = Provider<VerifyDrugUseCase>((ref) {
  return VerifyDrugUseCase(ref.read(drugRepositoryProvider));
});

class DrugVerificationScreen extends ConsumerStatefulWidget {
  final String qrData;

  const DrugVerificationScreen({
    super.key,
    required this.qrData,
  });

  @override
  ConsumerState<DrugVerificationScreen> createState() =>
      _DrugVerificationScreenState();
}

class _DrugVerificationScreenState
    extends ConsumerState<DrugVerificationScreen> {
  bool _isLoading = true;
  String? _errorMessage;
  DrugModel? _drug;
  List<SupplyChainModel> _supplyChains = [];
  List<BlockchainTransactionModel> _blockchainTransactions = [];
  Map<String, dynamic>? _blockchainInfo;
  String? _warning;
  String? _alertType;

  @override
  void initState() {
    super.initState();
    _verifyDrug();
  }

  Future<void> _verifyDrug() async {
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      final verifyUseCase = ref.read(verifyDrugUseCaseProvider);
      final result = await verifyUseCase(widget.qrData);

      result.fold(
        (failure) {
          setState(() {
            _errorMessage = failure.message;
            _isLoading = false;
          });
        },
        (data) async {
          try {
            // Parse drug data - could be Map or DrugModel
            final drugData = data['drug'];
            DrugModel drug;

            if (drugData is DrugModel) {
              drug = drugData;
            } else if (drugData is Map<String, dynamic>) {
              // Handle nested objects that might be populated (e.g., manufacturer)
              final cleanedDrugData = Map<String, dynamic>.from(drugData);

              // Convert manufacturer object to string if needed
              if (cleanedDrugData['manufacturer'] is Map) {
                final manufacturerObj = cleanedDrugData['manufacturer'] as Map;
                cleanedDrugData['manufacturer'] = manufacturerObj['fullName'] ??
                    manufacturerObj['name'] ??
                    manufacturerObj.toString();
              }

              // Ensure id is present
              cleanedDrugData['id'] = cleanedDrugData['id'] ??
                  cleanedDrugData['_id']?.toString() ??
                  drugData['drugId'] ??
                  '';

              drug = DrugModel.fromJson(cleanedDrugData);
            } else {
              throw Exception(
                  'Invalid drug data type: ${drugData.runtimeType}');
            }

            // Parse blockchainInfo - handle null and type safety
            final blockchainInfo = data['blockchainInfo'];
            final blockchainInfoMap =
                blockchainInfo is Map<String, dynamic> ? blockchainInfo : null;

            // Parse warning and alertType - handle both String and Map
            final warningData = data['warning'];
            final warning = warningData is String
                ? warningData
                : warningData is Map
                    ? warningData.toString()
                    : warningData?.toString();

            final alertTypeData = data['alertType'];
            final alertType = alertTypeData is String
                ? alertTypeData
                : alertTypeData is Map
                    ? alertTypeData.toString()
                    : alertTypeData?.toString();

            // Load supply chains
            final drugRepo = ref.read(drugRepositoryProvider);
            final supplyChainsResult =
                await drugRepo.getDrugSupplyChains(drug.id);
            final supplyChains = supplyChainsResult.fold(
              (failure) => <SupplyChainModel>[],
              (chains) =>
                  chains.map((e) => SupplyChainModel.fromEntity(e)).toList(),
            );

            // Load blockchain transactions
            final transactionsResult =
                await drugRepo.getDrugBlockchainTransactions(drug.id);
            final transactions = transactionsResult.fold(
              (failure) => <BlockchainTransactionModel>[],
              (txs) => txs
                  .map((e) => BlockchainTransactionModel.fromEntity(e))
                  .toList(),
            );

            if (mounted) {
              setState(() {
                _drug = drug;
                _supplyChains = supplyChains;
                _blockchainTransactions = transactions;
                _blockchainInfo = blockchainInfoMap;
                _warning = warning;
                _alertType = alertType;
                _isLoading = false;
              });
            }
          } catch (parseError) {
            if (mounted) {
              setState(() {
                _errorMessage =
                    'Lỗi khi xử lý dữ liệu: ${parseError.toString()}';
                _isLoading = false;
              });
            }
          }
        },
      );
    } catch (e) {
      setState(() {
        _errorMessage = 'Lỗi không xác định: ${e.toString()}';
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return LoadingOverlay(
      isLoading: _isLoading,
      message: 'Đang xác minh thuốc...',
      child: Scaffold(
        appBar: AppBar(
          title: const Text('Xác minh thuốc'),
          actions: [
            IconButton(
              icon: const Icon(Icons.refresh),
              onPressed: _isLoading ? null : _verifyDrug,
              tooltip: 'Làm mới',
            ),
          ],
        ),
        body: _errorMessage != null
            ? _buildErrorView()
            : _drug != null
                ? _buildSuccessView()
                : _buildEmptyView(),
      ),
    );
  }

  Widget _buildErrorView() {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              Icons.error_outline,
              size: 64,
              color: Theme.of(context).colorScheme.error,
            ),
            const SizedBox(height: 16),
            Text(
              _errorMessage!,
              style: Theme.of(context).textTheme.titleLarge,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            CustomButton(
              text: 'Quay lại',
              onPressed: () => context.pop(),
              variant: ButtonVariant.outline,
              isFullWidth: true,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmptyView() {
    return const Center(
      child: Text('Không tìm thấy thông tin thuốc'),
    );
  }

  Widget _buildSuccessView() {
    final drug = _drug!;
    final isBlockchainVerified = _blockchainInfo != null &&
        _blockchainInfo!['isOnBlockchain'] == true &&
        _blockchainInfo!['transactionHash'] != null;

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Alert/Warning Banner
          if (_alertType != null || _warning != null) _buildAlertBanner(),

          // Blockchain Verified Badge
          if (isBlockchainVerified) _buildBlockchainBadge(),

          const SizedBox(height: 16),

          // Drug Details Card
          _buildDrugDetailsCard(drug),

          const SizedBox(height: 16),

          // Supply Chain Timeline
          if (_supplyChains.isNotEmpty) _buildSupplyChainSection(),

          const SizedBox(height: 16),

          // Blockchain Transactions
          if (_blockchainTransactions.isNotEmpty) _buildBlockchainSection(),
        ],
      ),
    );
  }

  Widget _buildAlertBanner() {
    Color backgroundColor;
    IconData icon;
    String message;

    if (_alertType == 'recalled') {
      backgroundColor = Colors.red.shade100;
      icon = Icons.warning;
      message = 'CẢNH BÁO: Lô thuốc này đã bị thu hồi!';
    } else if (_alertType == 'expired') {
      backgroundColor = Colors.orange.shade100;
      icon = Icons.error_outline;
      message = 'CẢNH BÁO: Thuốc đã hết hạn sử dụng!';
    } else if (_warning != null) {
      backgroundColor = Colors.yellow.shade100;
      icon = Icons.info_outline;
      message = _warning!;
    } else {
      backgroundColor = Colors.blue.shade100;
      icon = Icons.info_outline;
      message = 'Thông tin thuốc';
    }

    return Container(
      padding: const EdgeInsets.all(16),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: backgroundColor,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: backgroundColor.computeLuminance() > 0.5
              ? Colors.black26
              : Colors.white24,
        ),
      ),
      child: Row(
        children: [
          Icon(icon, color: Colors.black87),
          const SizedBox(width: 12),
          Expanded(
            child: Text(
              message,
              style: const TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildBlockchainBadge() {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
      margin: const EdgeInsets.only(bottom: 16),
      decoration: BoxDecoration(
        color: Colors.green.shade50,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: Colors.green.shade300),
      ),
      child: Row(
        children: [
          Icon(Icons.verified, color: Colors.green.shade700),
          const SizedBox(width: 12),
          const Expanded(
            child: Text(
              'Đã xác minh trên Blockchain',
              style: TextStyle(
                fontWeight: FontWeight.w600,
                color: Colors.green,
              ),
            ),
          ),
          if (_blockchainInfo!['transactionHash'] != null)
            IconButton(
              icon: const Icon(Icons.open_in_new, size: 20),
              onPressed: () {
                // TODO: Open blockchain explorer
              },
              tooltip: 'Xem trên Blockchain Explorer',
            ),
        ],
      ),
    );
  }

  Widget _buildDrugDetailsCard(DrugModel drug) {
    return CustomCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(
                  drug.name,
                  style: Theme.of(context).textTheme.headlineMedium,
                ),
              ),
              if (drug.image != null)
                ClipRRect(
                  borderRadius: BorderRadius.circular(8),
                  child: Image.network(
                    drug.image!,
                    width: 80,
                    height: 80,
                    fit: BoxFit.cover,
                    errorBuilder: (context, error, stackTrace) =>
                        const Icon(Icons.image, size: 80),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 16),
          _buildDetailRow('Mã thuốc', drug.drugId ?? 'N/A'),
          _buildDetailRow('Số lô', drug.batchNumber ?? 'N/A'),
          if (drug.manufacturer != null)
            _buildDetailRow('Nhà sản xuất', drug.manufacturer!),
          if (drug.manufactureDate != null)
            _buildDetailRow(
              'Ngày sản xuất',
              _formatDate(drug.manufactureDate!),
            ),
          if (drug.expiryDate != null)
            _buildDetailRow(
              'Hạn sử dụng',
              _formatDate(drug.expiryDate!),
              isExpired: drug.expiryDate!.isBefore(DateTime.now()),
            ),
          if (drug.description != null) ...[
            const SizedBox(height: 8),
            const Divider(),
            const SizedBox(height: 8),
            Text(
              'Mô tả',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            const SizedBox(height: 4),
            Text(
              drug.description!,
              style: Theme.of(context).textTheme.bodyMedium,
            ),
          ],
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value, {bool isExpired = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(
              label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: isExpired ? Colors.red : null,
                  ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSupplyChainSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Chuỗi cung ứng',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        if (_supplyChains.isNotEmpty)
          ..._supplyChains.map((chain) => CustomCard(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                child: SupplyChainTimeline(
                  supplyChain: chain,
                ),
              )),
      ],
    );
  }

  Widget _buildBlockchainSection() {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Giao dịch Blockchain',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        ..._blockchainTransactions.map((tx) => CustomCard(
              margin: const EdgeInsets.only(bottom: 8),
              padding: EdgeInsets.zero,
              child: ListTile(
                leading: Icon(
                  tx.status == 'confirmed' ? Icons.check_circle : Icons.pending,
                  color:
                      tx.status == 'confirmed' ? Colors.green : Colors.orange,
                ),
                title: Text(
                  '${tx.transactionHash.substring(0, 10)}...',
                  style: const TextStyle(fontFamily: 'monospace'),
                ),
                subtitle: Text(
                  'Block: ${tx.blockNumber ?? 'N/A'} | ${tx.network}',
                ),
                trailing: Text(
                  tx.status,
                  style: TextStyle(
                    color:
                        tx.status == 'confirmed' ? Colors.green : Colors.orange,
                    fontWeight: FontWeight.w600,
                  ),
                ),
                onTap: () {
                  // TODO: Show transaction details
                },
              ),
            )),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
