const SignatureBatch = require('../models/SignatureBatch');
const signatureTemplateService = require('./signatureTemplateService');
const digitalSignatureService = require('./digitalSignatureService');

class SignatureBatchService {
  async createBatch(payload, user) {
    if (!payload.items || !Array.isArray(payload.items) || payload.items.length === 0) {
      throw new Error('Danh sách items không hợp lệ');
    }

    if (payload.templateId) {
      await signatureTemplateService.getTemplateById(payload.templateId);
    }

    const batch = new SignatureBatch({
      name: payload.name || `Batch ${new Date().toISOString()}`,
      description: payload.description,
      targetType: payload.targetType || 'drug',
      templateId: payload.templateId || null,
      caProvider: payload.caProvider || 'vnca',
      useHsm: payload.useHsm !== undefined ? payload.useHsm : true,
      requireTimestamp: payload.requireTimestamp !== undefined ? payload.requireTimestamp : true,
      status: 'processing',
      options: payload.options || {},
      createdBy: user.id || user._id,
      startedAt: new Date(),
      stats: {
        total: payload.items.length,
        success: 0,
        failed: 0,
        pending: payload.items.length
      }
    });

    await batch.save();

    const itemsResult = [];
    let successCount = 0;
    let failedCount = 0;

    for (const item of payload.items) {
      const itemResult = {
        targetId: item.targetId,
        targetType: payload.targetType || 'drug',
        data: item.data,
        templateData: item.templateData,
        status: 'processing',
        attempts: 1,
        startedAt: new Date()
      };

      try {
        const options = {
          ...(payload.options || {}),
          caProvider: item.caProvider || payload.caProvider,
          useHsm: item.useHsm !== undefined ? item.useHsm : batch.useHsm,
          requireTimestamp:
            item.requireTimestamp !== undefined ? item.requireTimestamp : batch.requireTimestamp,
          templateId: item.templateId || payload.templateId,
          templateData: item.templateData,
          metadata: item.metadata,
          batchId: batch._id
        };

        const result = await digitalSignatureService.signDocument(
          payload.targetType,
          item.targetId,
          user.id || user._id,
          item.data,
          options
        );

        itemResult.status = 'completed';
        itemResult.signatureId = result.signatureId;
        itemResult.dataHash = result.dataHash;
        itemResult.completedAt = new Date();
        itemResult.metadata = {
          signingInfo: result.signingInfo
        };
        successCount += 1;
      } catch (error) {
        itemResult.status = 'failed';
        itemResult.errorMessage = error.message;
        itemResult.completedAt = new Date();
        failedCount += 1;
      }

      itemsResult.push(itemResult);
    }

    batch.items = itemsResult;
    batch.stats.success = successCount;
    batch.stats.failed = failedCount;
    batch.stats.pending = Math.max(batch.stats.total - successCount - failedCount, 0);
    batch.status =
      failedCount === 0
        ? 'completed'
        : successCount === 0
        ? 'failed'
        : 'partial';
    batch.completedAt = new Date();

    await batch.save();
    return batch;
  }

  async getBatchById(id) {
    const batch = await SignatureBatch.findById(id)
      .populate('templateId')
      .populate('items.signatureId');
    if (!batch) {
      throw new Error('Không tìm thấy batch');
    }
    return batch;
  }

  async listBatches(filter = {}, options = {}) {
    const query = {};
    if (filter.status && filter.status !== 'all') {
      query.status = filter.status;
    }
    if (filter.targetType) {
      query.targetType = filter.targetType;
    }
    if (filter.createdBy) {
      query.createdBy = filter.createdBy;
    }

    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      SignatureBatch.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('templateId')
        .lean(),
      SignatureBatch.countDocuments(query)
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
}

module.exports = new SignatureBatchService();

