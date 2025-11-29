const drugRiskService = require('../../../services/drugRiskService');
const Drug = require('../../../models/Drug');
const User = require('../../../models/User');
const SupplierTrustScore = require('../../../models/SupplierTrustScore');
const Review = require('../../../models/Review');

describe('Drug Risk Service - Unit Tests', () => {
  let manufacturer;
  let testDrug;

  beforeEach(async () => {
    // Tạo manufacturer user
    manufacturer = await User.create({
      username: 'manufacturer1',
      email: 'manufacturer@test.com',
      password: 'Test123!@#',
      fullName: 'Test Manufacturer',
      role: 'manufacturer',
      organizationId: 'ORG001',
      mustChangePassword: false
    });

    // Tạo drug với các trường hợp khác nhau
    testDrug = await Drug.create({
      name: 'Test Drug',
      activeIngredient: 'Test Ingredient',
      dosage: '500mg',
      form: 'viên nén',
      batchNumber: 'BATCH001',
      productionDate: new Date('2024-01-01'),
      expiryDate: new Date('2026-01-01'),
      manufacturerId: manufacturer._id,
      createdBy: manufacturer._id,
      qualityTest: {
        testDate: new Date(),
        testResult: 'đạt',
        testBy: 'Test Lab'
      },
      isRecalled: false
    });
  });

  afterEach(async () => {
    await Drug.deleteMany({});
    await User.deleteMany({});
    await SupplierTrustScore.deleteMany({});
    await Review.deleteMany({});
  });

  describe('calculateDrugRisk', () => {
    it('should calculate low risk for valid drug', async () => {
      const risk = await drugRiskService.calculateDrugRisk(testDrug);

      expect(risk).toBeDefined();
      expect(risk).toHaveProperty('score');
      expect(risk).toHaveProperty('level');
      expect(risk).toHaveProperty('factors');
      expect(risk.score).toBeLessThan(30); // Low risk
      expect(risk.level).toBe('low');
    });

    it('should calculate high risk for expired drug', async () => {
      testDrug.productionDate = new Date('2018-01-01');
      testDrug.expiryDate = new Date('2020-01-01'); // Expired
      await testDrug.save();

      const risk = await drugRiskService.calculateDrugRisk(testDrug);

      expect(risk.score).toBeGreaterThanOrEqual(50); // Expired adds 50 points
      expect(risk.level).toBe('high');
      expect(risk.factors).toContainEqual(
        expect.objectContaining({
          key: 'expired'
        })
      );
    });

    it('should calculate high risk for recalled drug', async () => {
      testDrug.isRecalled = true;
      await testDrug.save();

      const risk = await drugRiskService.calculateDrugRisk(testDrug);

      expect(risk.score).toBeGreaterThanOrEqual(60); // Recalled adds 60 points
      expect(risk.level).toBe('high'); // 60 is high, not critical (>=80)
      expect(risk.factors).toContainEqual(
        expect.objectContaining({
          key: 'recalled'
        })
      );
    });

    it('should include supplier trust score in calculation', async () => {
      // Tạo trust score thấp cho manufacturer
      await SupplierTrustScore.create({
        supplier: manufacturer._id,
        supplierName: 'Test Manufacturer',
        supplierRole: 'manufacturer',
        trustScore: 300, // Low trust score (0-1000)
        trustLevel: 'D'
      });

      const risk = await drugRiskService.calculateDrugRisk(testDrug);

      expect(risk.factors).toContainEqual(
        expect.objectContaining({
          key: 'low_trust_score'
        })
      );
      expect(risk.score).toBeGreaterThan(30); // Should increase risk
    });

    it('should include review ratings in calculation', async () => {
      // Tạo reviews tiêu cực
      await Review.create({
        targetType: 'drug',
        targetId: testDrug._id,
        targetName: testDrug.name,
        overallRating: 1, // Very low rating
        comment: 'Poor quality',
        isAnonymous: false
      });

      const risk = await drugRiskService.calculateDrugRisk(testDrug);

      expect(risk.factors).toContainEqual(
        expect.objectContaining({
          type: 'reviews'
        })
      );
    });

    it('should handle drug with no additional data', async () => {
      const simpleDrug = await Drug.create({
        name: 'Simple Drug',
        activeIngredient: 'Simple Ingredient',
        dosage: '100mg',
        form: 'viên nang',
        batchNumber: 'BATCH002',
        productionDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01'),
        manufacturerId: manufacturer._id,
        createdBy: manufacturer._id,
        qualityTest: {
          testDate: new Date(),
          testResult: 'đang kiểm định',
          testBy: 'Test Lab'
        }
      });

      const risk = await drugRiskService.calculateDrugRisk(simpleDrug);

      expect(risk).toBeDefined();
      expect(risk.score).toBeGreaterThanOrEqual(0);
      expect(risk.score).toBeLessThanOrEqual(100);
    });
  });
});

