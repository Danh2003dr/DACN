const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const SupplyChain = require('../../../models/SupplyChain');
const Drug = require('../../../models/Drug');
const User = require('../../../models/User');
const { createSupplyChain, getSupplyChains, addSupplyChainStep } = require('../../../controllers/supplyChainController');

// Mock services
jest.mock('../../../services/auditService', () => ({
  createAuditLog: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());

const mockAuth = (req, res, next) => {
  req.user = req.body._user || { _id: new mongoose.Types.ObjectId(), role: 'manufacturer' };
  next();
};

app.post('/api/supply-chains', mockAuth, createSupplyChain);
app.get('/api/supply-chains', mockAuth, getSupplyChains);
app.put('/api/supply-chains/:id', mockAuth, addSupplyChainStep);

describe('Supply Chain Controller - Unit Tests', () => {
  let manufacturerUser;
  let distributorUser;
  let testDrug;
  let testSupplyChain;

  beforeEach(async () => {
    manufacturerUser = await User.create({
      username: 'manufacturer',
      email: 'manufacturer@test.com',
      password: 'Test123!@#',
      fullName: 'Manufacturer Test',
      role: 'manufacturer',
      organizationId: 'MANUFACTURER_ORG',
      mustChangePassword: false
    });

    distributorUser = await User.create({
      username: 'distributor',
      email: 'distributor@test.com',
      password: 'Test123!@#',
      fullName: 'Distributor Test',
      role: 'distributor',
      organizationId: 'DISTRIBUTOR_ORG',
      mustChangePassword: false
    });

    testDrug = await Drug.create({
      name: 'Test Drug',
      activeIngredient: 'Test',
      dosage: '100mg',
      form: 'Viên nén',
      batchNumber: 'BATCH001',
      productionDate: new Date('2024-01-01'),
      expiryDate: new Date('2026-01-01'),
      manufacturerId: manufacturerUser._id,
      createdBy: manufacturerUser._id
    });

    testSupplyChain = await SupplyChain.create({
      drugBatchNumber: 'BATCH001',
      currentStep: 'manufacturing',
      status: 'active',
      steps: [{
        step: 'manufacturing',
        timestamp: new Date(),
        location: 'Factory A',
        performedBy: manufacturerUser._id
      }],
      createdBy: manufacturerUser._id
    });
  });

  afterEach(async () => {
    await SupplyChain.deleteMany({});
    await Drug.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/supply-chains - Create Supply Chain', () => {
    it('should create supply chain successfully', async () => {
      const response = await request(app)
        .post('/api/supply-chains')
        .send({
          _user: manufacturerUser,
          drugBatchNumber: 'BATCH002',
          currentStep: 'manufacturing',
          status: 'active'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.supplyChain.drugBatchNumber).toBe('BATCH002');
    });

    it('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/supply-chains')
        .send({
          _user: manufacturerUser
          // Missing drugBatchNumber
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/supply-chains - Get Supply Chains', () => {
    it('should get all supply chains', async () => {
      const response = await request(app)
        .get('/api/supply-chains')
        .send({ _user: manufacturerUser });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.supplyChains)).toBe(true);
    });

    it('should filter by drugBatchNumber', async () => {
      const response = await request(app)
        .get('/api/supply-chains?drugBatchNumber=BATCH001')
        .send({ _user: manufacturerUser });

      expect(response.status).toBe(200);
      expect(response.body.data.supplyChains.every(sc => sc.drugBatchNumber === 'BATCH001')).toBe(true);
    });
  });

  describe('PUT /api/supply-chains/:id - Update Supply Chain', () => {
    it('should update supply chain successfully', async () => {
      const response = await request(app)
        .put(`/api/supply-chains/${testSupplyChain._id}`)
        .send({
          _user: distributorUser,
          action: 'receive',
          location: 'Warehouse A'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});

