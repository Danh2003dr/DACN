import 'package:equatable/equatable.dart';

class BlockchainTransactionEntity extends Equatable {
  final String id;
  final String transactionHash;
  final int? blockNumber;
  final String? drugId;
  final String? drugName;
  final String? from;
  final String? to;
  final int? gasUsed;
  final String? gasPrice;
  final DateTime? timestamp;
  final String status; // 'pending', 'confirmed', 'failed'
  final String network; // 'ethereum', 'polygon', 'bsc'
  final String? contractAddress;
  final String? value;
  final String? transactionType;
  final Map<String, dynamic>? metadata;
  final int? confirmations;

  const BlockchainTransactionEntity({
    required this.id,
    required this.transactionHash,
    this.blockNumber,
    this.drugId,
    this.drugName,
    this.from,
    this.to,
    this.gasUsed,
    this.gasPrice,
    this.timestamp,
    this.status = 'pending',
    this.network = 'ethereum',
    this.contractAddress,
    this.value,
    this.transactionType,
    this.metadata,
    this.confirmations,
  });

  @override
  List<Object?> get props => [
    id,
    transactionHash,
    blockNumber,
    drugId,
    drugName,
    from,
    to,
    gasUsed,
    gasPrice,
    timestamp,
    status,
    network,
    contractAddress,
    value,
    transactionType,
    metadata,
    confirmations,
  ];
}
