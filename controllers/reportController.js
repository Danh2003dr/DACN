const Drug = require('../models/Drug');
const User = require('../models/User');
const SupplyChain = require('../models/SupplyChain');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

const MODULE_LABELS = {
  drugs: 'Thuốc',
  'supply-chain': 'Chuỗi cung ứng',
  tasks: 'Nhiệm vụ',
  notifications: 'Thông báo',
  reviews: 'Đánh giá'
};

const buildDateFilter = (startDate, endDate) => {
  if (startDate && endDate) {
    return {
      createdAt: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
  }
  return {};
};

// @desc    Lấy thống kê tổng quan hệ thống
// @route   GET /api/reports/overview
// @access  Private (Admin only)
const getSystemOverview = async (req, res) => {
  try {
    const [
      totalDrugs,
      activeDrugs,
      recalledDrugs,
      expiredDrugs,
      totalUsers,
      activeUsers,
      totalTasks,
      completedTasks,
      totalNotifications,
      unreadNotifications,
      totalReviews,
      avgRating
    ] = await Promise.all([
      Drug.countDocuments(),
      Drug.countDocuments({ status: 'active' }),
      Drug.countDocuments({ isRecalled: true }),
      Drug.countDocuments({ expiryDate: { $lt: new Date() } }),
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Task.countDocuments(),
      Task.countDocuments({ status: 'completed' }),
      Notification.countDocuments(),
      Notification.countDocuments({ 'recipients.isRead': false }),
      Review.countDocuments({ status: 'approved' }),
      Review.aggregate([
        { $match: { status: 'approved' } },
        { $group: { _id: null, avgRating: { $avg: '$overallRating' } } }
      ])
    ]);

    // Thống kê theo role
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    // Thống kê thuốc theo nhà sản xuất
    const drugsByManufacturer = await Drug.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'manufacturerId',
          foreignField: '_id',
          as: 'manufacturer'
        }
      },
      {
        $group: {
          _id: '$manufacturerId',
          manufacturerName: { $first: '$manufacturer.fullName' },
          count: { $sum: 1 }
        }
      },
      { $limit: 10 }
    ]);

    // Thống kê nhiệm vụ theo trạng thái
    const tasksByStatus = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    // Thống kê đánh giá theo điểm số
    const reviewsByRating = await Review.aggregate([
      {
        $match: { status: 'approved' }
      },
      {
        $group: {
          _id: '$overallRating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          drugs: {
            total: totalDrugs,
            active: activeDrugs,
            recalled: recalledDrugs,
            expired: expiredDrugs
          },
          users: {
            total: totalUsers,
            active: activeUsers
          },
          tasks: {
            total: totalTasks,
            completed: completedTasks,
            completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
          },
          notifications: {
            total: totalNotifications,
            unread: unreadNotifications
          },
          reviews: {
            total: totalReviews,
            averageRating: avgRating.length > 0 ? Math.round(avgRating[0].avgRating * 10) / 10 : 0
          }
        },
        charts: {
          usersByRole,
          drugsByManufacturer,
          tasksByStatus,
          reviewsByRating
        }
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê tổng quan.',
      error: error.message
    });
  }
};

// @desc    Lấy dữ liệu dashboard thực tế
// @route   GET /api/reports/dashboard
// @access  Private
const getDashboardSummary = async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);

    const [
      totalDrugs,
      activeUsers,
      completedTasks,
      pendingTasks,
      alertCount,
      todayScanResult,
      recentDrugs,
      recentTasks,
      recentScans,
      recentAlerts
    ] = await Promise.all([
      Drug.countDocuments(),
      User.countDocuments({ isActive: true }),
      Task.countDocuments({ status: 'completed' }),
      Task.countDocuments({ status: { $in: ['pending', 'in_progress'] } }),
      Notification.countDocuments({
        status: 'published',
        priority: { $in: ['high', 'urgent'] },
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      }),
      SupplyChain.aggregate([
        { $unwind: '$accessLog' },
        {
          $match: {
            'accessLog.accessType': 'scan',
            'accessLog.timestamp': { $gte: startOfToday }
          }
        },
        { $count: 'count' }
      ]),
      Drug.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('createdBy', 'fullName role')
        .populate('manufacturerId', 'fullName organizationInfo'),
      Task.find()
        .sort({ updatedAt: -1 })
        .limit(5)
        .populate('assignedTo', 'fullName role')
        .populate('assignedBy', 'fullName role'),
      SupplyChain.aggregate([
        { $unwind: '$accessLog' },
        { $match: { 'accessLog.accessType': 'scan' } },
        { $sort: { 'accessLog.timestamp': -1 } },
        { $limit: 5 },
        {
          $lookup: {
            from: 'users',
            localField: 'accessLog.accessedBy',
            foreignField: '_id',
            as: 'accessUser'
          }
        },
        {
          $unwind: {
            path: '$accessUser',
            preserveNullAndEmptyArrays: true
          }
        },
        {
          $project: {
            supplyChainId: '$_id',
            drugBatchNumber: '$drugBatchNumber',
            accessLog: '$accessLog',
            accessUser: {
              fullName: '$accessUser.fullName',
              role: '$accessUser.role'
            }
          }
        }
      ]),
      Notification.find({
        status: 'published',
        priority: { $in: ['high', 'urgent'] },
        $or: [
          { expiresAt: null },
          { expiresAt: { $gt: now } }
        ]
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .populate('sender', 'fullName role')
    ]);

    const todayScans = todayScanResult[0]?.count || 0;

    const statusLabels = {
      pending: 'được tạo',
      in_progress: 'đang xử lý',
      completed: 'đã hoàn thành',
      cancelled: 'đã hủy',
      on_hold: 'bị tạm dừng'
    };

    const activities = [];

    recentDrugs.forEach((drug) => {
      activities.push({
        type: 'drug_created',
        title: `Lô thuốc ${drug.batchNumber} đã được tạo`,
        actor: drug.manufacturerId?.fullName || drug.createdBy?.fullName || 'Hệ thống',
        role: drug.manufacturerId ? 'manufacturer' : drug.createdBy?.role,
        timestamp: drug.createdAt,
        metadata: {
          drugId: drug.drugId,
          batchNumber: drug.batchNumber
        }
      });
    });

    recentTasks.forEach((task) => {
      activities.push({
        type: task.status === 'completed' ? 'task_completed' : 'task_updated',
        title: `Nhiệm vụ "${task.title}" ${statusLabels[task.status] || 'được cập nhật'}`,
        actor: task.assignedTo?.fullName || task.assignedBy?.fullName || 'Không xác định',
        role: task.assignedTo?.role || task.assignedBy?.role,
        timestamp: task.updatedAt,
        metadata: {
          taskId: task._id,
          status: task.status
        }
      });
    });

    recentScans.forEach((scan) => {
      activities.push({
        type: 'qr_scan',
        title: `Quét QR cho lô ${scan.drugBatchNumber}`,
        actor: scan.accessUser?.fullName || 'Người dùng ẩn danh',
        role: scan.accessUser?.role || 'patient',
        timestamp: scan.accessLog?.timestamp,
        metadata: {
          supplyChainId: scan.supplyChainId,
          accessType: scan.accessLog?.accessType
        }
      });
    });

    recentAlerts.forEach((alert) => {
      activities.push({
        type: 'alert',
        title: alert.title,
        actor: alert.sender?.fullName || 'Hệ thống',
        role: alert.sender?.role,
        timestamp: alert.createdAt,
        metadata: {
          notificationId: alert._id,
          priority: alert.priority
        }
      });
    });

    const recentActivities = activities
      .filter((item) => item.timestamp)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 8);

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalDrugs,
          activeUsers,
          completedTasks,
          pendingTasks,
          alerts: alertCount,
          todayScans
        },
        recentActivities
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy dữ liệu dashboard.',
      error: error.message
    });
  }
};

// @desc    Lấy thống kê chi tiết theo module
// @route   GET /api/reports/module/:module
// @access  Private
const getModuleStats = async (req, res) => {
  try {
    const { module } = req.params;
    const { startDate, endDate } = req.query;

    const dateFilter = buildDateFilter(startDate, endDate);
    const stats = await resolveModuleStats(module, dateFilter);

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    if (error.message === 'MODULE_INVALID') {
      return res.status(400).json({
        success: false,
        message: 'Module không hợp lệ.'
      });
    }
    res.status(500).json({
      success: false,
      message: `Lỗi server khi lấy thống kê ${req.params.module}.`,
      error: error.message
    });
  }
};

// Helper functions for module stats
const getDrugStats = async (dateFilter) => {
  const [
    totalDrugs,
    drugsByStatus,
    drugsByMonth,
    recalledDrugs,
    expiredDrugs,
    nearExpiryDrugs
  ] = await Promise.all([
    Drug.countDocuments(dateFilter),
    Drug.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Drug.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]),
    Drug.countDocuments({ ...dateFilter, isRecalled: true }),
    Drug.countDocuments({ ...dateFilter, expiryDate: { $lt: new Date() } }),
    Drug.countDocuments({
      ...dateFilter,
      expiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 ngày
      }
    })
  ]);

  return {
    total: totalDrugs,
    byStatus: drugsByStatus,
    byMonth: drugsByMonth,
    recalled: recalledDrugs,
    expired: expiredDrugs,
    nearExpiry: nearExpiryDrugs
  };
};

const getSupplyChainStats = async (dateFilter) => {
  const [
    totalSteps,
    stepsByStatus,
    stepsByAction,
    stepsByMonth
  ] = await Promise.all([
    SupplyChain.aggregate([
      { $match: dateFilter },
      { $project: { stepCount: { $size: '$steps' } } },
      { $group: { _id: null, total: { $sum: '$stepCount' } } }
    ]),
    SupplyChain.aggregate([
      { $match: dateFilter },
      { $unwind: '$steps' },
      { $group: { _id: '$steps.status', count: { $sum: 1 } } }
    ]),
    SupplyChain.aggregate([
      { $match: dateFilter },
      { $unwind: '$steps' },
      { $group: { _id: '$steps.action', count: { $sum: 1 } } }
    ]),
    SupplyChain.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ])
  ]);

  return {
    totalSteps: totalSteps.length > 0 ? totalSteps[0].total : 0,
    byStatus: stepsByStatus,
    byAction: stepsByAction,
    byMonth: stepsByMonth
  };
};

const getTaskStats = async (dateFilter) => {
  const [
    totalTasks,
    tasksByStatus,
    tasksByPriority,
    tasksByMonth,
    completionRate
  ] = await Promise.all([
    Task.countDocuments(dateFilter),
    Task.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]),
    Task.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),
    Task.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]),
    Task.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          }
        }
      }
    ])
  ]);

  const completion = completionRate.length > 0 ? completionRate[0] : { total: 0, completed: 0 };
  const rate = completion.total > 0 ? Math.round((completion.completed / completion.total) * 100) : 0;

  return {
    total: totalTasks,
    byStatus: tasksByStatus,
    byPriority: tasksByPriority,
    byMonth: tasksByMonth,
    completionRate: rate
  };
};

const getNotificationStats = async (dateFilter) => {
  const [
    totalNotifications,
    notificationsByType,
    notificationsByPriority,
    notificationsByMonth
  ] = await Promise.all([
    Notification.countDocuments(dateFilter),
    Notification.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$type', count: { $sum: 1 } } }
    ]),
    Notification.aggregate([
      { $match: dateFilter },
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]),
    Notification.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ])
  ]);

  return {
    total: totalNotifications,
    byType: notificationsByType,
    byPriority: notificationsByPriority,
    byMonth: notificationsByMonth
  };
};

const getReviewStats = async (dateFilter) => {
  const [
    totalReviews,
    reviewsByRating,
    reviewsByType,
    reviewsByMonth,
    avgRating
  ] = await Promise.all([
    Review.countDocuments({ ...dateFilter, status: 'approved' }),
    Review.aggregate([
      { $match: { ...dateFilter, status: 'approved' } },
      { $group: { _id: '$overallRating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } }
    ]),
    Review.aggregate([
      { $match: { ...dateFilter, status: 'approved' } },
      { $group: { _id: '$reviewType', count: { $sum: 1 } } }
    ]),
    Review.aggregate([
      { $match: { ...dateFilter, status: 'approved' } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
      { $limit: 12 }
    ]),
    Review.aggregate([
      { $match: { ...dateFilter, status: 'approved' } },
      { $group: { _id: null, avgRating: { $avg: '$overallRating' } } }
    ])
  ]);

  return {
    total: totalReviews,
    byRating: reviewsByRating,
    byType: reviewsByType,
    byMonth: reviewsByMonth,
    averageRating: avgRating.length > 0 ? Math.round(avgRating[0].avgRating * 10) / 10 : 0
  };
};

const resolveModuleStats = async (module, dateFilter) => {
  switch (module) {
    case 'drugs':
      return getDrugStats(dateFilter);
    case 'supply-chain':
      return getSupplyChainStats(dateFilter);
    case 'tasks':
      return getTaskStats(dateFilter);
    case 'notifications':
      return getNotificationStats(dateFilter);
    case 'reviews':
      return getReviewStats(dateFilter);
    default: {
      const err = new Error('MODULE_INVALID');
      throw err;
    }
  }
};

// @desc    Lấy báo cáo hành trình phân phối
// @route   GET /api/reports/distribution-journey
// @access  Private
const getDistributionJourneyReport = async (req, res) => {
  try {
    const { drugId, startDate, endDate } = req.query;

    let filter = {};
    if (drugId) filter.drugId = drugId;
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const supplyChains = await SupplyChain.find(filter)
      .populate('drugId', 'name batchNumber')
      .populate('steps.actor', 'fullName role')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: supplyChains
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy báo cáo hành trình phân phối.',
      error: error.message
    });
  }
};

// @desc    Lấy báo cáo thuốc nghi vấn
// @route   GET /api/reports/suspicious-drugs
// @access  Private
const getSuspiciousDrugsReport = async (req, res) => {
  try {
    const suspiciousDrugs = await Drug.find({
      $or: [
        { isRecalled: true },
        { expiryDate: { $lt: new Date() } },
        { 'qualityTest.testResult': 'không đạt' }
      ]
    })
      .populate('manufacturerId', 'fullName organizationInfo')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: suspiciousDrugs
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy báo cáo thuốc nghi vấn.',
      error: error.message
    });
  }
};

// @desc    Lấy báo cáo đánh giá chất lượng
// @route   GET /api/reports/quality-assessment
// @access  Private
const getQualityAssessmentReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let filter = { status: 'approved' };
    if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const reviews = await Review.find(filter)
      .populate('reviewer', 'fullName role')
      .populate('targetId')
      .sort({ createdAt: -1 });

    // Thống kê theo tiêu chí
    const criteriaStats = await Review.aggregate([
      { $match: filter },
      {
        $project: {
          criteriaRatings: 1,
          overallRating: 1
        }
      },
      {
        $group: {
          _id: null,
          avgOverall: { $avg: '$overallRating' },
          avgDrugQuality: { $avg: '$criteriaRatings.drugQuality' },
          avgEffectiveness: { $avg: '$criteriaRatings.effectiveness' },
          avgSideEffects: { $avg: '$criteriaRatings.sideEffects' },
          avgPackaging: { $avg: '$criteriaRatings.packaging' }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: {
        reviews,
        criteriaStats: criteriaStats.length > 0 ? criteriaStats[0] : null
      }
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy báo cáo đánh giá chất lượng.',
      error: error.message
    });
  }
};

const exportReportExcel = async (req, res) => {
  try {
    const { module = 'drugs', startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    const stats = await resolveModuleStats(module, dateFilter);
    const moduleLabel = MODULE_LABELS[module] || module;

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Report');

    const titleRow = sheet.addRow([`Báo cáo ${moduleLabel}`]);
    titleRow.font = { bold: true, size: 16 };
    sheet.addRow([`Khoảng thời gian`, formatRangeLabel(startDate, endDate)]);
    sheet.addRow([`Thời gian xuất`, formatDateTime(new Date())]);
    sheet.addRow([]);

    const summaryRows = buildSummaryRows(stats);
    if (summaryRows.length > 0) {
      writeExcelSummarySection(sheet, 'Tổng quan', summaryRows);
    }

    const sections = buildArraySections(stats);
    sections.forEach(section => {
      writeExcelTableSection(sheet, section.title, section.columns, section.rows);
    });

    const filename = `${module}-report-${Date.now()}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    if (error.message === 'MODULE_INVALID') {
      return res.status(400).json({
        success: false,
        message: 'Module không hợp lệ.'
      });
    }
    console.error('Export Excel error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất báo cáo Excel.'
    });
  }
};

const exportReportPdf = async (req, res) => {
  try {
    const { module = 'drugs', startDate, endDate } = req.query;
    const dateFilter = buildDateFilter(startDate, endDate);
    const stats = await resolveModuleStats(module, dateFilter);
    const moduleLabel = MODULE_LABELS[module] || module;

    const filename = `${module}-report-${Date.now()}.pdf`;
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text(`Báo cáo ${moduleLabel}`);
    doc.moveDown(0.5);
    doc.fontSize(11).text(`Khoảng thời gian: ${formatRangeLabel(startDate, endDate)}`);
    doc.text(`Thời gian xuất: ${formatDateTime(new Date())}`);
    doc.moveDown();

    const summaryRows = buildSummaryRows(stats);
    if (summaryRows.length > 0) {
      writePdfSummarySection(doc, 'Tổng quan', summaryRows);
    }

    const sections = buildArraySections(stats);
    sections.forEach(section => {
      writePdfTableSection(doc, section.title, section.columns, section.rows);
    });

    doc.end();
  } catch (error) {
    if (error.message === 'MODULE_INVALID') {
      return res.status(400).json({
        success: false,
        message: 'Module không hợp lệ.'
      });
    }
    console.error('Export PDF error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất báo cáo PDF.'
    });
  }
};

const humanizeKey = (key) => {
  if (!key) return '';
  return key
    .toString()
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatCellValue = (value) => {
  if (value == null) return '';
  if (typeof value === 'object') {
    if (value.year && value.month && Object.keys(value).length <= 2) {
      return `${value.month}/${value.year}`;
    }
    return JSON.stringify(value);
  }
  return value;
};

const buildSummaryRows = (stats) => {
  const rows = [];
  Object.entries(stats || {}).forEach(([key, value]) => {
    if (value == null) return;
    if (Array.isArray(value)) return;
    if (typeof value === 'object') return;
    rows.push([humanizeKey(key), value]);
  });
  return rows;
};

const buildArraySections = (stats) => {
  const sections = [];
  Object.entries(stats || {}).forEach(([key, value]) => {
    if (!Array.isArray(value) || value.length === 0) return;
    const columns = Array.from(new Set(value.flatMap((row) => Object.keys(row))));
    sections.push({
      title: humanizeKey(key),
      columns,
      rows: value
    });
  });
  return sections;
};

const writeExcelSummarySection = (sheet, title, rows) => {
  sheet.addRow([]);
  const header = sheet.addRow([title]);
  header.font = { bold: true };
  rows.forEach(([label, value]) => {
    sheet.addRow([label, value]);
  });
};

const writeExcelTableSection = (sheet, title, columns, rows) => {
  sheet.addRow([]);
  const header = sheet.addRow([title]);
  header.font = { bold: true };
  sheet.addRow(columns.map((col) => humanizeKey(col)));
  rows.forEach((row) => {
    sheet.addRow(columns.map((col) => formatCellValue(row[col])));
  });
};

const writePdfSummarySection = (doc, title, rows) => {
  doc.font('Helvetica-Bold').fontSize(13).text(title);
  doc.moveDown(0.3);
  rows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').text(`${label}: `, { continued: true });
    doc.font('Helvetica').text(String(value));
  });
  doc.moveDown();
};

const writePdfTableSection = (doc, title, columns, rows) => {
  doc.font('Helvetica-Bold').fontSize(13).text(title);
  doc.moveDown(0.2);
  doc.font('Helvetica').fontSize(11);
  rows.forEach((row) => {
    const line = columns
      .map((col) => `${humanizeKey(col)}: ${formatCellValue(row[col])}`)
      .join(' | ');
    doc.text(line);
  });
  doc.moveDown();
};

const formatRangeLabel = (startDate, endDate) => {
  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  return 'Toàn bộ dữ liệu';
};

const formatDate = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('vi-VN');
};

const formatDateTime = (value) => {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('vi-VN');
};

const kpiService = require('../services/kpiService');
const alertService = require('../services/alertService');

// @desc    Lấy KPI tổng hợp
// @route   GET /api/reports/kpi
// @access  Private
const getKPIs = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dateRange = (startDate || endDate) ? { startDate, endDate } : null;
    
    const kpis = await kpiService.calculateOverallKPIs(dateRange);
    
    res.status(200).json({
      success: true,
      data: kpis
    });
  } catch (error) {
    console.error('Error getting KPIs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy KPI.',
      error: error.message
    });
  }
};

// @desc    Lấy KPI time series cho biểu đồ
// @route   GET /api/reports/kpi/timeseries
// @access  Private
const getKPITimeSeries = async (req, res) => {
  try {
    const { kpiType = 'drug.validityRate', days = 30 } = req.query;
    
    const timeSeries = await kpiService.getKPITimeSeries(kpiType, parseInt(days));
    
    res.status(200).json({
      success: true,
      data: {
        kpiType,
        days: parseInt(days),
        timeSeries
      }
    });
  } catch (error) {
    console.error('Error getting KPI time series:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy KPI time series.',
      error: error.message
    });
  }
};

// @desc    Lấy cảnh báo thời gian thực
// @route   GET /api/reports/alerts
// @access  Private
const getAlerts = async (req, res) => {
  try {
    const userRole = req.user?.role;
    const userId = req.user?.id;
    
    const alerts = await alertService.getAllAlerts(userRole, userId);
    
    res.status(200).json({
      success: true,
      data: alerts
    });
  } catch (error) {
    console.error('Error getting alerts:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy cảnh báo.',
      error: error.message
    });
  }
};

// @desc    Đánh dấu cảnh báo đã xem
// @route   POST /api/reports/alerts/:alertId/read
// @access  Private
const markAlertAsRead = async (req, res) => {
  try {
    const { alertId } = req.params;
    const userId = req.user?.id;
    
    const result = await alertService.markAlertAsRead(alertId, userId);
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error marking alert as read:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi đánh dấu cảnh báo.',
      error: error.message
    });
  }
};

// @desc    Xuất báo cáo động với tùy chọn
// @route   POST /api/reports/export/custom
// @access  Private
const exportCustomReport = async (req, res) => {
  try {
    const {
      module = 'drugs',
      format = 'excel',
      startDate,
      endDate,
      columns = [],
      filters = {},
      groupBy = [],
      sortBy = [],
      template = 'default'
    } = req.body;

    const dateFilter = buildDateFilter(startDate, endDate);
    const stats = await resolveModuleStats(module, dateFilter);
    const moduleLabel = MODULE_LABELS[module] || module;

    // Áp dụng filters bổ sung
    let filteredData = stats;
    if (Object.keys(filters).length > 0) {
      // Logic filter dữ liệu
      // Tùy thuộc vào module và filters
    }

    // Áp dụng groupBy
    if (groupBy.length > 0) {
      // Logic group dữ liệu
    }

    // Áp dụng sortBy
    if (sortBy.length > 0) {
      // Logic sort dữ liệu
    }

    if (format === 'excel') {
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Report');

      // Header với template
      const titleRow = sheet.addRow([`Báo cáo ${moduleLabel} - ${template}`]);
      titleRow.font = { bold: true, size: 16 };
      sheet.addRow([`Khoảng thời gian`, formatRangeLabel(startDate, endDate)]);
      sheet.addRow([`Thời gian xuất`, formatDateTime(new Date())]);
      sheet.addRow([]);

      // Chỉ xuất các cột được chọn
      const selectedColumns = columns.length > 0 ? columns : Object.keys(stats);
      const summaryRows = buildSummaryRowsWithColumns(stats, selectedColumns);
      if (summaryRows.length > 0) {
        writeExcelSummarySection(sheet, 'Tổng quan', summaryRows);
      }

      const sections = buildArraySectionsWithColumns(stats, selectedColumns);
      sections.forEach(section => {
        writeExcelTableSection(sheet, section.title, section.columns, section.rows);
      });

      const filename = `${module}-custom-report-${Date.now()}.xlsx`;
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      await workbook.xlsx.write(res);
      res.end();
    } else if (format === 'pdf') {
      const filename = `${module}-custom-report-${Date.now()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);

      const doc = new PDFDocument({ margin: 40 });
      doc.pipe(res);

      doc.fontSize(18).text(`Báo cáo ${moduleLabel} - ${template}`);
      doc.moveDown(0.5);
      doc.fontSize(11).text(`Khoảng thời gian: ${formatRangeLabel(startDate, endDate)}`);
      doc.text(`Thời gian xuất: ${formatDateTime(new Date())}`);
      doc.moveDown();

      const selectedColumns = columns.length > 0 ? columns : Object.keys(stats);
      const summaryRows = buildSummaryRowsWithColumns(stats, selectedColumns);
      if (summaryRows.length > 0) {
        writePdfSummarySection(doc, 'Tổng quan', summaryRows);
      }

      const sections = buildArraySectionsWithColumns(stats, selectedColumns);
      sections.forEach(section => {
        writePdfTableSection(doc, section.title, section.columns, section.rows);
      });

      doc.end();
    } else if (format === 'csv') {
      // CSV export
      const csvRows = [];
      csvRows.push(['Báo cáo', moduleLabel]);
      csvRows.push(['Khoảng thời gian', formatRangeLabel(startDate, endDate)]);
      csvRows.push(['Thời gian xuất', formatDateTime(new Date())]);
      csvRows.push([]);

      const selectedColumns = columns.length > 0 ? columns : Object.keys(stats);
      const summaryRows = buildSummaryRowsWithColumns(stats, selectedColumns);
      summaryRows.forEach(([label, value]) => {
        csvRows.push([label, value]);
      });

      const csvContent = csvRows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
      const filename = `${module}-custom-report-${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send(csvContent);
    } else {
      return res.status(400).json({
        success: false,
        message: 'Định dạng không được hỗ trợ. Chọn excel, pdf hoặc csv.'
      });
    }
  } catch (error) {
    console.error('Export custom report error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xuất báo cáo tùy chỉnh.',
      error: error.message
    });
  }
};

// Helper: Build summary rows với selected columns (override existing function)
const buildSummaryRowsWithColumns = (stats, selectedColumns = null) => {
  const rows = [];
  const keys = selectedColumns || Object.keys(stats || {});
  
  keys.forEach((key) => {
    const value = stats[key];
    if (value == null) return;
    if (Array.isArray(value)) return;
    if (typeof value === 'object') return;
    rows.push([humanizeKey(key), value]);
  });
  return rows;
};

// Helper: Build array sections với selected columns (override existing function)
const buildArraySectionsWithColumns = (stats, selectedColumns = null) => {
  const sections = [];
  const keys = selectedColumns || Object.keys(stats || {});
  
  keys.forEach((key) => {
    const value = stats[key];
    if (!Array.isArray(value) || value.length === 0) return;
    const columns = Array.from(new Set(value.flatMap((row) => Object.keys(row))));
    sections.push({
      title: humanizeKey(key),
      columns,
      rows: value
    });
  });
  return sections;
};

module.exports = {
  getSystemOverview,
  getDashboardSummary,
  getModuleStats,
  getDistributionJourneyReport,
  getSuspiciousDrugsReport,
  getQualityAssessmentReport,
  exportReportExcel,
  exportReportPdf,
  getKPIs,
  getKPITimeSeries,
  getAlerts,
  markAlertAsRead,
  exportCustomReport
};
