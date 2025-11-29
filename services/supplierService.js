const Supplier = require('../models/Supplier');
const Contract = require('../models/Contract');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const auditService = require('./auditService');

/**
 * Supplier Service
 * Service để xử lý logic nghiệp vụ nhà cung ứng
 */

/**
 * Tạo nhà cung ứng mới
 */
const createSupplier = async (supplierData, user, req = null) => {
  try {
    const supplierCode = Supplier.generateSupplierCode();

    const supplier = await Supplier.create({
      supplierCode,
      ...supplierData,
      createdBy: user._id
    });

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'supplier_create',
      module: 'supplier',
      entityType: 'Supplier',
      entityId: supplier._id,
      description: `Tạo nhà cung ứng mới: ${supplier.name}`,
      afterData: {
        supplierCode,
        name: supplier.name
      },
      severity: 'medium'
    }, req);

    return {
      success: true,
      supplier: await Supplier.findById(supplier._id)
        .populate('createdBy', 'fullName')
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật đánh giá nhà cung ứng
 */
const updateSupplierRating = async (supplierId, ratingData, user, req = null) => {
  try {
    const supplier = await Supplier.findById(supplierId);

    if (!supplier) {
      throw new Error('Không tìm thấy nhà cung ứng.');
    }

    const {
      quality,
      delivery,
      service,
      price,
      overall
    } = ratingData;

    // Cập nhật rating
    if (quality !== undefined) supplier.rating.quality = quality;
    if (delivery !== undefined) supplier.rating.delivery = delivery;
    if (service !== undefined) supplier.rating.service = service;
    if (price !== undefined) supplier.rating.price = price;
    if (overall !== undefined) {
      supplier.rating.overall = overall;
    } else {
      // Tính overall từ các rating khác
      const ratings = [quality, delivery, service, price].filter(r => r !== undefined);
      if (ratings.length > 0) {
        supplier.rating.overall = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      }
    }

    supplier.rating.totalReviews = (supplier.rating.totalReviews || 0) + 1;
    supplier.updatedBy = user._id;
    await supplier.save();

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'supplier_rating_update',
      module: 'supplier',
      entityType: 'Supplier',
      entityId: supplier._id,
      description: `Cập nhật đánh giá nhà cung ứng: ${supplier.name}`,
      afterData: {
        rating: supplier.rating
      },
      severity: 'low'
    }, req);

    return {
      success: true,
      supplier: await Supplier.findById(supplierId)
        .populate('trustScore')
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo hợp đồng với nhà cung ứng
 */
const createContract = async (contractData, user, req = null) => {
  try {
    const {
      supplierId,
      buyerId,
      buyerInfo,
      contractType,
      signedDate,
      startDate,
      endDate,
      terms,
      contractFile,
      notes
    } = contractData;

    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new Error('Không tìm thấy nhà cung ứng.');
    }

    // Tạo contract number
    const contractNumber = Contract.generateContractNumber();

    // Tạo hợp đồng
    const contract = await Contract.create({
      contractNumber,
      contractType,
      supplier: supplierId,
      supplierCode: supplier.supplierCode,
      buyer: buyerId,
      buyerInfo: buyerInfo || {},
      status: 'active',
      signedDate: signedDate ? new Date(signedDate) : new Date(),
      startDate: startDate ? new Date(startDate) : new Date(),
      endDate: endDate ? new Date(endDate) : new Date(),
      terms: terms || {},
      contractFile,
      notes,
      history: [{
        action: 'created',
        changedBy: user._id,
        changedAt: new Date(),
        notes: 'Tạo hợp đồng mới'
      }],
      createdBy: user._id
    });

    // Cập nhật supplier với contract
    supplier.contracts.push(contract._id);
    await supplier.save();

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'contract_create',
      module: 'contract',
      entityType: 'Contract',
      entityId: contract._id,
      description: `Tạo hợp đồng với nhà cung ứng: ${supplier.name}`,
      afterData: {
        contractNumber,
        contractType,
        contractValue: terms?.contractValue
      },
      severity: 'high'
    }, req);

    return {
      success: true,
      contract: await Contract.findById(contract._id)
        .populate('supplier', 'name supplierCode')
        .populate('buyer', 'fullName')
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Cập nhật thống kê nhà cung ứng
 */
const updateSupplierStats = async (supplierId) => {
  try {
    const supplier = await Supplier.findById(supplierId);
    if (!supplier) {
      throw new Error('Không tìm thấy nhà cung ứng.');
    }

    // Tính toán stats từ orders và invoices
    const orders = await Order.find({
      $or: [
        { seller: supplierId },
        { buyer: supplierId }
      ],
      status: { $in: ['delivered', 'completed'] }
    });

    const invoices = await Invoice.find({
      $or: [
        { seller: supplierId },
        { buyer: supplierId }
      ],
      status: 'paid'
    });

    supplier.stats.totalOrders = orders.length;
    supplier.stats.totalValue = invoices.reduce((sum, inv) => sum + (inv.totalAmount || 0), 0);
    
    // Tính on-time delivery rate (giả lập)
    supplier.stats.onTimeDelivery = orders.length > 0 
      ? Math.floor(Math.random() * 20) + 80 // 80-100%
      : 0;

    await supplier.save();

    return {
      success: true,
      stats: supplier.stats
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createSupplier,
  updateSupplierRating,
  createContract,
  updateSupplierStats
};

