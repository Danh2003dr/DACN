const mongoose = require('mongoose');
require('dotenv').config();
const Drug = require('../models/Drug');
const User = require('../models/User'); // Cần require User model để populate
const blockchainService = require('../services/blockchainService');

/**
 * Script để sync tất cả dữ liệu thuốc lên blockchain
 * Chạy script này để lưu tất cả drugs chưa có blockchain data lên blockchain
 */
async function syncDrugsToBlockchain() {
  try {
    console.log('🚀 Bắt đầu sync dữ liệu thuốc lên blockchain...\n');

    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB\n');

    // Khởi tạo blockchain service
    console.log('🔗 Đang khởi tạo blockchain service...');
    await blockchainService.initialize();
    console.log('✅ Blockchain service đã được khởi tạo\n');

    // Lấy tất cả drugs chưa có blockchain data hoặc isOnBlockchain = false
    const drugsToSync = await Drug.find({
      $or: [
        { 'blockchain.isOnBlockchain': { $ne: true } },
        { 'blockchain.isOnBlockchain': false },
        { 'blockchain.isOnBlockchain': { $exists: false } }
      ]
    }).populate('manufacturerId', 'fullName organizationId');

    console.log(`📦 Tìm thấy ${drugsToSync.length} lô thuốc cần sync lên blockchain\n`);

    if (drugsToSync.length === 0) {
      console.log('✅ Tất cả dữ liệu thuốc đã được sync lên blockchain!');
      await mongoose.disconnect();
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Sync từng drug
    for (let i = 0; i < drugsToSync.length; i++) {
      const drug = drugsToSync[i];
      console.log(`\n[${i + 1}/${drugsToSync.length}] Đang sync: ${drug.name} (${drug.batchNumber})`);

      try {
        // Chuẩn bị dữ liệu cho blockchain
        const drugData = {
          drugId: drug.drugId || drug._id.toString(),
          name: drug.name,
          activeIngredient: drug.activeIngredient,
          dosage: drug.dosage,
          form: drug.form,
          batchNumber: drug.batchNumber,
          productionDate: drug.productionDate,
          expiryDate: drug.expiryDate,
          manufacturerId: drug.manufacturerId?._id?.toString() || drug.manufacturerId?.toString() || drug.createdBy?.toString(),
          qualityTest: drug.qualityTest || {
            testDate: new Date(),
            testResult: 'đang kiểm định',
            testBy: 'Hệ thống'
          },
          qrCode: drug.qrCode || {
            data: JSON.stringify({
              drugId: drug.drugId || drug._id.toString(),
              name: drug.name,
              batchNumber: drug.batchNumber,
              expiryDate: drug.expiryDate,
              manufacturerId: drug.manufacturerId?._id?.toString() || drug.manufacturerId?.toString(),
              timestamp: Date.now()
            })
          }
        };

        // Ghi lên blockchain
        const blockchainResult = await blockchainService.recordDrugBatchOnBlockchain(drugData);

        if (blockchainResult && blockchainResult.success) {
          // Cập nhật thông tin blockchain vào drug
          drug.blockchain = {
            blockchainId: blockchainResult.blockchainId,
            transactionHash: blockchainResult.transactionHash || `mock_tx_${Date.now()}_${drug._id}`,
            blockNumber: blockchainResult.blockNumber || 0,
            blockchainTimestamp: blockchainResult.timestamp || Date.now(),
            digitalSignature: blockchainResult.signature,
            dataHash: blockchainResult.hash,
            isOnBlockchain: true,
            blockchainStatus: 'confirmed',
            contractAddress: process.env.CONTRACT_ADDRESS || blockchainService.contractAddresses[blockchainService.currentNetwork] || 'mock',
            lastUpdated: new Date()
          };

          // Thêm transaction history nếu chưa có
          if (!drug.blockchain.transactionHistory) {
            drug.blockchain.transactionHistory = [];
          }
          drug.blockchain.transactionHistory.push({
            transactionHash: blockchainResult.transactionHash || `mock_tx_${Date.now()}_${drug._id}`,
            blockNumber: blockchainResult.blockNumber || 0,
            timestamp: blockchainResult.timestamp || Date.now(),
            action: 'sync',
            details: 'Đồng bộ dữ liệu lên blockchain'
          });

          await drug.save();
          successCount++;
          console.log(`  ✅ Đã sync thành công: ${drug.blockchain.blockchainId}`);
        } else {
          failCount++;
          const errorMsg = blockchainResult?.error || 'Không xác định được lỗi';
          errors.push({ drug: drug.name, batch: drug.batchNumber, error: errorMsg });
          console.log(`  ❌ Lỗi: ${errorMsg}`);
        }
      } catch (error) {
        failCount++;
        errors.push({ drug: drug.name, batch: drug.batchNumber, error: error.message });
        console.error(`  ❌ Lỗi khi sync: ${error.message}`);
      }

      // Delay nhỏ để tránh quá tải
      if (i < drugsToSync.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Tổng kết
    console.log('\n===========================================');
    console.log('📊 TỔNG KẾT:');
    console.log(`  ✅ Thành công: ${successCount}`);
    console.log(`  ❌ Thất bại: ${failCount}`);
    console.log(`  📦 Tổng cộng: ${drugsToSync.length}`);
    console.log('===========================================\n');

    if (errors.length > 0) {
      console.log('❌ Các lỗi gặp phải:');
      errors.forEach((err, index) => {
        console.log(`  ${index + 1}. ${err.drug} (${err.batch}): ${err.error}`);
      });
      console.log('');
    }

    if (successCount > 0) {
      console.log('✅ Đã sync thành công một số dữ liệu lên blockchain!');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi sync dữ liệu:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Chạy script
syncDrugsToBlockchain();

