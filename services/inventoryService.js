const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Drug = require('../models/Drug');
const auditService = require('./auditService');

/**
 * Inventory Service
 * Service để xử lý logic nghiệp vụ quản lý kho
 */

/**
 * Helper function để tạo session và xử lý transactions
 * Trả về { session, useTransaction }
 * Tự động phát hiện và bỏ qua transactions nếu MongoDB không hỗ trợ (standalone)
 */
// MongoDB đang chạy standalone -> không dùng transaction để tránh lỗi
const createSession = async () => {
  return { session: null, useTransaction: false };
};

/**
 * Helper function để commit transaction
 */
const commitSession = async (session, useTransaction) => {
  if (!session || !useTransaction) {
    // Nếu không có session hoặc không dùng transaction, không làm gì
    if (session && !useTransaction) {
      // Nếu có session nhưng không dùng transaction, đóng session
      try {
        session.endSession();
      } catch (e) {
        // Ignore errors khi end session
      }
    }
    return;
  }
  
  try {
    await session.commitTransaction();
  } catch (error) {
    // Nếu có lỗi khi commit (có thể do transaction không được start đúng cách)
    // Thử abort thay vì commit, nhưng không throw error
    try {
      await session.abortTransaction();
    } catch (abortError) {
      // Ignore abort errors - đặc biệt là lỗi "Transaction numbers are only allowed"
    }
  } finally {
    try {
      session.endSession();
    } catch (e) {
      // Ignore errors khi end session
    }
  }
};

/**
 * Helper function để abort transaction
 */
const abortSession = async (session, useTransaction) => {
  if (!session) return;
  
  try {
    if (useTransaction) {
      await session.abortTransaction();
    }
  } catch (error) {
    // Ignore errors khi abort transaction (có thể transaction chưa được start)
    // Đặc biệt là lỗi "Transaction numbers are only allowed on a replica set member or mongos"
  } finally {
    try {
      session.endSession();
    } catch (e) {
      // Ignore errors khi end session
    }
  }
};

/**
 * Nhập kho
 */
const stockIn = async (data, user, req = null) => {
  // Tạo session và bắt mọi lỗi transaction
  let session = null;
  let useTransaction = false;
  
  try {
    const sessionResult = await createSession();
    session = sessionResult.session;
    useTransaction = sessionResult.useTransaction;
  } catch (sessionError) {
    // Nếu có lỗi khi tạo session, không dùng transaction
    console.warn('Warning: Could not create session, continuing without transactions:', sessionError.message);
    session = null;
    useTransaction = false;
  }

  try {
    const {
      drugId,
      batchNumber,
      locationId,
      locationName,
      locationType,
      quantity,
      unit,
      unitPrice,
      expiryDate,
      productionDate,
      supplierId,
      supplierName,
      reason = 'purchase',
      reference,
      notes
    } = data;

    // Chuẩn hóa supplierId để tránh cast lỗi khi rỗng/undefined
    const normalizedSupplierId = (() => {
      if (!supplierId) return null;
      const str = String(supplierId).trim();
      return str ? str : null;
    })();

    // Validation cơ bản
    if (!drugId) {
      throw new Error('Mã thuốc là bắt buộc.');
    }
    if (!locationId) {
      throw new Error('Location ID là bắt buộc.');
    }
    if (!locationName) {
      throw new Error('Tên địa điểm là bắt buộc.');
    }
    if (!quantity || quantity <= 0) {
      throw new Error('Số lượng phải lớn hơn 0.');
    }

    // Validation cơ bản
    if (!drugId) {
      throw new Error('Mã thuốc là bắt buộc.');
    }
    if (!locationId) {
      throw new Error('Location ID là bắt buộc.');
    }
    if (!locationName) {
      throw new Error('Tên địa điểm là bắt buộc.');
    }
    if (!quantity || quantity <= 0) {
      throw new Error('Số lượng phải lớn hơn 0.');
    }

    // Kiểm tra drug tồn tại
    const drug = await Drug.findOne({ drugId });
    if (!drug) {
      throw new Error(`Không tìm thấy thuốc với mã: ${drugId}`);
    }

    // Tìm hoặc tạo inventory item
    // Chỉ sử dụng session nếu useTransaction là true và session tồn tại
    let inventory;
    try {
      if (useTransaction && session) {
        inventory = await Inventory.findOne({
          drugId,
          'location.locationId': locationId
        }).session(session);
      } else {
        inventory = await Inventory.findOne({
          drugId,
          'location.locationId': locationId
        });
      }
    } catch (queryError) {
      // Nếu có lỗi khi query với session (có thể là transaction error), thử lại không dùng session
      if (queryError.message && queryError.message.includes('Transaction numbers are only allowed')) {
        console.warn('Transaction error in query, retrying without session');
        useTransaction = false;
        inventory = await Inventory.findOne({
          drugId,
          'location.locationId': locationId
        });
      } else {
        throw queryError;
      }
    }

    if (!inventory) {
      // Tạo mới inventory item
      const createData = [{
        drug: drug._id,
        drugId: drug.drugId,
        drugName: drug.name,
        batchNumber: batchNumber || drug.batchNumber,
        location: {
          type: locationType || 'warehouse',
          locationId,
          locationName,
          address: data.address || '',
          organizationId: user.organizationId || null,
          coordinates: data.coordinates || null
        },
        quantity: 0,
        unit: unit || 'viên',
        expiryDate: expiryDate || drug.expiryDate,
        productionDate: productionDate || drug.productionDate,
        unitPrice: unitPrice || 0,
        supplier: normalizedSupplierId || undefined, // Chỉ gán nếu supplierId có giá trị
        supplierName: supplierName || '',
        createdBy: user._id
      }];
      
      // Chỉ sử dụng session nếu useTransaction là true và session tồn tại
      try {
        if (useTransaction && session) {
          inventory = await Inventory.create(createData, { session });
        } else {
          inventory = await Inventory.create(createData);
        }
      } catch (createError) {
        // Nếu có lỗi khi create với session (có thể là transaction error), thử lại không dùng session
        if (createError.message && createError.message.includes('Transaction numbers are only allowed')) {
          console.warn('Transaction error in create, retrying without session');
          useTransaction = false;
          inventory = await Inventory.create(createData);
        } else {
          throw createError;
        }
      }
      inventory = inventory[0];
    }

    // Thêm vào kho
    let result;
    try {
      result = await inventory.addStock(quantity, user._id, notes);
    } catch (addStockError) {
      console.error('Error in addStock:', {
        message: addStockError.message,
        stack: addStockError.stack
      });
      throw addStockError;
    }

    // Cập nhật thông tin nếu có
    if (unitPrice) {
      inventory.unitPrice = unitPrice;
    }
    if (expiryDate) {
      inventory.expiryDate = expiryDate;
    }
    // Chỉ cập nhật supplier nếu supplierId có giá trị hợp lệ
    if (normalizedSupplierId) {
      inventory.supplier = normalizedSupplierId;
      inventory.supplierName = supplierName || '';
    } else if (supplierId === '' || supplierId === null || supplierId === undefined) {
      // Nếu supplierId là rỗng, set về undefined để không có validation error
      inventory.supplier = undefined;
      inventory.supplierName = supplierName || '';
    }
    // Chỉ sử dụng session nếu useTransaction là true và session tồn tại
    try {
      if (useTransaction && session) {
        await inventory.save({ session });
      } else {
        await inventory.save();
      }
    } catch (saveError) {
      // Nếu có lỗi khi save với session (có thể là transaction error), thử lại không dùng session
      if (saveError.message && saveError.message.includes('Transaction numbers are only allowed')) {
        console.warn('Transaction error in save, retrying without session');
        useTransaction = false;
        await inventory.save();
      } else {
        throw saveError;
      }
    }

    // Tạo transaction record
    const transactionData = [{
      type: 'in',
      inventory: inventory._id,
      drug: drug._id,
      drugId: drug.drugId,
      batchNumber: inventory.batchNumber,
      location: {
        locationId,
        locationName
      },
      quantity,
      quantityBefore: result.oldQuantity,
      quantityAfter: result.newQuantity,
      unit: inventory.unit,
      unitPrice: inventory.unitPrice,
      reason,
      reference: reference || null,
      performedBy: user._id,
      performedByName: user.fullName || user.username,
      notes,
      status: 'completed'
    }];
    
    // Chỉ sử dụng session nếu useTransaction là true và session tồn tại
    let transaction;
    try {
      if (useTransaction && session) {
        transaction = await InventoryTransaction.create(transactionData, { session });
      } else {
        transaction = await InventoryTransaction.create(transactionData);
      }
    } catch (transactionError) {
      // Nếu có lỗi khi create transaction với session (có thể là transaction error), thử lại không dùng session
      if (transactionError.message && transactionError.message.includes('Transaction numbers are only allowed')) {
        console.warn('Transaction error in create transaction, retrying without session');
        useTransaction = false;
        transaction = await InventoryTransaction.create(transactionData);
      } else {
        throw transactionError;
      }
    }

    // Ghi audit log - không throw error nếu có lỗi
    try {
      await auditService.createAuditLog({
        user,
        action: 'inventory_stock_in',
        module: 'inventory',
        entityType: 'Inventory',
        entityId: inventory._id,
        description: `Nhập kho: ${drug.name} - Số lượng: ${quantity} ${inventory.unit} tại ${locationName}`,
        afterData: {
          drugId,
          locationId,
          quantity: result.newQuantity
        },
        severity: 'medium'
      }, req);
    } catch (auditError) {
      // Log lỗi audit nhưng không throw - dữ liệu đã được lưu thành công
      console.warn('Warning: Error creating audit log (data still saved):', auditError.message);
    }

    // Commit session - không throw error nếu có lỗi transaction
    try {
      await commitSession(session, useTransaction);
    } catch (commitError) {
      // Nếu có lỗi khi commit (thường là transaction error), log nhưng không throw
      // Vì dữ liệu đã được lưu thành công (không dùng transaction)
      console.warn('Warning: Error committing session (data may still be saved):', commitError.message);
    }

    return {
      success: true,
      inventory,
      transaction: transaction[0],
      result
    };
  } catch (error) {
    // Đảm bảo session được đóng ngay cả khi có lỗi
    try {
      await abortSession(session, useTransaction);
    } catch (abortError) {
      // Ignore errors khi abort session
    }
    
    // Log chi tiết lỗi để debug
    console.error('Error in stockIn service:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // Nếu lỗi liên quan đến transaction, không throw lại
    if (error.message && error.message.includes('Transaction numbers are only allowed')) {
      // Đã xử lý transaction error, nhưng có thể có lỗi khác
      // Throw lại với message rõ ràng hơn
      throw new Error('Lỗi khi xử lý nhập kho. Vui lòng thử lại.');
    }
    
    throw error;
  }
};

/**
 * Xuất kho
 */
const stockOut = async (data, user, req = null) => {
  // Không dùng transaction trên MongoDB standalone
  const session = null;
  const useTransaction = false;

  try {
    const {
      drugId,
      locationId,
      quantity,
      reason = 'sale',
      recipientId,
      recipientName,
      reference,
      notes
    } = data;

    // Validation số lượng
    const quantityNum = parseFloat(quantity);
    if (isNaN(quantityNum) || quantityNum <= 0) {
      throw new Error('Số lượng xuất phải lớn hơn 0.');
    }

    // Tìm inventory item
    let inventory;
    if (useTransaction && session) {
      inventory = await Inventory.findOne({
        drugId,
        'location.locationId': locationId
      }).session(session);
    } else {
      inventory = await Inventory.findOne({
        drugId,
        'location.locationId': locationId
      });
    }

    if (!inventory) {
      throw new Error('Không tìm thấy hàng trong kho này.');
    }

    // Kiểm tra số lượng tồn kho
    if (inventory.quantity < quantityNum) {
      throw new Error(`Số lượng xuất (${quantityNum}) vượt quá tồn kho hiện tại (${inventory.quantity} ${inventory.unit || 'viên'}).`);
    }

    // Xuất kho
    const result = await inventory.removeStock(quantityNum, user._id, notes);

    // Tạo transaction record
    const transactionData = [{
      type: 'out',
      inventory: inventory._id,
      drug: inventory.drug,
      drugId: inventory.drugId,
      batchNumber: inventory.batchNumber,
      location: {
        locationId: inventory.location.locationId,
        locationName: inventory.location.locationName
      },
      quantity,
      quantityBefore: result.oldQuantity,
      quantityAfter: result.newQuantity,
      unit: inventory.unit,
      unitPrice: inventory.unitPrice,
      reason,
      reference: reference || null,
      performedBy: user._id,
      performedByName: user.fullName || user.username,
      recipient: recipientId,
      recipientName: recipientName,
      notes,
      status: 'completed'
    }];
    
    let transaction;
    if (useTransaction && session) {
      transaction = await InventoryTransaction.create(transactionData, { session });
    } else {
      transaction = await InventoryTransaction.create(transactionData);
    }
    
    // Save inventory
    if (useTransaction && session) {
      await inventory.save({ session });
    } else {
      await inventory.save();
    }

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'inventory_stock_out',
      module: 'inventory',
      entityType: 'Inventory',
      entityId: inventory._id,
      description: `Xuất kho: ${inventory.drugName} - Số lượng: ${quantity} ${inventory.unit} từ ${inventory.location.locationName}`,
      beforeData: {
        quantity: result.oldQuantity
      },
      afterData: {
        quantity: result.newQuantity
      },
      severity: 'medium'
    }, req);

    await commitSession(session, useTransaction);

    return {
      success: true,
      inventory,
      transaction: transaction[0],
      result
    };
  } catch (error) {
    await abortSession(session, useTransaction);
    throw error;
  }
};

/**
 * Điều chỉnh kho (adjustment)
 */
const adjustStock = async (data, user, req = null) => {
  const { session, useTransaction } = await createSession();

  try {
    const {
      drugId,
      locationId,
      newQuantity,
      reason = 'adjustment',
      notes
    } = data;

    // Validation số lượng
    const newQuantityNum = parseFloat(newQuantity);
    if (isNaN(newQuantityNum) || newQuantityNum < 0) {
      throw new Error('Số lượng mới phải lớn hơn hoặc bằng 0.');
    }

    // Tìm inventory item
    let inventory;
    if (useTransaction && session) {
      inventory = await Inventory.findOne({
        drugId,
        'location.locationId': locationId
      }).session(session);
    } else {
      inventory = await Inventory.findOne({
        drugId,
        'location.locationId': locationId
      });
    }

    if (!inventory) {
      throw new Error('Không tìm thấy hàng trong kho này.');
    }

    const oldQuantity = inventory.quantity;
    
    // Kiểm tra nếu số lượng không thay đổi
    if (oldQuantity === newQuantityNum) {
      throw new Error('Số lượng mới phải khác số lượng hiện tại.');
    }
    
    const difference = newQuantityNum - oldQuantity;

    // Cập nhật số lượng
    const result = await inventory.updateQuantity(newQuantityNum, 'adjustment', user._id, notes);
    if (useTransaction && session) {
      await inventory.save({ session });
    } else {
      await inventory.save();
    }

    // Tạo transaction record
    let transaction;
    const transactionData = [{
      type: 'adjustment',
      inventory: inventory._id,
      drug: inventory.drug,
      drugId: inventory.drugId,
      batchNumber: inventory.batchNumber,
      location: {
        locationId: inventory.location.locationId,
        locationName: inventory.location.locationName
      },
      quantity: Math.abs(difference),
      quantityBefore: oldQuantity,
      quantityAfter: newQuantityNum,
      unit: inventory.unit,
      unitPrice: inventory.unitPrice,
      reason,
      performedBy: user._id,
      performedByName: user.fullName || user.username,
      notes: notes || `Điều chỉnh từ ${oldQuantity} thành ${newQuantityNum}`,
      status: 'completed'
    }];
    
    if (useTransaction && session) {
      transaction = await InventoryTransaction.create(transactionData, { session });
    } else {
      transaction = await InventoryTransaction.create(transactionData);
    }

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'inventory_adjustment',
      module: 'inventory',
      entityType: 'Inventory',
      entityId: inventory._id,
      description: `Điều chỉnh kho: ${inventory.drugName} - Từ ${oldQuantity} thành ${newQuantityNum} ${inventory.unit}`,
      beforeData: { quantity: oldQuantity },
      afterData: { quantity: newQuantityNum },
      severity: 'high'
    }, req);

    await commitSession(session, useTransaction);

    return {
      success: true,
      inventory,
      transaction: transaction[0],
      result
    };
  } catch (error) {
    await abortSession(session, useTransaction);
    throw error;
  }
};

/**
 * Chuyển kho (transfer)
 */
const transferStock = async (data, user, req = null) => {
  // Note: transferStock gọi stockOut và stockIn, mỗi hàm sẽ tự quản lý session của mình
  // Vì MongoDB standalone không hỗ trợ transactions, không cần session ở đây
  try {
    const {
      drugId,
      fromLocationId,
      toLocationId,
      toLocationName,
      toLocationType,
      quantity,
      notes
    } = data;

    // Xuất từ kho nguồn
    const stockOutResult = await stockOut({
      drugId,
      locationId: fromLocationId,
      quantity,
      reason: 'transfer_out',
      notes: `Chuyển đến ${toLocationName}: ${notes || ''}`
    }, user, req);

    // Nhập vào kho đích
    const inventory = stockOutResult.inventory;
    const stockInData = {
      drugId,
      batchNumber: inventory.batchNumber,
      locationId: toLocationId,
      locationName: toLocationName,
      locationType: toLocationType,
      quantity,
      unit: inventory.unit,
      unitPrice: inventory.unitPrice,
      expiryDate: inventory.expiryDate,
      productionDate: inventory.productionDate,
      supplierId: inventory.supplier,
      supplierName: inventory.supplierName,
      reason: 'transfer_in',
      notes: `Nhận từ ${inventory.location.locationName}: ${notes || ''}`
    };
    const stockInResult = await stockIn(stockInData, user, req);

    // Tạo transaction record cho transfer
    const transferTransaction = await InventoryTransaction.create([{
      type: 'transfer',
      inventory: inventory._id,
      drug: inventory.drug,
      drugId: inventory.drugId,
      batchNumber: inventory.batchNumber,
      location: {
        locationId: fromLocationId,
        locationName: inventory.location.locationName
      },
      destinationLocation: {
        locationId: toLocationId,
        locationName: toLocationName
      },
      quantity,
      quantityBefore: stockOutResult.result.oldQuantity,
      quantityAfter: stockOutResult.result.newQuantity,
      unit: inventory.unit,
      unitPrice: inventory.unitPrice,
      reason: 'transfer_out',
      performedBy: user._id,
      performedByName: user.fullName || user.username,
      notes: `Chuyển từ ${inventory.location.locationName} đến ${toLocationName}`,
      status: 'completed'
    }]);

    return {
      success: true,
      fromInventory: stockOutResult.inventory,
      toInventory: stockInResult.inventory,
      transferTransaction: transferTransaction[0],
      stockOutTransaction: stockOutResult.transaction,
      stockInTransaction: stockInResult.transaction
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Kiểm kê kho (stocktake)
 */
const stocktake = async (data, user, req = null) => {
  const { session, useTransaction } = await createSession();

  try {
    const {
      locationId,
      items, // Array of { drugId, actualQuantity, notes }
      stocktakeDate = new Date(),
      notes: stocktakeNotes
    } = data;

    const results = [];
    const transactions = [];

    for (const item of items) {
      const { drugId, actualQuantity, notes } = item;

      // Tìm inventory
      let inventory;
      if (useTransaction && session) {
        inventory = await Inventory.findOne({
          drugId,
          'location.locationId': locationId
        }).session(session);
      } else {
        inventory = await Inventory.findOne({
          drugId,
          'location.locationId': locationId
        });
      }

      if (!inventory) {
        continue; // Skip nếu không tìm thấy
      }

      const oldQuantity = inventory.quantity;
      const difference = actualQuantity - oldQuantity;

      if (difference !== 0) {
        // Điều chỉnh số lượng
        await inventory.updateQuantity(actualQuantity, 'stocktake', user._id, notes);
        if (useTransaction && session) {
          await inventory.save({ session });
        } else {
          await inventory.save();
        }

        // Tạo transaction
        const transactionData = [{
          type: 'stocktake',
          inventory: inventory._id,
          drug: inventory.drug,
          drugId: inventory.drugId,
          batchNumber: inventory.batchNumber,
          location: {
            locationId,
            locationName: inventory.location.locationName
          },
          quantity: Math.abs(difference),
          quantityBefore: oldQuantity,
          quantityAfter: actualQuantity,
          unit: inventory.unit,
          unitPrice: inventory.unitPrice,
          reason: 'stocktake',
          performedBy: user._id,
          performedByName: user.fullName || user.username,
          notes: notes || `Kiểm kê: ${oldQuantity} → ${actualQuantity}`,
          status: 'completed',
          transactionDate: stocktakeDate
        }];
        
        let transaction;
        if (useTransaction && session) {
          transaction = await InventoryTransaction.create(transactionData, { session });
        } else {
          transaction = await InventoryTransaction.create(transactionData);
        }

        transactions.push(transaction[0]);
        results.push({
          drugId,
          drugName: inventory.drugName,
          oldQuantity,
          newQuantity: actualQuantity,
          difference
        });
      }
    }

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'inventory_stocktake',
      module: 'inventory',
      description: `Kiểm kê kho tại ${locationId}: ${results.length} items được điều chỉnh`,
      metadata: {
        locationId,
        itemsCount: results.length,
        stocktakeDate
      },
      severity: 'high'
    }, req);

    await commitSession(session, useTransaction);

    return {
      success: true,
      results,
      transactions,
      summary: {
        totalItems: items.length,
        adjustedItems: results.length,
        stocktakeDate
      }
    };
  } catch (error) {
    await abortSession(session, useTransaction);
    throw error;
  }
};

module.exports = {
  stockIn,
  stockOut,
  adjustStock,
  transferStock,
  stocktake
};

