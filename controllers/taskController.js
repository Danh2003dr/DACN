const Task = require('../models/Task');
const User = require('../models/User');
const SupplyChain = require('../models/SupplyChain');
const Drug = require('../models/Drug');
const mongoose = require('mongoose');
const TrustScoreService = require('../services/trustScoreService');

/**
 * Helper function để chuẩn hóa ObjectId từ request body hoặc params
 * Xử lý trường hợp ObjectId là object thay vì string
 */
function normalizeObjectId(id) {
  if (!id) {
    return null;
  }
  
  // Nếu đã là string hợp lệ, trả về ngay
  if (typeof id === 'string' && mongoose.Types.ObjectId.isValid(id)) {
    return id;
  }
  
  // Nếu đã là ObjectId instance, chuyển về string
  if (mongoose.Types.ObjectId.isValid(id)) {
    return String(id);
  }
  
  // Nếu là object với các keys như '0', '1', '2'... (char array)
  if (typeof id === 'object' && id !== null) {
    if (Object.keys(id).every(key => /^\d+$/.test(key))) {
      // Object có dạng { '0': '6', '1': '9', ... }
      const normalized = Object.keys(id)
        .sort((a, b) => parseInt(a) - parseInt(b))
        .map(key => id[key])
        .join('');
      
      if (mongoose.Types.ObjectId.isValid(normalized)) {
        return normalized;
      }
    }
    
    // Thử lấy _id, id, hoặc giá trị đầu tiên
    if (id._id) {
      return normalizeObjectId(id._id);
    }
    if (id.id) {
      return normalizeObjectId(id.id);
    }
    
    // Thử toString() nếu có
    if (id.toString && typeof id.toString === 'function') {
      const str = id.toString();
      if (mongoose.Types.ObjectId.isValid(str)) {
        return str;
      }
    }
  }
  
  // Cuối cùng, thử convert sang string
  const str = String(id);
  if (mongoose.Types.ObjectId.isValid(str)) {
    return str;
  }
  
  return null;
}

// @desc    Tạo nhiệm vụ mới
// @route   POST /api/tasks
// @access  Private
const createTask = async (req, res) => {
  try {
    const {
      title,
      description,
      type,
      priority,
      dueDate,
      assignedTo,
      relatedSupplyChain,
      relatedDrug,
      batchNumber,
      location,
      tags,
      category,
      estimatedDuration,
      cost
    } = req.body;

    // Normalize assignedTo để đảm bảo là string ID hợp lệ
    let normalizedAssignedTo = assignedTo;
    if (assignedTo) {
      if (typeof assignedTo === 'object' && assignedTo !== null) {
        normalizedAssignedTo = assignedTo._id?.toString() || assignedTo.id?.toString() || String(assignedTo);
      } else {
        normalizedAssignedTo = String(assignedTo);
      }
      
      // Validate ObjectId format
      if (!mongoose.Types.ObjectId.isValid(normalizedAssignedTo)) {
        console.error('Invalid assignedTo ID:', { original: assignedTo, normalized: normalizedAssignedTo });
        return res.status(400).json({
          success: false,
          message: 'ID người được giao nhiệm vụ không hợp lệ'
        });
      }
    }

    console.log('📥 Creating task:', { 
      title, 
      assignedTo: normalizedAssignedTo, 
      assignedToType: typeof normalizedAssignedTo 
    });

    // Kiểm tra người được giao nhiệm vụ
    const assignedUser = await User.findById(normalizedAssignedTo);
    if (!assignedUser) {
      return res.status(404).json({
        success: false,
        message: 'Người được giao nhiệm vụ không tồn tại'
      });
    }

    // Kiểm tra quyền giao nhiệm vụ
    if (!['admin', 'manufacturer', 'distributor'].includes(req.user.role) && req.user._id.toString() !== normalizedAssignedTo) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền giao nhiệm vụ cho người này'
      });
    }

    // Tạo nhiệm vụ mới
    const taskData = {
      title,
      description,
      type,
      priority,
      dueDate: new Date(dueDate),
      assignedTo: normalizedAssignedTo,
      assignedBy: req.user._id,
      relatedSupplyChain,
      relatedDrug,
      batchNumber,
      location,
      tags: tags || [],
      category,
      estimatedDuration,
      cost: cost || { estimated: 0, actual: 0, currency: 'VND' }
    };

    const task = new Task(taskData);
    await task.save();

    // Thêm update đầu tiên vào lịch sử khi tạo task
    await task.addUpdate({
      status: task.status,
      progress: task.progress,
      updateText: `Nhiệm vụ đã được tạo và giao cho ${assignedUser.fullName}`,
      updatedBy: req.user._id,
      isPublic: true
    });

    // Thêm thông báo cho người được giao nhiệm vụ
    await task.addNotification({
      type: 'assignment',
      message: `Bạn đã được giao nhiệm vụ mới: ${title}`,
      sentTo: normalizedAssignedTo
    });

    // Populate để trả về thông tin đầy đủ
    await task.populate([
      { path: 'assignedTo', select: 'fullName email role' },
      { path: 'assignedBy', select: 'fullName email role' },
      { path: 'relatedSupplyChain', select: 'drugBatchNumber' },
      { path: 'relatedDrug', select: 'name batchNumber' },
      { path: 'updates.updatedBy', select: 'fullName email role' }
    ]);

    res.status(201).json({
      success: true,
      message: 'Tạo nhiệm vụ thành công',
      data: {
        task
      }
    });

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo nhiệm vụ'
    });
  }
};

// @desc    Lấy danh sách nhiệm vụ
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      type,
      assignedTo,
      assignedBy,
      overdue,
      search,
      sortBy = 'dueDate',
      sortOrder = 'asc'
    } = req.query;

    const skip = (page - 1) * limit;
    
    // Xây dựng filter
    const filter = { isArchived: false };
    
    if (status) {
      filter.status = status;
    }
    
    if (priority) {
      filter.priority = priority;
    }
    
    if (type) {
      filter.type = type;
    }
    
    if (assignedTo) {
      filter.assignedTo = assignedTo;
    }
    
    if (assignedBy) {
      filter.assignedBy = assignedBy;
    }
    
    if (overdue === 'true') {
      filter.dueDate = { $lt: new Date() };
      filter.status = { $ne: 'completed' };
    }
    
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { batchNumber: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Lọc theo quyền người dùng
    if (req.user.role === 'patient') {
      // Patient chỉ xem nhiệm vụ được giao cho mình
      filter.assignedTo = req.user._id;
    } else if (!['admin'].includes(req.user.role)) {
      // Các role khác xem nhiệm vụ được giao cho mình hoặc giao bởi mình
      filter.$or = [
        { assignedTo: req.user._id },
        { assignedBy: req.user._id }
      ];
    }

    // Sắp xếp
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tasks = await Task.find(filter)
      .populate('assignedTo', 'fullName email role avatar')
      .populate('assignedBy', 'fullName email role')
      .populate('relatedSupplyChain', 'drugBatchNumber status')
      .populate('relatedDrug', 'name batchNumber')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Task.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        tasks,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách nhiệm vụ'
    });
  }
};

// @desc    Lấy thông tin nhiệm vụ chi tiết
// @route   GET /api/tasks/:id
// @access  Private
const getTask = async (req, res) => {
  try {
    let { id } = req.params;
    
    // Chuẩn hóa ID
    id = normalizeObjectId(id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID nhiệm vụ không hợp lệ'
      });
    }

    const task = await Task.findById(id)
      .populate('assignedTo', 'fullName email role avatar organizationInfo')
      .populate('assignedBy', 'fullName email role organizationInfo')
      .populate('relatedSupplyChain', 'drugBatchNumber status currentLocation')
      .populate('relatedDrug', 'name batchNumber manufacturer')
      .populate('updates.updatedBy', 'fullName email role')
      .populate('updates.attachments.uploadedBy', 'fullName email')
      .populate('attachments.uploadedBy', 'fullName email')
      .populate('qualityRating.ratedBy', 'fullName email role')
      .populate('notifications.sentTo', 'fullName email');

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Nhiệm vụ không tồn tại'
      });
    }

    // Kiểm tra quyền xem
    const canView = checkTaskViewPermission(req.user, task);
    if (!canView) {
      console.log('Permission check failed:', {
        userId: req.user._id,
        userRole: req.user.role,
        taskAssignedTo: task.assignedTo?._id || task.assignedTo,
        taskAssignedBy: task.assignedBy?._id || task.assignedBy,
        taskId: task._id
      });
      return res.status(403).json({
        success: false,
        message: 'Không có quyền xem nhiệm vụ này'
      });
    }

    // Log để debug updates
    console.log('🔍 Task updates:', {
      taskId: task._id,
      updatesCount: task.updates?.length || 0,
      updates: task.updates?.map(u => ({
        status: u.status,
        progress: u.progress,
        updateText: u.updateText?.substring(0, 50),
        updatedBy: u.updatedBy?._id || u.updatedBy,
        updatedByPopulated: u.updatedBy?.fullName,
        updatedAt: u.updatedAt,
        isPublic: u.isPublic
      })) || []
    });

    // Đảm bảo task được serialize đúng cách (convert to plain object)
    const taskObj = task.toObject ? task.toObject() : task;

    res.status(200).json({
      success: true,
      data: {
        task: taskObj
      }
    });

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin nhiệm vụ'
    });
  }
};

// @desc    Cập nhật nhiệm vụ
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  try {
    let { id } = req.params;
    
    // Chuẩn hóa ID
    id = normalizeObjectId(id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID nhiệm vụ không hợp lệ'
      });
    }
    
    const updateData = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Nhiệm vụ không tồn tại'
      });
    }

    // Kiểm tra quyền cập nhật
    const canUpdate = checkTaskUpdatePermission(req.user, task);
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật nhiệm vụ này'
      });
    }

    // Lưu trạng thái cũ để so sánh
    const oldStatus = task.status;
    const oldProgress = task.progress;
    
    // Cập nhật nhiệm vụ
    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        task[key] = updateData[key];
      }
    });
    
    await task.save();

    // Tự động ghi lại lịch sử nếu có thay đổi status hoặc progress
    const statusChanged = updateData.status && updateData.status !== oldStatus;
    const progressChanged = updateData.progress !== undefined && updateData.progress !== oldProgress;
    
    if (statusChanged || progressChanged) {
      const updateText = [];
      if (statusChanged) {
        updateText.push(`Trạng thái thay đổi từ "${oldStatus}" sang "${updateData.status}"`);
      }
      if (progressChanged) {
        updateText.push(`Tiến độ thay đổi từ ${oldProgress}% sang ${updateData.progress}%`);
      }
      
      // Tạo update history entry
      const historyUpdate = {
        status: updateData.status || task.status,
        progress: updateData.progress !== undefined ? updateData.progress : task.progress,
        updateText: updateText.join('. ') || 'Cập nhật nhiệm vụ',
        updatedBy: req.user._id,
        isPublic: true
      };
      
      await task.addUpdate(historyUpdate);
      
      // Thông báo cho người giao nhiệm vụ (nếu khác người cập nhật)
      const assignedById = normalizeObjectId(task.assignedBy?._id || task.assignedBy);
      const userId = normalizeObjectId(req.user._id);
      if (assignedById && userId && assignedById !== userId) {
        await task.addNotification({
          type: 'update',
          message: `Nhiệm vụ "${task.title}" đã được cập nhật bởi ${req.user.fullName}`,
          sentTo: task.assignedBy
        });
      }
      
      // #region agent log
      // Auto-update trust score khi task hoàn thành
      if (statusChanged && updateData.status === 'completed' && task.assignedTo) {
        try {
          const assignedToId = normalizeObjectId(task.assignedTo?._id || task.assignedTo);
          if (assignedToId) {
            // Cập nhật điểm tín nhiệm không blocking (async)
            TrustScoreService.updateScoreOnTask(task._id).catch(error => {
              console.error('Error updating trust score on task completion:', error);
            });
            fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'taskController.js:updateTask',message:'TRUST_SCORE_UPDATE_TRIGGERED',data:{taskId:task._id.toString(),assignedTo:assignedToId,reason:'task_completed',timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
          }
        } catch (error) {
          console.error('Error triggering trust score update on task completion:', error);
          // Không throw error để không ảnh hưởng đến response
        }
      }
      // #endregion
    }

    // Populate để trả về thông tin đầy đủ
    await task.populate([
      { path: 'assignedTo', select: 'fullName email role' },
      { path: 'assignedBy', select: 'fullName email role' },
      { path: 'updates.updatedBy', select: 'fullName email role' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Cập nhật nhiệm vụ thành công',
      data: {
        task
      }
    });

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật nhiệm vụ'
    });
  }
};

// @desc    Thêm cập nhật tiến độ
// @route   POST /api/tasks/:id/updates
// @access  Private
const addTaskUpdate = async (req, res) => {
  try {
    let { id } = req.params;
    
    // Chuẩn hóa ID
    id = normalizeObjectId(id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID nhiệm vụ không hợp lệ'
      });
    }
    
    const { status, progress, updateText, attachments = [], isPublic = true } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Nhiệm vụ không tồn tại'
      });
    }

    // Kiểm tra quyền cập nhật
    const canUpdate = checkTaskUpdatePermission(req.user, task);
    if (!canUpdate) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền cập nhật nhiệm vụ này'
      });
    }

    // Tạo cập nhật mới
    const updateData = {
      status: status || task.status,
      progress: progress !== undefined ? progress : task.progress,
      updateText,
      updatedBy: req.user._id,
      attachments,
      isPublic
    };

    await task.addUpdate(updateData);

    // Thông báo cho người giao nhiệm vụ (nếu khác người cập nhật)
    if (task.assignedBy.toString() !== req.user._id.toString()) {
      await task.addNotification({
        type: 'update',
        message: `Nhiệm vụ "${task.title}" đã được cập nhật bởi ${req.user.fullName}`,
        sentTo: task.assignedBy
      });
    }

    // Populate để trả về thông tin đầy đủ
    await task.populate([
      { path: 'assignedTo', select: 'fullName email role' },
      { path: 'assignedBy', select: 'fullName email role' },
      { path: 'updates.updatedBy', select: 'fullName email role' }
    ]);

    res.status(200).json({
      success: true,
      message: 'Cập nhật tiến độ thành công',
      data: {
        task
      }
    });

  } catch (error) {
    console.error('Add task update error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật tiến độ'
    });
  }
};

// @desc    Đánh giá chất lượng nhiệm vụ
// @route   POST /api/tasks/:id/rate
// @access  Private
const rateTask = async (req, res) => {
  try {
    let { id } = req.params;
    
    // Chuẩn hóa ID
    id = normalizeObjectId(id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID nhiệm vụ không hợp lệ'
      });
    }
    
    const { rating, comment } = req.body;

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Nhiệm vụ không tồn tại'
      });
    }

    // Kiểm tra quyền đánh giá (người giao nhiệm vụ hoặc admin)
    const assignedById = normalizeObjectId(task.assignedBy?._id || task.assignedBy);
    const userId = normalizeObjectId(req.user._id);
    const canRate = (assignedById && userId && assignedById === userId) || req.user.role === 'admin';
    if (!canRate) {
      return res.status(403).json({
        success: false,
        message: 'Không có quyền đánh giá nhiệm vụ này'
      });
    }

    // Kiểm tra nhiệm vụ đã hoàn thành chưa
    if (task.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Chỉ có thể đánh giá nhiệm vụ đã hoàn thành'
      });
    }

    await task.rateQuality(rating, comment, req.user._id);

    res.status(200).json({
      success: true,
      message: 'Đánh giá chất lượng thành công',
      data: {
        task
      }
    });

  } catch (error) {
    console.error('Rate task error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đánh giá chất lượng'
    });
  }
};

// @desc    Xóa nhiệm vụ
// @route   DELETE /api/tasks/:id
// @access  Private (Admin only)
const deleteTask = async (req, res) => {
  try {
    let { id } = req.params;
    
    // Chuẩn hóa ID
    id = normalizeObjectId(id);
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'ID nhiệm vụ không hợp lệ'
      });
    }

    // Chỉ admin mới có quyền xóa
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Chỉ admin mới có quyền xóa nhiệm vụ'
      });
    }

    const task = await Task.findById(id);
    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Nhiệm vụ không tồn tại'
      });
    }

    await Task.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Xóa nhiệm vụ thành công'
    });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa nhiệm vụ'
    });
  }
};

// @desc    Lấy thống kê nhiệm vụ
// @route   GET /api/tasks/stats
// @access  Private
const getTaskStats = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let filter = { isArchived: false };
    
    // Lọc theo quyền người dùng
    if (userRole === 'patient') {
      filter.assignedTo = userId;
    } else if (!['admin'].includes(userRole)) {
      filter.$or = [
        { assignedTo: userId },
        { assignedBy: userId }
      ];
    }

    const stats = await Task.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] } },
          inProgress: { $sum: { $cond: [{ $eq: ['$status', 'in_progress'] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] } },
          overdue: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $lt: ['$dueDate', new Date()] },
                    { $ne: ['$status', 'completed'] }
                  ]
                },
                1,
                0
              ]
            }
          },
          avgProgress: { $avg: '$progress' },
          highPriority: { $sum: { $cond: [{ $eq: ['$priority', 'high'] }, 1, 0] } },
          urgent: { $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] } }
        }
      }
    ]);

    const result = stats[0] || {
      total: 0,
      pending: 0,
      inProgress: 0,
      completed: 0,
      cancelled: 0,
      overdue: 0,
      avgProgress: 0,
      highPriority: 0,
      urgent: 0
    };

    res.status(200).json({
      success: true,
      data: {
        stats: result
      }
    });

  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê nhiệm vụ'
    });
  }
};

// Helper functions
const checkTaskViewPermission = (user, task) => {
  // Admin xem được tất cả
  if (user.role === 'admin') return true;
  
  // Chuẩn hóa IDs để so sánh
  const userId = normalizeObjectId(user._id);
  const assignedToId = normalizeObjectId(task.assignedTo?._id || task.assignedTo);
  const assignedById = normalizeObjectId(task.assignedBy?._id || task.assignedBy);
  
  // Người được giao nhiệm vụ xem được
  if (assignedToId && userId && assignedToId === userId) return true;
  
  // Người giao nhiệm vụ xem được
  if (assignedById && userId && assignedById === userId) return true;
  
  return false;
};

const checkTaskUpdatePermission = (user, task) => {
  // Admin cập nhật được tất cả
  if (user.role === 'admin') return true;
  
  // Chuẩn hóa IDs để so sánh
  const userId = normalizeObjectId(user._id);
  const assignedToId = normalizeObjectId(task.assignedTo?._id || task.assignedTo);
  const assignedById = normalizeObjectId(task.assignedBy?._id || task.assignedBy);
  
  // Người được giao nhiệm vụ cập nhật được
  if (assignedToId && userId && assignedToId === userId) return true;
  
  // Người giao nhiệm vụ cập nhật được
  if (assignedById && userId && assignedById === userId) return true;
  
  return false;
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  addTaskUpdate,
  rateTask,
  deleteTask,
  getTaskStats
};
