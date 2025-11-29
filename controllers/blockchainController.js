const blockchainService = require('../services/blockchainService');
const BlockchainTransaction = require('../models/BlockchainTransaction');

/**
 * @desc    Lấy danh sách transactions gần nhất
 * @route   GET /api/blockchain/transactions
 * @access  Private
 */
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, drugId, network, status } = req.query;

    // Initialize blockchain if needed
    if (!blockchainService.isInitialized) {
      await blockchainService.initialize();
    }

    // Get transactions from service
    const result = await blockchainService.getRecentTransactions({
      page: parseInt(page),
      limit: parseInt(limit),
      drugId: drugId || null,
      network: network || null,
      status: status || null
    });

    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          transactions: result.transactions,
          pagination: result.pagination
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Không thể lấy danh sách transactions',
        error: result.error
      });
    }
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách transactions',
      error: error.message
    });
  }
};

/**
 * @desc    Verify transaction on blockchain
 * @route   POST /api/blockchain/verify-transaction
 * @access  Private
 */
const verifyTransaction = async (req, res) => {
  try {
    const { txHash } = req.body;

    if (!txHash) {
      return res.status(400).json({
        success: false,
        message: 'Transaction hash không được để trống'
      });
    }

    // Validate transaction hash format
    if (!/^0x[a-fA-F0-9]{64}$/.test(txHash)) {
      return res.status(400).json({
        success: false,
        message: 'Transaction hash không hợp lệ'
      });
    }

    // Initialize blockchain if needed
    if (!blockchainService.isInitialized) {
      await blockchainService.initialize();
    }

    // Verify transaction on chain
    const result = await blockchainService.verifyTransactionOnChain(txHash);

    if (result.success) {
      res.status(200).json({
        success: true,
        data: {
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          confirmations: result.confirmations,
          gasUsed: result.gasUsed,
          status: result.status,
          isValid: result.isValid,
          from: result.from,
          to: result.to,
          network: result.network,
          contractAddress: result.contractAddress,
          timestamp: result.timestamp,
          explorerUrl: result.explorerUrl
        }
      });
    } else {
      res.status(404).json({
        success: false,
        message: result.error || 'Không thể verify transaction',
        data: {
          transactionHash: txHash,
          status: result.status || 'not_found'
        }
      });
    }
  } catch (error) {
    console.error('Verify transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi verify transaction',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thông tin chi tiết transaction
 * @route   GET /api/blockchain/transaction/:txHash
 * @access  Private
 */
const getTransactionDetails = async (req, res) => {
  try {
    const { txHash } = req.params;

    if (!txHash) {
      return res.status(400).json({
        success: false,
        message: 'Transaction hash không được để trống'
      });
    }

    // Get from database first
    const transaction = await BlockchainTransaction.findByHash(txHash);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction không tồn tại trong database'
      });
    }

    // Initialize blockchain if needed
    if (!blockchainService.isInitialized) {
      await blockchainService.initialize();
    }

    // Verify on chain to get latest status
    const verifyResult = await blockchainService.verifyTransactionOnChain(txHash);

    res.status(200).json({
      success: true,
      data: {
        ...transaction,
        ...(verifyResult.success ? {
          confirmations: verifyResult.confirmations,
          status: verifyResult.status,
          isValid: verifyResult.isValid,
          explorerUrl: verifyResult.explorerUrl
        } : {})
      }
    });
  } catch (error) {
    console.error('Get transaction details error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin transaction',
      error: error.message
    });
  }
};

module.exports = {
  getTransactions,
  verifyTransaction,
  getTransactionDetails
};

