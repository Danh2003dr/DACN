/**
 * Script kiểm tra nhà cung ứng trong database
 */

const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../models/User');

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

// Kiểm tra nhà cung ứng
const checkSuppliers = async () => {
  try {
    console.log('📊 KIỂM TRA NHÀ CUNG ỨNG');
    console.log('='.repeat(50));
    console.log('');

    // Tìm tất cả nhà cung ứng
    const suppliers = await User.find({
      role: { $in: ['manufacturer', 'distributor', 'hospital', 'pharmacy', 'dealer'] }
    });

    console.log(`Tìm thấy ${suppliers.length} nhà cung ứng:\n`);

    if (suppliers.length === 0) {
      console.log('⚠️  KHÔNG TÌM THẤY NHÀ CUNG ỨNG!');
      console.log('');
      console.log('💡 Để tạo dữ liệu nhà cung ứng, chạy:');
      console.log('   node scripts/setup-demo-data.js');
      console.log('');
    } else {
      suppliers.forEach((supplier, index) => {
        console.log(`${index + 1}. ${supplier.fullName || supplier.username}`);
        console.log(`   - Role: ${supplier.role}`);
        console.log(`   - Email: ${supplier.email}`);
        if (supplier.organizationId) {
          console.log(`   - Organization ID: ${supplier.organizationId}`);
        }
        if (supplier.organizationInfo) {
          console.log(`   - Organization: ${supplier.organizationInfo.name || 'N/A'}`);
        }
        console.log('');
      });
    }

    // Kiểm tra tất cả users
    const allUsers = await User.find();
    console.log('📋 TẤT CẢ USERS TRONG HỆ THỐNG:');
    console.log('-'.repeat(50));
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    usersByRole.forEach(item => {
      console.log(`   - ${item._id}: ${item.count}`);
    });

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
  checkSuppliers();
});

