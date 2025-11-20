const mongoose = require('mongoose');

const batchItemSchema = new mongoose.Schema(
  {
    targetId: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    targetType: {
      type: String,
      enum: ['drug', 'supplyChain', 'qualityTest', 'recall', 'distribution', 'other'],
      default: 'drug'
    },
    data: mongoose.Schema.Types.Mixed,
    templateData: mongoose.Schema.Types.Mixed,
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending'
    },
    signatureId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'DigitalSignature'
    },
    dataHash: String,
    errorMessage: String,
    attempts: {
      type: Number,
      default: 0
    },
    startedAt: Date,
    completedAt: Date,
    metadata: mongoose.Schema.Types.Mixed
  },
  { _id: true }
);

const signatureBatchSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    description: String,
    targetType: {
      type: String,
      enum: ['drug', 'supplyChain', 'qualityTest', 'recall', 'distribution', 'other'],
      default: 'drug'
    },
    templateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SignatureTemplate'
    },
    caProvider: {
      type: String,
      default: 'vnca'
    },
    useHsm: {
      type: Boolean,
      default: true
    },
    requireTimestamp: {
      type: Boolean,
      default: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'partial'],
      default: 'pending'
    },
    stats: {
      total: { type: Number, default: 0 },
      success: { type: Number, default: 0 },
      failed: { type: Number, default: 0 },
      pending: { type: Number, default: 0 }
    },
    items: [batchItemSchema],
    options: mongoose.Schema.Types.Mixed,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    startedAt: Date,
    completedAt: Date
  },
  {
    timestamps: true
  }
);

signatureBatchSchema.index({ status: 1, createdAt: -1 });
signatureBatchSchema.index({ createdBy: 1, createdAt: -1 });

module.exports = mongoose.model('SignatureBatch', signatureBatchSchema);

