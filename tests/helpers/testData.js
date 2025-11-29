/**
 * Test Data Helper
 * Cung cấp các hàm helper để tạo dữ liệu test
 */

const User = require('../../models/User');
const Drug = require('../../models/Drug');
const SupplyChain = require('../../models/SupplyChain');
const DigitalSignature = require('../../models/DigitalSignature');

/**
 * Tạo user test với role cụ thể
 */
const createTestUser = async (role = 'manufacturer', overrides = {}) => {
  // Default organizationId based on role
  const defaultOrgId = role === 'admin' ? 'ADMIN_ORG' : 
                      role === 'patient' ? null : 
                      `ORG_${role.toUpperCase()}_${Date.now()}`;
  
  const defaultData = {
    username: `test_${role}_${Date.now()}`,
    email: `test_${role}@test.com`,
    password: 'Test123!@#',
    fullName: `Test ${role}`,
    role: role,
    organizationId: defaultOrgId,
    mustChangePassword: false,
    ...overrides
  };

  return await User.create(defaultData);
};

/**
 * Tạo drug test
 */
const createTestDrug = async (manufacturerId, overrides = {}) => {
  const defaultData = {
    name: 'Test Drug',
    activeIngredient: 'Test Ingredient',
    dosage: '500mg',
    form: 'viên nén',
    batchNumber: `BATCH_${Date.now()}`,
    productionDate: new Date('2024-01-01'),
    expiryDate: new Date('2026-01-01'),
    manufacturerId: manufacturerId,
    createdBy: manufacturerId,
    qualityTest: {
      testDate: new Date(),
      testResult: 'đạt',
      testBy: 'Test Lab'
    },
    ...overrides
  };

  return await Drug.create(defaultData);
};

/**
 * Tạo supply chain test
 */
const createTestSupplyChain = async (drugId, overrides = {}) => {
  const defaultData = {
    drugId: drugId,
    status: 'in_transit',
    currentLocation: 'Warehouse A',
    ...overrides
  };

  return await SupplyChain.create(defaultData);
};

/**
 * Cleanup tất cả test data
 */
const cleanupTestData = async () => {
  await User.deleteMany({ username: { $regex: /^test_/ } });
  await Drug.deleteMany({ batchNumber: { $regex: /^BATCH_/ } });
  await SupplyChain.deleteMany({});
  await DigitalSignature.deleteMany({});
};

module.exports = {
  createTestUser,
  createTestDrug,
  createTestSupplyChain,
  cleanupTestData
};

