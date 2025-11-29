const mongoose = require('mongoose');
require('dotenv').config();
const backupService = require('../services/backupService');
const User = require('../models/User');

/**
 * Script để tự động backup định kỳ
 * Có thể chạy với cron job hoặc scheduled task
 */
async function autoBackup() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB');

    // Lấy admin user
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('⚠️  Không tìm thấy admin user.');
      process.exit(1);
    }

    // Tạo backup tự động
    const backupName = `auto-backup-${new Date().toISOString().split('T')[0]}`;
    console.log(`📦 Bắt đầu tạo backup: ${backupName}`);

    const result = await backupService.createBackup({
      name: backupName,
      type: 'full',
      scope: 'all',
      format: 'mongodump',
      expiresInDays: 30,
      notes: 'Tự động backup định kỳ'
    }, adminUser);

    console.log('✅ Backup thành công!');
    console.log(`   - File: ${result.filePath}`);
    console.log(`   - Kích thước: ${(result.fileSize / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   - Backup ID: ${result.backup._id}`);

    // Cleanup expired backups
    console.log('\n🧹 Đang cleanup backups hết hạn...');
    const cleanupResult = await backupService.cleanupExpiredBackups();
    console.log(`✅ Đã xóa ${cleanupResult.deleted} backup(s) hết hạn`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo backup tự động:', error);
    process.exit(1);
  }
}

// Chạy script
if (require.main === module) {
  autoBackup();
}

module.exports = autoBackup;

