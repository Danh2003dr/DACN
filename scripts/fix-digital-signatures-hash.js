const mongoose = require('mongoose');
require('dotenv').config();
const DigitalSignature = require('../models/DigitalSignature');
const Drug = require('../models/Drug');
const digitalSignatureService = require('../services/digitalSignatureService');

/**
 * Script để sửa lại hash cho các chữ ký số đã tồn tại
 * Re-sign lại với hash đúng format
 */
const fixDigitalSignaturesHash = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability';
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối database\n');

    // Lấy tất cả chữ ký số đang hoạt động cho drug
    const signatures = await DigitalSignature.find({ 
      status: 'active',
      targetType: 'drug'
    }).sort({ createdAt: -1 });

    console.log(`📋 Tìm thấy ${signatures.length} chữ ký số cho thuốc\n`);
    console.log('🔧 Đang sửa lại hash...\n');

    let fixedCount = 0;
    let errorCount = 0;

    for (const sig of signatures) {
      try {
        // Lấy dữ liệu thuốc
        const drug = await Drug.findById(sig.targetId);
        if (!drug) {
          console.log(`⚠️  Chữ ký ${sig._id}: Không tìm thấy thuốc`);
          errorCount++;
          continue;
        }

        // Tạo dữ liệu đúng format như trong controller
        const documentData = {
          drugId: drug.drugId,
          name: drug.name,
          batchNumber: drug.batchNumber,
          productionDate: drug.productionDate,
          expiryDate: drug.expiryDate,
          manufacturerId: drug.manufacturerId,
          qualityTest: drug.qualityTest
        };

        // Tạo hash mới
        const newHash = digitalSignatureService.createDataHash(documentData);

        // So sánh với hash cũ
        if (sig.dataHash === newHash) {
          console.log(`✅ Chữ ký ${sig._id}: Hash đã đúng`);
          continue;
        }

        // Cập nhật hash mới
        sig.dataHash = newHash;
        await sig.save();

        console.log(`✅ Chữ ký ${sig._id}: Đã sửa hash`);
        console.log(`   Hash cũ: ${sig.dataHash.substring(0, 20)}...`);
        console.log(`   Hash mới: ${newHash.substring(0, 20)}...\n`);
        fixedCount++;

      } catch (error) {
        console.error(`❌ Lỗi khi sửa chữ ký ${sig._id}:`, error.message);
        errorCount++;
      }
    }

    // Tóm tắt
    console.log('\n' + '='.repeat(60));
    console.log('📊 TÓM TẮT');
    console.log('='.repeat(60));
    console.log(`✅ Đã sửa: ${fixedCount} chữ ký số`);
    console.log(`❌ Lỗi: ${errorCount} chữ ký số`);
    console.log(`📋 Tổng cộng: ${signatures.length} chữ ký số`);

    // Verify lại
    console.log('\n🔍 Đang xác thực lại...\n');
    let validCount = 0;
    let invalidCount = 0;

    for (const sig of signatures) {
      try {
        const drug = await Drug.findById(sig.targetId);
        if (!drug) continue;

        const documentData = {
          drugId: drug.drugId,
          name: drug.name,
          batchNumber: drug.batchNumber,
          productionDate: drug.productionDate,
          expiryDate: drug.expiryDate,
          manufacturerId: drug.manufacturerId,
          qualityTest: drug.qualityTest
        };

        const verifyResult = await digitalSignatureService.verifySignatureById(
          sig._id,
          documentData
        );

        if (verifyResult.valid) {
          validCount++;
        } else {
          invalidCount++;
          console.log(`❌ Chữ ký ${sig._id}: ${verifyResult.message}`);
        }
      } catch (error) {
        invalidCount++;
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 KẾT QUẢ XÁC THỰC');
    console.log('='.repeat(60));
    console.log(`✅ Chữ ký hợp lệ: ${validCount}`);
    console.log(`❌ Chữ ký không hợp lệ: ${invalidCount}`);

    console.log('\n✅ Hoàn thành!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

fixDigitalSignaturesHash();

