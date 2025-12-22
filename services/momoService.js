const crypto = require('crypto');
const axios = require('axios');

/**
 * MoMo Payment Service
 * Tích hợp với MoMo Payment Gateway
 */
class MomoService {
  constructor() {
    // MoMo API endpoints
    // Sandbox: https://test-payment.momo.vn/v2/gateway/api/create
    // Production: https://payment.momo.vn/v2/gateway/api/create
    this.sandboxUrl = 'https://test-payment.momo.vn/v2/gateway/api/create';
    this.productionUrl = 'https://payment.momo.vn/v2/gateway/api/create';
    
    // Lấy từ environment variables
    this.partnerCode = process.env.MOMO_PARTNER_CODE || '';
    this.accessKey = process.env.MOMO_ACCESS_KEY || '';
    this.secretKey = process.env.MOMO_SECRET_KEY || '';
    this.environment = process.env.MOMO_ENVIRONMENT || 'sandbox'; // sandbox hoặc production
    
    this.baseUrl = this.environment === 'production' ? this.productionUrl : this.sandboxUrl;
    this.ipnUrl = process.env.MOMO_IPN_URL || `${process.env.API_URL || 'http://localhost:5000'}/api/payments/momo/callback`;
    this.redirectUrl = process.env.MOMO_REDIRECT_URL || `${process.env.FRONTEND_URL || 'http://localhost:3000'}/payments/momo/callback`;
  }

  /**
   * Tạo chữ ký HMAC SHA256
   */
  createSignature(data) {
    const rawSignature = `accessKey=${this.accessKey}&amount=${data.amount}&extraData=${data.extraData}&ipnUrl=${this.ipnUrl}&orderId=${data.orderId}&orderInfo=${data.orderInfo}&partnerCode=${this.partnerCode}&redirectUrl=${this.redirectUrl}&requestId=${data.requestId}&requestType=${data.requestType}`;
    return crypto.createHmac('sha256', this.secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  /**
   * Tạo payment request với MoMo
   * @param {Object} paymentData - Thông tin thanh toán
   * @param {String} paymentData.orderId - Mã đơn hàng
   * @param {Number} paymentData.amount - Số tiền (VND)
   * @param {String} paymentData.orderInfo - Thông tin đơn hàng
   * @param {String} paymentData.extraData - Dữ liệu bổ sung (JSON string)
   * @param {String} paymentData.requestId - Mã request unique
   * @returns {Promise<Object>} Payment URL và thông tin
   */
  async createPaymentRequest(paymentData) {
    try {
      const {
        orderId,
        amount,
        orderInfo = 'Thanh toán hóa đơn',
        extraData = '',
        requestId
      } = paymentData;

      // Validate
      if (!orderId || !amount || !requestId) {
        throw new Error('Thiếu thông tin bắt buộc: orderId, amount, requestId');
      }

      if (!this.partnerCode || !this.accessKey || !this.secretKey) {
        throw new Error('Chưa cấu hình MoMo credentials. Vui lòng kiểm tra environment variables.');
      }

      // Tạo request data
      const requestData = {
        partnerCode: this.partnerCode,
        partnerName: process.env.MOMO_PARTNER_NAME || 'Drug Traceability System',
        storeId: process.env.MOMO_STORE_ID || 'MomoTestStore',
        requestId: requestId,
        amount: amount,
        orderId: orderId,
        orderInfo: orderInfo,
        redirectUrl: this.redirectUrl,
        ipnUrl: this.ipnUrl,
        lang: 'vi',
        extraData: extraData,
        requestType: 'captureWallet',
        autoCapture: true
      };

      // Tạo signature
      const signature = this.createSignature(requestData);
      requestData.signature = signature;

      console.log('📱 [MoMo] Creating payment request:', {
        orderId,
        amount,
        requestId,
        environment: this.environment
      });

      // Gọi MoMo API
      const response = await axios.post(this.baseUrl, requestData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      if (response.data && response.data.resultCode === 0) {
        console.log('✅ [MoMo] Payment request created successfully');
        return {
          success: true,
          paymentUrl: response.data.payUrl,
          deeplink: response.data.deeplink,
          qrCodeUrl: response.data.qrCodeUrl,
          orderId: orderId,
          requestId: requestId,
          amount: amount
        };
      } else {
        console.error('❌ [MoMo] Payment request failed:', response.data);
        throw new Error(response.data.message || 'Không thể tạo yêu cầu thanh toán MoMo');
      }
    } catch (error) {
      console.error('❌ [MoMo] Error creating payment request:', error);
      throw error;
    }
  }

  /**
   * Xác thực callback từ MoMo
   * @param {Object} callbackData - Dữ liệu callback từ MoMo
   * @returns {Boolean} True nếu hợp lệ
   */
  verifyCallback(callbackData) {
    try {
      const {
        partnerCode,
        orderId,
        requestId,
        amount,
        orderInfo,
        orderType,
        transId,
        resultCode,
        message,
        payType,
        responseTime,
        extraData,
        signature
      } = callbackData;

      // Tạo signature để so sánh
      const rawSignature = `accessKey=${this.accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
      const calculatedSignature = crypto.createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');

      // So sánh signature
      if (calculatedSignature !== signature) {
        console.error('❌ [MoMo] Invalid signature in callback');
        return false;
      }

      // Kiểm tra partner code
      if (partnerCode !== this.partnerCode) {
        console.error('❌ [MoMo] Invalid partner code in callback');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ [MoMo] Error verifying callback:', error);
      return false;
    }
  }

  /**
   * Xử lý callback từ MoMo
   * @param {Object} callbackData - Dữ liệu callback
   * @returns {Object} Kết quả xử lý
   */
  async processCallback(callbackData) {
    try {
      // Xác thực callback
      if (!this.verifyCallback(callbackData)) {
        return {
          success: false,
          message: 'Invalid signature or partner code'
        };
      }

      const {
        orderId,
        transId,
        amount,
        resultCode,
        message,
        payType,
        responseTime
      } = callbackData;

      // resultCode: 0 = thành công, khác = thất bại
      const isSuccess = resultCode === 0;

      return {
        success: isSuccess,
        orderId,
        transId,
        amount,
        resultCode,
        message,
        payType,
        responseTime,
        paymentStatus: isSuccess ? 'completed' : 'failed'
      };
    } catch (error) {
      console.error('❌ [MoMo] Error processing callback:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Kiểm tra trạng thái thanh toán
   * @param {String} orderId - Mã đơn hàng
   * @param {String} requestId - Mã request
   * @returns {Promise<Object>} Trạng thái thanh toán
   */
  async checkPaymentStatus(orderId, requestId) {
    try {
      const queryUrl = this.environment === 'production' 
        ? 'https://payment.momo.vn/v2/gateway/api/query'
        : 'https://test-payment.momo.vn/v2/gateway/api/query';

      const queryData = {
        partnerCode: this.partnerCode,
        orderId: orderId,
        requestId: requestId,
        lang: 'vi'
      };

      // Tạo signature cho query
      const rawSignature = `accessKey=${this.accessKey}&orderId=${orderId}&partnerCode=${this.partnerCode}&requestId=${requestId}`;
      const signature = crypto.createHmac('sha256', this.secretKey)
        .update(rawSignature)
        .digest('hex');
      
      queryData.signature = signature;

      const response = await axios.post(queryUrl, queryData, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 30000
      });

      return {
        success: response.data.resultCode === 0,
        data: response.data
      };
    } catch (error) {
      console.error('❌ [MoMo] Error checking payment status:', error);
      throw error;
    }
  }
}

module.exports = new MomoService();

