const hsmConfig = require('../../config/hsmConfig');
const HsmClientFactory = require('./HsmClientFactory');

class HsmService {
  constructor(config) {
    this.config = config;
  }

  isEnabled() {
    return !!this.config.enabled;
  }

  async getProvider(providerId) {
    if (!this.isEnabled()) {
      throw new Error('HSM chưa được bật');
    }

    const id = providerId || this.config.defaultProvider;
    const providerConfig = this.config.providers[id];

    if (!providerConfig) {
      throw new Error(`Không tìm thấy cấu hình HSM provider: ${id}`);
    }

    providerConfig.id = providerConfig.id || id;
    return HsmClientFactory.getProvider(providerConfig);
  }

  async sign(dataHash, options = {}) {
    if (!this.isEnabled()) {
      return {
        success: false,
        usedHsm: false,
        message: 'HSM chưa được bật'
      };
    }

    try {
      const provider = await this.getProvider(options.provider);
      const result = await provider.sign(dataHash, options);
      return {
        ...result,
        success: true,
        usedHsm: true,
        provider: provider.getMetadata()
      };
    } catch (error) {
      return {
        success: false,
        usedHsm: false,
        error: error.message
      };
    }
  }

  async testConnection(providerId) {
    if (!this.isEnabled()) {
      return {
        success: false,
        message: 'HSM chưa được bật'
      };
    }

    try {
      const provider = await this.getProvider(providerId);
      return provider.testConnection();
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }

  listProviders() {
    return Object.keys(this.config.providers).map((key) => ({
      id: key,
      ...this.config.providers[key]
    }));
  }
}

module.exports = new HsmService(hsmConfig);

