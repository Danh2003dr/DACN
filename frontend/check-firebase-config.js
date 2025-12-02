/**
 * Script để kiểm tra Firebase config
 * Chạy: node check-firebase-config.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Kiểm tra Firebase Configuration...\n');

// Kiểm tra file .env
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.log('❌ File .env không tồn tại trong thư mục frontend');
  console.log('   Tạo file .env và thêm các biến sau:\n');
  console.log('   REACT_APP_FIREBASE_API_KEY=...');
  console.log('   REACT_APP_FIREBASE_AUTH_DOMAIN=...');
  console.log('   REACT_APP_FIREBASE_PROJECT_ID=...');
  console.log('   REACT_APP_FIREBASE_STORAGE_BUCKET=...');
  console.log('   REACT_APP_FIREBASE_MESSAGING_SENDER_ID=...');
  console.log('   REACT_APP_FIREBASE_APP_ID=...\n');
  process.exit(1);
}

// Đọc file .env
const envContent = fs.readFileSync(envPath, 'utf8');
const envVars = {};

envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

// Kiểm tra các biến cần thiết
const requiredVars = [
  'REACT_APP_FIREBASE_API_KEY',
  'REACT_APP_FIREBASE_AUTH_DOMAIN',
  'REACT_APP_FIREBASE_PROJECT_ID',
  'REACT_APP_FIREBASE_STORAGE_BUCKET',
  'REACT_APP_FIREBASE_MESSAGING_SENDER_ID',
  'REACT_APP_FIREBASE_APP_ID'
];

let allPresent = true;
console.log('📋 Kiểm tra các biến môi trường:\n');

requiredVars.forEach(varName => {
  const value = envVars[varName];
  if (value && value !== `your-${varName.toLowerCase().replace('react_app_', '').replace(/_/g, '-')}`) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: Chưa được cấu hình`);
    allPresent = false;
  }
});

if (allPresent) {
  console.log('\n✅ Tất cả Firebase config đã được cấu hình!');
  console.log('\n💡 Tiếp theo:');
  console.log('   1. Kiểm tra backend .env có FIREBASE_SERVICE_ACCOUNT_KEY hoặc FIREBASE_PROJECT_ID');
  console.log('   2. Start backend: npm run dev');
  console.log('   3. Start frontend: npm start');
  console.log('   4. Test đăng nhập Google tại http://localhost:3000/login\n');
} else {
  console.log('\n❌ Vui lòng cấu hình đầy đủ các biến môi trường trên');
  console.log('   Xem hướng dẫn trong FIREBASE_SETUP.md\n');
  process.exit(1);
}

