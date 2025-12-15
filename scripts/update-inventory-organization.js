/**
 * Script để cập nhật organizationId cho các inventory items hiện có
 * 
 * Usage: node scripts/update-inventory-organization.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Inventory = require('../models/Inventory');
const User = require('../models/User');

const updateInventoryOrganization = async () => {
  try {
    // Kết nối MongoDB
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability';
    await mongoose.connect(mongoURI);
    console.log('✅ Đã kết nối MongoDB');

    // Lấy tất cả inventory items không có organizationId
    const itemsWithoutOrg = await Inventory.find({
      $or: [
        { 'location.organizationId': { $exists: false } },
        { 'location.organizationId': null }
      ]
    }).populate('createdBy', 'organizationId');

    console.log(`📦 Tìm thấy ${itemsWithoutOrg.length} inventory items cần cập nhật`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const item of itemsWithoutOrg) {
      try {
        // Lấy organizationId từ createdBy user
        if (item.createdBy && item.createdBy.organizationId) {
          item.location.organizationId = item.createdBy.organizationId;
          await item.save();
          updatedCount++;
          console.log(`✅ Đã cập nhật item ${item._id}: organizationId = ${item.createdBy.organizationId}`);
        } else {
          // Nếu không có createdBy hoặc organizationId, thử lấy từ drug manufacturer
          if (item.drug) {
            const drug = await require('../models/Drug').findById(item.drug).populate('manufacturerId', 'organizationId');
            if (drug && drug.manufacturerId && drug.manufacturerId.organizationId) {
              item.location.organizationId = drug.manufacturerId.organizationId;
              await item.save();
              updatedCount++;
              console.log(`✅ Đã cập nhật item ${item._id} từ manufacturer: organizationId = ${drug.manufacturerId.organizationId}`);
            } else {
              skippedCount++;
              console.log(`⚠️  Bỏ qua item ${item._id}: Không tìm thấy organizationId`);
            }
          } else {
            skippedCount++;
            console.log(`⚠️  Bỏ qua item ${item._id}: Không có createdBy và drug`);
          }
        }
      } catch (error) {
        console.error(`❌ Lỗi khi cập nhật item ${item._id}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📊 Kết quả:');
    console.log(`✅ Đã cập nhật: ${updatedCount} items`);
    console.log(`⚠️  Đã bỏ qua: ${skippedCount} items`);

    // Đóng kết nối
    await mongoose.connection.close();
    console.log('✅ Đã đóng kết nối MongoDB');

  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

// Chạy script
updateInventoryOrganization();

