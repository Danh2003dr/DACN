const Supplier = require('../models/Supplier');
const Contract = require('../models/Contract');
const supplierService = require('../services/supplierService');

/**
 * @desc    Tạo nhà cung ứng mới
 * @route   POST /api/suppliers
 * @access  Private
 */
const createSupplier = async (req, res) => {
  try {
    const result = await supplierService.createSupplier(req.body, req.user, req);

    res.status(201).json({
      success: true,
      message: 'Tạo nhà cung ứng thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error creating supplier:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi tạo nhà cung ứng.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách nhà cung ứng
 * @route   GET /api/suppliers
 * @access  Private
 */
const getSuppliers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      status,
      search
    } = req.query;

    const filters = {};

    if (type) filters.type = type;
    if (status) filters.status = status;

    if (search) {
      filters.$or = [
        { name: { $regex: search, $options: 'i' } },
        { supplierCode: { $regex: search, $options: 'i' } },
        { 'legal.taxCode': { $regex: search, $options: 'i' } }
      ];
    }

    // Suppliers thường là shared resource, nhưng có thể filter theo createdBy nếu cần
    // Hiện tại cho phép tất cả authenticated users xem tất cả suppliers

    const result = await Supplier.getSuppliers(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting suppliers:', error);
    const logger = require('../utils/logger');
    
    // Nếu lỗi là do populate hoặc query nhỏ, vẫn trả về empty data thay vì 500
    if (error.message && (
      error.message.includes('populate') || 
      error.message.includes('Cast to ObjectId') ||
      error.message.includes('strictPopulate') ||
      error.message.includes('Cannot read property')
    )) {
      logger.warn('Non-critical error in getSuppliers, returning empty data', {
        error: error.message,
        correlationId: req.correlationId
      });
      return res.status(200).json({
        success: true,
        data: {
          suppliers: [],
          pagination: {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
            total: 0,
            pages: 0
          }
        }
      });
    }
    
    // Nếu lỗi là do database connection hoặc lỗi nghiêm trọng
    logger.error('Error getting suppliers', {
      error: error.message,
      stack: error.stack,
      correlationId: req.correlationId
    });
    
    // Trả về lỗi nhưng vẫn có format đúng để frontend xử lý
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách nhà cung ứng.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * @desc    Lấy nhà cung ứng theo ID
 * @route   GET /api/suppliers/:id
 * @access  Private
 */
const getSupplierById = async (req, res) => {
  try {
    const supplier = await Supplier.findById(req.params.id)
      .populate('trustScore')
      .populate('contracts')
      .populate('createdBy', 'fullName')
      .populate('updatedBy', 'fullName');

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy nhà cung ứng.'
      });
    }

    // Suppliers thường là shared resource, nhưng có thể kiểm tra nếu cần
    // Hiện tại cho phép tất cả authenticated users xem suppliers

    res.status(200).json({
      success: true,
      data: { supplier }
    });
  } catch (error) {
    console.error('Error getting supplier:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy nhà cung ứng.',
      error: error.message
    });
  }
};

/**
 * @desc    Cập nhật đánh giá nhà cung ứng
 * @route   POST /api/suppliers/:id/rating
 * @access  Private
 */
const updateSupplierRating = async (req, res) => {
  try {
    const result = await supplierService.updateSupplierRating(req.params.id, req.body, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Cập nhật đánh giá thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error updating supplier rating:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi cập nhật đánh giá.',
      error: error.message
    });
  }
};

/**
 * @desc    Tạo hợp đồng
 * @route   POST /api/suppliers/:id/contracts
 * @access  Private
 */
const createContract = async (req, res) => {
  try {
    const result = await supplierService.createContract({
      ...req.body,
      supplierId: req.params.id
    }, req.user, req);

    res.status(201).json({
      success: true,
      message: 'Tạo hợp đồng thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Lỗi khi tạo hợp đồng.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách hợp đồng
 * @route   GET /api/contracts
 * @access  Private
 */
const getContracts = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      supplierId,
      status,
      startDate,
      endDate
    } = req.query;

    const filters = {};

    if (supplierId) filters.supplier = supplierId;
    if (status) filters.status = status;

    if (startDate || endDate) {
      filters.signedDate = {};
      if (startDate) filters.signedDate.$gte = new Date(startDate);
      if (endDate) filters.signedDate.$lte = new Date(endDate);
    }

    console.log('Getting contracts with filters:', JSON.stringify(filters, null, 2), 'options:', { page, limit });

    const result = await Contract.getContracts(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    console.log('Contracts result:', {
      contractsCount: result?.contracts?.length || 0,
      pagination: result?.pagination
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting contracts:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      filters: filters,
      options: { page, limit }
    });
    
    // Trả về empty data thay vì 500 nếu là lỗi populate hoặc query nhỏ
    if (error.message && (
      error.message.includes('populate') || 
      error.message.includes('Cast to ObjectId') ||
      error.message.includes('strictPopulate') ||
      error.message.includes('Cannot read property')
    )) {
      console.warn('Non-critical error in getContracts, returning empty data');
      return res.status(200).json({
        success: true,
        data: {
          contracts: [],
          pagination: {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 50,
            total: 0,
            pages: 0
          }
        }
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách hợp đồng.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

module.exports = {
  createSupplier,
  getSuppliers,
  getSupplierById,
  updateSupplierRating,
  createContract,
  getContracts
};

