const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Drug = require('../models/Drug');
const Inventory = require('../models/Inventory');
const inventoryService = require('./inventoryService');
const auditService = require('./auditService');

/**
 * Order Service
 * Service để xử lý logic nghiệp vụ quản lý đơn hàng
 */

/**
 * Tạo đơn hàng mới
 */
const createOrder = async (data, user, req = null) => {
  try {
    const {
      orderType,
      buyerId,
      buyerName,
      buyerOrganization,
      sellerId,
      sellerName,
      sellerOrganization,
      items, // Array of { drugId, quantity, unitPrice, discount, notes }
      shippingAddress,
      billingAddress,
      paymentMethod,
      shippingMethod,
      requiredDate,
      notes
    } = data;

    // Tạo order number
    const orderNumber = Order.generateOrderNumber(orderType);

    // Tính tổng giá trị
    let subtotal = 0;
    let totalItems = 0;
    let totalQuantity = 0;

    // Validate và tính toán items
    const orderItems = [];
    for (const item of items) {
      const drug = await Drug.findOne({ drugId: item.drugId });
      if (!drug) {
        throw new Error(`Không tìm thấy thuốc với mã: ${item.drugId}`);
      }

      const quantity = parseInt(item.quantity);
      const unitPrice = parseFloat(item.unitPrice);
      const discount = parseFloat(item.discount || 0);
      const totalPrice = quantity * unitPrice;
      const finalPrice = totalPrice * (1 - discount / 100);

      subtotal += finalPrice;
      totalItems += 1;
      totalQuantity += quantity;

      orderItems.push({
        orderNumber,
        drug: drug._id,
        drugId: drug.drugId,
        drugName: drug.name,
        batchNumber: item.batchNumber || drug.batchNumber,
        quantity,
        unit: item.unit || 'viên',
        unitPrice,
        totalPrice,
        discount,
        finalPrice,
        notes: item.notes || ''
      });
    }

    // Tạo order
    const order = await Order.create({
      orderNumber,
      orderType,
      createdBy: user._id,
      buyer: buyerId,
      buyerName,
      buyerOrganization,
      seller: sellerId,
      sellerName,
      sellerOrganization,
      shippingAddress: shippingAddress || {},
      billingAddress: billingAddress || shippingAddress || {},
      paymentMethod: paymentMethod || 'bank_transfer',
      shipping: {
        method: shippingMethod || 'standard'
      },
      requiredDate: requiredDate ? new Date(requiredDate) : null,
      notes,
      subtotal,
      totalItems,
      totalQuantity,
      status: 'draft'
    });

    // Tạo order items
    const createdItems = await OrderItem.insertMany(
      orderItems.map(item => ({
        ...item,
        order: order._id
      }))
    );

    // Cập nhật order với items
    order.items = createdItems.map(item => item._id);
    await order.save();

    // Thêm vào status history
    await order.changeStatus('draft', user._id, user.fullName || user.username, 'Tạo đơn hàng mới');

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'order_create',
      module: 'order',
      entityType: 'Order',
      entityId: order._id,
      description: `Tạo đơn hàng ${orderType}: ${orderNumber}`,
      afterData: {
        orderNumber,
        orderType,
        totalAmount: order.totalAmount
      },
      severity: 'medium'
    }, req);

    return {
      success: true,
      order: await Order.findById(order._id)
        .populate('items')
        .populate('createdBy', 'fullName')
        .populate('buyer', 'fullName')
        .populate('seller', 'fullName'),
      items: createdItems
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Xác nhận đơn hàng
 */
const confirmOrder = async (orderId, user, req = null) => {
  try {
    const order = await Order.findById(orderId)
      .populate('items');

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng.');
    }

    if (order.status !== 'draft' && order.status !== 'pending') {
      throw new Error(`Không thể xác nhận đơn hàng ở trạng thái: ${order.status}`);
    }

    // Thay đổi trạng thái
    await order.changeStatus('confirmed', user._id, user.fullName || user.username, 'Xác nhận đơn hàng');

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'order_confirm',
      module: 'order',
      entityType: 'Order',
      entityId: order._id,
      description: `Xác nhận đơn hàng: ${order.orderNumber}`,
      beforeData: { status: 'draft' },
      afterData: { status: 'confirmed' },
      severity: 'medium'
    }, req);

    return {
      success: true,
      order: await Order.findById(orderId)
        .populate('items')
        .populate('createdBy', 'fullName')
        .populate('buyer', 'fullName')
        .populate('seller', 'fullName')
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Xử lý đơn hàng (tạo inventory từ order)
 */
const processOrder = async (orderId, locationId, user, req = null) => {
  try {
    const order = await Order.findById(orderId)
      .populate('items');

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng.');
    }

    if (order.status !== 'confirmed' && order.status !== 'processing') {
      throw new Error(`Không thể xử lý đơn hàng ở trạng thái: ${order.status}`);
    }

    // Thay đổi trạng thái
    await order.changeStatus('processing', user._id, user.fullName || user.username, 'Bắt đầu xử lý đơn hàng');

    // Xử lý từng item
    const results = [];
    for (const item of order.items) {
      try {
        // Nhập kho từ order
        const stockInResult = await inventoryService.stockIn({
          drugId: item.drugId,
          batchNumber: item.batchNumber,
          locationId,
          locationName: order.shippingAddress?.name || 'Kho đích',
          locationType: 'warehouse',
          quantity: item.quantity,
          unit: item.unit,
          unitPrice: item.unitPrice,
          reason: order.orderType === 'purchase' ? 'purchase' : 'transfer_in',
          reference: {
            type: 'order',
            id: order._id,
            number: order.orderNumber
          },
          notes: `Nhập từ đơn hàng ${order.orderNumber}`
        }, user, req);

        // Cập nhật order item
        item.inventory = stockInResult.inventory._id;
        await item.save();

        results.push({
          itemId: item._id,
          drugId: item.drugId,
          success: true,
          inventoryId: stockInResult.inventory._id
        });
      } catch (error) {
        results.push({
          itemId: item._id,
          drugId: item.drugId,
          success: false,
          error: error.message
        });
      }
    }

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'order_process',
      module: 'order',
      entityType: 'Order',
      entityId: order._id,
      description: `Xử lý đơn hàng: ${order.orderNumber}`,
      metadata: {
        locationId,
        itemsProcessed: results.filter(r => r.success).length,
        totalItems: results.length
      },
      severity: 'medium'
    }, req);

    return {
      success: true,
      order: await Order.findById(orderId)
        .populate('items')
        .populate('createdBy', 'fullName')
        .populate('buyer', 'fullName')
        .populate('seller', 'fullName'),
      results
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Giao hàng (shipped)
 */
const shipOrder = async (orderId, shippingData, user, req = null) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng.');
    }

    if (order.status !== 'processing') {
      throw new Error(`Không thể giao hàng ở trạng thái: ${order.status}`);
    }

    // Cập nhật thông tin vận chuyển
    if (shippingData.carrier) order.shipping.carrier = shippingData.carrier;
    if (shippingData.trackingNumber) order.shipping.trackingNumber = shippingData.trackingNumber;
    if (shippingData.estimatedDelivery) order.shipping.estimatedDelivery = new Date(shippingData.estimatedDelivery);
    if (shippingData.notes) order.shipping.notes = shippingData.notes;

    // Thay đổi trạng thái
    await order.changeStatus('shipped', user._id, user.fullName || user.username, shippingData.notes || 'Đã giao hàng');

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'order_ship',
      module: 'order',
      entityType: 'Order',
      entityId: order._id,
      description: `Giao hàng đơn hàng: ${order.orderNumber}`,
      metadata: {
        trackingNumber: shippingData.trackingNumber,
        carrier: shippingData.carrier
      },
      severity: 'medium'
    }, req);

    return {
      success: true,
      order: await Order.findById(orderId)
        .populate('items')
        .populate('createdBy', 'fullName')
        .populate('buyer', 'fullName')
        .populate('seller', 'fullName')
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Xác nhận đã nhận hàng (delivered)
 */
const deliverOrder = async (orderId, user, req = null) => {
  try {
    const order = await Order.findById(orderId)
      .populate('items');

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng.');
    }

    if (order.status !== 'shipped') {
      throw new Error(`Không thể xác nhận nhận hàng ở trạng thái: ${order.status}`);
    }

    // Cập nhật ngày giao hàng thực tế
    order.shipping.actualDelivery = new Date();
    order.deliveredDate = new Date();

    // Cập nhật order items
    for (const item of order.items) {
      await item.updateDeliveredQuantity(item.quantity, 'Đã nhận hàng');
    }

    // Thay đổi trạng thái
    await order.changeStatus('delivered', user._id, user.fullName || user.username, 'Đã nhận hàng');

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'order_deliver',
      module: 'order',
      entityType: 'Order',
      entityId: order._id,
      description: `Xác nhận nhận hàng: ${order.orderNumber}`,
      severity: 'medium'
    }, req);

    return {
      success: true,
      order: await Order.findById(orderId)
        .populate('items')
        .populate('createdBy', 'fullName')
        .populate('buyer', 'fullName')
        .populate('seller', 'fullName')
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Hủy đơn hàng
 */
const cancelOrder = async (orderId, reason, user, req = null) => {
  try {
    const order = await Order.findById(orderId);

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng.');
    }

    if (['delivered', 'completed', 'cancelled'].includes(order.status)) {
      throw new Error(`Không thể hủy đơn hàng ở trạng thái: ${order.status}`);
    }

    // Cập nhật lý do hủy
    order.cancellationReason = reason;
    order.cancelledDate = new Date();

    // Thay đổi trạng thái
    await order.changeStatus('cancelled', user._id, user.fullName || user.username, reason);

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'order_cancel',
      module: 'order',
      entityType: 'Order',
      entityId: order._id,
      description: `Hủy đơn hàng: ${order.orderNumber}`,
      metadata: { reason },
      severity: 'high'
    }, req);

    return {
      success: true,
      order: await Order.findById(orderId)
        .populate('items')
        .populate('createdBy', 'fullName')
        .populate('buyer', 'fullName')
        .populate('seller', 'fullName')
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createOrder,
  confirmOrder,
  processOrder,
  shipOrder,
  deliverOrder,
  cancelOrder
};

