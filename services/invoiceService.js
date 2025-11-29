const Invoice = require('../models/Invoice');
const Payment = require('../models/Payment');
const Order = require('../models/Order');
const auditService = require('./auditService');

/**
 * Invoice Service
 * Service để xử lý logic nghiệp vụ hóa đơn
 */

/**
 * Tạo hóa đơn từ order
 */
const createInvoiceFromOrder = async (orderId, user, req = null) => {
  try {
    const order = await Order.findById(orderId)
      .populate('items')
      .populate('buyer', 'fullName organizationInfo email')
      .populate('seller', 'fullName organizationInfo email');

    if (!order) {
      throw new Error('Không tìm thấy đơn hàng.');
    }

    // Kiểm tra xem đã có invoice chưa
    const existingInvoice = await Invoice.findOne({ order: orderId });
    if (existingInvoice) {
      throw new Error('Đơn hàng này đã có hóa đơn.');
    }

    // Tạo invoice number
    const invoiceNumber = Invoice.generateInvoiceNumber(order.orderType === 'purchase' ? 'purchase' : 'sales');

    // Tính toán giá trị từ order items
    let subtotal = 0;
    const invoiceItems = [];

    for (const item of order.items) {
      const itemSubtotal = item.finalPrice || (item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100));
      const itemTax = itemSubtotal * 0.1; // 10% VAT
      const itemTotal = itemSubtotal + itemTax;

      subtotal += itemSubtotal;

      invoiceItems.push({
        drugId: item.drugId,
        drugName: item.drugName,
        batchNumber: item.batchNumber,
        quantity: item.quantity,
        unit: item.unit,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        taxRate: 10,
        subtotal: itemSubtotal,
        tax: itemTax,
        total: itemTotal
      });
    }

    // Tính tổng
    const tax = subtotal * 0.1; // 10% VAT
    const shippingFee = order.shippingFee || 0;
    const totalAmount = subtotal + tax + shippingFee;

    // Tính due date (30 ngày sau issue date)
    const issueDate = new Date();
    const dueDate = new Date(issueDate);
    dueDate.setDate(dueDate.getDate() + 30);

    // Tạo invoice
    const invoice = await Invoice.create({
      invoiceNumber,
      invoiceType: order.orderType === 'purchase' ? 'purchase' : 'sales',
      status: 'issued',
      order: order._id,
      orderNumber: order.orderNumber,
      seller: order.seller || order.createdBy,
      sellerInfo: {
        name: order.sellerName || 'Seller',
        organization: order.sellerOrganization || '',
        taxCode: '',
        address: '',
        phone: '',
        email: order.seller?.email || ''
      },
      buyer: order.buyer || order.createdBy,
      buyerInfo: {
        name: order.buyerName || 'Buyer',
        organization: order.buyerOrganization || '',
        taxCode: '',
        address: order.shippingAddress?.address || '',
        phone: order.shippingAddress?.phone || '',
        email: order.buyer?.email || ''
      },
      items: invoiceItems,
      subtotal,
      tax,
      shippingFee,
      totalAmount,
      issueDate,
      dueDate,
      paymentStatus: 'pending',
      createdBy: user._id
    });

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'invoice_create',
      module: 'invoice',
      entityType: 'Invoice',
      entityId: invoice._id,
      description: `Tạo hóa đơn từ đơn hàng: ${order.orderNumber}`,
      afterData: {
        invoiceNumber,
        totalAmount
      },
      severity: 'medium'
    }, req);

    return {
      success: true,
      invoice: await Invoice.findById(invoice._id)
        .populate('seller', 'fullName')
        .populate('buyer', 'fullName')
        .populate('order', 'orderNumber')
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Ghi nhận thanh toán
 */
const recordPayment = async (invoiceId, paymentData, user, req = null) => {
  try {
    const invoice = await Invoice.findById(invoiceId);

    if (!invoice) {
      throw new Error('Không tìm thấy hóa đơn.');
    }

    const {
      amount,
      method,
      paymentDate,
      bankTransaction,
      cardTransaction,
      gatewayTransaction,
      notes
    } = paymentData;

    // Tạo payment record
    const payment = await Payment.create({
      transactionNumber: Payment.generateTransactionNumber(),
      paymentType: 'invoice_payment',
      invoice: invoice._id,
      invoiceNumber: invoice.invoiceNumber,
      order: invoice.order,
      payer: invoice.buyer,
      payerInfo: {
        name: invoice.buyerInfo.name,
        organization: invoice.buyerInfo.organization
      },
      payee: invoice.seller,
      payeeInfo: {
        name: invoice.sellerInfo.name,
        organization: invoice.sellerInfo.organization
      },
      amount,
      method,
      status: 'completed',
      paymentDate: paymentDate || new Date(),
      bankTransaction: bankTransaction || null,
      cardTransaction: cardTransaction || null,
      gatewayTransaction: gatewayTransaction || null,
      notes,
      createdBy: user._id
    });

    // Cập nhật invoice
    invoice.paidAmount = (invoice.paidAmount || 0) + amount;
    invoice.dueAmount = invoice.totalAmount - invoice.paidAmount;
    
    if (invoice.paidAmount >= invoice.totalAmount) {
      invoice.paymentStatus = 'paid';
      invoice.status = 'paid';
      invoice.paidDate = paymentDate || new Date();
    } else if (invoice.paidAmount > 0) {
      invoice.paymentStatus = 'partial';
    }
    
    await invoice.save();

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'payment_record',
      module: 'payment',
      entityType: 'Payment',
      entityId: payment._id,
      description: `Ghi nhận thanh toán cho hóa đơn: ${invoice.invoiceNumber}`,
      afterData: {
        amount,
        method,
        paidAmount: invoice.paidAmount,
        dueAmount: invoice.dueAmount
      },
      severity: 'high'
    }, req);

    return {
      success: true,
      payment,
      invoice: await Invoice.findById(invoiceId)
        .populate('seller', 'fullName')
        .populate('buyer', 'fullName')
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Tạo hóa đơn trực tiếp (không từ order)
 */
const createInvoice = async (invoiceData, user, req = null) => {
  try {
    const {
      invoiceType,
      sellerId,
      sellerInfo,
      buyerId,
      buyerInfo,
      items,
      issueDate,
      dueDate,
      paymentMethod,
      notes
    } = invoiceData;

    // Tính toán giá trị
    let subtotal = 0;
    for (const item of items) {
      const itemSubtotal = item.quantity * item.unitPrice * (1 - (item.discount || 0) / 100);
      const itemTax = itemSubtotal * (item.taxRate || 10) / 100;
      item.subtotal = itemSubtotal;
      item.tax = itemTax;
      item.total = itemSubtotal + itemTax;
      subtotal += itemSubtotal;
    }

    const tax = subtotal * 0.1; // 10% VAT
    const shippingFee = invoiceData.shippingFee || 0;
    const totalAmount = subtotal + tax + shippingFee;

    // Tạo invoice
    const invoice = await Invoice.create({
      invoiceNumber: Invoice.generateInvoiceNumber(invoiceType),
      invoiceType,
      status: 'issued',
      seller: sellerId,
      sellerInfo: sellerInfo || {},
      buyer: buyerId,
      buyerInfo: buyerInfo || {},
      items,
      subtotal,
      tax,
      shippingFee,
      totalAmount,
      issueDate: issueDate ? new Date(issueDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      paymentMethod: paymentMethod || 'bank_transfer',
      paymentStatus: 'pending',
      notes,
      createdBy: user._id
    });

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'invoice_create',
      module: 'invoice',
      entityType: 'Invoice',
      entityId: invoice._id,
      description: `Tạo hóa đơn: ${invoice.invoiceNumber}`,
      afterData: {
        invoiceNumber: invoice.invoiceNumber,
        totalAmount
      },
      severity: 'medium'
    }, req);

    return {
      success: true,
      invoice: await Invoice.findById(invoice._id)
        .populate('seller', 'fullName')
        .populate('buyer', 'fullName')
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  createInvoiceFromOrder,
  createInvoice,
  recordPayment
};

