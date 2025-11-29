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
const supplyChainRoutes = require('../../routes/supplyChains');

app.use('/api/auth', authRoutes);
app.use('/api/supply-chains', supplyChainRoutes);
const User = require('../../models/User');
const Drug = require('../../models/Drug');
const SupplyChain = require('../../models/SupplyChain');

describe('Supply Chain Flow - Integration Tests', () => {
  let manufacturerToken;
  let distributorToken;
  let hospitalToken;
  let manufacturerUser;
  let distributorUser;
  let hospitalUser;
  let testDrug;

  beforeAll(async () => {
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

    distributorUser = await User.create({
      username: 'distributor',
      email: 'distributor@test.com',
      password: 'Test123!@#',
      fullName: 'Distributor Test',
      role: 'distributor',
      organizationId: 'DISTRIBUTOR_ORG',
      mustChangePassword: false
    });
    distributorToken = distributorUser.generateAuthToken();

    hospitalUser = await User.create({
      username: 'hospital',
      email: 'hospital@test.com',
      password: 'Test123!@#',
      fullName: 'Hospital Test',
      role: 'hospital',
      organizationId: 'HOSPITAL_ORG',
      mustChangePassword: false
    });
    hospitalToken = hospitalUser.generateAuthToken();

    testDrug = await Drug.create({
      name: 'Supply Chain Test Drug',
      activeIngredient: 'Test',
      dosage: '100mg',
      form: 'Viên nén',
      batchNumber: `BATCH_SC_${Date.now()}`,
      productionDate: new Date('2024-01-01'),
      expiryDate: new Date('2026-01-01'),
      manufacturerId: manufacturerUser._id,
      createdBy: manufacturerUser._id
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Drug.deleteMany({});
    await SupplyChain.deleteMany({});
  });

  describe('Complete Supply Chain Journey', () => {
    let supplyChainId;

    it('Step 1: Manufacturer creates supply chain', async () => {
      const response = await request(app)
        .post('/api/supply-chains')
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .send({
          drugBatchNumber: testDrug.batchNumber,
          currentStep: 'manufacturing',
          status: 'active'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      supplyChainId = response.body.data.supplyChain._id;
    });

    it('Step 2: Manufacturer updates to packaging', async () => {
      const response = await request(app)
        .put(`/api/supply-chains/${supplyChainId}`)
        .set('Authorization', `Bearer ${manufacturerToken}`)
        .send({
          currentStep: 'packaging',
          status: 'active'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.supplyChain.currentStep).toBe('packaging');
    });

    it('Step 3: Distributor receives and updates to distribution', async () => {
      const response = await request(app)
        .put(`/api/supply-chains/${supplyChainId}`)
        .set('Authorization', `Bearer ${distributorToken}`)
        .send({
          currentStep: 'distribution',
          status: 'active'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.supplyChain.currentStep).toBe('distribution');
    });

    it('Step 4: Hospital receives and updates to delivery', async () => {
      const response = await request(app)
        .put(`/api/supply-chains/${supplyChainId}`)
        .set('Authorization', `Bearer ${hospitalToken}`)
        .send({
          currentStep: 'delivery',
          status: 'active'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.supplyChain.currentStep).toBe('delivery');
    });

    it('Step 5: Complete supply chain', async () => {
      const response = await request(app)
        .put(`/api/supply-chains/${supplyChainId}`)
        .set('Authorization', `Bearer ${hospitalToken}`)
        .send({
          currentStep: 'completed',
          status: 'completed'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.supplyChain.status).toBe('completed');
    });

    it('Step 6: Verify complete supply chain history', async () => {
      const response = await request(app)
        .get(`/api/supply-chains/${supplyChainId}`)
        .set('Authorization', `Bearer ${manufacturerToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.supplyChain.steps.length).toBeGreaterThan(1);
      expect(response.body.data.supplyChain.status).toBe('completed');
    });
  });
});

