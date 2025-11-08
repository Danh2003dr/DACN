const mongoose = require('mongoose');
const User = require('../models/User');
const Drug = require('../models/Drug');

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

// Tạo dữ liệu thuốc đã được kiểm định
const createVerifiedDrugs = async () => {
  try {
    console.log('Đang thêm dữ liệu thuốc đã được kiểm định...');

    // Tìm hoặc tạo nhà sản xuất từ dữ liệu thật
    let manufacturer1 = await User.findOne({ 
      'organizationId': 'MFG_HANOI_GMP' 
    });
    
    if (!manufacturer1) {
      manufacturer1 = await User.create({
        username: 'hanoi_gmp',
        email: 'contact@hanoigmp.com',
        password: 'default123',
        fullName: 'Công ty TNHH Dược liệu Hà Nội GMP',
        phone: '02371234567',
        address: {
          street: 'Lô 87,88, Khu E, KCN Tây Bắc Ga',
          ward: 'Phường Đông Lĩnh',
          district: 'Thành phố Thanh Hóa',
          city: 'Tỉnh Thanh Hóa'
        },
        role: 'manufacturer',
        organizationId: 'MFG_HANOI_GMP',
        mustChangePassword: true
      });
      console.log('Đã tạo nhà sản xuất: Công ty TNHH Dược liệu Hà Nội GMP');
    }

    let manufacturer2 = await User.findOne({ 
      'organizationId': 'MFG_PHUC_HUNG' 
    });
    
    if (!manufacturer2) {
      manufacturer2 = await User.create({
        username: 'phuc_hung',
        email: 'contact@phuchung.com',
        password: 'default123',
        fullName: 'Công ty TNHH Đông dược Phúc Hưng',
        phone: '0241234567',
        address: {
          street: 'Số 96-98 Nguyễn Viết Xuân',
          ward: 'Phường Quang Trung',
          district: 'Quận Hà Đông',
          city: 'Thành phố Hà Nội'
        },
        role: 'manufacturer',
        organizationId: 'MFG_PHUC_HUNG',
        mustChangePassword: true
      });
      console.log('Đã tạo nhà sản xuất: Công ty TNHH Đông dược Phúc Hưng');
    }

    // Tạo thuốc đã được kiểm định từ dữ liệu thật
    const verifiedDrugs = await Drug.create([
      {
        name: 'Cao khô dược liệu - Lô 218',
        activeIngredient: 'Cao khô dược liệu tự nhiên',
        dosage: 'Theo quy chuẩn NSX',
        form: 'cao khô',
        batchNumber: 'BATCH_218_001',
        productionDate: new Date('2024-01-15'),
        expiryDate: new Date('2026-01-15'), // 24 tháng
        qualityTest: {
          testDate: new Date('2024-01-20'),
          testResult: 'đạt',
          testBy: 'Cục Quản lý Dược - Bộ Y tế',
          testReport: 'Thuốc đạt tiêu chuẩn chất lượng theo quy định tại điểm c khoản 8 Điều 56 Luật dược số 44/2024/QH15',
          certificateNumber: 'CERT_218_001'
        },
        storage: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 45, max: 65, unit: '%' },
          lightSensitive: true,
          specialInstructions: 'Bảo quản trong túi PE/túi nhôm, nơi khô ráo, thoáng mát'
        },
        manufacturerId: manufacturer1._id,
        createdBy: manufacturer1._id,
        distribution: {
          status: 'kiểm_định',
          currentLocation: {
            type: 'nhà_máy',
            organizationId: manufacturer1.organizationId,
            organizationName: manufacturer1.fullName,
            address: `${manufacturer1.address.street}, ${manufacturer1.address.ward}, ${manufacturer1.address.district}, ${manufacturer1.address.city}`,
            coordinates: { lat: 19.8067, lng: 105.7844 } // Tọa độ Thanh Hóa
          }
        },
        // Thông tin đóng gói từ dữ liệu thật
        packaging: {
          specifications: 'Túi 1kg, túi 2kg, túi 5kg, túi 10kg, (túi PE/ túi nhôm)',
          standard: 'NSX',
          shelfLife: '24 tháng'
        },
        qrCode: {
          data: JSON.stringify({
            drugId: 'DRUG_218_001',
            name: 'Cao khô dược liệu - Lô 218',
            batchNumber: 'BATCH_218_001',
            manufacturerId: manufacturer1._id,
            timestamp: Date.now()
          })
        }
      },
      {
        name: 'Cao đặc dược liệu - Lô 218',
        activeIngredient: 'Cao đặc dược liệu tự nhiên',
        dosage: 'Theo quy chuẩn NSX',
        form: 'cao đặc',
        batchNumber: 'BATCH_218_002',
        productionDate: new Date('2024-01-15'),
        expiryDate: new Date('2026-01-15'), // 24 tháng
        qualityTest: {
          testDate: new Date('2024-01-20'),
          testResult: 'đạt',
          testBy: 'Cục Quản lý Dược - Bộ Y tế',
          testReport: 'Thuốc đạt tiêu chuẩn chất lượng theo quy định tại điểm c khoản 8 Điều 56 Luật dược số 44/2024/QH15',
          certificateNumber: 'CERT_218_002'
        },
        storage: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 45, max: 65, unit: '%' },
          lightSensitive: true,
          specialInstructions: 'Bảo quản trong thùng carton, nơi khô ráo, thoáng mát'
        },
        manufacturerId: manufacturer1._id,
        createdBy: manufacturer1._id,
        distribution: {
          status: 'kiểm_định',
          currentLocation: {
            type: 'nhà_máy',
            organizationId: manufacturer1.organizationId,
            organizationName: manufacturer1.fullName,
            address: `${manufacturer1.address.street}, ${manufacturer1.address.ward}, ${manufacturer1.address.district}, ${manufacturer1.address.city}`,
            coordinates: { lat: 19.8067, lng: 105.7844 } // Tọa độ Thanh Hóa
          }
        },
        // Thông tin đóng gói từ dữ liệu thật
        packaging: {
          specifications: 'Thùng 1 túi x 5kg; thùng 1 túi x 10kg; thùng 2 túi x 10kg',
          standard: 'NSX',
          shelfLife: '24 tháng'
        },
        qrCode: {
          data: JSON.stringify({
            drugId: 'DRUG_218_002',
            name: 'Cao đặc dược liệu - Lô 218',
            batchNumber: 'BATCH_218_002',
            manufacturerId: manufacturer1._id,
            timestamp: Date.now()
          })
        }
      },
      {
        name: 'Cao khô dược liệu - Lô 218 (Phúc Hưng)',
        activeIngredient: 'Cao khô dược liệu tự nhiên',
        dosage: 'Theo quy chuẩn NSX',
        form: 'cao khô',
        batchNumber: 'BATCH_218_003',
        productionDate: new Date('2024-01-10'),
        expiryDate: new Date('2027-01-10'), // 36 tháng
        qualityTest: {
          testDate: new Date('2024-01-15'),
          testResult: 'đạt',
          testBy: 'Cục Quản lý Dược - Bộ Y tế',
          testReport: 'Thuốc đạt tiêu chuẩn chất lượng theo quy định tại điểm c khoản 8 Điều 56 Luật dược số 44/2024/QH15',
          certificateNumber: 'CERT_218_003'
        },
        storage: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 45, max: 65, unit: '%' },
          lightSensitive: true,
          specialInstructions: 'Bảo quản nơi khô ráo, thoáng mát, tránh ánh sáng trực tiếp'
        },
        manufacturerId: manufacturer2._id,
        createdBy: manufacturer2._id,
        distribution: {
          status: 'kiểm_định',
          currentLocation: {
            type: 'nhà_máy',
            organizationId: manufacturer2.organizationId,
            organizationName: manufacturer2.fullName,
            address: `${manufacturer2.address.street}, ${manufacturer2.address.ward}, ${manufacturer2.address.district}, ${manufacturer2.address.city}`,
            coordinates: { lat: 20.9808, lng: 105.7878 } // Tọa độ Hà Nội
          }
        },
        // Thông tin đóng gói từ dữ liệu thật
        packaging: {
          specifications: 'Túi 5kg, 10kg, 15kg, 20kg, 25kg, 30kg, 35kg, 40kg, 45kg, 50kg',
          standard: 'NSX',
          shelfLife: '36 tháng'
        },
        qrCode: {
          data: JSON.stringify({
            drugId: 'DRUG_218_003',
            name: 'Cao khô dược liệu - Lô 218 (Phúc Hưng)',
            batchNumber: 'BATCH_218_003',
            manufacturerId: manufacturer2._id,
            timestamp: Date.now()
          })
        }
      }
    ]);

    console.log(`Đã tạo ${verifiedDrugs.length} thuốc đã được kiểm định`);

    // Tạo thêm một số thuốc khác để mở rộng dữ liệu
    const additionalDrugs = await Drug.create([
      {
        name: 'Cao khô dược liệu - Lô 219',
        activeIngredient: 'Cao khô dược liệu tự nhiên',
        dosage: 'Theo quy chuẩn NSX',
        form: 'cao khô',
        batchNumber: 'BATCH_219_001',
        productionDate: new Date('2024-02-01'),
        expiryDate: new Date('2026-02-01'), // 24 tháng
        qualityTest: {
          testDate: new Date('2024-02-05'),
          testResult: 'đạt',
          testBy: 'Cục Quản lý Dược - Bộ Y tế',
          testReport: 'Thuốc đạt tiêu chuẩn chất lượng',
          certificateNumber: 'CERT_219_001'
        },
        storage: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 45, max: 65, unit: '%' },
          lightSensitive: true,
          specialInstructions: 'Bảo quản trong túi PE/túi nhôm, nơi khô ráo, thoáng mát'
        },
        manufacturerId: manufacturer1._id,
        createdBy: manufacturer1._id,
        distribution: {
          status: 'đóng_gói',
          currentLocation: {
            type: 'nhà_máy',
            organizationId: manufacturer1.organizationId,
            organizationName: manufacturer1.fullName,
            address: `${manufacturer1.address.street}, ${manufacturer1.address.ward}, ${manufacturer1.address.district}, ${manufacturer1.address.city}`,
            coordinates: { lat: 19.8067, lng: 105.7844 }
          }
        },
        packaging: {
          specifications: 'Túi 1kg, túi 2kg, túi 5kg, túi 10kg, (túi PE/ túi nhôm)',
          standard: 'NSX',
          shelfLife: '24 tháng'
        },
        qrCode: {
          data: JSON.stringify({
            drugId: 'DRUG_219_001',
            name: 'Cao khô dược liệu - Lô 219',
            batchNumber: 'BATCH_219_001',
            manufacturerId: manufacturer1._id,
            timestamp: Date.now()
          })
        }
      },
      {
        name: 'Cao đặc dược liệu - Lô 220',
        activeIngredient: 'Cao đặc dược liệu tự nhiên',
        dosage: 'Theo quy chuẩn NSX',
        form: 'cao đặc',
        batchNumber: 'BATCH_220_001',
        productionDate: new Date('2024-02-15'),
        expiryDate: new Date('2026-02-15'), // 24 tháng
        qualityTest: {
          testDate: new Date('2024-02-20'),
          testResult: 'đạt',
          testBy: 'Cục Quản lý Dược - Bộ Y tế',
          testReport: 'Thuốc đạt tiêu chuẩn chất lượng',
          certificateNumber: 'CERT_220_001'
        },
        storage: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 45, max: 65, unit: '%' },
          lightSensitive: true,
          specialInstructions: 'Bảo quản trong thùng carton, nơi khô ráo, thoáng mát'
        },
        manufacturerId: manufacturer2._id,
        createdBy: manufacturer2._id,
        distribution: {
          status: 'vận_chuyển',
          currentLocation: {
            type: 'kho_phân_phối',
            organizationId: 'DIST_001',
            organizationName: 'Công ty Phân phối Dược phẩm',
            address: 'Số 123 Đường ABC, Phường 1, Quận 1, TP.HCM',
            coordinates: { lat: 10.7769, lng: 106.7009 }
          }
        },
        packaging: {
          specifications: 'Thùng 1 túi x 5kg; thùng 1 túi x 10kg; thùng 2 túi x 10kg',
          standard: 'NSX',
          shelfLife: '24 tháng'
        },
        qrCode: {
          data: JSON.stringify({
            drugId: 'DRUG_220_001',
            name: 'Cao đặc dược liệu - Lô 220',
            batchNumber: 'BATCH_220_001',
            manufacturerId: manufacturer2._id,
            timestamp: Date.now()
          })
        }
      }
    ]);

    console.log(`Đã tạo thêm ${additionalDrugs.length} thuốc bổ sung`);

    console.log('\n=== DỮ LIỆU THUỐC ĐÃ ĐƯỢC KIỂM ĐỊNH ĐÃ ĐƯỢC THÊM ===');
    console.log('Các thuốc đã được thêm:');
    verifiedDrugs.forEach((drug, index) => {
      console.log(`${index + 1}. ${drug.name} - Lô: ${drug.batchNumber} - NSX: ${drug.manufacturerId}`);
    });
    
    additionalDrugs.forEach((drug, index) => {
      console.log(`${verifiedDrugs.length + index + 1}. ${drug.name} - Lô: ${drug.batchNumber} - NSX: ${drug.manufacturerId}`);
    });

    console.log('\nThông tin nhà sản xuất:');
    console.log('1. Công ty TNHH Dược liệu Hà Nội GMP - Thanh Hóa');
    console.log('2. Công ty TNHH Đông dược Phúc Hưng - Hà Nội');

  } catch (error) {
    console.error('Lỗi khi thêm dữ liệu thuốc đã được kiểm định:', error);
  }
};

// Chạy script
const run = async () => {
  await connectDB();
  await createVerifiedDrugs();
  process.exit(0);
};

run();
