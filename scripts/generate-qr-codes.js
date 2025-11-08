const mongoose = require('mongoose');
const Drug = require('../models/Drug');
const User = require('../models/User');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');

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

// Tạo QR code cho các thuốc
const generateQRCodes = async () => {
  try {
    console.log('Đang tạo QR code cho các thuốc...');

    // Tạo thư mục qr-codes nếu chưa có
    const qrDir = path.join(__dirname, '..', 'qr-codes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir, { recursive: true });
    }

    // Lấy tất cả thuốc
    const drugs = await Drug.find({}).populate('manufacturerId', 'fullName organizationId');
    
    console.log(`Tìm thấy ${drugs.length} thuốc cần tạo QR code`);

    for (const drug of drugs) {
      try {
        // Tạo QR code data
        const qrData = {
          drugId: drug.drugId,
          name: drug.name,
          batchNumber: drug.batchNumber,
          manufacturer: drug.manufacturerId.fullName,
          manufacturerId: drug.manufacturerId.organizationId,
          productionDate: drug.productionDate,
          expiryDate: drug.expiryDate,
          qualityTest: drug.qualityTest,
          currentStatus: drug.distribution.status,
          currentLocation: drug.distribution.currentLocation,
          isRecalled: drug.isRecalled,
          timestamp: Date.now(),
          verificationUrl: `http://localhost:3000/verify/${drug.drugId}`
        };

        // Tạo QR code image
        const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData), {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Lưu QR code image
        const qrFileName = `${drug.drugId}.png`;
        const qrFilePath = path.join(qrDir, qrFileName);
        
        // Chuyển đổi data URL thành buffer và lưu file
        const base64Data = qrCodeDataURL.replace(/^data:image\/png;base64,/, '');
        fs.writeFileSync(qrFilePath, base64Data, 'base64');

        // Cập nhật QR code info trong database
        drug.qrCode.imageUrl = `/qr-codes/${qrFileName}`;
        drug.qrCode.verificationUrl = qrData.verificationUrl;
        await drug.save();

        console.log(`✓ Đã tạo QR code cho ${drug.name} (${drug.drugId})`);

      } catch (error) {
        console.error(`✗ Lỗi khi tạo QR code cho ${drug.name}:`, error.message);
      }
    }

    console.log('\n=== HOÀN THÀNH TẠO QR CODE ===');
    console.log(`Đã tạo QR code cho ${drugs.length} thuốc`);
    console.log(`QR code được lưu tại: ${qrDir}`);

  } catch (error) {
    console.error('Lỗi khi tạo QR code:', error);
  }
};

// Chạy script
const run = async () => {
  await connectDB();
  await generateQRCodes();
  process.exit(0);
};

run();
