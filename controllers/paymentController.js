const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

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

module.exports = {
  getPayments,
  getPaymentById,
  getPaymentStats
};

