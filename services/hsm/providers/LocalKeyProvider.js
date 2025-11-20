const crypto = require('crypto');
const BaseHsmProvider = require('./BaseHsmProvider');

class LocalKeyProvider extends BaseHsmProvider {
  async initialize() {
    await super.initialize();
    this.privateKey = this.config.privateKey;
    if (!this.privateKey) {
      throw new Error('LocalKeyProvider: chưa cấu hình private key');
    }
    this.algorithm = this.config.algorithm || 'RSA-SHA256';
    return true;
  }

  async sign(dataHash, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const sign = crypto.createSign(this.algorithm);
    sign.update(dataHash);
    sign.end();

    const signature = sign.sign(this.privateKey, 'hex');

    return {
      success: true,
      signature,
      keyId: options.keyId || this.config.keyId || 'LOCAL_KEY',
      algorithm: this.algorithm,
      usedHsm: true,
      provider: this.getMetadata(),
      metadata: {
        method: 'local-private-key'
      }
    };
  }
}

module.exports = LocalKeyProvider;

