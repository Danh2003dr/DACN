const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const Backup = require('../models/Backup');
const auditService = require('./auditService');

const execAsync = promisify(exec);

/**
 * Backup Service
 * Service để xử lý backup và restore database
 */

// Đường dẫn thư mục backup
const BACKUP_DIR = path.join(process.cwd(), 'backups');

// Đảm bảo thư mục backup tồn tại
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

/**
 * Tạo backup database
 */
const createBackup = async (options = {}, user, req = null) => {
  const {
    name,
    type = 'full',
    scope = 'all',
    format = 'mongodump',
    collections = [],
    expiresInDays = 30,
    notes
  } = options;

  try {
    // Tạo backup record
    const backupName = name || `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    const backup = await Backup.create({
      name: backupName,
      type,
      scope,
      format,
      status: 'in_progress',
      database: {
        name: mongoose.connection.name,
        collections: collections.length > 0 ? collections : [],
        recordCount: 0
      },
      metadata: {
        mongooseVersion: mongoose.version,
        nodeVersion: process.version,
        timestamp: new Date()
      },
      createdBy: user._id,
      expiresAt: expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : null,
      notes
    });

    // Tạo thư mục backup
    const backupPath = path.join(BACKUP_DIR, backup._id.toString());
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    let filePath;
    let fileSize = 0;

    if (format === 'mongodump') {
      // Sử dụng mongodump
      const dumpPath = path.join(backupPath, 'dump');
      // Lấy MongoDB URI từ environment hoặc connection string
      let uri = process.env.MONGODB_URI;
      if (!uri && mongoose.connection) {
        const host = mongoose.connection.host || 'localhost';
        const port = mongoose.connection.port || 27017;
        const dbName = mongoose.connection.name || 'drug-traceability';
        uri = `mongodb://${host}:${port}/${dbName}`;
      }
      
      let mongodumpCmd = `mongodump --uri="${uri}" --out="${dumpPath}"`;
      
      if (collections.length > 0) {
        mongodumpCmd += ` --collection=${collections.join(' --collection=')}`;
      }

      try {
        await execAsync(mongodumpCmd);
        
        // Tạo archive
        const archivePath = path.join(BACKUP_DIR, `${backup._id.toString()}.tar.gz`);
        await execAsync(`tar -czf "${archivePath}" -C "${backupPath}" dump`);
        
        filePath = archivePath;
        const stats = fs.statSync(archivePath);
        fileSize = stats.size;
        
        // Xóa thư mục dump
        fs.rmSync(dumpPath, { recursive: true, force: true });
      } catch (error) {
        // Fallback: Export JSON nếu mongodump không có
        console.warn('mongodump không khả dụng, sử dụng JSON export');
        filePath = await exportToJSON(backup, backupPath, collections);
        const stats = fs.statSync(filePath);
        fileSize = stats.size;
      }
    } else if (format === 'json') {
      filePath = await exportToJSON(backup, backupPath, collections);
      const stats = fs.statSync(filePath);
      fileSize = stats.size;
    }

    // Cập nhật backup record
    backup.filePath = filePath;
    backup.fileSize = fileSize;
    backup.status = 'completed';
    backup.completedAt = new Date();
    await backup.save();

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'backup_create',
      module: 'backup',
      entityType: 'Backup',
      entityId: backup._id,
      description: `Tạo backup: ${backupName} (${format})`,
      metadata: {
        type,
        scope,
        fileSize,
        format
      },
      severity: 'high'
    }, req);

    return {
      success: true,
      backup,
      filePath,
      fileSize
    };
  } catch (error) {
    // Cập nhật backup record với lỗi
    if (backup) {
      backup.status = 'failed';
      backup.error = {
        message: error.message,
        stack: error.stack,
        occurredAt: new Date()
      };
      await backup.save();
    }

    throw error;
  }
};

/**
 * Export database to JSON
 */
const exportToJSON = async (backup, backupPath, collections = []) => {
  const models = mongoose.models;
  const collectionsToExport = collections.length > 0 
    ? collections 
    : Object.keys(models);

  const exportData = {};
  let totalRecords = 0;

  for (const collectionName of collectionsToExport) {
    try {
      const Model = models[collectionName];
      if (!Model) continue;

      const data = await Model.find({}).lean();
      exportData[collectionName] = data;
      totalRecords += data.length;
    } catch (error) {
      console.error(`Error exporting collection ${collectionName}:`, error);
    }
  }

  // Lưu vào file JSON
  const jsonPath = path.join(backupPath, 'backup.json');
  fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2), 'utf8');

  // Cập nhật record count
  backup.database.recordCount = totalRecords;
  await backup.save();

  return jsonPath;
};

/**
 * Restore từ backup
 */
const restoreBackup = async (backupId, options = {}, user, req = null) => {
  try {
    const backup = await Backup.findById(backupId);
    
    if (!backup) {
      throw new Error('Không tìm thấy backup.');
    }

    if (backup.status !== 'completed') {
      throw new Error(`Backup chưa hoàn thành. Trạng thái: ${backup.status}`);
    }

    if (!fs.existsSync(backup.filePath)) {
      throw new Error('File backup không tồn tại.');
    }

    const {
      dropBeforeRestore = false,
      collections = []
    } = options;

    // Ghi audit log trước khi restore
    await auditService.createAuditLog({
      user,
      action: 'backup_restore',
      module: 'backup',
      entityType: 'Backup',
      entityId: backup._id,
      description: `Khôi phục từ backup: ${backup.name}`,
      metadata: {
        dropBeforeRestore,
        collections
      },
      severity: 'critical'
    }, req);

    if (backup.format === 'mongodump') {
      // Sử dụng mongorestore
      // Lấy MongoDB URI từ environment hoặc connection string
      let uri = process.env.MONGODB_URI;
      if (!uri && mongoose.connection) {
        const host = mongoose.connection.host || 'localhost';
        const port = mongoose.connection.port || 27017;
        const dbName = mongoose.connection.name || 'drug-traceability';
        uri = `mongodb://${host}:${port}/${dbName}`;
      }
      const tempDir = path.join(BACKUP_DIR, `restore-${Date.now()}`);
      
      // Extract archive
      await execAsync(`tar -xzf "${backup.filePath}" -C "${tempDir}"`);
      
      let mongorestoreCmd = `mongorestore --uri="${uri}" "${path.join(tempDir, 'dump')}"`;
      
      if (dropBeforeRestore) {
        mongorestoreCmd += ' --drop';
      }
      
      if (collections.length > 0) {
        mongorestoreCmd += ` --collection=${collections.join(' --collection=')}`;
      }

      try {
        await execAsync(mongorestoreCmd);
        fs.rmSync(tempDir, { recursive: true, force: true });
      } catch (error) {
        // Fallback: Import từ JSON
        console.warn('mongorestore không khả dụng, sử dụng JSON import');
        await importFromJSON(backup.filePath, dropBeforeRestore, collections);
      }
    } else if (backup.format === 'json') {
      await importFromJSON(backup.filePath, dropBeforeRestore, collections);
    }

    return {
      success: true,
      message: 'Khôi phục dữ liệu thành công.'
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Import từ JSON file
 */
const importFromJSON = async (filePath, dropBeforeRestore = false, collections = []) => {
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const models = mongoose.models;
  const collectionsToImport = collections.length > 0 
    ? collections 
    : Object.keys(data);

  for (const collectionName of collectionsToImport) {
    try {
      const Model = models[collectionName];
      if (!Model) continue;

      if (dropBeforeRestore) {
        await Model.deleteMany({});
      }

      if (data[collectionName] && data[collectionName].length > 0) {
        await Model.insertMany(data[collectionName]);
      }
    } catch (error) {
      console.error(`Error importing collection ${collectionName}:`, error);
      throw error;
    }
  }
};

/**
 * Xóa backup cũ (tự động cleanup)
 */
const cleanupExpiredBackups = async () => {
  try {
    const expiredBackups = await Backup.find({
      expiresAt: { $lt: new Date() },
      status: 'completed'
    });

    for (const backup of expiredBackups) {
      // Xóa file
      if (fs.existsSync(backup.filePath)) {
        fs.unlinkSync(backup.filePath);
      }

      // Xóa record
      await Backup.findByIdAndDelete(backup._id);
    }

    return {
      deleted: expiredBackups.length
    };
  } catch (error) {
    console.error('Error cleaning up expired backups:', error);
    throw error;
  }
};

/**
 * Lấy thông tin backup file
 */
const getBackupInfo = async (backupId) => {
  const backup = await Backup.findById(backupId);
  
  if (!backup) {
    throw new Error('Không tìm thấy backup.');
  }

  const exists = fs.existsSync(backup.filePath);
  let fileStats = null;
  
  if (exists) {
    fileStats = fs.statSync(backup.filePath);
  }

  return {
    backup,
    exists,
    fileStats
  };
};

module.exports = {
  createBackup,
  restoreBackup,
  cleanupExpiredBackups,
  getBackupInfo,
  BACKUP_DIR
};

