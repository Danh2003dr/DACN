const mongoose = require('mongoose');
const Drug = require('../models/Drug');
const User = require('../models/User');

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Hiển thị thông tin thuốc đã được kiểm định
const showVerifiedDrugs = async () => {
  try {
    console.log('=== THÔNG TIN THUỐC ĐÃ ĐƯỢC KIỂM ĐỊNH ===\n');

    // Lấy tất cả thuốc với thông tin nhà sản xuất
    const drugs = await Drug.find({})
      .populate('manufacturerId', 'fullName organizationId address')
      .sort({ createdAt: -1 });

    console.log(`Tổng số thuốc trong hệ thống: ${drugs.length}\n`);

    // Lọc các thuốc từ dữ liệu thật (có chứa "Cao" trong tên)
    const verifiedDrugs = drugs.filter(drug => 
      drug.name.includes('Cao') || 
      drug.manufacturerId?.organizationId?.includes('HANOI_GMP') ||
      drug.manufacturerId?.organizationId?.includes('PHUC_HUNG')
    );

    console.log(`Số thuốc từ dữ liệu thật: ${verifiedDrugs.length}\n`);

    verifiedDrugs.forEach((drug, index) => {
      console.log(`--- THUỐC ${index + 1} ---`);
      console.log(`Tên thuốc: ${drug.name}`);
      console.log(`Mã thuốc: ${drug.drugId}`);
      console.log(`Số lô: ${drug.batchNumber}`);
      console.log(`Dạng bào chế: ${drug.form}`);
      console.log(`Thành phần: ${drug.activeIngredient}`);
      console.log(`Liều lượng: ${drug.dosage}`);
      console.log(`Ngày sản xuất: ${drug.productionDate.toLocaleDateString('vi-VN')}`);
      console.log(`Hạn sử dụng: ${drug.expiryDate.toLocaleDateString('vi-VN')}`);
      console.log(`Số ngày còn lại: ${drug.daysUntilExpiry} ngày`);
      
      console.log('\n--- THÔNG TIN KIỂM ĐỊNH ---');
      console.log(`Kết quả kiểm định: ${drug.qualityTest.testResult}`);
      console.log(`Ngày kiểm định: ${drug.qualityTest.testDate.toLocaleDateString('vi-VN')}`);
      console.log(`Cơ quan kiểm định: ${drug.qualityTest.testBy}`);
      console.log(`Số chứng nhận: ${drug.qualityTest.certificateNumber}`);
      console.log(`Báo cáo: ${drug.qualityTest.testReport}`);
      
      console.log('\n--- THÔNG TIN NHÀ SẢN XUẤT ---');
      if (drug.manufacturerId) {
        console.log(`Tên công ty: ${drug.manufacturerId.fullName}`);
        console.log(`Mã tổ chức: ${drug.manufacturerId.organizationId}`);
        console.log(`Địa chỉ: ${drug.manufacturerId.address.street}, ${drug.manufacturerId.address.ward}, ${drug.manufacturerId.address.district}, ${drug.manufacturerId.address.city}`);
      }
      
      console.log('\n--- THÔNG TIN ĐÓNG GÓI ---');
      if (drug.packaging) {
        console.log(`Quy cách đóng gói: ${drug.packaging.specifications}`);
        console.log(`Tiêu chuẩn: ${drug.packaging.standard}`);
        console.log(`Tuổi thọ: ${drug.packaging.shelfLife}`);
      }
      
      console.log('\n--- THÔNG TIN PHÂN PHỐI ---');
      console.log(`Trạng thái: ${drug.distribution.status}`);
      console.log(`Vị trí hiện tại: ${drug.distribution.currentLocation.organizationName}`);
      console.log(`Địa chỉ: ${drug.distribution.currentLocation.address}`);
      
      console.log('\n--- THÔNG TIN BẢO QUẢN ---');
      console.log(`Nhiệt độ: ${drug.storage.temperature.min}°C - ${drug.storage.temperature.max}°C`);
      console.log(`Độ ẩm: ${drug.storage.humidity.min}% - ${drug.storage.humidity.max}%`);
      console.log(`Nhạy cảm với ánh sáng: ${drug.lightSensitive ? 'Có' : 'Không'}`);
      console.log(`Hướng dẫn đặc biệt: ${drug.storage.specialInstructions}`);
      
      console.log('\n--- THÔNG TIN QR CODE ---');
      console.log(`QR Code: ${drug.qrCode.imageUrl ? 'Đã tạo' : 'Chưa tạo'}`);
      console.log(`URL xác minh: ${drug.qrCode.verificationUrl || 'Chưa có'}`);
      
      console.log('\n' + '='.repeat(80) + '\n');
    });

    // Thống kê theo nhà sản xuất
    console.log('=== THỐNG KÊ THEO NHÀ SẢN XUẤT ===');
    const statsByManufacturer = {};
    verifiedDrugs.forEach(drug => {
      const manufacturerName = drug.manufacturerId?.fullName || 'Không xác định';
      if (!statsByManufacturer[manufacturerName]) {
        statsByManufacturer[manufacturerName] = 0;
      }
      statsByManufacturer[manufacturerName]++;
    });

    Object.entries(statsByManufacturer).forEach(([manufacturer, count]) => {
      console.log(`${manufacturer}: ${count} thuốc`);
    });

    console.log('\n=== THỐNG KÊ THEO TRẠNG THÁI ===');
    const statsByStatus = {};
    verifiedDrugs.forEach(drug => {
      const status = drug.distribution.status;
      if (!statsByStatus[status]) {
        statsByStatus[status] = 0;
      }
      statsByStatus[status]++;
    });

    Object.entries(statsByStatus).forEach(([status, count]) => {
      console.log(`${status}: ${count} thuốc`);
    });

  } catch (error) {
    console.error('Lỗi khi hiển thị thông tin thuốc:', error);
  }
};

// Chạy script
const run = async () => {
  await connectDB();
  await showVerifiedDrugs();
  process.exit(0);
};

run();
