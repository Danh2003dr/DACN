const mongoose = require('mongoose');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const User = require('../models/User');

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

// Tạo thư mục lưu QR codes nếu chưa có
const ensureQRDirectory = () => {
  const qrDir = path.join(__dirname, '..', 'qr-codes');
  if (!fs.existsSync(qrDir)) {
    fs.mkdirSync(qrDir, { recursive: true });
  }
  return qrDir;
};

// Tạo QR code cho thuốc
const generateDrugQRCode = async (drug, qrDir) => {
  try {
    // Tạo dữ liệu QR code
    const qrData = {
      drugId: drug.drugId,
      name: drug.name,
      batchNumber: drug.batchNumber,
      manufacturer: drug.manufacturerId,
      productionDate: drug.productionDate,
      expiryDate: drug.expiryDate,
      qualityTest: drug.qualityTest,
      currentStatus: drug.distribution?.status || 'sản_xuất',
      currentLocation: drug.distribution?.currentLocation || null,
      isRecalled: drug.isRecalled || false,
      timestamp: Date.now(),
      verificationUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify/${drug.drugId}`,
      blockchainId: drug.blockchain?.blockchainId || `BC_${drug.drugId}`,
      digitalSignature: drug.blockchain?.digitalSignature || null
    };

    // Tạo QR code image
    const qrCodeData = JSON.stringify(qrData);
    const qrCodeFileName = `${drug.drugId}.png`;
    const qrCodePath = path.join(qrDir, qrCodeFileName);

    // Tạo QR code với options
    const qrOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    };

    await QRCode.toFile(qrCodePath, qrCodeData, qrOptions);

    // Cập nhật thông tin QR code trong database
    drug.qrCode = {
      data: qrCodeData,
      imageUrl: `/qr-codes/${qrCodeFileName}`,
      generatedAt: new Date(),
      blockchainId: qrData.blockchainId,
      verificationUrl: qrData.verificationUrl
    };

    await drug.save();

    console.log(`✅ Đã tạo QR code cho ${drug.name} - ${drug.drugId}`);
    return qrCodePath;
  } catch (error) {
    console.error(`❌ Lỗi khi tạo QR code cho ${drug.name}:`, error);
    throw error;
  }
};

// Tạo QR code cho chuỗi cung ứng
const generateSupplyChainQRCode = async (supplyChain, qrDir) => {
  try {
    // Tạo dữ liệu QR code cho chuỗi cung ứng
    const qrData = {
      supplyChainId: supplyChain._id,
      drugBatchNumber: supplyChain.drugBatchNumber,
      drugId: supplyChain.drugId,
      status: supplyChain.status,
      currentLocation: supplyChain.currentLocation,
      totalSteps: supplyChain.steps.length,
      lastStep: supplyChain.steps[supplyChain.steps.length - 1],
      qualityChecks: supplyChain.qualityChecks,
      isRecalled: supplyChain.recall?.isRecalled || false,
      recallReason: supplyChain.recall?.recallReason || null,
      timestamp: Date.now(),
      verificationUrl: supplyChain.qrCode.verificationUrl,
      blockchainId: supplyChain.qrCode.blockchainId
    };

    // Tạo QR code image
    const qrCodeData = JSON.stringify(qrData);
    const qrCodeFileName = `SC_${supplyChain.drugBatchNumber}.png`;
    const qrCodePath = path.join(qrDir, qrCodeFileName);

    // Tạo QR code với options
    const qrOptions = {
      type: 'png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 300
    };

    await QRCode.toFile(qrCodePath, qrCodeData, qrOptions);

    // Cập nhật thông tin QR code trong database
    supplyChain.qrCode = {
      code: qrCodeData,
      blockchainId: qrData.blockchainId,
      verificationUrl: qrData.verificationUrl
    };

    await supplyChain.save();

    console.log(`✅ Đã tạo QR code cho chuỗi cung ứng ${supplyChain.drugBatchNumber}`);
    return qrCodePath;
  } catch (error) {
    console.error(`❌ Lỗi khi tạo QR code cho chuỗi cung ứng ${supplyChain.drugBatchNumber}:`, error);
    throw error;
  }
};

// Tạo blockchain integration
const generateBlockchainIntegration = async (drug, supplyChain) => {
  try {
    // Tạo blockchain ID duy nhất
    const blockchainId = `BC_${drug.drugId}_${Date.now()}`;
    
    // Tạo digital signature (mô phỏng)
    const digitalSignature = `SIG_${drug.drugId}_${Date.now()}`;
    
    // Tạo data hash
    const dataHash = `HASH_${drug.drugId}_${Date.now()}`;
    
    // Cập nhật thông tin blockchain cho thuốc
    drug.blockchain = {
      blockchainId: blockchainId,
      transactionHash: `TX_${drug.drugId}_${Date.now()}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
      blockHash: `BLOCK_${drug.drugId}_${Date.now()}`,
      gasUsed: Math.floor(Math.random() * 100000) + 50000,
      contractAddress: `0x${Math.random().toString(16).substr(2, 40)}`,
      isOnBlockchain: true,
      lastUpdated: new Date(),
      digitalSignature: digitalSignature,
      dataHash: dataHash,
      blockchainTimestamp: Date.now(),
      blockchainStatus: 'confirmed',
      transactionHistory: [
        {
          transactionHash: `TX_${drug.drugId}_${Date.now()}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
          timestamp: Date.now(),
          action: 'create',
          details: `Tạo thuốc ${drug.name} trên blockchain`
        }
      ]
    };

    await drug.save();

    // Cập nhật thông tin blockchain cho chuỗi cung ứng
    supplyChain.blockchain = {
      contractAddress: drug.blockchain.contractAddress,
      blockchainId: blockchainId,
      isOnBlockchain: true,
      lastBlockchainUpdate: new Date()
    };

    // Cập nhật blockchain info cho các bước
    supplyChain.steps.forEach(step => {
      step.blockchain = {
        transactionHash: `TX_${step.action}_${Date.now()}`,
        blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
        gasUsed: Math.floor(Math.random() * 50000) + 20000,
        timestamp: new Date()
      };
    });

    await supplyChain.save();

    console.log(`✅ Đã tích hợp blockchain cho ${drug.name} - ${blockchainId}`);
    return blockchainId;
  } catch (error) {
    console.error(`❌ Lỗi khi tích hợp blockchain cho ${drug.name}:`, error);
    throw error;
  }
};

// Tạo báo cáo QR codes
const generateQRReport = async (qrDir) => {
  try {
    const reportData = {
      generatedAt: new Date(),
      totalQRCodes: 0,
      drugQRCodes: [],
      supplyChainQRCodes: [],
      blockchainIntegrations: [],
      summary: {
        totalDrugs: 0,
        totalSupplyChains: 0,
        totalBlockchainIntegrations: 0
      }
    };

    // Đếm QR codes đã tạo
    const qrFiles = fs.readdirSync(qrDir);
    reportData.totalQRCodes = qrFiles.length;

    // Lấy thông tin thuốc
    const drugs = await Drug.find().populate('manufacturerId', 'fullName organizationInfo');
    reportData.summary.totalDrugs = drugs.length;

    drugs.forEach(drug => {
      if (drug.qrCode && drug.qrCode.data) {
        reportData.drugQRCodes.push({
          drugId: drug.drugId,
          name: drug.name,
          batchNumber: drug.batchNumber,
          manufacturer: drug.manufacturerId?.fullName || 'Unknown',
          qrCodeUrl: drug.qrCode.imageUrl,
          blockchainId: drug.blockchain?.blockchainId,
          isOnBlockchain: drug.blockchain?.isOnBlockchain || false
        });
      }
    });

    // Lấy thông tin chuỗi cung ứng
    const supplyChains = await SupplyChain.find().populate('drugId', 'name batchNumber');
    reportData.summary.totalSupplyChains = supplyChains.length;

    supplyChains.forEach(supplyChain => {
      if (supplyChain.qrCode && supplyChain.qrCode.code) {
        reportData.supplyChainQRCodes.push({
          drugBatchNumber: supplyChain.drugBatchNumber,
          drugName: supplyChain.drugId?.name || 'Unknown',
          status: supplyChain.status,
          totalSteps: supplyChain.steps.length,
          currentLocation: supplyChain.currentLocation?.actorName || 'Unknown',
          blockchainId: supplyChain.blockchain?.blockchainId,
          isOnBlockchain: supplyChain.blockchain?.isOnBlockchain || false
        });
      }
    });

    // Lấy thông tin blockchain
    const blockchainDrugs = drugs.filter(drug => drug.blockchain?.isOnBlockchain);
    reportData.summary.totalBlockchainIntegrations = blockchainDrugs.length;

    blockchainDrugs.forEach(drug => {
      reportData.blockchainIntegrations.push({
        drugId: drug.drugId,
        name: drug.name,
        blockchainId: drug.blockchain.blockchainId,
        contractAddress: drug.blockchain.contractAddress,
        transactionHash: drug.blockchain.transactionHash,
        blockNumber: drug.blockchain.blockNumber,
        gasUsed: drug.blockchain.gasUsed,
        blockchainStatus: drug.blockchain.blockchainStatus
      });
    });

    // Lưu báo cáo
    const reportPath = path.join(qrDir, 'qr-codes-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));

    console.log(`📊 Báo cáo QR codes đã được lưu tại: ${reportPath}`);
    return reportData;
  } catch (error) {
    console.error('❌ Lỗi khi tạo báo cáo QR codes:', error);
    throw error;
  }
};

// Chạy script chính
const main = async () => {
  try {
    await connectDB();
    
    console.log('🚀 BẮT ĐẦU TẠO QR CODES VÀ TÍCH HỢP BLOCKCHAIN...');
    console.log('================================================');
    
    // Tạo thư mục QR codes
    const qrDir = ensureQRDirectory();
    console.log(`📁 Thư mục QR codes: ${qrDir}`);

    // Lấy tất cả thuốc
    const drugs = await Drug.find().populate('manufacturerId', 'fullName organizationInfo');
    console.log(`📦 Tìm thấy ${drugs.length} thuốc`);

    // Lấy tất cả chuỗi cung ứng
    const supplyChains = await SupplyChain.find().populate('drugId', 'name batchNumber');
    console.log(`🔗 Tìm thấy ${supplyChains.length} chuỗi cung ứng`);

    // Tạo QR codes cho thuốc
    console.log('\n📱 Tạo QR codes cho thuốc...');
    for (const drug of drugs) {
      await generateDrugQRCode(drug, qrDir);
    }

    // Tạo QR codes cho chuỗi cung ứng
    console.log('\n🔗 Tạo QR codes cho chuỗi cung ứng...');
    for (const supplyChain of supplyChains) {
      await generateSupplyChainQRCode(supplyChain, qrDir);
    }

    // Tích hợp blockchain
    console.log('\n⛓️ Tích hợp blockchain...');
    for (let i = 0; i < drugs.length; i++) {
      const drug = drugs[i];
      const supplyChain = supplyChains.find(sc => sc.drugId.toString() === drug._id.toString());
      if (supplyChain) {
        await generateBlockchainIntegration(drug, supplyChain);
      }
    }

    // Tạo báo cáo
    console.log('\n📊 Tạo báo cáo QR codes...');
    const report = await generateQRReport(qrDir);

    console.log('\n🎉 HOÀN THÀNH TẠO QR CODES VÀ TÍCH HỢP BLOCKCHAIN!');
    console.log('==================================================');
    console.log(`✅ Đã tạo ${report.summary.totalDrugs} QR codes cho thuốc`);
    console.log(`✅ Đã tạo ${report.summary.totalSupplyChains} QR codes cho chuỗi cung ứng`);
    console.log(`✅ Đã tích hợp ${report.summary.totalBlockchainIntegrations} blockchain`);
    console.log(`📁 Tất cả QR codes được lưu tại: ${qrDir}`);
    console.log(`📊 Báo cáo chi tiết: ${qrDir}/qr-codes-report.json`);

    console.log('\n🔗 TRUY CẬP HỆ THỐNG:');
    console.log('=====================');
    console.log('- Quản lý thuốc: http://localhost:3000/drugs');
    console.log('- Quản lý chuỗi cung ứng: http://localhost:3000/supply-chain');
    console.log('- Xác minh QR code: http://localhost:3000/verify');
    console.log('- Báo cáo thống kê: http://localhost:3000/reports');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình tạo QR codes:', error);
  } finally {
    process.exit(0);
  }
};

main();
