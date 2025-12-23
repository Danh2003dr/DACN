const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const momoService = require('../services/momoService');
const vnpayService = require('../services/vnpayService');
const { v4: uuidv4 } = require('uuid');

/**
 * @desc    Lấy danh sách thanh toán
 * @route   GET /api/payments
 * @access  Private
 */
const getPayments = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      method,
      startDate,
      endDate,
      search
    } = req.query;

    const filters = {};

    if (status) filters.status = status;
    if (method) filters.method = method;

    if (startDate || endDate) {
      filters.paymentDate = {};
      if (startDate) filters.paymentDate.$gte = new Date(startDate);
      if (endDate) filters.paymentDate.$lte = new Date(endDate);
    }

    if (search) {
      filters.$or = [
        { transactionNumber: { $regex: search, $options: 'i' } },
        { invoiceNumber: { $regex: search, $options: 'i' } }
      ];
    }

    // Kiểm tra phân quyền: Non-admin chỉ xem payments của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      filters.$or = [
        { payer: req.user._id },
        { payee: req.user._id },
        { 'payerInfo.organization': req.user.organizationInfo?.name },
        { 'payeeInfo.organization': req.user.organizationInfo?.name }
      ];
    }

    const result = await Payment.getPayments(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting payments:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thanh toán.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thanh toán theo ID
 * @route   GET /api/payments/:id
 * @access  Private
 */
const getPaymentById = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('payer', 'fullName organizationInfo')
      .populate('payee', 'fullName organizationInfo')
      .populate('invoice', 'invoiceNumber totalAmount')
      .populate('order', 'orderNumber')
      .populate('createdBy', 'fullName');

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán.'
      });
    }

    // Kiểm tra phân quyền: Non-admin chỉ xem payments của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      const isPayer = payment.payer && (
        payment.payer._id.toString() === req.user._id.toString() ||
        payment.payerInfo?.organization === req.user.organizationInfo?.name
      );
      const isPayee = payment.payee && (
        payment.payee._id.toString() === req.user._id.toString() ||
        payment.payeeInfo?.organization === req.user.organizationInfo?.name
      );
      
      if (!isPayer && !isPayee) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem thanh toán này.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { payment }
    });
  } catch (error) {
    console.error('Error getting payment:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thanh toán.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thống kê thanh toán
 * @route   GET /api/payments/stats
 * @access  Private
 */
const getPaymentStats = async (req, res) => {
  try {
    const { startDate, endDate, method, status } = req.query;

    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const filters = {};
    if (method) filters.method = method;
    if (status) filters.status = status;

    const stats = await Payment.getPaymentStats(dateRange, filters);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error getting payment stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê thanh toán.',
      error: error.message
    });
  }
};

/**
 * @desc    Tạo payment request với MoMo
 * @route   POST /api/payments/momo/create
 * @access  Private
 */
const createMomoPayment = async (req, res) => {
  try {
    const { invoiceId, orderId, amount } = req.body;

    // Validate
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán không hợp lệ.'
      });
    }

    // Tìm invoice hoặc order
    let invoice = null;
    let order = null;
    let paymentReference = null;

    if (invoiceId) {
      invoice = await Invoice.findById(invoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hóa đơn.'
        });
      }
      paymentReference = invoice;
    } else if (orderId) {
      order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy đơn hàng.'
        });
      }
      paymentReference = order;
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp invoiceId hoặc orderId.'
      });
    }

    // Tạo request ID và order ID cho MoMo
    const requestId = uuidv4();
    const momoOrderId = invoice 
      ? `INV-${invoice.invoiceNumber}-${Date.now()}`
      : `ORD-${order.orderNumber}-${Date.now()}`;

    // Tạo payment request với MoMo
    const paymentData = {
      orderId: momoOrderId,
      amount: Math.round(amount), // MoMo yêu cầu số nguyên
      orderInfo: invoice 
        ? `Thanh toán hóa đơn ${invoice.invoiceNumber}`
        : `Thanh toán đơn hàng ${order.orderNumber}`,
      extraData: JSON.stringify({
        invoiceId: invoiceId || null,
        orderId: orderId || null,
        userId: req.user._id.toString()
      }),
      requestId: requestId
    };

    const momoResult = await momoService.createPaymentRequest(paymentData);

    // Tạo payment record với status pending
    const payment = new Payment({
      transactionNumber: Payment.generateTransactionNumber(),
      paymentType: invoice ? 'invoice_payment' : 'other',
      invoice: invoiceId || null,
      invoiceNumber: invoice?.invoiceNumber || null,
      order: orderId || null,
      payer: req.user._id,
      payerInfo: {
        name: req.user.fullName,
        organization: req.user.organizationInfo?.name || null
      },
      payee: invoice?.seller || order?.seller || null,
      payeeInfo: {
        name: invoice?.seller?.fullName || order?.seller?.fullName || null,
        organization: invoice?.seller?.organizationInfo?.name || order?.seller?.organizationInfo?.name || null
      },
      amount: amount,
      method: 'momo',
      status: 'pending',
      gatewayTransaction: {
        gateway: 'momo',
        transactionId: momoOrderId,
        gatewayResponse: momoResult
      },
      metadata: {
        momoRequestId: requestId,
        momoOrderId: momoOrderId
      },
      createdBy: req.user._id
    });

    await payment.save();

    res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        paymentUrl: momoResult.paymentUrl,
        deeplink: momoResult.deeplink,
        qrCodeUrl: momoResult.qrCodeUrl,
        orderId: momoOrderId,
        requestId: requestId
      }
    });
  } catch (error) {
    console.error('Error creating MoMo payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tạo thanh toán MoMo.',
      error: error.message
    });
  }
};

/**
 * @desc    Xử lý callback từ MoMo
 * @route   POST /api/payments/momo/callback
 * @access  Public (MoMo sẽ gọi endpoint này)
 */
const momoCallback = async (req, res) => {
  try {
    const callbackData = req.body;

    console.log('📱 [MoMo] Received callback:', callbackData);

    // Xử lý callback
    const result = await momoService.processCallback(callbackData);

    if (!result.success) {
      return res.status(400).json({
        success: false,
        message: result.message || 'Invalid callback data'
      });
    }

    // Tìm payment record dựa trên orderId trong metadata
    const payment = await Payment.findOne({
      'metadata.momoOrderId': result.orderId
    });

    if (!payment) {
      console.error('❌ [MoMo] Payment not found for orderId:', result.orderId);
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    // Cập nhật payment status
    if (result.paymentStatus === 'completed') {
      payment.status = 'completed';
      payment.paymentDate = new Date(result.responseTime);
      payment.gatewayTransaction.transactionId = result.transId;
      payment.gatewayTransaction.gatewayResponse = callbackData;

      // Cập nhật invoice hoặc order payment status
      if (payment.invoice) {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice) {
          invoice.paidAmount = (invoice.paidAmount || 0) + payment.amount;
          invoice.paymentStatus = invoice.paidAmount >= invoice.totalAmount ? 'paid' : 'partial';
          if (invoice.paidAmount >= invoice.totalAmount) {
            invoice.paidDate = new Date();
          }
          await invoice.save();

          // Cập nhật order payment status nếu có
          if (invoice.order) {
            const order = await Order.findById(invoice.order);
            if (order) {
              order.paymentStatus = 'paid';
              await order.save();
            }
          }
        }
      } else if (payment.order) {
        const order = await Order.findById(payment.order);
        if (order) {
          order.paymentStatus = 'paid';
          await order.save();
        }
      }
    } else {
      payment.status = 'failed';
      payment.gatewayTransaction.gatewayResponse = callbackData;
    }

    await payment.save();

    // Trả về response cho MoMo (bắt buộc)
    res.status(200).json({
      resultCode: 0,
      message: 'Success'
    });
  } catch (error) {
    console.error('❌ [MoMo] Error processing callback:', error);
    res.status(500).json({
      resultCode: -1,
      message: 'Internal server error'
    });
  }
};

/**
 * @desc    Kiểm tra trạng thái thanh toán MoMo
 * @route   GET /api/payments/momo/status/:paymentId
 * @access  Private
 */
const checkMomoPaymentStatus = async (req, res) => {
  try {
    const { paymentId } = req.params;

    const payment = await Payment.findById(paymentId);

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy thanh toán.'
      });
    }

    // Kiểm tra quyền truy cập
    if (req.user.role !== 'admin' && payment.payer.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Bạn không có quyền xem thanh toán này.'
      });
    }

    // Nếu payment đã completed hoặc failed, trả về status hiện tại
    if (payment.status === 'completed' || payment.status === 'failed') {
      return res.status(200).json({
        success: true,
        data: {
          paymentId: payment._id,
          status: payment.status,
          amount: payment.amount,
          paymentDate: payment.paymentDate
        }
      });
    }

    // Nếu đang pending, kiểm tra với MoMo
    if (payment.metadata && payment.metadata.momoRequestId && payment.metadata.momoOrderId) {
      const statusResult = await momoService.checkPaymentStatus(
        payment.metadata.momoOrderId,
        payment.metadata.momoRequestId
      );

      // Cập nhật payment status nếu có thay đổi
      if (statusResult.success && statusResult.data.resultCode === 0) {
        if (payment.status === 'pending') {
          payment.status = 'completed';
          payment.paymentDate = new Date();
          await payment.save();
        }
      }

      return res.status(200).json({
        success: true,
        data: {
          paymentId: payment._id,
          status: payment.status,
          amount: payment.amount,
          momoStatus: statusResult.data
        }
      });
    }

    res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        status: payment.status,
        amount: payment.amount
      }
    });
  } catch (error) {
    console.error('Error checking MoMo payment status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi kiểm tra trạng thái thanh toán.',
      error: error.message
    });
  }
};

/**
 * @desc    Tạo payment URL với VNPay
 * @route   POST /api/payments/vnpay/create
 * @access  Private
 * 
 * @note Thông tin Test Card (Sandbox):
 *   - Ngân hàng: NCB
 *   - Số thẻ: 9704198526191432198
 *   - Tên: NGUYEN VAN A
 *   - OTP: 123456
 */
const createVnpayPayment = async (req, res) => {
  try {
    const { invoiceId, orderId, amount, bankCode, orderInfo } = req.body;

    // Debug logging
    console.log('💳 [VNPay Create] Request body:', {
      invoiceId: invoiceId ? (typeof invoiceId === 'object' ? '[Object]' : invoiceId) : null,
      orderId: orderId ? (typeof orderId === 'object' ? '[Object]' : orderId) : null,
      orderIdType: orderId ? typeof orderId : 'null',
      amount,
      orderInfo
    });

    // Validate
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Số tiền thanh toán không hợp lệ.'
      });
    }

    // Normalize IDs - đảm bảo là string hợp lệ
    // Nếu orderId là object (từ frontend serialize sai), chuyển thành string
    let normalizedOrderId = null;
    let normalizedInvoiceId = null;

    if (orderId) {
      if (typeof orderId === 'object' && orderId !== null) {
        console.log('💳 [VNPay Create] orderId is object, normalizing...', {
          orderIdKeys: Object.keys(orderId),
          orderIdValues: Object.values(orderId),
          orderIdConstructor: orderId.constructor?.name
        });
        // Nếu là object, thử lấy string từ các thuộc tính
        if (orderId.toString && typeof orderId.toString === 'function') {
          normalizedOrderId = orderId.toString();
          console.log('💳 [VNPay Create] Normalized via toString():', normalizedOrderId);
        } else if (orderId._id) {
          normalizedOrderId = orderId._id.toString();
          console.log('💳 [VNPay Create] Normalized via _id:', normalizedOrderId);
        } else if (orderId.$oid) {
          // MongoDB extended JSON format
          normalizedOrderId = orderId.$oid;
          console.log('💳 [VNPay Create] Normalized via $oid:', normalizedOrderId);
        } else {
          // Nếu là object với các key như '0', '1', '2'... (chuỗi bị tách)
          const idString = Object.values(orderId).join('');
          console.log('💳 [VNPay Create] Attempting to join object values:', idString);
          if (idString && idString.length === 24 && /^[0-9a-fA-F]{24}$/.test(idString)) {
            normalizedOrderId = idString;
            console.log('💳 [VNPay Create] Normalized via join:', normalizedOrderId);
          } else {
            console.error('💳 [VNPay Create] Invalid orderId format:', {
              orderId,
              idString,
              idStringLength: idString?.length,
              isValidFormat: idString ? /^[0-9a-fA-F]{24}$/.test(idString) : false
            });
            return res.status(400).json({
              success: false,
              message: `orderId không hợp lệ. Nhận được object không thể chuyển đổi thành ObjectId hợp lệ.`
            });
          }
        }
      } else {
        normalizedOrderId = String(orderId).trim();
        console.log('💳 [VNPay Create] orderId is string, normalized:', normalizedOrderId);
      }
      
      // Validate ObjectId format (24 hex characters)
      if (normalizedOrderId && (!/^[0-9a-fA-F]{24}$/.test(normalizedOrderId) || normalizedOrderId.length !== 24)) {
        console.error('💳 [VNPay Create] Invalid ObjectId format after normalization:', {
          normalizedOrderId,
          length: normalizedOrderId?.length,
          isValid: normalizedOrderId ? /^[0-9a-fA-F]{24}$/.test(normalizedOrderId) : false
        });
        return res.status(400).json({
          success: false,
          message: `orderId không đúng định dạng ObjectId (phải là 24 ký tự hex). Nhận được: ${normalizedOrderId?.substring(0, 50)}`
        });
      }
    }

    if (invoiceId) {
      if (typeof invoiceId === 'object' && invoiceId !== null) {
        if (invoiceId.toString && typeof invoiceId.toString === 'function') {
          normalizedInvoiceId = invoiceId.toString();
        } else if (invoiceId._id) {
          normalizedInvoiceId = invoiceId._id.toString();
        } else {
          const idString = Object.values(invoiceId).join('');
          if (idString && idString.length === 24) {
            normalizedInvoiceId = idString;
          } else {
            return res.status(400).json({
              success: false,
              message: 'invoiceId không hợp lệ.'
            });
          }
        }
      } else {
        normalizedInvoiceId = String(invoiceId);
      }
    }

    // Tìm invoice hoặc order
    let invoice = null;
    let order = null;

    if (normalizedInvoiceId) {
      invoice = await Invoice.findById(normalizedInvoiceId);
      if (!invoice) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy hóa đơn.'
        });
      }
    } else if (normalizedOrderId) {
      console.log('💳 [VNPay Create] Looking up order with ID:', normalizedOrderId);
      try {
        order = await Order.findById(normalizedOrderId);
        if (!order) {
          console.error('💳 [VNPay Create] Order not found:', normalizedOrderId);
          return res.status(404).json({
            success: false,
            message: 'Không tìm thấy đơn hàng.'
          });
        }
        console.log('💳 [VNPay Create] Order found:', order.orderNumber || order._id);
      } catch (findError) {
        console.error('💳 [VNPay Create] Error finding order:', findError.message);
        return res.status(400).json({
          success: false,
          message: `Lỗi khi tìm đơn hàng: ${findError.message}`
        });
      }
    } else {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp invoiceId hoặc orderId.'
      });
    }

    // Lấy IP address từ request
    const ipAddr = req.headers['x-forwarded-for'] || 
                   req.connection.remoteAddress || 
                   req.socket.remoteAddress ||
                   (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
                   '127.0.0.1';
    
    // Xử lý IP address (lấy IP đầu tiên nếu là array)
    const clientIp = Array.isArray(ipAddr) ? ipAddr[0] : ipAddr.split(',')[0].trim();

    // Tạo payment URL với VNPay
    // QUAN TRỌNG: vnpayService sẽ tự động tạo orderId duy nhất bằng moment + random
    // để tránh lỗi "Order already exists"
    const paymentData = {
      amount: Math.round(amount), // Số tiền VND (không cần nhân 100, service sẽ xử lý)
      bankCode: bankCode || null, // Mã ngân hàng (tùy chọn)
      orderInfo: orderInfo || (invoice 
        ? `Thanh toan hoa don ${invoice.invoiceNumber}`
        : `Thanh toan don hang ${order.orderNumber}`),
      ipAddr: clientIp,
      locale: 'vi',
      orderType: 'other'
    };

    const result = vnpayService.createPaymentUrl(paymentData);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Không thể tạo URL thanh toán VNPay.'
      });
    }

    // Tạo payment record với status pending
    const payment = new Payment({
      transactionNumber: Payment.generateTransactionNumber(),
      paymentType: invoice ? 'invoice_payment' : 'other',
      invoice: normalizedInvoiceId || null,
      invoiceNumber: invoice?.invoiceNumber || null,
      order: normalizedOrderId || null,
      payer: req.user._id,
      payerInfo: {
        name: req.user.fullName,
        organization: req.user.organizationInfo?.name || null
      },
      payee: invoice?.seller || order?.seller || null,
      payeeInfo: {
        name: invoice?.seller?.fullName || order?.seller?.fullName || null,
        organization: invoice?.seller?.organizationInfo?.name || order?.seller?.organizationInfo?.name || null
      },
      amount: amount,
      method: 'vnpay', // VNPay payment method
      status: 'pending',
      gatewayTransaction: {
        gateway: 'vnpay',
        transactionId: result.orderId,
        gatewayResponse: { paymentUrl: result.paymentUrl }
      },
      metadata: {
        vnpayOrderId: result.orderId
      },
      createdBy: req.user._id
    });

    await payment.save();

    res.status(200).json({
      success: true,
      data: {
        paymentId: payment._id,
        paymentUrl: result.paymentUrl,
        orderId: result.orderId
      }
    });
  } catch (error) {
    console.error('Error creating VNPay payment:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi server khi tạo thanh toán VNPay.',
      error: error.message
    });
  }
};

/**
 * @desc    Xử lý Return URL từ VNPay (khách hàng được redirect về đây sau khi thanh toán)
 * @route   GET /api/payments/vnpay/return
 * @access  Public (VNPay sẽ redirect về đây)
 */
const vnpayReturn = async (req, res) => {
  try {
    const queryParams = req.query;

    console.log('💳 [VNPay] Received return callback:', queryParams);

    // Xử lý return URL
    const result = vnpayService.processReturnUrl(queryParams);

    if (!result.success) {
      console.error('❌ [VNPay] Invalid return URL:', result.message);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/payments/vnpay/callback?success=false&message=${encodeURIComponent(result.message || 'Invalid callback')}`);
    }

    // Tìm payment record dựa trên orderId trong metadata
    const payment = await Payment.findOne({
      'metadata.vnpayOrderId': result.orderId
    });

    if (!payment) {
      console.error('❌ [VNPay] Payment not found for orderId:', result.orderId);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/payments/vnpay/callback?success=false&message=${encodeURIComponent('Payment not found')}`);
    }

    // Kiểm tra số tiền có khớp không (từ database)
    // QUAN TRỌNG: Đây là bước xác thực quan trọng trong tài liệu VNPay
    // Nếu số tiền không khớp, có thể bị gian lận
    const expectedAmount = payment.amount;
    if (Math.abs(result.amount - expectedAmount) > 0.01) {
      console.error('❌ [VNPay] Amount mismatch:', {
        expected: expectedAmount,
        received: result.amount,
        orderId: result.orderId
      });
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      return res.redirect(`${frontendUrl}/payments/vnpay/callback?success=false&message=${encodeURIComponent('Amount mismatch')}`);
    }

    // Cập nhật payment status nếu chưa được cập nhật bởi IPN
    // (IPN có thể được gọi trước return URL, nên cần kiểm tra status hiện tại)
    if (payment.status === 'pending') {
      if (result.paymentStatus === 'completed') {
        payment.status = 'completed';
        payment.paymentDate = new Date();
        payment.gatewayTransaction.transactionId = result.transactionNo;
        payment.gatewayTransaction.gatewayResponse = result.rawData;
        payment.bankTransaction = {
          bankName: result.bankCode || '',
          transactionId: result.transactionNo,
          referenceNumber: result.orderId
        };

        // Cập nhật invoice hoặc order payment status
        if (payment.invoice) {
          const invoice = await Invoice.findById(payment.invoice);
          if (invoice) {
            invoice.paidAmount = (invoice.paidAmount || 0) + payment.amount;
            invoice.paymentStatus = invoice.paidAmount >= invoice.totalAmount ? 'paid' : 'partial';
            if (invoice.paidAmount >= invoice.totalAmount) {
              invoice.paidDate = new Date();
            }
            await invoice.save();

            // Cập nhật order payment status nếu có
            if (invoice.order) {
              const order = await Order.findById(invoice.order);
              if (order) {
                order.paymentStatus = 'paid';
                await order.save();
              }
            }
          }
        } else if (payment.order) {
          const order = await Order.findById(payment.order);
          if (order) {
            order.paymentStatus = 'paid';
            await order.save();
          }
        }
      } else {
        payment.status = 'failed';
        payment.gatewayTransaction.gatewayResponse = result.rawData;
      }

      await payment.save();
    }

    // Redirect về frontend với kết quả
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const redirectUrl = result.paymentStatus === 'completed'
      ? `${frontendUrl}/payments/vnpay/callback?success=true&paymentId=${payment._id}&orderId=${result.orderId}`
      : `${frontendUrl}/payments/vnpay/callback?success=false&message=${encodeURIComponent(result.message || 'Payment failed')}`;

    res.redirect(redirectUrl);
  } catch (error) {
    console.error('❌ [VNPay] Error processing return URL:', error);
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/payments/vnpay/callback?success=false&message=${encodeURIComponent('Internal server error')}`);
  }
};

/**
 * @desc    Xử lý IPN (Instant Payment Notification) từ VNPay
 * @route   GET /api/payments/vnpay/ipn
 * @access  Public (VNPay sẽ gọi endpoint này ngầm)
 * 
 * QUAN TRỌNG: 
 * - VNPay gọi endpoint này ngầm để cập nhật trạng thái đơn hàng
 * - Phải trả về JSON chuẩn: { RspCode: '00', Message: 'success' }
 * - Phải kiểm tra: checksum, orderId tồn tại, amount khớp, status chưa được cập nhật
 */
const vnpayIpn = async (req, res) => {
  try {
    const queryParams = req.query;

    console.log('💳 [VNPay] Received IPN callback:', queryParams);

    // Xử lý IPN callback
    const result = vnpayService.processIpnCall(queryParams);

    // Nếu checksum không hợp lệ
    if (result.rspCode === '97') {
      return res.status(200).json({
        RspCode: '97',
        Message: 'Checksum failed'
      });
    }

    if (!result.success) {
      return res.status(200).json({
        RspCode: result.rspCode || '99',
        Message: result.message || 'Unknown error'
      });
    }

    // Tìm payment record dựa trên orderId trong metadata
    // QUAN TRỌNG: Kiểm tra orderId có tồn tại trong database không
    const payment = await Payment.findOne({
      'metadata.vnpayOrderId': result.orderId
    });

    if (!payment) {
      console.error('❌ [VNPay] Payment not found for orderId:', result.orderId);
      // Trả về RspCode '01' theo tài liệu VNPay
      return res.status(200).json({
        RspCode: '01',
        Message: 'Order not found'
      });
    }

    // QUAN TRỌNG: Kiểm tra số tiền có khớp với database không
    // Đây là bước bảo mật quan trọng trong tài liệu VNPay
    // Format: vnp_Amount từ VNPay đã được chia 100 trong processIpnCall
    const expectedAmount = payment.amount;
    if (Math.abs(result.amount - expectedAmount) > 0.01) {
      console.error('❌ [VNPay] Amount mismatch in IPN:', {
        expected: expectedAmount,
        received: result.amount,
        orderId: result.orderId
      });
      // Trả về RspCode '04' theo tài liệu VNPay
      return res.status(200).json({
        RspCode: '04',
        Message: 'Amount invalid'
      });
    }

    // QUAN TRỌNG: Kiểm tra trạng thái đơn hàng hiện tại
    // Nếu đã được cập nhật rồi (không phải 'pending'), không cập nhật lại
    // Điều này tránh xử lý 2 lần cùng một giao dịch
    const currentPaymentStatus = payment.status;
    if (currentPaymentStatus !== 'pending') {
      console.log(`💳 [VNPay] Payment ${result.orderId} already processed with status: ${currentPaymentStatus}`);
      // Trả về RspCode '02' theo tài liệu VNPay
      return res.status(200).json({
        RspCode: '02',
        Message: 'This order has been updated to the payment status'
      });
    }

    // Cập nhật payment status
    if (result.paymentStatus === 'completed') {
      payment.status = 'completed';
      payment.paymentDate = new Date();
      payment.gatewayTransaction.transactionId = result.transactionNo;
      payment.gatewayTransaction.gatewayResponse = result.rawData;
      payment.bankTransaction = {
        bankName: result.bankCode || '',
        transactionId: result.transactionNo,
        referenceNumber: result.orderId
      };

      // Cập nhật invoice hoặc order payment status
      if (payment.invoice) {
        const invoice = await Invoice.findById(payment.invoice);
        if (invoice) {
          invoice.paidAmount = (invoice.paidAmount || 0) + payment.amount;
          invoice.paymentStatus = invoice.paidAmount >= invoice.totalAmount ? 'paid' : 'partial';
          if (invoice.paidAmount >= invoice.totalAmount) {
            invoice.paidDate = new Date();
          }
          await invoice.save();

          // Cập nhật order payment status nếu có
          if (invoice.order) {
            const order = await Order.findById(invoice.order);
            if (order) {
              order.paymentStatus = 'paid';
              await order.save();
            }
          }
        }
      } else if (payment.order) {
        const order = await Order.findById(payment.order);
        if (order) {
          order.paymentStatus = 'paid';
          await order.save();
        }
      }
    } else {
      payment.status = 'failed';
      payment.gatewayTransaction.gatewayResponse = result.rawData;
    }

    await payment.save();

    console.log(`✅ [VNPay] IPN processed successfully for orderId: ${result.orderId}, status: ${payment.status}`);

    // Trả về response chuẩn cho VNPay
    // QUAN TRỌNG: Phải trả về đúng format này
    return res.status(200).json({
      RspCode: '00',
      Message: 'Success'
    });
  } catch (error) {
    console.error('❌ [VNPay] Error processing IPN:', error);
    // Trả về RspCode '99' cho lỗi không xác định
    return res.status(200).json({
      RspCode: '99',
      Message: 'Unknown error'
    });
  }
};

module.exports = {
  getPayments,
  getPaymentById,
  getPaymentStats,
  createMomoPayment,
  momoCallback,
  checkMomoPaymentStatus,
  createVnpayPayment,
  vnpayReturn,
  vnpayIpn
};

