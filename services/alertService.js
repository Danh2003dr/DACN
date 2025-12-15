const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const DigitalSignature = require('../models/DigitalSignature');
const Review = require('../models/Review');

/**
 * Alert Service - Phát hiện và quản lý cảnh báo thời gian thực
 */
class AlertService {
  /**
   * Lấy tất cả cảnh báo hiện tại
   */
  async getAllAlerts(userRole = null, userId = null) {
    try {
      // Sử dụng Promise.allSettled để không bị dừng khi một service lỗi
      const results = await Promise.allSettled([
        this.getDrugAlerts().catch(err => {
          console.error('Error getting drug alerts:', err);
          return [];
        }),
        this.getSupplyChainAlerts().catch(err => {
          console.error('Error getting supply chain alerts:', err);
          return [];
        }),
        this.getTaskAlerts(userId).catch(err => {
          console.error('Error getting task alerts:', err);
          return [];
        }),
        this.getComplianceAlerts().catch(err => {
          console.error('Error getting compliance alerts:', err);
          return [];
        }),
        this.getQualityAlerts().catch(err => {
          console.error('Error getting quality alerts:', err);
          return [];
        })
      ]);

      const drugAlerts = results[0].status === 'fulfilled' ? results[0].value : [];
      const supplyChainAlerts = results[1].status === 'fulfilled' ? results[1].value : [];
      const taskAlerts = results[2].status === 'fulfilled' ? results[2].value : [];
      const complianceAlerts = results[3].status === 'fulfilled' ? results[3].value : [];
      const qualityAlerts = results[4].status === 'fulfilled' ? results[4].value : [];

      const allAlerts = [
        ...drugAlerts,
        ...supplyChainAlerts,
        ...taskAlerts,
        ...complianceAlerts,
        ...qualityAlerts
      ];

      // Sắp xếp theo mức độ ưu tiên
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
      allAlerts.sort((a, b) => {
        return (priorityOrder[a.priority] || 4) - (priorityOrder[b.priority] || 4);
      });

      return {
        alerts: allAlerts,
        summary: {
          total: allAlerts.length,
          critical: allAlerts.filter(a => a.priority === 'critical').length,
          high: allAlerts.filter(a => a.priority === 'high').length,
          medium: allAlerts.filter(a => a.priority === 'medium').length,
          low: allAlerts.filter(a => a.priority === 'low').length
        },
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error getting all alerts:', error);
      // Trả về empty alerts thay vì throw error
      return {
        alerts: [],
        summary: {
          total: 0,
          critical: 0,
          high: 0,
          medium: 0,
          low: 0
        },
        timestamp: new Date()
      };
    }
  }

  /**
   * Cảnh báo về Thuốc
   */
  async getDrugAlerts() {
    const alerts = [];

    // Thuốc đã hết hạn
    const expiredDrugs = await Drug.find({
      expiryDate: { $lt: new Date() },
      isRecalled: false
    }).limit(10);

    expiredDrugs.forEach(drug => {
      alerts.push({
        id: `drug_expired_${drug._id}`,
        type: 'drug',
        category: 'expired',
        priority: 'critical',
        title: `Thuốc đã hết hạn: ${drug.name}`,
        message: `Lô ${drug.batchNumber} đã hết hạn từ ${new Date(drug.expiryDate).toLocaleDateString('vi-VN')}`,
        data: {
          drugId: drug._id,
          batchNumber: drug.batchNumber,
          expiryDate: drug.expiryDate
        },
        timestamp: new Date(),
        actionRequired: true
      });
    });

    // Thuốc sắp hết hạn (7 ngày)
    const nearExpiryDrugs = await Drug.find({
      expiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      },
      isRecalled: false
    }).limit(10);

    nearExpiryDrugs.forEach(drug => {
      const daysLeft = Math.ceil((drug.expiryDate - new Date()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `drug_near_expiry_${drug._id}`,
        type: 'drug',
        category: 'near_expiry',
        priority: 'high',
        title: `Thuốc sắp hết hạn: ${drug.name}`,
        message: `Lô ${drug.batchNumber} sẽ hết hạn trong ${daysLeft} ngày`,
        data: {
          drugId: drug._id,
          batchNumber: drug.batchNumber,
          expiryDate: drug.expiryDate,
          daysLeft
        },
        timestamp: new Date(),
        actionRequired: true
      });
    });

    // Thuốc bị thu hồi
    const recalledDrugs = await Drug.find({
      isRecalled: true
    }).sort({ updatedAt: -1 }).limit(5);

    recalledDrugs.forEach(drug => {
      alerts.push({
        id: `drug_recalled_${drug._id}`,
        type: 'drug',
        category: 'recalled',
        priority: 'critical',
        title: `Thuốc bị thu hồi: ${drug.name}`,
        message: `Lô ${drug.batchNumber} đã bị thu hồi`,
        data: {
          drugId: drug._id,
          batchNumber: drug.batchNumber
        },
        timestamp: drug.updatedAt || drug.createdAt,
        actionRequired: true
      });
    });

    // Thuốc chưa có blockchain
    const drugsWithoutBlockchain = await Drug.countDocuments({
      'blockchain.isOnBlockchain': { $ne: true },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (drugsWithoutBlockchain > 0) {
      alerts.push({
        id: 'drug_no_blockchain',
        type: 'drug',
        category: 'compliance',
        priority: 'medium',
        title: `${drugsWithoutBlockchain} lô thuốc chưa được ghi lên blockchain`,
        message: 'Cần kiểm tra và ghi các lô thuốc mới lên blockchain',
        data: {
          count: drugsWithoutBlockchain
        },
        timestamp: new Date(),
        actionRequired: true
      });
    }

    return alerts;
  }

  /**
   * Cảnh báo về Chuỗi cung ứng
   */
  async getSupplyChainAlerts() {
    const alerts = [];

    // Chuỗi cung ứng bị delay (đang xử lý quá 7 ngày)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const delayedChains = await SupplyChain.find({
      status: { $in: ['active'] },
      createdAt: { $lt: sevenDaysAgo }
    }).limit(10);

    delayedChains.forEach(chain => {
      const daysDelayed = Math.ceil((new Date() - chain.createdAt) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `supply_chain_delayed_${chain._id}`,
        type: 'supply_chain',
        category: 'delay',
        priority: 'high',
        title: `Chuỗi cung ứng bị trễ: ${chain.drugBatchNumber || chain._id}`,
        message: `Chuỗi cung ứng đã xử lý ${daysDelayed} ngày mà chưa hoàn thành`,
        data: {
          supplyChainId: chain._id,
          drugBatchNumber: chain.drugBatchNumber || chain._id.toString(),
          createdAt: chain.createdAt
        },
        timestamp: new Date(),
        actionRequired: true
      });
    });

    // Chuỗi cung ứng có vấn đề (bị thu hồi hoặc hết hạn)
    const chainsWithIssues = await SupplyChain.find({
      status: { $in: ['recalled', 'expired', 'suspended'] }
    }).limit(10);

    chainsWithIssues.forEach(chain => {
      alerts.push({
        id: `supply_chain_issue_${chain._id}`,
        type: 'supply_chain',
        category: 'issue',
        priority: 'high',
        title: `Chuỗi cung ứng có vấn đề: ${chain.drugBatchNumber}`,
        message: `Cần kiểm tra và xử lý vấn đề trong chuỗi cung ứng`,
        data: {
          supplyChainId: chain._id,
          drugBatchNumber: chain.drugBatchNumber
        },
        timestamp: chain.updatedAt || chain.createdAt,
        actionRequired: true
      });
    });

    return alerts;
  }

  /**
   * Cảnh báo về Nhiệm vụ
   */
  async getTaskAlerts(userId = null) {
    const alerts = [];
    const filter = userId ? { assignedTo: userId } : {};

    // Nhiệm vụ quá hạn
    const overdueTasks = await Task.find({
      ...filter,
      status: { $in: ['pending', 'in_progress'] },
      dueDate: { $lt: new Date() }
    }).limit(10);

    overdueTasks.forEach(task => {
      alerts.push({
        id: `task_overdue_${task._id}`,
        type: 'task',
        category: 'overdue',
        priority: 'high',
        title: `Nhiệm vụ quá hạn: ${task.title}`,
        message: `Nhiệm vụ đã quá hạn từ ${new Date(task.dueDate).toLocaleDateString('vi-VN')}`,
        data: {
          taskId: task._id,
          title: task.title,
          dueDate: task.dueDate
        },
        timestamp: new Date(),
        actionRequired: true
      });
    });

    // Nhiệm vụ sắp đến hạn (3 ngày)
    const upcomingTasks = await Task.find({
      ...filter,
      status: { $in: ['pending', 'in_progress'] },
      dueDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
      }
    }).limit(10);

    upcomingTasks.forEach(task => {
      const daysLeft = Math.ceil((task.dueDate - new Date()) / (1000 * 60 * 60 * 24));
      alerts.push({
        id: `task_upcoming_${task._id}`,
        type: 'task',
        category: 'upcoming',
        priority: 'medium',
        title: `Nhiệm vụ sắp đến hạn: ${task.title}`,
        message: `Nhiệm vụ sẽ đến hạn trong ${daysLeft} ngày`,
        data: {
          taskId: task._id,
          title: task.title,
          dueDate: task.dueDate,
          daysLeft
        },
        timestamp: new Date(),
        actionRequired: false
      });
    });

    return alerts;
  }

  /**
   * Cảnh báo về Tuân thủ
   */
  async getComplianceAlerts() {
    const alerts = [];

    // Chứng chỉ số hết hạn
    const expiredCertificates = await DigitalSignature.countDocuments({
      'certificate.certificateStatus': 'expired',
      status: 'active'
    });

    if (expiredCertificates > 0) {
      alerts.push({
        id: 'compliance_expired_certificates',
        type: 'compliance',
        category: 'certificate',
        priority: 'high',
        title: `${expiredCertificates} chứng chỉ số đã hết hạn`,
        message: 'Cần gia hạn hoặc thay thế chứng chỉ số',
        data: {
          count: expiredCertificates
        },
        timestamp: new Date(),
        actionRequired: true
      });
    }

    // Chữ ký số chưa có timestamp
    const signaturesWithoutTimestamp = await DigitalSignature.countDocuments({
      status: 'active',
      'timestamp.timestampStatus': { $ne: 'verified' }
    });

    if (signaturesWithoutTimestamp > 0) {
      alerts.push({
        id: 'compliance_no_timestamp',
        type: 'compliance',
        category: 'timestamp',
        priority: 'medium',
        title: `${signaturesWithoutTimestamp} chữ ký số chưa có timestamp`,
        message: 'Cần đóng dấu thời gian cho các chữ ký số quan trọng',
        data: {
          count: signaturesWithoutTimestamp
        },
        timestamp: new Date(),
        actionRequired: false
      });
    }

    return alerts;
  }

  /**
   * Cảnh báo về Chất lượng
   */
  async getQualityAlerts() {
    const alerts = [];

    // Thuốc không đạt kiểm định
    const failedTests = await Drug.countDocuments({
      'qualityTest.testResult': 'không đạt',
      'qualityTest.testDate': { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });

    if (failedTests > 0) {
      alerts.push({
        id: 'quality_failed_tests',
        type: 'quality',
        category: 'test_failure',
        priority: 'critical',
        title: `${failedTests} lô thuốc không đạt kiểm định`,
        message: 'Cần xem xét và xử lý các lô thuốc không đạt chất lượng',
        data: {
          count: failedTests
        },
        timestamp: new Date(),
        actionRequired: true
      });
    }

    // Đánh giá tiêu cực (1-2 sao)
    const negativeReviews = await Review.countDocuments({
      status: 'approved',
      overallRating: { $lte: 2 },
      createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
    });

    if (negativeReviews > 0) {
      alerts.push({
        id: 'quality_negative_reviews',
        type: 'quality',
        category: 'review',
        priority: 'medium',
        title: `${negativeReviews} đánh giá tiêu cực trong tuần qua`,
        message: 'Cần xem xét và cải thiện chất lượng sản phẩm/dịch vụ',
        data: {
          count: negativeReviews
        },
        timestamp: new Date(),
        actionRequired: false
      });
    }

    return alerts;
  }

  /**
   * Đánh dấu cảnh báo đã xem
   */
  async markAlertAsRead(alertId, userId) {
    // Có thể lưu vào database nếu cần
    return { success: true, alertId, userId, readAt: new Date() };
  }
}

module.exports = new AlertService();

