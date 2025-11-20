const mongoose = require('mongoose');

const templateFieldSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true
    },
    label: String,
    type: {
      type: String,
      enum: ['string', 'number', 'date', 'boolean', 'object', 'array'],
      default: 'string'
    },
    required: {
      type: Boolean,
      default: false
    },
    defaultValue: mongoose.Schema.Types.Mixed,
    description: String
  },
  { _id: false }
);

const signatureTemplateSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true
    },
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true
    },
    description: String,
    targetType: {
      type: String,
      enum: ['drug', 'supplyChain', 'qualityTest', 'recall', 'distribution', 'other'],
      default: 'drug'
    },
    caProvider: {
      type: String,
      default: 'vnca'
    },
    fields: [templateFieldSchema],
    defaultPayload: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    defaultMetadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    },
    defaultPurpose: {
      type: String,
      default: 'Xác thực nguồn gốc và tính toàn vẹn dữ liệu'
    },
    layout: mongoose.Schema.Types.Mixed,
    version: {
      type: Number,
      default: 1
    },
    status: {
      type: String,
      enum: ['draft', 'active', 'archived'],
      default: 'draft'
    },
    tags: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

signatureTemplateSchema.index({ status: 1, targetType: 1 });

module.exports = mongoose.model('SignatureTemplate', signatureTemplateSchema);

