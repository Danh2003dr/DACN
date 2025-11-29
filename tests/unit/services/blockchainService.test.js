const blockchainService = require('../../../services/blockchainService');

// Mock Web3
jest.mock('web3', () => {
  return jest.fn().mockImplementation(() => ({
    eth: {
      Contract: jest.fn().mockImplementation(() => ({
        methods: {
          recordDrugBatch: jest.fn().mockReturnValue({
            send: jest.fn().mockResolvedValue({
              transactionHash: '0x123',
              blockNumber: 12345
            })
          }),
          getDrugBatch: jest.fn().mockReturnValue({
            call: jest.fn().mockResolvedValue({
              name: 'Test Drug',
              batchNumber: 'BATCH001',
              manufacturer: '0xManufacturer'
            })
          }),
          verifyDrugBatch: jest.fn().mockReturnValue({
            call: jest.fn().mockResolvedValue(true)
          })
        }
      })),
      getBlockNumber: jest.fn().mockResolvedValue(12345),
      getBlock: jest.fn().mockResolvedValue({
        timestamp: Date.now() / 1000
      })
    },
    utils: {
      toWei: jest.fn((value) => value),
      fromWei: jest.fn((value) => value)
    }
  }));
});

describe('Blockchain Service - Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('initialize', () => {
    it('should initialize blockchain service in mock mode', async () => {
      process.env.BLOCKCHAIN_MODE = 'mock';
      await blockchainService.initialize();
      
      expect(blockchainService.isInitialized).toBe(true);
    });

    it('should handle initialization errors gracefully', async () => {
      process.env.BLOCKCHAIN_MODE = 'invalid';
      await expect(blockchainService.initialize()).resolves.not.toThrow();
    });
  });

  describe('recordDrugBatchOnBlockchain', () => {
    it('should record drug batch on blockchain in mock mode', async () => {
      process.env.BLOCKCHAIN_MODE = 'mock';
      await blockchainService.initialize();

      const drugData = {
        name: 'Test Drug',
        batchNumber: 'BATCH001',
        productionDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01')
      };

      const result = await blockchainService.recordDrugBatchOnBlockchain(drugData);

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('blockchainId');
      expect(result).toHaveProperty('transactionHash');
    });

    it('should return error if not initialized', async () => {
      blockchainService.isInitialized = false;
      
      const result = await blockchainService.recordDrugBatchOnBlockchain({});
      
      expect(result.success).toBe(false);
    });
  });

  describe('verifyDrugBatch', () => {
    it('should verify drug batch on blockchain', async () => {
      process.env.BLOCKCHAIN_MODE = 'mock';
      await blockchainService.initialize();

      const result = await blockchainService.verifyDrugBatch('BATCH001');

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('isValid');
    });
  });

  describe('getDrugBatchFromBlockchain', () => {
    it('should get drug batch from blockchain', async () => {
      process.env.BLOCKCHAIN_MODE = 'mock';
      await blockchainService.initialize();

      const result = await blockchainService.getDrugBatchFromBlockchain('BATCH001');

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('data');
    });
  });
});

