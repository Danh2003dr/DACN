const RoleUpgradeRequest = require('../models/RoleUpgradeRequest');
const User = require('../models/User');
const Notification = require('../models/Notification');
const auditService = require('../services/auditService');
const path = require('path');

// @desc    Tạo yêu cầu nâng cấp role
// @route   POST /api/role-upgrade/request
// @access  Private (Patient only)
const createRequest = async (req, res) => {
  try {
    // Kiểm tra user là patient
    if (req.user.role !== 'patient') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ bệnh nhân mới có thể yêu cầu nâng cấp role.'
      });
    }
    
    const {
      requestedRole,
      reason,
      additionalInfo: additionalInfoStr
    } = req.body;
    
    // Parse additionalInfo từ JSON string (nếu có)
    let additionalInfo = {};
    if (additionalInfoStr) {
      try {
        additionalInfo = typeof additionalInfoStr === 'string' 
          ? JSON.parse(additionalInfoStr) 
          : additionalInfoStr;
      } catch (parseError) {
        console.error('Error parsing additionalInfo:', parseError);
        additionalInfo = {};
      }
    }
    
    // Validation
    if (!requestedRole || !['manufacturer', 'distributor', 'hospital'].includes(requestedRole)) {
      return res.status(400).json({
        success: false,
        message: 'Vai trò yêu cầu không hợp lệ.'
      });
    }
    
    // Kiểm tra không có yêu cầu pending nào
    const pendingRequest = await RoleUpgradeRequest.findOne({
      requestedBy: req.user._id,
      status: 'pending'
    });
    
    if (pendingRequest) {
      return res.status(400).json({
        success: false,
        message: 'Bạn đã có yêu cầu đang chờ xử lý. Vui lòng chờ kết quả hoặc hủy yêu cầu hiện tại.'
      });
    }
    
    // Xử lý documents từ multer
    const documents = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        documents.push({
          filename: file.filename,
          originalName: file.originalname,
          path: file.path,
          mimeType: file.mimetype,
          size: file.size,
          documentType: 'other', // Có thể cải thiện sau để tự động detect
          uploadedAt: new Date()
        });
      });
    }
    
    // Tạo yêu cầu
    const requestData = {
      requestedBy: req.user._id,
      currentRole: req.user.role,
      requestedRole: requestedRole,
      reason: reason || undefined,
      additionalInfo: additionalInfo || {},
      documents: documents,
      status: 'pending'
    };
    
    const request = await RoleUpgradeRequest.create(requestData);
    
    // Populate để trả về thông tin đầy đủ
    await request.populate('requestedBy', 'username email fullName role');
    
    // Gửi notification cho Admin
    try {
      await Notification.createNotification({
        title: 'Yêu cầu nâng cấp role mới',
        content: `Người dùng ${req.user.fullName} (${req.user.username}) đã gửi yêu cầu nâng cấp role từ ${req.user.role} lên ${requestedRole}.`,
        type: 'system',
        priority: 'high',
        sender: req.user._id,
        scope: 'roles',
        scopeDetails: {
          roles: ['admin']
        },
        relatedModule: 'user',
        relatedId: req.user._id,
        isPublic: false,
        requiresAction: true,
        actionUrl: `/role-upgrade/management`,
        actionText: 'Xem chi tiết'
      });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
      // Không làm fail request nếu notification lỗi
    }
    
    // Ghi audit log
    try {
      await auditService.logCRUD.create(
        req.user,
        'RoleUpgradeRequest',
        request._id,
        {
          requestedRole: requestedRole,
          currentRole: req.user.role,
          status: 'pending'
        },
        'role-upgrade',
        req,
        `User ${req.user.username} tạo yêu cầu nâng cấp role từ ${req.user.role} lên ${requestedRole}`
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
      // Không làm fail request nếu audit log lỗi
    }
    
    res.status(201).json({
      success: true,
      message: 'Yêu cầu nâng cấp role đã được gửi thành công.',
      data: {
        request
      }
    });
    
  } catch (error) {
    console.error('Create role upgrade request error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo yêu cầu nâng cấp role.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Lấy yêu cầu của user hiện tại
// @route   GET /api/role-upgrade/my-requests
// @access  Private
const getMyRequests = async (req, res) => {
  try {
    const requests = await RoleUpgradeRequest.find({
      requestedBy: req.user._id
    })
      .populate('requestedBy', 'username email fullName role')
      .populate('reviewedBy', 'username email fullName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        requests
      }
    });
    
  } catch (error) {
    console.error('Get my requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách yêu cầu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Lấy tất cả yêu cầu (Admin only)
// @route   GET /api/role-upgrade/requests
// @access  Private (Admin only)
const getAllRequests = async (req, res) => {
  try {
    const { status } = req.query;
    
    const filter = {};
    if (status && ['pending', 'approved', 'rejected', 'cancelled'].includes(status)) {
      filter.status = status;
    }
    
    const requests = await RoleUpgradeRequest.find(filter)
      .populate('requestedBy', 'username email fullName role patientId organizationId')
      .populate('reviewedBy', 'username email fullName')
      .sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      data: {
        requests
      }
    });
    
  } catch (error) {
    console.error('Get all requests error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách yêu cầu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Duyệt yêu cầu nâng cấp role (Admin only)
// @route   PUT /api/role-upgrade/requests/:id/approve
// @access  Private (Admin only)
const approveRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    const request = await RoleUpgradeRequest.findById(id).populate('requestedBy');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu.'
      });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu này đã được xử lý.'
      });
    }
    
    const user = request.requestedBy;
    
    // Tạo organizationId dựa trên requestedRole
    let organizationId;
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9).toUpperCase();
    
    switch (request.requestedRole) {
      case 'manufacturer':
        organizationId = `MFG_${timestamp}_${randomString}`;
        break;
      case 'distributor':
        organizationId = `DIST_${timestamp}_${randomString}`;
        break;
      case 'hospital':
        organizationId = `HOSP_${timestamp}_${randomString}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Vai trò yêu cầu không hợp lệ.'
        });
    }
    
    // Đảm bảo organizationId là unique
    let attempts = 0;
    while (await User.findOne({ organizationId }) && attempts < 10) {
      const newRandomString = Math.random().toString(36).substring(2, 9).toUpperCase();
      switch (request.requestedRole) {
        case 'manufacturer':
          organizationId = `MFG_${timestamp}_${newRandomString}`;
          break;
        case 'distributor':
          organizationId = `DIST_${timestamp}_${newRandomString}`;
          break;
        case 'hospital':
          organizationId = `HOSP_${timestamp}_${newRandomString}`;
          break;
      }
      attempts++;
    }
    
    if (attempts >= 10) {
      organizationId = `${request.requestedRole.toUpperCase()}_${timestamp}_${randomString}_${Date.now()}`;
    }
    
    // Cập nhật user
    const updateData = {
      role: request.requestedRole,
      organizationId: organizationId,
      patientId: undefined, // Xóa patientId
      organizationInfo: {
        name: request.additionalInfo?.organizationName || '',
        address: request.additionalInfo?.organizationAddress || '',
        phone: request.additionalInfo?.organizationPhone || '',
        email: request.additionalInfo?.organizationEmail || ''
      }
    };
    
    const updatedUser = await User.findByIdAndUpdate(
      user._id,
      { $set: updateData, $unset: { patientId: 1 } },
      { new: true, runValidators: true }
    );
    
    // Cập nhật request
    request.status = 'approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    if (adminNotes) {
      request.adminNotes = adminNotes;
    }
    await request.save();
    
    await request.populate('reviewedBy', 'username email fullName');
    
    // Gửi notification cho user
    try {
      await Notification.createNotification({
        title: 'Yêu cầu nâng cấp role đã được duyệt',
        content: `Yêu cầu nâng cấp role của bạn từ ${request.currentRole} lên ${request.requestedRole} đã được duyệt. Vai trò của bạn đã được cập nhật.`,
        type: 'system',
        priority: 'high',
        sender: req.user._id,
        scope: 'specific_users',
        scopeDetails: {
          userIds: [user._id]
        },
        relatedModule: 'user',
        relatedId: user._id,
        isPublic: true,
        requiresAction: false
      });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
    }
    
    // Ghi audit log
    try {
      await auditService.logCRUD.update(
        req.user,
        'User',
        user._id,
        {
          role: user.role,
          organizationId: user.organizationId,
          patientId: user.patientId
        },
        {
          role: request.requestedRole,
          organizationId: organizationId,
          patientId: null
        },
        'role-upgrade',
        req,
        `Admin ${req.user.username} duyệt yêu cầu nâng cấp role của ${user.username} từ ${request.currentRole} lên ${request.requestedRole}`
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Yêu cầu nâng cấp role đã được duyệt thành công.',
      data: {
        request,
        user: updatedUser
      }
    });
    
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi duyệt yêu cầu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// @desc    Từ chối yêu cầu nâng cấp role (Admin only)
// @route   PUT /api/role-upgrade/requests/:id/reject
// @access  Private (Admin only)
const rejectRequest = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes } = req.body;
    
    // Bắt buộc adminNotes
    if (!adminNotes || adminNotes.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập lý do từ chối.'
      });
    }
    
    const request = await RoleUpgradeRequest.findById(id).populate('requestedBy');
    
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy yêu cầu.'
      });
    }
    
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Yêu cầu này đã được xử lý.'
      });
    }
    
    const user = request.requestedBy;
    
    // Cập nhật request
    request.status = 'rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.adminNotes = adminNotes;
    await request.save();
    
    await request.populate('reviewedBy', 'username email fullName');
    
    // Gửi notification cho user
    try {
      await Notification.createNotification({
        title: 'Yêu cầu nâng cấp role đã bị từ chối',
        content: `Yêu cầu nâng cấp role của bạn từ ${request.currentRole} lên ${request.requestedRole} đã bị từ chối. Lý do: ${adminNotes}`,
        type: 'system',
        priority: 'medium',
        sender: req.user._id,
        scope: 'specific_users',
        scopeDetails: {
          userIds: [user._id]
        },
        relatedModule: 'user',
        relatedId: user._id,
        isPublic: true,
        requiresAction: false
      });
    } catch (notificationError) {
      console.error('Error sending notification:', notificationError);
    }
    
    // Ghi audit log
    try {
      await auditService.logCRUD.update(
        req.user,
        'RoleUpgradeRequest',
        request._id,
        { status: 'pending' },
        { status: 'rejected', adminNotes: adminNotes },
        'role-upgrade',
        req,
        `Admin ${req.user.username} từ chối yêu cầu nâng cấp role của ${user.username} từ ${request.currentRole} lên ${request.requestedRole}. Lý do: ${adminNotes}`
      );
    } catch (auditError) {
      console.error('Error creating audit log:', auditError);
    }
    
    res.status(200).json({
      success: true,
      message: 'Yêu cầu nâng cấp role đã bị từ chối.',
      data: {
        request
      }
    });
    
  } catch (error) {
    console.error('Reject request error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi từ chối yêu cầu.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createRequest,
  getMyRequests,
  getAllRequests,
  approveRequest,
  rejectRequest
};

