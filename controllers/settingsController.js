const Settings = require('../models/Settings');
const { validationResult } = require('express-validator');

// Lấy cài đặt hệ thống
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    
    // Nếu chưa có settings, tạo mặc định
    if (!settings) {
      settings = await Settings.create({
        systemName: 'Drug Traceability Blockchain System',
        companyName: '',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        blockchainNetwork: 'sepolia',
        blockchainProvider: 'infura',
        notificationEmail: '',
        backupFrequency: 'daily',
        sessionTimeout: 60,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        requireSpecialChars: true,
        enableTwoFactor: false,
        enableAuditLog: true,
        enableEmailNotifications: true,
        enableSMSNotifications: false
      });
    }

    res.json({
      success: true,
      message: 'Lấy cài đặt thành công.',
      data: settings
    });
  } catch (error) {
    console.error('Error getting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy cài đặt.',
      error: error.message
    });
  }
};

// Cập nhật cài đặt hệ thống
const updateSettings = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dữ liệu không hợp lệ.',
        errors: errors.array()
      });
    }

    const {
      systemName,
      companyName,
      companyAddress,
      companyPhone,
      companyEmail,
      blockchainNetwork,
      blockchainProvider,
      notificationEmail,
      backupFrequency,
      sessionTimeout,
      maxLoginAttempts,
      passwordMinLength,
      requireSpecialChars,
      enableTwoFactor,
      enableAuditLog,
      enableEmailNotifications,
      enableSMSNotifications
    } = req.body;

    let settings = await Settings.findOne();
    
    if (!settings) {
      // Tạo mới nếu chưa có
      settings = await Settings.create({
        systemName,
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        blockchainNetwork,
        blockchainProvider,
        notificationEmail,
        backupFrequency,
        sessionTimeout,
        maxLoginAttempts,
        passwordMinLength,
        requireSpecialChars,
        enableTwoFactor,
        enableAuditLog,
        enableEmailNotifications,
        enableSMSNotifications
      });
    } else {
      // Cập nhật settings hiện có
      Object.assign(settings, {
        systemName,
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        blockchainNetwork,
        blockchainProvider,
        notificationEmail,
        backupFrequency,
        sessionTimeout,
        maxLoginAttempts,
        passwordMinLength,
        requireSpecialChars,
        enableTwoFactor,
        enableAuditLog,
        enableEmailNotifications,
        enableSMSNotifications
      });
      
      await settings.save();
    }

    res.json({
      success: true,
      message: 'Cập nhật cài đặt thành công.',
      data: settings
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật cài đặt.',
      error: error.message
    });
  }
};

// Lấy thông tin hệ thống
const getSystemInfo = async (req, res) => {
  try {
    const os = require('os');
    const fs = require('fs');
    const path = require('path');
    
    // Thông tin hệ thống
    const systemInfo = {
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: os.platform(),
      arch: os.arch(),
      uptime: Math.floor(process.uptime()),
      memoryUsage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024) + ' GB',
      freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024) + ' GB',
      cpuCount: os.cpus().length,
      loadAverage: os.loadavg(),
      databaseStatus: 'connected', // MongoDB connection status
      timestamp: new Date()
    };

    res.json({
      success: true,
      message: 'Lấy thông tin hệ thống thành công.',
      data: systemInfo
    });
  } catch (error) {
    console.error('Error getting system info:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin hệ thống.',
      error: error.message
    });
  }
};

// Kiểm tra trạng thái blockchain
const getBlockchainStatus = async (req, res) => {
  try {
    const blockchainService = require('../services/blockchainService');
    
    const status = {
      connected: blockchainService.isInitialized || blockchainService.isMockMode,
      isMockMode: blockchainService.isMockMode,
      network: process.env.ETHEREUM_NETWORK || 'sepolia',
      currentBlock: null,
      gasPrice: null,
      lastCheck: new Date()
    };

    // Nếu đang ở mock mode, trả về thông tin giả
    if (blockchainService.isMockMode) {
      status.currentBlock = 'Mock Mode';
      status.gasPrice = 'N/A';
    } else {
      try {
        // Thử kết nối để lấy thông tin thực
        const web3 = blockchainService.web3;
        if (web3) {
          const blockNumber = await web3.eth.getBlockNumber();
          const gasPrice = await web3.eth.getGasPrice();
          
          status.currentBlock = blockNumber.toString();
          status.gasPrice = web3.utils.fromWei(gasPrice, 'gwei') + ' gwei';
        }
      } catch (error) {
        console.error('Error getting blockchain info:', error);
        status.connected = false;
        status.error = error.message;
      }
    }

    res.json({
      success: true,
      message: 'Lấy trạng thái blockchain thành công.',
      data: status
    });
  } catch (error) {
    console.error('Error getting blockchain status:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy trạng thái blockchain.',
      error: error.message
    });
  }
};

// Test kết nối blockchain
const testBlockchainConnection = async (req, res) => {
  try {
    const blockchainService = require('../services/blockchainService');
    
    // Thử khởi tạo lại blockchain service
    const result = await blockchainService.initialize();
    
    if (result || blockchainService.isMockMode) {
      res.json({
        success: true,
        message: 'Kết nối blockchain thành công.',
        data: {
          connected: true,
          isMockMode: blockchainService.isMockMode,
          network: process.env.ETHEREUM_NETWORK || 'sepolia'
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Không thể kết nối đến blockchain.'
      });
    }
  } catch (error) {
    console.error('Error testing blockchain connection:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi khi test kết nối blockchain.',
      error: error.message
    });
  }
};

// Reset về cài đặt mặc định
const resetToDefaults = async (req, res) => {
  try {
    await Settings.deleteMany(); // Xóa tất cả settings
    
    // Tạo settings mặc định
    const defaultSettings = await Settings.create({
      systemName: 'Drug Traceability Blockchain System',
      companyName: '',
      companyAddress: '',
      companyPhone: '',
      companyEmail: '',
      blockchainNetwork: 'sepolia',
      blockchainProvider: 'infura',
      notificationEmail: '',
      backupFrequency: 'daily',
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireSpecialChars: true,
      enableTwoFactor: false,
      enableAuditLog: true,
      enableEmailNotifications: true,
      enableSMSNotifications: false
    });

    res.json({
      success: true,
      message: 'Đã reset về cài đặt mặc định.',
      data: defaultSettings
    });
  } catch (error) {
    console.error('Error resetting settings:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi reset cài đặt.',
      error: error.message
    });
  }
};

module.exports = {
  getSettings,
  updateSettings,
  getSystemInfo,
  getBlockchainStatus,
  testBlockchainConnection,
  resetToDefaults
};
