const mongoose = require('mongoose');

const caProviderSchema = new mongoose.Schema(
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
    url: {
      type: String,
      required: true
    },
    algorithm: {
      type: String,
      default: 'RSA-SHA256'
    },
    keySize: {
      type: Number,
      default: 2048
    },
    description: String,
    supportsHsm: {
      type: Boolean,
      default: true
    },
    contactEmail: String,
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active'
    },
    metadata: mongoose.Schema.Types.Mixed,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  {
    timestamps: true
  }
);

caProviderSchema.index({ code: 1, status: 1 });

module.exports = mongoose.model('CAProvider', caProviderSchema);

