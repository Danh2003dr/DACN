const mongoose = require('mongoose');
const User = require('../models/User');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const Task = require('../models/Task');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Setup demo tasks
const setupTaskDemo = async () => {
  try {
    console.log('🚀 Setting up Task Demo Data...');

    // Get users
    const admin = await User.findOne({ role: 'admin' });
    const manufacturer = await User.findOne({ role: 'manufacturer' });
    const distributor = await User.findOne({ role: 'distributor' });
    const hospital = await User.findOne({ role: 'hospital' });

    if (!admin || !manufacturer || !distributor || !hospital) {
      console.error('❌ Required users not found. Please run setup-demo-data.js first.');
      return;
    }

    // Get drugs and supply chains
    const drugs = await Drug.find().limit(2);
    const supplyChains = await SupplyChain.find().limit(2);

    if (drugs.length === 0 || supplyChains.length === 0) {
      console.error('❌ No drugs or supply chains found. Please run setup scripts first.');
      return;
    }

    // Clear existing tasks
    await Task.deleteMany({});
    console.log('✅ Cleared existing tasks');

    // Create demo tasks
    const demoTasks = [
      {
        title: 'Vận chuyển lô thuốc BATCH-001-2024 đến bệnh viện ABC',
        description: 'Vận chuyển 1000 viên thuốc từ kho phân phối đến bệnh viện ABC. Cần đảm bảo nhiệt độ bảo quản trong quá trình vận chuyển.',
        type: 'transport',
        priority: 'high',
        status: 'in_progress',
        progress: 60,
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
        assignedTo: distributor._id,
        assignedBy: manufacturer._id,
        relatedSupplyChain: supplyChains[0]._id,
        relatedDrug: drugs[0]._id,
        batchNumber: 'BATCH-001-2024',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231],
          address: '789 Bệnh viện ABC, Quận 3, TP.HCM',
          name: 'Bệnh viện ABC'
        },
        tags: ['vận chuyển', 'nhiệt độ', 'khẩn cấp'],
        category: 'logistics',
        estimatedDuration: {
          value: 4,
          unit: 'hours'
        },
        cost: {
          estimated: 500000,
          actual: 0,
          currency: 'VND'
        },
        updates: [
          {
            status: 'pending',
            progress: 0,
            updateText: 'Nhiệm vụ đã được tạo và giao cho nhà phân phối',
            updatedBy: manufacturer._id,
            updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
            isPublic: true
          },
          {
            status: 'in_progress',
            progress: 30,
            updateText: 'Đã chuẩn bị phương tiện vận chuyển và kiểm tra điều kiện bảo quản',
            updatedBy: distributor._id,
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            isPublic: true
          },
          {
            status: 'in_progress',
            progress: 60,
            updateText: 'Đang trên đường vận chuyển. Nhiệt độ trong xe được duy trì ở 22°C',
            updatedBy: distributor._id,
            updatedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
            isPublic: true
          }
        ]
      },
      {
        title: 'Kiểm tra chất lượng lô thuốc BATCH-002-2024',
        description: 'Thực hiện kiểm tra chất lượng toàn diện cho lô thuốc BATCH-002-2024 trước khi đưa vào lưu trữ. Kiểm tra bao gồm: tính toàn vẹn bao bì, hạn sử dụng, và các chỉ tiêu chất lượng.',
        type: 'quality_check',
        priority: 'urgent',
        status: 'pending',
        progress: 0,
        dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // 1 day from now
        assignedTo: hospital._id,
        assignedBy: distributor._id,
        relatedSupplyChain: supplyChains[1]?._id,
        relatedDrug: drugs[1]?._id,
        batchNumber: 'BATCH-002-2024',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231],
          address: '789 Bệnh viện ABC - Phòng Kiểm tra Chất lượng, Quận 3, TP.HCM',
          name: 'Phòng Kiểm tra Chất lượng'
        },
        tags: ['kiểm tra chất lượng', 'bao bì', 'hạn sử dụng'],
        category: 'quality',
        estimatedDuration: {
          value: 2,
          unit: 'hours'
        },
        cost: {
          estimated: 200000,
          actual: 0,
          currency: 'VND'
        }
      },
      {
        title: 'Lưu trữ lô thuốc BATCH-001-2024 trong kho dược phẩm',
        description: 'Sau khi nhận hàng từ vận chuyển, thực hiện lưu trữ lô thuốc BATCH-001-2024 trong kho dược phẩm với điều kiện nhiệt độ và độ ẩm phù hợp.',
        type: 'storage',
        priority: 'medium',
        status: 'pending',
        progress: 0,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
        assignedTo: hospital._id,
        assignedBy: manufacturer._id,
        relatedSupplyChain: supplyChains[0]._id,
        relatedDrug: drugs[0]._id,
        batchNumber: 'BATCH-001-2024',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231],
          address: '789 Bệnh viện ABC - Kho Dược phẩm, Quận 3, TP.HCM',
          name: 'Kho Dược phẩm'
        },
        tags: ['lưu trữ', 'nhiệt độ', 'độ ẩm'],
        category: 'logistics',
        estimatedDuration: {
          value: 1,
          unit: 'hours'
        },
        cost: {
          estimated: 100000,
          actual: 0,
          currency: 'VND'
        }
      },
      {
        title: 'Cấp phát thuốc cho bệnh nhân từ lô BATCH-003-2024',
        description: 'Cấp phát 50 viên thuốc từ lô BATCH-003-2024 cho bệnh nhân theo đơn thuốc của bác sĩ. Cần ghi chép đầy đủ thông tin bệnh nhân và số lượng cấp phát.',
        type: 'distribution',
        priority: 'medium',
        status: 'completed',
        progress: 100,
        dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
        completedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
        assignedTo: hospital._id,
        assignedBy: admin._id,
        relatedSupplyChain: supplyChains[0]._id,
        relatedDrug: drugs[0]._id,
        batchNumber: 'BATCH-003-2024',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231],
          address: '789 Bệnh viện ABC - Quầy Cấp phát Thuốc, Quận 3, TP.HCM',
          name: 'Quầy Cấp phát Thuốc'
        },
        tags: ['cấp phát', 'bệnh nhân', 'đơn thuốc'],
        category: 'compliance',
        estimatedDuration: {
          value: 30,
          unit: 'hours'
        },
        actualDuration: {
          value: 25,
          unit: 'hours'
        },
        cost: {
          estimated: 50000,
          actual: 45000,
          currency: 'VND'
        },
        updates: [
          {
            status: 'pending',
            progress: 0,
            updateText: 'Nhiệm vụ cấp phát thuốc đã được tạo',
            updatedBy: admin._id,
            updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            isPublic: true
          },
          {
            status: 'in_progress',
            progress: 50,
            updateText: 'Đã chuẩn bị thuốc và kiểm tra đơn thuốc của bệnh nhân',
            updatedBy: hospital._id,
            updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            isPublic: true
          },
          {
            status: 'completed',
            progress: 100,
            updateText: 'Đã cấp phát thành công 50 viên thuốc cho bệnh nhân. Thông tin đã được ghi chép đầy đủ.',
            updatedBy: hospital._id,
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
            isPublic: true
          }
        ],
        qualityRating: {
          rating: 4,
          comment: 'Hoàn thành tốt nhiệm vụ cấp phát. Ghi chép đầy đủ và chính xác.',
          ratedBy: admin._id,
          ratedAt: new Date(Date.now() - 1 * 60 * 60 * 1000) // 1 hour ago
        }
      },
      {
        title: 'Thu hồi lô thuốc BATCH-002-2024 do phát hiện tạp chất',
        description: 'Thực hiện thu hồi toàn bộ lô thuốc BATCH-002-2024 do phát hiện tạp chất trong quá trình kiểm tra. Cần liên hệ với tất cả các đơn vị đã nhận hàng và thực hiện thu hồi an toàn.',
        type: 'recall',
        priority: 'urgent',
        status: 'in_progress',
        progress: 40,
        dueDate: new Date(Date.now() + 6 * 60 * 60 * 1000), // 6 hours from now
        assignedTo: manufacturer._id,
        assignedBy: admin._id,
        relatedSupplyChain: supplyChains[1]?._id,
        relatedDrug: drugs[1]?._id,
        batchNumber: 'BATCH-002-2024',
        location: {
          type: 'Point',
          coordinates: [106.6297, 10.8231],
          address: '123 Đường Sản Xuất, Quận 1, TP.HCM',
          name: 'Nhà máy sản xuất'
        },
        tags: ['thu hồi', 'tạp chất', 'khẩn cấp', 'an toàn'],
        category: 'compliance',
        estimatedDuration: {
          value: 8,
          unit: 'hours'
        },
        cost: {
          estimated: 2000000,
          actual: 800000,
          currency: 'VND'
        },
        updates: [
          {
            status: 'pending',
            progress: 0,
            updateText: 'Nhiệm vụ thu hồi đã được tạo sau khi phát hiện tạp chất',
            updatedBy: admin._id,
            updatedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
            isPublic: true
          },
          {
            status: 'in_progress',
            progress: 20,
            updateText: 'Đã liên hệ với tất cả các đơn vị phân phối để thông báo thu hồi',
            updatedBy: manufacturer._id,
            updatedAt: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3 hours ago
            isPublic: true
          },
          {
            status: 'in_progress',
            progress: 40,
            updateText: 'Đã thu hồi được 60% số lượng thuốc. Đang tiếp tục thu hồi phần còn lại.',
            updatedBy: manufacturer._id,
            updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000), // 1 hour ago
            isPublic: true
          }
        ]
      }
    ];

    // Create tasks
    for (const taskData of demoTasks) {
      const task = new Task(taskData);
      await task.save();
      console.log(`✅ Created task: ${task.title}`);
    }

    console.log('🎉 Task Demo Data Setup Complete!');
    console.log('\n📋 Created Tasks:');
    console.log('1. Vận chuyển lô thuốc BATCH-001-2024 (Đang thực hiện - 60%)');
    console.log('2. Kiểm tra chất lượng lô thuốc BATCH-002-2024 (Chờ xử lý)');
    console.log('3. Lưu trữ lô thuốc BATCH-001-2024 (Chờ xử lý)');
    console.log('4. Cấp phát thuốc cho bệnh nhân (Hoàn thành - 4 sao)');
    console.log('5. Thu hồi lô thuốc BATCH-002-2024 (Đang thực hiện - 40%)');
    
    console.log('\n🔗 Access URLs:');
    console.log('- Task Management: http://localhost:3000/tasks');
    console.log('- Dashboard: http://localhost:3000/dashboard');

  } catch (error) {
    console.error('❌ Error setting up task demo:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await setupTaskDemo();
  process.exit(0);
};

main();
