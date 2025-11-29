const mongoose = require('mongoose');
require('dotenv').config();
const Drug = require('../models/Drug');

/**
 * Script để kiểm tra trạng thái blockchain của các lô thuốc
 */
async function checkDrugsBlockchainStatus() {
  try {
    console.log('🔍 Đang kiểm tra trạng thái blockchain của các lô thuốc...\n');

    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB\n');

    // Tổng số thuốc
    const totalDrugs = await Drug.countDocuments();
    console.log(`📦 Tổng số lô thuốc: ${totalDrugs}\n`);

    // Thuốc đã có trên blockchain
    const onBlockchain = await Drug.countDocuments({
      'blockchain.isOnBlockchain': true
    });

    // Thuốc chưa có trên blockchain
    const notOnBlockchain = await Drug.countDocuments({
      $or: [
        { 'blockchain.isOnBlockchain': { $ne: true } },
        { 'blockchain.isOnBlockchain': false },
        { 'blockchain.isOnBlockchain': { $exists: false } }
      ]
    });

    // Thuốc có blockchainId nhưng isOnBlockchain = false
    const hasBlockchainIdButNotSynced = await Drug.countDocuments({
      'blockchain.blockchainId': { $exists: true },
      'blockchain.isOnBlockchain': { $ne: true }
    });

    console.log('===========================================');
    console.log('📊 THỐNG KÊ BLOCKCHAIN:');
    console.log('===========================================');
    console.log(`  ✅ Đã sync lên blockchain: ${onBlockchain}`);
    console.log(`  ❌ Chưa sync lên blockchain: ${notOnBlockchain}`);
    console.log(`  ⚠️  Có blockchainId nhưng chưa sync: ${hasBlockchainIdButNotSynced}`);
    console.log(`  📦 Tổng cộng: ${totalDrugs}`);
    console.log('===========================================\n');

    // Nếu có thuốc chưa sync, hiển thị danh sách
    if (notOnBlockchain > 0) {
      console.log('📋 Danh sách các lô thuốc chưa sync:\n');
      const drugsToSync = await Drug.find({
        $or: [
          { 'blockchain.isOnBlockchain': { $ne: true } },
          { 'blockchain.isOnBlockchain': false },
          { 'blockchain.isOnBlockchain': { $exists: false } }
        ]
      }).select('name batchNumber drugId createdAt').limit(10).sort({ createdAt: -1 });

      drugsToSync.forEach((drug, index) => {
        console.log(`  ${index + 1}. ${drug.name} (${drug.batchNumber || drug.drugId})`);
      });

      if (notOnBlockchain > 10) {
        console.log(`  ... và ${notOnBlockchain - 10} lô thuốc khác\n`);
      } else {
        console.log('');
      }

      console.log('💡 Để sync các lô thuốc này, chạy lệnh:');
      console.log('   npm run sync:blockchain\n');
    }

    // Hiển thị một số thuốc đã sync (mẫu)
    if (onBlockchain > 0) {
      console.log('✅ Một số lô thuốc đã sync lên blockchain:\n');
      const syncedDrugs = await Drug.find({
        'blockchain.isOnBlockchain': true
      }).select('name batchNumber blockchain.blockchainId blockchain.transactionHash').limit(5).sort({ 'blockchain.lastUpdated': -1 });

      syncedDrugs.forEach((drug, index) => {
        console.log(`  ${index + 1}. ${drug.name} (${drug.batchNumber})`);
        console.log(`     Blockchain ID: ${drug.blockchain?.blockchainId || 'N/A'}`);
        console.log(`     Transaction: ${drug.blockchain?.transactionHash?.substring(0, 20) || 'N/A'}...`);
        console.log('');
      });

      if (onBlockchain > 5) {
        console.log(`  ... và ${onBlockchain - 5} lô thuốc khác đã sync\n`);
      }
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// Chạy script
checkDrugsBlockchainStatus();

