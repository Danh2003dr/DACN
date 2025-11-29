const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Drug = require('../models/Drug');
const inventoryService = require('../services/inventoryService');

/**
 * @desc    Lấy danh sách tồn kho
 * @route   GET /api/inventory
 * @access  Private
 */
const getInventory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      locationId,
      drugId,
      status,
      lowStock,
      nearExpiry,
      expired,
      search
    } = req.query;

    // Build filter
    const filter = {};

    if (locationId) {
      filter['location.locationId'] = locationId;
    }

    if (drugId) {
      filter.drugId = drugId;
    }

    if (status) {
      filter.status = status;
    }

    if (lowStock === 'true') {
      filter.quantity = { $lte: '$minStock' };
    }

    if (nearExpiry === 'true') {
      const today = new Date();
      const thirtyDaysLater = new Date(today);
      thirtyDaysLater.setDate(today.getDate() + 30);
      filter.expiryDate = {
        $gte: today,
        $lte: thirtyDaysLater
      };
    }

    if (expired === 'true') {
      filter.expiryDate = { $lt: new Date() };
    }

    if (search) {
      filter.$or = [
        { drugName: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
        { drugId: { $regex: search, $options: 'i' } }
      ];
    }

    // Kiểm tra phân quyền: Non-admin chỉ xem inventory của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      filter['location.organizationId'] = req.user.organizationId;
    }

    // Query
    const query = Inventory.find(filter);

    // Sort
    query.sort({ drugName: 1, expiryDate: 1 });

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    query.skip(skip).limit(parseInt(limit));

    // Populate
    query.populate('drug', 'name activeIngredient dosage form')
      .populate('supplier', 'fullName organizationInfo')
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName');

    const [items, total] = await Promise.all([
      query.exec(),
      Inventory.countDocuments(filter)
    ]);

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách tồn kho.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy tồn kho theo ID
 * @route   GET /api/inventory/:id
 * @access  Private
 */
const getInventoryById = async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id)
      .populate('drug', 'name activeIngredient dosage form')
      .populate('supplier', 'fullName organizationInfo')
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy tồn kho.'
      });
    }

    // Kiểm tra phân quyền: Non-admin chỉ xem inventory của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      if (item.location?.organizationId && item.location.organizationId.toString() !== req.user.organizationId.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem tồn kho này.'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: { item }
    });
  } catch (error) {
    console.error('Error getting inventory:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tồn kho.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy tồn kho theo địa điểm
 * @route   GET /api/inventory/location/:locationId
 * @access  Private
 */
const getInventoryByLocation = async (req, res) => {
  try {
    const { locationId } = req.params;
    const filters = req.query;

    const items = await Inventory.getStockByLocation(locationId, filters);

    res.status(200).json({
      success: true,
      data: { items }
    });
  } catch (error) {
    console.error('Error getting inventory by location:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tồn kho theo địa điểm.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy tổng tồn kho của một drug
 * @route   GET /api/inventory/drug/:drugId/total
 * @access  Private
 */
const getTotalStock = async (req, res) => {
  try {
    const { drugId } = req.params;
    const total = await Inventory.getTotalStock(drugId);

    res.status(200).json({
      success: true,
      data: { total }
    });
  } catch (error) {
    console.error('Error getting total stock:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy tổng tồn kho.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thống kê tồn kho
 * @route   GET /api/inventory/stats
 * @access  Private
 */
const getInventoryStats = async (req, res) => {
  try {
    const { locationId } = req.query;
    const stats = await Inventory.getStockStats(locationId);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error getting inventory stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê tồn kho.',
      error: error.message
    });
  }
};

/**
 * @desc    Nhập kho
 * @route   POST /api/inventory/stock-in
 * @access  Private
 */
const stockIn = async (req, res) => {
  try {
    const result = await inventoryService.stockIn(req.body, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Nhập kho thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error stocking in:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi nhập kho.',
      error: error.message
    });
  }
};

/**
 * @desc    Xuất kho
 * @route   POST /api/inventory/stock-out
 * @access  Private
 */
const stockOut = async (req, res) => {
  try {
    const result = await inventoryService.stockOut(req.body, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Xuất kho thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error stocking out:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi xuất kho.',
      error: error.message
    });
  }
};

/**
 * @desc    Điều chỉnh kho
 * @route   POST /api/inventory/adjust
 * @access  Private
 */
const adjustStock = async (req, res) => {
  try {
    const result = await inventoryService.adjustStock(req.body, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Điều chỉnh kho thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error adjusting stock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi điều chỉnh kho.',
      error: error.message
    });
  }
};

/**
 * @desc    Chuyển kho
 * @route   POST /api/inventory/transfer
 * @access  Private
 */
const transferStock = async (req, res) => {
  try {
    const result = await inventoryService.transferStock(req.body, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Chuyển kho thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error transferring stock:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi chuyển kho.',
      error: error.message
    });
  }
};

/**
 * @desc    Kiểm kê kho
 * @route   POST /api/inventory/stocktake
 * @access  Private
 */
const stocktake = async (req, res) => {
  try {
    const result = await inventoryService.stocktake(req.body, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Kiểm kê kho thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error stocktaking:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi kiểm kê kho.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách transactions
 * @route   GET /api/inventory/transactions
 * @access  Private
 */
const getTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      drugId,
      locationId,
      startDate,
      endDate
    } = req.query;

    const filters = {};

    if (type) filters.type = type;
    if (drugId) filters.drugId = drugId;
    if (locationId) filters['location.locationId'] = locationId;

    if (startDate || endDate) {
      filters.transactionDate = {};
      if (startDate) filters.transactionDate.$gte = new Date(startDate);
      if (endDate) filters.transactionDate.$lte = new Date(endDate);
    }

    const result = await InventoryTransaction.getTransactions(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách giao dịch.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thống kê transactions
 * @route   GET /api/inventory/transactions/stats
 * @access  Private
 */
const getTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate, locationId } = req.query;

    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const stats = await InventoryTransaction.getTransactionStats(dateRange, locationId);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error getting transaction stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê giao dịch.',
      error: error.message
    });
  }
};

module.exports = {
  getInventory,
  getInventoryById,
  getInventoryByLocation,
  getTotalStock,
  getInventoryStats,
  stockIn,
  stockOut,
  adjustStock,
  transferStock,
  stocktake,
  getTransactions,
  getTransactionStats
};

