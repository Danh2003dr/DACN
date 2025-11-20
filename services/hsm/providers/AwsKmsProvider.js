const BaseHsmProvider = require('./BaseHsmProvider');

class AwsKmsProvider extends BaseHsmProvider {
  async initialize() {
    await super.initialize();
    const { region, accessKeyId, secretAccessKey, keyId } = this.config;

    if (!region || !accessKeyId || !secretAccessKey || !keyId) {
      throw new Error('AWS KMS provider yêu cầu region, accessKeyId, secretAccessKey và keyId');
    }

    let awsSdk;
    try {
      awsSdk = require('@aws-sdk/client-kms');
    } catch (error) {
      throw new Error('Thiếu dependency @aws-sdk/client-kms. Vui lòng cài đặt bằng npm install @aws-sdk/client-kms');
    }

    const { KMSClient } = awsSdk;
    this.commandModule = awsSdk;
    this.client = new KMSClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
    this.keyId = keyId;
    return true;
  }

  async sign(dataHash, options = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    const { SignCommand } = this.commandModule;
    const params = {
      KeyId: options.keyId || this.keyId,
      Message: Buffer.from(dataHash, 'hex'),
      MessageType: 'DIGEST',
      SigningAlgorithm: options.algorithm || 'RSASSA_PKCS1_V1_5_SHA_256'
    };

    const response = await this.client.send(new SignCommand(params));

    return {
      success: true,
      signature: response.Signature.toString('base64'),
      keyId: response.KeyId,
      algorithm: response.SigningAlgorithm,
      usedHsm: true,
      provider: this.getMetadata(),
      metadata: {
        keyId: response.KeyId,
        signingAlgorithm: response.SigningAlgorithm
      }
    };
  }
}

module.exports = AwsKmsProvider;

