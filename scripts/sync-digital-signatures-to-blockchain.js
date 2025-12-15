const mongoose = require('mongoose');
require('dotenv').config();
const DigitalSignature = require('../models/DigitalSignature');
const User = require('../models/User');
const blockchainService = require('../services/blockchainService');
const { toJSONSafe } = require('../utils/jsonHelper');

/**
 * Script để sync các chữ ký số chưa có blockchain info lên blockchain Sepolia
 */
async function syncDigitalSignaturesToBlockchain() {
  try {
    console.log('🚀 Bắt đầu sync chữ ký số lên blockchain Sepolia...\n');

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

    // Lấy tất cả chữ ký số chưa có blockchain info
    const signaturesToSync = await DigitalSignature.find({
      $or: [
        { 'blockchain.transactionHash': { $exists: false } },
        { 'blockchain.transactionHash': null },
        { 'blockchain.transactionHash': '' }
      ]
    }).populate('signedBy', 'fullName email role');

    console.log(`📦 Tìm thấy ${signaturesToSync.length} chữ ký số cần sync lên blockchain\n`);

    if (signaturesToSync.length === 0) {
      console.log('✅ Tất cả chữ ký số đã có blockchain info!');
      await mongoose.disconnect();
      process.exit(0);
    }

    let successCount = 0;
    let failCount = 0;
    const errors = [];

    // Sync từng chữ ký số
    for (let i = 0; i < signaturesToSync.length; i++) {
      const sig = signaturesToSync[i];
      console.log(`\n[${i + 1}/${signaturesToSync.length}] Đang sync: ${sig.signedByName} - ${sig.targetType} (${sig._id})`);

      try {
        // Chuẩn bị dữ liệu cho blockchain
        const signatureData = {
          signatureId: sig._id.toString(),
          targetType: sig.targetType,
          targetId: sig.targetId.toString(),
          dataHash: sig.dataHash,
          signature: sig.signature,
          certificateSerialNumber: sig.certificate.serialNumber,
          signedBy: sig.signedBy?._id?.toString() || sig.signedBy?.toString(),
          timestampedAt: sig.timestamp?.timestampedAt || sig.createdAt
        };

        // Ghi lên blockchain
        console.log(`  📤 Đang ghi lên blockchain Sepolia...`);
        const blockchainResult = await blockchainService.recordDigitalSignatureOnBlockchain(signatureData);

        // Xử lý BigInt trong blockchainResult
        const safeResult = toJSONSafe(blockchainResult);

        if (safeResult && safeResult.success) {
          // Xử lý blockNumber - đảm bảo không có BigInt
          let blockNumber = 0;
          if (safeResult.blockNumber) {
            blockNumber = typeof safeResult.blockNumber === 'bigint' 
              ? Number(safeResult.blockNumber) 
              : Number(safeResult.blockNumber || 0);
          }
          
          // Cập nhật thông tin blockchain vào chữ ký số
          sig.blockchain = {
            transactionHash: safeResult.transactionHash,
            blockNumber: blockNumber,
            timestamp: safeResult.timestamp || Date.now(),
            signatureId: safeResult.signatureId || sig._id.toString()
          };

          await sig.save();
          successCount++;
          console.log(`  ✅ Đã sync thành công!`);
          console.log(`     Transaction: ${sig.blockchain.transactionHash?.substring(0, 20)}...`);
          console.log(`     Block: #${blockNumber}`);
        } else {
          failCount++;
          const errorMsg = safeResult?.error || 'Không xác định được lỗi';
          errors.push({ signature: sig._id, error: errorMsg });
          console.log(`  ❌ Lỗi: ${errorMsg}`);
          
          // Lưu thông tin lỗi vào chữ ký số để debug sau
          if (!sig.blockchain) sig.blockchain = {};
          sig.blockchain.syncError = errorMsg;
          sig.blockchain.syncAttemptedAt = new Date();
          await sig.save();
        }
      } catch (error) {
        failCount++;
        errors.push({ signature: sig._id, error: error.message });
        console.error(`  ❌ Lỗi khi sync: ${error.message}`);
      }

      // Delay để tránh quá tải blockchain network
      if (i < signaturesToSync.length - 1) {
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
    console.log(`  📦 Tổng cộng: ${signaturesToSync.length}`);
    console.log('===========================================\n');

    if (errors.length > 0) {
      console.log('❌ Các lỗi gặp phải:');
      errors.forEach((err, index) => {
        console.log(`  ${index + 1}. Signature ${err.signature}: ${err.error}`);
      });
      console.log('');
    }

    if (successCount > 0) {
      console.log('✅ Đã sync thành công một số chữ ký số lên blockchain!');
      console.log('   Bây giờ các chữ ký số sẽ có thông tin blockchain trong database.\n');
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi sync chữ ký số:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Chạy script
syncDigitalSignaturesToBlockchain();

