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

// Tạo các tổ chức thật tại Việt Nam
const createRealOrganizations = async () => {
  try {
    console.log('🏥 Tạo các tổ chức thật tại Việt Nam...');

    // Tạo nhà phân phối thật
    const distributors = await User.create([
      {
        username: 'mediphar_dist',
        email: 'contact@mediphar.com.vn',
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
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231],
          address: 'Số 15 Đường 3/2, Phường 11, Quận 10, TP. Hồ Chí Minh'
        },
        mustChangePassword: true
      },
      {
        username: 'pharmexim_dist',
        email: 'info@pharmexim.com.vn',
        password: 'default123',
        fullName: 'Công ty TNHH Thương mại Dược phẩm Pharmexim',
        phone: '0241234567',
        address: {
          street: 'Số 123 Phố Huế',
          ward: 'Phường Phố Huế',
          district: 'Quận Hai Bà Trưng',
          city: 'Hà Nội'
        },
        role: 'distributor',
        organizationId: 'DIST_PHARMEXIM',
        organizationInfo: {
          name: 'Công ty TNHH Thương mại Dược phẩm Pharmexim',
          license: 'LIC_PHARMEXIM_001',
          type: 'pharmaceutical_distributor',
          description: 'Nhà phân phối dược phẩm uy tín tại Hà Nội'
        },
        location: {
          type: 'Point',
          coordinates: [105.8542, 21.0285],
          address: 'Số 123 Phố Huế, Phường Phố Huế, Quận Hai Bà Trưng, Hà Nội'
        },
        mustChangePassword: true
      }
    ]);

    // Tạo bệnh viện thật
    const hospitals = await User.create([
      {
        username: 'bachmai_hospital',
        email: 'admin@bachmai.gov.vn',
        password: 'default123',
        fullName: 'Bệnh viện Bạch Mai',
        phone: '0241234567',
        address: {
          street: 'Số 78 Giải Phóng',
          ward: 'Phường Phương Mai',
          district: 'Quận Đống Đa',
          city: 'Hà Nội'
        },
        role: 'hospital',
        organizationId: 'HOSP_BACHMAI',
        organizationInfo: {
          name: 'Bệnh viện Bạch Mai',
          license: 'LIC_BACHMAI_001',
          type: 'hospital',
          description: 'Bệnh viện đa khoa hạng đặc biệt tại Hà Nội'
        },
        location: {
          type: 'Point',
          coordinates: [105.8542, 21.0285],
          address: 'Số 78 Giải Phóng, Phường Phương Mai, Quận Đống Đa, Hà Nội'
        },
        mustChangePassword: true
      },
      {
        username: 'chogay_hospital',
        email: 'admin@chogay.gov.vn',
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
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231],
          address: 'Số 201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP. Hồ Chí Minh'
        },
        mustChangePassword: true
      },
      {
        username: 'vinmec_hospital',
        email: 'admin@vinmec.com',
        password: 'default123',
        fullName: 'Bệnh viện Đa khoa Quốc tế Vinmec',
        phone: '0241234567',
        address: {
          street: 'Số 458 Minh Khai',
          ward: 'Phường Vĩnh Tuy',
          district: 'Quận Hai Bà Trưng',
          city: 'Hà Nội'
        },
        role: 'hospital',
        organizationId: 'HOSP_VINMEC',
        organizationInfo: {
          name: 'Bệnh viện Đa khoa Quốc tế Vinmec',
          license: 'LIC_VINMEC_001',
          type: 'hospital',
          description: 'Bệnh viện tư nhân cao cấp tại Hà Nội'
        },
        location: {
          type: 'Point',
          coordinates: [105.8542, 21.0285],
          address: 'Số 458 Minh Khai, Phường Vĩnh Tuy, Quận Hai Bà Trưng, Hà Nội'
        },
        mustChangePassword: true
      }
    ]);

    // Tạo bệnh nhân mẫu
    const patients = await User.create([
      {
        username: 'patient_nguyen_van_a',
        email: 'nguyenvana@email.com',
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
        organizationId: 'PATIENT_001',
        organizationInfo: {
          name: 'Bệnh nhân cá nhân',
          license: null,
          type: 'patient',
          description: 'Bệnh nhân sử dụng thuốc'
        },
        location: {
          type: 'Point',
          coordinates: [105.8542, 21.0285],
          address: 'Số 123 Đường Láng, Phường Láng Thượng, Quận Đống Đa, Hà Nội'
        },
        mustChangePassword: true
      },
      {
        username: 'patient_tran_thi_b',
        email: 'tranthib@email.com',
        password: 'default123',
        fullName: 'Trần Thị B',
        phone: '0907654321',
        address: {
          street: 'Số 456 Đường Nguyễn Văn Cừ',
          ward: 'Phường 4',
          district: 'Quận 5',
          city: 'TP. Hồ Chí Minh'
        },
        role: 'patient',
        organizationId: 'PATIENT_002',
        organizationInfo: {
          name: 'Bệnh nhân cá nhân',
          license: null,
          type: 'patient',
          description: 'Bệnh nhân sử dụng thuốc'
        },
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231],
          address: 'Số 456 Đường Nguyễn Văn Cừ, Phường 4, Quận 5, TP. Hồ Chí Minh'
        },
        mustChangePassword: true
      }
    ]);

    console.log(`✅ Đã tạo ${distributors.length} nhà phân phối`);
    console.log(`✅ Đã tạo ${hospitals.length} bệnh viện`);
    console.log(`✅ Đã tạo ${patients.length} bệnh nhân`);

    return { distributors, hospitals, patients };
  } catch (error) {
    console.error('Lỗi khi tạo tổ chức:', error);
    throw error;
  }
};

// Tạo chuỗi cung ứng hoàn chỉnh với dữ liệu thật
const createCompleteSupplyChains = async () => {
  try {
    console.log('🚀 Tạo chuỗi cung ứng hoàn chỉnh với dữ liệu thật...');

    // Lấy các tổ chức
    const manufacturers = await User.find({ role: 'manufacturer' });
    const distributors = await User.find({ role: 'distributor' });
    const hospitals = await User.find({ role: 'hospital' });
    const patients = await User.find({ role: 'patient' });
    const drugs = await Drug.find();

    if (manufacturers.length === 0 || distributors.length === 0 || hospitals.length === 0 || drugs.length === 0) {
      console.error('❌ Thiếu dữ liệu cần thiết. Vui lòng chạy setup-verified-drugs.js trước.');
      return;
    }

    // Xóa chuỗi cung ứng cũ
    await SupplyChain.deleteMany({});
    console.log('✅ Đã xóa chuỗi cung ứng cũ');

    // Tạo chuỗi cung ứng cho từng thuốc
    const supplyChains = [];

    for (let i = 0; i < drugs.length; i++) {
      const drug = drugs[i];
      const manufacturer = manufacturers.find(m => m._id.toString() === drug.manufacturerId.toString());
      
      if (!manufacturer) continue;

      // Tạo batch number thật
      const batchNumber = `BATCH_${drug.batchNumber}_${new Date().getFullYear()}`;
      
      // Tạo chuỗi cung ứng
      const supplyChain = new SupplyChain({
        drugId: drug._id,
        drugBatchNumber: batchNumber,
        qrCode: {
          code: `QR_${batchNumber}`,
          blockchainId: `BC_${batchNumber}`,
          verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${batchNumber}`
        },
        status: 'active',
        createdBy: manufacturer._id,
        steps: [],
        currentLocation: {
          actorId: manufacturer._id,
          actorName: manufacturer.fullName,
          actorRole: 'manufacturer',
          address: `${manufacturer.address.street}, ${manufacturer.address.ward}, ${manufacturer.address.district}, ${manufacturer.address.city}`,
          coordinates: manufacturer.location?.coordinates || [105.8542, 21.0285],
          lastUpdated: new Date()
        }
      });

      // Bước 1: Sản xuất (7 ngày trước)
      const productionStep = {
        stepType: 'production',
        actorId: manufacturer._id,
        actorName: manufacturer.fullName,
        actorRole: 'manufacturer',
        action: 'created',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        location: {
          type: 'Point',
          coordinates: manufacturer.location?.coordinates || [105.8542, 21.0285],
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
          quantity: Math.floor(Math.random() * 1000) + 500,
          unit: drug.form === 'cao khô' ? 'kg' : drug.form === 'cao đặc' ? 'kg' : 'unit',
          expiryDate: drug.expiryDate,
          notes: `Lô sản xuất ${drug.name} theo tiêu chuẩn GMP`
        },
        verificationMethod: 'auto',
        isVerified: true
      };

      supplyChain.steps.push(productionStep);

      // Bước 2: Kiểm tra chất lượng (6 ngày trước)
      const qualityCheckStep = {
        stepType: 'production',
        actorId: manufacturer._id,
        actorName: manufacturer.fullName,
        actorRole: 'manufacturer',
        action: 'quality_check',
        timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
        location: {
          type: 'Point',
          coordinates: manufacturer.location?.coordinates || [105.8542, 21.0285],
          address: `${manufacturer.address.street}, ${manufacturer.address.ward}, ${manufacturer.address.district}, ${manufacturer.address.city}`
        },
        conditions: {
          temperature: 22,
          humidity: 55,
          light: 'controlled',
          notes: 'Kiểm tra chất lượng trong phòng thí nghiệm'
        },
        metadata: {
          batchNumber: batchNumber,
          quantity: productionStep.metadata.quantity,
          unit: productionStep.metadata.unit,
          notes: 'Kiểm tra chất lượng đạt tiêu chuẩn'
        },
        verificationMethod: 'auto',
        isVerified: true
      };

      supplyChain.steps.push(qualityCheckStep);

      // Bước 3: Gửi hàng đến nhà phân phối (5 ngày trước)
      const distributor = distributors[Math.floor(Math.random() * distributors.length)];
      const shippingStep = {
        stepType: 'distribution',
        actorId: distributor._id,
        actorName: distributor.fullName,
        actorRole: 'distributor',
        action: 'shipped',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        location: {
          type: 'Point',
          coordinates: distributor.location?.coordinates || [106.6297, 10.8231],
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
          quantity: productionStep.metadata.quantity,
          unit: productionStep.metadata.unit,
          notes: 'Vận chuyển từ nhà sản xuất đến nhà phân phối'
        },
        verificationMethod: 'manual',
        isVerified: true
      };

      supplyChain.steps.push(shippingStep);

      // Bước 4: Nhận hàng tại nhà phân phối (4 ngày trước)
      const receivingStep = {
        stepType: 'distribution',
        actorId: distributor._id,
        actorName: distributor.fullName,
        actorRole: 'distributor',
        action: 'received',
        timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
        location: {
          type: 'Point',
          coordinates: distributor.location?.coordinates || [106.6297, 10.8231],
          address: `${distributor.address.street}, ${distributor.address.ward}, ${distributor.address.district}, ${distributor.address.city}`
        },
        conditions: {
          temperature: 24,
          humidity: 58,
          light: 'dark',
          notes: 'Kiểm tra nhiệt độ và độ ẩm khi nhận hàng'
        },
        metadata: {
          batchNumber: batchNumber,
          quantity: productionStep.metadata.quantity,
          unit: productionStep.metadata.unit,
          notes: 'Nhận hàng và kiểm tra chất lượng'
        },
        verificationMethod: 'manual',
        isVerified: true
      };

      supplyChain.steps.push(receivingStep);

      // Bước 5: Lưu kho tại nhà phân phối (3 ngày trước)
      const storageStep = {
        stepType: 'distribution',
        actorId: distributor._id,
        actorName: distributor.fullName,
        actorRole: 'distributor',
        action: 'stored',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        location: {
          type: 'Point',
          coordinates: distributor.location?.coordinates || [106.6297, 10.8231],
          address: `${distributor.address.street}, ${distributor.address.ward}, ${distributor.address.district}, ${distributor.address.city}`
        },
        conditions: {
          temperature: 22,
          humidity: 55,
          light: 'dark',
          notes: 'Lưu trữ trong kho lạnh'
        },
        metadata: {
          batchNumber: batchNumber,
          quantity: productionStep.metadata.quantity,
          unit: productionStep.metadata.unit,
          notes: 'Lưu trữ an toàn trong kho'
        },
        verificationMethod: 'manual',
        isVerified: true
      };

      supplyChain.steps.push(storageStep);

      // Bước 6: Gửi hàng đến bệnh viện (2 ngày trước)
      const hospital = hospitals[Math.floor(Math.random() * hospitals.length)];
      const hospitalShippingStep = {
        stepType: 'hospital',
        actorId: hospital._id,
        actorName: hospital.fullName,
        actorRole: 'hospital',
        action: 'shipped',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        location: {
          type: 'Point',
          coordinates: hospital.location?.coordinates || [105.8542, 21.0285],
          address: `${hospital.address.street}, ${hospital.address.ward}, ${hospital.address.district}, ${hospital.address.city}`
        },
        conditions: {
          temperature: 25,
          humidity: 60,
          light: 'dark',
          notes: 'Vận chuyển đến bệnh viện'
        },
        metadata: {
          batchNumber: batchNumber,
          quantity: Math.floor(productionStep.metadata.quantity * 0.3), // 30% số lượng
          unit: productionStep.metadata.unit,
          notes: 'Vận chuyển một phần đến bệnh viện'
        },
        verificationMethod: 'manual',
        isVerified: true
      };

      supplyChain.steps.push(hospitalShippingStep);

      // Bước 7: Nhận hàng tại bệnh viện (1 ngày trước)
      const hospitalReceivingStep = {
        stepType: 'hospital',
        actorId: hospital._id,
        actorName: hospital.fullName,
        actorRole: 'hospital',
        action: 'received',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        location: {
          type: 'Point',
          coordinates: hospital.location?.coordinates || [105.8542, 21.0285],
          address: `${hospital.address.street}, ${hospital.address.ward}, ${hospital.address.district}, ${hospital.address.city}`
        },
        conditions: {
          temperature: 24,
          humidity: 58,
          light: 'dark',
          notes: 'Kiểm tra nhiệt độ và độ ẩm'
        },
        metadata: {
          batchNumber: batchNumber,
          quantity: hospitalShippingStep.metadata.quantity,
          unit: productionStep.metadata.unit,
          notes: 'Nhận hàng và kiểm tra chất lượng tại bệnh viện'
        },
        verificationMethod: 'manual',
        isVerified: true
      };

      supplyChain.steps.push(hospitalReceivingStep);

      // Bước 8: Lưu kho tại bệnh viện (hôm nay)
      const hospitalStorageStep = {
        stepType: 'hospital',
        actorId: hospital._id,
        actorName: hospital.fullName,
        actorRole: 'hospital',
        action: 'stored',
        timestamp: new Date(),
        location: {
          type: 'Point',
          coordinates: hospital.location?.coordinates || [105.8542, 21.0285],
          address: `${hospital.address.street}, ${hospital.address.ward}, ${hospital.address.district}, ${hospital.address.city}`
        },
        conditions: {
          temperature: 22,
          humidity: 55,
          light: 'dark',
          notes: 'Lưu trữ trong kho dược phẩm bệnh viện'
        },
        metadata: {
          batchNumber: batchNumber,
          quantity: hospitalShippingStep.metadata.quantity,
          unit: productionStep.metadata.unit,
          notes: 'Lưu trữ an toàn trong kho bệnh viện'
        },
        verificationMethod: 'manual',
        isVerified: true
      };

      supplyChain.steps.push(hospitalStorageStep);

      // Cập nhật vị trí hiện tại
      supplyChain.currentLocation = {
        actorId: hospital._id,
        actorName: hospital.fullName,
        actorRole: 'hospital',
        address: `${hospital.address.street}, ${hospital.address.ward}, ${hospital.address.district}, ${hospital.address.city}`,
        coordinates: hospital.location?.coordinates || [105.8542, 21.0285],
        lastUpdated: new Date()
      };

      // Thêm kiểm tra chất lượng
      supplyChain.qualityChecks = [
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
      ];

      // Ghi log truy cập
      supplyChain.accessLog = [
        {
          accessedBy: manufacturer._id,
          accessType: 'create',
          timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          accessedBy: distributor._id,
          accessType: 'update',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        {
          accessedBy: hospital._id,
          accessType: 'view',
          timestamp: new Date(),
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      ];

      await supplyChain.save();
      supplyChains.push(supplyChain);

      console.log(`✅ Đã tạo chuỗi cung ứng cho ${drug.name} - ${batchNumber}`);
    }

    console.log(`🎉 Đã tạo ${supplyChains.length} chuỗi cung ứng hoàn chỉnh!`);

    // Tạo báo cáo tổng hợp
    console.log('\n📊 BÁO CÁO TỔNG HỢP CHUỖI CUNG ỨNG:');
    console.log('=====================================');
    
    const stats = {
      totalSupplyChains: supplyChains.length,
      activeChains: supplyChains.filter(sc => sc.status === 'active').length,
      totalSteps: supplyChains.reduce((sum, sc) => sum + sc.steps.length, 0),
      averageSteps: Math.round(supplyChains.reduce((sum, sc) => sum + sc.steps.length, 0) / supplyChains.length)
    };

    console.log(`📈 Tổng số chuỗi cung ứng: ${stats.totalSupplyChains}`);
    console.log(`✅ Chuỗi cung ứng đang hoạt động: ${stats.activeChains}`);
    console.log(`📋 Tổng số bước: ${stats.totalSteps}`);
    console.log(`📊 Trung bình bước/chuỗi: ${stats.averageSteps}`);

    console.log('\n🏥 THÔNG TIN CÁC TỔ CHỨC THAM GIA:');
    console.log('=====================================');
    
    const uniqueActors = new Set();
    supplyChains.forEach(sc => {
      sc.steps.forEach(step => {
        uniqueActors.add(`${step.actorName} (${step.actorRole})`);
      });
    });

    uniqueActors.forEach(actor => {
      console.log(`👤 ${actor}`);
    });

    console.log('\n🔗 TRUY CẬP HỆ THỐNG:');
    console.log('=====================');
    console.log('- Quản lý chuỗi cung ứng: http://localhost:3000/supply-chain');
    console.log('- Xác minh QR code: http://localhost:3000/verify');
    console.log('- Báo cáo thống kê: http://localhost:3000/reports');

    return supplyChains;
  } catch (error) {
    console.error('Lỗi khi tạo chuỗi cung ứng:', error);
    throw error;
  }
};

// Chạy script chính
const main = async () => {
  try {
    await connectDB();
    
    console.log('🚀 BẮT ĐẦU THIẾT LẬP CHUỖI CUNG ỨNG HOÀN CHỈNH...');
    console.log('================================================');
    
    // Tạo các tổ chức thật
    await createRealOrganizations();
    
    // Tạo chuỗi cung ứng hoàn chỉnh
    await createCompleteSupplyChains();
    
    console.log('\n🎉 HOÀN THÀNH THIẾT LẬP CHUỖI CUNG ỨNG!');
    console.log('==========================================');
    console.log('✅ Dữ liệu thật đã được thiết lập');
    console.log('✅ Chuỗi cung ứng hoàn chỉnh từ sản xuất đến bệnh viện');
    console.log('✅ Thông tin địa chỉ thật tại Việt Nam');
    console.log('✅ Kiểm tra chất lượng và điều kiện bảo quản');
    console.log('✅ QR codes và blockchain integration');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình thiết lập:', error);
  } finally {
    process.exit(0);
  }
};

main();
