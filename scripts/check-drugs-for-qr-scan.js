/**
 * Script để kiểm tra các thuốc có sẵn trong database và test quét QR
 * Giúp debug vấn đề "Không tìm thấy thông tin thuốc"
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Drug = require('../models/Drug');
// Load User model để có thể populate
require('../models/User');

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    process.exit(1);
  }
};

// Kiểm tra và hiển thị thông tin thuốc
const checkDrugs = async () => {
  try {
    console.log('\n📊 Kiểm tra thuốc trong database...\n');

    // Đếm tổng số thuốc
    const totalDrugs = await Drug.countDocuments();
    console.log(`📦 Tổng số thuốc: ${totalDrugs}`);

    if (totalDrugs === 0) {
      console.log('⚠️  Không có thuốc nào trong database!');
      console.log('💡 Hãy tạo thuốc mới trước khi test quét QR.');
      return;
    }

    // Đếm thuốc có blockchain ID
    const drugsWithBlockchain = await Drug.countDocuments({ 
      'blockchain.blockchainId': { $exists: true, $ne: null } 
    });
    console.log(`🔗 Thuốc có blockchain ID: ${drugsWithBlockchain}`);

    // Đếm thuốc có drugId
    const drugsWithDrugId = await Drug.countDocuments({ 
      drugId: { $exists: true, $ne: null } 
    });
    console.log(`🆔 Thuốc có drugId: ${drugsWithDrugId}`);

    // Lấy 5 thuốc đầu tiên để test (không populate để tránh lỗi nếu không cần)
    const sampleDrugs = await Drug.find()
      .limit(5)
      .select('drugId batchNumber name blockchain.blockchainId');

    console.log('\n📋 Mẫu thuốc để test quét QR:\n');
    
    sampleDrugs.forEach((drug, index) => {
      console.log(`${index + 1}. ${drug.name || 'N/A'}`);
      console.log(`   - Drug ID: ${drug.drugId || 'N/A'}`);
      console.log(`   - Batch Number: ${drug.batchNumber || 'N/A'}`);
      console.log(`   - Blockchain ID: ${drug.blockchain?.blockchainId || 'N/A'}`);
      console.log('');
    });

    // Test tìm kiếm với các mã khác nhau - Test mẫu 5 lô đầu tiên
    console.log('\n🧪 Test tìm kiếm thuốc (5 lô mẫu):\n');

    if (sampleDrugs.length > 0) {
      const testDrug = sampleDrugs[0];
      
      // Test 1: Tìm theo blockchainId
      if (testDrug.blockchain?.blockchainId) {
        const foundByBlockchain = await Drug.findByQRCode(testDrug.blockchain.blockchainId);
        console.log(`✅ Tìm theo blockchainId "${testDrug.blockchain.blockchainId}": ${foundByBlockchain ? 'Tìm thấy' : 'Không tìm thấy'}`);
      } else {
        console.log(`⚠️  Thuốc không có blockchainId để test`);
      }

      // Test 2: Tìm theo drugId
      if (testDrug.drugId) {
        const foundByDrugId = await Drug.findByQRCode(testDrug.drugId);
        console.log(`✅ Tìm theo drugId "${testDrug.drugId}": ${foundByDrugId ? 'Tìm thấy' : 'Không tìm thấy'}`);
      } else {
        console.log(`⚠️  Thuốc không có drugId để test`);
      }

      // Test 3: Tìm theo batchNumber
      if (testDrug.batchNumber) {
        const foundByBatch = await Drug.findByQRCode(testDrug.batchNumber);
        console.log(`✅ Tìm theo batchNumber "${testDrug.batchNumber}": ${foundByBatch ? 'Tìm thấy' : 'Không tìm thấy'}`);
      } else {
        console.log(`⚠️  Thuốc không có batchNumber để test`);
      }

      // Test 4: Tìm với JSON format
      if (testDrug.drugId) {
        const jsonQR = JSON.stringify({ drugId: testDrug.drugId });
        const foundByJSON = await Drug.findByQRCode(jsonQR);
        console.log(`✅ Tìm theo JSON "${jsonQR}": ${foundByJSON ? 'Tìm thấy' : 'Không tìm thấy'}`);
      }
    }

    // Test TẤT CẢ các lô thuốc có blockchain ID
    console.log('\n🔍 Test tất cả các lô thuốc có blockchain ID...\n');
    
    const allDrugsWithBlockchain = await Drug.find({
      'blockchain.blockchainId': { $exists: true, $ne: null }
    }).select('drugId batchNumber name blockchain.blockchainId');

    console.log(`📊 Đang test ${allDrugsWithBlockchain.length} lô thuốc có blockchain ID...\n`);

    let successCount = 0;
    let failCount = 0;
    const failedDrugs = [];

    // Test từng lô thuốc
    for (let i = 0; i < allDrugsWithBlockchain.length; i++) {
      const drug = allDrugsWithBlockchain[i];
      const blockchainId = drug.blockchain?.blockchainId;
      
      if (!blockchainId) {
        failCount++;
        failedDrugs.push({
          name: drug.name,
          drugId: drug.drugId,
          reason: 'Không có blockchainId'
        });
        continue;
      }

      try {
        const found = await Drug.findByQRCode(blockchainId);
        if (found) {
          // Kiểm tra xem có phải đúng thuốc không (so sánh drugId hoặc batchNumber)
          const isMatch = found.drugId === drug.drugId || 
                         found.batchNumber === drug.batchNumber ||
                         found._id.toString() === drug._id.toString();
          
          if (isMatch) {
            successCount++;
          } else {
            failCount++;
            failedDrugs.push({
              name: drug.name,
              drugId: drug.drugId,
              blockchainId: blockchainId,
              reason: 'Tìm thấy nhưng không khớp thuốc'
            });
          }
        } else {
          failCount++;
          failedDrugs.push({
            name: drug.name,
            drugId: drug.drugId,
            blockchainId: blockchainId,
            reason: 'Không tìm thấy'
          });
        }
        
        // Hiển thị progress mỗi 20 lô
        if ((i + 1) % 20 === 0) {
          process.stdout.write(`\r⏳ Đã test: ${i + 1}/${allDrugsWithBlockchain.length} (✅ ${successCount} thành công, ❌ ${failCount} thất bại)`);
        }
      } catch (error) {
        failCount++;
        failedDrugs.push({
          name: drug.name,
          drugId: drug.drugId,
          blockchainId: blockchainId,
          reason: `Lỗi: ${error.message}`
        });
        
        // Hiển thị progress mỗi 20 lô
        if ((i + 1) % 20 === 0) {
          process.stdout.write(`\r⏳ Đã test: ${i + 1}/${allDrugsWithBlockchain.length} (✅ ${successCount} thành công, ❌ ${failCount} thất bại)`);
        }
      }
    }

    // Hiển thị kết quả cuối cùng
    console.log(`\r✅ Đã test xong: ${allDrugsWithBlockchain.length}/${allDrugsWithBlockchain.length} (✅ ${successCount} thành công, ❌ ${failCount} thất bại)`);
    console.log('');

    // Hiển thị thống kê
    console.log('\n📈 Thống kê kết quả:');
    console.log(`   ✅ Thành công: ${successCount} lô (${((successCount / allDrugsWithBlockchain.length) * 100).toFixed(1)}%)`);
    console.log(`   ❌ Thất bại: ${failCount} lô (${((failCount / allDrugsWithBlockchain.length) * 100).toFixed(1)}%)`);

    // Hiển thị các lô thất bại (nếu có)
    if (failedDrugs.length > 0) {
      console.log(`\n⚠️  Các lô thuốc không tìm thấy (hiển thị tối đa 10 lô đầu tiên):\n`);
      failedDrugs.slice(0, 10).forEach((drug, index) => {
        console.log(`   ${index + 1}. ${drug.name || 'N/A'}`);
        console.log(`      - Drug ID: ${drug.drugId || 'N/A'}`);
        if (drug.blockchainId) {
          console.log(`      - Blockchain ID: ${drug.blockchainId}`);
        }
        console.log(`      - Lý do: ${drug.reason}`);
        console.log('');
      });
      
      if (failedDrugs.length > 10) {
        console.log(`   ... và ${failedDrugs.length - 10} lô khác\n`);
      }
    }

    console.log('\n💡 Gợi ý:');
    console.log('   - Nếu không tìm thấy, kiểm tra xem thuốc có đầy đủ thông tin (drugId, batchNumber, blockchainId) không');
    console.log('   - Đảm bảo QR code chứa một trong các mã: blockchainId, drugId, hoặc batchNumber');
    console.log('   - Kiểm tra console log của backend khi quét QR để xem chi tiết tìm kiếm\n');

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra thuốc:', error);
  }
};

// Main
const main = async () => {
  await connectDB();
  await checkDrugs();
  await mongoose.connection.close();
  console.log('✅ Đã đóng kết nối MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Lỗi:', error);
  process.exit(1);
});

