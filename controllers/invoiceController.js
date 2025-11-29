const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const invoiceService = require('../services/invoiceService');

/**
 * @desc    Tạo hóa đơn từ order
 * @route   POST /api/invoices/from-order/:orderId
 * @access  Private
 */
const createInvoiceFromOrder = async (req, res) => {
  try {
    const result = await invoiceService.createInvoiceFromOrder(req.params.orderId, req.user, req);

    res.status(201).json({
      success: true,
      message: 'Tạo hóa đơn thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error creating invoice from order:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi tạo hóa đơn.',
      error: error.message
    });
  }
};

/**
 * @desc    Tạo hóa đơn trực tiếp
 * @route   POST /api/invoices
 * @access  Private
 */
const createInvoice = async (req, res) => {
  try {
    const result = await invoiceService.createInvoice(req.body, req.user, req);

    res.status(201).json({
      success: true,
      message: 'Tạo hóa đơn thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error creating invoice:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi tạo hóa đơn.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách hóa đơn
 * @route   GET /api/invoices
 * @access  Private
 */
const getInvoices = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      invoiceType,
      status,
      paymentStatus,
      startDate,
      endDate,
      search
    } = req.query;

    const filters = {};

    if (invoiceType) filters.invoiceType = invoiceType;
    if (status) filters.status = status;
    if (paymentStatus) filters.paymentStatus = paymentStatus;

    if (startDate || endDate) {
      filters.issueDate = {};
      if (startDate) filters.issueDate.$gte = new Date(startDate);
      if (endDate) filters.issueDate.$lte = new Date(endDate);
    }

    if (search) {
      filters.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { 'buyerInfo.name': { $regex: search, $options: 'i' } },
        { 'sellerInfo.name': { $regex: search, $options: 'i' } }
      ];
    }

    // Kiểm tra phân quyền: Non-admin chỉ xem invoices của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      filters.$or = [
        { seller: req.user._id },
        { buyer: req.user._id },
        { 'sellerInfo.organization': req.user.organizationInfo?.name },
        { 'buyerInfo.organization': req.user.organizationInfo?.name }
      ];
    }

    const result = await Invoice.getInvoices(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting invoices:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách hóa đơn.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy hóa đơn theo ID
 * @route   GET /api/invoices/:id
 * @access  Private
 */
const getInvoiceById = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate('seller', 'fullName organizationInfo')
      .populate('buyer', 'fullName organizationInfo')
      .populate('order', 'orderNumber')
      .populate('createdBy', 'fullName');

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy hóa đơn.'
      });
    }

    // Kiểm tra phân quyền: Non-admin chỉ xem invoices của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      const isSeller = invoice.seller && (
        invoice.seller._id.toString() === req.user._id.toString() ||
        invoice.sellerInfo?.organization === req.user.organizationInfo?.name
      );
      const isBuyer = invoice.buyer && (
        invoice.buyer._id.toString() === req.user._id.toString() ||
        invoice.buyerInfo?.organization === req.user.organizationInfo?.name
      );
      
      if (!isSeller && !isBuyer) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem hóa đơn này.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { invoice }
    });
  } catch (error) {
    console.error('Error getting invoice:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy hóa đơn.',
      error: error.message
    });
  }
};

/**
 * @desc    Ghi nhận thanh toán
 * @route   POST /api/invoices/:id/payment
 * @access  Private
 */
const recordPayment = async (req, res) => {
  try {
    const result = await invoiceService.recordPayment(req.params.id, req.body, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Ghi nhận thanh toán thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi ghi nhận thanh toán.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thống kê hóa đơn
 * @route   GET /api/invoices/stats
 * @access  Private
 */
const getInvoiceStats = async (req, res) => {
  try {
    const { startDate, endDate, invoiceType, status } = req.query;

    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const filters = {};
    if (invoiceType) filters.invoiceType = invoiceType;
    if (status) filters.status = status;

    const stats = await Invoice.getInvoiceStats(dateRange, filters);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error getting invoice stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê hóa đơn.',
      error: error.message
    });
  }
};

module.exports = {
  createInvoiceFromOrder,
  createInvoice,
  getInvoices,
  getInvoiceById,
  recordPayment,
  getInvoiceStats
};

