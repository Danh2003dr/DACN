const mongoose = require('mongoose');
require('dotenv').config();
const DigitalSignature = require('../models/DigitalSignature');
const Drug = require('../models/Drug');
const digitalSignatureService = require('../services/digitalSignatureService');
const crypto = require('crypto');

/**
 * Script debug để xem hash được tạo như thế nào
 */
const debugHash = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability';
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối database\n');

    // Lấy một chữ ký số mẫu
    const signature = await DigitalSignature.findOne({ status: 'active' })
      .populate('signedBy', 'fullName email role');
    
    if (!signature) {
      console.log('❌ Không tìm thấy chữ ký số nào');
      process.exit(0);
    }

    console.log('📋 Thông tin chữ ký số:');
    console.log(`   ID: ${signature._id}`);
    console.log(`   Loại: ${signature.targetType}`);
    console.log(`   Đối tượng ID: ${signature.targetId}`);
    console.log(`   Hash lưu trữ: ${signature.dataHash}`);
    console.log(`   Hash lưu trữ (độ dài): ${signature.dataHash?.length}`);
    console.log(`   Hash bắt đầu bằng: ${signature.dataHash?.substring(0, 20)}...\n`);

    // Lấy dữ liệu thuốc
    if (signature.targetType === 'drug') {
      const drug = await Drug.findById(signature.targetId);
      if (!drug) {
        console.log('❌ Không tìm thấy thuốc');
        process.exit(0);
      }

      console.log('📋 Thông tin thuốc:');
      console.log(`   Tên: ${drug.name}`);
      console.log(`   Batch: ${drug.batchNumber}`);
      console.log(`   Drug ID: ${drug.drugId}`);
      console.log(`   Manufacturer ID: ${drug.manufacturerId}`);
      console.log(`   Production Date: ${drug.productionDate}`);
      console.log(`   Expiry Date: ${drug.expiryDate}\n`);

      // Tạo dữ liệu như trong controller
      const documentData = {
        drugId: drug.drugId,
        name: drug.name,
        batchNumber: drug.batchNumber,
        productionDate: drug.productionDate,
        expiryDate: drug.expiryDate,
        manufacturerId: drug.manufacturerId,
        qualityTest: drug.qualityTest
      };

      console.log('📋 Dữ liệu để tạo hash:');
      console.log(JSON.stringify(documentData, null, 2));
      console.log('\n');

      // Tạo hash theo cách của service
      const currentHash = digitalSignatureService.createDataHash(documentData);
      console.log('🔍 Hash được tạo từ dữ liệu hiện tại:');
      console.log(`   ${currentHash}`);
      console.log(`   Độ dài: ${currentHash.length}\n`);

      // So sánh
      console.log('🔍 So sánh:');
      console.log(`   Hash lưu trữ: ${signature.dataHash}`);
      console.log(`   Hash hiện tại: ${currentHash}`);
      console.log(`   Khớp: ${signature.dataHash === currentHash ? '✅ CÓ' : '❌ KHÔNG'}\n`);

      // Kiểm tra xem hash lưu trữ có phải là base64 của JSON không
      try {
        const decoded = Buffer.from(signature.dataHash, 'base64').toString('utf8');
        console.log('🔍 Hash lưu trữ (decode base64):');
        console.log(`   ${decoded.substring(0, 100)}...\n`);
        
        // Nếu decode được, có nghĩa là hash đang được lưu là base64 của JSON
        const jsonData = JSON.parse(decoded);
        console.log('📋 Dữ liệu trong hash lưu trữ (sau khi decode):');
        console.log(JSON.stringify(jsonData, null, 2));
        console.log('\n');

        // Tạo hash từ dữ liệu decode
        const hashFromDecoded = digitalSignatureService.createDataHash(jsonData);
        console.log('🔍 Hash từ dữ liệu decode:');
        console.log(`   ${hashFromDecoded}`);
        console.log(`   Khớp với hash hiện tại: ${hashFromDecoded === currentHash ? '✅ CÓ' : '❌ KHÔNG'}\n`);
      } catch (e) {
        console.log('⚠️  Hash lưu trữ không phải base64 của JSON\n');
      }

      // Thử các cách tạo hash khác nhau
      console.log('🔍 Thử các cách tạo hash khác nhau:\n');
      
      // Cách 1: JSON.stringify với toJSON
      const drugObj = drug.toObject();
      const data1 = {
        drugId: drugObj.drugId,
        name: drugObj.name,
        batchNumber: drugObj.batchNumber,
        productionDate: drugObj.productionDate,
        expiryDate: drugObj.expiryDate,
        manufacturerId: drugObj.manufacturerId?.toString(),
        qualityTest: drugObj.qualityTest
      };
      const hash1 = digitalSignatureService.createDataHash(data1);
      console.log(`1. Hash với manufacturerId.toString(): ${hash1}`);
      console.log(`   Khớp: ${signature.dataHash === hash1 ? '✅' : '❌'}\n`);

      // Cách 2: Với ObjectId
      const data2 = {
        drugId: drugObj.drugId,
        name: drugObj.name,
        batchNumber: drugObj.batchNumber,
        productionDate: drugObj.productionDate,
        expiryDate: drugObj.expiryDate,
        manufacturerId: drugObj.manufacturerId,
        qualityTest: drugObj.qualityTest
      };
      const hash2 = digitalSignatureService.createDataHash(data2);
      console.log(`2. Hash với manufacturerId là ObjectId: ${hash2}`);
      console.log(`   Khớp: ${signature.dataHash === hash2 ? '✅' : '❌'}\n`);

      // Cách 3: Với Date được format
      const data3 = {
        drugId: drugObj.drugId,
        name: drugObj.name,
        batchNumber: drugObj.batchNumber,
        productionDate: drugObj.productionDate?.toISOString(),
        expiryDate: drugObj.expiryDate?.toISOString(),
        manufacturerId: drugObj.manufacturerId?.toString(),
        qualityTest: drugObj.qualityTest
      };
      const hash3 = digitalSignatureService.createDataHash(data3);
      console.log(`3. Hash với Date.toISOString(): ${hash3}`);
      console.log(`   Khớp: ${signature.dataHash === hash3 ? '✅' : '❌'}\n`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
};

debugHash();

