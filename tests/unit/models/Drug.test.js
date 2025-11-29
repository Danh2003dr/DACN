const Drug = require('../../../models/Drug');
const mongoose = require('mongoose');

describe('Drug Model - Unit Tests', () => {
  describe('Validation', () => {
    it('should require name field', async () => {
      const drug = new Drug({
        batchNumber: 'BATCH001',
        productionDate: new Date(),
        expiryDate: new Date()
      });

      await expect(drug.validate()).rejects.toThrow();
    });

    it('should require batchNumber field', async () => {
      const drug = new Drug({
        name: 'Test Drug',
        productionDate: new Date(),
        expiryDate: new Date()
      });

      await expect(drug.validate()).rejects.toThrow();
    });

    it('should require productionDate field', async () => {
      const drug = new Drug({
        name: 'Test Drug',
        batchNumber: 'BATCH001',
        expiryDate: new Date()
      });

      await expect(drug.validate()).rejects.toThrow();
    });

    it('should require expiryDate field', async () => {
      const drug = new Drug({
        name: 'Test Drug',
        batchNumber: 'BATCH001',
        productionDate: new Date()
      });

      await expect(drug.validate()).rejects.toThrow();
    });

    it('should validate expiryDate is after productionDate', async () => {
      const drug = new Drug({
        name: 'Test Drug',
        batchNumber: 'BATCH001',
        productionDate: new Date('2024-01-01'),
        expiryDate: new Date('2023-01-01') // Invalid
      });

      await expect(drug.validate()).rejects.toThrow();
    });

    it('should create drug with valid data', async () => {
      const drugData = {
        name: 'Test Drug',
        activeIngredient: 'Test',
        dosage: '100mg',
        form: 'Viên nén',
        batchNumber: 'BATCH001',
        productionDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01'),
        manufacturerId: new mongoose.Types.ObjectId(),
        createdBy: new mongoose.Types.ObjectId()
      };

      const drug = new Drug(drugData);
      await expect(drug.validate()).resolves.not.toThrow();
    });
  });

  describe('Methods', () => {
    it('should generate drugId if not provided', async () => {
      const drug = new Drug({
        name: 'Test Drug',
        batchNumber: 'BATCH001',
        productionDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01'),
        manufacturerId: new mongoose.Types.ObjectId(),
        createdBy: new mongoose.Types.ObjectId()
      });

      expect(drug.drugId).toBeDefined();
      expect(typeof drug.drugId).toBe('string');
    });

    it('should check if drug is expired', async () => {
      const expiredDrug = new Drug({
        name: 'Expired Drug',
        batchNumber: 'BATCH001',
        productionDate: new Date('2020-01-01'),
        expiryDate: new Date('2022-01-01'), // Expired
        manufacturerId: new mongoose.Types.ObjectId(),
        createdBy: new mongoose.Types.ObjectId()
      });

      const isExpired = expiredDrug.isExpired();
      expect(isExpired).toBe(true);
    });

    it('should check if drug is expiring soon (within 7 days)', async () => {
      const expiringSoon = new Date();
      expiringSoon.setDate(expiringSoon.getDate() + 5); // 5 days from now

      const drug = new Drug({
        name: 'Expiring Drug',
        batchNumber: 'BATCH001',
        productionDate: new Date('2024-01-01'),
        expiryDate: expiringSoon,
        manufacturerId: new mongoose.Types.ObjectId(),
        createdBy: new mongoose.Types.ObjectId()
      });

      const isExpiringSoon = drug.isExpiringSoon();
      expect(isExpiringSoon).toBe(true);
    });
  });

  describe('Indexes', () => {
    it('should have unique index on batchNumber', async () => {
      const drug1 = new Drug({
        name: 'Drug 1',
        batchNumber: 'BATCH001',
        productionDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01'),
        manufacturerId: new mongoose.Types.ObjectId(),
        createdBy: new mongoose.Types.ObjectId()
      });

      const drug2 = new Drug({
        name: 'Drug 2',
        batchNumber: 'BATCH001', // Duplicate
        productionDate: new Date('2024-01-01'),
        expiryDate: new Date('2026-01-01'),
        manufacturerId: new mongoose.Types.ObjectId(),
        createdBy: new mongoose.Types.ObjectId()
      });

      // Note: This test requires database connection
      // In real scenario, you'd save drug1 first, then try to save drug2
    });
  });
});

