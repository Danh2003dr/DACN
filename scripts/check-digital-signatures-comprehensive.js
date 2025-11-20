/**
 * Script kiểm tra toàn diện hệ thống chữ ký số
 * 
 * Cách sử dụng:
 *   node scripts/check-digital-signatures-comprehensive.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const DigitalSignature = require('../models/DigitalSignature');
const User = require('../models/User');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');

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

// Kiểm tra toàn diện
const checkDigitalSignatures = async () => {
  try {
    console.log('🔐 KIỂM TRA TOÀN DIỆN HỆ THỐNG CHỮ KÝ SỐ');
    console.log('='.repeat(60));
    console.log('');

    // 1. Kiểm tra dữ liệu chữ ký số
    console.log('📊 1. THỐNG KÊ CHỮ KÝ SỐ:');
    console.log('-'.repeat(60));
    const totalSignatures = await DigitalSignature.countDocuments();
    console.log(`   Tổng số chữ ký số: ${totalSignatures}`);
    
    if (totalSignatures === 0) {
      console.log('   ⚠️  CHƯA CÓ DỮ LIỆU CHỮ KÝ SỐ!');
      console.log('');
    } else {
      const byStatus = await DigitalSignature.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      const byTargetType = await DigitalSignature.aggregate([
        {
          $group: {
            _id: '$targetType',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);

      console.log('   Theo trạng thái:');
      byStatus.forEach(item => {
        console.log(`     - ${item._id || 'N/A'}: ${item.count}`);
      });

      console.log('   Theo loại đối tượng:');
      byTargetType.forEach(item => {
        console.log(`     - ${item._id || 'N/A'}: ${item.count}`);
      });
    }
    console.log('');

    // 2. Kiểm tra dữ liệu liên quan
    console.log('📋 2. KIỂM TRA DỮ LIỆU LIÊN QUAN:');
    console.log('-'.repeat(60));
    
    const totalUsers = await User.countDocuments();
    const manufacturers = await User.countDocuments({ role: 'manufacturer' });
    const distributors = await User.countDocuments({ role: 'distributor' });
    const hospitals = await User.countDocuments({ role: 'hospital' });
    
    console.log(`   Tổng số users: ${totalUsers}`);
    console.log(`   - Manufacturers: ${manufacturers}`);
    console.log(`   - Distributors: ${distributors}`);
    console.log(`   - Hospitals: ${hospitals}`);
    
    const totalDrugs = await Drug.countDocuments();
    const drugsWithQualityTest = await Drug.countDocuments({
      'qualityTest.testResult': { $ne: 'đang kiểm định' }
    });
    
    console.log(`   Tổng số drugs: ${totalDrugs}`);
    console.log(`   - Drugs đã kiểm định: ${drugsWithQualityTest}`);
    
    const totalSupplyChains = await SupplyChain.countDocuments();
    console.log(`   Tổng số supply chains: ${totalSupplyChains}`);
    console.log('');

    // 3. Kiểm tra chữ ký số có liên kết đúng không
    if (totalSignatures > 0) {
      console.log('🔗 3. KIỂM TRA LIÊN KẾT:');
      console.log('-'.repeat(60));
      
      const signatures = await DigitalSignature.find().limit(10);
      let validLinks = 0;
      let invalidLinks = 0;
      
      for (const sig of signatures) {
        let isValid = true;
        let errors = [];
        
        // Kiểm tra signedBy
        if (sig.signedBy) {
          const user = await User.findById(sig.signedBy);
          if (!user) {
            isValid = false;
            errors.push(`signedBy không tồn tại: ${sig.signedBy}`);
          }
        }
        
        // Kiểm tra targetId theo targetType
        if (sig.targetType === 'drug') {
          const drug = await Drug.findById(sig.targetId);
          if (!drug) {
            isValid = false;
            errors.push(`Drug không tồn tại: ${sig.targetId}`);
          }
        } else if (sig.targetType === 'supplyChain') {
          const supplyChain = await SupplyChain.findById(sig.targetId);
          if (!supplyChain) {
            isValid = false;
            errors.push(`SupplyChain không tồn tại: ${sig.targetId}`);
          }
        }
        
        if (isValid) {
          validLinks++;
        } else {
          invalidLinks++;
          console.log(`   ❌ Chữ ký ${sig._id}:`);
          errors.forEach(e => console.log(`      - ${e}`));
        }
      }
      
      console.log(`   ✅ Liên kết hợp lệ: ${validLinks}`);
      console.log(`   ❌ Liên kết không hợp lệ: ${invalidLinks}`);
      console.log('');
    }

    // 4. Kiểm tra validation
    console.log('✅ 4. KIỂM TRA VALIDATION:');
    console.log('-'.repeat(60));
    
    const invalidSignatures = await DigitalSignature.find({
      $or: [
        { dataHash: { $exists: false } },
        { signature: { $exists: false } },
        { 'certificate.serialNumber': { $exists: false } },
        { signedBy: { $exists: false } }
      ]
    }).limit(5);
    
    if (invalidSignatures.length > 0) {
      console.log(`   ⚠️  Tìm thấy ${invalidSignatures.length} chữ ký số thiếu dữ liệu bắt buộc`);
    } else {
      console.log('   ✅ Tất cả chữ ký số có đầy đủ dữ liệu bắt buộc');
    }
    console.log('');

    // 5. Kiểm tra chứng chỉ số
    if (totalSignatures > 0) {
      console.log('📜 5. KIỂM TRA CHỨNG CHỈ SỐ:');
      console.log('-'.repeat(60));
      
      const certStats = await DigitalSignature.aggregate([
        {
          $group: {
            _id: '$certificate.certificateStatus',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      const caStats = await DigitalSignature.aggregate([
        {
          $group: {
            _id: '$certificate.caProvider',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      console.log('   Theo trạng thái chứng chỉ:');
      certStats.forEach(item => {
        console.log(`     - ${item._id || 'N/A'}: ${item.count}`);
      });
      
      console.log('   Theo nhà cung cấp CA:');
      caStats.forEach(item => {
        console.log(`     - ${item._id || 'N/A'}: ${item.count}`);
      });
      console.log('');
    }

    // 6. Kiểm tra timestamp
    if (totalSignatures > 0) {
      console.log('⏰ 6. KIỂM TRA TIMESTAMP:');
      console.log('-'.repeat(60));
      
      const timestampStats = await DigitalSignature.aggregate([
        {
          $group: {
            _id: '$timestamp.timestampStatus',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      
      console.log('   Theo trạng thái timestamp:');
      timestampStats.forEach(item => {
        console.log(`     - ${item._id || 'N/A'}: ${item.count}`);
      });
      console.log('');
    }

    // 7. Tổng kết và đề xuất
    console.log('='.repeat(60));
    console.log('📊 TỔNG KẾT:');
    console.log('-'.repeat(60));
    console.log(`   ✅ Chữ ký số: ${totalSignatures}`);
    console.log(`   ✅ Users: ${totalUsers} (${manufacturers} manufacturers, ${distributors} distributors, ${hospitals} hospitals)`);
    console.log(`   ✅ Drugs: ${totalDrugs} (${drugsWithQualityTest} đã kiểm định)`);
    console.log(`   ✅ Supply Chains: ${totalSupplyChains}`);
    console.log('');

    if (totalSignatures === 0) {
      console.log('⚠️  CHƯA CÓ DỮ LIỆU CHỮ KÝ SỐ!');
      console.log('');
      console.log('💡 Để tạo dữ liệu chữ ký số, chạy:');
      console.log('   node scripts/seed-digital-signatures.js');
      console.log('');
      
      if (totalDrugs === 0) {
        console.log('⚠️  CẢNH BÁO: Chưa có dữ liệu drugs!');
        console.log('   Chạy: node scripts/setup-demo-data.js');
        console.log('');
      }
      
      if (totalSupplyChains === 0) {
        console.log('⚠️  CẢNH BÁO: Chưa có dữ liệu supply chains!');
        console.log('   Chạy: node scripts/setup-complete-supply-chain.js');
        console.log('');
      }
    } else {
      console.log('✅ Hệ thống chữ ký số đã có dữ liệu!');
    }

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối database');
    process.exit(0);
  }
};

// Chạy script
connectDB().then(() => {
  checkDigitalSignatures();
});

