const mongoose = require('mongoose');
const User = require('../models/User');
const Drug = require('../models/Drug');
const bcrypt = require('bcryptjs');

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

// Tạo dữ liệu demo
const createDemoData = async () => {
  try {
    console.log('Đang tạo dữ liệu demo...');

    // Xóa dữ liệu cũ
    await User.deleteMany({});
    await Drug.deleteMany({});
    console.log('Đã xóa dữ liệu cũ');

    // Tạo users demo
    const users = await User.create([
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'default123',
        fullName: 'Quản trị viên hệ thống',
        phone: '0123456789',
        address: {
          street: '123 Đường ABC',
          ward: 'Phường 1',
          district: 'Quận 1',
          city: 'TP.HCM'
        },
        role: 'admin',
        mustChangePassword: true
      },
      {
        username: 'manufacturer1',
        email: 'manufacturer1@example.com',
        password: 'default123',
        fullName: 'Công ty Dược phẩm ABC',
        phone: '0987654321',
        address: {
          street: '456 Đường XYZ',
          ward: 'Phường 2',
          district: 'Quận 2',
          city: 'TP.HCM'
        },
        role: 'manufacturer',
        organizationId: 'MFG_001',
        organizationInfo: {
          name: 'Công ty Dược phẩm ABC',
          license: 'LIC_MFG_001',
          type: 'pharmaceutical_company',
          description: 'Nhà sản xuất thuốc uy tín'
        },
        mustChangePassword: true
      },
      {
        username: 'distributor1',
        email: 'distributor1@example.com',
        password: 'default123',
        fullName: 'Công ty Phân phối DEF',
        phone: '0912345678',
        address: {
          street: '789 Đường DEF',
          ward: 'Phường 3',
          district: 'Quận 3',
          city: 'TP.HCM'
        },
        role: 'distributor',
        organizationId: 'DIST_001',
        organizationInfo: {
          name: 'Công ty Phân phối DEF',
          license: 'LIC_DIST_001',
          type: 'distribution_company',
          description: 'Nhà phân phối thuốc chuyên nghiệp'
        },
        mustChangePassword: true
      },
      {
        username: 'hospital1',
        email: 'hospital1@example.com',
        password: 'default123',
        fullName: 'Bệnh viện GHI',
        phone: '0923456789',
        address: {
          street: '321 Đường GHI',
          ward: 'Phường 4',
          district: 'Quận 4',
          city: 'TP.HCM'
        },
        role: 'hospital',
        organizationId: 'HOSP_001',
        organizationInfo: {
          name: 'Bệnh viện GHI',
          license: 'LIC_HOSP_001',
          type: 'hospital',
          description: 'Bệnh viện đa khoa'
        },
        mustChangePassword: true
      },
      {
        username: 'patient1',
        email: 'patient1@example.com',
        password: 'default123',
        fullName: 'Nguyễn Văn A',
        phone: '0934567890',
        address: {
          street: '654 Đường JKL',
          ward: 'Phường 5',
          district: 'Quận 5',
          city: 'TP.HCM'
        },
        role: 'patient',
        patientId: 'PAT_001',
        mustChangePassword: true
      }
    ]);

    console.log(`Đã tạo ${users.length} users demo`);

    // Tạo drugs demo
    const manufacturer = users.find(u => u.role === 'manufacturer');
    const drugs = await Drug.create([
      {
        name: 'Paracetamol 500mg',
        activeIngredient: 'Paracetamol',
        dosage: '500mg',
        form: 'viên nén',
        batchNumber: 'BATCH001',
        productionDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01'),
        qualityTest: {
          testDate: new Date('2024-01-02'),
          testResult: 'đạt',
          testBy: 'Bộ Y tế',
          testReport: 'Kết quả kiểm định đạt chuẩn',
          certificateNumber: 'CERT001'
        },
        storage: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 45, max: 65, unit: '%' },
          lightSensitive: true,
          specialInstructions: 'Bảo quản nơi khô ráo, thoáng mát'
        },
        manufacturerId: manufacturer._id,
        createdBy: manufacturer._id,
        distribution: {
          status: 'sản_xuất',
          currentLocation: {
            type: 'nhà_máy',
            organizationId: manufacturer.organizationId,
            organizationName: manufacturer.organizationInfo.name,
            address: manufacturer.address.street + ', ' + manufacturer.address.ward + ', ' + manufacturer.address.district + ', ' + manufacturer.address.city
          }
        }
      },
      {
        name: 'Amoxicillin 250mg',
        activeIngredient: 'Amoxicillin',
        dosage: '250mg',
        form: 'viên nang',
        batchNumber: 'BATCH002',
        productionDate: new Date('2024-02-01'),
        expiryDate: new Date('2025-12-01'),
        qualityTest: {
          testDate: new Date('2024-02-02'),
          testResult: 'đạt',
          testBy: 'Bộ Y tế',
          testReport: 'Kết quả kiểm định đạt chuẩn',
          certificateNumber: 'CERT002'
        },
        storage: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 45, max: 65, unit: '%' },
          lightSensitive: false,
          specialInstructions: 'Bảo quản nơi khô ráo'
        },
        manufacturerId: manufacturer._id,
        createdBy: manufacturer._id,
        distribution: {
          status: 'kiểm_định',
          currentLocation: {
            type: 'nhà_máy',
            organizationId: manufacturer.organizationId,
            organizationName: manufacturer.organizationInfo.name,
            address: manufacturer.address.street + ', ' + manufacturer.address.ward + ', ' + manufacturer.address.district + ', ' + manufacturer.address.city
          }
        }
      },
      {
        name: 'Ibuprofen 400mg',
        activeIngredient: 'Ibuprofen',
        dosage: '400mg',
        form: 'viên nén',
        batchNumber: 'BATCH003',
        productionDate: new Date('2023-12-01'),
        expiryDate: new Date('2025-11-01'),
        qualityTest: {
          testDate: new Date('2023-12-02'),
          testResult: 'đạt',
          testBy: 'Bộ Y tế',
          testReport: 'Kết quả kiểm định đạt chuẩn',
          certificateNumber: 'CERT003'
        },
        storage: {
          temperature: { min: 15, max: 25, unit: 'celsius' },
          humidity: { min: 45, max: 65, unit: '%' },
          lightSensitive: false,
          specialInstructions: 'Bảo quản nơi khô ráo'
        },
        manufacturerId: manufacturer._id,
        createdBy: manufacturer._id,
        distribution: {
          status: 'tại_kho',
          currentLocation: {
            type: 'kho_phân_phối',
            organizationId: 'DIST_001',
            organizationName: 'Công ty Phân phối DEF',
            address: '789 Đường DEF, Phường 3, Quận 3, TP.HCM'
          }
        }
      }
    ]);

    console.log(`Đã tạo ${drugs.length} drugs demo`);

    console.log('\n=== DỮ LIỆU DEMO ĐÃ ĐƯỢC TẠO ===');
    console.log('Tài khoản demo:');
    console.log('Admin: admin / default123');
    console.log('Manufacturer: manufacturer1 / default123');
    console.log('Distributor: distributor1 / default123');
    console.log('Hospital: hospital1 / default123');
    console.log('Patient: patient1 / default123');
    console.log('\nLưu ý: Lần đầu đăng nhập sẽ yêu cầu đổi mật khẩu!');

  } catch (error) {
    console.error('Lỗi khi tạo dữ liệu demo:', error);
  }
};

// Chạy script
const run = async () => {
  await connectDB();
  await createDemoData();
  process.exit(0);
};

run();
