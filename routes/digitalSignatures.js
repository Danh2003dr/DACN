const express = require('express');
const router = express.Router();
const digitalSignatureController = require('../controllers/digitalSignatureController');
const { authenticate, authorize } = require('../middleware/auth');

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
router.get('/', authenticate, digitalSignatureController.getSignatures);

/**
 * @route   GET /api/digital-signatures/stats
 * @desc    Thống kê chữ ký số
 * @access  Private
 */
router.get('/stats', authenticate, digitalSignatureController.getStats);

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

