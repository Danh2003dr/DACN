const mongoose = require('mongoose');
const User = require('../models/User');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');

// Connect to MongoDB
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

// Setup demo supply chains
const setupSupplyChainDemo = async () => {
  try {
    console.log('🚀 Setting up Supply Chain Demo Data...');

    // Get users
    const admin = await User.findOne({ role: 'admin' });
    const manufacturer = await User.findOne({ role: 'manufacturer' });
    const distributor = await User.findOne({ role: 'distributor' });
    const hospital = await User.findOne({ role: 'hospital' });

    if (!admin || !manufacturer || !distributor || !hospital) {
      console.error('❌ Required users not found. Please run setup-demo-data.js first.');
      return;
    }

    // Get drugs
    const drugs = await Drug.find().limit(3);
    if (drugs.length < 2) {
      console.error('❌ Not enough drugs found. Please run setup-demo-data.js first.');
      return;
    }
    
    console.log(`✅ Found ${drugs.length} drugs for supply chain demo`);

    // Clear existing supply chains
    await SupplyChain.deleteMany({});
    console.log('✅ Cleared existing supply chains');

    // Create demo supply chains
    const demoSupplyChains = [
      {
        drugId: drugs[0]._id,
        drugBatchNumber: 'BATCH-001-2024',
        qrCode: {
          code: 'QR-BATCH-001-2024',
          blockchainId: 'BC-BATCH-001-2024',
          verificationUrl: 'http://localhost:3000/verify/BATCH-001-2024'
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
            timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231], // Ho Chi Minh City
              address: '123 Đường Sản Xuất, Quận 1, TP.HCM'
            },
            metadata: {
              batchNumber: 'BATCH-001-2024',
              quantity: 1000,
              unit: 'tablet',
              notes: 'Lô sản xuất đầu tiên của năm 2024'
            },
            verificationMethod: 'auto'
          },
          {
            stepType: 'distribution',
            actorId: distributor._id,
            actorName: distributor.fullName,
            actorRole: 'distributor',
            action: 'shipped',
            timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: '456 Kho Phân Phối, Quận 2, TP.HCM'
            },
            conditions: {
              temperature: 25,
              humidity: 60,
              light: 'dark',
              notes: 'Bảo quản trong kho lạnh'
            },
            metadata: {
              quantity: 1000,
              unit: 'tablet',
              notes: 'Đóng gói và vận chuyển đến bệnh viện'
            },
            verificationMethod: 'manual'
          },
          {
            stepType: 'hospital',
            actorId: hospital._id,
            actorName: hospital.fullName,
            actorRole: 'hospital',
            action: 'received',
            timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: '789 Bệnh viện ABC, Quận 3, TP.HCM'
            },
            conditions: {
              temperature: 24,
              humidity: 58,
              light: 'dark',
              notes: 'Kiểm tra nhiệt độ và độ ẩm'
            },
            metadata: {
              quantity: 1000,
              unit: 'tablet',
              notes: 'Nhận hàng và kiểm tra chất lượng'
            },
            verificationMethod: 'manual'
          },
          {
            stepType: 'hospital',
            actorId: hospital._id,
            actorName: hospital.fullName,
            actorRole: 'hospital',
            action: 'stored',
            timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: '789 Bệnh viện ABC - Kho Dược, Quận 3, TP.HCM'
            },
            conditions: {
              temperature: 22,
              humidity: 55,
              light: 'dark',
              notes: 'Lưu trữ trong kho dược phẩm'
            },
            metadata: {
              quantity: 1000,
              unit: 'tablet',
              notes: 'Lưu trữ an toàn trong kho'
            },
            verificationMethod: 'manual'
          }
        ],
        currentLocation: {
          actorId: hospital._id,
          actorName: hospital.fullName,
          actorRole: 'hospital',
          address: '789 Bệnh viện ABC - Kho Dược, Quận 3, TP.HCM',
          coordinates: [106.6297, 10.8231],
          lastUpdated: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)
        },
        qualityChecks: [
          {
            checkType: 'temperature',
            result: 'pass',
            value: '22°C',
            checkedBy: hospital._id,
            checkedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            notes: 'Nhiệt độ phù hợp'
          },
          {
            checkType: 'humidity',
            result: 'pass',
            value: '55%',
            checkedBy: hospital._id,
            checkedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            notes: 'Độ ẩm trong phạm vi cho phép'
          },
          {
            checkType: 'integrity',
            result: 'pass',
            value: 'Good',
            checkedBy: hospital._id,
            checkedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            notes: 'Bao bì nguyên vẹn'
          }
        ]
      },
      {
        drugId: drugs[1]._id,
        drugBatchNumber: 'BATCH-002-2024',
        qrCode: {
          code: 'QR-BATCH-002-2024',
          blockchainId: 'BC-BATCH-002-2024',
          verificationUrl: 'http://localhost:3000/verify/BATCH-002-2024'
        },
        status: 'recalled',
        createdBy: manufacturer._id,
        steps: [
          {
            stepType: 'production',
            actorId: manufacturer._id,
            actorName: manufacturer.fullName,
            actorRole: 'manufacturer',
            action: 'created',
            timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 days ago
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: '123 Đường Sản Xuất, Quận 1, TP.HCM'
            },
            metadata: {
              batchNumber: 'BATCH-002-2024',
              quantity: 500,
              unit: 'bottle',
              notes: 'Lô sản xuất thứ hai'
            },
            verificationMethod: 'auto'
          },
          {
            stepType: 'distribution',
            actorId: distributor._id,
            actorName: distributor.fullName,
            actorRole: 'distributor',
            action: 'shipped',
            timestamp: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000), // 12 days ago
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: '456 Kho Phân Phối, Quận 2, TP.HCM'
            },
            metadata: {
              quantity: 500,
              unit: 'bottle',
              notes: 'Vận chuyển đến bệnh viện'
            },
            verificationMethod: 'manual'
          }
        ],
        currentLocation: {
          actorId: distributor._id,
          actorName: distributor.fullName,
          actorRole: 'distributor',
          address: '456 Kho Phân Phối, Quận 2, TP.HCM',
          coordinates: [106.6297, 10.8231],
          lastUpdated: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000)
        },
        recall: {
          isRecalled: true,
          recallReason: 'Phát hiện tạp chất trong quá trình kiểm tra',
          recallDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
          recalledBy: manufacturer._id,
          recallAction: 'Thu hồi toàn bộ lô',
          affectedUnits: ['BATCH-002-2024']
        },
        qualityChecks: [
          {
            checkType: 'integrity',
            result: 'fail',
            value: 'Contaminated',
            checkedBy: distributor._id,
            checkedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
            notes: 'Phát hiện tạp chất, cần thu hồi'
          }
        ]
      },
      ...(drugs.length >= 3 ? [{
        drugId: drugs[2]._id,
        drugBatchNumber: 'BATCH-003-2024',
        qrCode: {
          code: 'QR-BATCH-003-2024',
          blockchainId: 'BC-BATCH-003-2024',
          verificationUrl: 'http://localhost:3000/verify/BATCH-003-2024'
        },
        status: 'completed',
        createdBy: manufacturer._id,
        steps: [
          {
            stepType: 'production',
            actorId: manufacturer._id,
            actorName: manufacturer.fullName,
            actorRole: 'manufacturer',
            action: 'created',
            timestamp: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000), // 21 days ago
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: '123 Đường Sản Xuất, Quận 1, TP.HCM'
            },
            metadata: {
              batchNumber: 'BATCH-003-2024',
              quantity: 200,
              unit: 'box',
              notes: 'Lô sản xuất đặc biệt'
            },
            verificationMethod: 'auto'
          },
          {
            stepType: 'distribution',
            actorId: distributor._id,
            actorName: distributor.fullName,
            actorRole: 'distributor',
            action: 'shipped',
            timestamp: new Date(Date.now() - 19 * 24 * 60 * 60 * 1000), // 19 days ago
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: '456 Kho Phân Phối, Quận 2, TP.HCM'
            },
            metadata: {
              quantity: 200,
              unit: 'box',
              notes: 'Vận chuyển đặc biệt'
            },
            verificationMethod: 'manual'
          },
          {
            stepType: 'hospital',
            actorId: hospital._id,
            actorName: hospital.fullName,
            actorRole: 'hospital',
            action: 'received',
            timestamp: new Date(Date.now() - 17 * 24 * 60 * 60 * 1000), // 17 days ago
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: '789 Bệnh viện ABC, Quận 3, TP.HCM'
            },
            metadata: {
              quantity: 200,
              unit: 'box',
              notes: 'Nhận hàng đặc biệt'
            },
            verificationMethod: 'manual'
          },
          {
            stepType: 'hospital',
            actorId: hospital._id,
            actorName: hospital.fullName,
            actorRole: 'hospital',
            action: 'stored',
            timestamp: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // 16 days ago
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: '789 Bệnh viện ABC - Kho Dược, Quận 3, TP.HCM'
            },
            metadata: {
              quantity: 200,
              unit: 'box',
              notes: 'Lưu trữ đặc biệt'
            },
            verificationMethod: 'manual'
          },
          {
            stepType: 'hospital',
            actorId: hospital._id,
            actorName: hospital.fullName,
            actorRole: 'hospital',
            action: 'dispensed',
            timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            location: {
              type: 'Point',
              coordinates: [106.6297, 10.8231],
              address: '789 Bệnh viện ABC - Phòng Cấp phát, Quận 3, TP.HCM'
            },
            metadata: {
              quantity: 200,
              unit: 'box',
              notes: 'Đã cấp phát cho bệnh nhân'
            },
            verificationMethod: 'manual'
          }
        ],
        currentLocation: {
          actorId: hospital._id,
          actorName: hospital.fullName,
          actorRole: 'hospital',
          address: '789 Bệnh viện ABC - Phòng Cấp phát, Quận 3, TP.HCM',
          coordinates: [106.6297, 10.8231],
          lastUpdated: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        qualityChecks: [
          {
            checkType: 'temperature',
            result: 'pass',
            value: '20°C',
            checkedBy: hospital._id,
            checkedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
            notes: 'Nhiệt độ tối ưu'
          },
          {
            checkType: 'humidity',
            result: 'pass',
            value: '50%',
            checkedBy: hospital._id,
            checkedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
            notes: 'Độ ẩm lý tưởng'
          },
          {
            checkType: 'integrity',
            result: 'pass',
            value: 'Excellent',
            checkedBy: hospital._id,
            checkedAt: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000),
            notes: 'Chất lượng tốt'
          },
          {
            checkType: 'expiry',
            result: 'pass',
            value: '2025-12-31',
            checkedBy: hospital._id,
            checkedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            notes: 'Còn hạn sử dụng dài'
          }
        ]
      }] : [])
    ];

    // Create supply chains
    for (const supplyChainData of demoSupplyChains) {
      const supplyChain = new SupplyChain(supplyChainData);
      await supplyChain.save();
      console.log(`✅ Created supply chain: ${supplyChain.drugBatchNumber}`);
    }

    console.log('🎉 Supply Chain Demo Data Setup Complete!');
    console.log('\n📋 Created Supply Chains:');
    console.log('1. BATCH-001-2024 - Active (Currently at Hospital)');
    console.log('2. BATCH-002-2024 - Recalled (Contaminated)');
    console.log('3. BATCH-003-2024 - Completed (Dispensed to Patient)');
    
    console.log('\n🔗 Access URLs:');
    console.log('- Supply Chain Management: http://localhost:3000/supply-chain');
    console.log('- QR Verification: http://localhost:3000/verify/BATCH-001-2024');

  } catch (error) {
    console.error('❌ Error setting up supply chain demo:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await setupSupplyChainDemo();
  process.exit(0);
};

main();
