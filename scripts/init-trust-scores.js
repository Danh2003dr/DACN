/**
 * Script khởi tạo trust score cho tất cả nhà cung ứng
 * 
 * Cách sử dụng:
 *   node scripts/init-trust-scores.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');
const TrustScoreService = require('../services/trustScoreService');

// Kết nối database
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Đã kết nối MongoDB\n');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    process.exit(1);
  }
};

// Khởi tạo trust scores
const initTrustScores = async () => {
  try {
    console.log('🌱 KHỞI TẠO TRUST SCORE CHO NHÀ CUNG ỨNG');
    console.log('='.repeat(50));
    console.log('');

    // Tìm tất cả nhà cung ứng
    const suppliers = await User.find({
      role: { $in: ['manufacturer', 'distributor', 'hospital', 'pharmacy', 'dealer'] }
    });

    console.log(`📋 Tìm thấy ${suppliers.length} nhà cung ứng\n`);

    if (suppliers.length === 0) {
      console.log('⚠️  Không tìm thấy nhà cung ứng nào!');
      console.log('💡 Chạy: node scripts/setup-demo-data.js để tạo dữ liệu');
      return;
    }

    const results = [];
    const errors = [];

    for (const supplier of suppliers) {
      try {
        console.log(`📊 Đang tính toán điểm cho: ${supplier.fullName || supplier.username} (${supplier.role})...`);
        
        const trustScore = await TrustScoreService.calculateAndUpdateTrustScore(supplier._id);
        
        results.push({
          supplierId: supplier._id,
          supplierName: supplier.fullName || supplier.username,
          role: supplier.role,
          trustScore: trustScore.trustScore,
          trustLevel: trustScore.trustLevel
        });

        console.log(`   ✅ Điểm: ${trustScore.trustScore} (Cấp ${trustScore.trustLevel})`);
        console.log(`   - Review: ${trustScore.scoreBreakdown.reviewScore}`);
        console.log(`   - Compliance: ${trustScore.scoreBreakdown.complianceScore}`);
        console.log(`   - Quality: ${trustScore.scoreBreakdown.qualityScore}`);
        console.log(`   - Efficiency: ${trustScore.scoreBreakdown.efficiencyScore}`);
        console.log(`   - Timeliness: ${trustScore.scoreBreakdown.timelinessScore}`);
        console.log('');

      } catch (error) {
        console.error(`   ❌ Lỗi: ${error.message}`);
        errors.push({
          supplierId: supplier._id,
          supplierName: supplier.fullName || supplier.username,
          error: error.message
        });
        console.log('');
      }
    }

    // Tổng kết
    console.log('='.repeat(50));
    console.log('📊 TỔNG KẾT:');
    console.log('-'.repeat(50));
    console.log(`   ✅ Thành công: ${results.length}`);
    console.log(`   ❌ Thất bại: ${errors.length}`);
    console.log('');

    if (results.length > 0) {
      console.log('📋 DANH SÁCH ĐIỂM:');
      results.forEach((r, index) => {
        console.log(`   ${index + 1}. ${r.supplierName} (${r.role}): ${r.trustScore} điểm - Cấp ${r.trustLevel}`);
      });
    }

    if (errors.length > 0) {
      console.log('\n❌ LỖI:');
      errors.forEach((e, index) => {
        console.log(`   ${index + 1}. ${e.supplierName}: ${e.error}`);
      });
    }

    console.log('\n✅ Hoàn thành khởi tạo trust score!');

  } catch (error) {
    console.error('❌ Lỗi khi khởi tạo trust score:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối database');
    process.exit(0);
  }
};

// Chạy script
connectDB().then(() => {
  initTrustScores();
});

