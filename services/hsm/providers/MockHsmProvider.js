const crypto = require('crypto');
const BaseHsmProvider = require('./BaseHsmProvider');

class MockHsmProvider extends BaseHsmProvider {
  async initialize() {
    await super.initialize();
    this.defaultKeyId = this.config.defaultKeyId || 'MOCK_KEY';
    return true;
  }

  async sign(dataHash, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const keyId = options.keyId || this.defaultKeyId;
    const timestamp = Date.now();
    const signature = crypto
      .createHash('sha256')
      .update(`${dataHash}:${keyId}:${timestamp}`)
      .digest('hex');

    return {
      success: true,
      signature: `MOCK_HSM_SIG_${signature}`,
      keyId,
      algorithm: 'MOCK-SHA256',
      usedHsm: true,
      provider: this.getMetadata(),
      metadata: {
        signedAt: new Date(timestamp),
        mock: true
      }
    };
  }
}

module.exports = MockHsmProvider;

