const mongoose = require('mongoose');
const User = require('../models/User');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const Task = require('../models/Task');
const Notification = require('../models/Notification');

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

// Setup demo notifications
const setupNotificationDemo = async () => {
  try {
    console.log('🚀 Setting up Notification Demo Data...');

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
    const tasks = await Task.find().limit(2);

    if (drugs.length === 0) {
      console.error('❌ No drugs found. Please run setup scripts first.');
      return;
    }

    // Clear existing notifications
    await Notification.deleteMany({});
    console.log('✅ Cleared existing notifications');

    // Create demo notifications
    const demoNotifications = [
      {
        title: 'Thu hồi khẩn cấp lô thuốc BATCH-002-2024',
        content: 'Phát hiện tạp chất trong lô thuốc BATCH-002-2024. Yêu cầu tất cả các đơn vị liên quan ngừng sử dụng và tiến hành thu hồi ngay lập tức. Liên hệ hotline 1900-xxx-xxx để được hướng dẫn chi tiết.',
        type: 'drug_recall',
        priority: 'urgent',
        sender: admin._id,
        scope: 'all',
        scopeDetails: {
          roles: ['admin', 'manufacturer', 'distributor', 'hospital']
        },
        relatedModule: 'drug',
        relatedId: drugs[1]?._id,
        isPublic: true,
        requiresAction: true,
        actionUrl: '/drugs',
        actionText: 'Xem chi tiết thuốc',
        tags: ['thu hồi', 'khẩn cấp', 'tạp chất'],
        scheduledAt: null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
      {
        title: 'Cập nhật hệ thống bảo mật',
        content: 'Hệ thống sẽ được cập nhật bảo mật vào ngày 10/10/2024 từ 02:00 - 04:00. Trong thời gian này, hệ thống có thể tạm thời không khả dụng. Vui lòng lưu công việc trước thời điểm cập nhật.',
        type: 'system',
        priority: 'high',
        sender: admin._id,
        scope: 'all',
        scopeDetails: {
          roles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']
        },
        relatedModule: 'system',
        isPublic: true,
        requiresAction: false,
        tags: ['hệ thống', 'bảo mật', 'cập nhật'],
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        title: 'Nhiệm vụ vận chuyển đã được giao',
        content: `Bạn đã được giao nhiệm vụ mới: "Vận chuyển lô thuốc BATCH-001-2024 đến bệnh viện ABC". Thời hạn hoàn thành: ${new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN')}. Vui lòng kiểm tra chi tiết và bắt đầu thực hiện.`,
        type: 'task_assignment',
        priority: 'high',
        sender: manufacturer._id,
        scope: 'specific_users',
        scopeDetails: {
          userIds: [distributor._id]
        },
        relatedModule: 'task',
        relatedId: tasks[0]?._id,
        isPublic: false,
        requiresAction: true,
        actionUrl: '/tasks',
        actionText: 'Xem nhiệm vụ',
        tags: ['nhiệm vụ', 'vận chuyển', 'giao hàng'],
        scheduledAt: null,
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 days from now
      },
      {
        title: 'Cảnh báo chất lượng lô thuốc BATCH-001-2024',
        content: 'Phát hiện độ ẩm vượt ngưỡng cho phép trong lô thuốc BATCH-001-2024. Yêu cầu kiểm tra lại điều kiện bảo quản và tiến hành kiểm tra chất lượng bổ sung trước khi phân phối.',
        type: 'quality_alert',
        priority: 'high',
        sender: manufacturer._id,
        scope: 'roles',
        scopeDetails: {
          roles: ['distributor', 'hospital']
        },
        relatedModule: 'drug',
        relatedId: drugs[0]._id,
        isPublic: false,
        requiresAction: true,
        actionUrl: '/drugs',
        actionText: 'Kiểm tra thuốc',
        tags: ['chất lượng', 'độ ẩm', 'cảnh báo'],
        scheduledAt: null,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      },
      {
        title: 'Cập nhật trạng thái chuỗi cung ứng',
        content: 'Lô thuốc BATCH-001-2024 đã được vận chuyển thành công từ nhà sản xuất đến kho phân phối. Trạng thái hiện tại: Đang kiểm tra chất lượng. Dự kiến phân phối đến bệnh viện trong 2 ngày tới.',
        type: 'supply_chain_update',
        priority: 'medium',
        sender: distributor._id,
        scope: 'roles',
        scopeDetails: {
          roles: ['manufacturer', 'hospital']
        },
        relatedModule: 'supply_chain',
        relatedId: supplyChains[0]?._id,
        isPublic: false,
        requiresAction: false,
        actionUrl: '/supply-chain',
        actionText: 'Xem chuỗi cung ứng',
        tags: ['chuỗi cung ứng', 'vận chuyển', 'cập nhật'],
        scheduledAt: null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        title: 'Thông báo chung: Cập nhật quy trình làm việc',
        content: 'Từ ngày 15/10/2024, hệ thống sẽ áp dụng quy trình làm việc mới với các cải tiến về bảo mật và hiệu suất. Vui lòng tham gia buổi đào tạo trực tuyến vào ngày 12/10/2024 lúc 14:00. Link đào tạo sẽ được gửi riêng.',
        type: 'general',
        priority: 'medium',
        sender: admin._id,
        scope: 'all',
        scopeDetails: {
          roles: ['admin', 'manufacturer', 'distributor', 'hospital']
        },
        relatedModule: 'system',
        isPublic: false,
        requiresAction: true,
        actionUrl: '/settings',
        actionText: 'Xem cài đặt',
        tags: ['quy trình', 'đào tạo', 'cập nhật'],
        scheduledAt: null,
        expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days from now
      },
      {
        title: 'Hoàn thành nhiệm vụ cấp phát thuốc',
        content: 'Nhiệm vụ "Cấp phát thuốc cho bệnh nhân từ lô BATCH-003-2024" đã được hoàn thành thành công. Đánh giá chất lượng: 4/5 sao. Cảm ơn bạn đã hoàn thành nhiệm vụ một cách xuất sắc.',
        type: 'task_assignment',
        priority: 'low',
        sender: admin._id,
        scope: 'specific_users',
        scopeDetails: {
          userIds: [hospital._id]
        },
        relatedModule: 'task',
        relatedId: tasks[1]?._id,
        isPublic: false,
        requiresAction: false,
        actionUrl: '/tasks',
        actionText: 'Xem đánh giá',
        tags: ['hoàn thành', 'đánh giá', 'nhiệm vụ'],
        scheduledAt: null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
      },
      {
        title: 'Cảnh báo bảo mật: Đổi mật khẩu định kỳ',
        content: 'Để đảm bảo bảo mật tài khoản, vui lòng đổi mật khẩu của bạn nếu chưa đổi trong 90 ngày qua. Mật khẩu mạnh giúp bảo vệ dữ liệu và thông tin quan trọng của hệ thống.',
        type: 'system',
        priority: 'medium',
        sender: admin._id,
        scope: 'all',
        scopeDetails: {
          roles: ['admin', 'manufacturer', 'distributor', 'hospital', 'patient']
        },
        relatedModule: 'system',
        isPublic: true,
        requiresAction: true,
        actionUrl: '/profile',
        actionText: 'Đổi mật khẩu',
        tags: ['bảo mật', 'mật khẩu', 'cảnh báo'],
        scheduledAt: null,
        expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days from now
      }
    ];

    // Create notifications with recipients
    for (const notificationData of demoNotifications) {
      const notification = await Notification.createNotification(notificationData);
      console.log(`✅ Created notification: ${notification.title}`);
    }

    console.log('🎉 Notification Demo Data Setup Complete!');
    console.log('\n📢 Created Notifications:');
    console.log('1. Thu hồi khẩn cấp lô thuốc BATCH-002-2024 (Khẩn cấp)');
    console.log('2. Cập nhật hệ thống bảo mật (Cao)');
    console.log('3. Nhiệm vụ vận chuyển đã được giao (Cao)');
    console.log('4. Cảnh báo chất lượng lô thuốc BATCH-001-2024 (Cao)');
    console.log('5. Cập nhật trạng thái chuỗi cung ứng (Trung bình)');
    console.log('6. Thông báo chung: Cập nhật quy trình làm việc (Trung bình)');
    console.log('7. Hoàn thành nhiệm vụ cấp phát thuốc (Thấp)');
    console.log('8. Cảnh báo bảo mật: Đổi mật khẩu định kỳ (Trung bình)');
    
    console.log('\n🔗 Access URLs:');
    console.log('- Notification Management: http://localhost:3000/notifications');
    console.log('- Dashboard: http://localhost:3000/dashboard');

  } catch (error) {
    console.error('❌ Error setting up notification demo:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await setupNotificationDemo();
  process.exit(0);
};

main();
