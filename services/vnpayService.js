const { VNPay } = require('vnpay');
const moment = require('moment');

/**
 * VNPay Payment Service
 * Tích hợp với VNPay Payment Gateway sử dụng thư viện vnpay
 * Tài liệu: https://vnpay.js.org
 * Sandbox: https://sandbox.vnpayment.vn/apis/docs/thanh-toan-pay/pay.html
 */
class VnpayService {
  constructor() {
    // Lấy từ environment variables
    const tmnCode = process.env.VNPAY_TMN_CODE || '';
    const secureSecret = process.env.VNPAY_HASH_SECRET || '';
    const environment = process.env.VNPAY_ENVIRONMENT || 'sandbox'; // sandbox hoặc production
    
    // VNPay gateway URLs
    const sandboxHost = 'https://sandbox.vnpayment.vn';
    const productionHost = 'https://vnpayment.vn';
    const vnpayHost = environment === 'production' ? productionHost : sandboxHost;
    
    // Return URL và IPN URL
    const apiUrl = process.env.API_URL || 'http://localhost:5000';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const returnUrl = process.env.VNPAY_RETURN_URL || `${frontendUrl}/payments/vnpay/callback`;
    const ipnUrl = process.env.VNPAY_IPN_URL || `${apiUrl}/api/payments/vnpay/ipn`;

    // Khởi tạo VNPay instance với cấu hình
    this.vnpay = new VNPay({
      tmnCode: tmnCode,
      secureSecret: secureSecret,
      vnpayHost: vnpayHost,
      testMode: environment === 'sandbox', // true nếu sandbox
      hashAlgorithm: 'SHA512', // Thuật toán mã hóa
      enableLog: process.env.VNPAY_ENABLE_LOG === 'true' || environment === 'sandbox', // Bật log để debug
      loggerFn: (message) => {
        if (environment === 'sandbox' || process.env.VNPAY_ENABLE_LOG === 'true') {
          console.log(`💳 [VNPay] ${message}`);
        }
      }
    });

    this.environment = environment;
    this.returnUrl = returnUrl;
    this.ipnUrl = ipnUrl;
    
    // Lưu credentials để sử dụng trong các method khác
    this.tmnCode = tmnCode;
    this.secureSecret = secureSecret;
  }

  /**
   * Tạo mã đơn hàng duy nhất (vnp_TxnRef)
   * Sử dụng moment để tạo timestamp kết hợp với random để tránh trùng lặp
   * Format: YYYYMMDDHHmmss + random (4 số)
   * Ví dụ: 20231215143025 + 1234 = 202312151430251234
   * 
   * QUAN TRỌNG: Phương pháp này giúp tránh lỗi "Order already exists" 
   * khi test nhiều lần trong cùng một giây
   * 
   * @returns {String} Mã đơn hàng duy nhất
   */
  generateOrderId() {
    // Tạo timestamp theo format YYYYMMDDHHmmss
    const timestamp = moment().format('YYYYMMDDHHmmss');
    
    // Thêm random 4 số để đảm bảo tính duy nhất
    // Nếu test nhiều lần trong cùng giây, random sẽ giúp tránh trùng mã
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    
    const orderId = `${timestamp}${random}`;
    
    console.log(`💳 [VNPay] Generated orderId: ${orderId}`);
    
    return orderId;
  }

  /**
   * Tạo payment URL với VNPay
   * Sử dụng hàm buildPaymentUrl của thư viện vnpay
   * 
   * @param {Object} paymentData - Thông tin thanh toán
   * @param {Number} paymentData.amount - Số tiền (VND) - không cần nhân 100, hàm sẽ tự xử lý
   * @param {String} paymentData.bankCode - Mã ngân hàng (tùy chọn)
   * @param {String} paymentData.orderInfo - Nội dung đơn hàng
   * @param {String} paymentData.ipAddr - IP address của khách hàng
   * @param {String} paymentData.locale - Ngôn ngữ (vi/en) - default: 'vi'
   * @param {String} paymentData.orderType - Loại đơn hàng - default: 'other'
   * @param {String} paymentData.vnp_TxnRef - Mã đơn hàng (nếu không có sẽ tự động tạo)
   * @returns {String} Payment URL để redirect
   */
  createPaymentUrl(paymentData) {
    try {
      const {
        amount,
        bankCode = null,
        orderInfo = 'Thanh toan don hang',
        ipAddr = '127.0.0.1',
        locale = 'vi',
        orderType = 'other',
        vnp_TxnRef = null
      } = paymentData;

      // Validate
      if (!amount || amount <= 0) {
        throw new Error('Số tiền thanh toán không hợp lệ.');
      }

      if (!this.tmnCode || !this.secureSecret) {
        throw new Error('VNPay credentials chưa được cấu hình. Vui lòng kiểm tra environment variables: VNPAY_TMN_CODE, VNPAY_HASH_SECRET');
      }

      // Tạo mã đơn hàng duy nhất nếu chưa có
      // QUAN TRỌNG: Đây là cách tránh lỗi "Order already exists"
      // Sử dụng moment + random để đảm bảo mỗi giao dịch có mã duy nhất
      const orderId = vnp_TxnRef || this.generateOrderId();

      // Tạo payment params
      const paymentParams = {
        vnp_Amount: amount, // Thư viện sẽ tự động nhân 100 nếu cần
        vnp_Command: 'pay',
        vnp_CreateDate: moment().format('YYYYMMDDHHmmss'), // Format: YYYYMMDDHHmmss
        vnp_CurrCode: 'VND',
        vnp_IpAddr: ipAddr,
        vnp_Locale: locale,
        vnp_OrderInfo: orderInfo,
        vnp_OrderType: orderType,
        vnp_ReturnUrl: this.returnUrl,
        vnp_TmnCode: this.tmnCode,
        vnp_TxnRef: orderId,
        vnp_Version: '2.1.0'
      };

      // Thêm bankCode nếu có (để thanh toán trực tiếp qua ngân hàng cụ thể)
      if (bankCode && bankCode !== '') {
        paymentParams.vnp_BankCode = bankCode;
      }

      // Sử dụng hàm buildPaymentUrl của thư viện vnpay
      // Hàm này tự động tính toán hash và tạo URL
      const paymentUrl = this.vnpay.buildPaymentUrl(paymentParams);

      console.log('💳 [VNPay] Created payment URL:', {
        orderId,
        amount,
        environment: this.environment
      });

      return {
        success: true,
        paymentUrl,
        orderId
      };
    } catch (error) {
      console.error('❌ [VNPay] Error creating payment URL:', error);
      throw error;
    }
  }

  /**
   * Xác thực Return URL từ VNPay
   * Sử dụng hàm verifyReturnUrl của thư viện vnpay
   * 
   * @param {Object} queryParams - Query parameters từ VNPay callback
   * @returns {Boolean} True nếu hợp lệ
   */
  verifyReturnUrl(queryParams) {
    try {
      // Sử dụng hàm verifyReturnUrl của thư viện
      // Hàm này tự động kiểm tra secure hash và tmnCode
      const isValid = this.vnpay.verifyReturnUrl(queryParams);

      if (!isValid) {
        console.error('❌ [VNPay] Invalid return URL signature or TmnCode');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ [VNPay] Error verifying return URL:', error);
      return false;
    }
  }

  /**
   * Xử lý Return URL callback từ VNPay
   * Khi khách hàng thanh toán xong, VNPay redirect về đây
   * 
   * @param {Object} queryParams - Query parameters từ callback
   * @returns {Object} Kết quả xử lý
   */
  processReturnUrl(queryParams) {
    try {
      // Xác thực callback
      if (!this.verifyReturnUrl(queryParams)) {
        return {
          success: false,
          message: 'Invalid signature or TmnCode'
        };
      }

      const responseCode = queryParams['vnp_ResponseCode'];
      const transactionStatus = queryParams['vnp_TransactionStatus'];
      const orderId = queryParams['vnp_TxnRef'];
      const amount = parseInt(queryParams['vnp_Amount']) / 100; // Chia cho 100 vì VNPay trả về số tiền đã nhân 100
      const transactionNo = queryParams['vnp_TransactionNo'];
      const bankCode = queryParams['vnp_BankCode'];
      const payDate = queryParams['vnp_PayDate'];

      // ResponseCode: 00 = thành công, khác = thất bại
      // TransactionStatus: 00 = thành công
      const isSuccess = responseCode === '00' && transactionStatus === '00';

      return {
        success: isSuccess,
        orderId,
        transactionNo,
        amount,
        responseCode,
        transactionStatus,
        bankCode,
        payDate,
        paymentStatus: isSuccess ? 'completed' : 'failed',
        message: queryParams['vnp_OrderInfo'] || '',
        rawData: queryParams
      };
    } catch (error) {
      console.error('❌ [VNPay] Error processing return URL:', error);
      return {
        success: false,
        message: error.message
      };
    }
  }

  /**
   * Xác thực IPN (Instant Payment Notification) từ VNPay
   * VNPay gọi endpoint này ngầm để cập nhật trạng thái đơn hàng
   * Sử dụng hàm verifyIpnCall của thư viện vnpay
   * 
   * @param {Object} queryParams - Query parameters từ IPN callback
   * @returns {Boolean} True nếu hợp lệ
   */
  verifyIpnCall(queryParams) {
    try {
      // Sử dụng hàm verifyIpnCall của thư viện
      // Hàm này tự động kiểm tra secure hash
      const isValid = this.vnpay.verifyIpnCall(queryParams);

      if (!isValid) {
        console.error('❌ [VNPay] Invalid IPN signature');
        return false;
      }

      return true;
    } catch (error) {
      console.error('❌ [VNPay] Error verifying IPN:', error);
      return false;
    }
  }

  /**
   * Xử lý IPN callback từ VNPay
   * VNPay gọi endpoint này để cập nhật trạng thái thanh toán
   * 
   * @param {Object} queryParams - Query parameters từ IPN callback
   * @returns {Object} Kết quả xử lý
   */
  processIpnCall(queryParams) {
    try {
      // Xác thực IPN callback
      if (!this.verifyIpnCall(queryParams)) {
        return {
          success: false,
          rspCode: '97',
          message: 'Checksum failed'
        };
      }

      const responseCode = queryParams['vnp_ResponseCode'];
      const orderId = queryParams['vnp_TxnRef'];
      const amount = parseInt(queryParams['vnp_Amount']) / 100; // Chia cho 100 vì VNPay trả về số tiền đã nhân 100
      const transactionNo = queryParams['vnp_TransactionNo'];
      const bankCode = queryParams['vnp_BankCode'];
      const payDate = queryParams['vnp_PayDate'];

      // ResponseCode: 00 = thành công, khác = thất bại
      const isSuccess = responseCode === '00';

      return {
        success: isSuccess,
        rspCode: '00',
        message: 'Success',
        orderId,
        transactionNo,
        amount,
        responseCode,
        bankCode,
        payDate,
        paymentStatus: isSuccess ? 'completed' : 'failed',
        rawData: queryParams
      };
    } catch (error) {
      console.error('❌ [VNPay] Error processing IPN:', error);
      return {
        success: false,
        rspCode: '99',
        message: error.message || 'Unknown error'
      };
    }
  }
}

module.exports = new VnpayService();

