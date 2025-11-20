const { Web3 } = require('web3');
const DrugTraceability = require('../build/contracts/DrugTraceability.json');
const crypto = require('crypto');
const cacheService = require('../utils/cache');

// Network configurations
const NETWORKS = {
  development: {
    name: 'Development',
    rpcUrl: 'http://127.0.0.1:7545',
    chainId: '*',
    isLayer2: false
  },
  sepolia: {
    name: 'Sepolia Testnet',
    rpcUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID || ''}`,
    chainId: 11155111,
    isLayer2: false
  },
  mainnet: {
    name: 'Ethereum Mainnet',
    rpcUrl: `https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID || ''}`,
    chainId: 1,
    isLayer2: false
  },
  bsc_testnet: {
    name: 'BSC Testnet',
    rpcUrl: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    chainId: 97,
    isLayer2: false
  },
  bsc_mainnet: {
    name: 'BSC Mainnet',
    rpcUrl: 'https://bsc-dataseed1.binance.org',
    chainId: 56,
    isLayer2: false
  },
  polygon_mumbai: {
    name: 'Polygon Mumbai',
    rpcUrl: 'https://rpc-mumbai.maticvigil.com',
    chainId: 80001,
    isLayer2: false
  },
  polygon_mainnet: {
    name: 'Polygon Mainnet',
    rpcUrl: 'https://polygon-rpc.com',
    chainId: 137,
    isLayer2: false
  },
  arbitrum_sepolia: {
    name: 'Arbitrum Sepolia',
    rpcUrl: 'https://sepolia-rollup.arbitrum.io/rpc',
    chainId: 421614,
    isLayer2: true
  },
  arbitrum_one: {
    name: 'Arbitrum One',
    rpcUrl: 'https://arb1.arbitrum.io/rpc',
    chainId: 42161,
    isLayer2: true
  },
  optimism_sepolia: {
    name: 'Optimism Sepolia',
    rpcUrl: 'https://sepolia.optimism.io',
    chainId: 11155420,
    isLayer2: true
  },
  optimism_mainnet: {
    name: 'Optimism Mainnet',
    rpcUrl: 'https://mainnet.optimism.io',
    chainId: 10,
    isLayer2: true
  }
};

class BlockchainService {
  constructor() {
    this.web3 = null;
    this.contract = null;
    this.account = null;
    this.isInitialized = false;
    this.currentNetwork = null;
    this.contractAddresses = {}; // Lưu contract addresses cho từng network
  }

  // Lấy network configuration
  getNetworkConfig(networkName) {
    const network = NETWORKS[networkName || process.env.BLOCKCHAIN_NETWORK || 'development'];
    if (!network) {
      throw new Error(`Network ${networkName} không được hỗ trợ`);
    }
    return network;
  }

  // Khởi tạo kết nối blockchain với multi-chain support
  async initialize(networkName = null) {
    try {
      const network = this.getNetworkConfig(networkName);
      this.currentNetwork = networkName || process.env.BLOCKCHAIN_NETWORK || 'development';
      
      // Kết nối đến network
      this.web3 = new Web3(network.rpcUrl);
      
      // Kiểm tra kết nối
      try {
        const isSyncing = await this.web3.eth.isSyncing();
        const blockNumber = await this.web3.eth.getBlockNumber();
        console.log(`Blockchain connection status: ${network.name}`);
        console.log(`Current block: ${blockNumber}`);
      } catch (e) {
        console.log('Could not check sync status, continuing...');
      }

      // Lấy account từ private key hoặc mnemonic
      if (process.env.PRIVATE_KEY && process.env.PRIVATE_KEY !== 'mock_private_key') {
        const account = this.web3.eth.accounts.privateKeyToAccount('0x' + process.env.PRIVATE_KEY);
        this.web3.eth.accounts.wallet.add(account);
        this.account = account.address;
      } else {
        // Thử lấy từ accounts
        const accounts = await this.web3.eth.getAccounts();
        if (accounts.length > 0) {
          this.account = accounts[0];
        } else {
          throw new Error('Không tìm thấy account nào trong blockchain network');
        }
      }
      
      console.log('Using account:', this.account);

      // Lấy contract address cho network hiện tại
      const contractAddress = this.getContractAddress(this.currentNetwork);
      
      if (!contractAddress) {
        throw new Error(`Contract address chưa được cấu hình cho network ${this.currentNetwork}`);
      }
      
      this.contract = new this.web3.eth.Contract(
        DrugTraceability.abi,
        contractAddress
      );
      
      console.log(`Contract initialized at address: ${contractAddress} on ${network.name}`);

      this.isInitialized = true;
      console.log('Blockchain service initialized successfully');
      
      return true;
    } catch (error) {
      console.error('Blockchain initialization error:', error);
      console.log('Falling back to mock mode...');
      
      // Fallback to mock mode
      this.web3 = null;
      this.contract = null;
      this.account = '0xMockAccount123456789';
      this.isInitialized = true;
      this.currentNetwork = 'mock';
      
      console.log('Blockchain service initialized in mock mode');
      return true;
    }
  }

  // Lấy contract address cho network
  getContractAddress(networkName) {
    // Ưu tiên từ environment variable với prefix network
    const envKey = `CONTRACT_ADDRESS_${networkName?.toUpperCase()}`;
    if (process.env[envKey]) {
      return process.env[envKey];
    }
    
    // Fallback về CONTRACT_ADDRESS chung
    if (process.env.CONTRACT_ADDRESS && process.env.CONTRACT_ADDRESS !== '0x...') {
      return process.env.CONTRACT_ADDRESS;
    }
    
    // Development default
    if (networkName === 'development') {
      return '0x4139d1bfab01d5ab57b7dc9b5025e716e7af030c';
    }
    
    return null;
  }

  // Chuyển đổi network
  async switchNetwork(networkName) {
    try {
      await this.initialize(networkName);
      return {
        success: true,
        network: this.currentNetwork,
        message: `Đã chuyển sang network ${networkName}`
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Ước tính gas động
  async estimateGas(method, params = [], options = {}) {
    try {
      if (!this.contract || !this.account) {
        return options.defaultGas || 500000;
      }

      const gasEstimate = await this.contract.methods[method](...params).estimateGas({
        from: this.account
      });

      // Thêm buffer 20% để đảm bảo transaction không fail
      const gasWithBuffer = Math.floor(gasEstimate * 1.2);
      
      // Giới hạn tối đa
      const maxGas = options.maxGas || 5000000;
      return Math.min(gasWithBuffer, maxGas);
    } catch (error) {
      console.warn(`Gas estimation failed for ${method}, using default:`, error.message);
      return options.defaultGas || 500000;
    }
  }

  // Lấy gas price động
  async getGasPrice() {
    try {
      if (!this.web3) {
        return '20000000000'; // 20 gwei default
      }

      const gasPrice = await this.web3.eth.getGasPrice();
      
      // Đối với Layer 2, gas price thường thấp hơn
      const network = this.getNetworkConfig(this.currentNetwork);
      if (network.isLayer2) {
        // Layer 2 có gas price thấp hơn nhiều
        return gasPrice;
      }
      
      return gasPrice;
    } catch (error) {
      console.warn('Could not get gas price, using default');
      return '20000000000'; // 20 gwei
    }
  }

  // Helper function để translate status từ contract (English) sang Vietnamese
  translateStatus(status) {
    const statusMap = {
      'Valid': 'Hợp lệ',
      'Recalled': 'Đã thu hồi',
      'Expired': 'Đã hết hạn',
      'Not Found': 'Không tồn tại'
    };
    return statusMap[status] || status;
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
    try {
      const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
      const sign = crypto.createSign('SHA256');
      sign.update(hash);
      sign.end();
      
      // Sử dụng private key đơn giản cho mock mode
      if (privateKey === 'mock_private_key' || privateKey === 'test_private_key') {
        return `mock_signature_${hash.substring(0, 16)}`;
      }
      
      return sign.sign(privateKey, 'hex');
    } catch (error) {
      console.error('Digital signature error:', error);
      // Fallback to mock signature
      const hash = crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex');
      return `mock_signature_${hash.substring(0, 16)}`;
    }
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
      
      // Gọi smart contract thực tế
      if (this.contract) {
        // Ước tính gas động
        const estimatedGas = await this.estimateGas('createDrugBatch', [
          drugData.drugId,
          drugData.name,
          drugData.activeIngredient,
          drugData.manufacturerId,
          drugData.batchNumber,
          Math.floor(new Date(drugData.productionDate).getTime() / 1000),
          Math.floor(new Date(drugData.expiryDate).getTime() / 1000),
          drugData.qualityTest?.result || 'PASSED',
          drugData.qrCode?.data || blockchainId
        ], { defaultGas: 500000, maxGas: 2000000 });

        // Lấy gas price động
        const gasPrice = await this.getGasPrice();

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
          gas: estimatedGas,
          gasPrice: gasPrice
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
        const estimatedGas = await this.estimateGas('updateDrugBatch', [
          drugId,
          updateData.name,
          updateData.activeIngredient,
          updateData.qualityTest?.result || 'PASSED'
        ], { defaultGas: 300000, maxGas: 1000000 });
        
        const gasPrice = await this.getGasPrice();

        const result = await this.contract.methods.updateDrugBatch(
          drugId,
          updateData.name,
          updateData.activeIngredient,
          updateData.qualityTest?.result || 'PASSED'
        ).send({
          from: this.account,
          gas: estimatedGas,
          gasPrice: gasPrice
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
        const estimatedGas = await this.estimateGas('recallDrugBatch', [
          drugId,
          reason
        ], { defaultGas: 200000, maxGas: 500000 });
        
        const gasPrice = await this.getGasPrice();

        const result = await this.contract.methods.recallDrugBatch(
          drugId,
          reason
        ).send({
          from: this.account,
          gas: estimatedGas,
          gasPrice: gasPrice
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
        const estimatedGas = await this.estimateGas('recordDistribution', [
          drugId,
          toAddress,
          location,
          status,
          notes
        ], { defaultGas: 300000, maxGas: 1000000 });
        
        const gasPrice = await this.getGasPrice();

        const result = await this.contract.methods.recordDistribution(
          drugId,
          toAddress,
          location,
          status,
          notes
        ).send({
          from: this.account,
          gas: estimatedGas,
          gasPrice: gasPrice
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

  // Lấy thông tin từ blockchain (với cache)
  async getDrugBatchFromBlockchain(drugId, useCache = true) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      // Kiểm tra cache trước
      if (useCache && cacheService.isEnabled) {
        const cacheKey = `blockchain:drug:${drugId}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return { ...cached, fromCache: true };
        }
      }

      if (this.contract && process.env.CONTRACT_ADDRESS !== '0x...') {
        const result = await this.contract.methods.getDrugBatch(drugId).call();
        const response = {
          success: true,
          data: result
        };

        // Cache kết quả (TTL 5 phút)
        if (useCache && cacheService.isEnabled) {
          const cacheKey = `blockchain:drug:${drugId}`;
          await cacheService.set(cacheKey, response, 300);
        }

        return response;
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
    // Nếu đã khởi tạo và có web3 instance thì đã kết nối
    if (this.isInitialized && this.web3 !== null) {
      return true;
    }
    // Nếu ở mock mode (isInitialized = true nhưng web3 = null) cũng coi là connected
    // vì service vẫn hoạt động được ở mock mode
    if (this.isInitialized && this.account && this.account.startsWith('0x')) {
      return true;
    }
    return false;
  }

  // Lấy thông tin account hiện tại
  getCurrentAccount() {
    return this.account;
  }

  // Lấy thông tin network hiện tại
  getCurrentNetwork() {
    return {
      name: this.currentNetwork,
      config: this.getNetworkConfig(this.currentNetwork),
      isLayer2: this.getNetworkConfig(this.currentNetwork)?.isLayer2 || false
    };
  }

  // Lấy danh sách networks được hỗ trợ
  getSupportedNetworks() {
    return Object.keys(NETWORKS).map(key => ({
      key,
      ...NETWORKS[key]
    }));
  }

  // Xác minh lô thuốc (lazy verification - chỉ verify khi cần)
  async verifyDrugBatch(drugId, forceVerify = false) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      // Kiểm tra cache trước (nếu không force verify)
      if (!forceVerify && cacheService.isEnabled) {
        const cacheKey = `blockchain:verify:${drugId}`;
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return { ...cached, fromCache: true };
        }
      }

      if (this.contract) {
        const result = await this.contract.methods.verifyDrugBatch(drugId).call();
        
        // Chỉ ghi nhận verification nếu forceVerify = true (tránh tốn gas không cần thiết)
        if (forceVerify) {
          const estimatedGas = await this.estimateGas('recordVerification', [
            drugId,
            result[0]
          ], { defaultGas: 100000, maxGas: 300000 });
          
          const gasPrice = await this.getGasPrice();
          
          await this.contract.methods.recordVerification(drugId, result[0]).send({
            from: this.account,
            gas: estimatedGas,
            gasPrice: gasPrice
          });
        }
        
        const response = {
          success: true,
          isValid: result[0],
          isExpired: result[1],
          isRecalled: result[2],
          status: this.translateStatus(result[3])
        };

        // Cache kết quả (TTL 10 phút)
        if (cacheService.isEnabled) {
          const cacheKey = `blockchain:verify:${drugId}`;
          await cacheService.set(cacheKey, response, 600);
        }

        return response;
      } else {
        // Mock implementation
        return {
          success: true,
          isValid: true,
          isExpired: false,
          isRecalled: false,
          status: this.translateStatus('Valid'),
          mock: true
        };
      }
    } catch (error) {
      console.error('Drug verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Batch verification - verify nhiều drugs cùng lúc
  async verifyDrugBatchBatch(drugIds) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      if (!Array.isArray(drugIds) || drugIds.length === 0) {
        return { success: false, error: 'Danh sách drugIds không hợp lệ' };
      }

      const results = [];
      const uncachedIds = [];

      // Kiểm tra cache cho từng drug
      if (cacheService.isEnabled) {
        for (const drugId of drugIds) {
          const cacheKey = `blockchain:verify:${drugId}`;
          const cached = await cacheService.get(cacheKey);
          if (cached) {
            results.push({ drugId, ...cached, fromCache: true });
          } else {
            uncachedIds.push(drugId);
          }
        }
      } else {
        uncachedIds.push(...drugIds);
      }

      // Verify các drugs chưa có trong cache
      if (uncachedIds.length > 0 && this.contract) {
        // Batch call để giảm số lần gọi contract
        const verifyPromises = uncachedIds.map(drugId => 
          this.contract.methods.verifyDrugBatch(drugId).call()
            .then(result => ({
              drugId,
              success: true,
              isValid: result[0],
              isExpired: result[1],
              isRecalled: result[2],
              status: this.translateStatus(result[3])
            }))
            .catch(error => ({
              drugId,
              success: false,
              error: error.message
            }))
        );

        const verifyResults = await Promise.all(verifyPromises);
        
        // Cache các kết quả
        if (cacheService.isEnabled) {
          for (const result of verifyResults) {
            if (result.success) {
              const cacheKey = `blockchain:verify:${result.drugId}`;
              await cacheService.set(cacheKey, result, 600);
            }
          }
        }

        results.push(...verifyResults);
      }

      return {
        success: true,
        results,
        total: drugIds.length,
        cached: results.filter(r => r.fromCache).length,
        verified: results.filter(r => r.success && !r.fromCache).length
      };
    } catch (error) {
      console.error('Batch verification error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy thống kê contract (với cache)
  async getContractStats(useCache = true) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      // Kiểm tra cache
      if (useCache && cacheService.isEnabled) {
        const cacheKey = 'blockchain:stats';
        const cached = await cacheService.get(cacheKey);
        if (cached) {
          return { ...cached, fromCache: true };
        }
      }

      if (this.contract) {
        const result = await this.contract.methods.getContractStats().call();
        const response = {
          success: true,
          stats: {
            totalBatches: parseInt(result[0]),
            activeBatches: parseInt(result[1]),
            recalledBatches: parseInt(result[2]),
            expiredBatches: parseInt(result[3])
          }
        };

        // Cache kết quả (TTL 2 phút)
        if (useCache && cacheService.isEnabled) {
          const cacheKey = 'blockchain:stats';
          await cacheService.set(cacheKey, response, 120);
        }

        return response;
      } else {
        // Mock implementation
        return {
          success: true,
          stats: {
            totalBatches: 5,
            activeBatches: 3,
            recalledBatches: 1,
            expiredBatches: 1
          },
          mock: true
        };
      }
    } catch (error) {
      console.error('Contract stats error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Tìm kiếm lô thuốc theo tên
  async searchDrugBatchesByName(name) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      if (this.contract) {
        const result = await this.contract.methods.searchDrugBatchesByName(name).call();
        return {
          success: true,
          drugIds: result
        };
      } else {
        // Mock implementation
        return {
          success: true,
          drugIds: ['DRUG_001', 'DRUG_002'],
          mock: true
        };
      }
    } catch (error) {
      console.error('Drug search error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy lịch sử phân phối với pagination
  async getDistributionHistoryPaginated(drugId, offset = 0, limit = 10) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      if (this.contract) {
        const result = await this.contract.methods.getDistributionHistoryPaginated(
          drugId, offset, limit
        ).call();
        
        const history = [];
        for (let i = 0; i < result[0].length; i++) {
          history.push({
            from: result[0][i],
            to: result[1][i],
            timestamp: parseInt(result[2][i]),
            location: result[3][i],
            status: result[4][i],
            notes: result[5][i]
          });
        }
        
        return {
          success: true,
          history: history,
          totalRecords: parseInt(result[6])
        };
      } else {
        // Mock implementation
        return {
          success: true,
          history: [
            {
              from: this.account,
              to: '0x1234567890123456789012345678901234567890',
              timestamp: Date.now() - 86400000,
              location: 'Nhà kho trung tâm',
              status: 'Đã giao',
              notes: 'Giao hàng thành công'
            }
          ],
          totalRecords: 1,
          mock: true
        };
      }
    } catch (error) {
      console.error('Distribution history paginated error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Lấy tất cả drug IDs
  async getAllDrugIds() {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      if (this.contract) {
        const result = await this.contract.methods.getAllDrugIds().call();
        return {
          success: true,
          drugIds: result
        };
      } else {
        // Mock implementation
        return {
          success: true,
          drugIds: ['DRUG_001', 'DRUG_002', 'DRUG_003'],
          mock: true
        };
      }
    } catch (error) {
      console.error('Get all drug IDs error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  // Kiểm tra drug batch có tồn tại không
  async drugBatchExists(drugId) {
    try {
      if (!this.isInitialized) {
        throw new Error('Blockchain service chưa được khởi tạo');
      }

      if (this.contract) {
        const result = await this.contract.methods.drugBatchExists(drugId).call();
        return {
          success: true,
          exists: result
        };
      } else {
        // Mock implementation
        return {
          success: true,
          exists: true,
          mock: true
        };
      }
    } catch (error) {
      console.error('Drug batch exists check error:', error);
      return {
        success: false,
        error: error.message
      };
    }
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
