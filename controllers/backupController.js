const Backup = require('../models/Backup');
const backupService = require('../services/backupService');
const fs = require('fs');
const path = require('path');

/**
 * @desc    Tạo backup
 * @route   POST /api/backups
 * @access  Private (Admin only)
 */
const createBackup = async (req, res) => {
  try {
    const result = await backupService.createBackup(req.body, req.user, req);

    res.status(201).json({
      success: true,
      message: 'Tạo backup thành công.',
      data: result
    });
  } catch (error) {
    console.error('Error creating backup:', error);
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
    const info = await backupService.getBackupInfo(req.params.id);

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
    const result = await backupService.restoreBackup(req.params.id, req.body, req.user, req);

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
const downloadBackup = async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    
    if (!backup) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy backup.'
      });
    }

    if (backup.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Backup chưa hoàn thành.'
      });
    }

    if (!fs.existsSync(backup.filePath)) {
      return res.status(404).json({
        success: false,
        message: 'File backup không tồn tại.'
      });
    }

    res.download(backup.filePath, `${backup.name}.${backup.format === 'mongodump' ? 'tar.gz' : 'json'}`);
  } catch (error) {
    console.error('Error downloading backup:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi tải backup.',
      error: error.message
    });
  }
};

/**
 * @desc    Xóa backup
 * @route   DELETE /api/backups/:id
 * @access  Private (Admin only)
 */
const deleteBackup = async (req, res) => {
  try {
    const backup = await Backup.findById(req.params.id);
    
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
    await Backup.findByIdAndDelete(req.params.id);

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

module.exports = {
  createBackup,
  getBackups,
  getBackupById,
  restoreBackup,
  downloadBackup,
  deleteBackup,
  getBackupStats,
  cleanupBackups
};

