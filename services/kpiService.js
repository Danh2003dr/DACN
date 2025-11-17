const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const Task = require('../models/Task');
const Review = require('../models/Review');
const Notification = require('../models/Notification');
const DigitalSignature = require('../models/DigitalSignature');

/**
 * KPI Service - Tính toán các chỉ số hiệu suất quan trọng
 */
class KPIService {
  /**
   * Tính toán KPI tổng hợp
   */
  async calculateOverallKPIs(dateRange = null) {
    try {
      const dateFilter = this.buildDateFilter(dateRange);
      
      const [
        drugKPIs,
        supplyChainKPIs,
        qualityKPIs,
        efficiencyKPIs,
        complianceKPIs
      ] = await Promise.all([
        this.calculateDrugKPIs(dateFilter),
        this.calculateSupplyChainKPIs(dateFilter),
        this.calculateQualityKPIs(dateFilter),
        this.calculateEfficiencyKPIs(dateFilter),
        this.calculateComplianceKPIs(dateFilter)
      ]);

      return {
        drug: drugKPIs,
        supplyChain: supplyChainKPIs,
        quality: qualityKPIs,
        efficiency: efficiencyKPIs,
        compliance: complianceKPIs,
        timestamp: new Date(),
        dateRange: dateRange || 'all'
      };
    } catch (error) {
      console.error('Error calculating overall KPIs:', error);
      throw error;
    }
  }

  /**
   * KPI về Thuốc
   */
  async calculateDrugKPIs(dateFilter) {
    const [
      totalDrugs,
      validDrugs,
      recalledDrugs,
      expiredDrugs,
      nearExpiryDrugs,
      drugsWithBlockchain,
      drugsWithSignature,
      avgTimeToExpiry
    ] = await Promise.all([
      Drug.countDocuments(dateFilter),
      Drug.countDocuments({ ...dateFilter, isRecalled: false, expiryDate: { $gte: new Date() } }),
      Drug.countDocuments({ ...dateFilter, isRecalled: true }),
      Drug.countDocuments({ ...dateFilter, expiryDate: { $lt: new Date() } }),
      Drug.countDocuments({
        ...dateFilter,
        expiryDate: {
          $gte: new Date(),
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        }
      }),
      Drug.countDocuments({ ...dateFilter, 'blockchain.isOnBlockchain': true }),
      Drug.countDocuments({ ...dateFilter, 'blockchain.digitalSignature': { $exists: true, $ne: null } }),
      Drug.aggregate([
        { $match: { ...dateFilter, expiryDate: { $gte: new Date() } } },
        {
          $project: {
            daysUntilExpiry: {
              $divide: [
                { $subtract: ['$expiryDate', new Date()] },
                1000 * 60 * 60 * 24
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgDays: { $avg: '$daysUntilExpiry' }
          }
        }
      ])
    ]);

    const validityRate = totalDrugs > 0 ? (validDrugs / totalDrugs) * 100 : 0;
    const recallRate = totalDrugs > 0 ? (recalledDrugs / totalDrugs) * 100 : 0;
    const blockchainCoverage = totalDrugs > 0 ? (drugsWithBlockchain / totalDrugs) * 100 : 0;
    const signatureCoverage = totalDrugs > 0 ? (drugsWithSignature / totalDrugs) * 100 : 0;
    const avgExpiryDays = avgTimeToExpiry.length > 0 ? Math.round(avgTimeToExpiry[0].avgDays) : 0;

    return {
      total: totalDrugs,
      valid: validDrugs,
      recalled: recalledDrugs,
      expired: expiredDrugs,
      nearExpiry: nearExpiryDrugs,
      withBlockchain: drugsWithBlockchain,
      withSignature: drugsWithSignature,
      validityRate: Math.round(validityRate * 100) / 100,
      recallRate: Math.round(recallRate * 100) / 100,
      blockchainCoverage: Math.round(blockchainCoverage * 100) / 100,
      signatureCoverage: Math.round(signatureCoverage * 100) / 100,
      avgDaysUntilExpiry: avgExpiryDays,
      status: this.getKPIGrade(validityRate, recallRate)
    };
  }

  /**
   * KPI về Chuỗi cung ứng
   */
  async calculateSupplyChainKPIs(dateFilter) {
    const [
      totalChains,
      completedChains,
      avgStepsPerChain,
      avgTimeToComplete,
      chainsWithIssues
    ] = await Promise.all([
      SupplyChain.countDocuments(dateFilter),
      SupplyChain.countDocuments({ ...dateFilter, status: 'completed' }),
      SupplyChain.aggregate([
        { $match: dateFilter },
        {
          $project: {
            stepCount: { $size: { $ifNull: ['$steps', []] } }
          }
        },
        {
          $group: {
            _id: null,
            avgSteps: { $avg: '$stepCount' }
          }
        }
      ]),
      SupplyChain.aggregate([
        {
          $match: {
            ...dateFilter,
            status: 'completed',
            completedAt: { $exists: true }
          }
        },
        {
          $project: {
            duration: {
              $divide: [
                { $subtract: ['$completedAt', '$createdAt'] },
                1000 * 60 * 60 * 24 // days
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgDays: { $avg: '$duration' }
          }
        }
      ]),
      SupplyChain.aggregate([
        { $match: dateFilter },
        {
          $project: {
            hasIssue: {
              $or: [
                { $eq: ['$status', 'delayed'] },
                { $eq: ['$status', 'issue'] },
                {
                  $anyElementTrue: {
                    $map: {
                      input: { $ifNull: ['$steps', []] },
                      as: 'step',
                      in: { $eq: ['$$step.status', 'failed'] }
                    }
                  }
                }
              ]
            }
          }
        },
        {
          $match: {
            hasIssue: true
          }
        },
        {
          $count: 'count'
        }
      ])
    ]);

    const completionRate = totalChains > 0 ? (completedChains / totalChains) * 100 : 0;
    const avgSteps = avgStepsPerChain.length > 0 ? Math.round(avgStepsPerChain[0].avgSteps * 10) / 10 : 0;
    const avgDays = avgTimeToComplete.length > 0 ? Math.round(avgTimeToComplete[0].avgDays * 10) / 10 : 0;
    const chainsWithIssuesCount = chainsWithIssues.length > 0 ? chainsWithIssues[0].count : 0;
    const issueRate = totalChains > 0 ? (chainsWithIssuesCount / totalChains) * 100 : 0;

    return {
      total: totalChains,
      completed: completedChains,
      withIssues: chainsWithIssuesCount,
      completionRate: Math.round(completionRate * 100) / 100,
      avgStepsPerChain: avgSteps,
      avgDaysToComplete: avgDays,
      issueRate: Math.round(issueRate * 100) / 100,
      status: this.getKPIGrade(completionRate, 100 - issueRate)
    };
  }

  /**
   * KPI về Chất lượng
   */
  async calculateQualityKPIs(dateFilter) {
    const [
      totalReviews,
      avgRating,
      verifiedReviews,
      qualityTestPassRate,
      complaintsCount
    ] = await Promise.all([
      Review.countDocuments({ ...dateFilter, status: 'approved' }),
      Review.aggregate([
        { $match: { ...dateFilter, status: 'approved' } },
        {
          $group: {
            _id: null,
            avgRating: { $avg: '$overallRating' }
          }
        }
      ]),
      Review.countDocuments({ ...dateFilter, status: 'approved', isVerified: true }),
      Drug.aggregate([
        { $match: dateFilter },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            passed: {
              $sum: {
                $cond: [{ $eq: ['$qualityTest.testResult', 'đạt'] }, 1, 0]
              }
            }
          }
        }
      ]),
      Review.countDocuments({
        ...dateFilter,
        status: 'approved',
        reviewType: 'complaint'
      })
    ]);

    const avgRatingValue = avgRating.length > 0 ? Math.round(avgRating[0].avgRating * 10) / 10 : 0;
    const verificationRate = totalReviews > 0 ? (verifiedReviews / totalReviews) * 100 : 0;
    const testPassRate = qualityTestPassRate.length > 0 && qualityTestPassRate[0].total > 0
      ? (qualityTestPassRate[0].passed / qualityTestPassRate[0].total) * 100
      : 0;
    const complaintRate = totalReviews > 0 ? (complaintsCount / totalReviews) * 100 : 0;

    return {
      totalReviews,
      avgRating: avgRatingValue,
      verifiedReviews,
      verificationRate: Math.round(verificationRate * 100) / 100,
      qualityTestPassRate: Math.round(testPassRate * 100) / 100,
      complaintsCount,
      complaintRate: Math.round(complaintRate * 100) / 100,
      status: this.getKPIGrade(avgRatingValue * 20, testPassRate) // Convert 5-star to percentage
    };
  }

  /**
   * KPI về Hiệu quả
   */
  async calculateEfficiencyKPIs(dateFilter) {
    const [
      totalTasks,
      completedTasks,
      onTimeTasks,
      avgTaskCompletionTime,
      taskEfficiency
    ] = await Promise.all([
      Task.countDocuments(dateFilter),
      Task.countDocuments({ ...dateFilter, status: 'completed' }),
      Task.aggregate([
        {
          $match: {
            ...dateFilter,
            status: 'completed',
            completedAt: { $exists: true },
            dueDate: { $exists: true }
          }
        },
        {
          $project: {
            isOnTime: {
              $lte: ['$completedAt', '$dueDate']
            }
          }
        },
        {
          $match: {
            isOnTime: true
          }
        },
        {
          $count: 'count'
        }
      ]),
      Task.aggregate([
        {
          $match: {
            ...dateFilter,
            status: 'completed',
            completedAt: { $exists: true }
          }
        },
        {
          $project: {
            duration: {
              $divide: [
                { $subtract: ['$completedAt', '$createdAt'] },
                1000 * 60 * 60 // hours
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgHours: { $avg: '$duration' }
          }
        }
      ]),
      Task.aggregate([
        { $match: { ...dateFilter, status: 'completed' } },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            withRating: {
              $sum: {
                $cond: [{ $ifNull: ['$completionRating', false] }, 1, 0]
              }
            },
            avgRating: {
              $avg: {
                $cond: [
                  { $ifNull: ['$completionRating', false] },
                  '$completionRating',
                  null
                ]
              }
            }
          }
        }
      ])
    ]);

    const onTimeCount = onTimeTasks.length > 0 ? onTimeTasks[0].count : 0;
    const completionRate = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;
    const onTimeRate = completedTasks > 0 ? (onTimeCount / completedTasks) * 100 : 0;
    const avgHours = avgTaskCompletionTime.length > 0
      ? Math.round(avgTaskCompletionTime[0].avgHours * 10) / 10
      : 0;
    const efficiencyRating = taskEfficiency.length > 0 && taskEfficiency[0].avgRating
      ? Math.round(taskEfficiency[0].avgRating * 20) // Convert 5-star to percentage
      : 0;

    return {
      totalTasks,
      completedTasks,
      onTimeTasks: onTimeCount,
      completionRate: Math.round(completionRate * 100) / 100,
      onTimeRate: Math.round(onTimeRate * 100) / 100,
      avgCompletionHours: avgHours,
      efficiencyRating,
      status: this.getKPIGrade(completionRate, onTimeRate)
    };
  }

  /**
   * KPI về Tuân thủ (Compliance)
   */
  async calculateComplianceKPIs(dateFilter) {
    const [
      totalSignatures,
      validSignatures,
      timestampedSignatures,
      expiredCertificates,
      notificationsSent,
      notificationsRead
    ] = await Promise.all([
      DigitalSignature.countDocuments(dateFilter),
      DigitalSignature.countDocuments({ ...dateFilter, status: 'active' }),
      DigitalSignature.countDocuments({
        ...dateFilter,
        'timestamp.timestampStatus': 'verified'
      }),
      DigitalSignature.countDocuments({
        ...dateFilter,
        'certificate.certificateStatus': 'expired'
      }),
      Notification.countDocuments({ ...dateFilter, status: 'published' }),
      Notification.aggregate([
        { $match: { ...dateFilter, status: 'published' } },
        { $unwind: '$recipients' },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            read: {
              $sum: {
                $cond: [{ $eq: ['$recipients.isRead', true] }, 1, 0]
              }
            }
          }
        }
      ])
    ]);

    const signatureValidityRate = totalSignatures > 0
      ? (validSignatures / totalSignatures) * 100
      : 0;
    const timestampRate = totalSignatures > 0
      ? (timestampedSignatures / totalSignatures) * 100
      : 0;
    const notificationReadRate = notificationsRead.length > 0 && notificationsRead[0].total > 0
      ? (notificationsRead[0].read / notificationsRead[0].total) * 100
      : 0;

    return {
      totalSignatures,
      validSignatures,
      timestampedSignatures,
      expiredCertificates,
      signatureValidityRate: Math.round(signatureValidityRate * 100) / 100,
      timestampRate: Math.round(timestampRate * 100) / 100,
      notificationReadRate: Math.round(notificationReadRate * 100) / 100,
      status: this.getKPIGrade(signatureValidityRate, timestampRate)
    };
  }

  /**
   * Lấy KPI theo thời gian (time series) để vẽ biểu đồ
   */
  async getKPITimeSeries(kpiType, days = 30) {
    try {
      const endDate = new Date();
      const startDate = new Date(endDate);
      startDate.setDate(startDate.getDate() - days);

      const intervals = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate);
        date.setDate(date.getDate() + i);
        intervals.push({
          date: date.toISOString().split('T')[0],
          start: new Date(date.setHours(0, 0, 0, 0)),
          end: new Date(date.setHours(23, 59, 59, 999))
        });
      }

      const kpiData = await Promise.all(
        intervals.map(async (interval) => {
          const dateRange = {
            startDate: interval.start,
            endDate: interval.end
          };
          const kpis = await this.calculateOverallKPIs(dateRange);
          return {
            date: interval.date,
            value: this.extractKPIValue(kpis, kpiType)
          };
        })
      );

      return kpiData;
    } catch (error) {
      console.error('Error getting KPI time series:', error);
      throw error;
    }
  }

  /**
   * Trích xuất giá trị KPI cụ thể
   */
  extractKPIValue(kpis, kpiType) {
    const [category, metric] = kpiType.split('.');
    if (kpis[category] && kpis[category][metric]) {
      return kpis[category][metric];
    }
    return 0;
  }

  /**
   * Đánh giá KPI (A, B, C, D)
   */
  getKPIGrade(value1, value2 = null) {
    const avgValue = value2 !== null ? (value1 + value2) / 2 : value1;
    
    if (avgValue >= 90) return { grade: 'A', label: 'Xuất sắc', color: 'green' };
    if (avgValue >= 75) return { grade: 'B', label: 'Tốt', color: 'blue' };
    if (avgValue >= 60) return { grade: 'C', label: 'Đạt', color: 'yellow' };
    return { grade: 'D', label: 'Cần cải thiện', color: 'red' };
  }

  /**
   * Xây dựng date filter
   */
  buildDateFilter(dateRange) {
    if (!dateRange || (!dateRange.startDate && !dateRange.endDate)) {
      return {};
    }

    const filter = {};
    if (dateRange.startDate || dateRange.endDate) {
      filter.createdAt = {};
      if (dateRange.startDate) {
        filter.createdAt.$gte = new Date(dateRange.startDate);
      }
      if (dateRange.endDate) {
        filter.createdAt.$lte = new Date(dateRange.endDate);
      }
    }
    return filter;
  }
}

module.exports = new KPIService();

