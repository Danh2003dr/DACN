/**
 * Script để kiểm tra Firebase Admin config cho backend
 * Chạy: node check-firebase-backend.js
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config();

console.log('🔍 Kiểm tra Firebase Backend Configuration...\n');

// Kiểm tra các biến môi trường
const hasServiceAccount = !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
const hasProjectId = !!process.env.FIREBASE_PROJECT_ID;

console.log('📋 Kiểm tra cấu hình:\n');

if (hasServiceAccount) {
  try {
    const key = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    console.log('✅ FIREBASE_SERVICE_ACCOUNT_KEY: Đã được cấu hình');
    console.log(`   Project ID: ${key.project_id || 'N/A'}`);
    console.log(`   Client Email: ${key.client_email || 'N/A'}\n`);
  } catch (error) {
    console.log('❌ FIREBASE_SERVICE_ACCOUNT_KEY: JSON không hợp lệ');
    console.log(`   Lỗi: ${error.message}\n`);
  }
} else if (hasProjectId) {
  console.log(`✅ FIREBASE_PROJECT_ID: ${process.env.FIREBASE_PROJECT_ID}`);
  console.log('   ⚠️  Lưu ý: Cần default credentials từ GCP để hoạt động\n');
} else {
  console.log('❌ Chưa có cấu hình Firebase Admin SDK');
  console.log('   Thêm một trong các biến sau vào .env:\n');
  console.log('   Option 1 (Recommended):');
  console.log('   FIREBASE_SERVICE_ACCOUNT_KEY={"type":"service_account",...}\n');
  console.log('   Option 2:');
  console.log('   FIREBASE_PROJECT_ID=your-project-id\n');
  process.exit(1);
}

// Test Firebase Admin initialization
console.log('🧪 Test Firebase Admin SDK...\n');

try {
  const admin = require('./config/firebaseAdmin');
  
  if (admin) {
    console.log('✅ Firebase Admin SDK đã được khởi tạo thành công!\n');
    console.log('💡 Backend đã sẵn sàng xử lý Firebase authentication\n');
  } else {
    console.log('❌ Firebase Admin SDK chưa được khởi tạo');
    console.log('   Kiểm tra lại cấu hình trong .env\n');
    process.exit(1);
  }
} catch (error) {
  console.log('❌ Lỗi khi khởi tạo Firebase Admin SDK:');
  console.log(`   ${error.message}\n`);
  process.exit(1);
}

