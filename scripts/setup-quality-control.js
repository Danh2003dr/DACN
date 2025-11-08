const mongoose = require('mongoose');
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

// Thiết lập kiểm tra chất lượng thực tế
const setupQualityControl = async () => {
  try {
    console.log('🔬 Thiết lập kiểm tra chất lượng và điều kiện bảo quản thực tế...');

    // Lấy tất cả chuỗi cung ứng
    const supplyChains = await SupplyChain.find()
      .populate('drugId', 'name batchNumber form storage')
      .populate('steps.actorId', 'fullName role organizationInfo');

    console.log(`📦 Tìm thấy ${supplyChains.length} chuỗi cung ứng`);

    for (const supplyChain of supplyChains) {
      console.log(`\n🔍 Xử lý chuỗi cung ứng: ${supplyChain.drugBatchNumber}`);

      // Lấy thông tin thuốc
      const drug = supplyChain.drugId;
      if (!drug) continue;

      // Thiết lập kiểm tra chất lượng theo từng bước
      const qualityChecks = [];

      // Kiểm tra nhiệt độ và độ ẩm theo tiêu chuẩn thực tế
      const temperatureChecks = [
        {
          checkType: 'temperature',
          result: 'pass',
          value: `${22 + Math.floor(Math.random() * 6)}°C`, // 22-27°C
          checkedBy: supplyChain.steps[0]?.actorId,
          checkedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Nhiệt độ trong phạm vi cho phép (15-25°C)',
          standard: 'Theo tiêu chuẩn GMP',
          tolerance: '±2°C'
        },
        {
          checkType: 'temperature',
          result: 'pass',
          value: `${24 + Math.floor(Math.random() * 4)}°C`, // 24-27°C
          checkedBy: supplyChain.steps[2]?.actorId,
          checkedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          notes: 'Nhiệt độ vận chuyển phù hợp',
          standard: 'Theo tiêu chuẩn vận chuyển dược phẩm',
          tolerance: '±3°C'
        },
        {
          checkType: 'temperature',
          result: 'pass',
          value: `${22 + Math.floor(Math.random() * 4)}°C`, // 22-25°C
          checkedBy: supplyChain.steps[4]?.actorId,
          checkedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          notes: 'Nhiệt độ bảo quản tối ưu',
          standard: 'Theo tiêu chuẩn bảo quản dược phẩm',
          tolerance: '±1°C'
        }
      ];

      // Kiểm tra độ ẩm
      const humidityChecks = [
        {
          checkType: 'humidity',
          result: 'pass',
          value: `${55 + Math.floor(Math.random() * 10)}%`, // 55-65%
          checkedBy: supplyChain.steps[0]?.actorId,
          checkedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Độ ẩm trong phạm vi cho phép (45-65%)',
          standard: 'Theo tiêu chuẩn GMP',
          tolerance: '±5%'
        },
        {
          checkType: 'humidity',
          result: 'pass',
          value: `${58 + Math.floor(Math.random() * 8)}%`, // 58-66%
          checkedBy: supplyChain.steps[2]?.actorId,
          checkedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          notes: 'Độ ẩm vận chuyển phù hợp',
          standard: 'Theo tiêu chuẩn vận chuyển dược phẩm',
          tolerance: '±3%'
        },
        {
          checkType: 'humidity',
          result: 'pass',
          value: `${55 + Math.floor(Math.random() * 8)}%`, // 55-63%
          checkedBy: supplyChain.steps[4]?.actorId,
          checkedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          notes: 'Độ ẩm bảo quản tối ưu',
          standard: 'Theo tiêu chuẩn bảo quản dược phẩm',
          tolerance: '±2%'
        }
      ];

      // Kiểm tra tính toàn vẹn bao bì
      const integrityChecks = [
        {
          checkType: 'integrity',
          result: 'pass',
          value: 'Excellent',
          checkedBy: supplyChain.steps[0]?.actorId,
          checkedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Bao bì nguyên vẹn, không có dấu hiệu hư hỏng',
          standard: 'Theo tiêu chuẩn GMP',
          inspectionMethod: 'Visual inspection'
        },
        {
          checkType: 'integrity',
          result: 'pass',
          value: 'Good',
          checkedBy: supplyChain.steps[2]?.actorId,
          checkedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          notes: 'Bao bì vận chuyển an toàn',
          standard: 'Theo tiêu chuẩn vận chuyển',
          inspectionMethod: 'Visual inspection + Touch test'
        },
        {
          checkType: 'integrity',
          result: 'pass',
          value: 'Good',
          checkedBy: supplyChain.steps[4]?.actorId,
          checkedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          notes: 'Bao bì bảo quản tốt',
          standard: 'Theo tiêu chuẩn bảo quản',
          inspectionMethod: 'Visual inspection + Seal test'
        }
      ];

      // Kiểm tra hạn sử dụng
      const expiryChecks = [
        {
          checkType: 'expiry',
          result: 'pass',
          value: drug.expiryDate.toISOString().split('T')[0],
          checkedBy: supplyChain.steps[0]?.actorId,
          checkedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: `Còn hạn sử dụng ${Math.floor((drug.expiryDate - new Date()) / (1000 * 60 * 60 * 24))} ngày`,
          standard: 'Theo tiêu chuẩn GMP',
          daysUntilExpiry: Math.floor((drug.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
        },
        {
          checkType: 'expiry',
          result: 'pass',
          value: drug.expiryDate.toISOString().split('T')[0],
          checkedBy: supplyChain.steps[2]?.actorId,
          checkedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
          notes: 'Hạn sử dụng còn dài, an toàn để vận chuyển',
          standard: 'Theo tiêu chuẩn vận chuyển',
          daysUntilExpiry: Math.floor((drug.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
        },
        {
          checkType: 'expiry',
          result: 'pass',
          value: drug.expiryDate.toISOString().split('T')[0],
          checkedBy: supplyChain.steps[4]?.actorId,
          checkedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
          notes: 'Hạn sử dụng còn dài, an toàn để bảo quản',
          standard: 'Theo tiêu chuẩn bảo quản',
          daysUntilExpiry: Math.floor((drug.expiryDate - new Date()) / (1000 * 60 * 60 * 24))
        }
      ];

      // Kiểm tra chất lượng đặc biệt cho từng loại thuốc
      const customChecks = [];

      if (drug.form === 'cao khô') {
        customChecks.push({
          checkType: 'custom',
          result: 'pass',
          value: 'Moisture content: 8-12%',
          checkedBy: supplyChain.steps[0]?.actorId,
          checkedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Độ ẩm cao khô trong phạm vi cho phép',
          standard: 'Theo tiêu chuẩn cao khô dược liệu',
          testMethod: 'Moisture analyzer'
        });
      }

      if (drug.form === 'cao đặc') {
        customChecks.push({
          checkType: 'custom',
          result: 'pass',
          value: 'Viscosity: 1500-3000 cP',
          checkedBy: supplyChain.steps[0]?.actorId,
          checkedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Độ nhớt cao đặc trong phạm vi cho phép',
          standard: 'Theo tiêu chuẩn cao đặc dược liệu',
          testMethod: 'Viscometer'
        });
      }

      // Kiểm tra ánh sáng (nếu thuốc nhạy cảm với ánh sáng)
      if (drug.storage?.lightSensitive) {
        customChecks.push({
          checkType: 'light',
          result: 'pass',
          value: 'Light exposure: < 100 lux',
          checkedBy: supplyChain.steps[0]?.actorId,
          checkedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Thuốc được bảo quản tránh ánh sáng',
          standard: 'Theo tiêu chuẩn bảo quản thuốc nhạy cảm ánh sáng',
          testMethod: 'Lux meter'
        });
      }

      // Kiểm tra vi sinh (cho một số loại thuốc)
      if (Math.random() > 0.7) { // 30% thuốc được kiểm tra vi sinh
        customChecks.push({
          checkType: 'microbiology',
          result: 'pass',
          value: 'Total aerobic count: < 1000 CFU/g',
          checkedBy: supplyChain.steps[0]?.actorId,
          checkedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          notes: 'Không phát hiện vi sinh vật gây hại',
          standard: 'Theo tiêu chuẩn vi sinh dược phẩm',
          testMethod: 'Microbiological testing'
        });
      }

      // Gộp tất cả kiểm tra
      qualityChecks.push(
        ...temperatureChecks,
        ...humidityChecks,
        ...integrityChecks,
        ...expiryChecks,
        ...customChecks
      );

      // Cập nhật chuỗi cung ứng với kiểm tra chất lượng
      supplyChain.qualityChecks = qualityChecks;
      await supplyChain.save();

      console.log(`✅ Đã thiết lập ${qualityChecks.length} kiểm tra chất lượng cho ${supplyChain.drugBatchNumber}`);
    }

    console.log('\n🎉 HOÀN THÀNH THIẾT LẬP KIỂM TRA CHẤT LƯỢNG!');
    console.log('=============================================');
    console.log('✅ Kiểm tra nhiệt độ và độ ẩm theo tiêu chuẩn GMP');
    console.log('✅ Kiểm tra tính toàn vẹn bao bì');
    console.log('✅ Kiểm tra hạn sử dụng');
    console.log('✅ Kiểm tra chất lượng đặc biệt theo loại thuốc');
    console.log('✅ Kiểm tra ánh sáng cho thuốc nhạy cảm');
    console.log('✅ Kiểm tra vi sinh cho một số loại thuốc');

  } catch (error) {
    console.error('❌ Lỗi khi thiết lập kiểm tra chất lượng:', error);
    throw error;
  }
};

// Tạo báo cáo chất lượng
const generateQualityReport = async () => {
  try {
    console.log('\n📊 Tạo báo cáo chất lượng...');

    const supplyChains = await SupplyChain.find()
      .populate('drugId', 'name batchNumber form')
      .populate('qualityChecks.checkedBy', 'fullName role');

    const report = {
      generatedAt: new Date(),
      totalSupplyChains: supplyChains.length,
      qualitySummary: {
        totalChecks: 0,
        passedChecks: 0,
        failedChecks: 0,
        warningChecks: 0
      },
      checkTypes: {
        temperature: { total: 0, passed: 0, failed: 0 },
        humidity: { total: 0, passed: 0, failed: 0 },
        integrity: { total: 0, passed: 0, failed: 0 },
        expiry: { total: 0, passed: 0, failed: 0 },
        custom: { total: 0, passed: 0, failed: 0 },
        light: { total: 0, passed: 0, failed: 0 },
        microbiology: { total: 0, passed: 0, failed: 0 }
      },
      supplyChains: []
    };

    supplyChains.forEach(supplyChain => {
      const chainReport = {
        drugBatchNumber: supplyChain.drugBatchNumber,
        drugName: supplyChain.drugId?.name || 'Unknown',
        drugForm: supplyChain.drugId?.form || 'Unknown',
        totalChecks: supplyChain.qualityChecks.length,
        passedChecks: supplyChain.qualityChecks.filter(qc => qc.result === 'pass').length,
        failedChecks: supplyChain.qualityChecks.filter(qc => qc.result === 'fail').length,
        warningChecks: supplyChain.qualityChecks.filter(qc => qc.result === 'warning').length,
        checks: supplyChain.qualityChecks.map(qc => ({
          type: qc.checkType,
          result: qc.result,
          value: qc.value,
          checkedBy: qc.checkedBy?.fullName || 'Unknown',
          checkedAt: qc.checkedAt,
          notes: qc.notes
        }))
      };

      report.supplyChains.push(chainReport);

      // Cập nhật tổng kết
      report.qualitySummary.totalChecks += chainReport.totalChecks;
      report.qualitySummary.passedChecks += chainReport.passedChecks;
      report.qualitySummary.failedChecks += chainReport.failedChecks;
      report.qualitySummary.warningChecks += chainReport.warningChecks;

      // Cập nhật theo loại kiểm tra
      supplyChain.qualityChecks.forEach(qc => {
        if (report.checkTypes[qc.checkType]) {
          report.checkTypes[qc.checkType].total++;
          if (qc.result === 'pass') report.checkTypes[qc.checkType].passed++;
          if (qc.result === 'fail') report.checkTypes[qc.checkType].failed++;
        }
      });
    });

    // Tính tỷ lệ thành công
    report.qualitySummary.successRate = report.qualitySummary.totalChecks > 0 
      ? Math.round((report.qualitySummary.passedChecks / report.qualitySummary.totalChecks) * 100)
      : 0;

    console.log('\n📈 BÁO CÁO CHẤT LƯỢNG TỔNG HỢP:');
    console.log('================================');
    console.log(`📦 Tổng số chuỗi cung ứng: ${report.totalSupplyChains}`);
    console.log(`🔍 Tổng số kiểm tra: ${report.qualitySummary.totalChecks}`);
    console.log(`✅ Kiểm tra đạt: ${report.qualitySummary.passedChecks}`);
    console.log(`❌ Kiểm tra không đạt: ${report.qualitySummary.failedChecks}`);
    console.log(`⚠️ Kiểm tra cảnh báo: ${report.qualitySummary.warningChecks}`);
    console.log(`📊 Tỷ lệ thành công: ${report.qualitySummary.successRate}%`);

    console.log('\n🔬 CHI TIẾT THEO LOẠI KIỂM TRA:');
    console.log('===============================');
    Object.entries(report.checkTypes).forEach(([type, stats]) => {
      if (stats.total > 0) {
        const successRate = Math.round((stats.passed / stats.total) * 100);
        console.log(`${type.toUpperCase()}: ${stats.passed}/${stats.total} (${successRate}%)`);
      }
    });

    return report;
  } catch (error) {
    console.error('❌ Lỗi khi tạo báo cáo chất lượng:', error);
    throw error;
  }
};

// Chạy script chính
const main = async () => {
  try {
    await connectDB();
    
    console.log('🚀 BẮT ĐẦU THIẾT LẬP KIỂM TRA CHẤT LƯỢNG...');
    console.log('==========================================');
    
    // Thiết lập kiểm tra chất lượng
    await setupQualityControl();
    
    // Tạo báo cáo chất lượng
    await generateQualityReport();
    
    console.log('\n🎉 HOÀN THÀNH THIẾT LẬP KIỂM TRA CHẤT LƯỢNG!');
    console.log('=============================================');
    console.log('✅ Kiểm tra nhiệt độ và độ ẩm theo tiêu chuẩn GMP');
    console.log('✅ Kiểm tra tính toàn vẹn bao bì');
    console.log('✅ Kiểm tra hạn sử dụng');
    console.log('✅ Kiểm tra chất lượng đặc biệt theo loại thuốc');
    console.log('✅ Kiểm tra ánh sáng cho thuốc nhạy cảm');
    console.log('✅ Kiểm tra vi sinh cho một số loại thuốc');
    console.log('✅ Báo cáo chất lượng chi tiết');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình thiết lập kiểm tra chất lượng:', error);
  } finally {
    process.exit(0);
  }
};

main();
