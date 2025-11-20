/**
 * Script tối ưu hóa MongoDB indexes
 * Chạy script này để tạo các indexes cần thiết cho performance
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Drug = require('../models/Drug');
const DigitalSignature = require('../models/DigitalSignature');
const SupplyChain = require('../models/SupplyChain');
const SignatureBatch = require('../models/SignatureBatch');
const SignatureTemplate = require('../models/SignatureTemplate');
const CAProvider = require('../models/CAProvider');

async function optimizeIndexes() {
  try {
    console.log('🔗 Kết nối MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability');
    console.log('✅ Đã kết nối MongoDB\n');

    console.log('📊 Bắt đầu tối ưu hóa indexes...\n');

    // Drug Collection Indexes
    console.log('📦 Tối ưu indexes cho Drug collection...');
    await Drug.collection.createIndex({ manufacturerId: 1, createdAt: -1 });
    await Drug.collection.createIndex({ status: 1, expiryDate: 1 });
    await Drug.collection.createIndex({ isRecalled: 1, status: 1 });
    await Drug.collection.createIndex({ 'blockchain.blockchainId': 1, 'blockchain.isOnBlockchain': 1 });
    await Drug.collection.createIndex({ expiryDate: 1, status: 1 }); // Cho truy vấn thuốc sắp hết hạn
    await Drug.collection.createIndex({ createdAt: -1, manufacturerId: 1 }); // Cho dashboard
    console.log('✅ Drug indexes đã được tối ưu');

    // DigitalSignature Collection Indexes
    console.log('\n📝 Tối ưu indexes cho DigitalSignature collection...');
    await DigitalSignature.collection.createIndex({ targetType: 1, targetId: 1, status: 1 });
    await DigitalSignature.collection.createIndex({ signedBy: 1, status: 1, createdAt: -1 });
    await DigitalSignature.collection.createIndex({ 'certificate.caProvider': 1, status: 1 });
    await DigitalSignature.collection.createIndex({ 'signingInfo.method': 1, createdAt: -1 });
    await DigitalSignature.collection.createIndex({ batchId: 1, status: 1 });
    await DigitalSignature.collection.createIndex({ 'template.templateId': 1, status: 1 });
    await DigitalSignature.collection.createIndex({ createdAt: -1, status: 1 }); // Cho pagination
    console.log('✅ DigitalSignature indexes đã được tối ưu');

    // SupplyChain Collection Indexes
    console.log('\n🔗 Tối ưu indexes cho SupplyChain collection...');
    await SupplyChain.collection.createIndex({ drugId: 1, status: 1, createdAt: -1 });
    await SupplyChain.collection.createIndex({ 'currentLocation.actorId': 1, status: 1 });
    await SupplyChain.collection.createIndex({ 'currentLocation.actorRole': 1, status: 1 });
    await SupplyChain.collection.createIndex({ 'steps.actorId': 1, 'steps.timestamp': -1 });
    await SupplyChain.collection.createIndex({ 'steps.action': 1, 'steps.timestamp': -1 });
    await SupplyChain.collection.createIndex({ 'blockchain.transactionHash': 1 });
    await SupplyChain.collection.createIndex({ createdAt: -1, status: 1 });
    console.log('✅ SupplyChain indexes đã được tối ưu');

    // SignatureBatch Collection Indexes
    console.log('\n📋 Tối ưu indexes cho SignatureBatch collection...');
    await SignatureBatch.collection.createIndex({ status: 1, targetType: 1, createdAt: -1 });
    await SignatureBatch.collection.createIndex({ createdBy: 1, status: 1, createdAt: -1 });
    await SignatureBatch.collection.createIndex({ templateId: 1, status: 1 });
    await SignatureBatch.collection.createIndex({ 'items.status': 1, 'items.targetId': 1 });
    console.log('✅ SignatureBatch indexes đã được tối ưu');

    // SignatureTemplate Collection Indexes
    console.log('\n📄 Tối ưu indexes cho SignatureTemplate collection...');
    await SignatureTemplate.collection.createIndex({ status: 1, targetType: 1, createdAt: -1 });
    await SignatureTemplate.collection.createIndex({ createdBy: 1, status: 1 });
    console.log('✅ SignatureTemplate indexes đã được tối ưu');

    // CAProvider Collection Indexes
    console.log('\n🏢 Tối ưu indexes cho CAProvider collection...');
    await CAProvider.collection.createIndex({ code: 1, status: 1 });
    await CAProvider.collection.createIndex({ status: 1, type: 1 });
    console.log('✅ CAProvider indexes đã được tối ưu');

    console.log('\n✨ Hoàn tất tối ưu hóa indexes!');
    console.log('\n📊 Thống kê indexes:');
    
    const collections = ['drugs', 'digitalsignatures', 'supplychains', 'signaturebatches', 'signaturetemplates', 'caproviders'];
    for (const collectionName of collections) {
      try {
        const indexes = await mongoose.connection.db.collection(collectionName).indexes();
        console.log(`  ${collectionName}: ${indexes.length} indexes`);
      } catch (e) {
        console.log(`  ${collectionName}: không tìm thấy collection`);
      }
    }

    await mongoose.connection.close();
    console.log('\n✅ Đã đóng kết nối MongoDB');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tối ưu indexes:', error);
    process.exit(1);
  }
}

optimizeIndexes();

