const mongoose = require('mongoose');
require('dotenv').config();
const DigitalSignature = require('../models/DigitalSignature');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const digitalSignatureService = require('../services/digitalSignatureService');

/**
 * Script kiểm tra tính toàn vẹn của chữ ký số
 * Tìm các chữ ký số có hash không khớp với dữ liệu hiện tại
 */
const checkDigitalSignaturesHash = async () => {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability';
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối database\n');

    // Lấy tất cả chữ ký số đang hoạt động
    const signatures = await DigitalSignature.find({ status: 'active' })
      .populate('signedBy', 'fullName email role')
      .sort({ createdAt: -1 });

    console.log(`📋 Tìm thấy ${signatures.length} chữ ký số đang hoạt động\n`);
    console.log('🔍 Đang kiểm tra tính toàn vẹn của chữ ký số...\n');

    let validCount = 0;
    let invalidCount = 0;
    let missingDataCount = 0;
    const invalidSignatures = [];

    for (const sig of signatures) {
      try {
        // Lấy dữ liệu đối tượng được ký
        let documentData = null;

        if (sig.targetType === 'drug') {
          const drug = await Drug.findById(sig.targetId);
          if (!drug) {
            console.log(`⚠️  Chữ ký ${sig._id}: Không tìm thấy thuốc (${sig.targetId})`);
            missingDataCount++;
            invalidSignatures.push({
              signatureId: sig._id,
              targetType: sig.targetType,
              targetId: sig.targetId,
              issue: 'Không tìm thấy đối tượng được ký',
              signedBy: sig.signedByName,
              createdAt: sig.createdAt
            });
            continue;
          }

          documentData = {
            drugId: drug.drugId,
            name: drug.name,
            batchNumber: drug.batchNumber,
            productionDate: drug.productionDate,
            expiryDate: drug.expiryDate,
            manufacturerId: drug.manufacturerId,
            qualityTest: drug.qualityTest
          };
        } else if (sig.targetType === 'supplyChain') {
          const supplyChain = await SupplyChain.findById(sig.targetId);
          if (!supplyChain) {
            console.log(`⚠️  Chữ ký ${sig._id}: Không tìm thấy chuỗi cung ứng (${sig.targetId})`);
            missingDataCount++;
            invalidSignatures.push({
              signatureId: sig._id,
              targetType: sig.targetType,
              targetId: sig.targetId,
              issue: 'Không tìm thấy đối tượng được ký',
              signedBy: sig.signedByName,
              createdAt: sig.createdAt
            });
            continue;
          }
          documentData = supplyChain.toObject();
        } else if (sig.targetType === 'qualityTest') {
          // qualityTest là subdocument trong Drug
          const drug = await Drug.findOne({ 'qualityTest._id': sig.targetId });
          if (!drug || !drug.qualityTest) {
            console.log(`⚠️  Chữ ký ${sig._id}: Không tìm thấy kiểm định chất lượng (${sig.targetId})`);
            missingDataCount++;
            invalidSignatures.push({
              signatureId: sig._id,
              targetType: sig.targetType,
              targetId: sig.targetId,
              issue: 'Không tìm thấy đối tượng được ký',
              signedBy: sig.signedByName,
              createdAt: sig.createdAt
            });
            continue;
          }
          documentData = {
            targetType: 'qualityTest',
            drugId: drug.drugId,
            drugName: drug.name,
            batchNumber: drug.batchNumber,
            qualityTest: drug.qualityTest
          };
        } else {
          console.log(`⚠️  Chữ ký ${sig._id}: Loại đối tượng không được hỗ trợ (${sig.targetType})`);
          continue;
        }

        // Chỉ kiểm tra hash, không verify signature (vì signature là mock)
        const currentDataHash = digitalSignatureService.createDataHash(documentData);
        
        if (currentDataHash === sig.dataHash) {
          validCount++;
          console.log(`✅ Chữ ký ${sig._id}: Hash khớp - ${sig.targetType} - ${sig.signedByName || 'N/A'}`);
        } else {
          invalidCount++;
          console.log(`❌ Chữ ký ${sig._id}: Hash không khớp - ${sig.targetType} - ${sig.signedByName || 'N/A'}`);
          invalidSignatures.push({
            signatureId: sig._id,
            targetType: sig.targetType,
            targetId: sig.targetId,
            issue: 'Dữ liệu đã bị thay đổi (hash không khớp)',
            signedBy: sig.signedByName || 'N/A',
            createdAt: sig.createdAt,
            dataHash: sig.dataHash,
            currentHash: currentDataHash
          });
        }
      } catch (error) {
        console.error(`❌ Lỗi khi kiểm tra chữ ký ${sig._id}:`, error.message);
        invalidCount++;
        invalidSignatures.push({
          signatureId: sig._id,
          targetType: sig.targetType,
          targetId: sig.targetId,
          issue: `Lỗi: ${error.message}`,
          signedBy: sig.signedByName,
          createdAt: sig.createdAt
        });
      }
    }

    // Tóm tắt kết quả
    console.log('\n' + '='.repeat(60));
    console.log('📊 TÓM TẮT KẾT QUẢ KIỂM TRA');
    console.log('='.repeat(60));
    console.log(`✅ Chữ ký hợp lệ: ${validCount}`);
    console.log(`❌ Chữ ký không hợp lệ (hash không khớp): ${invalidCount}`);
    console.log(`⚠️  Chữ ký không tìm thấy dữ liệu: ${missingDataCount}`);
    console.log(`📋 Tổng cộng: ${signatures.length}`);

    if (invalidSignatures.length > 0) {
      console.log('\n' + '='.repeat(60));
      console.log('❌ DANH SÁCH CHỮ KÝ SỐ KHÔNG HỢP LỆ');
      console.log('='.repeat(60));
      invalidSignatures.forEach((sig, index) => {
        console.log(`\n${index + 1}. Chữ ký ID: ${sig.signatureId}`);
        console.log(`   Loại: ${sig.targetType}`);
        console.log(`   Đối tượng ID: ${sig.targetId}`);
        console.log(`   Người ký: ${sig.signedByName}`);
        console.log(`   Ngày ký: ${new Date(sig.createdAt).toLocaleString('vi-VN')}`);
        console.log(`   Vấn đề: ${sig.issue}`);
        if (sig.dataHash) {
          console.log(`   Hash lưu trữ: ${sig.dataHash.substring(0, 20)}...`);
        }
      });

      console.log('\n💡 GỢI Ý XỬ LÝ:');
      console.log('   1. Nếu dữ liệu đã bị thay đổi hợp lệ, cần ký số lại');
      console.log('   2. Nếu dữ liệu bị thay đổi không hợp lệ, cần điều tra');
      console.log('   3. Có thể thu hồi các chữ ký số không hợp lệ');
    }

    console.log('\n✅ Hoàn thành kiểm tra!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra chữ ký số:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

// Chạy script
checkDigitalSignaturesHash();

