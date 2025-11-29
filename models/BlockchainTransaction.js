const mongoose = require('mongoose');
// Ensure Drug model is loaded for populate
require('./Drug');

const blockchainTransactionSchema = new mongoose.Schema({
  // Transaction hash (unique identifier)
  transactionHash: {
    type: String,
    required: [true, 'Transaction hash là bắt buộc'],
    unique: true,
    index: true,
    trim: true
  },

  // Block information
  blockNumber: {
    type: Number,
    required: [true, 'Block number là bắt buộc'],
    index: true
  },

  // Related drug
  drugId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Drug',
    index: true
  },

  // Transaction addresses
  from: {
    type: String,
    required: [true, 'From address là bắt buộc'],
    trim: true
  },

  to: {
    type: String,
    required: [true, 'To address là bắt buộc'],
    trim: true
  },

  // Gas information
  gasUsed: {
    type: Number,
    default: 0
  },

  gasPrice: {
    type: String,
    default: '0'
  },

  // Transaction timestamp
  timestamp: {
    type: Date,
    required: [true, 'Timestamp là bắt buộc'],
    index: true,
    default: Date.now
  },

  // Transaction status
  status: {
    type: String,
    enum: ['success', 'failed', 'pending'],
    default: 'success',
    index: true
  },

  // Network information
  network: {
    type: String,
    required: [true, 'Network là bắt buộc'],
    default: 'development',
    index: true
  },

  // Contract address
  contractAddress: {
    type: String,
    trim: true
  },

  // Transaction value (in Wei)
  value: {
    type: String,
    default: '0'
  },

  // Transaction type (e.g., 'createDrugBatch', 'updateDrugBatch', 'recallDrugBatch', 'recordDistribution')
  transactionType: {
    type: String,
    trim: true
  },

  // Additional metadata
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  // Confirmations count
  confirmations: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true, // Adds createdAt and updatedAt
  collection: 'blockchain_transactions'
});

// Indexes for better query performance
blockchainTransactionSchema.index({ timestamp: -1 }); // For sorting by newest
blockchainTransactionSchema.index({ drugId: 1, timestamp: -1 }); // For filtering by drug
blockchainTransactionSchema.index({ network: 1, timestamp: -1 }); // For filtering by network
blockchainTransactionSchema.index({ status: 1, timestamp: -1 }); // For filtering by status

// Static method to get recent transactions with pagination
blockchainTransactionSchema.statics.getRecentTransactions = async function({ page = 1, limit = 20, drugId = null, network = null, status = null }) {
  try {
    const skip = (page - 1) * limit;
    
    // Build filter
    const filter = {};
    if (drugId) {
      filter.drugId = drugId;
    }
    if (network) {
      filter.network = network;
    }
    if (status) {
      filter.status = status;
    }

    // Get transactions
    const transactions = await this.find(filter)
      .populate({
        path: 'drugId',
        select: 'name batchNumber drugId',
        model: 'Drug'
      })
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Get total count
    const total = await this.countDocuments(filter);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  } catch (error) {
    throw error;
  }
};

// Static method to find transaction by hash
blockchainTransactionSchema.statics.findByHash = async function(transactionHash) {
  try {
    return await this.findOne({ transactionHash })
      .populate({
        path: 'drugId',
        select: 'name batchNumber drugId',
        model: 'Drug'
      })
      .lean();
  } catch (error) {
    throw error;
  }
};

// Instance method to update confirmations
blockchainTransactionSchema.methods.updateConfirmations = async function(currentBlockNumber) {
  if (this.blockNumber && currentBlockNumber) {
    this.confirmations = Math.max(0, currentBlockNumber - this.blockNumber);
    await this.save();
  }
  return this.confirmations;
};

const BlockchainTransaction = mongoose.model('BlockchainTransaction', blockchainTransactionSchema);

module.exports = BlockchainTransaction;

