const blockchainService = require('../services/blockchainService');
const BlockchainTransaction = require('../models/BlockchainTransaction');

/**
 * @desc    Lấy danh sách transactions gần nhất
 * @route   GET /api/blockchain/transactions
 * @access  Private
 */
const getTransactions = async (req, res) => {
  try {
    const { page = 1, limit = 20, drugId, network, status, search } = req.query;

    console.log('\n========== Blockchain Explorer - API Call ==========');
    console.log('Request params:', { page, limit, drugId, network, status, search });
    console.log('Mongoose connection state:', require('mongoose').connection.readyState);

    // Initialize blockchain if needed
    if (!blockchainService.isInitialized) {
      console.log('Initializing blockchain service...');
      await blockchainService.initialize();
    }

    // Get transactions from service
    console.log('Calling blockchainService.getRecentTransactions...');
    const result = await blockchainService.getRecentTransactions({
      page: parseInt(page),
      limit: parseInt(limit),
      drugId: drugId || null,
      network: network || null,
      status: status || null,
      search: search || null
    });

    console.log('Service result:', {
      success: result.success,
      transactionsCount: result.transactions?.length || 0,
      hasTransactions: !!result.transactions,
      transactionsType: Array.isArray(result.transactions) ? 'array' : typeof result.transactions,
      pagination: result.pagination,
      error: result.error
    });

    if (result.success) {
      // Ensure transactions is always an array (empty array is valid - means no transactions found)
      const transactions = Array.isArray(result.transactions) ? result.transactions : [];
      const pagination = result.pagination || { page: 1, limit: 20, total: 0, pages: 0 };
      
      console.log('✅ Sending SUCCESS response with', transactions.length, 'transactions');
      console.log('Pagination:', pagination);
      console.log('==================================================\n');
      
      res.status(200).json({
        success: true,
        data: {
          transactions,
          pagination
        }
      });
    } else {
      // Log detailed error information
      console.error('❌ Service returned error or empty result');
      console.error('Result object:', result);
      console.error('Result type:', typeof result);
      console.error('Result keys:', result ? Object.keys(result) : 'null');
      console.error('Result.success:', result?.success);
      console.error('Result.transactions:', result?.transactions);
      console.error('Result.transactions type:', Array.isArray(result?.transactions) ? 'array' : typeof result?.transactions);
      console.error('Result.transactions length:', result?.transactions?.length);
      console.error('Result.error:', result?.error);
      console.error('Result.pagination:', result?.pagination);
      console.error('Full result JSON:', JSON.stringify(result, null, 2));
      console.error('==================================================\n');
      
      // Return error response instead of empty success
      res.status(200).json({
        success: false,
        message: result?.error || result?.message || 'Không thể lấy danh sách transactions',
        data: {
          transactions: [],
          pagination: {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20,
            total: 0,
            pages: 0
          }
        },
        error: result?.error || result?.message || 'Unknown error',
        debug: {
          resultType: typeof result,
          resultKeys: result ? Object.keys(result) : [],
          hasTransactions: !!result?.transactions,
          transactionsType: Array.isArray(result?.transactions) ? 'array' : typeof result?.transactions,
          transactionsLength: result?.transactions?.length || 0
        }
      });
    }
  } catch (error) {
    console.error('\n========== Blockchain Explorer - ERROR ==========');
    console.error('Error:', error.message);
    console.error('Error name:', error.name);
    console.error('Error stack:', error.stack);
    console.error('==================================================\n');
    
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

