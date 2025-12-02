const mongoose = require('mongoose');
require('dotenv').config();
const Drug = require('../models/Drug');
const User = require('../models/User');
const blockchainService = require('../services/blockchainService');
const { toJSONSafe } = require('../utils/jsonHelper');

/**
 * Script để sync lại các drugs có blockchain ID nhưng không tồn tại trên smart contract Sepolia
 * Script này sẽ:
 * 1. Tìm tất cả drugs có blockchain ID
 * 2. Verify từng drug trên smart contract
 * 3. Nếu drug không tồn tại, sync lại lên blockchain
 */
async function reSyncDrugsToBlockchain() {
  try {
    console.log('🚀 Bắt đầu kiểm tra và sync lại các drugs không tồn tại trên blockchain Sepolia...\n');

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
    console.log(`📝 Contract Address: ${contractAddress || 'Chưa có'}\n`);

    if (!contractAddress || contractAddress === '0x...') {
      console.error('❌ Contract address chưa được cấu hình cho Sepolia!');
      console.error('   Vui lòng set CONTRACT_ADDRESS_SEPOLIA trong file .env\n');
      await mongoose.disconnect();
      process.exit(1);
    }

    // Lấy tất cả drugs có blockchain ID
    const allDrugsWithBlockchain = await Drug.find({
      'blockchain.blockchainId': { $exists: true, $ne: null }
    }).populate('manufacturerId', 'fullName organizationId');

    console.log(`📦 Tìm thấy ${allDrugsWithBlockchain.length} lô thuốc có blockchain ID\n`);

    if (allDrugsWithBlockchain.length === 0) {
      console.log('ℹ️  Không có thuốc nào có blockchain ID để kiểm tra.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Kiểm tra từng drug xem có tồn tại trên smart contract không
    const drugsToSync = [];
    
    console.log('🔍 Đang kiểm tra từng drug trên smart contract...\n');
    
    for (let i = 0; i < allDrugsWithBlockchain.length; i++) {
      const drug = allDrugsWithBlockchain[i];
      const drugId = drug.drugId || drug._id.toString();
      
      process.stdout.write(`[${i + 1}/${allDrugsWithBlockchain.length}] Kiểm tra: ${drug.name} (${drug.batchNumber})... `);
      
      try {
        // Kiểm tra xem drug có tồn tại trên smart contract không
        const existsResult = await blockchainService.drugBatchExists(drugId);
        
        if (!existsResult.success || !existsResult.exists) {
          // Drug không tồn tại trên smart contract
          drugsToSync.push(drug);
          console.log('❌ Không tồn tại');
        } else {
          // Verify để xem status
          const verifyResult = await blockchainService.verifyDrugBatch(drugId);
          if (verifyResult.success) {
            const status = verifyResult.status || 'Unknown';
            console.log(`✅ Tồn tại - Status: ${status}`);
          } else {
            console.log('⚠️  Không thể verify');
          }
        }
      } catch (error) {
        console.log(`❌ Lỗi: ${error.message}`);
        // Nếu lỗi là "drug not found", thêm vào danh sách sync
        if (error.message.includes('not found') || error.message.includes('Not Found')) {
          drugsToSync.push(drug);
        }
      }
      
      // Delay nhỏ để tránh quá tải
      if (i < allDrugsWithBlockchain.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`\n📋 Tìm thấy ${drugsToSync.length} lô thuốc cần sync lại lên blockchain\n`);

    if (drugsToSync.length === 0) {
      console.log('✅ Tất cả drugs đã tồn tại trên blockchain!');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Hỏi xem có muốn tiếp tục sync không
    console.log('⚠️  Bạn có muốn sync lại các drugs này lên blockchain?');
    console.log('   (Script sẽ tự động tiếp tục sau 3 giây...)\n');
    
    // Tự động tiếp tục sau 3 giây (có thể bỏ qua bằng cách nhấn Ctrl+C)
    await new Promise(resolve => setTimeout(resolve, 3000));

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
            ...drug.blockchain, // Giữ lại blockchain ID cũ nếu có
            blockchainId: safeResult.blockchainId || drug.blockchain?.blockchainId,
            transactionHash: safeResult.transactionHash || drug.blockchain?.transactionHash,
            blockNumber: blockNumber || drug.blockchain?.blockNumber,
            blockchainTimestamp: safeResult.timestamp || drug.blockchain?.blockchainTimestamp,
            digitalSignature: safeResult.signature || drug.blockchain?.digitalSignature,
            dataHash: safeResult.hash || drug.blockchain?.dataHash,
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
            transactionHash: safeResult.transactionHash || `sync_tx_${Date.now()}_${drug._id}`,
            blockNumber: blockNumber,
            timestamp: safeResult.timestamp || Date.now(),
            action: 're-sync',
            details: `Đồng bộ lại dữ liệu lên blockchain ${blockchainService.currentNetwork || 'sepolia'}`
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

      // Delay để tránh quá tải blockchain network
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
      console.log('✅ Đã sync lại thành công một số dữ liệu lên blockchain!');
      console.log('   Bây giờ các drugs sẽ hiển thị trạng thái đúng trên Blockchain Dashboard.\n');
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
reSyncDrugsToBlockchain();
