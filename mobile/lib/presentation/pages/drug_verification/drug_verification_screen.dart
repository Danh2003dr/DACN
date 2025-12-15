import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../core/api/dio_client.dart';
import '../../../core/providers/services_provider.dart';
import '../../../core/services/verification_history_service.dart';
import '../../../data/repositories_impl/drug_repository_impl.dart';
import '../../../domain/repositories_interfaces/drug_repository.dart';
import '../../../domain/usecases/verify_drug_usecase.dart';
import '../../../domain/entities/verification_history_entity.dart';
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
                final manufacturerObj =
                    cleanedDrugData['manufacturer'] as Map<String, dynamic>;
                cleanedDrugData['manufacturer'] = manufacturerObj['fullName'] ??
                    manufacturerObj['name'] ??
                    manufacturerObj['organizationInfo']?['name'] ??
                    manufacturerObj.toString();
              }

              // Convert manufacturerId (populated) to string if needed
              if (cleanedDrugData['manufacturerId'] is Map) {
                final manufacturerIdObj =
                    cleanedDrugData['manufacturerId'] as Map<String, dynamic>;
                cleanedDrugData['manufacturerId'] =
                    manufacturerIdObj['_id']?.toString() ??
                        manufacturerIdObj['id']?.toString() ??
                        manufacturerIdObj.toString();
              }

              // Convert description from object to string if needed
              if (cleanedDrugData['description'] is Map) {
                cleanedDrugData['description'] =
                    cleanedDrugData['description'].toString();
              }

              // Convert qrCode from object to string if needed
              if (cleanedDrugData['qrCode'] is Map) {
                final qrCodeObj =
                    cleanedDrugData['qrCode'] as Map<String, dynamic>;
                cleanedDrugData['qrCode'] = qrCodeObj['data']?.toString() ??
                    qrCodeObj['code']?.toString() ??
                    qrCodeObj.toString();
              }

              // Convert image from object to string if needed
              if (cleanedDrugData['image'] is Map) {
                final imageObj =
                    cleanedDrugData['image'] as Map<String, dynamic>;
                cleanedDrugData['image'] = imageObj['url']?.toString() ??
                    imageObj['path']?.toString() ??
                    imageObj.toString();
              }

              // Convert createdBy from object to string if needed
              if (cleanedDrugData['createdBy'] != null) {
                if (cleanedDrugData['createdBy'] is Map) {
                  final createdByObj =
                      cleanedDrugData['createdBy'] as Map<String, dynamic>;
                  // Ưu tiên lấy tên người dùng
                  final name = createdByObj['name'] ??
                      createdByObj['fullName'] ??
                      createdByObj['username'] ??
                      createdByObj['email'];
                  if (name != null) {
                    cleanedDrugData['createdBy'] = name.toString();
                  } else {
                    // Nếu không có tên, lấy ID
                    cleanedDrugData['createdBy'] =
                        createdByObj['_id']?.toString() ??
                            createdByObj['id']?.toString() ??
                            'Unknown';
                  }
                } else if (cleanedDrugData['createdBy'] is! String) {
                  // Nếu không phải Map và không phải String, convert sang string
                  cleanedDrugData['createdBy'] =
                      cleanedDrugData['createdBy'].toString();
                }
              }

              // Convert batchNumber from object to string if needed
              if (cleanedDrugData['batchNumber'] is Map) {
                cleanedDrugData['batchNumber'] =
                    cleanedDrugData['batchNumber'].toString();
              }

              // Convert drugId from object to string if needed
              if (cleanedDrugData['drugId'] is Map) {
                cleanedDrugData['drugId'] =
                    cleanedDrugData['drugId'].toString();
              }

              // Convert dates from various formats to ISO string if needed
              if (cleanedDrugData['manufactureDate'] != null &&
                  cleanedDrugData['manufactureDate'] is! String) {
                if (cleanedDrugData['manufactureDate'] is DateTime) {
                  cleanedDrugData['manufactureDate'] =
                      (cleanedDrugData['manufactureDate'] as DateTime)
                          .toIso8601String();
                } else {
                  cleanedDrugData['manufactureDate'] =
                      cleanedDrugData['manufactureDate'].toString();
                }
              }

              if (cleanedDrugData['expiryDate'] != null &&
                  cleanedDrugData['expiryDate'] is! String) {
                if (cleanedDrugData['expiryDate'] is DateTime) {
                  cleanedDrugData['expiryDate'] =
                      (cleanedDrugData['expiryDate'] as DateTime)
                          .toIso8601String();
                } else {
                  cleanedDrugData['expiryDate'] =
                      cleanedDrugData['expiryDate'].toString();
                }
              }

              if (cleanedDrugData['createdAt'] != null &&
                  cleanedDrugData['createdAt'] is! String) {
                if (cleanedDrugData['createdAt'] is DateTime) {
                  cleanedDrugData['createdAt'] =
                      (cleanedDrugData['createdAt'] as DateTime)
                          .toIso8601String();
                } else {
                  cleanedDrugData['createdAt'] =
                      cleanedDrugData['createdAt'].toString();
                }
              }

              if (cleanedDrugData['updatedAt'] != null &&
                  cleanedDrugData['updatedAt'] is! String) {
                if (cleanedDrugData['updatedAt'] is DateTime) {
                  cleanedDrugData['updatedAt'] =
                      (cleanedDrugData['updatedAt'] as DateTime)
                          .toIso8601String();
                } else {
                  cleanedDrugData['updatedAt'] =
                      cleanedDrugData['updatedAt'].toString();
                }
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

            // Save to verification history
            try {
              final historyService = VerificationHistoryService();
              await historyService.init();

              // Determine status from alertType and drug state
              String status = 'valid';
              if (alertType == 'error' || alertType == 'danger') {
                status = 'invalid';
              } else if (alertType == 'warning') {
                status = 'warning';
              } else if (data['isValid'] == false) {
                status = 'invalid';
              }

              // Check if expired or recalled from drug data
              if (drug.expiryDate != null &&
                  drug.expiryDate!.isBefore(DateTime.now())) {
                status = 'expired';
              }
              // Check recalled from metadata if available
              if (drug.metadata != null &&
                  drug.metadata!['isRecalled'] == true) {
                status = 'recalled';
              }

              final verificationEntity = VerificationHistoryEntity(
                id: '${drug.id}_${DateTime.now().millisecondsSinceEpoch}',
                drugId: drug.id,
                drugName: drug.name,
                batchNumber: drug.batchNumber,
                qrCode: widget.qrData,
                verifiedAt: DateTime.now(),
                status: status,
                message: data['message']?.toString() ?? warning,
                isBlockchainVerified: blockchainInfoMap != null &&
                    (blockchainInfoMap['isOnBlockchain'] == true ||
                        blockchainInfoMap['blockchainId'] != null),
                blockchainTransactionHash:
                    blockchainInfoMap?['transactionHash']?.toString(),
                drugData: drug.toJson(),
              );

              await historyService.saveVerification(verificationEntity);
            } catch (historyError) {
              // Log error but don't fail the verification
              print('Warning: Could not save to history: $historyError');
            }

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
              onPressed: () async {
                final transactionHash =
                    _blockchainInfo!['transactionHash'].toString();
                final network =
                    _blockchainInfo!['network']?.toString() ?? 'ethereum';

                // Determine blockchain explorer URL based on network
                String explorerUrl;
                if (network.toLowerCase().contains('bsc') ||
                    network.toLowerCase().contains('binance')) {
                  explorerUrl = 'https://bscscan.com/tx/$transactionHash';
                } else if (network.toLowerCase().contains('polygon')) {
                  explorerUrl = 'https://polygonscan.com/tx/$transactionHash';
                } else {
                  // Default to Ethereum
                  explorerUrl = 'https://etherscan.io/tx/$transactionHash';
                }

                final uri = Uri.parse(explorerUrl);
                if (await canLaunchUrl(uri)) {
                  await launchUrl(uri, mode: LaunchMode.externalApplication);
                } else {
                  if (mounted) {
                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Không thể mở blockchain explorer'),
                      ),
                    );
                  }
                }
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
          const SizedBox(height: 16),
          // Nút Xem chi tiết
          CustomButton(
            text: 'Xem chi tiết',
            onPressed: () => _showDetailDialog(drug),
            variant: ButtonVariant.outline,
            size: ButtonSize.medium,
            icon: Icons.info_outline,
            isFullWidth: true,
          ),
        ],
      ),
    );
  }

  void _showDetailDialog(DrugModel drug) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Header
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Chi tiết thuốc',
                        style:
                            Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              const Divider(),
              // Content
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Thông tin cơ bản
                      _buildDetailSection(
                        'Thông tin cơ bản',
                        [
                          _buildDetailRow('Tên thuốc', drug.name),
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
                              isExpired:
                                  drug.expiryDate!.isBefore(DateTime.now()),
                            ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Blockchain Info
                      if (_blockchainInfo != null)
                        _buildDetailSection(
                          'Thông tin Blockchain',
                          [
                            if (_blockchainInfo!['blockchainId'] != null)
                              _buildDetailRow(
                                'Blockchain ID',
                                _blockchainInfo!['blockchainId'].toString(),
                              ),
                            if (_blockchainInfo!['transactionHash'] != null)
                              _buildDetailRow(
                                'Transaction Hash',
                                _blockchainInfo!['transactionHash'].toString(),
                                isMonospace: true,
                              ),
                            if (_blockchainInfo!['blockNumber'] != null)
                              _buildDetailRow(
                                'Block Number',
                                _blockchainInfo!['blockNumber'].toString(),
                              ),
                            if (_blockchainInfo!['network'] != null)
                              _buildDetailRow(
                                'Network',
                                _blockchainInfo!['network'].toString(),
                              ),
                            if (_blockchainInfo!['isOnBlockchain'] != null)
                              _buildDetailRow(
                                'Trạng thái',
                                _blockchainInfo!['isOnBlockchain'] == true
                                    ? 'Đã ghi trên Blockchain'
                                    : 'Chưa ghi trên Blockchain',
                              ),
                          ],
                        ),
                      const SizedBox(height: 16),
                      // QR Code Info
                      if (drug.qrCode != null)
                        _buildDetailSection(
                          'Mã QR',
                          [
                            _buildDetailRow(
                              'QR Code',
                              drug.qrCode!,
                              isMonospace: true,
                            ),
                          ],
                        ),
                      const SizedBox(height: 16),
                      // Metadata
                      if (drug.metadata != null && drug.metadata!.isNotEmpty)
                        _buildDetailSection(
                          'Thông tin bổ sung',
                          drug.metadata!.entries.map((entry) {
                            return _buildDetailRow(
                              entry.key,
                              entry.value.toString(),
                            );
                          }).toList(),
                        ),
                      const SizedBox(height: 16),
                      // Timestamps
                      _buildDetailSection(
                        'Thông tin hệ thống',
                        [
                          if (drug.createdAt != null)
                            _buildDetailRow(
                              'Ngày tạo',
                              _formatDateTime(drug.createdAt!),
                            ),
                          if (drug.updatedAt != null)
                            _buildDetailRow(
                              'Ngày cập nhật',
                              _formatDateTime(drug.updatedAt!),
                            ),
                          if (drug.createdBy != null)
                            _buildDetailRow(
                              'Người tạo',
                              _formatCreatedBy(drug.createdBy!),
                            ),
                        ],
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildDetailSection(String title, List<Widget> children) {
    return CustomCard(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                ),
          ),
          const SizedBox(height: 12),
          ...children,
        ],
      ),
    );
  }

  Widget _buildDetailRow(String label, String value,
      {bool isExpired = false, bool isMonospace = false}) {
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
            child: SelectableText(
              value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w500,
                    color: isExpired ? Colors.red : null,
                    fontFamily: isMonospace ? 'monospace' : null,
                    fontSize: isMonospace ? 12 : null,
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
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Chuỗi cung ứng',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            if (_supplyChains.isNotEmpty)
              TextButton.icon(
                onPressed: () {
                  // Mở màn hình timeline chi tiết
                  final firstChain = _supplyChains.first;
                  context.pushNamed(
                    'supply-chain-timeline',
                    extra: {
                      'supplyChain': firstChain,
                      'drugId': _drug?.id,
                    },
                  );
                },
                icon: const Icon(Icons.timeline, size: 18),
                label: const Text('Xem chi tiết'),
              ),
          ],
        ),
        const SizedBox(height: 12),
        if (_supplyChains.isNotEmpty)
          ..._supplyChains.map((chain) => CustomCard(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    SupplyChainTimeline(
                      supplyChain: chain,
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        onPressed: () {
                          context.pushNamed(
                            'supply-chain-timeline',
                            extra: {
                              'supplyChain': chain,
                              'drugId': _drug?.id,
                            },
                          );
                        },
                        icon: const Icon(Icons.arrow_forward, size: 18),
                        label: const Text('Xem hành trình đầy đủ'),
                      ),
                    ),
                  ],
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
                onTap: () => _showTransactionDetailDialog(tx),
              ),
            )),
      ],
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }

  String _formatCreatedBy(dynamic createdBy) {
    if (createdBy == null) return 'N/A';

    // Nếu là string, trả về trực tiếp
    if (createdBy is String) {
      // Nếu là ObjectId (24 ký tự hex), chỉ hiển thị 8 ký tự đầu
      if (createdBy.length == 24 &&
          RegExp(r'^[0-9a-fA-F]+$').hasMatch(createdBy)) {
        return 'ID: ${createdBy.substring(0, 8)}...';
      }
      return createdBy;
    }

    // Nếu là Map/Object, tìm tên người dùng
    if (createdBy is Map) {
      final createdByMap = createdBy as Map<String, dynamic>;

      // Ưu tiên tìm tên người dùng
      final name = createdByMap['name'] ??
          createdByMap['fullName'] ??
          createdByMap['username'] ??
          createdByMap['email'];

      if (name != null && name is String) {
        return name;
      }

      // Nếu không có tên, lấy ID
      final id = createdByMap['_id'] ?? createdByMap['id'];
      if (id != null) {
        final idStr = id.toString();
        if (idStr.length == 24 && RegExp(r'^[0-9a-fA-F]+$').hasMatch(idStr)) {
          return 'ID: ${idStr.substring(0, 8)}...';
        }
        return idStr;
      }

      // Fallback: hiển thị số lượng keys
      return 'User (${createdByMap.length} fields)';
    }

    // Fallback cuối cùng
    return createdBy.toString();
  }

  String _formatDateTime(DateTime date) {
    return '${date.day}/${date.month}/${date.year} ${date.hour.toString().padLeft(2, '0')}:${date.minute.toString().padLeft(2, '0')}';
  }

  void _showTransactionDetailDialog(BlockchainTransactionModel tx) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => DraggableScrollableSheet(
        initialChildSize: 0.9,
        minChildSize: 0.5,
        maxChildSize: 0.95,
        builder: (context, scrollController) => Container(
          decoration: BoxDecoration(
            color: Theme.of(context).scaffoldBackgroundColor,
            borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
          ),
          child: Column(
            children: [
              // Handle bar
              Container(
                margin: const EdgeInsets.symmetric(vertical: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: Colors.grey.shade300,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
              // Header
              Padding(
                padding:
                    const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        'Chi tiết giao dịch',
                        style:
                            Theme.of(context).textTheme.headlineSmall?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                      ),
                    ),
                    IconButton(
                      icon: const Icon(Icons.close),
                      onPressed: () => Navigator.of(context).pop(),
                    ),
                  ],
                ),
              ),
              const Divider(),
              // Content
              Expanded(
                child: SingleChildScrollView(
                  controller: scrollController,
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      // Status badge
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 12, vertical: 8),
                        decoration: BoxDecoration(
                          color: tx.status == 'confirmed'
                              ? Colors.green.shade50
                              : Colors.orange.shade50,
                          borderRadius: BorderRadius.circular(8),
                          border: Border.all(
                            color: tx.status == 'confirmed'
                                ? Colors.green.shade300
                                : Colors.orange.shade300,
                          ),
                        ),
                        child: Row(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            Icon(
                              tx.status == 'confirmed'
                                  ? Icons.check_circle
                                  : Icons.pending,
                              color: tx.status == 'confirmed'
                                  ? Colors.green.shade700
                                  : Colors.orange.shade700,
                              size: 20,
                            ),
                            const SizedBox(width: 8),
                            Text(
                              tx.status == 'confirmed'
                                  ? 'Đã xác nhận'
                                  : 'Đang chờ',
                              style: TextStyle(
                                fontWeight: FontWeight.w600,
                                color: tx.status == 'confirmed'
                                    ? Colors.green.shade700
                                    : Colors.orange.shade700,
                              ),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      // Transaction Info
                      _buildDetailSection(
                        'Thông tin giao dịch',
                        [
                          _buildDetailRow(
                            'Transaction Hash',
                            tx.transactionHash,
                            isMonospace: true,
                          ),
                          if (tx.blockNumber != null)
                            _buildDetailRow(
                              'Block Number',
                              tx.blockNumber.toString(),
                            ),
                          _buildDetailRow('Network', tx.network),
                          if (tx.transactionType != null)
                            _buildDetailRow(
                                'Loại giao dịch', tx.transactionType!),
                          if (tx.timestamp != null)
                            _buildDetailRow(
                              'Thời gian',
                              _formatDateTime(tx.timestamp!),
                            ),
                          if (tx.confirmations != null)
                            _buildDetailRow(
                              'Số lần xác nhận',
                              tx.confirmations.toString(),
                            ),
                        ],
                      ),
                      const SizedBox(height: 16),
                      // Drug Info
                      if (tx.drugName != null || tx.drugId != null)
                        _buildDetailSection(
                          'Thông tin thuốc',
                          [
                            if (tx.drugName != null)
                              _buildDetailRow('Tên thuốc', tx.drugName!),
                            if (tx.drugId != null)
                              _buildDetailRow(
                                'ID thuốc',
                                tx.drugId!,
                                isMonospace: true,
                              ),
                          ],
                        ),
                      const SizedBox(height: 16),
                      // Addresses
                      if (tx.from != null || tx.to != null)
                        _buildDetailSection(
                          'Địa chỉ',
                          [
                            if (tx.from != null)
                              _buildDetailRow(
                                'Từ',
                                tx.from!,
                                isMonospace: true,
                              ),
                            if (tx.to != null)
                              _buildDetailRow(
                                'Đến',
                                tx.to!,
                                isMonospace: true,
                              ),
                            if (tx.contractAddress != null)
                              _buildDetailRow(
                                'Contract Address',
                                tx.contractAddress!,
                                isMonospace: true,
                              ),
                          ],
                        ),
                      const SizedBox(height: 16),
                      // Gas Info
                      if (tx.gasUsed != null || tx.gasPrice != null)
                        _buildDetailSection(
                          'Gas',
                          [
                            if (tx.gasUsed != null)
                              _buildDetailRow(
                                'Gas Used',
                                tx.gasUsed.toString(),
                              ),
                            if (tx.gasPrice != null)
                              _buildDetailRow(
                                'Gas Price',
                                tx.gasPrice!,
                                isMonospace: true,
                              ),
                          ],
                        ),
                      const SizedBox(height: 16),
                      // Value
                      if (tx.value != null)
                        _buildDetailSection(
                          'Giá trị',
                          [
                            _buildDetailRow(
                              'Value',
                              tx.value!,
                              isMonospace: true,
                            ),
                          ],
                        ),
                      const SizedBox(height: 16),
                      // Metadata
                      if (tx.metadata != null && tx.metadata!.isNotEmpty)
                        _buildDetailSection(
                          'Metadata',
                          tx.metadata!.entries.map((entry) {
                            return _buildDetailRow(
                              entry.key,
                              entry.value.toString(),
                              isMonospace: entry.value.toString().length > 20,
                            );
                          }).toList(),
                        ),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
