const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const DigitalSignature = require('../../../models/DigitalSignature');
const Drug = require('../../../models/Drug');
const User = require('../../../models/User');
const { signDocument, verifySignature, getSignatures } = require('../../../controllers/digitalSignatureController');

// Mock services
jest.mock('../../../services/digitalSignatureService', () => ({
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

jest.mock('../../../services/auditService', () => ({
  createAuditLog: jest.fn().mockResolvedValue(true)
}));

const app = express();
app.use(express.json());

const mockAuth = (req, res, next) => {
  req.user = req.body._user || { _id: new mongoose.Types.ObjectId(), role: 'manufacturer' };
  next();
};

app.post('/api/digital-signatures/sign', mockAuth, signDocument);
app.post('/api/digital-signatures/verify', mockAuth, verifySignature);
app.get('/api/digital-signatures', mockAuth, getSignatures);

describe('Digital Signature Controller - Unit Tests', () => {
  let manufacturerUser;
  let testDrug;
  let testSignature;

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

    testDrug = await Drug.create({
      name: 'Test Drug',
      activeIngredient: 'Test',
      dosage: '100mg',
      form: 'Viên nén',
      batchNumber: 'BATCH001',
      productionDate: new Date('2024-01-01'),
      expiryDate: new Date('2026-01-01'),
      manufacturerId: manufacturerUser._id,
      createdBy: manufacturerUser._id,
      drugId: 'DRUG001'
    });

    testSignature = await DigitalSignature.create({
      targetType: 'drug',
      targetId: testDrug._id,
      signedBy: manufacturerUser._id,
      dataHash: 'test-hash',
      signature: 'test-signature',
      status: 'active'
    });
  });

  afterEach(async () => {
    await DigitalSignature.deleteMany({});
    await Drug.deleteMany({});
    await User.deleteMany({});
  });

  describe('POST /api/digital-signatures/sign - Sign Document', () => {
    it('should sign document successfully', async () => {
      const response = await request(app)
        .post('/api/digital-signatures/sign')
        .send({
          _user: manufacturerUser,
          targetType: 'drug',
          targetId: testDrug._id.toString(),
          caProvider: 'vnca'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should fail with invalid target type', async () => {
      const response = await request(app)
        .post('/api/digital-signatures/sign')
        .send({
          _user: manufacturerUser,
          targetType: 'invalid',
          targetId: testDrug._id.toString()
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/digital-signatures/verify - Verify Signature', () => {
    it('should verify signature successfully', async () => {
      const response = await request(app)
        .post('/api/digital-signatures/verify')
        .send({
          _user: manufacturerUser,
          signatureId: testSignature._id.toString()
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.valid).toBe(true);
    });

    it('should fail with invalid signature id', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .post('/api/digital-signatures/verify')
        .send({
          _user: manufacturerUser,
          signatureId: fakeId.toString()
        });

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/digital-signatures - Get Signatures', () => {
    it('should get all signatures', async () => {
      const response = await request(app)
        .get('/api/digital-signatures')
        .send({ _user: manufacturerUser });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.signatures)).toBe(true);
    });
  });
});

