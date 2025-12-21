const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const {
  createRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  rejectRequest
} = require('../controllers/roleUpgradeController');

const { authenticate, authorize } = require('../middleware/auth');
const uploadDocuments = require('../middleware/uploadDocuments');
const RoleUpgradeRequest = require('../models/RoleUpgradeRequest');

// @route   POST /api/role-upgrade/request
// @desc    Tạo yêu cầu nâng cấp role
// @access  Private (Patient only)
router.post('/request',
  authenticate,
  uploadDocuments.array('documents', 5),
  createRequest
);

// @route   GET /api/role-upgrade/my-requests
// @desc    Lấy yêu cầu của user hiện tại
// @access  Private
router.get('/my-requests',
  authenticate,
  getMyRequests
);

// @route   GET /api/role-upgrade/requests
// @desc    Lấy tất cả yêu cầu (Admin only)
// @access  Private (Admin only)
router.get('/requests',
  authenticate,
  authorize('admin'),
  getAllRequests
);

// @route   PUT /api/role-upgrade/requests/:id/approve
// @desc    Duyệt yêu cầu nâng cấp role
// @access  Private (Admin only)
router.put('/requests/:id/approve',
  authenticate,
  authorize('admin'),
  approveRequest
);

// @route   PUT /api/role-upgrade/requests/:id/reject
// @desc    Từ chối yêu cầu nâng cấp role
// @access  Private (Admin only)
router.put('/requests/:id/reject',
  authenticate,
  authorize('admin'),
  rejectRequest
);

// @route   GET /api/role-upgrade/documents/:requestId/:filename
// @desc    Tải/xem tài liệu đính kèm
// @access  Private (User hoặc Admin)
router.get('/documents/:requestId/:filename',
  authenticate,
  async (req, res) => {
    try {
      const { requestId, filename } = req.params;
      
      const request = await RoleUpgradeRequest.findById(requestId);
      if (!request) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy yêu cầu'
        });
      }
      
      // Kiểm tra quyền: chỉ user tạo request hoặc admin mới được xem
      if (request.requestedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Không có quyền truy cập tài liệu này'
        });
      }
      
      // Tìm document
      const document = request.documents.find(doc => doc.filename === filename);
      if (!document) {
        return res.status(404).json({
          success: false,
          message: 'Không tìm thấy tài liệu'
        });
      }
      
      // Đường dẫn file
      const filePath = path.join(__dirname, '..', document.path);
      
      // Kiểm tra file tồn tại
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({
          success: false,
          message: 'File không tồn tại'
        });
      }
      
      // Gửi file
      res.setHeader('Content-Type', document.mimeType);
      res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(document.originalName)}"`);
      res.sendFile(path.resolve(filePath));
      
    } catch (error) {
      console.error('Error serving document:', error);
      res.status(500).json({
        success: false,
        message: 'Lỗi server khi tải tài liệu'
      });
    }
  }
);

module.exports = router;

