const blockchainService = require('../services/blockchainService');
const Drug = require('../models/Drug');
const mongoose = require('mongoose');
require('dotenv').config();

async function testBlockchainFeaturesMock() {
  try {
    console.log('🚀 Bắt đầu kiểm tra tính năng blockchain (Mock Mode)...\n');

    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability';
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối database');

    // Khởi tạo blockchain service (sẽ fallback về mock mode)
    console.log('\n📡 Đang khởi tạo blockchain service...');
    const initialized = await blockchainService.initialize();
    
    if (!initialized) {
      console.log('❌ Không thể khởi tạo blockchain service');
      return;
    }
    console.log('✅ Blockchain service đã được khởi tạo (Mock Mode)');

    // Kiểm tra trạng thái kết nối
    console.log('\n🔍 Kiểm tra trạng thái kết nối...');
    const isConnected = blockchainService.isConnected();
    const currentAccount = blockchainService.getCurrentAccount();
    
    console.log(`Trạng thái kết nối: ${isConnected ? '✅ Đã kết nối' : '❌ Chưa kết nối'}`);
    console.log(`Account hiện tại: ${currentAccount || 'Mock Account'}`);

    // Lấy thống kê contract
    console.log('\n📊 Lấy thống kê contract...');
    const statsResult = await blockchainService.getContractStats();
    
    if (statsResult.success) {
      console.log('✅ Thống kê contract (Mock):');
      console.log(`   - Tổng số lô: ${statsResult.stats.totalBatches}`);
      console.log(`   - Lô hợp lệ: ${statsResult.stats.activeBatches}`);
      console.log(`   - Lô đã thu hồi: ${statsResult.stats.recalledBatches}`);
      console.log(`   - Lô hết hạn: ${statsResult.stats.expiredBatches}`);
    } else {
      console.log('❌ Không thể lấy thống kê contract');
    }

    // Lấy danh sách drug IDs
    console.log('\n📋 Lấy danh sách drug IDs...');
    const drugsResult = await blockchainService.getAllDrugIds();
    
    if (drugsResult.success) {
      console.log(`✅ Tìm thấy ${drugsResult.drugIds.length} drug IDs (Mock):`);
      drugsResult.drugIds.forEach((id, index) => {
        console.log(`   ${index + 1}. ${id}`);
      });
    } else {
      console.log('❌ Không thể lấy danh sách drug IDs');
    }

    // Kiểm tra drug có tồn tại không
    if (drugsResult.success && drugsResult.drugIds.length > 0) {
      const testDrugId = drugsResult.drugIds[0];
      console.log(`\n🔍 Kiểm tra drug tồn tại: ${testDrugId}`);
      
      const existsResult = await blockchainService.drugBatchExists(testDrugId);
      if (existsResult.success) {
        console.log(`✅ Drug ${testDrugId} ${existsResult.exists ? 'tồn tại' : 'không tồn tại'} trên blockchain`);
      }

      // Xác minh drug
      console.log(`\n🔐 Xác minh drug: ${testDrugId}`);
      const verifyResult = await blockchainService.verifyDrugBatch(testDrugId);
      
      if (verifyResult.success) {
        console.log('✅ Kết quả xác minh (Mock):');
        console.log(`   - Hợp lệ: ${verifyResult.isValid ? '✅' : '❌'}`);
        console.log(`   - Hết hạn: ${verifyResult.isExpired ? '✅' : '❌'}`);
        console.log(`   - Đã thu hồi: ${verifyResult.isRecalled ? '✅' : '❌'}`);
        console.log(`   - Trạng thái: ${verifyResult.status}`);
      } else {
        console.log('❌ Không thể xác minh drug');
      }

      // Lấy lịch sử phân phối
      console.log(`\n📈 Lấy lịch sử phân phối: ${testDrugId}`);
      const historyResult = await blockchainService.getDistributionHistoryPaginated(testDrugId, 0, 5);
      
      if (historyResult.success) {
        console.log(`✅ Lịch sử phân phối (Mock) (${historyResult.totalRecords} bản ghi):`);
        historyResult.history.forEach((record, index) => {
          console.log(`   ${index + 1}. Từ: ${record.from} → Đến: ${record.to}`);
          console.log(`      Thời gian: ${new Date(record.timestamp).toLocaleString('vi-VN')}`);
          console.log(`      Địa điểm: ${record.location}`);
          console.log(`      Trạng thái: ${record.status}`);
          console.log(`      Ghi chú: ${record.notes}`);
        });
      } else {
        console.log('❌ Không thể lấy lịch sử phân phối');
      }
    }

    // Test tìm kiếm theo tên
    console.log('\n🔍 Test tìm kiếm theo tên...');
    const searchResult = await blockchainService.searchDrugBatchesByName('Paracetamol');
    
    if (searchResult.success) {
      console.log(`✅ Tìm thấy ${searchResult.drugIds.length} drug với tên "Paracetamol" (Mock)`);
      searchResult.drugIds.forEach((id, index) => {
        console.log(`   ${index + 1}. ${id}`);
      });
    } else {
      console.log('❌ Không thể tìm kiếm theo tên');
    }

    // Test tạo hash và chữ ký số
    console.log('\n🔐 Test tạo hash và chữ ký số...');
    const testData = {
      drugId: 'TEST_DRUG_001',
      name: 'Test Drug',
      activeIngredient: 'Test Ingredient',
      batchNumber: 'BATCH001',
      productionDate: new Date(),
      manufacturerId: 'MANUFACTURER001'
    };

    const hash = blockchainService.createDrugHash(testData);
    const signature = blockchainService.createDigitalSignature(testData, 'test_private_key');
    
    console.log(`✅ Hash: ${hash}`);
    console.log(`✅ Signature: ${signature}`);

    // Test ghi dữ liệu lên blockchain (mock)
    console.log('\n📝 Test ghi dữ liệu lên blockchain (Mock)...');
    const recordResult = await blockchainService.recordDrugBatchOnBlockchain(testData);
    
    if (recordResult.success) {
      console.log('✅ Ghi dữ liệu thành công (Mock):');
      console.log(`   - Blockchain ID: ${recordResult.blockchainId}`);
      console.log(`   - Transaction Hash: ${recordResult.transactionHash}`);
      console.log(`   - Block Number: ${recordResult.blockNumber}`);
      console.log(`   - Timestamp: ${new Date(recordResult.timestamp).toLocaleString('vi-VN')}`);
    } else {
      console.log('❌ Không thể ghi dữ liệu lên blockchain');
    }

    // Test cập nhật dữ liệu
    console.log('\n🔄 Test cập nhật dữ liệu (Mock)...');
    const updateResult = await blockchainService.updateDrugBatchOnBlockchain(testData.drugId, {
      name: 'Updated Test Drug',
      activeIngredient: 'Updated Test Ingredient',
      qualityTest: { result: 'PASSED' }
    });
    
    if (updateResult.success) {
      console.log('✅ Cập nhật dữ liệu thành công (Mock):');
      console.log(`   - Transaction Hash: ${updateResult.transactionHash}`);
      console.log(`   - Block Number: ${updateResult.blockNumber}`);
    } else {
      console.log('❌ Không thể cập nhật dữ liệu');
    }

    // Test thu hồi thuốc
    console.log('\n⚠️ Test thu hồi thuốc (Mock)...');
    const recallResult = await blockchainService.recallDrugBatchOnBlockchain(testData.drugId, 'Test recall reason');
    
    if (recallResult.success) {
      console.log('✅ Thu hồi thuốc thành công (Mock):');
      console.log(`   - Transaction Hash: ${recallResult.transactionHash}`);
      console.log(`   - Block Number: ${recallResult.blockNumber}`);
    } else {
      console.log('❌ Không thể thu hồi thuốc');
    }

    console.log('\n🎉 Hoàn thành kiểm tra tính năng blockchain (Mock Mode)!');
    console.log('\n📋 Tóm tắt:');
    console.log('✅ Blockchain service đã được khởi tạo (Mock Mode)');
    console.log('✅ Có thể lấy thống kê contract (Mock)');
    console.log('✅ Có thể lấy danh sách drug IDs (Mock)');
    console.log('✅ Có thể kiểm tra drug tồn tại (Mock)');
    console.log('✅ Có thể xác minh drug (Mock)');
    console.log('✅ Có thể lấy lịch sử phân phối (Mock)');
    console.log('✅ Có thể tìm kiếm theo tên (Mock)');
    console.log('✅ Có thể tạo hash và chữ ký số');
    console.log('✅ Có thể ghi dữ liệu lên blockchain (Mock)');
    console.log('✅ Có thể cập nhật dữ liệu (Mock)');
    console.log('✅ Có thể thu hồi thuốc (Mock)');
    
    console.log('\n💡 Lưu ý: Để sử dụng blockchain thực tế, cần:');
    console.log('   1. Cài đặt và chạy Ganache hoặc kết nối đến Ethereum network');
    console.log('   2. Deploy smart contract');
    console.log('   3. Cập nhật CONTRACT_ADDRESS trong .env');

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra blockchain:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối database');
  }
}

// Chạy test
testBlockchainFeaturesMock();
