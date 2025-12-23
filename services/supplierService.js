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
    const mongoose = require('mongoose');
    
    // Sanitize supplierId - loại bỏ các ký tự không hợp lệ
    if (!supplierId || typeof supplierId !== 'string') {
      supplierId = String(supplierId || '').trim();
    }
    
    // Validate supplierId không được rỗng hoặc có dấu chấm ở đầu
    if (!supplierId || supplierId === '' || supplierId.startsWith('.')) {
      console.error('Invalid supplierId format:', supplierId);
      throw new Error('ID nhà cung ứng không hợp lệ.');
    }
    
    let supplier = null;
    
    // Thử tìm bằng ObjectId trước (nếu là ObjectId hợp lệ)
    if (mongoose.Types.ObjectId.isValid(supplierId)) {
      supplier = await Supplier.findById(supplierId);
      console.log('Tìm supplier bằng ObjectId:', { supplierId, found: !!supplier });
    }
    
    // Nếu không tìm thấy, thử tìm bằng supplierCode (case-insensitive, trim)
    if (!supplier) {
      const trimmedCode = supplierId.trim();
      // Thử exact match trước
      supplier = await Supplier.findOne({ supplierCode: trimmedCode });
      console.log('Tìm supplier bằng supplierCode (exact):', { supplierId: trimmedCode, found: !!supplier });
      
      // Nếu không tìm thấy, thử case-insensitive
      if (!supplier) {
        supplier = await Supplier.findOne({ 
          supplierCode: { $regex: new RegExp(`^${trimmedCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        console.log('Tìm supplier bằng supplierCode (case-insensitive):', { supplierId: trimmedCode, found: !!supplier });
      }
      
      // Nếu vẫn không tìm thấy, thử trim cả hai bên khi so sánh
      if (!supplier) {
        const allSuppliers = await Supplier.find({}).select('_id supplierCode name');
        supplier = allSuppliers.find(s => s.supplierCode && s.supplierCode.trim() === trimmedCode);
        console.log('Tìm supplier bằng supplierCode (trim both sides):', { 
          supplierId: trimmedCode, 
          found: !!supplier,
          searchedIn: allSuppliers.length 
        });
      }
    }
    
    // Nếu vẫn không tìm thấy và supplierId có thể là ObjectId dạng string, thử lại
    if (!supplier) {
      const cleanId = supplierId.trim();
      if (mongoose.Types.ObjectId.isValid(cleanId)) {
        supplier = await Supplier.findById(cleanId);
        console.log('Tìm supplier bằng cleanId:', { cleanId, found: !!supplier });
      }
    }

    if (!supplier) {
      console.error('❌ Không tìm thấy supplier với ID:', supplierId);
      console.error('   Type:', typeof supplierId);
      console.error('   Length:', supplierId?.length);
      console.error('   Value:', JSON.stringify(supplierId));
      
      // Log tất cả suppliers để debug
      const allSuppliers = await Supplier.find({}).select('_id supplierCode name').limit(20);
      console.log('📋 Sample suppliers in DB (first 20):');
      allSuppliers.forEach((s, idx) => {
        console.log(`   ${idx + 1}. _id: ${s._id.toString()}, supplierCode: "${s.supplierCode}", name: "${s.name}"`);
      });
      
      // Thử tìm supplier có supplierCode gần giống
      if (typeof supplierId === 'string') {
        const partialMatch = allSuppliers.find(s => 
          s.supplierCode && (
            s.supplierCode.includes(supplierId) || 
            supplierId.includes(s.supplierCode) ||
            s.supplierCode.toLowerCase() === supplierId.toLowerCase()
          )
        );
        if (partialMatch) {
          console.log('💡 Found partial match:', {
            searched: supplierId,
            found: partialMatch.supplierCode,
            _id: partialMatch._id.toString()
          });
        }
      }
      
      throw new Error(`Không tìm thấy nhà cung ứng với mã: ${supplierId}`);
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

    // Log để debug
    console.log('📝 [createContract] Received request:', {
      supplierId,
      supplierIdType: typeof supplierId,
      contractType,
      buyerId,
      userId: user?._id
    });

    // Sanitize supplierId - đảm bảo là string
    let sanitizedSupplierId = supplierId;
    if (!supplierId || typeof supplierId !== 'string') {
      sanitizedSupplierId = String(supplierId || '').trim();
    } else {
      sanitizedSupplierId = supplierId.trim();
    }
    
    if (!sanitizedSupplierId || sanitizedSupplierId === '' || sanitizedSupplierId.startsWith('.')) {
      console.error('❌ [createContract] Invalid supplierId format:', supplierId);
      throw new Error('ID nhà cung ứng không hợp lệ.');
    }
    
    // Sử dụng sanitizedSupplierId cho các bước tiếp theo (KHÔNG gán lại supplierId vì nó là const)

    let supplier = null;
    const mongoose = require('mongoose');
    
    // Thử tìm bằng ObjectId trước (nếu là ObjectId hợp lệ)
    if (mongoose.Types.ObjectId.isValid(sanitizedSupplierId)) {
      supplier = await Supplier.findById(sanitizedSupplierId);
      console.log('✅ [createContract] Tìm supplier bằng ObjectId:', { supplierId: sanitizedSupplierId, found: !!supplier });
    }
    
    // Nếu không tìm thấy, thử tìm bằng supplierCode (case-insensitive, trim)
    if (!supplier) {
      // Sử dụng sanitizedSupplierId đã được sanitize và trim ở trên
      const searchCode = sanitizedSupplierId;
      // Thử exact match trước
      supplier = await Supplier.findOne({ supplierCode: searchCode });
      console.log('✅ [createContract] Tìm supplier bằng supplierCode (exact):', { supplierId: searchCode, found: !!supplier });
      
      // Nếu không tìm thấy, thử case-insensitive
      if (!supplier) {
        supplier = await Supplier.findOne({ 
          supplierCode: { $regex: new RegExp(`^${searchCode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        });
        console.log('✅ [createContract] Tìm supplier bằng supplierCode (case-insensitive):', { supplierId: searchCode, found: !!supplier });
      }
      
      // Nếu vẫn không tìm thấy, thử trim cả hai bên khi so sánh
      if (!supplier) {
        const allSuppliers = await Supplier.find({}).select('_id supplierCode name');
        supplier = allSuppliers.find(s => s.supplierCode && s.supplierCode.trim() === searchCode);
        console.log('✅ [createContract] Tìm supplier bằng supplierCode (trim both sides):', { 
          supplierId: searchCode, 
          found: !!supplier,
          searchedIn: allSuppliers.length 
        });
      }
    }
    
    // Nếu vẫn không tìm thấy và sanitizedSupplierId có thể là ObjectId dạng string, thử lại
    if (!supplier) {
      if (mongoose.Types.ObjectId.isValid(sanitizedSupplierId)) {
        supplier = await Supplier.findById(sanitizedSupplierId);
        console.log('✅ [createContract] Tìm supplier bằng sanitizedSupplierId (retry ObjectId):', { supplierId: sanitizedSupplierId, found: !!supplier });
      }
    }

    if (!supplier) {
      console.error('❌ [createContract] Không tìm thấy supplier với ID:', sanitizedSupplierId);
      console.error('   Original supplierId:', supplierId);
      console.error('   Type:', typeof sanitizedSupplierId);
      console.error('   Length:', sanitizedSupplierId?.length);
      console.error('   Value:', JSON.stringify(sanitizedSupplierId));
      
      // Thử tìm trong toàn bộ suppliers (không giới hạn)
      const allSuppliers = await Supplier.find({}).select('_id supplierCode name');
      console.log(`📋 [createContract] Tất cả suppliers trong DB (${allSuppliers.length} suppliers):`);
      allSuppliers.forEach((s, idx) => {
        console.log(`   ${idx + 1}. _id: ${s._id.toString()}, supplierCode: "${s.supplierCode}", name: "${s.name}"`);
      });
      
      // Thử tìm một lần nữa với exact match trong toàn bộ danh sách
      const exactMatch = allSuppliers.find(s => s.supplierCode === sanitizedSupplierId);
      if (exactMatch) {
        console.log('💡 [createContract] Tìm thấy exact match trong toàn bộ danh sách, query lại bằng _id');
        supplier = await Supplier.findById(exactMatch._id);
        if (supplier) {
          console.log('✅ [createContract] Đã tìm thấy supplier sau khi query lại bằng _id');
        }
      }
      
      if (!supplier) {
        throw new Error(`Không tìm thấy nhà cung ứng với mã: ${sanitizedSupplierId}`);
      }
    }

    // Tạo contract number
    const contractNumber = Contract.generateContractNumber();

    // Tạo hợp đồng
    const contract = await Contract.create({
      contractNumber,
      contractType,
      supplier: supplier._id, // Sử dụng _id của supplier đã tìm được
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

