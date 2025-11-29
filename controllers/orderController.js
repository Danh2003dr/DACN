const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const orderService = require('../services/orderService');

/**
 * @desc    Tạo đơn hàng mới
 * @route   POST /api/orders
 * @access  Private
 */
const createOrder = async (req, res) => {
  try {
    const result = await orderService.createOrder(req.body, req.user, req);

    res.status(201).json({
      success: true,
      message: 'Tạo đơn hàng thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi tạo đơn hàng.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách đơn hàng
 * @route   GET /api/orders
 * @access  Private
 */
const getOrders = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      orderType,
      status,
      buyerId,
      sellerId,
      startDate,
      endDate,
      search
    } = req.query;

    const filters = {};

    if (orderType) filters.orderType = orderType;
    if (status) filters.status = status;
    if (buyerId) filters.buyer = buyerId;
    if (sellerId) filters.seller = sellerId;

    if (startDate || endDate) {
      filters.orderDate = {};
      if (startDate) filters.orderDate.$gte = new Date(startDate);
      if (endDate) filters.orderDate.$lte = new Date(endDate);
    }

    if (search) {
      filters.$or = [
        { orderNumber: { $regex: search, $options: 'i' } },
        { buyerName: { $regex: search, $options: 'i' } },
        { sellerName: { $regex: search, $options: 'i' } }
      ];
    }

    // Kiểm tra phân quyền: Non-admin chỉ xem orders của tổ chức mình
    // Chỉ áp dụng nếu user có organizationId VÀ không phải admin
    if (req.user.role !== 'admin' && req.user.organizationId) {
      const orgFilter = {
        $or: [
          { buyer: req.user._id },
          { seller: req.user._id },
          { createdBy: req.user._id },
          { buyerOrganization: req.user.organizationInfo?.name },
          { sellerOrganization: req.user.organizationInfo?.name }
        ]
      };
      
      // Kết hợp với search filter nếu có
      if (filters.$or) {
        filters.$and = [{ $or: filters.$or }, orgFilter];
        delete filters.$or;
      } else {
        filters.$or = orgFilter.$or;
      }
    }

    const result = await Order.getOrders(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting orders:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đơn hàng.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy đơn hàng theo ID
 * @route   GET /api/orders/:id
 * @access  Private
 */
const getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items')
      .populate('createdBy', 'fullName role')
      .populate('buyer', 'fullName organizationInfo')
      .populate('seller', 'fullName organizationInfo')
      .populate('supplyChain', 'status');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đơn hàng.'
      });
    }

    // Kiểm tra phân quyền: Non-admin chỉ xem orders của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      const isBuyer = order.buyer && (
        order.buyer._id.toString() === req.user._id.toString() ||
        order.buyerOrganization === req.user.organizationInfo?.name
      );
      const isSeller = order.seller && (
        order.seller._id.toString() === req.user._id.toString() ||
        order.sellerOrganization === req.user.organizationInfo?.name
      );
      const isCreator = order.createdBy && order.createdBy._id.toString() === req.user._id.toString();
      
      if (!isBuyer && !isSeller && !isCreator) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem đơn hàng này.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { order }
    });
  } catch (error) {
    console.error('Error getting order:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy đơn hàng.',
      error: error.message
    });
  }
};

/**
 * @desc    Xác nhận đơn hàng
 * @route   POST /api/orders/:id/confirm
 * @access  Private
 */
const confirmOrder = async (req, res) => {
  try {
    const result = await orderService.confirmOrder(req.params.id, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Xác nhận đơn hàng thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error confirming order:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi xác nhận đơn hàng.',
      error: error.message
    });
  }
};

/**
 * @desc    Xử lý đơn hàng
 * @route   POST /api/orders/:id/process
 * @access  Private
 */
const processOrder = async (req, res) => {
  try {
    const { locationId } = req.body;
    if (!locationId) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp locationId.'
      });
    }

    const result = await orderService.processOrder(req.params.id, locationId, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Xử lý đơn hàng thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error processing order:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi xử lý đơn hàng.',
      error: error.message
    });
  }
};

/**
 * @desc    Giao hàng
 * @route   POST /api/orders/:id/ship
 * @access  Private
 */
const shipOrder = async (req, res) => {
  try {
    const result = await orderService.shipOrder(req.params.id, req.body, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông tin giao hàng thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error shipping order:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật thông tin giao hàng.',
      error: error.message
    });
  }
};

/**
 * @desc    Xác nhận nhận hàng
 * @route   POST /api/orders/:id/deliver
 * @access  Private
 */
const deliverOrder = async (req, res) => {
  try {
    const result = await orderService.deliverOrder(req.params.id, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Xác nhận nhận hàng thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error delivering order:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi xác nhận nhận hàng.',
      error: error.message
    });
  }
};

/**
 * @desc    Hủy đơn hàng
 * @route   POST /api/orders/:id/cancel
 * @access  Private
 */
const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng cung cấp lý do hủy đơn hàng.'
      });
    }

    const result = await orderService.cancelOrder(req.params.id, reason, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Hủy đơn hàng thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error cancelling order:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi hủy đơn hàng.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thống kê đơn hàng
 * @route   GET /api/orders/stats
 * @access  Private
 */
const getOrderStats = async (req, res) => {
  try {
    const { startDate, endDate, orderType, status } = req.query;

    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const filters = {};
    if (orderType) filters.orderType = orderType;
    if (status) filters.status = status;

    const stats = await Order.getOrderStats(dateRange, filters);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error getting order stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê đơn hàng.',
      error: error.message
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  confirmOrder,
  processOrder,
  shipOrder,
  deliverOrder,
  cancelOrder,
  getOrderStats
};

