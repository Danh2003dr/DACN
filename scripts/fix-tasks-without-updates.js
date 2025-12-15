const mongoose = require('mongoose');
require('dotenv').config();
const Task = require('../models/Task');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function fixTasksWithoutUpdates() {
  try {
    console.log('🔍 Đang kiểm tra các task không có updates...');
    
    // Tìm tất cả tasks không có updates hoặc updates rỗng
    const tasksWithoutUpdates = await Task.find({
      $or: [
        { updates: { $exists: false } },
        { updates: { $size: 0 } },
        { updates: null }
      ]
    }).populate('assignedTo', 'fullName').populate('assignedBy', 'fullName');

    console.log(`📊 Tìm thấy ${tasksWithoutUpdates.length} task không có updates`);

    for (const task of tasksWithoutUpdates) {
      console.log(`\n📝 Xử lý task: ${task.title} (ID: ${task._id})`);
      
      // Tạo update đầu tiên dựa trên thông tin hiện tại của task
      const updateText = task.status === 'completed' 
        ? `Nhiệm vụ đã được hoàn thành (${task.progress}%)`
        : task.createdAt 
          ? `Nhiệm vụ đã được tạo và giao cho ${task.assignedTo?.fullName || 'người dùng'}` 
          : `Nhiệm vụ đã được tạo`;

      try {
        await task.addUpdate({
          status: task.status || 'pending',
          progress: task.progress || 0,
          updateText: updateText,
          updatedBy: task.assignedBy || task.assignedTo || task._id, // Fallback nếu không có
          isPublic: true,
          updatedAt: task.createdAt || new Date()
        });

        console.log(`  ✅ Đã thêm update ban đầu cho task "${task.title}"`);
      } catch (error) {
        console.error(`  ❌ Lỗi khi thêm update cho task "${task.title}":`, error.message);
      }
    }

    console.log('\n✨ Hoàn thành!');
    
  } catch (error) {
    console.error('❌ Lỗi:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối database');
  }
}

// Chạy script
fixTasksWithoutUpdates();
