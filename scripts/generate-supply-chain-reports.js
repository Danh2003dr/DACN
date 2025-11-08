const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const User = require('../models/User');

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Tạo thư mục báo cáo
const ensureReportsDirectory = () => {
  const reportsDir = path.join(__dirname, '..', 'reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  return reportsDir;
};

// Báo cáo tổng quan chuỗi cung ứng
const generateOverviewReport = async (reportsDir) => {
  try {
    console.log('📊 Tạo báo cáo tổng quan chuỗi cung ứng...');

    const supplyChains = await SupplyChain.find()
      .populate('drugId', 'name batchNumber form manufacturerId')
      .populate('steps.actorId', 'fullName role organizationInfo')
      .populate('qualityChecks.checkedBy', 'fullName role');

    const drugs = await Drug.find().populate('manufacturerId', 'fullName organizationInfo');
    const users = await User.find();

    const report = {
      generatedAt: new Date(),
      summary: {
        totalSupplyChains: supplyChains.length,
        totalDrugs: drugs.length,
        totalUsers: users.length,
        totalSteps: supplyChains.reduce((sum, sc) => sum + sc.steps.length, 0),
        totalQualityChecks: supplyChains.reduce((sum, sc) => sum + sc.qualityChecks.length, 0)
      },
      statusDistribution: {
        active: supplyChains.filter(sc => sc.status === 'active').length,
        completed: supplyChains.filter(sc => sc.status === 'completed').length,
        recalled: supplyChains.filter(sc => sc.status === 'recalled').length,
        expired: supplyChains.filter(sc => sc.status === 'expired').length,
        suspended: supplyChains.filter(sc => sc.status === 'suspended').length
      },
      roleDistribution: {
        manufacturers: users.filter(u => u.role === 'manufacturer').length,
        distributors: users.filter(u => u.role === 'distributor').length,
        hospitals: users.filter(u => u.role === 'hospital').length,
        patients: users.filter(u => u.role === 'patient').length,
        admins: users.filter(u => u.role === 'admin').length
      },
      drugFormDistribution: {
        'cao khô': drugs.filter(d => d.form === 'cao khô').length,
        'cao đặc': drugs.filter(d => d.form === 'cao đặc').length,
        'viên nén': drugs.filter(d => d.form === 'viên nén').length,
        'viên nang': drugs.filter(d => d.form === 'viên nang').length,
        'siro': drugs.filter(d => d.form === 'siro').length,
        'dung dịch tiêm': drugs.filter(d => d.form === 'dung dịch tiêm').length,
        'kem': drugs.filter(d => d.form === 'kem').length,
        'gel': drugs.filter(d => d.form === 'gel').length,
        'thuốc mỡ': drugs.filter(d => d.form === 'thuốc mỡ').length,
        'khác': drugs.filter(d => d.form === 'khác').length
      },
      qualitySummary: {
        totalChecks: supplyChains.reduce((sum, sc) => sum + sc.qualityChecks.length, 0),
        passedChecks: supplyChains.reduce((sum, sc) => sum + sc.qualityChecks.filter(qc => qc.result === 'pass').length, 0),
        failedChecks: supplyChains.reduce((sum, sc) => sum + sc.qualityChecks.filter(qc => qc.result === 'fail').length, 0),
        warningChecks: supplyChains.reduce((sum, sc) => sum + sc.qualityChecks.filter(qc => qc.result === 'warning').length, 0)
      },
      blockchainIntegration: {
        totalOnBlockchain: drugs.filter(d => d.blockchain?.isOnBlockchain).length,
        totalTransactions: drugs.reduce((sum, d) => sum + (d.blockchain?.transactionHistory?.length || 0), 0),
        averageGasUsed: drugs.reduce((sum, d) => sum + (d.blockchain?.gasUsed || 0), 0) / drugs.length
      }
    };

    // Tính tỷ lệ thành công
    report.qualitySummary.successRate = report.qualitySummary.totalChecks > 0 
      ? Math.round((report.qualitySummary.passedChecks / report.qualitySummary.totalChecks) * 100)
      : 0;

    // Lưu báo cáo
    const reportPath = path.join(reportsDir, 'supply-chain-overview.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

    console.log(`✅ Báo cáo tổng quan đã được lưu tại: ${reportPath}`);
    return report;
  } catch (error) {
    console.error('❌ Lỗi khi tạo báo cáo tổng quan:', error);
    throw error;
  }
};

// Báo cáo chi tiết từng chuỗi cung ứng
const generateDetailedReport = async (reportsDir) => {
  try {
    console.log('📋 Tạo báo cáo chi tiết từng chuỗi cung ứng...');

    const supplyChains = await SupplyChain.find()
      .populate('drugId', 'name batchNumber form manufacturerId productionDate expiryDate')
      .populate('steps.actorId', 'fullName role organizationInfo')
      .populate('qualityChecks.checkedBy', 'fullName role')
      .populate('accessLog.accessedBy', 'fullName role');

    const detailedReport = {
      generatedAt: new Date(),
      totalSupplyChains: supplyChains.length,
      supplyChains: supplyChains.map(supplyChain => ({
        id: supplyChain._id,
        drugBatchNumber: supplyChain.drugBatchNumber,
        drugName: supplyChain.drugId?.name || 'Unknown',
        drugForm: supplyChain.drugId?.form || 'Unknown',
        manufacturer: supplyChain.drugId?.manufacturerId?.fullName || 'Unknown',
        status: supplyChain.status,
        totalSteps: supplyChain.steps.length,
        currentLocation: {
          actor: supplyChain.currentLocation?.actorName || 'Unknown',
          role: supplyChain.currentLocation?.actorRole || 'Unknown',
          address: supplyChain.currentLocation?.address || 'Unknown',
          lastUpdated: supplyChain.currentLocation?.lastUpdated
        },
        steps: supplyChain.steps.map(step => ({
          stepType: step.stepType,
          action: step.action,
          actor: step.actorName,
          role: step.actorRole,
          timestamp: step.timestamp,
          location: step.location?.address || 'Unknown',
          conditions: step.conditions,
          metadata: step.metadata,
          isVerified: step.isVerified,
          verificationMethod: step.verificationMethod
        })),
        qualityChecks: supplyChain.qualityChecks.map(qc => ({
          type: qc.checkType,
          result: qc.result,
          value: qc.value,
          checkedBy: qc.checkedBy?.fullName || 'Unknown',
          checkedAt: qc.checkedAt,
          notes: qc.notes
        })),
        recall: supplyChain.recall?.isRecalled ? {
          isRecalled: supplyChain.recall.isRecalled,
          reason: supplyChain.recall.recallReason,
          date: supplyChain.recall.recallDate,
          action: supplyChain.recall.recallAction,
          affectedUnits: supplyChain.recall.affectedUnits
        } : null,
        blockchain: {
          isOnBlockchain: supplyChain.blockchain?.isOnBlockchain || false,
          contractAddress: supplyChain.blockchain?.contractAddress,
          blockchainId: supplyChain.blockchain?.blockchainId,
          lastUpdate: supplyChain.blockchain?.lastBlockchainUpdate
        },
        accessLog: supplyChain.accessLog.map(log => ({
          accessedBy: log.accessedBy?.fullName || 'Unknown',
          accessType: log.accessType,
          timestamp: log.timestamp,
          ipAddress: log.ipAddress,
          userAgent: log.userAgent
        }))
      }))
    };

    // Lưu báo cáo
    const reportPath = path.join(reportsDir, 'supply-chain-detailed.json');
    fs.writeFileSync(reportPath, JSON.stringify(detailedReport, null, 2));

    console.log(`✅ Báo cáo chi tiết đã được lưu tại: ${reportPath}`);
    return detailedReport;
  } catch (error) {
    console.error('❌ Lỗi khi tạo báo cáo chi tiết:', error);
    throw error;
  }
};

// Báo cáo thống kê theo thời gian
const generateTimeSeriesReport = async (reportsDir) => {
  try {
    console.log('📈 Tạo báo cáo thống kê theo thời gian...');

    const supplyChains = await SupplyChain.find()
      .populate('drugId', 'name batchNumber form')
      .populate('steps.actorId', 'fullName role');

    // Nhóm theo ngày
    const dailyStats = {};
    const monthlyStats = {};

    supplyChains.forEach(supplyChain => {
      const createdAt = new Date(supplyChain.createdAt);
      const dayKey = createdAt.toISOString().split('T')[0];
      const monthKey = `${createdAt.getFullYear()}-${String(createdAt.getMonth() + 1).padStart(2, '0')}`;

      // Thống kê theo ngày
      if (!dailyStats[dayKey]) {
        dailyStats[dayKey] = {
          date: dayKey,
          totalCreated: 0,
          totalSteps: 0,
          totalQualityChecks: 0,
          statusDistribution: {}
        };
      }
      dailyStats[dayKey].totalCreated++;
      dailyStats[dayKey].totalSteps += supplyChain.steps.length;
      dailyStats[dayKey].totalQualityChecks += supplyChain.qualityChecks.length;
      dailyStats[dayKey].statusDistribution[supplyChain.status] = 
        (dailyStats[dayKey].statusDistribution[supplyChain.status] || 0) + 1;

      // Thống kê theo tháng
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = {
          month: monthKey,
          totalCreated: 0,
          totalSteps: 0,
          totalQualityChecks: 0,
          statusDistribution: {}
        };
      }
      monthlyStats[monthKey].totalCreated++;
      monthlyStats[monthKey].totalSteps += supplyChain.steps.length;
      monthlyStats[monthKey].totalQualityChecks += supplyChain.qualityChecks.length;
      monthlyStats[monthKey].statusDistribution[supplyChain.status] = 
        (monthlyStats[monthKey].statusDistribution[supplyChain.status] || 0) + 1;
    });

    const timeSeriesReport = {
      generatedAt: new Date(),
      dailyStats: Object.values(dailyStats).sort((a, b) => new Date(a.date) - new Date(b.date)),
      monthlyStats: Object.values(monthlyStats).sort((a, b) => a.month.localeCompare(b.month)),
      summary: {
        totalDays: Object.keys(dailyStats).length,
        totalMonths: Object.keys(monthlyStats).length,
        averageDailyCreated: Object.values(dailyStats).reduce((sum, day) => sum + day.totalCreated, 0) / Object.keys(dailyStats).length,
        averageMonthlyCreated: Object.values(monthlyStats).reduce((sum, month) => sum + month.totalCreated, 0) / Object.keys(monthlyStats).length
      }
    };

    // Lưu báo cáo
    const reportPath = path.join(reportsDir, 'supply-chain-timeseries.json');
    fs.writeFileSync(reportPath, JSON.stringify(timeSeriesReport, null, 2));

    console.log(`✅ Báo cáo thống kê theo thời gian đã được lưu tại: ${reportPath}`);
    return timeSeriesReport;
  } catch (error) {
    console.error('❌ Lỗi khi tạo báo cáo thống kê theo thời gian:', error);
    throw error;
  }
};

// Báo cáo chất lượng
const generateQualityReport = async (reportsDir) => {
  try {
    console.log('🔬 Tạo báo cáo chất lượng...');

    const supplyChains = await SupplyChain.find()
      .populate('drugId', 'name batchNumber form')
      .populate('qualityChecks.checkedBy', 'fullName role');

    const qualityReport = {
      generatedAt: new Date(),
      totalSupplyChains: supplyChains.length,
      qualitySummary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warningChecks: 0,
        successRate: 0
      },
      checkTypes: {
        temperature: { total: 0, passed: 0, failed: 0, warning: 0 },
        humidity: { total: 0, passed: 0, failed: 0, warning: 0 },
        integrity: { total: 0, passed: 0, failed: 0, warning: 0 },
        expiry: { total: 0, passed: 0, failed: 0, warning: 0 },
        custom: { total: 0, passed: 0, failed: 0, warning: 0 },
        light: { total: 0, passed: 0, failed: 0, warning: 0 },
        microbiology: { total: 0, passed: 0, failed: 0, warning: 0 }
      },
      supplyChains: supplyChains.map(supplyChain => ({
        drugBatchNumber: supplyChain.drugBatchNumber,
        drugName: supplyChain.drugId?.name || 'Unknown',
        drugForm: supplyChain.drugId?.form || 'Unknown',
        totalChecks: supplyChain.qualityChecks.length,
        passedChecks: supplyChain.qualityChecks.filter(qc => qc.result === 'pass').length,
        failedChecks: supplyChain.qualityChecks.filter(qc => qc.result === 'fail').length,
        warningChecks: supplyChain.qualityChecks.filter(qc => qc.result === 'warning').length,
        successRate: supplyChain.qualityChecks.length > 0 
          ? Math.round((supplyChain.qualityChecks.filter(qc => qc.result === 'pass').length / supplyChain.qualityChecks.length) * 100)
          : 0,
        checks: supplyChain.qualityChecks.map(qc => ({
          type: qc.checkType,
          result: qc.result,
          value: qc.value,
          checkedBy: qc.checkedBy?.fullName || 'Unknown',
          checkedAt: qc.checkedAt,
          notes: qc.notes
        }))
      }))
    };

    // Tính tổng kết
    supplyChains.forEach(supplyChain => {
      qualityReport.qualitySummary.totalChecks += supplyChain.qualityChecks.length;
      qualityReport.qualitySummary.passedChecks += supplyChain.qualityChecks.filter(qc => qc.result === 'pass').length;
      qualityReport.qualitySummary.failedChecks += supplyChain.qualityChecks.filter(qc => qc.result === 'fail').length;
      qualityReport.qualitySummary.warningChecks += supplyChain.qualityChecks.filter(qc => qc.result === 'warning').length;

      supplyChain.qualityChecks.forEach(qc => {
        if (qualityReport.checkTypes[qc.checkType]) {
          qualityReport.checkTypes[qc.checkType].total++;
          if (qc.result === 'pass') qualityReport.checkTypes[qc.checkType].passed++;
          if (qc.result === 'fail') qualityReport.checkTypes[qc.checkType].failed++;
          if (qc.result === 'warning') qualityReport.checkTypes[qc.checkType].warning++;
        }
      });
    });

    // Tính tỷ lệ thành công
    qualityReport.qualitySummary.successRate = qualityReport.qualitySummary.totalChecks > 0 
      ? Math.round((qualityReport.qualitySummary.passedChecks / qualityReport.qualitySummary.totalChecks) * 100)
      : 0;

    // Lưu báo cáo
    const reportPath = path.join(reportsDir, 'supply-chain-quality.json');
    fs.writeFileSync(reportPath, JSON.stringify(qualityReport, null, 2));

    console.log(`✅ Báo cáo chất lượng đã được lưu tại: ${reportPath}`);
    return qualityReport;
  } catch (error) {
    console.error('❌ Lỗi khi tạo báo cáo chất lượng:', error);
    throw error;
  }
};

// Báo cáo blockchain
const generateBlockchainReport = async (reportsDir) => {
  try {
    console.log('⛓️ Tạo báo cáo blockchain...');

    const drugs = await Drug.find().populate('manufacturerId', 'fullName organizationInfo');
    const supplyChains = await SupplyChain.find().populate('drugId', 'name batchNumber');

    const blockchainReport = {
      generatedAt: new Date(),
      totalDrugs: drugs.length,
      totalSupplyChains: supplyChains.length,
      blockchainSummary: {
        totalOnBlockchain: drugs.filter(d => d.blockchain?.isOnBlockchain).length,
        totalTransactions: drugs.reduce((sum, d) => sum + (d.blockchain?.transactionHistory?.length || 0), 0),
        totalGasUsed: drugs.reduce((sum, d) => sum + (d.blockchain?.gasUsed || 0), 0),
        averageGasUsed: 0,
        totalBlocks: drugs.reduce((sum, d) => sum + (d.blockchain?.blockNumber || 0), 0),
        averageBlockNumber: 0
      },
      drugs: drugs.filter(d => d.blockchain?.isOnBlockchain).map(drug => ({
        drugId: drug.drugId,
        name: drug.name,
        batchNumber: drug.batchNumber,
        manufacturer: drug.manufacturerId?.fullName || 'Unknown',
        blockchain: {
          blockchainId: drug.blockchain.blockchainId,
          contractAddress: drug.blockchain.contractAddress,
          transactionHash: drug.blockchain.transactionHash,
          blockNumber: drug.blockchain.blockNumber,
          gasUsed: drug.blockchain.gasUsed,
          digitalSignature: drug.blockchain.digitalSignature,
          dataHash: drug.blockchain.dataHash,
          blockchainStatus: drug.blockchain.blockchainStatus,
          lastUpdated: drug.blockchain.lastUpdated
        },
        transactionHistory: drug.blockchain.transactionHistory || []
      })),
      supplyChains: supplyChains.filter(sc => sc.blockchain?.isOnBlockchain).map(supplyChain => ({
        drugBatchNumber: supplyChain.drugBatchNumber,
        drugName: supplyChain.drugId?.name || 'Unknown',
        blockchain: {
          contractAddress: supplyChain.blockchain.contractAddress,
          blockchainId: supplyChain.blockchain.blockchainId,
          isOnBlockchain: supplyChain.blockchain.isOnBlockchain,
          lastUpdate: supplyChain.blockchain.lastBlockchainUpdate
        }
      }))
    };

    // Tính trung bình
    const blockchainDrugs = drugs.filter(d => d.blockchain?.isOnBlockchain);
    if (blockchainDrugs.length > 0) {
      blockchainReport.blockchainSummary.averageGasUsed = 
        blockchainDrugs.reduce((sum, d) => sum + (d.blockchain?.gasUsed || 0), 0) / blockchainDrugs.length;
      blockchainReport.blockchainSummary.averageBlockNumber = 
        blockchainDrugs.reduce((sum, d) => sum + (d.blockchain?.blockNumber || 0), 0) / blockchainDrugs.length;
    }

    // Lưu báo cáo
    const reportPath = path.join(reportsDir, 'supply-chain-blockchain.json');
    fs.writeFileSync(reportPath, JSON.stringify(blockchainReport, null, 2));

    console.log(`✅ Báo cáo blockchain đã được lưu tại: ${reportPath}`);
    return blockchainReport;
  } catch (error) {
    console.error('❌ Lỗi khi tạo báo cáo blockchain:', error);
    throw error;
  }
};

// Tạo báo cáo tổng hợp
const generateMasterReport = async (reportsDir, overviewReport, detailedReport, timeSeriesReport, qualityReport, blockchainReport) => {
  try {
    console.log('📋 Tạo báo cáo tổng hợp...');

    const masterReport = {
      generatedAt: new Date(),
      title: 'Báo cáo tổng hợp hệ thống quản lý chuỗi cung ứng thuốc',
      summary: overviewReport.summary,
      statusDistribution: overviewReport.statusDistribution,
      roleDistribution: overviewReport.roleDistribution,
      drugFormDistribution: overviewReport.drugFormDistribution,
      qualitySummary: qualityReport.qualitySummary,
      blockchainSummary: blockchainReport.blockchainSummary,
      timeSeriesSummary: timeSeriesReport.summary,
      recommendations: [
        'Tăng cường kiểm tra chất lượng tại các điểm quan trọng',
        'Cải thiện hệ thống blockchain để tăng tính minh bạch',
        'Tối ưu hóa quy trình vận chuyển và bảo quản',
        'Tăng cường đào tạo cho nhân viên các tổ chức tham gia',
        'Phát triển hệ thống cảnh báo sớm cho thuốc sắp hết hạn'
      ],
      nextSteps: [
        'Triển khai hệ thống real-time monitoring',
        'Tích hợp với các hệ thống quản lý khác',
        'Phát triển ứng dụng di động cho bệnh nhân',
        'Tăng cường bảo mật và xác thực',
        'Mở rộng sang các loại thuốc khác'
      ]
    };

    // Lưu báo cáo
    const reportPath = path.join(reportsDir, 'supply-chain-master-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(masterReport, null, 2));

    console.log(`✅ Báo cáo tổng hợp đã được lưu tại: ${reportPath}`);
    return masterReport;
  } catch (error) {
    console.error('❌ Lỗi khi tạo báo cáo tổng hợp:', error);
    throw error;
  }
};

// Chạy script chính
const main = async () => {
  try {
    await connectDB();
    
    console.log('🚀 BẮT ĐẦU TẠO BÁO CÁO VÀ THỐNG KÊ...');
    console.log('=====================================');
    
    // Tạo thư mục báo cáo
    const reportsDir = ensureReportsDirectory();
    console.log(`📁 Thư mục báo cáo: ${reportsDir}`);

    // Tạo các báo cáo
    const overviewReport = await generateOverviewReport(reportsDir);
    const detailedReport = await generateDetailedReport(reportsDir);
    const timeSeriesReport = await generateTimeSeriesReport(reportsDir);
    const qualityReport = await generateQualityReport(reportsDir);
    const blockchainReport = await generateBlockchainReport(reportsDir);
    const masterReport = await generateMasterReport(reportsDir, overviewReport, detailedReport, timeSeriesReport, qualityReport, blockchainReport);

    console.log('\n🎉 HOÀN THÀNH TẠO BÁO CÁO VÀ THỐNG KÊ!');
    console.log('=======================================');
    console.log(`📊 Tổng số chuỗi cung ứng: ${overviewReport.summary.totalSupplyChains}`);
    console.log(`📦 Tổng số thuốc: ${overviewReport.summary.totalDrugs}`);
    console.log(`👥 Tổng số người dùng: ${overviewReport.summary.totalUsers}`);
    console.log(`🔍 Tổng số bước: ${overviewReport.summary.totalSteps}`);
    console.log(`✅ Tổng số kiểm tra chất lượng: ${overviewReport.summary.totalQualityChecks}`);
    console.log(`📈 Tỷ lệ thành công chất lượng: ${qualityReport.qualitySummary.successRate}%`);
    console.log(`⛓️ Tích hợp blockchain: ${blockchainReport.blockchainSummary.totalOnBlockchain}/${overviewReport.summary.totalDrugs}`);
    
    console.log('\n📁 CÁC BÁO CÁO ĐÃ TẠO:');
    console.log('=======================');
    console.log(`📊 Báo cáo tổng quan: ${reportsDir}/supply-chain-overview.json`);
    console.log(`📋 Báo cáo chi tiết: ${reportsDir}/supply-chain-detailed.json`);
    console.log(`📈 Báo cáo thống kê theo thời gian: ${reportsDir}/supply-chain-timeseries.json`);
    console.log(`🔬 Báo cáo chất lượng: ${reportsDir}/supply-chain-quality.json`);
    console.log(`⛓️ Báo cáo blockchain: ${reportsDir}/supply-chain-blockchain.json`);
    console.log(`📋 Báo cáo tổng hợp: ${reportsDir}/supply-chain-master-report.json`);

    console.log('\n🔗 TRUY CẬP HỆ THỐNG:');
    console.log('=====================');
    console.log('- Quản lý chuỗi cung ứng: http://localhost:3000/supply-chain');
    console.log('- Báo cáo thống kê: http://localhost:3000/reports');
    console.log('- Xác minh QR code: http://localhost:3000/verify');
    console.log('- Quản lý thuốc: http://localhost:3000/drugs');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình tạo báo cáo:', error);
  } finally {
    process.exit(0);
  }
};

main();
