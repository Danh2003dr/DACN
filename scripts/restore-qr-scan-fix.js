#!/usr/bin/env node

/**
 * Script để restore các thay đổi đã fix lỗi QR code scanning
 * 
 * Sử dụng: node scripts/restore-qr-scan-fix.js
 * 
 * Script này sẽ:
 * 1. Kiểm tra các file đã thay đổi
 * 2. Hiển thị hướng dẫn restore
 * 3. Tạo backup của các file hiện tại
 */

const fs = require('fs');
const path = require('path');

const filesToCheck = [
  'controllers/drugController.js',
  'frontend/src/pages/QRScanner.js'
];

const backupDir = path.join(__dirname, '..', 'backups', 'qr-scan-fix');

console.log('🔍 Kiểm tra các file đã thay đổi...\n');

// Tạo thư mục backup nếu chưa có
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
  console.log(`✅ Đã tạo thư mục backup: ${backupDir}\n`);
}

let hasChanges = false;

filesToCheck.forEach(file => {
  const filePath = path.join(__dirname, '..', file);
  
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const size = stats.size;
    const modified = stats.mtime;
    
    console.log(`📄 ${file}`);
    console.log(`   Size: ${size} bytes`);
    console.log(`   Modified: ${modified.toLocaleString()}`);
    
    // Tạo backup
    const backupPath = path.join(backupDir, file.replace(/\//g, '_'));
    fs.copyFileSync(filePath, backupPath);
    console.log(`   ✅ Backup: ${backupPath}\n`);
    
    hasChanges = true;
  } else {
    console.log(`⚠️  File không tồn tại: ${file}\n`);
  }
});

if (hasChanges) {
  console.log('📋 Hướng dẫn restore:');
  console.log('1. Xem file BACKUP_QR_SCAN_FIX.md để biết chi tiết các thay đổi');
  console.log('2. Copy code từ BACKUP_QR_SCAN_FIX.md vào các file tương ứng');
  console.log('3. Hoặc restore từ git: git checkout controllers/drugController.js frontend/src/pages/QRScanner.js');
  console.log('\n✅ Backup đã được tạo trong:', backupDir);
} else {
  console.log('⚠️  Không tìm thấy file nào để backup');
}

console.log('\n📝 Để xem chi tiết các thay đổi, mở file: BACKUP_QR_SCAN_FIX.md');

