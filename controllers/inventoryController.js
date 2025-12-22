const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Drug = require('../models/Drug');
const inventoryService = require('../services/inventoryService');

/**
 * Helper function để kiểm tra quyền truy cập location
 * @param {Object} user - User object từ req.user
 * @param {String} locationId - Location ID cần kiểm tra
 * @returns {Promise<{hasAccess: Boolean, organizationId: String|null, isNewLocation: Boolean}>}
 */
const checkLocationAccess = async (user, locationId) => {
  // Admin có quyền truy cập tất cả
  if (user.role === 'admin') {
    return { hasAccess: true, organizationId: null, isNewLocation: false };
  }

  // Lấy một inventory item tại location này để kiểm tra organizationId
  const inventoryItem = await Inventory.findOne({
    'location.locationId': locationId
  }).select('location.organizationId');

  if (!inventoryItem) {
    // Location chưa có inventory, có thể là location mới
    // Cho phép user tạo inventory tại location của organization mình
    return { 
      hasAccess: true, 
      organizationId: user.organizationId || null,
      isNewLocation: true
    };
  }

  const locationOrgId = inventoryItem.location?.organizationId;
  
  // Kiểm tra location có thuộc organization của user không
  if (user.organizationId && locationOrgId) {
    const hasAccess = locationOrgId.toString() === user.organizationId.toString();
    return { 
      hasAccess, 
      organizationId: locationOrgId,
      isNewLocation: false
    };
  }

  // Không có organizationId, từ chối
  return { 
    hasAccess: false, 
    organizationId: locationOrgId || null,
    isNewLocation: false
  };
};

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

    // Xử lý search filter
    if (search) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { drugName: { $regex: search, $options: 'i' } },
          { batchNumber: { $regex: search, $options: 'i' } },
          { drugId: { $regex: search, $options: 'i' } }
        ]
      });
    }

    // Kiểm tra phân quyền: Non-admin chỉ xem inventory của tổ chức mình
    // Tạm thời cho phép items không có organizationId để tương thích ngược
    if (req.user.role !== 'admin' && req.user.organizationId) {
      filter.$and = filter.$and || [];
      filter.$and.push({
        $or: [
          { 'location.organizationId': req.user.organizationId },
          { 'location.organizationId': { $exists: false } },
          { 'location.organizationId': null }
        ]
      });
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
    const filters = req.query || {};

    // Kiểm tra phân quyền: Non-admin chỉ xem inventory của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      // Lấy một item đầu tiên để kiểm tra organizationId của location
      const sampleItem = await Inventory.findOne({ 'location.locationId': locationId });
      if (sampleItem && sampleItem.location?.organizationId) {
        if (sampleItem.location.organizationId.toString() !== req.user.organizationId.toString()) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xem tồn kho tại địa điểm này.'
          });
        }
      }
      // Thêm filter organizationId vào filters
      filters['location.organizationId'] = req.user.organizationId;
    }

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
    
    // Kiểm tra phân quyền: Non-admin chỉ tính tổng tồn kho của tổ chức mình
    // Cần query với filter organizationId nếu non-admin
    let total;
    if (req.user.role !== 'admin' && req.user.organizationId) {
      // Lấy tổng tồn kho với filter organizationId
      const result = await Inventory.aggregate([
        {
          $match: {
            drugId: drugId,
            status: { $in: ['available', 'reserved'] },
            'location.organizationId': req.user.organizationId
          }
        },
        {
          $group: {
            _id: null,
            totalQuantity: { $sum: '$quantity' },
            totalValue: { $sum: '$totalValue' },
            locations: { $addToSet: '$location.locationId' }
          }
        }
      ]);
      
      total = result[0] || {
        totalQuantity: 0,
        totalValue: 0,
        locations: []
      };
    } else {
      total = await Inventory.getTotalStock(drugId);
    }

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
    
    // Build match filter
    let match = {};
    if (locationId) {
      match['location.locationId'] = locationId;
    }
    
    // Kiểm tra phân quyền: Non-admin chỉ xem stats của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      match['location.organizationId'] = req.user.organizationId;
    }
    
    // Tính stats với match filter
    const stats = await Inventory.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalItems: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalValue: { $sum: '$totalValue' },
          byStatus: {
            $push: '$status'
          },
          lowStock: {
            $sum: {
              $cond: [
                { $lte: ['$quantity', '$minStock'] },
                1,
                0
              ]
            }
          },
          expired: {
            $sum: {
              $cond: [
                { $lt: ['$expiryDate', new Date()] },
                1,
                0
              ]
            }
          },
          nearExpiry: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lte: ['$daysUntilExpiry', 30] },
                    { $gt: ['$daysUntilExpiry', 0] }
                  ]
                },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          totalItems: 1,
          totalQuantity: 1,
          totalValue: 1,
          lowStock: 1,
          expired: 1,
          nearExpiry: 1,
          statusCounts: {
            $arrayToObject: {
              $map: {
                input: { $setUnion: '$byStatus' },
                as: 'status',
                in: {
                  k: '$$status',
                  v: {
                    $size: {
                      $filter: {
                        input: '$byStatus',
                        cond: { $eq: ['$$this', '$$status'] }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]);

    const result = stats[0] || {
      totalItems: 0,
      totalQuantity: 0,
      totalValue: 0,
      lowStock: 0,
      expired: 0,
      nearExpiry: 0,
      statusCounts: {}
    };

    res.status(200).json({
      success: true,
      data: { stats: result }
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
    const { locationId } = req.body;
    
    // Kiểm tra quyền truy cập location
    if (locationId && req.user.role !== 'admin') {
      const locationAccess = await checkLocationAccess(req.user, locationId);
      
      if (!locationAccess.hasAccess && !locationAccess.isNewLocation) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền nhập kho tại địa điểm này.'
        });
      }
      
      // Nếu là location mới, đảm bảo organizationId được set đúng
      if (locationAccess.isNewLocation && req.body.location) {
        req.body.location.organizationId = req.user.organizationId;
      }
    }

    const result = await inventoryService.stockIn(req.body, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Nhập kho thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error stocking in:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      body: req.body
    });
    
    // Trả về message lỗi rõ ràng hơn
    const errorMessage = error.message || 'Lỗi khi nhập kho. Vui lòng kiểm tra lại thông tin.';
    
    res.status(400).json({
      success: false,
      message: errorMessage,
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
    const { locationId } = req.body;
    
    // Kiểm tra quyền truy cập location
    if (locationId && req.user.role !== 'admin') {
      const locationAccess = await checkLocationAccess(req.user, locationId);
      
      if (!locationAccess.hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xuất kho tại địa điểm này.'
        });
      }
    }

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
    const { locationId } = req.body;
    
    // Kiểm tra quyền truy cập location
    if (locationId && req.user.role !== 'admin') {
      const locationAccess = await checkLocationAccess(req.user, locationId);
      
      if (!locationAccess.hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền điều chỉnh kho tại địa điểm này.'
        });
      }
    }

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
    const { fromLocationId, toLocationId } = req.body;
    
    // Kiểm tra quyền truy cập cả 2 locations
    if (req.user.role !== 'admin') {
      // Kiểm tra fromLocation
      if (fromLocationId) {
        const fromAccess = await checkLocationAccess(req.user, fromLocationId);
        if (!fromAccess.hasAccess) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền xuất kho từ địa điểm này.'
          });
        }
      }
      
      // Kiểm tra toLocation
      if (toLocationId) {
        const toAccess = await checkLocationAccess(req.user, toLocationId);
        if (!toAccess.hasAccess && !toAccess.isNewLocation) {
          return res.status(403).json({
            success: false,
            message: 'Bạn không có quyền nhập kho vào địa điểm này.'
          });
        }
        
        // Đảm bảo cả 2 locations thuộc cùng organization
        if (fromLocationId) {
          const fromAccess = await checkLocationAccess(req.user, fromLocationId);
          if (toAccess.organizationId && fromAccess.organizationId && 
              toAccess.organizationId.toString() !== fromAccess.organizationId.toString()) {
            return res.status(403).json({
              success: false,
              message: 'Không thể chuyển kho giữa các tổ chức khác nhau.'
            });
          }
        }
      }
    }

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
    const { locationId } = req.body;
    
    // Kiểm tra quyền truy cập location
    if (locationId && req.user.role !== 'admin') {
      const locationAccess = await checkLocationAccess(req.user, locationId);
      
      if (!locationAccess.hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền kiểm kê kho tại địa điểm này.'
        });
      }
    }

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

    // Kiểm tra phân quyền: Non-admin chỉ xem transactions của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      // Lấy danh sách locationIds thuộc organization của user
      const userLocationIds = await Inventory.find({
        'location.organizationId': req.user.organizationId
      }).distinct('location.locationId');
      
      // Filter transactions chỉ từ các locations này
      if (userLocationIds.length > 0) {
        // Nếu đã có filter locationId, kiểm tra nó có trong userLocationIds không
        if (locationId) {
          if (!userLocationIds.includes(locationId)) {
            // Location không thuộc organization của user, trả về empty
            filters['location.locationId'] = { $in: [] };
          } else {
            filters['location.locationId'] = locationId;
          }
        } else {
          // Filter theo tất cả locations của user
          filters['location.locationId'] = { $in: userLocationIds };
        }
      } else {
        // Không có inventory items nào, trả về empty
        filters['location.locationId'] = { $in: [] };
      }
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

    let effectiveLocationId = locationId;

    // Kiểm tra phân quyền: Non-admin chỉ xem stats của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      // Lấy danh sách locationIds thuộc organization của user
      const userLocationIds = await Inventory.find({
        'location.organizationId': req.user.organizationId
      }).distinct('location.locationId');
      
      if (userLocationIds.length === 0) {
        // Không có locations nào, trả về empty stats
        return res.status(200).json({
          success: true,
          data: {
            stats: {
              totalTransactions: 0,
              totalIn: 0,
              totalOut: 0,
              totalValue: 0,
              byType: {},
              byStatus: {}
            }
          }
        });
      }

      // Nếu có locationId, kiểm tra nó có thuộc organization không
      if (locationId && !userLocationIds.includes(locationId)) {
        return res.status(403).json({
          success: false,
          message: 'Bạn không có quyền xem thống kê tại địa điểm này.'
        });
      }

      // Nếu không có locationId, sẽ filter theo tất cả locations của user trong getTransactionStats
      // Nhưng getTransactionStats không hỗ trợ array locationIds, nên ta sẽ không truyền locationId
      // và filter sau trong aggregation
      effectiveLocationId = null; // Sẽ filter bằng cách khác
    }

    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    let stats = await InventoryTransaction.getTransactionStats(dateRange, effectiveLocationId);

    // Nếu non-admin và không có locationId cụ thể, filter theo organization locations
    if (req.user.role !== 'admin' && req.user.organizationId && !locationId) {
      const userLocationIds = await Inventory.find({
        'location.organizationId': req.user.organizationId
      }).distinct('location.locationId');
      
      // Re-query với filter locationIds
      const match = { 'location.locationId': { $in: userLocationIds } };
      if (dateRange.startDate || dateRange.endDate) {
        match.transactionDate = {};
        if (dateRange.startDate) match.transactionDate.$gte = new Date(dateRange.startDate);
        if (dateRange.endDate) match.transactionDate.$lte = new Date(dateRange.endDate);
      }
      
      stats = await InventoryTransaction.aggregate([
        { $match: match },
        {
          $group: {
            _id: null,
            totalTransactions: { $sum: 1 },
            totalIn: {
              $sum: {
                $cond: [{ $eq: ['$type', 'in'] }, '$quantity', 0]
              }
            },
            totalOut: {
              $sum: {
                $cond: [{ $eq: ['$type', 'out'] }, '$quantity', 0]
              }
            },
            totalValue: { $sum: '$totalValue' },
            byType: {
              $push: '$type'
            },
            byStatus: {
              $push: '$status'
            }
          }
        },
        {
          $project: {
            totalTransactions: 1,
            totalIn: 1,
            totalOut: 1,
            totalValue: 1,
            byType: 1,
            byStatus: 1,
            typeCounts: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: '$byType' },
                  as: 'type',
                  in: {
                    k: '$$type',
                    v: {
                      $size: {
                        $filter: {
                          input: '$byType',
                          cond: { $eq: ['$$this', '$$type'] }
                        }
                      }
                    }
                  }
                }
              }
            },
            statusCounts: {
              $arrayToObject: {
                $map: {
                  input: { $setUnion: '$byStatus' },
                  as: 'status',
                  in: {
                    k: '$$status',
                    v: {
                      $size: {
                        $filter: {
                          input: '$byStatus',
                          cond: { $eq: ['$$this', '$$status'] }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      ]);
      
      stats = stats[0] || {
        totalTransactions: 0,
        totalIn: 0,
        totalOut: 0,
        totalValue: 0,
        typeCounts: {},
        statusCounts: {}
      };
    }

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

/**
 * @desc    Lấy danh sách các locations có sẵn
 * @route   GET /api/inventory/locations
 * @access  Private
 */
const getLocations = async (req, res) => {
  try {
    // Build filter
    const filter = {};
    
    // Kiểm tra phân quyền: Non-admin chỉ xem locations của tổ chức mình
    if (req.user.role !== 'admin' && req.user.organizationId) {
      filter['location.organizationId'] = req.user.organizationId;
    }

    // Lấy danh sách locations unique từ inventory
    const locations = await Inventory.aggregate([
      { $match: filter },
      {
        $group: {
          _id: {
            locationId: '$location.locationId',
            locationName: '$location.locationName',
            locationType: '$location.type',
            organizationId: '$location.organizationId'
          },
          itemCount: { $sum: 1 }
        }
      },
      {
        $project: {
          _id: 0,
          locationId: '$_id.locationId',
          locationName: '$_id.locationName',
          locationType: '$_id.locationType',
          organizationId: '$_id.organizationId',
          itemCount: 1
        }
      },
      { $sort: { locationName: 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: { locations }
    });
  } catch (error) {
    console.error('Error getting locations:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách locations.',
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
  getTransactionStats,
  getLocations
};

