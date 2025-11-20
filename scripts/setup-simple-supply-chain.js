const mongoose = require('mongoose');
const User = require('../models/User');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const bcrypt = require('bcryptjs');

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

// Tạo tài khoản admin mặc định
const createDefaultAdmin = async () => {
  try {
    console.log('👤 Tạo tài khoản admin mặc định...');
    
    // Kiểm tra admin đã tồn tại chưa
    let admin = await User.findOne({ role: 'admin' });
    
    if (!admin) {
      // Tạo admin mặc định
      admin = new User({
        username: 'admin',
        email: 'admin@drug-traceability.com',
        password: 'default123',
        fullName: 'Quản trị viên hệ thống',
        phone: '0123456789',
        address: {
          street: 'Số 1 Đường ABC',
          ward: 'Phường 1',
          district: 'Quận 1',
          city: 'TP. Hồ Chí Minh'
        },
        role: 'admin',
        organizationId: 'ADMIN_001',
        organizationInfo: {
          name: 'Hệ thống quản lý chuỗi cung ứng thuốc',
          license: 'LIC_ADMIN_001',
          type: 'system_admin',
          description: 'Quản trị viên hệ thống'
        },
        mustChangePassword: true
      });

      await admin.save();
      console.log('✅ Đã tạo tài khoản admin mặc định');
    } else {
      console.log('✅ Tài khoản admin đã tồn tại');
    }

    return admin;
  } catch (error) {
    console.error('❌ Lỗi khi tạo admin:', error);
    throw error;
  }
};

// Tạo nhà sản xuất mẫu
const createSampleManufacturer = async () => {
  try {
    console.log('🏭 Tạo nhà sản xuất mẫu...');
    
    let manufacturer = await User.findOne({ role: 'manufacturer' });
    
    if (!manufacturer) {
      manufacturer = new User({
        username: 'manufacturer1',
        email: 'manufacturer1@example.com',
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
        organizationInfo: {
          name: 'Công ty TNHH Dược liệu Hà Nội GMP',
          license: 'LIC_HANOI_GMP_001',
          type: 'pharmaceutical_company',
          description: 'Nhà sản xuất dược liệu uy tín tại Thanh Hóa'
        },
        mustChangePassword: true
      });

      await manufacturer.save();
      console.log('✅ Đã tạo nhà sản xuất mẫu');
    } else {
      console.log('✅ Nhà sản xuất đã tồn tại');
    }

    return manufacturer;
  } catch (error) {
    console.error('❌ Lỗi khi tạo nhà sản xuất:', error);
    throw error;
  }
};

// Tạo nhà phân phối mẫu
const createSampleDistributor = async () => {
  try {
    console.log('🚚 Tạo nhà phân phối mẫu...');
    
    let distributor = await User.findOne({ role: 'distributor' });
    
    if (!distributor) {
      distributor = new User({
        username: 'distributor1',
        email: 'distributor1@example.com',
        password: 'default123',
        fullName: 'Công ty Cổ phần Dược phẩm MediPhar',
        phone: '0281234567',
        address: {
          street: 'Số 15 Đường 3/2',
          ward: 'Phường 11',
          district: 'Quận 10',
          city: 'TP. Hồ Chí Minh'
        },
        role: 'distributor',
        organizationId: 'DIST_MEDIPHAR',
        organizationInfo: {
          name: 'Công ty Cổ phần Dược phẩm MediPhar',
          license: 'LIC_MEDIPHAR_001',
          type: 'pharmaceutical_distributor',
          description: 'Nhà phân phối dược phẩm hàng đầu tại TP.HCM'
        },
        mustChangePassword: true
      });

      await distributor.save();
      console.log('✅ Đã tạo nhà phân phối mẫu');
    } else {
      console.log('✅ Nhà phân phối đã tồn tại');
    }

    return distributor;
  } catch (error) {
    console.error('❌ Lỗi khi tạo nhà phân phối:', error);
    throw error;
  }
};

// Tạo bệnh viện mẫu
const createSampleHospital = async () => {
  try {
    console.log('🏥 Tạo bệnh viện mẫu...');
    
    let hospital = await User.findOne({ role: 'hospital' });
    
    if (!hospital) {
      hospital = new User({
        username: 'hospital1',
        email: 'hospital1@example.com',
        password: 'default123',
        fullName: 'Bệnh viện Chợ Rẫy',
        phone: '0281234567',
        address: {
          street: 'Số 201B Nguyễn Chí Thanh',
          ward: 'Phường 12',
          district: 'Quận 5',
          city: 'TP. Hồ Chí Minh'
        },
        role: 'hospital',
        organizationId: 'HOSP_CHOGAY',
        organizationInfo: {
          name: 'Bệnh viện Chợ Rẫy',
          license: 'LIC_CHOGAY_001',
          type: 'hospital',
          description: 'Bệnh viện đa khoa hạng đặc biệt tại TP.HCM'
        },
        mustChangePassword: true
      });

      await hospital.save();
      console.log('✅ Đã tạo bệnh viện mẫu');
    } else {
      console.log('✅ Bệnh viện đã tồn tại');
    }

    return hospital;
  } catch (error) {
    console.error('❌ Lỗi khi tạo bệnh viện:', error);
    throw error;
  }
};

// Tạo bệnh nhân mẫu
const createSamplePatient = async () => {
  try {
    console.log('👤 Tạo bệnh nhân mẫu...');
    
    let patient = await User.findOne({ role: 'patient' });
    
    if (!patient) {
      patient = new User({
        username: 'patient1',
        email: 'patient1@example.com',
        password: 'default123',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        address: {
          street: 'Số 123 Đường Láng',
          ward: 'Phường Láng Thượng',
          district: 'Quận Đống Đa',
          city: 'Hà Nội'
        },
        role: 'patient',
        patientId: 'PAT_001',
        mustChangePassword: true
      });

      await patient.save();
      console.log('✅ Đã tạo bệnh nhân mẫu');
    } else {
      console.log('✅ Bệnh nhân đã tồn tại');
    }

    return patient;
  } catch (error) {
    console.error('❌ Lỗi khi tạo bệnh nhân:', error);
    throw error;
  }
};

// Tạo thuốc mẫu
const createSampleDrug = async (manufacturer) => {
  try {
    console.log('💊 Tạo thuốc mẫu...');
    
    let drug = await Drug.findOne({ name: 'Cao khô dược liệu - Lô 218' });
    
    if (!drug) {
      drug = new Drug({
        name: 'Cao khô dược liệu - Lô 218',
        activeIngredient: 'Cao khô dược liệu tự nhiên',
        dosage: 'Theo quy chuẩn NSX',
        form: 'cao khô',
        batchNumber: 'BATCH_218_001',
        productionDate: new Date('2024-01-15'),
        expiryDate: new Date('2026-01-15'),
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
        manufacturerId: manufacturer._id,
        createdBy: manufacturer._id,
        distribution: {
          status: 'kiểm_định',
          currentLocation: {
            type: 'nhà_máy',
            organizationId: manufacturer.organizationId,
            organizationName: manufacturer.organizationInfo.name,
            address: `${manufacturer.address.street}, ${manufacturer.address.ward}, ${manufacturer.address.district}, ${manufacturer.address.city}`,
            coordinates: { lat: 19.8067, lng: 105.7844 }
          }
        },
        packaging: {
          specifications: 'Túi 1kg, túi 2kg, túi 5kg, túi 10kg, (túi PE/ túi nhôm)',
          standard: 'NSX',
          shelfLife: '24 tháng'
        }
      });

      await drug.save();
      console.log('✅ Đã tạo thuốc mẫu');
    } else {
      console.log('✅ Thuốc đã tồn tại');
    }

    return drug;
  } catch (error) {
    console.error('❌ Lỗi khi tạo thuốc:', error);
    throw error;
  }
};

// Tạo chuỗi cung ứng mẫu
const createSampleSupplyChain = async (drug, manufacturer, distributor, hospital) => {
  try {
    console.log('🔗 Tạo chuỗi cung ứng mẫu...');
    
    const batchNumber = `BATCH_${drug.batchNumber}_${new Date().getFullYear()}`;
    
    let supplyChain = await SupplyChain.findOne({ drugBatchNumber: batchNumber });
    
    if (!supplyChain) {
      supplyChain = new SupplyChain({
        drugId: drug._id,
        drugBatchNumber: batchNumber,
        qrCode: {
          code: `QR_${batchNumber}`,
          blockchainId: `BC_${batchNumber}`,
          verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${batchNumber}`
        },
        status: 'active',
        createdBy: manufacturer._id,
        steps: [
          {
            stepType: 'production',
            actorId: manufacturer._id,
            actorName: manufacturer.fullName,
            actorRole: 'manufacturer',
            action: 'created',
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            location: {
              type: 'Point',
              coordinates: [105.8542, 21.0285],
              address: `${manufacturer.address.street}, ${manufacturer.address.ward}, ${manufacturer.address.district}, ${manufacturer.address.city}`
            },
            conditions: {
              temperature: 22,
              humidity: 55,
              light: 'controlled',
              notes: 'Sản xuất trong điều kiện tiêu chuẩn GMP'
            },
            metadata: {
              batchNumber: batchNumber,
              quantity: 1000,
              unit: 'kg',
              notes: `Lô sản xuất ${drug.name} theo tiêu chuẩn GMP`
            },
            verificationMethod: 'auto',
            isVerified: true
          },
          {
            stepType: 'distribution',
            actorId: distributor._id,
            actorName: distributor.fullName,
            actorRole: 'distributor',
            action: 'shipped',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: `${distributor.address.street}, ${distributor.address.ward}, ${distributor.address.district}, ${distributor.address.city}`
            },
            conditions: {
              temperature: 25,
              humidity: 60,
              light: 'dark',
              notes: 'Vận chuyển trong xe lạnh'
            },
            metadata: {
              batchNumber: batchNumber,
              quantity: 1000,
              unit: 'kg',
              notes: 'Vận chuyển từ nhà sản xuất đến nhà phân phối'
            },
            verificationMethod: 'manual',
            isVerified: true
          },
          {
            stepType: 'hospital',
            actorId: hospital._id,
            actorName: hospital.fullName,
            actorRole: 'hospital',
            action: 'received',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: `${hospital.address.street}, ${hospital.address.ward}, ${hospital.address.district}, ${hospital.address.city}`
            },
            conditions: {
              temperature: 24,
              humidity: 58,
              light: 'dark',
              notes: 'Kiểm tra nhiệt độ và độ ẩm khi nhận hàng'
            },
            metadata: {
              batchNumber: batchNumber,
              quantity: 1000,
              unit: 'kg',
              notes: 'Nhận hàng và kiểm tra chất lượng tại bệnh viện'
            },
            verificationMethod: 'manual',
            isVerified: true
          }
        ],
        currentLocation: {
          actorId: hospital._id,
          actorName: hospital.fullName,
          actorRole: 'hospital',
          address: `${hospital.address.street}, ${hospital.address.ward}, ${hospital.address.district}, ${hospital.address.city}`,
          coordinates: [106.6297, 10.8231],
          lastUpdated: new Date()
        },
        qualityChecks: [
          {
            checkType: 'temperature',
            result: 'pass',
            value: '22°C',
            checkedBy: hospital._id,
            checkedAt: new Date(),
            notes: 'Nhiệt độ phù hợp'
          },
          {
            checkType: 'humidity',
            result: 'pass',
            value: '55%',
            checkedBy: hospital._id,
            checkedAt: new Date(),
            notes: 'Độ ẩm trong phạm vi cho phép'
          },
          {
            checkType: 'integrity',
            result: 'pass',
            value: 'Good',
            checkedBy: hospital._id,
            checkedAt: new Date(),
            notes: 'Bao bì nguyên vẹn'
          }
        ]
      });

      await supplyChain.save();
      console.log('✅ Đã tạo chuỗi cung ứng mẫu');
    } else {
      console.log('✅ Chuỗi cung ứng đã tồn tại');
    }

    return supplyChain;
  } catch (error) {
    console.error('❌ Lỗi khi tạo chuỗi cung ứng:', error);
    throw error;
  }
};

// Chạy script chính
const main = async () => {
  try {
    await connectDB();
    
    console.log('🚀 BẮT ĐẦU THIẾT LẬP HỆ THỐNG CHUỖI CUNG ỨNG ĐƠN GIẢN...');
    console.log('=====================================================');
    
    // Tạo các tài khoản
    const admin = await createDefaultAdmin();
    const manufacturer = await createSampleManufacturer();
    const distributor = await createSampleDistributor();
    const hospital = await createSampleHospital();
    const patient = await createSamplePatient();
    
    // Tạo thuốc mẫu
    const drug = await createSampleDrug(manufacturer);
    
    // Tạo chuỗi cung ứng mẫu
    const supplyChain = await createSampleSupplyChain(drug, manufacturer, distributor, hospital);
    
    console.log('\n🎉 HOÀN THÀNH THIẾT LẬP HỆ THỐNG!');
    console.log('=================================');
    console.log('✅ Tài khoản admin: admin / default123');
    console.log('✅ Tài khoản nhà sản xuất: manufacturer1 / default123');
    console.log('✅ Tài khoản nhà phân phối: distributor1 / default123');
    console.log('✅ Tài khoản bệnh viện: hospital1 / default123');
    console.log('✅ Tài khoản bệnh nhân: patient1 / default123');
    console.log(`✅ Thuốc mẫu: ${drug.name}`);
    console.log(`✅ Chuỗi cung ứng: ${supplyChain.drugBatchNumber}`);
    
    console.log('\n🔗 TRUY CẬP HỆ THỐNG:');
    console.log('=====================');
    console.log('- API: http://localhost:5000/api');
    console.log('- Health Check: http://localhost:5000/api/health');
    console.log('- Quản lý chuỗi cung ứng: http://localhost:5000/api/supply-chain');
    console.log('- Quản lý thuốc: http://localhost:5000/api/drugs');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình thiết lập:', error);
  } finally {
    process.exit(0);
  }
};

main();
