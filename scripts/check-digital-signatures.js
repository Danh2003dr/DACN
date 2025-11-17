const mongoose = require('mongoose');
require('dotenv').config();

// Import models để đảm bảo schema được đăng ký
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
    console.log('✅ Đã kết nối MongoDB');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    process.exit(1);
  }
};

// Kiểm tra dữ liệu
const checkData = async () => {
  try {
    console.log('\n📊 Kiểm tra dữ liệu chữ ký số...\n');

    const total = await DigitalSignature.countDocuments();
    console.log(`Tổng số chữ ký số: ${total}`);

    if (total === 0) {
      console.log('\n⚠️  Không có dữ liệu chữ ký số nào trong database!');
      console.log('💡 Hãy chạy: npm run seed:signatures\n');
      return;
    }

    // Thống kê theo trạng thái
    const active = await DigitalSignature.countDocuments({ status: 'active' });
    const expired = await DigitalSignature.countDocuments({ status: 'expired' });
    const revoked = await DigitalSignature.countDocuments({ status: 'revoked' });
    const invalid = await DigitalSignature.countDocuments({ status: 'invalid' });

    console.log(`\n📈 Thống kê theo trạng thái:`);
    console.log(`   Đang hoạt động: ${active}`);
    console.log(`   Đã hết hạn: ${expired}`);
    console.log(`   Đã bị thu hồi: ${revoked}`);
    console.log(`   Không hợp lệ: ${invalid}`);

    // Thống kê theo loại
    const byType = await DigitalSignature.aggregate([
      {
        $group: {
          _id: '$targetType',
          count: { $sum: 1 }
        }
      }
    ]);

    console.log(`\n📋 Thống kê theo loại đối tượng:`);
    byType.forEach(item => {
      console.log(`   ${item._id}: ${item.count}`);
    });

    // Lấy 5 chữ ký số mới nhất
    const recent = await DigitalSignature.find()
      .populate('signedBy', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(5);

    console.log(`\n📝 5 chữ ký số mới nhất:`);
    recent.forEach((sig, index) => {
      console.log(`\n   ${index + 1}. ${sig.targetType} - ${sig.signedByName}`);
      console.log(`      Trạng thái: ${sig.status}`);
      console.log(`      Ngày tạo: ${sig.createdAt.toLocaleString('vi-VN')}`);
      console.log(`      CA: ${sig.certificate?.caName || 'N/A'}`);
    });

    console.log('\n✅ Dữ liệu chữ ký số đã có trong database!');
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra dữ liệu:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối database');
    process.exit(0);
  }
};

// Chạy script
connectDB().then(() => {
  checkData();
});

