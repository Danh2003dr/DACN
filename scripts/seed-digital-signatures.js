/**
 * Script seed dữ liệu chữ ký số
 * 
 * Cách sử dụng:
 * 
 * Bash/Linux/Mac:
 *   node scripts/seed-digital-signatures.js
 *   DELETE_OLD_SIGNATURES=false node scripts/seed-digital-signatures.js
 * 
 * PowerShell (Windows):
 *   node scripts/seed-digital-signatures.js
 *   $env:DELETE_OLD_SIGNATURES="false"; node scripts/seed-digital-signatures.js
 * 
 * Hoặc sử dụng npm script:
 *   npm run seed:signatures          # Xóa dữ liệu cũ trước khi seed
 * 
 * Biến môi trường:
 *   DELETE_OLD_SIGNATURES: Mặc định 'true' (xóa dữ liệu cũ). Set 'false' để giữ dữ liệu cũ
 *   
 * Ví dụ PowerShell (giữ dữ liệu cũ):
 *   $env:DELETE_OLD_SIGNATURES="false"
 *   node scripts/seed-digital-signatures.js
 */

const mongoose = require('mongoose');
require('dotenv').config();
const crypto = require('crypto');

const DigitalSignature = require('../models/DigitalSignature');
const User = require('../models/User');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const Task = require('../models/Task');

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

// Tạo hash cho dữ liệu
const generateHash = (data) => {
  return crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
};

// Tạo chữ ký số giả (mock signature)
const generateMockSignature = (data) => {
  const signatureData = JSON.stringify(data) + Date.now();
  return crypto.createHash('sha256').update(signatureData).digest('hex');
};

// Tạo public key giả (PEM format)
const generateMockPublicKey = () => {
  return `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA${crypto.randomBytes(32).toString('base64')}
-----END PUBLIC KEY-----`;
};

// Tạo số seri chứng chỉ giả
const generateCertificateSerial = () => {
  return `VNCA-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
};

// Tạo chữ ký số cho drug
const createDrugSignature = async (drug, user) => {
  // Sử dụng đúng format như trong controller để đảm bảo hash khớp khi verify
  const dataToSign = {
    drugId: drug.drugId,  // Sử dụng drugId (string) thay vì _id (ObjectId)
    name: drug.name,
    batchNumber: drug.batchNumber,
    productionDate: drug.productionDate,
    expiryDate: drug.expiryDate,
    manufacturerId: drug.manufacturerId,
    qualityTest: drug.qualityTest
  };

  const dataHash = generateHash(dataToSign);
  const signature = generateMockSignature(dataToSign);
  const validFrom = new Date();
  const validTo = new Date();
  validTo.setFullYear(validTo.getFullYear() + 1); // Hết hạn sau 1 năm

  const digitalSignature = new DigitalSignature({
    targetType: 'drug',
    targetId: drug._id,
    signedBy: user._id,
    signedByName: user.fullName,
    signedByRole: user.role,
    dataHash,
    signature,
    certificate: {
      serialNumber: generateCertificateSerial(),
      caProvider: ['vnca', 'viettel-ca', 'fpt-ca'][Math.floor(Math.random() * 3)],
      caName: ['CA Quốc gia Việt Nam', 'Viettel CA', 'FPT CA'][Math.floor(Math.random() * 3)],
      certificateInfo: {
        subject: `CN=${user.fullName}, O=${user.organizationInfo?.name || 'Organization'}, C=VN`,
        issuer: 'O=CA Quốc gia Việt Nam, C=VN',
        validFrom,
        validTo,
        publicKey: generateMockPublicKey(),
        algorithm: 'RSA-SHA256'
      },
      certificateStatus: 'valid',
      lastVerified: new Date()
    },
    timestamp: {
      timestampToken: crypto.randomBytes(32).toString('hex'),
      tsaUrl: 'https://tsa.vnca.gov.vn',
      timestampedAt: new Date(),
      timestampHash: crypto.randomBytes(16).toString('hex'),
      timestampStatus: Math.random() > 0.3 ? 'verified' : 'pending' // 70% verified
    },
    purpose: 'Xác thực nguồn gốc và tính toàn vẹn dữ liệu lô thuốc',
    status: 'active',
    metadata: {
      drugName: drug.name,
      batchNumber: drug.batchNumber,
      signedAt: new Date()
    }
  });

  return await digitalSignature.save();
};

// Tạo chữ ký số cho supply chain
const createSupplyChainSignature = async (supplyChain, user) => {
  const dataToSign = {
    supplyChainId: supplyChain._id,
    drugBatchNumber: supplyChain.drugBatchNumber,
    currentStep: supplyChain.currentStep,
    status: supplyChain.status
  };

  const dataHash = generateHash(dataToSign);
  const signature = generateMockSignature(dataToSign);
  const validFrom = new Date();
  const validTo = new Date();
  validTo.setFullYear(validTo.getFullYear() + 1);

  const digitalSignature = new DigitalSignature({
    targetType: 'supplyChain',
    targetId: supplyChain._id,
    signedBy: user._id,
    signedByName: user.fullName,
    signedByRole: user.role,
    dataHash,
    signature,
    certificate: {
      serialNumber: generateCertificateSerial(),
      caProvider: ['vnca', 'viettel-ca'][Math.floor(Math.random() * 2)],
      caName: ['CA Quốc gia Việt Nam', 'Viettel CA'][Math.floor(Math.random() * 2)],
      certificateInfo: {
        subject: `CN=${user.fullName}, O=${user.organizationInfo?.name || 'Organization'}, C=VN`,
        issuer: 'O=CA Quốc gia Việt Nam, C=VN',
        validFrom,
        validTo,
        publicKey: generateMockPublicKey(),
        algorithm: 'RSA-SHA256'
      },
      certificateStatus: 'valid',
      lastVerified: new Date()
    },
    timestamp: {
      timestampToken: crypto.randomBytes(32).toString('hex'),
      tsaUrl: 'https://tsa.vnca.gov.vn',
      timestampedAt: new Date(),
      timestampHash: crypto.randomBytes(16).toString('hex'),
      timestampStatus: 'verified'
    },
    purpose: 'Xác thực bước trong chuỗi cung ứng',
    status: 'active',
    metadata: {
      supplyChainStep: supplyChain.currentStep,
      status: supplyChain.status
    }
  });

  return await digitalSignature.save();
};

// Tạo chữ ký số cho quality test
const createQualityTestSignature = async (drug, user) => {
  if (!drug.qualityTest || drug.qualityTest.testResult === 'đang kiểm định') {
    return null;
  }

  const dataToSign = {
    drugId: drug._id,
    batchNumber: drug.batchNumber,
    testDate: drug.qualityTest.testDate,
    testResult: drug.qualityTest.testResult,
    testBy: drug.qualityTest.testBy
  };

  const dataHash = generateHash(dataToSign);
  const signature = generateMockSignature(dataToSign);
  const validFrom = new Date();
  const validTo = new Date();
  validTo.setFullYear(validTo.getFullYear() + 1);

  const digitalSignature = new DigitalSignature({
    targetType: 'qualityTest',
    targetId: drug._id,
    signedBy: user._id,
    signedByName: user.fullName,
    signedByRole: user.role,
    dataHash,
    signature,
    certificate: {
      serialNumber: generateCertificateSerial(),
      caProvider: 'vnca',
      caName: 'CA Quốc gia Việt Nam',
      certificateInfo: {
        subject: `CN=${user.fullName}, O=${user.organizationInfo?.name || 'Organization'}, C=VN`,
        issuer: 'O=CA Quốc gia Việt Nam, C=VN',
        validFrom,
        validTo,
        publicKey: generateMockPublicKey(),
        algorithm: 'RSA-SHA256'
      },
      certificateStatus: 'valid',
      lastVerified: new Date()
    },
    timestamp: {
      timestampToken: crypto.randomBytes(32).toString('hex'),
      tsaUrl: 'https://tsa.vnca.gov.vn',
      timestampedAt: new Date(),
      timestampHash: crypto.randomBytes(16).toString('hex'),
      timestampStatus: 'verified'
    },
    purpose: 'Xác thực kết quả kiểm định chất lượng',
    status: 'active',
    metadata: {
      testResult: drug.qualityTest.testResult,
      testDate: drug.qualityTest.testDate
    }
  });

  return await digitalSignature.save();
};

// Tạo chữ ký số đã hết hạn (để demo)
const createExpiredSignature = async (drug, user) => {
  const dataToSign = {
    drugId: drug._id,
    batchNumber: drug.batchNumber
  };

  const dataHash = generateHash(dataToSign);
  const signature = generateMockSignature(dataToSign);
  const validFrom = new Date();
  validFrom.setFullYear(validFrom.getFullYear() - 2); // 2 năm trước
  const validTo = new Date();
  validTo.setFullYear(validTo.getFullYear() - 1); // Hết hạn 1 năm trước

  const digitalSignature = new DigitalSignature({
    targetType: 'drug',
    targetId: drug._id,
    signedBy: user._id,
    signedByName: user.fullName,
    signedByRole: user.role,
    dataHash,
    signature,
    certificate: {
      serialNumber: generateCertificateSerial(),
      caProvider: 'vnca',
      caName: 'CA Quốc gia Việt Nam',
      certificateInfo: {
        subject: `CN=${user.fullName}, O=${user.organizationInfo?.name || 'Organization'}, C=VN`,
        issuer: 'O=CA Quốc gia Việt Nam, C=VN',
        validFrom,
        validTo,
        publicKey: generateMockPublicKey(),
        algorithm: 'RSA-SHA256'
      },
      certificateStatus: 'expired',
      lastVerified: new Date()
    },
    timestamp: {
      timestampToken: crypto.randomBytes(32).toString('hex'),
      tsaUrl: 'https://tsa.vnca.gov.vn',
      timestampedAt: validFrom,
      timestampHash: crypto.randomBytes(16).toString('hex'),
      timestampStatus: 'verified'
    },
    purpose: 'Xác thực nguồn gốc (đã hết hạn)',
    status: 'expired',
    metadata: {
      note: 'Chữ ký số mẫu đã hết hạn'
    }
  });

  return await digitalSignature.save();
};

// Tạo chữ ký số đã bị thu hồi (để demo)
const createRevokedSignature = async (drug, user, adminUser) => {
  const dataToSign = {
    drugId: drug._id,
    batchNumber: drug.batchNumber
  };

  const dataHash = generateHash(dataToSign);
  const signature = generateMockSignature(dataToSign);
  const validFrom = new Date();
  validFrom.setMonth(validFrom.getMonth() - 6); // 6 tháng trước
  const validTo = new Date();
  validTo.setFullYear(validTo.getFullYear() + 1);

  const digitalSignature = new DigitalSignature({
    targetType: 'drug',
    targetId: drug._id,
    signedBy: user._id,
    signedByName: user.fullName,
    signedByRole: user.role,
    dataHash,
    signature,
    certificate: {
      serialNumber: generateCertificateSerial(),
      caProvider: 'vnca',
      caName: 'CA Quốc gia Việt Nam',
      certificateInfo: {
        subject: `CN=${user.fullName}, O=${user.organizationInfo?.name || 'Organization'}, C=VN`,
        issuer: 'O=CA Quốc gia Việt Nam, C=VN',
        validFrom,
        validTo,
        publicKey: generateMockPublicKey(),
        algorithm: 'RSA-SHA256'
      },
      certificateStatus: 'revoked',
      lastVerified: new Date()
    },
    timestamp: {
      timestampToken: crypto.randomBytes(32).toString('hex'),
      tsaUrl: 'https://tsa.vnca.gov.vn',
      timestampedAt: validFrom,
      timestampHash: crypto.randomBytes(16).toString('hex'),
      timestampStatus: 'verified'
    },
    purpose: 'Xác thực nguồn gốc (đã bị thu hồi)',
    status: 'revoked',
    revocationReason: 'Thu hồi do phát hiện lỗi trong quá trình ký',
    revokedAt: new Date(),
    revokedBy: adminUser._id,
    metadata: {
      note: 'Chữ ký số mẫu đã bị thu hồi'
    }
  });

  return await digitalSignature.save();
};

// Main function
const seedDigitalSignatures = async () => {
  try {
    console.log('🌱 Bắt đầu seed dữ liệu chữ ký số...\n');

    // Xóa dữ liệu chữ ký số cũ (tùy chọn - comment lại nếu muốn giữ dữ liệu cũ)
    const deleteOld = process.env.DELETE_OLD_SIGNATURES !== 'false';
    if (deleteOld) {
      const oldCount = await DigitalSignature.countDocuments();
      if (oldCount > 0) {
        console.log(`🗑️  Xóa ${oldCount} chữ ký số cũ...`);
        await DigitalSignature.deleteMany({});
        console.log('✅ Đã xóa dữ liệu cũ\n');
      }
    }

    // Lấy các user phù hợp
    const manufacturers = await User.find({ role: 'manufacturer' }).limit(5);
    const distributors = await User.find({ role: 'distributor' }).limit(3);
    const hospitals = await User.find({ role: 'hospital' }).limit(2);
    const admin = await User.findOne({ role: 'admin' });

    if (!admin) {
      console.error('❌ Không tìm thấy admin user');
      return;
    }

    const allUsers = [...manufacturers, ...distributors, ...hospitals];
    if (allUsers.length === 0) {
      console.error('❌ Không tìm thấy user nào để tạo chữ ký số');
      return;
    }

    console.log(`📋 Tìm thấy ${allUsers.length} users phù hợp`);

    // Lấy drugs
    const drugs = await Drug.find().limit(20);
    console.log(`💊 Tìm thấy ${drugs.length} lô thuốc`);

    // Lấy supply chains
    const supplyChains = await SupplyChain.find().limit(10);
    console.log(`🚚 Tìm thấy ${supplyChains.length} chuỗi cung ứng\n`);

    let createdCount = 0;

    // Tạo chữ ký số cho drugs
    console.log('📝 Tạo chữ ký số cho lô thuốc...');
    for (const drug of drugs) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      try {
        await createDrugSignature(drug, randomUser);
        createdCount++;
        if (createdCount % 5 === 0) {
          process.stdout.write('.');
        }
      } catch (error) {
        console.error(`\n❌ Lỗi khi tạo chữ ký cho drug ${drug.batchNumber}:`, error.message);
      }
    }
    console.log(`\n✅ Đã tạo ${createdCount} chữ ký số cho lô thuốc`);

    // Tạo chữ ký số cho quality tests
    console.log('\n📝 Tạo chữ ký số cho kết quả kiểm định...');
    let qualityTestCount = 0;
    for (const drug of drugs) {
      if (drug.qualityTest && drug.qualityTest.testResult !== 'đang kiểm định') {
        const randomUser = manufacturers[Math.floor(Math.random() * manufacturers.length)] || allUsers[0];
        try {
          await createQualityTestSignature(drug, randomUser);
          qualityTestCount++;
        } catch (error) {
          console.error(`\n❌ Lỗi khi tạo chữ ký quality test cho drug ${drug.batchNumber}:`, error.message);
        }
      }
    }
    console.log(`✅ Đã tạo ${qualityTestCount} chữ ký số cho kết quả kiểm định`);

    // Tạo chữ ký số cho supply chains
    console.log('\n📝 Tạo chữ ký số cho chuỗi cung ứng...');
    let supplyChainCount = 0;
    for (const supplyChain of supplyChains) {
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      try {
        await createSupplyChainSignature(supplyChain, randomUser);
        supplyChainCount++;
      } catch (error) {
        console.error(`\n❌ Lỗi khi tạo chữ ký cho supply chain ${supplyChain._id}:`, error.message);
      }
    }
    console.log(`✅ Đã tạo ${supplyChainCount} chữ ký số cho chuỗi cung ứng`);

    // Tạo một số chữ ký số đã hết hạn (để demo)
    console.log('\n📝 Tạo chữ ký số đã hết hạn (demo)...');
    let expiredCount = 0;
    for (let i = 0; i < Math.min(3, drugs.length); i++) {
      const drug = drugs[i];
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      try {
        await createExpiredSignature(drug, randomUser);
        expiredCount++;
      } catch (error) {
        console.error(`\n❌ Lỗi khi tạo chữ ký hết hạn:`, error.message);
      }
    }
    console.log(`✅ Đã tạo ${expiredCount} chữ ký số đã hết hạn`);

    // Tạo một số chữ ký số đã bị thu hồi (để demo)
    console.log('\n📝 Tạo chữ ký số đã bị thu hồi (demo)...');
    let revokedCount = 0;
    for (let i = 0; i < Math.min(2, drugs.length); i++) {
      const drug = drugs[i];
      const randomUser = allUsers[Math.floor(Math.random() * allUsers.length)];
      try {
        await createRevokedSignature(drug, randomUser, admin);
        revokedCount++;
      } catch (error) {
        console.error(`\n❌ Lỗi khi tạo chữ ký bị thu hồi:`, error.message);
      }
    }
    console.log(`✅ Đã tạo ${revokedCount} chữ ký số đã bị thu hồi`);

    // Thống kê
    const total = await DigitalSignature.countDocuments();
    const active = await DigitalSignature.countDocuments({ status: 'active' });
    const expired = await DigitalSignature.countDocuments({ status: 'expired' });
    const revoked = await DigitalSignature.countDocuments({ status: 'revoked' });

    console.log('\n📊 Thống kê chữ ký số:');
    console.log(`   Tổng số: ${total}`);
    console.log(`   Đang hoạt động: ${active}`);
    console.log(`   Đã hết hạn: ${expired}`);
    console.log(`   Đã bị thu hồi: ${revoked}`);

    console.log('\n✅ Hoàn thành seed dữ liệu chữ ký số!');
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Đã đóng kết nối database');
    process.exit(0);
  }
};

// Chạy script
connectDB().then(() => {
  seedDigitalSignatures();
});

