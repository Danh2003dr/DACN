const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  importDrugs,
  importInventory,
  exportDrugs,
  exportInventory,
  exportOrders,
  exportInvoices
} = require('../controllers/importExportController');

// Tất cả routes yêu cầu admin (Import/Export là chức năng nhạy cảm)
router.use(authenticate);
router.use(authorize('admin'));

// Import routes
router.post('/drugs/import', importDrugs);
router.post('/inventory/import', importInventory);

// Export routes
router.get('/drugs/export', exportDrugs);
router.get('/inventory/export', exportInventory);
router.get('/orders/export', exportOrders);
router.get('/invoices/export', exportInvoices);

module.exports = router;

