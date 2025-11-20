const express = require('express');
const router = express.Router();
const digitalSignatureController = require('../controllers/digitalSignatureController');
const signatureTemplateController = require('../controllers/signatureTemplateController');
const signatureBatchController = require('../controllers/signatureBatchController');
const { authenticate, authorize } = require('../middleware/auth');
const { cacheMiddleware } = require('../middleware/cache');

/**
 * @route   POST /api/digital-signatures/sign
 * @desc    Ký số cho một đối tượng
 * @access  Private (manufacturer, distributor, hospital, admin)
 */
router.post(
  '/sign',
  authenticate,
  authorize(['admin', 'manufacturer', 'distributor', 'hospital']),
  digitalSignatureController.signDocument
);

/**
 * HSM test connection
 */
router.post(
  '/hsm/test',
  authenticate,
  authorize(['admin']),
  digitalSignatureController.testHsmConnection
);

/**
 * CA Providers
 */
router.get('/ca/providers', authenticate, cacheMiddleware(600), digitalSignatureController.getCaProviders);
router.post(
  '/ca/providers',
  authenticate,
  authorize(['admin']),
  digitalSignatureController.createCaProvider
);

/**
 * Signature templates
 */
router.post(
  '/templates',
  authenticate,
  authorize(['admin']),
  signatureTemplateController.createTemplate
);
router.get('/templates', authenticate, cacheMiddleware(300), signatureTemplateController.getTemplates);
router.get('/templates/:id', authenticate, cacheMiddleware(300), signatureTemplateController.getTemplateById);
router.put(
  '/templates/:id',
  authenticate,
  authorize(['admin']),
  signatureTemplateController.updateTemplate
);
router.post(
  '/templates/:id/status',
  authenticate,
  authorize(['admin']),
  signatureTemplateController.changeTemplateStatus
);

/**
 * Batch signing
 */
router.post(
  '/batch',
  authenticate,
  authorize(['admin', 'manufacturer', 'distributor', 'hospital']),
  signatureBatchController.createBatch
);
router.get('/batch', authenticate, cacheMiddleware(180), signatureBatchController.getBatches);
router.get('/batch/:id', authenticate, cacheMiddleware(180), signatureBatchController.getBatchById);

/**
 * @route   POST /api/digital-signatures/verify
 * @desc    Xác thực chữ ký số
 * @access  Public
 */
router.post('/verify', digitalSignatureController.verifySignature);

/**
 * @route   GET /api/digital-signatures
 * @desc    Lấy danh sách chữ ký số
 * @access  Private
 */
router.get('/', authenticate, cacheMiddleware(180), digitalSignatureController.getSignatures);

/**
 * @route   GET /api/digital-signatures/stats
 * @desc    Thống kê chữ ký số
 * @access  Private
 */
router.get('/stats', authenticate, cacheMiddleware(120), digitalSignatureController.getStats);

/**
 * @route   GET /api/digital-signatures/target/:targetType/:targetId
 * @desc    Lấy chữ ký số của một đối tượng
 * @access  Private
 */
router.get(
  '/target/:targetType/:targetId',
  authenticate,
  digitalSignatureController.getSignaturesByTarget
);

/**
 * @route   POST /api/digital-signatures/:id/revoke
 * @desc    Thu hồi chữ ký số
 * @access  Private (admin hoặc người ký)
 */
router.post(
  '/:id/revoke',
  authenticate,
  digitalSignatureController.revokeSignature
);

/**
 * @route   GET /api/digital-signatures/:id
 * @desc    Lấy chi tiết chữ ký số
 * @access  Private
 */
router.get('/:id', authenticate, digitalSignatureController.getSignatureById);

module.exports = router;

