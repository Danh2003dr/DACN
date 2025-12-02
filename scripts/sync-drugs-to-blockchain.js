const mongoose = require('mongoose');
require('dotenv').config();
const Drug = require('../models/Drug');
const User = require('../models/User'); // Cần require User model để populate
const blockchainService = require('../services/blockchainService');
const { toJSONSafe } = require('../utils/jsonHelper');

/**
 * Script để sync tất cả dữ liệu thuốc lên blockchain Sepolia
 * Chạy script này để lưu tất cả drugs chưa có blockchain data lên Sepolia Testnet
 */
async function syncDrugsToBlockchain() {
  try {
    console.log('🚀 Bắt đầu sync dữ liệu thuốc lên blockchain Sepolia...\n');

    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB\n');

    // Khởi tạo blockchain service với Sepolia network
    const networkName = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
    console.log(`🔗 Đang khởi tạo blockchain service với network: ${networkName}...`);
    await blockchainService.initialize(networkName);
    
    // Kiểm tra contract address
    const contractAddress = blockchainService.getContractAddress(networkName);
    console.log(`✅ Blockchain service đã được khởi tạo`);
    console.log(`📍 Network: ${blockchainService.currentNetwork || networkName}`);
    console.log(`📝 Contract Address: ${contractAddress || 'Chưa có'}`);
    
    if (!contractAddress || contractAddress === '0x...') {
      console.warn('⚠️  Cảnh báo: Contract address chưa được cấu hình cho Sepolia!');
      console.warn('   Vui lòng set CONTRACT_ADDRESS_SEPOLIA trong file .env\n');
    } else {
      console.log('');
    }

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
        console.log(`  📤 Đang ghi lên blockchain Sepolia...`);
        const blockchainResult = await blockchainService.recordDrugBatchOnBlockchain(drugData);

        // Xử lý BigInt trong blockchainResult
        const safeResult = toJSONSafe(blockchainResult);

        if (safeResult && safeResult.success) {
          // Lấy contract address đúng cho network
          const contractAddress = blockchainService.getContractAddress(blockchainService.currentNetwork) 
            || process.env.CONTRACT_ADDRESS_SEPOLIA 
            || process.env.CONTRACT_ADDRESS 
            || 'N/A';
          
          // Xử lý blockNumber - đảm bảo không có BigInt
          let blockNumber = 0;
          if (safeResult.blockNumber) {
            blockNumber = typeof safeResult.blockNumber === 'bigint' 
              ? Number(safeResult.blockNumber) 
              : Number(safeResult.blockNumber || 0);
          }
          
          // Cập nhật thông tin blockchain vào drug
          drug.blockchain = {
            blockchainId: safeResult.blockchainId,
            transactionHash: safeResult.transactionHash || `mock_tx_${Date.now()}_${drug._id}`,
            blockNumber: blockNumber,
            blockchainTimestamp: safeResult.timestamp || Date.now(),
            digitalSignature: safeResult.signature,
            dataHash: safeResult.hash,
            isOnBlockchain: true,
            blockchainStatus: safeResult.mock ? 'pending' : 'confirmed',
            contractAddress: contractAddress,
            lastUpdated: new Date()
          };

          // Thêm transaction history nếu chưa có
          if (!drug.blockchain.transactionHistory) {
            drug.blockchain.transactionHistory = [];
          }
          drug.blockchain.transactionHistory.push({
            transactionHash: safeResult.transactionHash || `mock_tx_${Date.now()}_${drug._id}`,
            blockNumber: blockNumber,
            timestamp: safeResult.timestamp || Date.now(),
            action: 'sync',
            details: `Đồng bộ dữ liệu lên blockchain ${blockchainService.currentNetwork || 'sepolia'}`
          });

          await drug.save();
          successCount++;
          console.log(`  ✅ Đã sync thành công!`);
          console.log(`     Blockchain ID: ${drug.blockchain.blockchainId}`);
          console.log(`     Transaction: ${drug.blockchain.transactionHash?.substring(0, 20)}...`);
          console.log(`     Block: #${blockNumber}`);
        } else {
          failCount++;
          const errorMsg = safeResult?.error || 'Không xác định được lỗi';
          errors.push({ drug: drug.name, batch: drug.batchNumber, error: errorMsg });
          console.log(`  ❌ Lỗi: ${errorMsg}`);
          
          // Lưu thông tin lỗi vào drug để debug sau
          if (!drug.blockchain) drug.blockchain = {};
          drug.blockchain.syncError = errorMsg;
          drug.blockchain.syncAttemptedAt = new Date();
          await drug.save();
        }
      } catch (error) {
        failCount++;
        errors.push({ drug: drug.name, batch: drug.batchNumber, error: error.message });
        console.error(`  ❌ Lỗi khi sync: ${error.message}`);
      }

      // Delay nhỏ để tránh quá tải blockchain network
      // Delay lâu hơn cho Sepolia để tránh rate limiting
      if (i < drugsToSync.length - 1) {
        const currentNetwork = blockchainService.currentNetwork || 'sepolia';
        const delay = currentNetwork === 'sepolia' ? 2000 : 500; // 2 giây cho Sepolia
        console.log(`  ⏳ Chờ ${delay/1000} giây trước khi tiếp tục...`);
        await new Promise(resolve => setTimeout(resolve, delay));
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

