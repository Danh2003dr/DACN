const { Web3 } = require('web3');
const DrugTraceability = require('../build/contracts/DrugTraceability.json');
const crypto = require('crypto');

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.isInitialized = false;
  }

  // Khởi tạo kết nối blockchain
  async initialize() {
    try {
      // Kết nối đến Ganache local network
      this.web3 = new Web3('http://127.0.0.1:7545');
      
      // Kiểm tra kết nối
      const isConnected = await this.web3.eth.isSyncing();
      console.log('Blockchain connection status:', isConnected);

      // Lấy accounts
      const accounts = await this.web3.eth.getAccounts();
      if (accounts.length === 0) {
        throw new Error('Không tìm thấy account nào trong blockchain network');
      }
      
      this.account = accounts[0];
      console.log('Using account:', this.account);

      // Khởi tạo contract instance
      // Trong môi trường thực tế, địa chỉ contract sẽ được deploy và lưu trữ
      const contractAddress = process.env.CONTRACT_ADDRESS || '0x...'; // Sẽ được cập nhật sau khi deploy
      
      if (contractAddress !== '0x...') {
        this.contract = new this.web3.eth.Contract(
          DrugTraceability.abi,
          contractAddress
        );
      } else {
        console.log('Contract chưa được deploy. Sử dụng mock mode.');
        this.contract = null;
      }

      this.isInitialized = true;
      console.log('Blockchain service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Blockchain initialization error:', error);
      this.isInitialized = false;
      return false;
    }
  }

  // Tạo hash cho dữ liệu lô thuốc
  createDrugHash(drugData) {
    const dataString = JSON.stringify({
      drugId: drugData.drugId,
      name: drugData.name,
      activeIngredient: drugData.activeIngredient,
      batchNumber: drugData.batchNumber,
      productionDate: drugData.productionDate,
      manufacturerId: drugData.manufacturerId,
      timestamp: Date.now()
    });
    
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  // Tạo chữ ký số
  createDigitalSignature(data, privateKey) {
    const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
    const sign = crypto.createSign('SHA256');
    sign.update(hash);
    sign.end();
    return sign.sign(privateKey, 'hex');
  }

  // Ghi dữ liệu lên blockchain (Mock implementation)
  async recordDrugBatchOnBlockchain(drugData) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      // Tạo hash cho dữ liệu
      const drugHash = this.createDrugHash(drugData);
      
      // Tạo chữ ký số
      const privateKey = process.env.PRIVATE_KEY || 'mock_private_key';
      const signature = this.createDigitalSignature(drugData, privateKey);
      
      // Tạo blockchain ID duy nhất
      const blockchainId = `BC_${Date.now()}_${drugHash.substring(0, 8).toUpperCase()}`;
      
      // Trong môi trường thực tế, sẽ gọi smart contract
      if (this.contract && process.env.CONTRACT_ADDRESS !== '0x...') {
        const result = await this.contract.methods.createDrugBatch(
          drugData.drugId,
          drugData.name,
          drugData.activeIngredient,
          drugData.manufacturerId,
          drugData.batchNumber,
          Math.floor(new Date(drugData.productionDate).getTime() / 1000),
          Math.floor(new Date(drugData.expiryDate).getTime() / 1000),
          drugData.qualityTest?.result || 'PASSED',
          drugData.qrCode?.data || blockchainId
        ).send({
          from: this.account,
          gas: 500000
        });
        
        return {
          success: true,
          blockchainId: blockchainId,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          timestamp: Date.now(),
          signature: signature,
          hash: drugHash
        };
      } else {
        // Mock implementation cho development
        console.log('Mock blockchain recording for drug:', drugData.drugId);
        
        return {
          success: true,
          blockchainId: blockchainId,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
          timestamp: Date.now(),
          signature: signature,
          hash: drugHash,
          mock: true
        };
      }
    } catch (error) {
      console.error('Blockchain recording error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Cập nhật dữ liệu trên blockchain
  async updateDrugBatchOnBlockchain(drugId, updateData) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      if (this.contract && process.env.CONTRACT_ADDRESS !== '0x...') {
        const result = await this.contract.methods.updateDrugBatch(
          drugId,
          updateData.name,
          updateData.activeIngredient,
          updateData.qualityTest?.result || 'PASSED'
        ).send({
          from: this.account,
          gas: 300000
        });
        
        return {
          success: true,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          timestamp: Date.now()
        };
      } else {
        // Mock implementation
        console.log('Mock blockchain update for drug:', drugId);
        return {
          success: true,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
          timestamp: Date.now(),
          mock: true
        };
      }
    } catch (error) {
      console.error('Blockchain update error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Thu hồi lô thuốc trên blockchain
  async recallDrugBatchOnBlockchain(drugId, reason) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      if (this.contract && process.env.CONTRACT_ADDRESS !== '0x...') {
        const result = await this.contract.methods.recallDrugBatch(
          drugId,
          reason
        ).send({
          from: this.account,
          gas: 200000
        });
        
        return {
          success: true,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          timestamp: Date.now()
        };
      } else {
        // Mock implementation
        console.log('Mock blockchain recall for drug:', drugId);
        return {
          success: true,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
          timestamp: Date.now(),
          mock: true
        };
      }
    } catch (error) {
      console.error('Blockchain recall error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Ghi nhận phân phối
  async recordDistributionOnBlockchain(drugId, toAddress, location, status, notes) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      if (this.contract && process.env.CONTRACT_ADDRESS !== '0x...') {
        const result = await this.contract.methods.recordDistribution(
          drugId,
          toAddress,
          location,
          status,
          notes
        ).send({
          from: this.account,
          gas: 300000
        });
        
        return {
          success: true,
          transactionHash: result.transactionHash,
          blockNumber: result.blockNumber,
          timestamp: Date.now()
        };
      } else {
        // Mock implementation
        console.log('Mock blockchain distribution record for drug:', drugId);
        return {
          success: true,
          transactionHash: `0x${crypto.randomBytes(32).toString('hex')}`,
          blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
          timestamp: Date.now(),
          mock: true
        };
      }
    } catch (error) {
      console.error('Blockchain distribution recording error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy thông tin từ blockchain
  async getDrugBatchFromBlockchain(drugId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      if (this.contract && process.env.CONTRACT_ADDRESS !== '0x...') {
        const result = await this.contract.methods.getDrugBatch(drugId).call();
        return {
          success: true,
          data: result
        };
      } else {
        // Mock implementation
        return {
          success: true,
          data: null,
          mock: true
        };
      }
    } catch (error) {
      console.error('Blockchain retrieval error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Kiểm tra trạng thái kết nối
  isConnected() {
    return this.isInitialized && this.web3 !== null;
  }

  // Lấy thông tin account hiện tại
  getCurrentAccount() {
    return this.account;
  }
}

// Tạo instance và thêm methods cho chuỗi cung ứng
const blockchainService = new BlockchainService();

// Thêm methods cho supply chain
blockchainService.recordSupplyChainStep = async function(stepData) {
  try {
    if (!this.isInitialized) {
      throw new Error('Blockchain service chưa được khởi tạo');
    }

    const blockchainId = `SC_${Date.now()}_${stepData.drugBatchNumber}`;
    const signature = this.createDigitalSignature(stepData.step, process.env.PRIVATE_KEY || 'mock_private_key');

    // Mock implementation
    return {
      success: true,
      blockchainId: blockchainId,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
      gasUsed: Math.floor(Math.random() * 100000) + 50000,
      contractAddress: this.contractAddress
    };
  } catch (error) {
    console.error('Error recording supply chain step on blockchain:', error);
    throw error;
  }
};

blockchainService.recordRecall = async function(recallData) {
  try {
    if (!this.isInitialized) {
      throw new Error('Blockchain service chưa được khởi tạo');
    }

    const blockchainId = `RECALL_${Date.now()}_${recallData.drugBatchNumber}`;
    const signature = this.createDigitalSignature(recallData.recallData, process.env.PRIVATE_KEY || 'mock_private_key');

    // Mock implementation
    return {
      success: true,
      blockchainId: blockchainId,
      transactionHash: `0x${Math.random().toString(16).substr(2, 64)}`,
      blockNumber: Math.floor(Math.random() * 1000000) + 1000000,
      gasUsed: Math.floor(Math.random() * 100000) + 50000,
      contractAddress: this.contractAddress
    };
  } catch (error) {
    console.error('Error recording recall on blockchain:', error);
    throw error;
  }
};

blockchainService.getSupplyChainHistory = async function(drugBatchNumber) {
  try {
    if (!this.isInitialized) {
      throw new Error('Blockchain service chưa được khởi tạo');
    }

    // Mock implementation
    return {
      success: true,
      data: {
        steps: [
          {
            action: 'created',
            actor: '0x1234567890123456789012345678901234567890',
            timestamp: Math.floor(Date.now() / 1000) - 86400,
            metadata: JSON.stringify({ batchNumber: drugBatchNumber })
          }
        ],
        totalSteps: 1,
        blockchainId: `SC_${drugBatchNumber}_${Date.now()}`
      }
    };
  } catch (error) {
    console.error('Error getting supply chain history from blockchain:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

module.exports = blockchainService;
