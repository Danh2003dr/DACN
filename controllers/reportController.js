const Drug = require('../models/Drug');
const User = require('../models/User');
const SupplyChain = require('../models/SupplyChain');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const Review = require('../models/Review');
const mongoose = require('mongoose');

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

// @desc    Lấy thống kê chi tiết theo module
// @route   GET /api/reports/module/:module
// @access  Private
const getModuleStats = async (req, res) => {
  try {
    const { module } = req.params;
    const { startDate, endDate } = req.query;

    // Tạo filter theo thời gian
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    let stats = {};

    switch (module) {
      case 'drugs':
        stats = await getDrugStats(dateFilter);
        break;
      case 'supply-chain':
        stats = await getSupplyChainStats(dateFilter);
        break;
      case 'tasks':
        stats = await getTaskStats(dateFilter);
        break;
      case 'notifications':
        stats = await getNotificationStats(dateFilter);
        break;
      case 'reviews':
        stats = await getReviewStats(dateFilter);
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Module không hợp lệ.'
        });
    }

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
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

module.exports = {
  getSystemOverview,
  getModuleStats,
  getDistributionJourneyReport,
  getSuspiciousDrugsReport,
  getQualityAssessmentReport
};
