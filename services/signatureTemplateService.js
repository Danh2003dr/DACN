const SignatureTemplate = require('../models/SignatureTemplate');

class SignatureTemplateService {
  async createTemplate(payload, userId) {
    const template = new SignatureTemplate({
      name: payload.name,
      code: payload.code?.toUpperCase(),
      description: payload.description,
      targetType: payload.targetType || 'drug',
      caProvider: payload.caProvider || 'vnca',
      fields: payload.fields || [],
      defaultPayload: payload.defaultPayload || {},
      defaultMetadata: payload.defaultMetadata || {},
      defaultPurpose: payload.defaultPurpose,
      layout: payload.layout || {},
      version: 1,
      status: payload.status || 'draft',
      tags: payload.tags || [],
      createdBy: userId,
      updatedBy: userId
    });
    return template.save();
  }

  async updateTemplate(id, payload, userId) {
    const template = await SignatureTemplate.findById(id);
    if (!template) {
      throw new Error('Không tìm thấy template');
    }

    Object.assign(template, {
      name: payload.name ?? template.name,
      description: payload.description ?? template.description,
      targetType: payload.targetType ?? template.targetType,
      caProvider: payload.caProvider ?? template.caProvider,
      fields: payload.fields ?? template.fields,
      defaultPayload: payload.defaultPayload ?? template.defaultPayload,
      defaultMetadata: payload.defaultMetadata ?? template.defaultMetadata,
      defaultPurpose: payload.defaultPurpose ?? template.defaultPurpose,
      layout: payload.layout ?? template.layout,
      tags: payload.tags ?? template.tags,
      updatedBy: userId
    });

    template.version += 1;
    return template.save();
  }

  async listTemplates(filter = {}, options = {}) {
    const query = {};
    if (filter.status && filter.status !== 'all') {
      query.status = filter.status;
    }
    if (filter.targetType) {
      query.targetType = filter.targetType;
    }
    if (filter.search) {
      query.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { code: { $regex: filter.search, $options: 'i' } }
      ];
    }

    const page = parseInt(options.page, 10) || 1;
    const limit = parseInt(options.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      SignatureTemplate.find(query)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SignatureTemplate.countDocuments(query)
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

  async getTemplateById(id) {
    const template = await SignatureTemplate.findById(id).lean();
    if (!template) {
      throw new Error('Không tìm thấy template');
    }
    return template;
  }

  async changeStatus(id, status, userId) {
    const template = await SignatureTemplate.findById(id);
    if (!template) {
      throw new Error('Không tìm thấy template');
    }
    template.status = status;
    template.updatedBy = userId;
    return template.save();
  }

  async prepareTemplatePayload(templateId, { documentData = {}, templateData = {} } = {}) {
    const template = await SignatureTemplate.findById(templateId);
    if (!template) {
      throw new Error('Template không tồn tại');
    }

    if (template.status !== 'active' && template.status !== 'draft') {
      throw new Error('Template không ở trạng thái cho phép sử dụng');
    }

    const payload = {
      ...(template.defaultPayload || {})
    };

    (template.fields || []).forEach((field) => {
      if (field.defaultValue !== undefined && payload[field.key] === undefined) {
        payload[field.key] = field.defaultValue;
      }
    });

    Object.assign(payload, templateData || {});

    (template.fields || []).forEach((field) => {
      if (field.required && (payload[field.key] === undefined || payload[field.key] === null)) {
        throw new Error(`Thiếu giá trị bắt buộc cho trường "${field.key}" trong template`);
      }
    });

    return {
      templateId: template._id,
      name: template.name,
      version: template.version,
      payload,
      targetType: template.targetType,
      caProvider: template.caProvider
    };
  }
}

module.exports = new SignatureTemplateService();

