/**
 * Test Data Seed Script
 * Script để seed dữ liệu test cho môi trường testing
 */

const mongoose = require('mongoose');
const User = require('../../models/User');
const Drug = require('../../models/Drug');
const SupplyChain = require('../../models/SupplyChain');
const { createTestUser, createTestDrug } = require('../helpers/testData');

const seedTestData = async () => {
  try {
    console.log('🌱 Bắt đầu seed dữ liệu test...');

    // Tạo users với các roles khác nhau
    const admin = await User.findOne({ role: 'admin' }) || await createTestUser('admin', {
      username: 'admin',
      email: 'admin@test.com',
      organizationId: 'ADMIN_ORG'
    });

    const manufacturer = await User.findOne({ role: 'manufacturer' }) || await createTestUser('manufacturer', {
      username: 'manufacturer1',
      email: 'manufacturer@test.com',
      organizationId: 'ORG001'
    });

    const distributor = await User.findOne({ role: 'distributor' }) || await createTestUser('distributor', {
      username: 'distributor1',
      email: 'distributor@test.com',
      organizationId: 'ORG002'
    });

    const hospital = await User.findOne({ role: 'hospital' }) || await createTestUser('hospital', {
      username: 'hospital1',
      email: 'hospital@test.com',
      organizationId: 'ORG003'
    });

    // Tạo drugs
    const drugs = [];
    for (let i = 1; i <= 10; i++) {
      const drug = await createTestDrug(manufacturer._id, {
        name: `Test Drug ${i}`,
        batchNumber: `BATCH${String(i).padStart(3, '0')}`,
        productionDate: new Date(2024, 0, i),
        expiryDate: new Date(2026, 0, i)
      });
      drugs.push(drug);
    }

    console.log('✅ Seed dữ liệu test thành công!');
    console.log(`   - Users: ${await User.countDocuments()}`);
    console.log(`   - Drugs: ${await Drug.countDocuments()}`);

    return {
      admin,
      manufacturer,
      distributor,
      hospital,
      drugs
    };
  } catch (error) {
    console.error('❌ Lỗi khi seed dữ liệu test:', error);
    throw error;
  }
};

// Chạy seed nếu được gọi trực tiếp
if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability-test')
    .then(() => seedTestData())
    .then(() => {
      console.log('✅ Hoàn thành seed dữ liệu test');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Lỗi:', error);
      process.exit(1);
    });
}

module.exports = { seedTestData };

