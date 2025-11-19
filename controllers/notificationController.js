const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Tạo thông báo mới
// @route   POST /api/notifications
// @access  Private
const createNotification = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      priority,
      scope,
      scopeDetails,
      relatedModule,
      relatedId,
      isPublic,
      requiresAction,
      actionUrl,
      actionText,
      scheduledAt,
      expiresAt,
      tags
    } = req.body;

    // Tạo thông báo
    const notificationData = {
      title,
      content,
      type,
      priority,
      sender: req.user._id,
      scope,
      scopeDetails,
      relatedModule,
      relatedId,
      isPublic,
      requiresAction,
      actionUrl,
      actionText,
      scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      tags: tags || []
    };

    const notification = await Notification.createNotification(notificationData);

    // Populate để trả về thông tin đầy đủ
    await notification.populate([
      { path: 'sender', select: 'fullName email role avatar' },
      { path: 'recipients.user', select: 'fullName email role' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo thông báo thành công',
      data: {
        notification
      }
    });

  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo thông báo'
    });
  }
};

// @desc    Lấy danh sách thông báo của người dùng
// @route   GET /api/notifications
// @access  Private
const getUserNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      priority,
      unreadOnly,
      fromDate,
      toDate,
      search
    } = req.query;

    const skip = (page - 1) * limit;
    
    const notifications = await Notification.getUserNotifications(
      req.user._id,
      {
        type,
        priority,
        unreadOnly: unreadOnly === 'true',
        fromDate,
        toDate,
        search,
        limit: parseInt(limit)
      }
    );

    const total = await Notification.countDocuments({
      'recipients.user': req.user._id,
      status: 'published',
      $or: [
        { expiresAt: null },
        { expiresAt: { $gt: new Date() } }
      ]
    });

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thông báo'
    });
  }
};

// @desc    Lấy thông báo chi tiết
// @route   GET /api/notifications/:id
// @access  Private
const getNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id)
      .populate('sender', 'fullName email role avatar organizationInfo')
      .populate('recipients.user', 'fullName email role')
      .populate('attachments');

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Thông báo không tồn tại'
      });
    }

    // Kiểm tra quyền xem
    const canView = notification.recipients.some(
      recipient => recipient.user._id.toString() === req.user._id.toString()
    );

    if (!canView) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem thông báo này'
      });
    }

    res.status(200).json({
      success: true,
      data: {
        notification
      }
    });

  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin thông báo'
    });
  }
};

// @desc    Đánh dấu thông báo là đã đọc
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Thông báo không tồn tại'
      });
    }

    await notification.markAsRead(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu thông báo là đã đọc'
    });

  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đánh dấu thông báo'
    });
  }
};

// @desc    Đánh dấu tất cả thông báo là đã đọc
// @route   PUT /api/notifications/read-all
// @access  Private
const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      {
        'recipients.user': req.user._id,
        'recipients.isRead': false
      },
      {
        $set: {
          'recipients.$.isRead': true,
          'recipients.$.readAt': new Date()
        }
      }
    );

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu tất cả thông báo là đã đọc'
    });

  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đánh dấu tất cả thông báo'
    });
  }
};

// @desc    Đánh dấu thông báo là chưa đọc
// @route   PUT /api/notifications/:id/unread
// @access  Private
const markAsUnread = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Thông báo không tồn tại'
      });
    }

    await notification.markAsUnread(req.user._id);

    res.status(200).json({
      success: true,
      message: 'Đã đánh dấu thông báo là chưa đọc'
    });

  } catch (error) {
    console.error('Mark as unread error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đánh dấu thông báo'
    });
  }
};

// @desc    Cập nhật thông báo
// @route   PUT /api/notifications/:id
// @access  Private (Admin hoặc người tạo)
const updateNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Thông báo không tồn tại'
      });
    }

    // Kiểm tra quyền cập nhật
    if (req.user.role !== 'admin' && notification.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật thông báo này'
      });
    }

    // Cập nhật thông báo
    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'sender', select: 'fullName email role' },
      { path: 'recipients.user', select: 'fullName email role' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Cập nhật thông báo thành công',
      data: {
        notification: updatedNotification
      }
    });

  } catch (error) {
    console.error('Update notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật thông báo'
    });
  }
};

// @desc    Xóa thông báo
// @route   DELETE /api/notifications/:id
// @access  Private (Admin hoặc người tạo)
const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Thông báo không tồn tại'
      });
    }

    // Kiểm tra quyền xóa
    if (req.user.role !== 'admin' && notification.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xóa thông báo này'
      });
    }

    await Notification.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Xóa thông báo thành công'
    });

  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa thông báo'
    });
  }
};

// @desc    Lấy thống kê thông báo
// @route   GET /api/notifications/stats
// @access  Private
const getNotificationStats = async (req, res) => {
  try {
    const stats = await Notification.getNotificationStats(req.user._id);
    
    const result = stats[0] || {
      total: 0,
      unread: 0,
      urgent: 0,
      high: 0
    };

    res.status(200).json({
      success: true,
      data: {
        stats: result
      }
    });

  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê thông báo'
    });
  }
};

// @desc    Lấy danh sách thông báo đã gửi (cho admin/người tạo)
// @route   GET /api/notifications/sent
// @access  Private
const getSentNotifications = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      type,
      priority,
      search
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Xây dựng filter
    const filter = {};
    
    // Chỉ admin mới xem được tất cả, còn lại chỉ xem của mình
    if (req.user.role !== 'admin') {
      filter.sender = req.user._id;
    }
    
    if (status) {
      filter.status = status;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (priority) {
      filter.priority = priority;
    }

    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const notifications = await Notification.find(filter)
      .populate('sender', 'fullName email role avatar')
      .populate('recipients.user', 'fullName email role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Notification.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get sent notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách thông báo đã gửi'
    });
  }
};

// @desc    Gửi thông báo tự động (cho hệ thống)
// @route   POST /api/notifications/system
// @access  Private (Admin only)
const sendSystemNotification = async (req, res) => {
  try {
    const {
      title,
      content,
      type,
      priority,
      scope,
      scopeDetails,
      isPublic,
      requiresAction,
      actionUrl,
      actionText
    } = req.body;

    // Chỉ admin mới có thể gửi thông báo hệ thống
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền gửi thông báo hệ thống'
      });
    }

    const notificationData = {
      title,
      content,
      type: type || 'system',
      priority: priority || 'medium',
      sender: req.user._id,
      scope,
      scopeDetails,
      isPublic: isPublic !== undefined ? isPublic : true,
      requiresAction,
      actionUrl,
      actionText,
      tags: ['system']
    };

    const notification = await Notification.createNotification(notificationData);

    // Populate để trả về thông tin đầy đủ
    await notification.populate([
      { path: 'sender', select: 'fullName email role avatar' },
      { path: 'recipients.user', select: 'fullName email role' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Gửi thông báo hệ thống thành công',
      data: {
        notification
      }
    });

  } catch (error) {
    console.error('Send system notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi gửi thông báo hệ thống'
    });
  }
};

module.exports = {
  createNotification,
  getUserNotifications,
  getNotification,
  markAsRead,
  markAllAsRead,
  markAsUnread,
  updateNotification,
  deleteNotification,
  getNotificationStats,
  getSentNotifications,
  sendSystemNotification
};
