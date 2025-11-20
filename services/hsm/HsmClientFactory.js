const MockHsmProvider = require('./providers/MockHsmProvider');
const LocalKeyProvider = require('./providers/LocalKeyProvider');
const AwsKmsProvider = require('./providers/AwsKmsProvider');

const PROVIDER_MAP = {
  mock: MockHsmProvider,
  'mock-hsm': MockHsmProvider,
  local: LocalKeyProvider,
  'local-key': LocalKeyProvider,
  'aws-kms': AwsKmsProvider,
  aws: AwsKmsProvider
};

class HsmClientFactory {
  constructor() {
    this.instances = new Map();
  }

  async getProvider(config) {
    if (!config || !config.type) {
      throw new Error('HSM provider config không hợp lệ');
    }

    if (this.instances.has(config.id)) {
      return this.instances.get(config.id);
    }

    const ProviderClass = PROVIDER_MAP[config.type];
    if (!ProviderClass) {
      throw new Error(`HSM provider type "${config.type}" chưa được hỗ trợ`);
    }

    const provider = new ProviderClass(config);
    await provider.initialize();
    this.instances.set(config.id, provider);
    return provider;
  }
}

module.exports = new HsmClientFactory();

