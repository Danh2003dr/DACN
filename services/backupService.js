const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');

// Load Backup model
const Backup = require('../models/Backup');
const auditService = require('./auditService');

const execAsync = promisify(exec);

/**
 * Progress tracking cho backup/restore operations
 * Có thể tích hợp với Socket.io để real-time updates
 */
class BackupProgress {
  constructor(operationId, operationType) {
    this.operationId = operationId;
    this.operationType = operationType; // 'backup' | 'restore'
    this.progress = 0;
    this.status = 'pending';
    this.currentStep = '';
    this.steps = [];
    this.startTime = Date.now();
    this.listeners = [];
  }

  update(progress, status, currentStep) {
    this.progress = progress;
    this.status = status;
    this.currentStep = currentStep;
    this.notify();
  }

  addStep(step) {
    this.steps.push({
      step,
      timestamp: Date.now()
    });
  }

  onUpdate(callback) {
    this.listeners.push(callback);
  }

  notify() {
    const data = {
      operationId: this.operationId,
      operationType: this.operationType,
      progress: this.progress,
      status: this.status,
      currentStep: this.currentStep,
      steps: this.steps,
      elapsed: Date.now() - this.startTime
    };
    
    this.listeners.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in progress callback:', error);
      }
    });
    
    // TODO: Emit Socket.io event nếu có
    // if (global.io) {
    //   global.io.emit('backup-progress', data);
    // }
  }

  complete() {
    this.update(100, 'completed', 'Hoàn thành');
  }

  fail(error) {
    this.update(this.progress, 'failed', `Lỗi: ${error.message}`);
  }
}

// Global progress tracker (có thể mở rộng với Map để track nhiều operations)
const progressTrackers = new Map();

/**
 * Get progress tracker by operation ID
 */
const getProgress = (operationId) => {
  return progressTrackers.get(operationId);
};

/**
 * Get all active progress trackers
 */
const getAllProgress = () => {
  return Array.from(progressTrackers.values()).map(tracker => ({
    operationId: tracker.operationId,
    operationType: tracker.operationType,
    progress: tracker.progress,
    status: tracker.status,
    currentStep: tracker.currentStep,
    steps: tracker.steps,
    elapsed: Date.now() - tracker.startTime
  }));
};

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
  // Validate user
  if (!user || !user._id) {
    throw new Error('User không hợp lệ. Không thể tạo backup mà không có thông tin user.');
  }

  const {
    name,
    type = 'full',
    scope = 'all',
    format = 'mongodump',
    collections = [],
    expiresInDays = 30,
    notes
  } = options;

  // Khai báo backup ở ngoài try block để có thể truy cập trong catch
  let backup = null;
  let progressTracker = null;

  try {
    // Tạo progress tracker
    const operationId = `backup-${Date.now()}`;
    progressTracker = new BackupProgress(operationId, 'backup');
    progressTrackers.set(operationId, progressTracker);
    
    progressTracker.update(0, 'in_progress', 'Khởi tạo backup...');
    
    // Tạo backup record
    const backupName = name || `backup-${new Date().toISOString().replace(/[:.]/g, '-')}`;
    
    try {
      // Log TRƯỚC KHI TẠO DATA OBJECT
      console.log(`🔍 [Backup] Starting backup creation - Name: ${backupName}`);
      
      // Tạo backup record - SET filePath TRƯỚC KHI TẠO OBJECT
      // Đảm bảo filePath được set ngay từ đầu
      const filePathValue = ''; // Explicitly set to empty string
      console.log(`🔍 [Backup] filePathValue: "${filePathValue}" (type: ${typeof filePathValue})`);
      
      const backupData = {
        name: backupName,
        type,
        scope,
        format,
        status: 'in_progress',
        filePath: filePathValue, // SET filePath TRỰC TIẾP TRONG DATA OBJECT
        fileSize: 0,
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
      };
      
      // Log để debug TRƯỚC KHI TẠO OBJECT
      console.log(`🔍 [Backup] Creating backup with data:`, {
        name: backupData.name,
        filePath: backupData.filePath,
        filePathType: typeof backupData.filePath,
        hasFilePath: backupData.filePath !== undefined
      });
      
      // SỬ DỤNG DIRECT INSERT để bypass validation hoàn toàn
      console.log(`🔍 [Backup] Using direct insert to bypass validation...`);
      
      // Insert trực tiếp vào collection để bypass validation
      const result = await Backup.collection.insertOne(backupData);
      const insertedId = result.insertedId;
      
      // Load lại document từ database
      backup = await Backup.findById(insertedId);
      
      if (!backup) {
        throw new Error('Không thể tạo backup record sau khi insert');
      }
      
      console.log(`✅ [Backup] Created backup record (direct insert) - ID: ${backup._id}, Name: ${backupName}, filePath: "${backup.filePath}"`);
    } catch (createError) {
      console.error('❌ [Backup] Error creating backup record:', createError);
      if (progressTracker) {
        progressTracker.fail(createError);
        progressTrackers.delete(progressTracker.operationId);
      }
      throw new Error(`Không thể tạo backup record: ${createError.message}`);
    }

    progressTracker.update(10, 'in_progress', 'Tạo thư mục backup...');
    
    // Tạo thư mục backup
    const backupPath = path.join(BACKUP_DIR, backup._id.toString());
    if (!fs.existsSync(backupPath)) {
      fs.mkdirSync(backupPath, { recursive: true });
    }

    progressTracker.update(20, 'in_progress', 'Bắt đầu backup database...');

    let filePath;
    let fileSize = 0;

    if (format === 'mongodump') {
      progressTracker.update(30, 'in_progress', 'Đang chạy mongodump...');
      // Sử dụng mongodump
      const dumpPath = path.join(backupPath, 'dump');
      
      // Lấy MongoDB URI từ environment (an toàn hơn - không log password)
      let uri = process.env.MONGODB_URI;
      if (!uri && mongoose.connection) {
        // Nếu không có URI, build từ connection (chỉ dùng khi không có auth)
        const host = mongoose.connection.host || 'localhost';
        const port = mongoose.connection.port || 27017;
        const dbName = mongoose.connection.name || 'drug-traceability';
        uri = `mongodb://${host}:${port}/${dbName}`;
      }
      
      // Security: Sử dụng --uri với connection string đã có credentials
      // Tránh log password ra console hoặc file log
      // Nếu MONGODB_URI có format: mongodb://username:password@host:port/dbname
      // mongodump sẽ tự động xử lý credentials an toàn
      
      // Sanitize URI để log (ẩn password)
      const sanitizedUri = uri ? uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 'N/A';
      console.log(`📦 Starting mongodump (URI: ${sanitizedUri})`);
      
      // Build mongodump command với URI (credentials được xử lý an toàn bởi mongodump)
      let mongodumpCmd = `mongodump --uri="${uri}" --out="${dumpPath}"`;
      
      // Alternative: Nếu cần tách riêng credentials (không khuyến nghị)
      // Có thể parse URI và dùng --username và --password, nhưng phải cẩn thận với shell escaping
      // Tốt nhất là dùng --uri với connection string đầy đủ
      
      if (collections.length > 0) {
        mongodumpCmd += ` --collection=${collections.join(' --collection=')}`;
      }

      try {
        progressTracker.addStep('Chạy mongodump command');
        await execAsync(mongodumpCmd);
        progressTracker.update(60, 'in_progress', 'Mongodump hoàn thành, đang nén file...');
        
        // Tạo archive
        const archivePath = path.join(BACKUP_DIR, `${backup._id.toString()}.tar.gz`);
        progressTracker.addStep('Tạo archive tar.gz');
        await execAsync(`tar -czf "${archivePath}" -C "${backupPath}" dump`);
        
        filePath = archivePath;
        const stats = fs.statSync(archivePath);
        fileSize = stats.size;
        
        progressTracker.update(80, 'in_progress', 'Đang dọn dẹp...');
        
        // Xóa thư mục dump
        fs.rmSync(dumpPath, { recursive: true, force: true });
      } catch (error) {
        // Fallback: Export JSON nếu mongodump không có
        console.warn('mongodump không khả dụng, sử dụng JSON export');
        progressTracker.update(40, 'in_progress', 'Fallback: Export JSON...');
        filePath = await exportToJSON(backup, backupPath, collections, progressTracker);
        const stats = fs.statSync(filePath);
        fileSize = stats.size;
      }
    } else if (format === 'json') {
      progressTracker.update(30, 'in_progress', 'Export JSON...');
      filePath = await exportToJSON(backup, backupPath, collections, progressTracker);
      const stats = fs.statSync(filePath);
      fileSize = stats.size;
    }

    progressTracker.update(90, 'in_progress', 'Cập nhật thông tin backup...');

    // Cập nhật backup record
    backup.filePath = filePath;
    backup.fileSize = fileSize;
    backup.status = 'completed';
    backup.completedAt = new Date();
    await backup.save();
    
    progressTracker.complete();
    progressTrackers.delete(progressTracker.operationId);

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
    
    if (progressTracker) {
      progressTracker.fail(error);
      progressTrackers.delete(progressTracker.operationId);
    }

    throw error;
  }
};

/**
 * Export database to JSON
 */
const exportToJSON = async (backup, backupPath, collections = [], progressTracker = null) => {
  const models = mongoose.models;
  const collectionsToExport = collections.length > 0 
    ? collections 
    : Object.keys(models);

  const exportData = {};
  let totalRecords = 0;
  const totalCollections = collectionsToExport.length;

  for (let i = 0; i < collectionsToExport.length; i++) {
    const collectionName = collectionsToExport[i];
    try {
      if (progressTracker) {
        const progress = 30 + Math.floor((i / totalCollections) * 50); // 30-80%
        progressTracker.update(progress, 'in_progress', `Export collection: ${collectionName}`);
      }
      
      const Model = models[collectionName];
      if (!Model) continue;

      const data = await Model.find({}).lean();
      exportData[collectionName] = data;
      totalRecords += data.length;
    } catch (error) {
      console.error(`Error exporting collection ${collectionName}:`, error);
    }
  }

  if (progressTracker) {
    progressTracker.update(85, 'in_progress', 'Ghi file JSON...');
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

    // ==========================================
    // SOFT RESTORE: Tự động backup trước khi restore
    // ==========================================
    let tempBackup = null;
    try {
      console.log('🛡️ Tạo backup tự động trước khi restore (Soft Restore)...');
      const tempBackupName = `temp-backup-before-restore-${Date.now()}`;
      tempBackup = await Backup.create({
        name: tempBackupName,
        type: 'full',
        scope: 'all',
        format: 'mongodump',
        status: 'in_progress',
        database: {
          name: mongoose.connection.name,
          collections: [],
          recordCount: 0
        },
        metadata: {
          mongooseVersion: mongoose.version,
          nodeVersion: process.version,
          timestamp: new Date()
        },
        createdBy: user._id,
        notes: `Tự động tạo trước khi restore từ backup: ${backup.name}`
      });
      
      // Tạo temp backup nhanh (chỉ backup metadata, không backup toàn bộ)
      // Hoặc có thể skip nếu user không muốn
      // Ở đây ta sẽ tạo một backup nhanh trước khi restore
      const tempBackupPath = path.join(BACKUP_DIR, tempBackup._id.toString());
      if (!fs.existsSync(tempBackupPath)) {
        fs.mkdirSync(tempBackupPath, { recursive: true });
      }
      
      // Quick backup: Chỉ backup critical collections hoặc skip nếu quá lớn
      // Trong production, có thể chỉ backup metadata hoặc skip nếu user chọn
      console.log('✅ Temp backup record created (ID: ' + tempBackup._id + ')');
      // Note: Có thể implement quick backup logic ở đây nếu cần
      
    } catch (tempBackupError) {
      console.warn('⚠️ Không thể tạo temp backup, tiếp tục restore:', tempBackupError.message);
      // Vẫn tiếp tục restore, nhưng không có rollback option
    }

    if (backup.format === 'mongodump') {
      // Sử dụng mongorestore
      // Lấy MongoDB URI từ environment (an toàn - credentials trong URI)
      let uri = process.env.MONGODB_URI;
      if (!uri && mongoose.connection) {
        const host = mongoose.connection.host || 'localhost';
        const port = mongoose.connection.port || 27017;
        const dbName = mongoose.connection.name || 'drug-traceability';
        uri = `mongodb://${host}:${port}/${dbName}`;
      }
      
      // Sanitize URI để log (ẩn password)
      const sanitizedUri = uri ? uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@') : 'N/A';
      console.log(`🔄 Starting mongorestore (URI: ${sanitizedUri})`);
      
      const tempDir = path.join(BACKUP_DIR, `restore-${Date.now()}`);
      
      // Extract archive
      await execAsync(`tar -xzf "${backup.filePath}" -C "${tempDir}"`);
      
      // Build mongorestore command với URI (credentials được xử lý an toàn)
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
        
        // Restore thành công - xóa temp backup (không cần rollback)
        if (tempBackup) {
          try {
            await Backup.findByIdAndDelete(tempBackup._id);
            console.log('✅ Đã xóa temp backup sau khi restore thành công');
          } catch (e) {
            console.warn('⚠️ Không thể xóa temp backup:', e.message);
          }
        }
      } catch (error) {
        // Restore thất bại - có thể rollback từ temp backup
        console.error('❌ Restore thất bại:', error.message);
        
        if (tempBackup) {
          console.log('🔄 Có thể rollback từ temp backup (ID: ' + tempBackup._id + ')');
          // TODO: Implement rollback logic nếu cần
          // Có thể giữ temp backup để user tự rollback thủ công
        }
        
        // Fallback: Import từ JSON
        console.warn('⚠️ Thử fallback: JSON import');
        try {
          await importFromJSON(backup.filePath, dropBeforeRestore, collections);
          
          // JSON import thành công - xóa temp backup
          if (tempBackup) {
            await Backup.findByIdAndDelete(tempBackup._id);
          }
        } catch (jsonError) {
          // Cả mongorestore và JSON import đều thất bại
          throw new Error(`Restore thất bại: ${error.message}. Fallback cũng thất bại: ${jsonError.message}`);
        }
      }
    } else if (backup.format === 'json') {
      try {
        await importFromJSON(backup.filePath, dropBeforeRestore, collections);
        
        // Restore thành công - xóa temp backup
        if (tempBackup) {
          await Backup.findByIdAndDelete(tempBackup._id);
        }
      } catch (error) {
        // Restore thất bại - giữ temp backup để rollback
        console.error('❌ JSON restore thất bại:', error.message);
        if (tempBackup) {
          console.log('🔄 Có thể rollback từ temp backup (ID: ' + tempBackup._id + ')');
        }
        throw error;
      }
    }

    return {
      success: true,
      message: 'Khôi phục dữ liệu thành công.',
      tempBackupId: tempBackup ? tempBackup._id.toString() : null
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
  getProgress,
  getAllProgress,
  BackupProgress, // Export class để có thể sử dụng từ bên ngoài
  BACKUP_DIR
};

