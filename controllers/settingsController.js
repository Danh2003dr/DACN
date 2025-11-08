const blockchainService = require('../services/blockchainService');
const mongoose = require('mongoose');

// @desc    Lấy cài đặt hệ thống
// @route   GET /api/settings
// @access  Private (Admin only)
const getSettings = async (req, res) => {
  try {
    // Mock settings data - trong thực tế sẽ lấy từ database
    const settings = {
      systemName: 'Drug Traceability Blockchain System',
      companyName: process.env.COMPANY_NAME || '',
      companyAddress: process.env.COMPANY_ADDRESS || '',
      companyPhone: process.env.COMPANY_PHONE || '',
      companyEmail: process.env.COMPANY_EMAIL || 'admin@company.com',
      blockchainNetwork: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
      blockchainProvider: process.env.BLOCKCHAIN_PROVIDER || 'infura',
      notificationEmail: process.env.NOTIFICATION_EMAIL || 'admin@company.com',
      backupFrequency: process.env.BACKUP_FREQUENCY || 'daily',
      sessionTimeout: parseInt(process.env.SESSION_TIMEOUT) || 60,
      maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS) || 5,
      passwordMinLength: parseInt(process.env.PASSWORD_MIN_LENGTH) || 8,
      requireSpecialChars: process.env.REQUIRE_SPECIAL_CHARS === 'true',
      enableTwoFactor: process.env.ENABLE_TWO_FACTOR === 'true',
      enableAuditLog: process.env.ENABLE_AUDIT_LOG === 'true',
      enableEmailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
      enableSMSNotifications: process.env.ENABLE_SMS_NOTIFICATIONS === 'true'
    };

    res.json({
      success: true,
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

// @desc    Cập nhật cài đặt hệ thống
// @route   PUT /api/settings
// @access  Private (Admin only)
const updateSettings = async (req, res) => {
  try {
    const settingsData = req.body;

    // Trong thực tế, sẽ lưu vào database
    // Ở đây chỉ log ra để demo
    console.log('Settings updated:', settingsData);

    res.json({
      success: true,
      message: 'Cài đặt đã được cập nhật thành công.',
      data: settingsData
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

// Helper function để kiểm tra kết nối database thực tế
const checkDatabaseConnection = async () => {
  const readyState = mongoose.connection.readyState;
  
  // readyState: 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  if (readyState === 0) {
    return 'disconnected';
  }
  if (readyState === 2) {
    return 'connecting';
  }
  if (readyState === 3) {
    return 'disconnecting';
  }
  
  // Nếu readyState === 1, cần kiểm tra thực tế bằng cách ping
  if (readyState === 1) {
    // Kiểm tra xem db object có tồn tại không
    if (!mongoose.connection.db) {
      return 'disconnected';
    }
    
    try {
      // Sử dụng command ping với timeout ngắn (1 giây)
      // Điều này đảm bảo phát hiện nhanh khi MongoDB bị tắt
      const pingCommand = { ping: 1 };
      const pingPromise = mongoose.connection.db.command(pingCommand);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 1000)
      );
      
      await Promise.race([pingPromise, timeoutPromise]);
      return 'connected';
    } catch (error) {
      // Nếu ping thất bại, kết nối đã bị ngắt
      return 'disconnected';
    }
  }
  
  return 'disconnected';
};

// @desc    Lấy thông tin hệ thống
// @route   GET /api/settings/system-info
// @access  Private (Admin only)
const getSystemInfo = async (req, res) => {
  try {
    // Kiểm tra trạng thái kết nối database thực tế
    const databaseStatus = await checkDatabaseConnection();

    const systemInfo = {
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      databaseStatus: databaseStatus,
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
    };

    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('Error getting system info:', error);
    // Nếu có lỗi, coi như database disconnected
    const systemInfo = {
      version: '1.0.0',
      uptime: Math.floor(process.uptime()),
      databaseStatus: 'disconnected',
      memoryUsage: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB`,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      startTime: new Date(Date.now() - process.uptime() * 1000).toISOString()
    };

    res.json({
      success: true,
      data: systemInfo
    });
  }
};

// @desc    Lấy trạng thái blockchain
// @route   GET /api/settings/blockchain-status
// @access  Private (Admin only)
const getBlockchainStatus = async (req, res) => {
  try {
    let connected = false;
    let currentBlock = 'N/A';
    let gasPrice = 'N/A';
    
    // Khởi tạo blockchain service nếu chưa có
    if (!blockchainService.isInitialized) {
      await blockchainService.initialize();
    }

    // Kiểm tra kết nối thực tế
    connected = blockchainService.isConnected();

    // Nếu có web3 instance, cố gắng lấy thông tin thực tế
    if (blockchainService.web3 && connected) {
      try {
        const blockNumber = await blockchainService.web3.eth.getBlockNumber();
        currentBlock = blockNumber.toString();
        
        const gasPriceWei = await blockchainService.web3.eth.getGasPrice();
        gasPrice = `${blockchainService.web3.utils.fromWei(gasPriceWei, 'gwei')} Gwei`;
      } catch (error) {
        console.log('Could not fetch real blockchain data, using defaults:', error.message);
        // Vẫn coi là connected nếu service đã khởi tạo
        connected = blockchainService.isInitialized;
      }
    }

    const blockchainStatus = {
      connected: connected,
      network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
      currentBlock: currentBlock,
      gasPrice: gasPrice,
      contractAddress: process.env.CONTRACT_ADDRESS || blockchainService.contractAddress || 'N/A',
      account: blockchainService.getCurrentAccount() || 'N/A',
      lastChecked: new Date().toISOString()
    };

    res.json({
      success: true,
      data: blockchainStatus
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

// @desc    Test kết nối blockchain
// @route   POST /api/settings/test-blockchain
// @access  Private (Admin only)
const testBlockchainConnection = async (req, res) => {
  try {
    // Khởi tạo blockchain service (sẽ tự động fallback sang mock mode nếu lỗi)
    const initialized = await blockchainService.initialize();
    
    if (initialized) {
      const isConnected = blockchainService.isConnected();
      
      res.json({
        success: true,
        message: isConnected ? 'Kết nối blockchain thành công!' : 'Blockchain service đã khởi tạo ở chế độ mock',
        data: {
          connected: isConnected,
          network: process.env.BLOCKCHAIN_NETWORK || 'sepolia',
          account: blockchainService.getCurrentAccount(),
          mode: blockchainService.web3 ? 'real' : 'mock',
          timestamp: new Date().toISOString()
        }
      });
    } else {
      res.json({
        success: false,
        message: 'Không thể kết nối đến blockchain.',
        data: {
          connected: false,
          error: 'Blockchain service initialization failed'
        }
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

// @desc    Reset cài đặt về mặc định
// @route   POST /api/settings/reset
// @access  Private (Admin only)
const resetToDefaults = async (req, res) => {
  try {
    const defaultSettings = {
      systemName: 'Drug Traceability Blockchain System',
      companyName: '',
      companyAddress: '',
      companyPhone: '',
      companyEmail: '',
      blockchainNetwork: 'sepolia',
      blockchainProvider: 'infura',
      notificationEmail: 'admin@company.com',
      backupFrequency: 'daily',
      sessionTimeout: 60,
      maxLoginAttempts: 5,
      passwordMinLength: 8,
      requireSpecialChars: true,
      enableTwoFactor: false,
      enableAuditLog: true,
      enableEmailNotifications: true,
      enableSMSNotifications: false
    };

    // Trong thực tế, sẽ reset trong database
    console.log('Settings reset to defaults:', defaultSettings);

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