const mongoose = require('mongoose');
require('dotenv').config();
const Drug = require('../models/Drug');
const User = require('../models/User');
const SupplyChain = require('../models/SupplyChain');

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability');
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Tạo hoặc lấy các tổ chức trong chuỗi cung ứng
const setupOrganizations = async () => {
  try {
    console.log('Đang thiết lập các tổ chức trong chuỗi cung ứng...');
    
    // Lấy hoặc tạo nhà sản xuất
    let manufacturer = await User.findOne({ role: 'manufacturer' });
    if (!manufacturer) {
      manufacturer = await User.create({
        username: 'manufacturer_default',
        email: 'manufacturer@example.com',
        password: 'default123',
        fullName: 'Công ty Dược phẩm ABC',
        phone: '0123456789',
        address: {
          street: '123 Đường ABC',
          ward: 'Phường 1',
          district: 'Quận 1',
          city: 'TP.HCM'
        },
        role: 'manufacturer',
        organizationId: 'MFG_DEFAULT',
        organizationInfo: {
          name: 'Công ty Dược phẩm ABC',
          license: 'LIC_DEFAULT',
          type: 'pharmaceutical_company'
        },
        mustChangePassword: true
      });
    }
    
    // Tạo hoặc lấy nhà phân phối
    let distributor = await User.findOne({ role: 'distributor' });
    if (!distributor) {
      distributor = await User.create({
        username: 'distributor_default',
        email: 'distributor@example.com',
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
          type: 'distribution_company',
          description: 'Nhà phân phối dược phẩm hàng đầu tại TP.HCM'
        },
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231],
          address: 'Số 15 Đường 3/2, Phường 11, Quận 10, TP. Hồ Chí Minh'
        },
        mustChangePassword: true
      });
    }
    
    // Tạo hoặc lấy bệnh viện
    let hospital = await User.findOne({ role: 'hospital' });
    if (!hospital) {
      hospital = await User.create({
        username: 'hospital_default',
        email: 'hospital@example.com',
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
          description: 'Bệnh viện đa khoa trung ương hàng đầu'
        },
        location: {
          type: 'Point',
          coordinates: [105.8542, 21.0285],
          address: 'Số 78 Giải Phóng, Phường Phương Mai, Quận Đống Đa, Hà Nội'
        },
        mustChangePassword: true
      });
    }
    
    // Tạo hoặc lấy bệnh nhân
    let patient = await User.findOne({ role: 'patient' });
    if (!patient) {
      patient = await User.create({
        username: 'patient_default',
        email: 'patient@example.com',
        password: 'default123',
        fullName: 'Bệnh nhân Mẫu',
        phone: '0912345678',
        address: {
          street: 'Số 123 Đường ABC',
          ward: 'Phường 1',
          district: 'Quận 1',
          city: 'TP.HCM'
        },
        role: 'patient',
        patientId: 'PAT_001',
        mustChangePassword: true
      });
    }
    
    return { manufacturer, distributor, hospital, patient };
  } catch (error) {
    console.error('Lỗi khi thiết lập tổ chức:', error);
    throw error;
  }
};

// Tạo chuỗi cung ứng cho một thuốc
const createSupplyChainForDrug = async (drug, organizations) => {
  const { manufacturer, distributor, hospital, patient } = organizations;
  
  try {
    // Kiểm tra xem đã có supply chain chưa
    const existing = await SupplyChain.findOne({ drugId: drug._id });
    if (existing) {
      console.log(`  ⏭ Đã tồn tại supply chain cho ${drug.name}`);
      return existing;
    }
    
    // Tạo timeline ngẫu nhiên nhưng hợp lý
    const productionDate = drug.productionDate || new Date('2024-01-01');
    const daysToQualityCheck = 2;
    const daysToPackaging = 5;
    const daysToDistribution = 10;
    const daysToHospital = 20;
    const daysToPatient = 30;
    
    const qualityCheckDate = new Date(productionDate);
    qualityCheckDate.setDate(qualityCheckDate.getDate() + daysToQualityCheck);
    
    const packagingDate = new Date(qualityCheckDate);
    packagingDate.setDate(packagingDate.getDate() + (daysToPackaging - daysToQualityCheck));
    
    const distributionDate = new Date(packagingDate);
    distributionDate.setDate(distributionDate.getDate() + (daysToDistribution - daysToPackaging));
    
    const hospitalDate = new Date(distributionDate);
    hospitalDate.setDate(hospitalDate.getDate() + (daysToHospital - daysToDistribution));
    
    const patientDate = new Date(hospitalDate);
    patientDate.setDate(patientDate.getDate() + (daysToPatient - daysToHospital));
    
    // Tạo SupplyChain record
    const supplyChain = new SupplyChain({
      drugId: drug._id,
      drugBatchNumber: drug.batchNumber,
      qrCode: {
        code: drug.qrCode?.data ? JSON.parse(drug.qrCode.data).drugId : `${drug.batchNumber}-${Date.now()}`,
        blockchainId: drug.blockchain?.blockchainId || null,
        verificationUrl: drug.qrCode?.verificationUrl || `${process.env.CLIENT_URL || 'http://localhost:3000'}/verify/${drug.drugId}`
      },
      status: 'active',
      createdBy: manufacturer._id,
      steps: [],
      currentLocation: {
        actorId: patient._id,
        actorName: patient.fullName,
        actorRole: 'patient',
        address: patient.address ? `${patient.address.street}, ${patient.address.ward}, ${patient.address.district}, ${patient.address.city}` : 'N/A',
        coordinates: patient.location?.coordinates || null,
        lastUpdated: patientDate
      },
      blockchain: {
        blockchainId: drug.blockchain?.blockchainId || null,
        isOnBlockchain: !!drug.blockchain?.blockchainId
      }
    });
    
    // Bước 1: Sản xuất
    supplyChain.steps.push({
      stepType: 'production',
      actorId: manufacturer._id,
      actorName: manufacturer.fullName,
      actorRole: 'manufacturer',
      action: 'created',
      timestamp: productionDate,
      location: {
        type: 'Point',
        coordinates: manufacturer.location?.coordinates || [106.6297, 10.8231],
        address: manufacturer.address ? `${manufacturer.address.street}, ${manufacturer.address.ward}, ${manufacturer.address.district}, ${manufacturer.address.city}` : 'Nhà máy sản xuất'
      },
      conditions: {
        temperature: 20,
        humidity: 50,
        light: 'Bảo quản nơi khô ráo, thoáng mát',
        notes: 'Sản xuất lô thuốc mới'
      },
      metadata: {
        batchNumber: drug.batchNumber,
        quantity: 1000,
        unit: 'viên',
        expiryDate: drug.expiryDate,
        notes: `Sản xuất ${drug.name}`
      },
      isVerified: true,
      verificationMethod: 'auto'
    });
    
    // Bước 2: Kiểm định chất lượng
    supplyChain.steps.push({
      stepType: 'production',
      actorId: manufacturer._id,
      actorName: manufacturer.fullName,
      actorRole: 'manufacturer',
      action: 'quality_check',
      timestamp: qualityCheckDate,
      location: {
        type: 'Point',
        coordinates: manufacturer.location?.coordinates || [106.6297, 10.8231],
        address: 'Phòng kiểm định chất lượng'
      },
      conditions: {
        temperature: 22,
        humidity: 55,
        light: 'Phòng kiểm định',
        notes: 'Kiểm tra chất lượng đạt chuẩn'
      },
      metadata: {
        batchNumber: drug.batchNumber,
        quantity: 1000,
        unit: 'viên',
        expiryDate: drug.expiryDate,
        notes: `Kết quả kiểm định: ${drug.qualityTest?.testResult || 'đạt'}`
      },
      isVerified: true,
      verificationMethod: 'auto'
    });
    
    // Bước 3: Đóng gói
    supplyChain.steps.push({
      stepType: 'production',
      actorId: manufacturer._id,
      actorName: manufacturer.fullName,
      actorRole: 'manufacturer',
      action: 'stored',
      timestamp: packagingDate,
      location: {
        type: 'Point',
        coordinates: manufacturer.location?.coordinates || [106.6297, 10.8231],
        address: 'Kho đóng gói'
      },
      conditions: {
        temperature: 18,
        humidity: 50,
        light: 'Kho bảo quản',
        notes: 'Đóng gói và niêm phong'
      },
      metadata: {
        batchNumber: drug.batchNumber,
        quantity: 1000,
        unit: 'viên',
        expiryDate: drug.expiryDate,
        notes: `Đóng gói theo quy cách: ${drug.packaging?.specifications || 'Hộp'}`
      },
      isVerified: true,
      verificationMethod: 'auto'
    });
    
    // Bước 4: Giao cho nhà phân phối
    supplyChain.steps.push({
      stepType: 'distribution',
      actorId: distributor._id,
      actorName: distributor.fullName,
      actorRole: 'distributor',
      action: 'received',
      timestamp: distributionDate,
      location: {
        type: 'Point',
        coordinates: distributor.location?.coordinates || [106.6297, 10.8231],
        address: distributor.address ? `${distributor.address.street}, ${distributor.address.ward}, ${distributor.address.district}, ${distributor.address.city}` : 'Kho phân phối'
      },
      conditions: {
        temperature: 20,
        humidity: 52,
        light: 'Kho phân phối',
        notes: 'Nhận hàng từ nhà sản xuất'
      },
      metadata: {
        batchNumber: drug.batchNumber,
        quantity: 1000,
        unit: 'viên',
        expiryDate: drug.expiryDate,
        notes: 'Nhận hàng và nhập kho'
      },
      isVerified: true,
      verificationMethod: 'qr_scan'
    });
    
    // Bước 5: Phân phối đến bệnh viện
    supplyChain.steps.push({
      stepType: 'hospital',
      actorId: hospital._id,
      actorName: hospital.fullName,
      actorRole: 'hospital',
      action: 'received',
      timestamp: hospitalDate,
      location: {
        type: 'Point',
        coordinates: hospital.location?.coordinates || [105.8542, 21.0285],
        address: hospital.address ? `${hospital.address.street}, ${hospital.address.ward}, ${hospital.address.district}, ${hospital.address.city}` : 'Bệnh viện'
      },
      conditions: {
        temperature: 22,
        humidity: 48,
        light: 'Kho dược phẩm bệnh viện',
        notes: 'Nhận hàng từ nhà phân phối'
      },
      metadata: {
        batchNumber: drug.batchNumber,
        quantity: 500,
        unit: 'viên',
        expiryDate: drug.expiryDate,
        notes: 'Nhập kho dược phẩm bệnh viện'
      },
      isVerified: true,
      verificationMethod: 'qr_scan'
    });
    
    // Bước 6: Cấp phát cho bệnh nhân
    supplyChain.steps.push({
      stepType: 'patient',
      actorId: patient._id,
      actorName: patient.fullName,
      actorRole: 'patient',
      action: 'dispensed',
      timestamp: patientDate,
      location: {
        type: 'Point',
        coordinates: patient.location?.coordinates || [106.6297, 10.8231],
        address: patient.address ? `${patient.address.street}, ${patient.address.ward}, ${patient.address.district}, ${patient.address.city}` : 'Nơi sử dụng'
      },
      conditions: {
        temperature: 25,
        humidity: 60,
        light: 'Nơi sử dụng',
        notes: 'Cấp phát cho bệnh nhân'
      },
      metadata: {
        batchNumber: drug.batchNumber,
        quantity: 30,
        unit: 'viên',
        expiryDate: drug.expiryDate,
        notes: `Cấp phát ${drug.name} cho bệnh nhân`
      },
      isVerified: true,
      verificationMethod: 'qr_scan'
    });
    
    // Thêm quality checks
    supplyChain.qualityChecks.push(
      {
        checkType: 'temperature',
        result: 'pass',
        value: '20°C',
        checkedBy: manufacturer._id,
        checkedAt: qualityCheckDate,
        notes: 'Nhiệt độ bảo quản đạt chuẩn'
      },
      {
        checkType: 'humidity',
        result: 'pass',
        value: '50%',
        checkedBy: manufacturer._id,
        checkedAt: qualityCheckDate,
        notes: 'Độ ẩm trong giới hạn cho phép'
      },
      {
        checkType: 'integrity',
        result: 'pass',
        value: 'OK',
        checkedBy: distributor._id,
        checkedAt: distributionDate,
        notes: 'Bao bì nguyên vẹn, chưa mở niêm phong'
      },
      {
        checkType: 'expiry',
        result: 'pass',
        value: drug.expiryDate.toISOString(),
        checkedBy: hospital._id,
        checkedAt: hospitalDate,
        notes: `Hạn sử dụng: ${drug.expiryDate.toLocaleDateString('vi-VN')}`
      }
    );
    
    await supplyChain.save();
    
    // Cập nhật trạng thái phân phối trong Drug
    drug.distribution.status = 'đã_sử_dụng';
    drug.distribution.currentLocation = {
      type: 'bệnh_nhân',
      organizationId: patient.patientId || patient._id.toString(),
      organizationName: patient.fullName,
      address: patient.address ? `${patient.address.street}, ${patient.address.ward}, ${patient.address.district}, ${patient.address.city}` : 'N/A'
    };
    
    // Thêm lịch sử phân phối
    drug.distribution.history.push(
      {
        status: 'sản_xuất',
        location: 'Nhà máy',
        organizationId: manufacturer.organizationId,
        organizationName: manufacturer.fullName,
        timestamp: productionDate,
        note: 'Sản xuất lô thuốc',
        updatedBy: manufacturer._id
      },
      {
        status: 'kiểm_định',
        location: 'Phòng kiểm định',
        organizationId: manufacturer.organizationId,
        organizationName: manufacturer.fullName,
        timestamp: qualityCheckDate,
        note: 'Kiểm định chất lượng',
        updatedBy: manufacturer._id
      },
      {
        status: 'đóng_gói',
        location: 'Kho đóng gói',
        organizationId: manufacturer.organizationId,
        organizationName: manufacturer.fullName,
        timestamp: packagingDate,
        note: 'Đóng gói hoàn thành',
        updatedBy: manufacturer._id
      },
      {
        status: 'vận_chuyển',
        location: 'Đang vận chuyển',
        organizationId: distributor.organizationId,
        organizationName: distributor.fullName,
        timestamp: distributionDate,
        note: 'Giao cho nhà phân phối',
        updatedBy: distributor._id
      },
      {
        status: 'tại_kho',
        location: 'Kho phân phối',
        organizationId: distributor.organizationId,
        organizationName: distributor.fullName,
        timestamp: distributionDate,
        note: 'Nhập kho phân phối',
        updatedBy: distributor._id
      },
      {
        status: 'tại_kho',
        location: 'Kho bệnh viện',
        organizationId: hospital.organizationId,
        organizationName: hospital.fullName,
        timestamp: hospitalDate,
        note: 'Nhập kho bệnh viện',
        updatedBy: hospital._id
      },
      {
        status: 'đã_bán',
        location: 'Bệnh viện',
        organizationId: hospital.organizationId,
        organizationName: hospital.fullName,
        timestamp: patientDate,
        note: 'Cấp phát cho bệnh nhân',
        updatedBy: hospital._id
      },
      {
        status: 'đã_sử_dụng',
        location: 'Bệnh nhân',
        organizationId: patient.patientId,
        organizationName: patient.fullName,
        timestamp: patientDate,
        note: 'Bệnh nhân đã nhận thuốc',
        updatedBy: patient._id
      }
    );
    
    await drug.save();
    
    console.log(`  ✓ Đã tạo supply chain cho ${drug.name} (${drug.batchNumber})`);
    return supplyChain;
  } catch (error) {
    console.error(`  ✗ Lỗi khi tạo supply chain cho ${drug.name}:`, error.message);
    throw error;
  }
};

// Thiết lập chuỗi cung ứng cho tất cả thuốc thật
const setupRealDrugsSupplyChain = async () => {
  try {
    await connectDB();
    
    console.log('🚀 Bắt đầu thiết lập chuỗi cung ứng cho thuốc thật...\n');
    
    // Thiết lập các tổ chức
    const organizations = await setupOrganizations();
    console.log('✓ Đã thiết lập các tổ chức\n');
    
    // Lấy tất cả thuốc từ database
    const drugs = await Drug.find({}).limit(50); // Giới hạn 50 thuốc để tránh quá tải
    console.log(`Tìm thấy ${drugs.length} thuốc trong database\n`);
    
    let success = 0;
    let failed = 0;
    let skipped = 0;
    
    for (const drug of drugs) {
      try {
        const existing = await SupplyChain.findOne({ drugId: drug._id });
        if (existing) {
          skipped++;
          continue;
        }
        
        await createSupplyChainForDrug(drug, organizations);
        success++;
      } catch (error) {
        console.error(`Lỗi với ${drug.name}:`, error.message);
        failed++;
      }
    }
    
    console.log('\n=== KẾT QUẢ THIẾT LẬP CHUỖI CUNG ỨNG ===');
    console.log(`✓ Thành công: ${success} thuốc`);
    console.log(`⏭ Đã bỏ qua: ${skipped} thuốc (đã có supply chain)`);
    console.log(`✗ Thất bại: ${failed} thuốc`);
    console.log(`📦 Tổng cộng: ${drugs.length} thuốc`);
    
    console.log('\n✓ Hoàn thành!');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi thiết lập chuỗi cung ứng:', error);
    process.exit(1);
  }
};

// Chạy script
setupRealDrugsSupplyChain();

