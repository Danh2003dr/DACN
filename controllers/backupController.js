const Backup = require('../models/Backup');
const backupService = require('../services/backupService');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

/**
 * @desc    Tạo backup
 * @route   POST /api/backups
 * @access  Private (Admin only)
 */
const createBackup = async (req, res) => {
  try {
    // Validate user
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        success: false,
        message: 'Không có thông tin user. Vui lòng đăng nhập lại.'
      });
    }

    console.log(`📦 [Create Backup] Request from ${req.user.username} (${req.user.role})`);
    console.log(`   Options:`, {
      name: req.body.name,
      type: req.body.type,
      format: req.body.format,
      expiresInDays: req.body.expiresInDays
    });

    const result = await backupService.createBackup(req.body, req.user, req);

    res.status(201).json({
      success: true,
      message: 'Tạo backup thành công.',
      data: result
    });
  } catch (error) {
    console.error('❌ [Create Backup] Error:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi tạo backup.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy danh sách backups
 * @route   GET /api/backups
 * @access  Private (Admin only)
 */
const getBackups = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      type,
      startDate,
      endDate
    } = req.query;

    const filters = {};

    if (status) filters.status = status;
    if (type) filters.type = type;

    if (startDate || endDate) {
      filters.createdAt = {};
      if (startDate) filters.createdAt.$gte = new Date(startDate);
      if (endDate) filters.createdAt.$lte = new Date(endDate);
    }

    const result = await Backup.getBackups(filters, {
      page: parseInt(page),
      limit: parseInt(limit)
    });

    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error getting backups:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách backups.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy backup theo ID
 * @route   GET /api/backups/:id
 * @access  Private (Admin only)
 */
const getBackupById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID backup không hợp lệ.'
      });
    }
    
    const info = await backupService.getBackupInfo(id);

    res.status(200).json({
      success: true,
      data: info
    });
  } catch (error) {
    console.error('Error getting backup:', error);
    res.status(404).json({
      success: false,
      message: error.message || 'Không tìm thấy backup.',
      error: error.message
    });
  }
};

/**
 * @desc    Restore từ backup
 * @route   POST /api/backups/:id/restore
 * @access  Private (Admin only)
 */
const restoreBackup = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID backup không hợp lệ.'
      });
    }
    
    const result = await backupService.restoreBackup(id, req.body, req.user, req);

    res.status(200).json({
      success: true,
      message: 'Khôi phục dữ liệu thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error restoring backup:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Lỗi khi khôi phục dữ liệu.',
      error: error.message
    });
  }
};

/**
 * @desc    Download backup file
 * @route   GET /api/backups/:id/download
 * @access  Private (Admin only)
 */
// Track active downloads để tránh duplicate requests
const activeDownloads = new Map(); // Map<backupId, {startTime, userId, res}>

const downloadBackup = async (req, res) => {
  const startTime = Date.now();
  let backup = null;
  
  try {
    const { id } = req.params;
    const userId = req.user?._id?.toString() || req.user?.id || 'unknown';
    const userInfo = req.user ? `${req.user.username} (${req.user.role})` : 'Unknown';
    
    // Kiểm tra xem có download đang diễn ra không
    const downloadKey = `${id}_${userId}`;
    if (activeDownloads.has(downloadKey)) {
      const existingDownload = activeDownloads.get(downloadKey);
      const elapsed = Date.now() - existingDownload.startTime;
      console.warn(`⚠️ [Download] Duplicate request detected - Backup ID: ${id}, User: ${userInfo}`);
      console.warn(`   Active download started ${(elapsed / 1000).toFixed(1)}s ago`);
      
      return res.status(409).json({
        success: false,
        message: 'Download đang được xử lý. Vui lòng đợi download hiện tại hoàn thành.',
        retryAfter: Math.max(1, 60 - Math.floor(elapsed / 1000)) // Suggest retry after X seconds
      });
    }
    
    console.log(`📥 [Download] Request from ${userInfo} - Backup ID: ${id}`);
    
    // Đánh dấu download đang active
    activeDownloads.set(downloadKey, {
      startTime: Date.now(),
      userId: userId,
      res: res
    });
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.error(`❌ [Download] Invalid ObjectId format: ${id}`);
      return res.status(400).json({
        success: false,
        message: 'ID backup không hợp lệ.'
      });
    }
    
    // Chuyển đổi ID sang ObjectId nếu cần
    const objectId = new mongoose.Types.ObjectId(id);
    
    // Tìm backup bằng _id
    backup = await Backup.findById(objectId);
    
    if (!backup) {
      // Nếu không tìm thấy, thử tìm bằng string ID
      backup = await Backup.findById(id);
    }
    
    if (!backup) {
      // Nếu vẫn không tìm thấy, thử tìm bằng id field (virtual field)
      backup = await Backup.findOne({ 
        $or: [
          { _id: objectId },
          { _id: id },
          { id: id }
        ]
      });
    }
    
    if (!backup) {
      // Log để debug - kiểm tra xem có backup nào trong DB không
      const allBackups = await Backup.find({}).limit(5).select('_id name status');
      console.error(`❌ [Download] Backup not found - ID: ${id}`);
      console.error(`   Available backups: ${allBackups.length} (showing first 5)`);
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy backup.'
      });
    }

    console.log(`✅ [Download] Found backup: "${backup.name}" (${backup.status})`);

    if (backup.status !== 'completed') {
      console.warn(`⚠️ [Download] Backup chưa hoàn thành - Status: ${backup.status}`);
      return res.status(400).json({
        success: false,
        message: `Backup chưa hoàn thành. Trạng thái: ${backup.status}`
      });
    }

    // Kiểm tra và sửa đường dẫn file nếu cần
    let filePath = backup.filePath;
    
    // Nếu filePath là đường dẫn tương đối hoặc không tồn tại, thử tìm trong BACKUP_DIR
    if (!path.isAbsolute(filePath) || !fs.existsSync(filePath)) {
      const BACKUP_DIR = path.join(process.cwd(), 'backups');
      
      // Thử tìm file với tên backup ID
      const possiblePaths = [
        path.join(BACKUP_DIR, `${backup._id.toString()}.tar.gz`),
        path.join(BACKUP_DIR, `${backup._id.toString()}.json`),
        path.join(BACKUP_DIR, backup._id.toString(), 'backup.json'),
        path.join(BACKUP_DIR, filePath), // Nếu filePath là tên file
        filePath // Thử lại với đường dẫn gốc
      ];
      
      let foundPath = null;
      for (const possiblePath of possiblePaths) {
        if (fs.existsSync(possiblePath)) {
          foundPath = possiblePath;
          console.log(`✅ [Download] Tìm thấy file tại: ${foundPath}`);
          break;
        }
      }
      
      if (!foundPath) {
        console.error(`❌ [Download] File không tồn tại: ${backup.filePath}`);
        console.error(`   Đã thử các đường dẫn:`, possiblePaths);
        console.error(`   BACKUP_DIR: ${BACKUP_DIR}`);
        
        return res.status(404).json({
          success: false,
          message: 'File backup không tồn tại trên server.',
          debug: process.env.NODE_ENV === 'development' ? {
            originalPath: backup.filePath,
            triedPaths: possiblePaths,
            backupDir: BACKUP_DIR
          } : undefined
        });
      }
      
      // Cập nhật filePath trong database nếu tìm thấy đường dẫn khác
      if (foundPath !== backup.filePath) {
        backup.filePath = foundPath;
        await backup.save();
        console.log(`✅ [Download] Đã cập nhật filePath trong database: ${foundPath}`);
      }
      
      filePath = foundPath;
    }

    // Streaming download để tránh đọc toàn bộ file vào RAM
    // Đặc biệt quan trọng với file backup lớn (vài GB)
    const fileStats = fs.statSync(filePath);
    const fileSize = fileStats.size;
    const fileSizeMB = (fileSize / 1024 / 1024).toFixed(2);
    const fileName = `${backup.name}.${backup.format === 'mongodump' ? 'tar.gz' : 'json'}`;
    
    console.log(`📦 [Download] Starting stream - File: ${fileName}, Size: ${fileSizeMB} MB`);
    
    // Set headers cho download
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Content-Type', backup.format === 'mongodump' ? 'application/gzip' : 'application/json');
    res.setHeader('Content-Length', fileSize);
    res.setHeader('X-Backup-Name', backup.name);
    res.setHeader('X-Backup-Format', backup.format);
    res.setHeader('X-Backup-Size', fileSize);
    
    // Stream file xuống client thay vì đọc toàn bộ vào RAM
    const fileStream = fs.createReadStream(filePath);
    
    let bytesStreamed = 0;
    const totalSize = fileSize;
    
    // Track download progress (optional - có thể log hoặc emit event)
    fileStream.on('data', (chunk) => {
      bytesStreamed += chunk.length;
      // Có thể emit progress event nếu cần
      // if (global.io) {
      //   global.io.emit('download-progress', {
      //     backupId: id,
      //     progress: Math.floor((bytesStreamed / totalSize) * 100),
      //     bytesStreamed,
      //     totalSize
      //   });
      // }
    });
    
    // Handle errors
    fileStream.on('error', (error) => {
      console.error(`❌ [Download] Stream error for "${backup.name}":`, error.message);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: 'Lỗi khi đọc file backup.',
          error: error.message
        });
      } else {
        // Nếu headers đã được gửi, chỉ có thể log error
        console.error('   Stream error after headers sent - client may receive incomplete file');
      }
    });
    
    // Track completion
    fileStream.on('end', () => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const speedMBps = (fileSizeMB / parseFloat(duration)).toFixed(2);
      console.log(`✅ [Download] Completed - "${backup.name}" (${fileSizeMB} MB in ${duration}s, ${speedMBps} MB/s)`);
      
      // Xóa khỏi active downloads
      activeDownloads.delete(downloadKey);
    });
    
    // Handle client disconnect
    req.on('close', () => {
      if (!fileStream.destroyed) {
        fileStream.destroy();
        const progress = totalSize > 0 ? ((bytesStreamed / totalSize) * 100).toFixed(1) : '0';
        console.log(`⚠️ [Download] Client disconnected - "${backup.name}" (${progress}% downloaded)`);
      }
      
      // Xóa khỏi active downloads khi client disconnect
      activeDownloads.delete(downloadKey);
    });
    
    // Handle stream errors - cleanup active downloads
    fileStream.on('error', (error) => {
      activeDownloads.delete(downloadKey);
    });
    
    // Pipe file stream to response
    fileStream.pipe(res);
  } catch (error) {
    console.error(`❌ [Download] Error for backup ID ${id}:`, error.message);
    
    // Cleanup active download nếu có lỗi
    const downloadKey = `${id}_${req.user?._id?.toString() || req.user?.id || 'unknown'}`;
    activeDownloads.delete(downloadKey);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Lỗi khi tải backup.',
        error: error.message
      });
    }
  }
};

/**
 * @desc    Xóa backup
 * @route   DELETE /api/backups/:id
 * @access  Private (Admin only)
 */
const deleteBackup = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'ID backup không hợp lệ.'
      });
    }
    
    // Tìm backup bằng _id
    let backup = await Backup.findById(id);
    
    // Nếu không tìm thấy bằng _id, thử tìm bằng id field (nếu có)
    if (!backup) {
      backup = await Backup.findOne({ id: id });
    }
    
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy backup.'
      });
    }

    // Xóa file
    if (fs.existsSync(backup.filePath)) {
      fs.unlinkSync(backup.filePath);
    }

    // Xóa record
    await Backup.findByIdAndDelete(backup._id);

    res.status(200).json({
      success: true,
      message: 'Xóa backup thành công.'
    });
  } catch (error) {
    console.error('Error deleting backup:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi xóa backup.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thống kê backups
 * @route   GET /api/backups/stats
 * @access  Private (Admin only)
 */
const getBackupStats = async (req, res) => {
  try {
    const stats = await Backup.getBackupStats();

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error getting backup stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê backups.',
      error: error.message
    });
  }
};

/**
 * @desc    Cleanup expired backups
 * @route   POST /api/backups/cleanup
 * @access  Private (Admin only)
 */
const cleanupBackups = async (req, res) => {
  try {
    const result = await backupService.cleanupExpiredBackups();

    res.status(200).json({
      success: true,
      message: `Đã xóa ${result.deleted} backup(s) hết hạn.`,
      data: result
    });
  } catch (error) {
    console.error('Error cleaning up backups:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi cleanup backups.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy progress của backup/restore operation
 * @route   GET /api/backups/progress/:operationId
 * @access  Private (Admin only)
 */
const getBackupProgress = async (req, res) => {
  try {
    const { operationId } = req.params;
    const progress = backupService.getProgress(operationId);
    
    if (!progress) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy operation hoặc đã hoàn thành.'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        operationId: progress.operationId,
        operationType: progress.operationType,
        progress: progress.progress,
        status: progress.status,
        currentStep: progress.currentStep,
        steps: progress.steps,
        elapsed: Date.now() - progress.startTime
      }
    });
  } catch (error) {
    console.error('Error getting backup progress:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi lấy progress.',
      error: error.message
    });
  }
};

module.exports = {
  createBackup,
  getBackups,
  getBackupById,
  restoreBackup,
  downloadBackup,
  deleteBackup,
  getBackupStats,
  cleanupBackups,
  getBackupProgress
};

