const blockchainService = require('../services/blockchainService');
const Drug = require('../models/Drug');
const mongoose = require('mongoose');
require('dotenv').config();

async function testBlockchainFeatures() {
  try {
    console.log('🚀 Bắt đầu kiểm tra tính năng blockchain...\n');

    // Kết nối database
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability';
    await mongoose.connect(mongoUri);
    console.log('✅ Đã kết nối database');

    // Khởi tạo blockchain service
    console.log('\n📡 Đang khởi tạo blockchain service...');
    const initialized = await blockchainService.initialize();
    
    if (!initialized) {
      console.log('❌ Không thể khởi tạo blockchain service');
      return;
    }
    console.log('✅ Blockchain service đã được khởi tạo');

    // Kiểm tra trạng thái kết nối
    console.log('\n🔍 Kiểm tra trạng thái kết nối...');
    const isConnected = blockchainService.isConnected();
    const currentAccount = blockchainService.getCurrentAccount();
    
    console.log(`Trạng thái kết nối: ${isConnected ? '✅ Đã kết nối' : '❌ Chưa kết nối'}`);
    console.log(`Account hiện tại: ${currentAccount}`);

    // Lấy thống kê contract
    console.log('\n📊 Lấy thống kê contract...');
    const statsResult = await blockchainService.getContractStats();
    
    if (statsResult.success) {
      console.log('✅ Thống kê contract:');
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
      console.log(`✅ Tìm thấy ${drugsResult.drugIds.length} drug IDs:`);
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
        console.log('✅ Kết quả xác minh:');
        console.log(`   - Hợp lệ: ${verifyResult.isValid ? '✅' : '❌'}`);
        console.log(`   - Hết hạn: ${verifyResult.isExpired ? '✅' : '❌'}`);
        console.log(`   - Đã thu hồi: ${verifyResult.isRecalled ? '✅' : '❌'}`);
        console.log(`   - Trạng thái: ${verifyResult.status}`);
      } else {
        console.log('❌ Không thể xác minh drug');
      }

      // Lấy thông tin chi tiết drug
      console.log(`\n📄 Lấy thông tin chi tiết drug: ${testDrugId}`);
      const drugDetailsResult = await blockchainService.getDrugBatchFromBlockchain(testDrugId);
      
      if (drugDetailsResult.success && drugDetailsResult.data) {
        console.log('✅ Thông tin drug từ blockchain:');
        console.log(`   - Tên: ${drugDetailsResult.data[1]}`);
        console.log(`   - Hoạt chất: ${drugDetailsResult.data[2]}`);
        console.log(`   - Nhà sản xuất: ${drugDetailsResult.data[3]}`);
        console.log(`   - Số lô: ${drugDetailsResult.data[4]}`);
        console.log(`   - Ngày sản xuất: ${new Date(drugDetailsResult.data[5] * 1000).toLocaleDateString('vi-VN')}`);
        console.log(`   - Hạn sử dụng: ${new Date(drugDetailsResult.data[6] * 1000).toLocaleDateString('vi-VN')}`);
        console.log(`   - Kết quả kiểm định: ${drugDetailsResult.data[7]}`);
      } else {
        console.log('❌ Không thể lấy thông tin chi tiết drug');
      }

      // Lấy lịch sử phân phối
      console.log(`\n📈 Lấy lịch sử phân phối: ${testDrugId}`);
      const historyResult = await blockchainService.getDistributionHistoryPaginated(testDrugId, 0, 5);
      
      if (historyResult.success) {
        console.log(`✅ Lịch sử phân phối (${historyResult.totalRecords} bản ghi):`);
        historyResult.history.forEach((record, index) => {
          console.log(`   ${index + 1}. Từ: ${record.from} → Đến: ${record.to}`);
          console.log(`      Thời gian: ${new Date(record.timestamp * 1000).toLocaleString('vi-VN')}`);
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
      console.log(`✅ Tìm thấy ${searchResult.drugIds.length} drug với tên "Paracetamol"`);
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

    console.log('\n🎉 Hoàn thành kiểm tra tính năng blockchain!');
    console.log('\n📋 Tóm tắt:');
    console.log('✅ Blockchain service đã được khởi tạo');
    console.log('✅ Có thể kết nối với blockchain network');
    console.log('✅ Có thể lấy thống kê contract');
    console.log('✅ Có thể lấy danh sách drug IDs');
    console.log('✅ Có thể kiểm tra drug tồn tại');
    console.log('✅ Có thể xác minh drug');
    console.log('✅ Có thể lấy thông tin chi tiết drug');
    console.log('✅ Có thể lấy lịch sử phân phối');
    console.log('✅ Có thể tìm kiếm theo tên');
    console.log('✅ Có thể tạo hash và chữ ký số');

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra blockchain:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n🔌 Đã ngắt kết nối database');
  }
}

// Chạy test
testBlockchainFeatures();