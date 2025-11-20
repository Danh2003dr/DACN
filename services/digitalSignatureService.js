const crypto = require('crypto');
const DigitalSignature = require('../models/DigitalSignature');
const User = require('../models/User');
const hsmService = require('./hsm/hsmService');
const caProvidersConfig = require('../config/caProviders');
const signatureTemplateService = require('./signatureTemplateService');
const caProviderService = require('./caProviderService');

/**
 * Digital Signature Service
 * Hỗ trợ ký số theo chuẩn Việt Nam (CA quốc gia) và tích hợp Timestamp Authority
 */
class DigitalSignatureService {
  constructor() {
    // Cấu hình CA (Certificate Authority)
    this.caConfig = { ...caProvidersConfig };
    this.customCaLoaded = false;
    
    // Cấu hình TSA (Timestamp Authority)
    this.tsaConfig = {
      url: process.env.TSA_URL || 'https://tsa.vnca.gov.vn',
      algorithm: 'SHA256',
      timeout: 10000
    };
  }

  async ensureCustomCaProvidersLoaded() {
    if (this.customCaLoaded) return;
    try {
      const customProviders = await caProviderService.getActiveProviders();
      customProviders.forEach((provider) => {
        this.caConfig[provider.code] = {
          id: provider.code,
          name: provider.name,
          url: provider.url,
          algorithm: provider.algorithm || 'RSA-SHA256',
          keySize: provider.keySize || 2048,
          supportsHsm: provider.supportsHsm,
          description: provider.description || provider.name,
          metadata: provider.metadata || {}
        };
      });
      this.customCaLoaded = true;
    } catch (error) {
      console.error('Error loading custom CA providers:', error);
    }
  }

  async getCaProvider(providerId = 'vnca') {
    await this.ensureCustomCaProvidersLoaded();
    if (!providerId) return this.caConfig.vnca;
    return this.caConfig[providerId] || this.caConfig.vnca;
  }

  async listCaProviders() {
    await this.ensureCustomCaProvidersLoaded();
    return Object.keys(this.caConfig).map((key) => ({
      id: key,
      ...this.caConfig[key]
    }));
  }

  async registerCaProvider(providerData) {
    const provider = await caProviderService.createProvider(providerData);
    this.caConfig[provider.code] = {
      id: provider.code,
      name: provider.name,
      url: provider.url,
      algorithm: provider.algorithm || 'RSA-SHA256',
      keySize: provider.keySize || 2048,
      supportsHsm: provider.supportsHsm,
      description: provider.description || provider.name,
      metadata: provider.metadata || {}
    };
    return provider;
  }

  async signWithHsm(dataHash, options = {}) {
    if (!hsmService.isEnabled()) {
      return {
        success: false,
        usedHsm: false,
        message: 'HSM chưa được bật'
      };
    }

    const result = await hsmService.sign(dataHash, options);
    return result;
  }

  /**
   * Tạo hash cho dữ liệu cần ký
   */
  createDataHash(data) {
    const dataString = typeof data === 'string' ? data : JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString, 'utf8').digest('hex');
  }

  async createSignature(dataHash, privateKey, certificateInfo, options = {}) {
    try {
      // Trong thực tế, private key sẽ được lưu trong HSM hoặc USB Token
      // Ở đây mô phỏng bằng cách tạo signature từ hash
      
      const sign = crypto.createSign('RSA-SHA256');
      sign.update(dataHash);
      sign.end();
      
      // Mock signature (trong thực tế cần private key thật từ CA)
      if (privateKey === 'mock' || !privateKey) {
        // Tạo mock signature
        const mockSignature = crypto
          .createHash('sha256')
          .update(dataHash + certificateInfo.serialNumber + Date.now())
          .digest('hex');
        return `MOCK_SIG_${mockSignature}`;
      }
      
      // Thực tế: sign với private key
      const signature = sign.sign(privateKey, 'hex');
      return signature;
    } catch (error) {
      console.error('Error creating signature:', error);
      throw new Error('Không thể tạo chữ ký số: ' + error.message);
    }
  }

  /**
   * Xác thực chữ ký số
   */
  async verifySignature(signature, dataHash, publicKey, certificateInfo) {
    try {
      const verify = crypto.createVerify('RSA-SHA256');
      verify.update(dataHash);
      verify.end();
      
      // Mock verification
      if (signature.startsWith('MOCK_SIG_')) {
        // Trong môi trường demo, chấp nhận mock signature
        return {
          valid: true,
          verified: true,
          message: 'Chữ ký hợp lệ (mock mode)'
        };
      }
      
      // Thực tế: verify với public key
      const isValid = verify.verify(publicKey, signature, 'hex');
      
      return {
        valid: isValid,
        verified: isValid,
        message: isValid ? 'Chữ ký hợp lệ' : 'Chữ ký không hợp lệ'
      };
    } catch (error) {
      console.error('Error verifying signature:', error);
      return {
        valid: false,
        verified: false,
        message: 'Lỗi xác thực chữ ký: ' + error.message
      };
    }
  }

  /**
   * Lấy timestamp từ TSA (Timestamp Authority)
   */
  async getTimestampFromTSA(dataHash) {
    try {
      // Mock TSA response (trong thực tế cần gọi API TSA thật)
      const timestampToken = crypto
        .createHash('sha256')
        .update(dataHash + Date.now() + this.tsaConfig.url)
        .digest('hex');
      
      const timestampResponse = {
        success: true,
        timestampToken: `TSA_TOKEN_${timestampToken}`,
        timestampedAt: new Date(),
        tsaUrl: this.tsaConfig.url,
        algorithm: this.tsaConfig.algorithm,
        serialNumber: `TSA_${Date.now()}`,
        // Trong thực tế, timestamp token sẽ là ASN.1 encoded
        // Ở đây mô phỏng bằng hash
        timestampHash: crypto
          .createHash('sha256')
          .update(timestampToken)
          .digest('hex')
      };
      
      return timestampResponse;
      
      /* 
      // Code thực tế để gọi TSA API:
      const axios = require('axios');
      const response = await axios.post(this.tsaConfig.url + '/timestamp', {
        hash: dataHash,
        algorithm: this.tsaConfig.algorithm
      }, {
        timeout: this.tsaConfig.timeout
      });
      
      return {
        success: true,
        timestampToken: response.data.token,
        timestampedAt: new Date(response.data.timestamp),
        tsaUrl: this.tsaConfig.url,
        timestampHash: response.data.hash
      };
      */
    } catch (error) {
      console.error('Error getting timestamp from TSA:', error);
      return {
        success: false,
        error: error.message,
        timestampedAt: new Date() // Fallback to current time
      };
    }
  }

  /**
   * Xác thực timestamp token từ TSA
   */
  async verifyTimestampToken(timestampToken, dataHash) {
    try {
      // Mock verification
      if (timestampToken && timestampToken.startsWith('TSA_TOKEN_')) {
        return {
          valid: true,
          verified: true,
          message: 'Timestamp token hợp lệ (mock mode)'
        };
      }
      
      /* 
      // Code thực tế để verify timestamp token:
      const axios = require('axios');
      const response = await axios.post(this.tsaConfig.url + '/verify', {
        token: timestampToken,
        hash: dataHash
      });
      
      return {
        valid: response.data.valid,
        verified: response.data.verified,
        timestampedAt: new Date(response.data.timestamp),
        message: response.data.message
      };
      */
      
      return {
        valid: false,
        verified: false,
        message: 'Timestamp token không hợp lệ'
      };
    } catch (error) {
      console.error('Error verifying timestamp token:', error);
      return {
        valid: false,
        verified: false,
        message: 'Lỗi xác thực timestamp: ' + error.message
      };
    }
  }

  /**
   * Tạo chứng chỉ số mô phỏng (trong thực tế lấy từ CA)
   */
  async getCertificateInfo(userId, caProvider = 'vnca') {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Không tìm thấy người dùng');
      }
      
      const ca = await this.getCaProvider(caProvider);
      
      // Mock certificate info (trong thực tế lấy từ CA API)
      const certificateInfo = {
        serialNumber: `VNCA_${userId}_${Date.now()}`,
        subject: `CN=${user.fullName},O=${user.organization || 'Organization'},C=VN`,
        issuer: `O=${ca.name},C=VN`,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 năm
        publicKey: `MOCK_PUBLIC_KEY_${userId}`, // Trong thực tế là PEM format
        algorithm: ca.algorithm,
        caProvider: caProvider,
        caName: ca.name
      };
      
      return certificateInfo;
      
      /*
      // Code thực tế để lấy certificate từ CA:
      const axios = require('axios');
      const response = await axios.get(`${ca.url}/api/certificate/${userId}`, {
        headers: { 'Authorization': `Bearer ${process.env.CA_API_KEY}` }
      });
      
      return {
        serialNumber: response.data.serialNumber,
        subject: response.data.subject,
        issuer: response.data.issuer,
        validFrom: new Date(response.data.validFrom),
        validTo: new Date(response.data.validTo),
        publicKey: response.data.publicKey,
        algorithm: response.data.algorithm
      };
      */
    } catch (error) {
      console.error('Error getting certificate info:', error);
      throw error;
    }
  }

  /**
   * Ký số cho một đối tượng (drug, supplyChain, etc.)
   */
  async signDocument(targetType, targetId, userId, data, options = {}) {
    try {
      // Lấy thông tin người ký
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('Không tìm thấy người dùng');
      }
      
      const documentData = data;
      
      // Template handling
      let templateContext = null;
      let payloadForHash = documentData;
      if (options.templateId) {
        templateContext = await signatureTemplateService.prepareTemplatePayload(
          options.templateId,
          {
            documentData,
            templateData: options.templateData
          }
        );
        
        payloadForHash = {
          template: templateContext.payload,
          data: documentData
        };
      }

      // Lấy thông tin chứng chỉ số
      const caProvider = templateContext?.caProvider || options.caProvider || 'vnca';
      const certificateInfo = await this.getCertificateInfo(userId, caProvider);
      
      // Tạo chữ ký số
      const useHsm = options.useHsm !== undefined ? options.useHsm : hsmService.isEnabled();
      const dataHash = this.createDataHash(payloadForHash);
      let signatureResult = { success: false };
      if (useHsm) {
        signatureResult = await this.signWithHsm(
          dataHash,
          {
            provider: options.hsmProvider,
            keyId: options.hsmKeyId || certificateInfo.serialNumber,
            metadata: {
              targetType,
              targetId,
              userId
            }
          }
        );
      }
      
      
      if (!signatureResult.success) {
        const privateKey = options.privateKey || 'mock';
        const fallbackSignature = await this.createSignature(
          dataHash,
          privateKey,
          certificateInfo,
          options
        );
        signatureResult = {
          success: true,
          signature: fallbackSignature,
          usedHsm: false,
          provider: signatureResult.provider || null,
          algorithm: certificateInfo.algorithm,
          metadata: {
            method: privateKey === 'mock' ? 'mock' : 'local-private-key'
          },
          fallback: true,
          error: signatureResult.error
        };
      }
      
      // Lấy timestamp từ TSA (nếu yêu cầu)
      let timestampData = null;
      if (options.requireTimestamp !== false) {
        timestampData = await this.getTimestampFromTSA(dataHash);
      }
      
      const signatureMetadata = { ...(options.metadata || {}) };
      if (templateContext) {
        signatureMetadata.templateData = templateContext.payload;
      }

      // Lưu chữ ký số vào database
      const digitalSignature = new DigitalSignature({
        targetType,
        targetId,
        signedBy: userId,
        signedByName: user.fullName,
        signedByRole: user.role,
        dataHash,
        signature: signatureResult.signature,
        certificate: {
          serialNumber: certificateInfo.serialNumber,
          caProvider: caProvider,
          caName: certificateInfo.caName,
          certificateInfo: {
            subject: certificateInfo.subject,
            issuer: certificateInfo.issuer,
            validFrom: certificateInfo.validFrom,
            validTo: certificateInfo.validTo,
            publicKey: certificateInfo.publicKey,
            algorithm: certificateInfo.algorithm
          },
          certificateStatus: 'valid',
          lastVerified: new Date()
        },
        signingInfo: {
          usedHsm: !!signatureResult.usedHsm,
          method: signatureResult.usedHsm ? 'hsm' : (signatureResult.metadata?.method || 'local'),
          provider: signatureResult.provider || null,
          keyId: signatureResult.keyId || certificateInfo.serialNumber,
          algorithm: signatureResult.algorithm || certificateInfo.algorithm,
          metadata: signatureResult.metadata || {},
          error: signatureResult.error || null,
          fallback: !!signatureResult.fallback
        },
        template: templateContext
          ? {
              templateId: templateContext.templateId,
              name: templateContext.name,
              version: templateContext.version,
              payload: templateContext.payload
            }
          : undefined,
        batchId: options.batchId || null,
        timestamp: timestampData ? {
          timestampToken: timestampData.timestampToken,
          tsaUrl: timestampData.tsaUrl,
          timestampedAt: timestampData.timestampedAt,
          timestampHash: timestampData.timestampHash,
          timestampStatus: timestampData.success ? 'verified' : 'failed',
          tsaResponse: timestampData
        } : {
          timestampStatus: 'not_required'
        },
        purpose: options.purpose || 'Xác thực nguồn gốc và tính toàn vẹn dữ liệu',
        metadata: signatureMetadata,
        status: 'active'
      });
      
      await digitalSignature.save();
      
      return {
        success: true,
        digitalSignature,
        signatureId: digitalSignature._id,
        dataHash,
        timestamped: !!timestampData,
        signingInfo: digitalSignature.signingInfo
      };
    } catch (error) {
      console.error('Error signing document:', error);
      throw error;
    }
  }

  /**
   * Xác thực chữ ký số
   */
  async verifySignatureById(signatureId, data) {
    try {
      const digitalSignature = await DigitalSignature.findById(signatureId)
        .populate('signedBy', 'fullName email role');
      
      if (!digitalSignature) {
        return {
          valid: false,
          verified: false,
          message: 'Không tìm thấy chữ ký số'
        };
      }
      
      // Kiểm tra trạng thái chữ ký
      if (digitalSignature.status !== 'active') {
        return {
          valid: false,
          verified: false,
          message: `Chữ ký đã bị ${digitalSignature.status}`,
          signature: digitalSignature
        };
      }
      
      // Kiểm tra chứng chỉ số
      if (digitalSignature.certificate.certificateStatus !== 'valid') {
        return {
          valid: false,
          verified: false,
          message: 'Chứng chỉ số không hợp lệ',
          signature: digitalSignature
        };
      }
      
      if (digitalSignature.certificate.certificateInfo.validTo < new Date()) {
        return {
          valid: false,
          verified: false,
          message: 'Chứng chỉ số đã hết hạn',
          signature: digitalSignature
        };
      }
      
      // Tạo hash từ dữ liệu hiện tại
      // Nếu data là undefined hoặc null, không thể verify được
      if (!data) {
        return {
          valid: false,
          verified: false,
          message: 'Không có dữ liệu để xác thực chữ ký. Vui lòng cung cấp dữ liệu gốc.',
          signature: digitalSignature
        };
      }
      
      let payloadForHash = data;
      if (digitalSignature.template && digitalSignature.template.payload) {
        payloadForHash = {
          template: digitalSignature.template.payload,
          data
        };
      }

      const currentDataHash = this.createDataHash(payloadForHash);
      
      // So sánh hash
      if (currentDataHash !== digitalSignature.dataHash) {
        return {
          valid: false,
          verified: false,
          message: 'Dữ liệu đã bị thay đổi (hash không khớp)',
          signature: digitalSignature
        };
      }
      
      // Xác thực chữ ký
      const verifyResult = await this.verifySignature(
        digitalSignature.signature,
        digitalSignature.dataHash,
        digitalSignature.certificate.certificateInfo.publicKey,
        digitalSignature.certificate.certificateInfo
      );
      
      // Xác thực timestamp (nếu có)
      let timestampValid = true;
      if (digitalSignature.timestamp.timestampStatus === 'verified') {
        const timestampVerify = await this.verifyTimestampToken(
          digitalSignature.timestamp.timestampToken,
          digitalSignature.dataHash
        );
        timestampValid = timestampVerify.valid;
      }
      
      return {
        valid: verifyResult.valid && timestampValid,
        verified: verifyResult.verified,
        message: verifyResult.valid 
          ? (timestampValid ? 'Chữ ký số hợp lệ và đã được timestamp' : 'Chữ ký số hợp lệ nhưng timestamp không hợp lệ')
          : verifyResult.message,
        signature: digitalSignature,
        timestamped: digitalSignature.isTimestamped,
        certificate: digitalSignature.certificate
      };
    } catch (error) {
      console.error('Error verifying signature:', error);
      return {
        valid: false,
        verified: false,
        message: 'Lỗi xác thực chữ ký: ' + error.message
      };
    }
  }

  /**
   * Thu hồi chữ ký số
   */
  async revokeSignature(signatureId, reason, revokedBy) {
    try {
      const digitalSignature = await DigitalSignature.findById(signatureId);
      if (!digitalSignature) {
        throw new Error('Không tìm thấy chữ ký số');
      }
      
      await digitalSignature.revoke(reason, revokedBy);
      
      return {
        success: true,
        digitalSignature
      };
    } catch (error) {
      console.error('Error revoking signature:', error);
      throw error;
    }
  }
}

module.exports = new DigitalSignatureService();

