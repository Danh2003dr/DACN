/**
 * Script kiểm tra dữ liệu chuỗi cung ứng trong database
 * 
 * Cách sử dụng:
 *   node scripts/check-supply-chain-data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

const SupplyChain = require('../models/SupplyChain');
const Drug = require('../models/Drug');
const User = require('../models/User');
const DigitalSignature = require('../models/DigitalSignature');

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

// Kiểm tra dữ liệu
const checkSupplyChainData = async () => {
  try {
    console.log('📊 KIỂM TRA DỮ LIỆU CHUỖI CUNG ỨNG');
    console.log('='.repeat(50));
    console.log('');

    // 1. Kiểm tra Users
    console.log('👥 THỐNG KÊ USERS:');
    console.log('-'.repeat(50));
    const totalUsers = await User.countDocuments();
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log(`   Tổng số users: ${totalUsers}`);
    usersByRole.forEach(item => {
      console.log(`   - ${item._id}: ${item.count}`);
    });
    console.log('');

    // 2. Kiểm tra Drugs
    console.log('💊 THỐNG KÊ LÔ THUỐC:');
    console.log('-'.repeat(50));
    const totalDrugs = await Drug.countDocuments();
    const drugsByStatus = await Drug.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const drugsByDistributionStatus = await Drug.aggregate([
      {
        $group: {
          _id: '$distribution.status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log(`   Tổng số lô thuốc: ${totalDrugs}`);
    console.log('   Theo trạng thái:');
    drugsByStatus.forEach(item => {
      console.log(`     - ${item._id || 'N/A'}: ${item.count}`);
    });
    console.log('   Theo trạng thái phân phối:');
    drugsByDistributionStatus.forEach(item => {
      console.log(`     - ${item._id || 'N/A'}: ${item.count}`);
    });
    console.log('');

    // 3. Kiểm tra Supply Chains
    console.log('🚚 THỐNG KÊ CHUỖI CUNG ỨNG:');
    console.log('-'.repeat(50));
    const totalSupplyChains = await SupplyChain.countDocuments();
    const supplyChainsByStatus = await SupplyChain.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const supplyChainsWithSteps = await SupplyChain.aggregate([
      {
        $project: {
          stepCount: { $size: { $ifNull: ['$steps', []] } }
        }
      },
      {
        $group: {
          _id: '$stepCount',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    console.log(`   Tổng số chuỗi cung ứng: ${totalSupplyChains}`);
    
    if (totalSupplyChains > 0) {
      console.log('   Theo trạng thái:');
      supplyChainsByStatus.forEach(item => {
        console.log(`     - ${item._id || 'N/A'}: ${item.count}`);
      });

      console.log('   Theo số bước (steps):');
      supplyChainsWithSteps.forEach(item => {
        console.log(`     - ${item._id} bước: ${item.count} chuỗi`);
      });

      // Tính tổng số steps
      const totalSteps = await SupplyChain.aggregate([
        {
          $project: {
            stepCount: { $size: { $ifNull: ['$steps', []] } }
          }
        },
        {
          $group: {
            _id: null,
            total: { $sum: '$stepCount' },
            average: { $avg: '$stepCount' },
            max: { $max: '$stepCount' },
            min: { $min: '$stepCount' }
          }
        }
      ]);

      if (totalSteps.length > 0) {
        const stats = totalSteps[0];
        console.log(`   Tổng số bước: ${stats.total}`);
        console.log(`   Trung bình bước/chuỗi: ${stats.average.toFixed(2)}`);
        console.log(`   Nhiều nhất: ${stats.max} bước`);
        console.log(`   Ít nhất: ${stats.min} bước`);
      }
    } else {
      console.log('   ⚠️  Chưa có dữ liệu chuỗi cung ứng!');
    }
    console.log('');

    // 4. Kiểm tra Digital Signatures
    console.log('🔐 THỐNG KÊ CHỮ KÝ SỐ:');
    console.log('-'.repeat(50));
    const totalSignatures = await DigitalSignature.countDocuments();
    const signaturesByStatus = await DigitalSignature.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const signaturesByTargetType = await DigitalSignature.aggregate([
      {
        $group: {
          _id: '$targetType',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    console.log(`   Tổng số chữ ký số: ${totalSignatures}`);
    if (totalSignatures > 0) {
      console.log('   Theo trạng thái:');
      signaturesByStatus.forEach(item => {
        console.log(`     - ${item._id || 'N/A'}: ${item.count}`);
      });
      console.log('   Theo loại đối tượng:');
      signaturesByTargetType.forEach(item => {
        console.log(`     - ${item._id || 'N/A'}: ${item.count}`);
      });
    }
    console.log('');

    // 5. Hiển thị một số supply chains mẫu
    if (totalSupplyChains > 0) {
      console.log('📋 MẪU CHUỖI CUNG ỨNG (5 chuỗi đầu tiên):');
      console.log('-'.repeat(50));
      
      const sampleSupplyChains = await SupplyChain.find()
        .populate('drugId', 'name batchNumber')
        .populate('createdBy', 'fullName role')
        .limit(5)
        .sort({ createdAt: -1 });

      sampleSupplyChains.forEach((sc, index) => {
        console.log(`\n   ${index + 1}. ${sc.drugBatchNumber || 'N/A'}`);
        console.log(`      - Thuốc: ${sc.drugId?.name || 'N/A'} (${sc.drugId?.batchNumber || 'N/A'})`);
        console.log(`      - Trạng thái: ${sc.status || 'N/A'}`);
        console.log(`      - Số bước: ${sc.steps?.length || 0}`);
        if (sc.currentLocation) {
          console.log(`      - Vị trí hiện tại: ${sc.currentLocation.actorName || 'N/A'} (${sc.currentLocation.actorRole || 'N/A'})`);
        }
        if (sc.steps && sc.steps.length > 0) {
          console.log(`      - Bước đầu: ${sc.steps[0].action} bởi ${sc.steps[0].actorName} (${sc.steps[0].timestamp})`);
          if (sc.steps.length > 1) {
            console.log(`      - Bước cuối: ${sc.steps[sc.steps.length - 1].action} bởi ${sc.steps[sc.steps.length - 1].actorName}`);
          }
        }
      });
      console.log('');
    }

    // 6. Tổng kết
    console.log('='.repeat(50));
    console.log('📊 TỔNG KẾT:');
    console.log('-'.repeat(50));
    console.log(`   ✅ Users: ${totalUsers}`);
    console.log(`   ✅ Drugs: ${totalDrugs}`);
    console.log(`   ${totalSupplyChains > 0 ? '✅' : '❌'} Supply Chains: ${totalSupplyChains}`);
    console.log(`   ✅ Digital Signatures: ${totalSignatures}`);
    console.log('');

    if (totalSupplyChains === 0) {
      console.log('⚠️  CHƯA CÓ DỮ LIỆU CHUỖI CUNG ỨNG!');
      console.log('');
      console.log('💡 Để tạo dữ liệu chuỗi cung ứng, chạy một trong các lệnh sau:');
      console.log('   - node scripts/setup-simple-supply-chain.js');
      console.log('   - node scripts/setup-complete-supply-chain.js');
      console.log('   - node scripts/setup-real-drugs-supply-chain.js');
      console.log('');
    } else {
      console.log('✅ Dữ liệu chuỗi cung ứng đã có sẵn!');
    }

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra dữ liệu:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối database');
    process.exit(0);
  }
};

// Chạy script
connectDB().then(() => {
  checkSupplyChainData();
});

