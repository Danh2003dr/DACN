const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const Drug = require('../../../models/Drug');
const User = require('../../../models/User');
const SupplyChain = require('../../../models/SupplyChain');
const { createDrug, getDrugs, getDrugById, updateDrug, deleteDrug } = require('../../../controllers/drugController');
const { authenticate } = require('../../../middleware/auth');

// Mock blockchain service
jest.mock('../../../services/blockchainService', () => ({
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

// Mock drugRiskService
jest.mock('../../../services/drugRiskService', () => ({
  calculateDrugRisk: jest.fn().mockResolvedValue({
    riskScore: 20,
    riskLevel: 'low',
    factors: []
  })
}));

// Mock auditService
jest.mock('../../../services/auditService', () => ({
  createAuditLog: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());

// Mock auth middleware
const mockAuth = async (req, res, next) => {
  // Extract user from body for testing
  if (req.body._user) {
    req.user = req.body._user;
    delete req.body._user; // Remove from body
  } else {
    req.user = { _id: new mongoose.Types.ObjectId(), role: 'manufacturer' };
  }
  next();
};

app.post('/api/drugs', mockAuth, createDrug);
app.get('/api/drugs', mockAuth, getDrugs);
app.get('/api/drugs/:id', mockAuth, getDrugById);
app.put('/api/drugs/:id', mockAuth, updateDrug);
app.delete('/api/drugs/:id', mockAuth, deleteDrug);

describe('Drug Controller - Unit Tests', () => {
  let manufacturerUser;
  let adminUser;
  let testDrug;

  beforeEach(async () => {
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

    // Tạo test drug
    testDrug = await Drug.create({
      name: 'Paracetamol 500mg',
      activeIngredient: 'Paracetamol',
      dosage: '500mg',
      form: 'viên nén',
      batchNumber: 'BATCH001',
      productionDate: new Date('2024-01-01'),
      expiryDate: new Date('2026-01-01'),
      manufacturerId: manufacturerUser._id,
      createdBy: manufacturerUser._id,
      qualityTest: {
        testDate: new Date(),
        testResult: 'đạt',
        testBy: 'Bộ Y tế'
      }
    });
  });

  afterEach(async () => {
    await Drug.deleteMany({});
    await User.deleteMany({});
    await SupplyChain.deleteMany({});
  });

  describe('POST /api/drugs - Create Drug', () => {
    it('should create drug successfully with valid data', async () => {
      const response = await request(app)
        .post('/api/drugs')
        .send({
          _user: manufacturerUser,
          name: 'Aspirin 100mg',
          activeIngredient: 'Acetylsalicylic acid',
          dosage: '100mg',
          form: 'viên nén',
          batchNumber: 'BATCH002',
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
      expect(response.body.data.drug.name).toBe('Aspirin 100mg');
      expect(response.body.data.drug.batchNumber).toBe('BATCH002');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/drugs')
        .send({
          _user: manufacturerUser,
          name: 'Test Drug'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with invalid expiry date (before production date)', async () => {
      const response = await request(app)
        .post('/api/drugs')
        .send({
          _user: manufacturerUser,
          name: 'Test Drug',
          activeIngredient: 'Test',
          dosage: '100mg',
          form: 'viên nén',
          batchNumber: 'BATCH003',
          productionDate: '2024-01-01',
          expiryDate: '2023-01-01' // Invalid: before production date
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/hạn sử dụng/i);
    });

    it('should fail with duplicate batch number', async () => {
      const response = await request(app)
        .post('/api/drugs')
        .send({
          _user: manufacturerUser,
          name: 'Test Drug',
          activeIngredient: 'Test',
          dosage: '100mg',
          form: 'viên nén',
          batchNumber: 'BATCH001', // Duplicate
          productionDate: '2024-01-01',
          expiryDate: '2026-01-01'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toMatch(/đã tồn tại/i);
    });
  });

  describe('GET /api/drugs - Get Drugs', () => {
    it('should get all drugs for admin', async () => {
      const response = await request(app)
        .get('/api/drugs')
        .send({ _user: adminUser });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('drugs');
      expect(Array.isArray(response.body.data.drugs)).toBe(true);
    });

    it('should filter drugs for non-admin (exclude Ministry of Health verified)', async () => {
      // Tạo drug được kiểm định bởi Bộ Y tế
      await Drug.create({
        name: 'Ministry Drug',
        activeIngredient: 'Test',
        dosage: '100mg',
        form: 'viên nén',
        batchNumber: 'BATCH_MINISTRY',
        productionDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01'),
        manufacturerId: manufacturerUser._id,
        createdBy: manufacturerUser._id,
        qualityTest: {
          testDate: new Date(),
          testResult: 'đạt',
          testBy: 'Bộ Y tế'
        }
      });

      const response = await request(app)
        .get('/api/drugs')
        .send({ _user: manufacturerUser });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      // Non-admin should not see drugs verified by Ministry of Health
      const drugs = response.body.data.drugs;
      const ministryDrug = drugs.find(d => d.batchNumber === 'BATCH_MINISTRY');
      expect(ministryDrug).toBeUndefined();
    });

    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/drugs?page=1&limit=10')
        .send({ _user: adminUser });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('pagination');
    });
  });

  describe('GET /api/drugs/:id - Get Drug By ID', () => {
    it('should get drug by id successfully', async () => {
      const response = await request(app)
        .get(`/api/drugs/${testDrug._id}`)
        .send({ _user: manufacturerUser });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.drug._id.toString()).toBe(testDrug._id.toString());
    });

    it('should return 404 for non-existent drug', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/drugs/${fakeId}`)
        .send({ _user: manufacturerUser });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/drugs/:id - Update Drug', () => {
    it('should update drug successfully', async () => {
      const response = await request(app)
        .put(`/api/drugs/${testDrug._id}`)
        .send({
          _user: manufacturerUser,
          name: 'Updated Drug Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.drug.name).toBe('Updated Drug Name');
    });

    it('should fail to update non-existent drug', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .put(`/api/drugs/${fakeId}`)
        .send({
          _user: manufacturerUser,
          name: 'Updated Name'
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/drugs/:id - Delete Drug', () => {
    it('should delete drug successfully (admin only)', async () => {
      const response = await request(app)
        .delete(`/api/drugs/${testDrug._id}`)
        .send({ _user: adminUser });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify drug is deleted
      const deletedDrug = await Drug.findById(testDrug._id);
      expect(deletedDrug).toBeNull();
    });

    it('should fail to delete for non-admin', async () => {
      const response = await request(app)
        .delete(`/api/drugs/${testDrug._id}`)
        .send({ _user: manufacturerUser });

      expect(response.status).toBe(403);
    });
  });
});

