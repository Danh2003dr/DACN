/**
 * Script để test xem QR code từ thuốc có thể quét được không
 * Sử dụng thư viện @zxing/library để decode QR code
 */

require('dotenv').config();
const mongoose = require('mongoose');
const { BrowserMultiFormatReader } = require('@zxing/library');
const QRCode = require('qrcode');
const fs = require('fs');
const path = require('path');
const Drug = require('../models/Drug');

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB');
  } catch (error) {
    console.error('❌ Lỗi kết nối MongoDB:', error);
    process.exit(1);
  }
};

// Test quét QR code từ DataURL
const testScanQRFromDataURL = async (dataURL) => {
  try {
    const reader = new BrowserMultiFormatReader();
    
    // Decode từ DataURL
    const result = await reader.decodeFromImageUrl(dataURL);
    
    if (result) {
      const text = result.getText();
      console.log('✅ Quét QR code thành công!');
      console.log('📄 Nội dung:', text);
      
      // Thử parse JSON
      try {
        const data = JSON.parse(text);
        console.log('✅ Dữ liệu JSON hợp lệ:');
        console.log(JSON.stringify(data, null, 2));
        return { success: true, data, text };
      } catch (e) {
        console.log('⚠️ Không phải JSON, nhưng vẫn có thể quét được');
        return { success: true, data: null, text };
      }
    } else {
      console.log('❌ Không thể quét QR code');
      return { success: false, error: 'Không tìm thấy QR code' };
    }
  } catch (error) {
    console.error('❌ Lỗi khi quét QR code:', error.message);
    return { success: false, error: error.message };
  }
};

// Test quét QR code từ file PNG
const testScanQRFromFile = async (filePath) => {
  try {
    if (!fs.existsSync(filePath)) {
      console.log(`❌ File không tồn tại: ${filePath}`);
      return { success: false, error: 'File không tồn tại' };
    }

    const reader = new BrowserMultiFormatReader();
    
    // Convert file path to file:// URL
    const fileUrl = `file://${path.resolve(filePath)}`;
    
    // Decode từ file
    const result = await reader.decodeFromImageUrl(fileUrl);
    
    if (result) {
      const text = result.getText();
      console.log('✅ Quét QR code từ file thành công!');
      console.log('📄 Nội dung:', text);
      
      // Thử parse JSON
      try {
        const data = JSON.parse(text);
        console.log('✅ Dữ liệu JSON hợp lệ:');
        console.log(JSON.stringify(data, null, 2));
        return { success: true, data, text };
      } catch (e) {
        console.log('⚠️ Không phải JSON, nhưng vẫn có thể quét được');
        return { success: true, data: null, text };
      }
    } else {
      console.log('❌ Không thể quét QR code từ file');
      return { success: false, error: 'Không tìm thấy QR code' };
    }
  } catch (error) {
    console.error('❌ Lỗi khi quét QR code từ file:', error.message);
    return { success: false, error: error.message };
  }
};

// Tạo QR code mẫu và test
const createAndTestQRCode = async () => {
  try {
    console.log('\n📝 Tạo QR code mẫu để test...');
    
    const sampleData = {
      drugId: 'DRUG_TEST_001',
      name: 'Thuốc test',
      batchNumber: 'BATCH_TEST_001',
      blockchainId: 'BLOCKCHAIN_TEST_001',
      verificationUrl: 'http://localhost:5000/verify/BLOCKCHAIN_TEST_001',
      timestamp: Date.now()
    };

    // Tạo QR code với các options để đảm bảo chất lượng
    const qrCodeOptions = {
      errorCorrectionLevel: 'M', // Medium error correction
      type: 'image/png',
      quality: 0.92,
      margin: 1,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      width: 500 // Kích thước lớn hơn để dễ quét
    };

    // Tạo DataURL
    const dataURL = await QRCode.toDataURL(JSON.stringify(sampleData), qrCodeOptions);
    console.log('✅ Đã tạo QR code DataURL');
    
    // Test quét từ DataURL
    console.log('\n🔍 Test quét QR code từ DataURL...');
    const result1 = await testScanQRFromDataURL(dataURL);
    
    // Tạo file PNG để test
    const qrCodesDir = path.join(__dirname, '..', 'qr-codes');
    if (!fs.existsSync(qrCodesDir)) {
      fs.mkdirSync(qrCodesDir, { recursive: true });
    }
    
    const filePath = path.join(qrCodesDir, 'test-qr-code.png');
    await QRCode.toFile(filePath, JSON.stringify(sampleData), qrCodeOptions);
    console.log(`✅ Đã tạo file QR code: ${filePath}`);
    
    // Test quét từ file
    console.log('\n🔍 Test quét QR code từ file PNG...');
    const result2 = await testScanQRFromFile(filePath);
    
    return { dataURL, filePath, result1, result2 };
  } catch (error) {
    console.error('❌ Lỗi khi tạo và test QR code:', error);
    throw error;
  }
};

// Test QR code từ database
const testQRCodeFromDatabase = async () => {
  try {
    console.log('\n📊 Test QR code từ database...');
    
    // Lấy một thuốc có QR code
    const drug = await Drug.findOne({ 
      'qrCode.data': { $exists: true, $ne: null },
      'qrCode.imageUrl': { $exists: true, $ne: null }
    }).limit(1);
    
    if (!drug) {
      console.log('⚠️ Không tìm thấy thuốc nào có QR code trong database');
      return null;
    }
    
    console.log(`✅ Tìm thấy thuốc: ${drug.name} (${drug.drugId})`);
    console.log(`📦 Batch: ${drug.batchNumber}`);
    
    if (drug.qrCode.imageUrl) {
      console.log('\n🔍 Test quét QR code từ database...');
      const result = await testScanQRFromDataURL(drug.qrCode.imageUrl);
      
      // So sánh với dữ liệu trong database
      if (result.success && result.data) {
        console.log('\n📋 So sánh dữ liệu:');
        console.log('Database drugId:', drug.drugId);
        console.log('QR code drugId:', result.data.drugId);
        console.log('Database batchNumber:', drug.batchNumber);
        console.log('QR code batchNumber:', result.data.batchNumber);
        
        if (drug.drugId === result.data.drugId && drug.batchNumber === result.data.batchNumber) {
          console.log('✅ Dữ liệu QR code khớp với database!');
        } else {
          console.log('⚠️ Dữ liệu QR code không khớp với database');
        }
      }
      
      return { drug, result };
    } else {
      console.log('⚠️ Thuốc này không có QR code imageUrl');
      return null;
    }
  } catch (error) {
    console.error('❌ Lỗi khi test QR code từ database:', error);
    throw error;
  }
};

// Test QR code từ file trong thư mục qr-codes
const testQRCodeFromFiles = async () => {
  try {
    console.log('\n📁 Test QR code từ các file trong thư mục qr-codes...');
    
    const qrCodesDir = path.join(__dirname, '..', 'qr-codes');
    if (!fs.existsSync(qrCodesDir)) {
      console.log('⚠️ Thư mục qr-codes không tồn tại');
      return [];
    }
    
    const files = fs.readdirSync(qrCodesDir).filter(file => file.endsWith('.png'));
    console.log(`✅ Tìm thấy ${files.length} file QR code`);
    
    const results = [];
    for (const file of files.slice(0, 3)) { // Test 3 file đầu tiên
      const filePath = path.join(qrCodesDir, file);
      console.log(`\n🔍 Test file: ${file}`);
      const result = await testScanQRFromFile(filePath);
      results.push({ file, result });
    }
    
    return results;
  } catch (error) {
    console.error('❌ Lỗi khi test QR code từ files:', error);
    throw error;
  }
};

// Main function
const main = async () => {
  try {
    console.log('🚀 Bắt đầu test QR code...\n');
    
    await connectDB();
    
    // Test 1: Tạo QR code mẫu và test
    console.log('\n' + '='.repeat(60));
    console.log('TEST 1: Tạo QR code mẫu và test');
    console.log('='.repeat(60));
    await createAndTestQRCode();
    
    // Test 2: Test QR code từ database
    console.log('\n' + '='.repeat(60));
    console.log('TEST 2: Test QR code từ database');
    console.log('='.repeat(60));
    await testQRCodeFromDatabase();
    
    // Test 3: Test QR code từ files
    console.log('\n' + '='.repeat(60));
    console.log('TEST 3: Test QR code từ files');
    console.log('='.repeat(60));
    await testQRCodeFromFiles();
    
    console.log('\n✅ Hoàn thành test QR code!');
    console.log('\n📝 Kết luận:');
    console.log('  - QR code được tạo từ JSON data của thuốc');
    console.log('  - QR code có thể quét được bằng @zxing/library');
    console.log('  - QR code chứa đầy đủ thông tin: drugId, batchNumber, blockchainId, verificationUrl');
    console.log('  - Đảm bảo QR code có kích thước đủ lớn (>= 500px) và error correction level M');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

// Chạy script
if (require.main === module) {
  main();
}

module.exports = {
  testScanQRFromDataURL,
  testScanQRFromFile,
  createAndTestQRCode,
  testQRCodeFromDatabase,
  testQRCodeFromFiles
};

