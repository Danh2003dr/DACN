/**
 * Script để đồng bộ lại trạng thái blockchain cho các lô thuốc
 * Kiểm tra transaction trên blockchain và cập nhật vào database
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Drug = require('../models/Drug');
const blockchainService = require('../services/blockchainService');

async function syncDrugBlockchainStatus() {
  try {
    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability';
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB');

    // Khởi tạo blockchain service
    await blockchainService.initialize();
    console.log('✅ Đã khởi tạo blockchain service');

    // Tìm tất cả drugs có transactionHash nhưng chưa được đánh dấu là confirmed
    const drugsToSync = await Drug.find({
      $or: [
        { 'blockchain.transactionHash': { $exists: true, $ne: null } },
        { 'blockchain.isOnBlockchain': false },
        { 'blockchain.blockchainStatus': 'pending' }
      ]
    });

    console.log(`\n📋 Tìm thấy ${drugsToSync.length} lô thuốc cần đồng bộ\n`);

    let updated = 0;
    let errors = 0;

    for (const drug of drugsToSync) {
      try {
        const txHash = drug.blockchain?.transactionHash;
        
        if (!txHash) {
          console.log(`⚠️  ${drug.drugId} (${drug.name}): Không có transaction hash`);
          continue;
        }

        // Kiểm tra transaction trên blockchain
        console.log(`🔍 Đang kiểm tra transaction: ${txHash}...`);
        
        try {
          const receipt = await blockchainService.web3.eth.getTransactionReceipt(txHash);
          
          if (receipt && receipt.status) {
            // Transaction thành công
            const block = await blockchainService.web3.eth.getBlock(receipt.blockNumber);
            
            // Convert BigInt to Number for timestamp
            const blockTimestamp = typeof block.timestamp === 'bigint' 
              ? Number(block.timestamp) 
              : block.timestamp;
            
            // Cập nhật thông tin blockchain
            drug.blockchain = {
              ...drug.blockchain,
              transactionHash: txHash,
              blockNumber: Number(receipt.blockNumber),
              blockHash: receipt.blockHash,
              gasUsed: Number(receipt.gasUsed),
              isOnBlockchain: true,
              blockchainStatus: 'confirmed',
              blockchainTimestamp: new Date(blockTimestamp * 1000),
              lastUpdated: new Date()
            };

            // Thêm vào transaction history nếu chưa có
            if (!drug.blockchain.transactionHistory || drug.blockchain.transactionHistory.length === 0) {
              drug.blockchain.transactionHistory = [{
                transactionHash: txHash,
                blockNumber: Number(receipt.blockNumber),
                timestamp: new Date(blockTimestamp * 1000),
                action: 'create',
                details: 'Tạo lô thuốc mới trên blockchain'
              }];
            }

            await drug.save();
            console.log(`✅ ${drug.drugId} (${drug.name}): Đã cập nhật - Block: ${receipt.blockNumber}`);
            updated++;
          } else {
            console.log(`❌ ${drug.drugId} (${drug.name}): Transaction thất bại`);
            drug.blockchain = {
              ...drug.blockchain,
              blockchainStatus: 'failed',
              lastUpdated: new Date()
            };
            await drug.save();
            errors++;
          }
        } catch (txError) {
          // Transaction không tồn tại - có thể là mock data
          if (txError.message.includes('Transaction not found') || txError.message.includes('not found')) {
            console.log(`⚠️  ${drug.drugId} (${drug.name}): Transaction không tồn tại (có thể là mock data)`);
            // Đánh dấu là mock nếu chưa có và chưa được confirm
            if (drug.blockchain.blockchainStatus !== 'mock' && drug.blockchain.blockchainStatus !== 'confirmed') {
              drug.blockchain = {
                ...drug.blockchain,
                blockchainStatus: 'mock',
                isOnBlockchain: false,
                lastUpdated: new Date()
              };
              try {
                await drug.save();
                console.log(`   → Đã đánh dấu là mock data`);
              } catch (saveError) {
                console.log(`   → Lỗi khi lưu: ${saveError.message}`);
              }
            }
          } else {
            console.log(`⚠️  ${drug.drugId} (${drug.name}): Lỗi khi kiểm tra transaction`);
            console.log(`   Error: ${txError.message}`);
            errors++;
          }
        }
      } catch (error) {
        console.error(`❌ Lỗi khi xử lý ${drug.drugId}:`, error.message);
        errors++;
      }
    }

    console.log(`\n📊 Kết quả:`);
    console.log(`   ✅ Đã cập nhật: ${updated}`);
    console.log(`   ❌ Lỗi: ${errors}`);
    console.log(`   📋 Tổng: ${drugsToSync.length}\n`);

    await mongoose.disconnect();
    console.log('✅ Đã đóng kết nối MongoDB');
    process.exit(0);

  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

// Chạy script
syncDrugBlockchainStatus();

