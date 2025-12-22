const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const momoService = require('../services/momoService');
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

module.exports = {
  getPayments,
  getPaymentById,
  getPaymentStats,
  createMomoPayment,
  momoCallback,
  checkMomoPaymentStatus
};

