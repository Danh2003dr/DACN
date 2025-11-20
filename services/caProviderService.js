const CAProvider = require('../models/CAProvider');

class CaProviderService {
  async getActiveProviders() {
    return CAProvider.find({ status: 'active' }).lean();
  }

  async createProvider(data, userId = null) {
    const provider = new CAProvider({
      name: data.name,
      code: data.code?.toUpperCase(),
      url: data.url,
      algorithm: data.algorithm || 'RSA-SHA256',
      keySize: data.keySize || 2048,
      description: data.description,
      supportsHsm: data.supportsHsm !== undefined ? data.supportsHsm : true,
      contactEmail: data.contactEmail,
      metadata: data.metadata || {},
      createdBy: userId
    });
    return provider.save();
  }

  async updateProvider(id, data) {
    const provider = await CAProvider.findById(id);
    if (!provider) {
      throw new Error('Không tìm thấy CA Provider');
    }
    Object.assign(provider, data);
    return provider.save();
  }

  async setStatus(id, status) {
    return CAProvider.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );
  }
}

module.exports = new CaProviderService();

