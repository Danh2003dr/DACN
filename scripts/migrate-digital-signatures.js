const mongoose = require('mongoose');
require('dotenv').config();

const Drug = require('../models/Drug');
const DigitalSignature = require('../models/DigitalSignature');
const User = require('../models/User');

/**
 * Script để migrate chữ ký số từ drug.blockchain.digitalSignature sang collection DigitalSignature
 */
async function migrateDigitalSignatures() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Đã kết nối MongoDB');

    // Tìm tất cả drugs có chữ ký số
    const drugsWithSignature = await Drug.find({
      'blockchain.digitalSignature': { $exists: true, $ne: null, $ne: '' }
    }).populate('createdBy', 'fullName email role');

    console.log(`Tìm thấy ${drugsWithSignature.length} lô thuốc có chữ ký số`);

    let migrated = 0;
    let skipped = 0;
    let errors = 0;

    for (const drug of drugsWithSignature) {
      try {
        // Kiểm tra xem đã có chữ ký số trong collection DigitalSignature chưa
        const existingSignature = await DigitalSignature.findOne({
          targetType: 'drug',
          targetId: drug._id
        });

        if (existingSignature) {
          console.log(`Đã tồn tại chữ ký số cho drug ${drug._id}, bỏ qua`);
          skipped++;
          continue;
        }

        // Tạo chữ ký số mới từ dữ liệu drug
        const signer = drug.createdBy || await User.findOne({ role: 'admin' });
        if (!signer) {
          console.log(`Không tìm thấy người ký cho drug ${drug._id}, bỏ qua`);
          skipped++;
          continue;
        }

        // Tạo dataHash nếu chưa có
        let dataHash = drug.blockchain.dataHash;
        if (!dataHash || dataHash === '') {
          const crypto = require('crypto');
          const drugData = {
            drugId: drug.drugId,
            name: drug.name,
            batchNumber: drug.batchNumber,
            productionDate: drug.productionDate,
            expiryDate: drug.expiryDate
          };
          dataHash = crypto.createHash('sha256').update(JSON.stringify(drugData), 'utf8').digest('hex');
        }

        const digitalSignature = new DigitalSignature({
          targetType: 'drug',
          targetId: drug._id,
          signedBy: signer._id,
          signedByName: signer.fullName || 'Hệ thống',
          signedByRole: signer.role || 'admin',
          dataHash: dataHash,
          signature: drug.blockchain.digitalSignature,
          certificate: {
            serialNumber: `MIGRATED_${drug._id}_${Date.now()}`,
            caProvider: 'vnca',
            caName: 'CA Quốc gia Việt Nam',
            certificateInfo: {
              subject: `CN=${signer.fullName || 'Hệ thống'},O=System,C=VN`,
              issuer: 'O=CA Quốc gia Việt Nam,C=VN',
              validFrom: drug.createdAt || new Date(),
              validTo: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 năm
              publicKey: `MIGRATED_PUBLIC_KEY_${drug._id}`,
              algorithm: 'RSA-SHA256'
            },
            certificateStatus: 'valid',
            lastVerified: new Date()
          },
          timestamp: {
            timestampStatus: 'not_required'
          },
          purpose: 'Xác thực nguồn gốc và tính toàn vẹn dữ liệu (Migrated)',
          metadata: {
            migrated: true,
            migratedAt: new Date(),
            originalSource: 'drug.blockchain.digitalSignature'
          },
          status: 'active'
        });

        await digitalSignature.save();
        migrated++;
        console.log(`Đã migrate chữ ký số cho drug ${drug.drugId || drug._id}`);
      } catch (error) {
        console.error(`Lỗi khi migrate drug ${drug._id}:`, error.message);
        errors++;
      }
    }

    console.log('\n=== Kết quả migrate ===');
    console.log(`Đã migrate: ${migrated}`);
    console.log(`Đã bỏ qua: ${skipped}`);
    console.log(`Lỗi: ${errors}`);
    console.log(`Tổng: ${drugsWithSignature.length}`);

    // Đếm tổng số chữ ký số sau khi migrate
    const totalSignatures = await DigitalSignature.countDocuments();
    console.log(`\nTổng số chữ ký số trong database: ${totalSignatures}`);

    await mongoose.disconnect();
    console.log('Đã ngắt kết nối MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('Lỗi khi migrate:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Chạy script
migrateDigitalSignatures();

