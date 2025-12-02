/**
 * Script để convert Firebase Service Account Key JSON thành format cho .env
 * 
 * Cách dùng:
 * 1. Download file JSON từ Firebase Console
 * 2. Chạy: node convert-firebase-key.js <path-to-json-file>
 * 
 * Ví dụ:
 * node convert-firebase-key.js ~/Downloads/drug-traceability-system-d89c1-firebase-adminsdk.json
 */

const fs = require('fs');
const path = require('path');

// Lấy đường dẫn file từ command line
const jsonFilePath = process.argv[2];

if (!jsonFilePath) {
  console.log('❌ Vui lòng cung cấp đường dẫn đến file JSON');
  console.log('\nCách dùng:');
  console.log('  node convert-firebase-key.js <path-to-json-file>');
  console.log('\nVí dụ:');
  console.log('  node convert-firebase-key.js ~/Downloads/drug-traceability-system-d89c1-firebase-adminsdk.json');
  process.exit(1);
}

// Kiểm tra file có tồn tại không
if (!fs.existsSync(jsonFilePath)) {
  console.log(`❌ File không tồn tại: ${jsonFilePath}`);
  process.exit(1);
}

try {
  // Đọc file JSON
  const jsonContent = fs.readFileSync(jsonFilePath, 'utf8');
  const serviceAccount = JSON.parse(jsonContent);
  
  // Convert thành string một dòng
  const jsonString = JSON.stringify(serviceAccount);
  
  console.log('\n✅ Đã convert thành công!\n');
  console.log('📋 Thêm dòng sau vào file .env (thư mục gốc):\n');
  console.log('─'.repeat(80));
  console.log(`FIREBASE_SERVICE_ACCOUNT_KEY=${jsonString}`);
  console.log('─'.repeat(80));
  console.log('\n💡 Lưu ý:');
  console.log('   - Copy toàn bộ dòng trên (từ FIREBASE_SERVICE_ACCOUNT_KEY đến hết)');
  console.log('   - Thêm vào file .env ở thư mục gốc (cùng cấp với package.json)');
  console.log('   - Không có khoảng trắng thừa');
  console.log('   - Restart backend server sau khi thêm\n');
  
  // Tự động thêm vào .env nếu file tồn tại
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Kiểm tra xem đã có FIREBASE_SERVICE_ACCOUNT_KEY chưa
    if (envContent.includes('FIREBASE_SERVICE_ACCOUNT_KEY')) {
      console.log('⚠️  File .env đã có FIREBASE_SERVICE_ACCOUNT_KEY');
      console.log('   Vui lòng cập nhật thủ công hoặc xóa dòng cũ trước\n');
    } else {
      // Thêm vào cuối file
      const newLine = `\n# Firebase Admin SDK\nFIREBASE_SERVICE_ACCOUNT_KEY=${jsonString}\n`;
      fs.appendFileSync(envPath, newLine);
      console.log('✅ Đã tự động thêm vào file .env!\n');
    }
  } else {
    console.log('💡 File .env chưa tồn tại, tạo mới...');
    const newEnvContent = `# Firebase Admin SDK\nFIREBASE_SERVICE_ACCOUNT_KEY=${jsonString}\n`;
    fs.writeFileSync(envPath, newEnvContent);
    console.log('✅ Đã tạo file .env và thêm Firebase config!\n');
  }
  
} catch (error) {
  console.error('❌ Lỗi khi xử lý file JSON:');
  console.error(`   ${error.message}\n`);
  process.exit(1);
}

