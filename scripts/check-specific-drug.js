/**
 * Script để kiểm tra một thuốc cụ thể bằng blockchainId hoặc drugId
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Drug = require('../models/Drug');
// Load các models cần thiết để populate
require('../models/User');
require('../models/SupplyChain');

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

// Kiểm tra thuốc cụ thể
const checkSpecificDrug = async () => {
  try {
    // Lấy blockchainId từ command line argument hoặc dùng giá trị mặc định
    const blockchainId = process.argv[2] || 'BC_1764951024481_606A37A3';
    const drugId = process.argv[3] || 'DRUG_F1CBB87E';
    
    console.log('\n🔍 Kiểm tra thuốc cụ thể...\n');
    console.log(`Blockchain ID: ${blockchainId}`);
    console.log(`Drug ID: ${drugId}\n`);

    // Tìm theo blockchainId
    console.log('1️⃣ Tìm theo blockchainId:');
    const drugByBlockchain = await Drug.findOne({ 
      'blockchain.blockchainId': blockchainId 
    }).select('drugId batchNumber name blockchain.blockchainId');
    
    if (drugByBlockchain) {
      console.log('   ✅ Tìm thấy!');
      console.log(`   - Tên: ${drugByBlockchain.name}`);
      console.log(`   - Drug ID: ${drugByBlockchain.drugId}`);
      console.log(`   - Batch Number: ${drugByBlockchain.batchNumber}`);
      console.log(`   - Blockchain ID: ${drugByBlockchain.blockchain?.blockchainId}`);
    } else {
      console.log('   ❌ Không tìm thấy');
    }

    // Tìm theo drugId
    console.log('\n2️⃣ Tìm theo drugId:');
    const drugByDrugId = await Drug.findOne({ 
      drugId: drugId 
    }).select('drugId batchNumber name blockchain.blockchainId');
    
    if (drugByDrugId) {
      console.log('   ✅ Tìm thấy!');
      console.log(`   - Tên: ${drugByDrugId.name}`);
      console.log(`   - Drug ID: ${drugByDrugId.drugId}`);
      console.log(`   - Batch Number: ${drugByDrugId.batchNumber}`);
      console.log(`   - Blockchain ID: ${drugByDrugId.blockchain?.blockchainId}`);
    } else {
      console.log('   ❌ Không tìm thấy');
    }

    // Test với findByQRCode
    console.log('\n3️⃣ Test với findByQRCode (blockchainId):');
    try {
      const foundByQR = await Drug.findByQRCode(blockchainId);
      if (foundByQR) {
        console.log('   ✅ Tìm thấy!');
        console.log(`   - Tên: ${foundByQR.name}`);
        console.log(`   - Drug ID: ${foundByQR.drugId}`);
        console.log(`   - Batch Number: ${foundByQR.batchNumber}`);
      } else {
        console.log('   ❌ Không tìm thấy');
      }
    } catch (error) {
      console.log(`   ❌ Lỗi: ${error.message}`);
    }

    // Test với findByQRCode (drugId)
    console.log('\n4️⃣ Test với findByQRCode (drugId):');
    try {
      const foundByQR2 = await Drug.findByQRCode(drugId);
      if (foundByQR2) {
        console.log('   ✅ Tìm thấy!');
        console.log(`   - Tên: ${foundByQR2.name}`);
        console.log(`   - Drug ID: ${foundByQR2.drugId}`);
        console.log(`   - Batch Number: ${foundByQR2.batchNumber}`);
      } else {
        console.log('   ❌ Không tìm thấy');
      }
    } catch (error) {
      console.log(`   ❌ Lỗi: ${error.message}`);
    }

    // Test với JSON format
    console.log('\n5️⃣ Test với JSON format:');
    try {
      const jsonQR = JSON.stringify({ drugId: drugId });
      const foundByJSON = await Drug.findByQRCode(jsonQR);
      if (foundByJSON) {
        console.log('   ✅ Tìm thấy!');
        console.log(`   - Tên: ${foundByJSON.name}`);
        console.log(`   - Drug ID: ${foundByJSON.drugId}`);
      } else {
        console.log('   ❌ Không tìm thấy');
      }
    } catch (error) {
      console.log(`   ❌ Lỗi: ${error.message}`);
    }

    // Tìm các thuốc có blockchainId tương tự (để debug)
    console.log('\n6️⃣ Tìm các blockchainId tương tự (bắt đầu với BC_1764951024):');
    const similarDrugs = await Drug.find({
      'blockchain.blockchainId': { $regex: /^BC_1764951024/ }
    }).select('drugId batchNumber name blockchain.blockchainId').limit(5);
    
    if (similarDrugs.length > 0) {
      console.log(`   Tìm thấy ${similarDrugs.length} thuốc tương tự:`);
      similarDrugs.forEach((drug, index) => {
        console.log(`   ${index + 1}. ${drug.name} - ${drug.blockchain?.blockchainId}`);
      });
    } else {
      console.log('   ❌ Không tìm thấy thuốc nào');
    }

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra thuốc:', error);
  }
};

// Main
const main = async () => {
  await connectDB();
  await checkSpecificDrug();
  await mongoose.connection.close();
  console.log('\n✅ Đã đóng kết nối MongoDB');
  process.exit(0);
};

main().catch(error => {
  console.error('❌ Lỗi:', error);
  process.exit(1);
});

