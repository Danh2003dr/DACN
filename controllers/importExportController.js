const multer = require('multer');
const path = require('path');
const fs = require('fs');
const importExportService = require('../services/importExportService');

// Cấu hình multer cho file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, importExportService.UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file CSV hoặc Excel'));
    }
  }
});

// Upload cho PDF (riêng biệt)
const uploadPDF = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file PDF'));
    }
  }
});

/**
 * @desc    Import drugs từ CSV
 * @route   POST /api/import-export/drugs/import
 * @access  Private
 */
const importDrugs = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload file CSV.'
      });
    }

    const result = await importExportService.importDrugsFromCSV(req.file.path, req.user, req);

    // Xóa file sau khi import
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    // Kiểm tra nếu không có dữ liệu được import
    if (result.success === false || result.imported === 0) {
      return res.status(200).json({
        success: false,
        message: result.errors?.[0]?.error || 'Không có dữ liệu nào được import. Vui lòng kiểm tra lại file CSV.',
        data: result
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Import thành công ${result.imported} records, ${result.errors} lỗi.`,
      data: result
    });
  } catch (error) {
    console.error('Error importing drugs:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi import dữ liệu.',
      error: error.message
    });
  }
};

/**
 * @desc    Import inventory từ CSV
 * @route   POST /api/import-export/inventory/import
 * @access  Private
 */
const importInventory = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload file CSV.'
      });
    }

    const result = await importExportService.importInventoryFromCSV(req.file.path, req.user, req);

    // Xóa file sau khi import
    fs.unlinkSync(req.file.path);

    res.status(200).json({
      success: true,
      message: `Import thành công ${result.imported} records, ${result.errors} lỗi.`,
      data: result
    });
  } catch (error) {
    console.error('Error importing inventory:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi import dữ liệu.',
      error: error.message
    });
  }
};

/**
 * @desc    Export drugs ra CSV
 * @route   GET /api/import-export/drugs/export
 * @access  Private
 */
const exportDrugs = async (req, res) => {
  try {
    const filters = req.query;
    const result = await importExportService.exportDrugsToCSV(filters, req.user, req);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=drugs-${Date.now()}.csv`);
    // Convert sang Buffer để đảm bảo UTF-8 BOM được gửi đúng
    res.send(Buffer.from(result.data, 'utf-8'));
  } catch (error) {
    console.error('Error exporting drugs:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi export dữ liệu.',
      error: error.message
    });
  }
};

/**
 * @desc    Export inventory ra CSV
 * @route   GET /api/import-export/inventory/export
 * @access  Private
 */
const exportInventory = async (req, res) => {
  try {
    const filters = req.query;
    const result = await importExportService.exportInventoryToCSV(filters, req.user, req);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=inventory-${Date.now()}.csv`);
    // Convert sang Buffer để đảm bảo UTF-8 BOM được gửi đúng
    res.send(Buffer.from(result.data, 'utf-8'));
  } catch (error) {
    console.error('Error exporting inventory:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi export dữ liệu.',
      error: error.message
    });
  }
};

/**
 * @desc    Export orders ra CSV
 * @route   GET /api/import-export/orders/export
 * @access  Private
 */
const exportOrders = async (req, res) => {
  try {
    const filters = req.query;
    const result = await importExportService.exportOrdersToCSV(filters, req.user, req);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=orders-${Date.now()}.csv`);
    // Convert sang Buffer để đảm bảo UTF-8 BOM được gửi đúng
    res.send(Buffer.from(result.data, 'utf-8'));
  } catch (error) {
    console.error('Error exporting orders:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi export dữ liệu.',
      error: error.message
    });
  }
};

/**
 * @desc    Export invoices ra CSV
 * @route   GET /api/import-export/invoices/export
 * @access  Private
 */
const exportInvoices = async (req, res) => {
  try {
    const filters = req.query;
    const result = await importExportService.exportInvoicesToCSV(filters, req.user, req);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename=invoices-${Date.now()}.csv`);
    // Convert sang Buffer để đảm bảo UTF-8 BOM được gửi đúng
    res.send(Buffer.from(result.data, 'utf-8'));
  } catch (error) {
    console.error('Error exporting invoices:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi export dữ liệu.',
      error: error.message
    });
  }
};

/**
 * @desc    Import drugs từ PDF công văn Bộ Y tế
 * @route   POST /api/import-export/drugs/import-pdf
 * @access  Private (Admin only)
 */
const importDrugsFromPDF = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng upload file PDF.'
      });
    }

    const result = await importExportService.importDrugsFromPDF(req.file.path, req.user, req);

    // Xóa file sau khi import
    fs.unlinkSync(req.file.path);

    // Kiểm tra nếu không có dữ liệu được extract
    if (result.success === false) {
      return res.status(400).json({
        success: false,
        message: result.errors?.[0]?.error || 'Không tìm thấy dữ liệu thuốc trong PDF.',
        data: result
      });
    }
    
    res.status(200).json({
      success: true,
      message: `Import từ PDF thành công: ${result.imported} records, ${result.errors} lỗi.`,
      data: result
    });
  } catch (error) {
    console.error('Error importing drugs from PDF:', error);
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi import dữ liệu từ PDF.',
      error: error.message
    });
  }
};

module.exports = {
  importDrugs: [upload.single('file'), importDrugs],
  importInventory: [upload.single('file'), importInventory],
  importDrugsFromPDF: [uploadPDF.single('file'), importDrugsFromPDF],
  exportDrugs,
  exportInventory,
  exportOrders,
  exportInvoices
};

