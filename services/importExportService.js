const fs = require('fs');
const path = require('path');
const Drug = require('../models/Drug');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Supplier = require('../models/Supplier');
const auditService = require('./auditService');

/**
 * Import/Export Service
 * Service để xử lý import/export dữ liệu từ Excel/CSV
 */

// Thư mục uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Simple CSV parser
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
    
    if (lines.length === 0) {
      resolve(results);
      return;
    }
    
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      results.push(row);
    }
    
    resolve(results);
  });
};

// Simple CSV generator
const generateCSV = (data, fields) => {
  if (!data || data.length === 0) return '';
  
  // Get headers
  const headers = fields || Object.keys(data[0]);
  
  // Generate CSV
  let csv = headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      const value = header.includes('.') 
        ? header.split('.').reduce((obj, key) => obj?.[key], row) || ''
        : row[header] || '';
      // Escape commas and quotes
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csv += values.join(',') + '\n';
  });
  
  return csv;
};

/**
 * Import Drugs từ CSV
 */
const importDrugsFromCSV = async (filePath, user, req = null) => {
  try {
    const rows = await parseCSV(filePath);
    const results = [];
    const errors = [];

    for (const row of rows) {
      try {
        // Validate và tạo drug
        const drugData = {
          name: row.name || row['Tên thuốc'],
          activeIngredient: row.activeIngredient || row['Thành phần'],
          dosage: row.dosage || row['Liều lượng'],
          form: row.form || row['Dạng bào chế'],
          batchNumber: row.batchNumber || row['Số lô'],
          productionDate: row.productionDate || row['Ngày sản xuất'],
          expiryDate: row.expiryDate || row['Hạn sử dụng'],
          manufacturerId: row.manufacturerId || row['Nhà sản xuất ID']
        };

        // Kiểm tra batch number đã tồn tại
        const existing = await Drug.findOne({ batchNumber: drugData.batchNumber });
        if (existing) {
          errors.push({ row, error: 'Batch number đã tồn tại' });
          continue;
        }

        const drug = await Drug.create({
          ...drugData,
          createdBy: user._id
        });

        results.push(drug);
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'data_import',
      module: 'import_export',
      description: `Import drugs từ CSV: ${results.length} thành công, ${errors.length} lỗi`,
      metadata: {
        type: 'drugs',
        format: 'csv',
        success: results.length,
        errors: errors.length
      },
      severity: 'medium'
    }, req);

    return {
      success: true,
      imported: results.length,
      errors: errors.length,
      results,
      errors
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Import Inventory từ CSV
 */
const importInventoryFromCSV = async (filePath, user, req = null) => {
  try {
    const rows = await parseCSV(filePath);
    const results = [];
    const errors = [];

    for (const row of rows) {
      try {
        const inventoryData = {
          drugId: row.drugId || row['Mã thuốc'],
          locationId: row.locationId || row['Location ID'],
          locationName: row.locationName || row['Tên địa điểm'],
          quantity: parseInt(row.quantity || row['Số lượng']),
          unit: row.unit || row['Đơn vị'] || 'viên',
          unitPrice: parseFloat(row.unitPrice || row['Giá đơn vị'] || 0)
        };

        // Tìm drug
        const drug = await Drug.findOne({ drugId: inventoryData.drugId });
        if (!drug) {
          errors.push({ row, error: 'Không tìm thấy thuốc' });
          continue;
        }

        // Tìm hoặc tạo inventory
        let inventory = await Inventory.findOne({
          drugId: inventoryData.drugId,
          'location.locationId': inventoryData.locationId
        });

        if (inventory) {
          // Cập nhật số lượng
          inventory.quantity += inventoryData.quantity;
          await inventory.save();
        } else {
          // Tạo mới
          inventory = await Inventory.create({
            drug: drug._id,
            drugId: drug.drugId,
            drugName: drug.name,
            batchNumber: drug.batchNumber,
            location: {
              type: 'warehouse',
              locationId: inventoryData.locationId,
              locationName: inventoryData.locationName
            },
            quantity: inventoryData.quantity,
            unit: inventoryData.unit,
            unitPrice: inventoryData.unitPrice,
            expiryDate: drug.expiryDate,
            productionDate: drug.productionDate,
            createdBy: user._id
          });
        }

        results.push(inventory);
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    await auditService.createAuditLog({
      user,
      action: 'data_import',
      module: 'import_export',
      description: `Import inventory từ CSV: ${results.length} thành công`,
      metadata: {
        type: 'inventory',
        format: 'csv',
        success: results.length,
        errors: errors.length
      },
      severity: 'medium'
    }, req);

    return {
      success: true,
      imported: results.length,
      errors: errors.length,
      results,
      errors
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export Drugs ra CSV
 */
const exportDrugsToCSV = async (filters = {}, user, req = null) => {
  try {
    const drugs = await Drug.find(filters)
      .populate('manufacturerId', 'fullName organizationInfo')
      .lean();

    const fields = [
      'drugId',
      'name',
      'activeIngredient',
      'dosage',
      'form',
      'batchNumber',
      'productionDate',
      'expiryDate',
      'manufacturerId'
    ];

    const csvData = generateCSV(drugs, fields);

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'data_export',
      module: 'import_export',
      description: `Export drugs ra CSV: ${drugs.length} records`,
      metadata: {
        type: 'drugs',
        format: 'csv',
        count: drugs.length
      },
      severity: 'low'
    }, req);

    return {
      success: true,
      data: csvData,
      count: drugs.length
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export Inventory ra CSV
 */
const exportInventoryToCSV = async (filters = {}, user, req = null) => {
  try {
    const items = await Inventory.find(filters)
      .populate('drug', 'name drugId')
      .lean();

    // Flatten nested fields for CSV
    const flattenedItems = items.map(item => ({
      drugId: item.drugId,
      drugName: item.drugName,
      batchNumber: item.batchNumber,
      locationId: item.location?.locationId || '',
      locationName: item.location?.locationName || '',
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: item.unitPrice,
      totalValue: item.totalValue || (item.quantity * item.unitPrice),
      expiryDate: item.expiryDate,
      status: item.status
    }));

    const fields = [
      'drugId',
      'drugName',
      'batchNumber',
      'locationId',
      'locationName',
      'quantity',
      'unit',
      'unitPrice',
      'totalValue',
      'expiryDate',
      'status'
    ];

    const csvData = generateCSV(flattenedItems, fields);

    await auditService.createAuditLog({
      user,
      action: 'data_export',
      module: 'import_export',
      description: `Export inventory ra CSV: ${items.length} records`,
      metadata: {
        type: 'inventory',
        format: 'csv',
        count: items.length
      },
      severity: 'low'
    }, req);

    return {
      success: true,
      data: csvData,
      count: items.length
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export Orders ra CSV
 */
const exportOrdersToCSV = async (filters = {}, user, req = null) => {
  try {
    const orders = await Order.find(filters)
      .populate('items')
      .lean();

    // Flatten nested fields
    const flattenedOrders = orders.map(order => ({
      orderNumber: order.orderNumber,
      orderType: order.orderType,
      status: order.status,
      buyerName: order.buyerName || '',
      sellerName: order.sellerName || '',
      orderDate: order.orderDate,
      totalAmount: order.totalAmount,
      paymentStatus: order.paymentStatus || ''
    }));

    const fields = [
      'orderNumber',
      'orderType',
      'status',
      'buyerName',
      'sellerName',
      'orderDate',
      'totalAmount',
      'paymentStatus'
    ];

    const csvData = generateCSV(flattenedOrders, fields);

    await auditService.createAuditLog({
      user,
      action: 'data_export',
      module: 'import_export',
      description: `Export orders ra CSV: ${orders.length} records`,
      metadata: {
        type: 'orders',
        format: 'csv',
        count: orders.length
      },
      severity: 'low'
    }, req);

    return {
      success: true,
      data: csvData,
      count: orders.length
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export Invoices ra CSV
 */
const exportInvoicesToCSV = async (filters = {}, user, req = null) => {
  try {
    const invoices = await Invoice.find(filters).lean();

    // Flatten nested fields
    const flattenedInvoices = invoices.map(invoice => ({
      invoiceNumber: invoice.invoiceNumber,
      invoiceType: invoice.invoiceType,
      status: invoice.status,
      buyerName: invoice.buyerInfo?.name || '',
      sellerName: invoice.sellerInfo?.name || '',
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      totalAmount: invoice.totalAmount,
      paidAmount: invoice.paidAmount,
      dueAmount: invoice.dueAmount,
      paymentStatus: invoice.paymentStatus
    }));

    const fields = [
      'invoiceNumber',
      'invoiceType',
      'status',
      'buyerName',
      'sellerName',
      'issueDate',
      'dueDate',
      'totalAmount',
      'paidAmount',
      'dueAmount',
      'paymentStatus'
    ];

    const csvData = generateCSV(flattenedInvoices, fields);

    await auditService.createAuditLog({
      user,
      action: 'data_export',
      module: 'import_export',
      description: `Export invoices ra CSV: ${invoices.length} records`,
      metadata: {
        type: 'invoices',
        format: 'csv',
        count: invoices.length
      },
      severity: 'low'
    }, req);

    return {
      success: true,
      data: csvData,
      count: invoices.length
    };
  } catch (error) {
    throw error;
  }
};

module.exports = {
  importDrugsFromCSV,
  importInventoryFromCSV,
  exportDrugsToCSV,
  exportInventoryToCSV,
  exportOrdersToCSV,
  exportInvoicesToCSV,
  UPLOAD_DIR
};
