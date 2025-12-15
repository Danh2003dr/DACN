const mongoose = require('mongoose');
require('dotenv').config();
const DigitalSignature = require('../models/DigitalSignature');
const User = require('../models/User'); // Cần require User model để populate
const blockchainService = require('../services/blockchainService');

/**
 * Script để kiểm tra xem chữ ký số đã được lưu lên blockchain chưa
 */
async function checkDigitalSignaturesBlockchain() {
  try {
    console.log('🔍 Kiểm tra chữ ký số trên blockchain...\n');

    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB\n');

    // Khởi tạo blockchain service
    const networkName = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
    console.log(`🔗 Đang khởi tạo blockchain service với network: ${networkName}...`);
    await blockchainService.initialize(networkName);
    console.log(`✅ Blockchain service đã được khởi tạo\n`);

    // Lấy tất cả chữ ký số
    const allSignatures = await DigitalSignature.find({})
      .populate('signedBy', 'fullName email role')
      .sort({ createdAt: -1 })
      .limit(50);

    console.log(`📋 Tìm thấy ${allSignatures.length} chữ ký số trong database\n`);

    if (allSignatures.length === 0) {
      console.log('ℹ️  Chưa có chữ ký số nào trong database.');
      await mongoose.disconnect();
      process.exit(0);
    }

    // Phân loại chữ ký số
    const withBlockchain = [];
    const withoutBlockchain = [];
    const verifiedOnChain = [];
    const notVerifiedOnChain = [];

    console.log('🔍 Đang kiểm tra từng chữ ký số...\n');

    for (let i = 0; i < allSignatures.length; i++) {
      const sig = allSignatures[i];
      const signatureId = sig._id.toString();
      
      process.stdout.write(`[${i + 1}/${allSignatures.length}] ${sig.signedByName} - ${sig.targetType}... `);

      // Kiểm tra có thông tin blockchain trong database không
      const hasBlockchainInfo = sig.blockchain && 
                                sig.blockchain.transactionHash && 
                                sig.blockchain.transactionHash !== '';

      if (hasBlockchainInfo) {
        withBlockchain.push(sig);
        console.log('✅ Có blockchain info');
        
        // Kiểm tra trên smart contract
        try {
          // Lấy signatureId từ blockchain field hoặc _id
          const sigIdForContract = sig.blockchain.signatureId || signatureId;
          
          // Kiểm tra xem có tồn tại trên smart contract không
          if (blockchainService.contract) {
            const exists = await blockchainService.contract.methods
              .digitalSignatureExists(sigIdForContract)
              .call();
            
            if (exists) {
              verifiedOnChain.push(sig);
              console.log(`     ✓ Verified trên smart contract`);
              
              // Lấy thông tin chi tiết từ contract
              try {
                const contractData = await blockchainService.contract.methods
                  .getDigitalSignature(sigIdForContract)
                  .call();
                
                console.log(`     📝 Contract data:`);
                console.log(`        - Signed by: ${contractData.signedBy}`);
                console.log(`        - Target: ${contractData.targetType} / ${contractData.targetId}`);
                console.log(`        - Data Hash: ${contractData.dataHash.substring(0, 20)}...`);
              } catch (e) {
                console.log(`     ⚠️  Không thể lấy chi tiết từ contract: ${e.message}`);
              }
            } else {
              notVerifiedOnChain.push(sig);
              console.log(`     ❌ Không tồn tại trên smart contract`);
            }
          } else {
            console.log(`     ⚠️  Contract chưa được khởi tạo`);
          }
        } catch (error) {
          console.log(`     ❌ Lỗi khi verify: ${error.message}`);
          notVerifiedOnChain.push(sig);
        }
      } else {
        withoutBlockchain.push(sig);
        console.log('❌ Chưa có blockchain info');
      }
    }

    // Tổng kết
    console.log('\n===========================================');
    console.log('📊 TỔNG KẾT:');
    console.log(`  📦 Tổng số chữ ký số: ${allSignatures.length}`);
    console.log(`  ✅ Có blockchain info: ${withBlockchain.length}`);
    console.log(`  ❌ Chưa có blockchain info: ${withoutBlockchain.length}`);
    console.log(`  ✓ Verified trên contract: ${verifiedOnChain.length}`);
    console.log(`  ✗ Không verify được: ${notVerifiedOnChain.length}`);
    console.log('===========================================\n');

    // Chi tiết các chữ ký số chưa có blockchain
    if (withoutBlockchain.length > 0) {
      console.log('📋 Các chữ ký số chưa có blockchain info:');
      withoutBlockchain.forEach((sig, index) => {
        console.log(`  ${index + 1}. ${sig.signedByName} - ${sig.targetType} (ID: ${sig._id})`);
        console.log(`     Created: ${sig.createdAt}`);
      });
      console.log('');
    }

    // Chi tiết các chữ ký số đã verify
    if (verifiedOnChain.length > 0) {
      console.log('✅ Các chữ ký số đã verify trên blockchain:');
      verifiedOnChain.forEach((sig, index) => {
        console.log(`  ${index + 1}. ${sig.signedByName} - ${sig.targetType}`);
        console.log(`     TX: ${sig.blockchain.transactionHash}`);
        console.log(`     Block: #${sig.blockchain.blockNumber}`);
      });
      console.log('');
    }

    // Chi tiết các chữ ký số có blockchain info nhưng không verify được
    if (notVerifiedOnChain.length > 0) {
      console.log('⚠️  Các chữ ký số có blockchain info nhưng không verify được:');
      notVerifiedOnChain.forEach((sig, index) => {
        console.log(`  ${index + 1}. ${sig.signedByName} - ${sig.targetType}`);
        console.log(`     TX: ${sig.blockchain.transactionHash}`);
        console.log(`     Có thể cần sync lại lên blockchain`);
      });
      console.log('');
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
checkDigitalSignaturesBlockchain();

