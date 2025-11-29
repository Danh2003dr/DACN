const mongoose = require('mongoose');
require('dotenv').config();
const Inventory = require('../models/Inventory');
const InventoryTransaction = require('../models/InventoryTransaction');
const Drug = require('../models/Drug');
const User = require('../models/User');
const inventoryService = require('../services/inventoryService');

/**
 * Script test cho Inventory Management
 */
async function testInventory() {
  try {
    // Kết nối MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Đã kết nối MongoDB');

    // Lấy một drug và user để test
    const drug = await Drug.findOne();
    const user = await User.findOne({ role: { $in: ['admin', 'manufacturer'] } });

    if (!drug) {
      console.log('⚠️  Không có drug nào trong database. Vui lòng tạo drug trước.');
      process.exit(1);
    }

    if (!user) {
      console.log('⚠️  Không có user nào trong database. Vui lòng tạo user trước.');
      process.exit(1);
    }

    console.log(`📝 Sử dụng drug: ${drug.name} (${drug.drugId})`);
    console.log(`👤 Sử dụng user: ${user.username} (${user.role})`);

    // Test 1: Nhập kho
    console.log('\n🧪 Test 1: Nhập kho');
    try {
      const stockInResult = await inventoryService.stockIn({
        drugId: drug.drugId,
        batchNumber: drug.batchNumber,
        locationId: 'WH001',
        locationName: 'Kho chính',
        locationType: 'warehouse',
        quantity: 100,
        unit: 'viên',
        unitPrice: 5000,
        expiryDate: drug.expiryDate,
        productionDate: drug.productionDate,
        supplierId: user._id,
        supplierName: user.fullName || user.username,
        reason: 'purchase',
        notes: 'Test nhập kho'
      }, user);

      console.log('✅ Nhập kho thành công');
      console.log(`   - Inventory ID: ${stockInResult.inventory._id}`);
      console.log(`   - Số lượng: ${stockInResult.result.newQuantity}`);
      console.log(`   - Transaction ID: ${stockInResult.transaction._id}`);
    } catch (error) {
      console.error('❌ Lỗi nhập kho:', error.message);
    }

    // Test 2: Xuất kho
    console.log('\n🧪 Test 2: Xuất kho');
    try {
      const stockOutResult = await inventoryService.stockOut({
        drugId: drug.drugId,
        locationId: 'WH001',
        quantity: 20,
        reason: 'sale',
        recipientName: 'Bệnh nhân test',
        notes: 'Test xuất kho'
      }, user);

      console.log('✅ Xuất kho thành công');
      console.log(`   - Số lượng trước: ${stockOutResult.result.oldQuantity}`);
      console.log(`   - Số lượng sau: ${stockOutResult.result.newQuantity}`);
      console.log(`   - Transaction ID: ${stockOutResult.transaction._id}`);
    } catch (error) {
      console.error('❌ Lỗi xuất kho:', error.message);
    }

    // Test 3: Điều chỉnh kho
    console.log('\n🧪 Test 3: Điều chỉnh kho');
    try {
      const adjustResult = await inventoryService.adjustStock({
        drugId: drug.drugId,
        locationId: 'WH001',
        newQuantity: 85,
        reason: 'adjustment',
        notes: 'Test điều chỉnh kho'
      }, user);

      console.log('✅ Điều chỉnh kho thành công');
      console.log(`   - Số lượng trước: ${adjustResult.result.oldQuantity}`);
      console.log(`   - Số lượng sau: ${adjustResult.result.newQuantity}`);
      console.log(`   - Chênh lệch: ${adjustResult.result.difference}`);
    } catch (error) {
      console.error('❌ Lỗi điều chỉnh kho:', error.message);
    }

    // Test 4: Lấy tồn kho
    console.log('\n🧪 Test 4: Lấy tồn kho');
    try {
      const inventory = await Inventory.findOne({
        drugId: drug.drugId,
        'location.locationId': 'WH001'
      }).populate('drug', 'name');

      if (inventory) {
        console.log('✅ Tìm thấy tồn kho');
        console.log(`   - Thuốc: ${inventory.drugName}`);
        console.log(`   - Địa điểm: ${inventory.location.locationName}`);
        console.log(`   - Số lượng: ${inventory.quantity} ${inventory.unit}`);
        console.log(`   - Giá trị: ${new Intl.NumberFormat('vi-VN').format(inventory.totalValue)} đ`);
        console.log(`   - Trạng thái: ${inventory.status}`);
      } else {
        console.log('⚠️  Không tìm thấy tồn kho');
      }
    } catch (error) {
      console.error('❌ Lỗi lấy tồn kho:', error.message);
    }

    // Test 5: Lấy thống kê
    console.log('\n🧪 Test 5: Lấy thống kê');
    try {
      const stats = await Inventory.getStockStats('WH001');
      console.log('✅ Thống kê tồn kho:');
      console.log(`   - Tổng items: ${stats.totalItems}`);
      console.log(`   - Tổng số lượng: ${stats.totalQuantity}`);
      console.log(`   - Tổng giá trị: ${new Intl.NumberFormat('vi-VN').format(stats.totalValue)} đ`);
      console.log(`   - Sắp hết hàng: ${stats.lowStock}`);
      console.log(`   - Sắp hết hạn: ${stats.nearExpiry}`);
      console.log(`   - Đã hết hạn: ${stats.expired}`);
    } catch (error) {
      console.error('❌ Lỗi lấy thống kê:', error.message);
    }

    // Test 6: Lấy transactions
    console.log('\n🧪 Test 6: Lấy transactions');
    try {
      const transactions = await InventoryTransaction.find({
        drugId: drug.drugId
      })
        .sort({ transactionDate: -1 })
        .limit(5)
        .populate('performedBy', 'username');

      console.log(`✅ Tìm thấy ${transactions.length} transactions:`);
      transactions.forEach((tx, index) => {
        console.log(`   ${index + 1}. ${tx.type} - ${tx.quantity} ${tx.unit} - ${tx.performedBy?.username || 'N/A'}`);
      });
    } catch (error) {
      console.error('❌ Lỗi lấy transactions:', error.message);
    }

    console.log('\n✅ Hoàn thành test!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
}

// Chạy test
if (require.main === module) {
  testInventory();
}

module.exports = testInventory;

