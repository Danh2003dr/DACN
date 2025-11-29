const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const app = express();

// Setup app for testing (không start server thật)
app.use(express.json());

// Mock auth middleware for testing
jest.mock('../../middleware/auth', () => {
  const User = require('../../models/User');
  return async (req, res, next) => {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');
      if (!token) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only');
      const user = await User.findById(decoded.id || decoded.userId);
      
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      
      req.user = user;
      next();
    } catch (error) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  };
});

// Import routes
const authRoutes = require('../../routes/auth');
const drugRoutes = require('../../routes/drugs');
const digitalSignatureRoutes = require('../../routes/digitalSignatures');
const supplyChainRoutes = require('../../routes/supplyChains');

app.use('/api/auth', authRoutes);
app.use('/api/drugs', drugRoutes);
app.use('/api/digital-signatures', digitalSignatureRoutes);
app.use('/api/supply-chains', supplyChainRoutes);
const User = require('../../models/User');
const Drug = require('../../models/Drug');
const DigitalSignature = require('../../models/DigitalSignature');
const SupplyChain = require('../../models/SupplyChain');

// Mock blockchain service
jest.mock('../../services/blockchainService', () => ({
  isInitialized: true,
  initialize: jest.fn().mockResolvedValue(true),
  recordDrugBatchOnBlockchain: jest.fn().mockResolvedValue({
    success: true,
    blockchainId: 'mock-blockchain-id',
    transactionHash: '0x123',
    blockNumber: 12345,
    timestamp: new Date(),
    signature: 'mock-signature',
    hash: 'mock-hash'
  })
}));

// Mock digital signature service
jest.mock('../../services/digitalSignatureService', () => ({
  createSignature: jest.fn().mockResolvedValue({
    success: true,
    signature: {
      _id: new mongoose.Types.ObjectId(),
      targetType: 'drug',
      targetId: new mongoose.Types.ObjectId(),
      dataHash: 'mock-hash',
      signature: 'mock-signature',
      status: 'active'
    }
  }),
  verifySignature: jest.fn().mockResolvedValue({
    valid: true,
    message: 'Chữ ký số hợp lệ'
  })
}));

describe('Drug Flow - Integration Tests', () => {
  let manufacturerToken;
  let manufacturerUser;
  let adminToken;
  let adminUser;

  beforeAll(async () => {
    // Tạo admin user
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'Test123!@#',
      fullName: 'Admin Test',
      role: 'admin',
      organizationId: 'ADMIN_ORG',
      mustChangePassword: false
    });
    adminToken = adminUser.generateAuthToken();

    // Tạo manufacturer user
    manufacturerUser = await User.create({
      username: 'manufacturer',
      email: 'manufacturer@test.com',
      password: 'Test123!@#',
      fullName: 'Manufacturer Test',
      role: 'manufacturer',
      organizationId: 'MANUFACTURER_ORG',
      mustChangePassword: false
    });
    manufacturerToken = manufacturerUser.generateAuthToken();
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Drug.deleteMany({});
    await DigitalSignature.deleteMany({});
    await SupplyChain.deleteMany({});
  });

  describe('Complete Drug Lifecycle', () => {
    let createdDrugId;

    it('Step 1: Login as manufacturer', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'manufacturer',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('Step 2: Create drug batch', async () => {
      const response = await request(app)
        .post('/api/drugs')
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .send({
          name: 'Integration Test Drug',
          activeIngredient: 'Test Ingredient',
          dosage: '100mg',
          form: 'Viên nén',
          batchNumber: `BATCH_INTEGRATION_${Date.now()}`,
          productionDate: '2024-01-01',
          expiryDate: '2026-01-01',
          qualityTest: {
            testDate: new Date(),
            testResult: 'đạt',
            testBy: 'Bộ Y tế'
          }
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('drug');
      createdDrugId = response.body.data.drug._id;
    });

    it('Step 3: Create digital signature for drug', async () => {
      const response = await request(app)
        .post('/api/digital-signatures/sign')
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .send({
          targetType: 'drug',
          targetId: createdDrugId,
          caProvider: 'vnca'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('Step 4: Create supply chain for drug', async () => {
      const drug = await Drug.findById(createdDrugId);
      
      const response = await request(app)
        .post('/api/supply-chains')
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .send({
          drugBatchNumber: drug.batchNumber,
          currentStep: 'manufacturing',
          status: 'active'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('Step 5: Verify drug via QR scan', async () => {
      const drug = await Drug.findById(createdDrugId);
      
      const response = await request(app)
        .post('/api/drugs/scan-qr')
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .send({
          qrData: drug.blockchain?.blockchainId || drug.drugId
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('drug');
      expect(response.body.data.drug._id.toString()).toBe(createdDrugId.toString());
    });

    it('Step 6: Update supply chain status', async () => {
      const drug = await Drug.findById(createdDrugId);
      const supplyChain = await SupplyChain.findOne({ drugBatchNumber: drug.batchNumber });
      
      const response = await request(app)
        .put(`/api/supply-chains/${supplyChain._id}`)
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .send({
          currentStep: 'distribution',
          status: 'active'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe('Role-based Access Control', () => {
    let testDrug;

    beforeEach(async () => {
      testDrug = await Drug.create({
        name: 'RBAC Test Drug',
        activeIngredient: 'Test',
        dosage: '100mg',
        form: 'Viên nén',
        batchNumber: `BATCH_RBAC_${Date.now()}`,
        productionDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01'),
        manufacturerId: manufacturerUser._id,
        createdBy: manufacturerUser._id
      });
    });

    afterEach(async () => {
      await Drug.deleteMany({ _id: testDrug._id });
    });

    it('should allow manufacturer to create drug', async () => {
      const response = await request(app)
        .post('/api/drugs')
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .send({
          name: 'Manufacturer Drug',
          activeIngredient: 'Test',
          dosage: '100mg',
          form: 'Viên nén',
          batchNumber: `BATCH_MANUFACTURER_${Date.now()}`,
          productionDate: '2024-01-01',
          expiryDate: '2026-01-01'
        });

      expect(response.status).toBe(201);
    });

    it('should allow admin to delete any drug', async () => {
      const response = await request(app)
        .delete(`/api/drugs/${testDrug._id}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
    });

    it('should prevent non-admin from deleting drug', async () => {
      const response = await request(app)
        .delete(`/api/drugs/${testDrug._id}`)
        .set('Authorization', `Bearer ${manufacturerToken}`);

      expect(response.status).toBe(403);
    });
  });
});

