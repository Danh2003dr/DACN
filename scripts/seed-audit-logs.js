const mongoose = require('mongoose');
require('dotenv').config();
const AuditLog = require('../models/AuditLog');
const User = require('../models/User');
const Drug = require('../models/Drug');
const SupplyChain = require('../models/SupplyChain');
const DigitalSignature = require('../models/DigitalSignature');
const Review = require('../models/Review');
const Task = require('../models/Task');

// Kết nối database
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability');
    console.log('✅ MongoDB Connected\n');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Tạo audit logs dựa trên dữ liệu thực tế
const seedAuditLogs = async () => {
  try {
    await connectDB();

    console.log('🚀 Bắt đầu tạo audit logs...\n');

    // Lấy dữ liệu thực tế từ database
    const users = await User.find({}).limit(20);
    const drugs = await Drug.find({}).limit(20);
    const supplyChains = await SupplyChain.find({}).limit(20);
    const digitalSignatures = await DigitalSignature.find({}).limit(10);
    const reviews = await Review.find({}).limit(10);
    const tasks = await Task.find({}).limit(10);

    console.log(`📊 Dữ liệu có sẵn:`);
    console.log(`  - Users: ${users.length}`);
    console.log(`  - Drugs: ${drugs.length}`);
    console.log(`  - Supply Chains: ${supplyChains.length}`);
    console.log(`  - Digital Signatures: ${digitalSignatures.length}`);
    console.log(`  - Reviews: ${reviews.length}`);
    console.log(`  - Tasks: ${tasks.length}\n`);

    // Xóa audit logs cũ (optional - comment out nếu muốn giữ lại)
    const existingCount = await AuditLog.countDocuments();
    if (existingCount > 0) {
      console.log(`🗑️  Đang xóa ${existingCount} audit logs cũ...`);
      await AuditLog.deleteMany({});
      console.log('  ✅ Đã xóa audit logs cũ\n');
    }

    const auditLogs = [];
    const now = new Date();

    // ========== 1. AUTHENTICATION LOGS ==========
    console.log('📝 1. Tạo authentication logs...');
    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Login success
      auditLogs.push({
        user: user._id,
        username: user.username,
        userRole: user.role,
        action: 'login',
        module: 'auth',
        description: `User ${user.username} đăng nhập thành công`,
        result: 'success',
        severity: 'low',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        requestMethod: 'POST',
        requestPath: '/api/auth/login',
        timestamp: new Date(timestamp.getTime() - Math.random() * 3600000),
        correlationId: `auth-${Date.now()}-${i}`
      });

      // Login failed (occasionally)
      if (Math.random() > 0.7) {
        auditLogs.push({
          user: null,
          username: user.username,
          userRole: 'system',
          action: 'login_failed',
          module: 'auth',
          description: `Đăng nhập thất bại cho ${user.username}`,
          result: 'failure',
          severity: 'medium',
          errorMessage: 'Mật khẩu không chính xác',
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          requestMethod: 'POST',
          requestPath: '/api/auth/login',
          timestamp: new Date(timestamp.getTime() - Math.random() * 3600000),
          correlationId: `auth-fail-${Date.now()}-${i}`
        });
      }
    }
    console.log(`  ✅ Đã tạo ${auditLogs.length} authentication logs`);

    // ========== 2. DRUG MANAGEMENT LOGS ==========
    console.log('📝 2. Tạo drug management logs...');
    let drugLogCount = 0;
    for (const drug of drugs) {
      const user = users[Math.floor(Math.random() * users.length)];
      const daysAgo = Math.floor(Math.random() * 60);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Drug create
      auditLogs.push({
        user: user._id,
        username: user.username,
        userRole: user.role,
        action: 'drug_create',
        module: 'drug',
        entityType: 'Drug',
        entityId: drug._id,
        description: `Tạo lô thuốc mới: ${drug.name} (${drug.batchNumber})`,
        result: 'success',
        severity: 'medium',
        afterData: {
          name: drug.name,
          batchNumber: drug.batchNumber,
          activeIngredient: drug.activeIngredient
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        requestMethod: 'POST',
        requestPath: '/api/drugs',
        timestamp: new Date(timestamp.getTime() - Math.random() * 3600000),
        correlationId: `drug-create-${drug._id}`
      });
      drugLogCount++;

      // Drug update (occasionally)
      if (Math.random() > 0.5) {
        auditLogs.push({
          user: user._id,
          username: user.username,
          userRole: user.role,
          action: 'drug_update',
          module: 'drug',
          entityType: 'Drug',
          entityId: drug._id,
          description: `Cập nhật thông tin lô thuốc: ${drug.name}`,
          result: 'success',
          severity: 'medium',
          beforeData: { status: 'active' },
          afterData: { status: 'active', qualityTest: drug.qualityTest },
          changedFields: [
            { field: 'qualityTest', oldValue: null, newValue: drug.qualityTest?.testResult }
          ],
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          requestMethod: 'PUT',
          requestPath: `/api/drugs/${drug._id}`,
          timestamp: new Date(timestamp.getTime() + Math.random() * 86400000),
          correlationId: `drug-update-${drug._id}`
        });
        drugLogCount++;
      }

      // Drug verify (QR scan)
      if (Math.random() > 0.6) {
        auditLogs.push({
          user: users[Math.floor(Math.random() * users.length)]._id,
          username: users[Math.floor(Math.random() * users.length)].username,
          userRole: 'patient',
          action: 'drug_verify',
          module: 'drug',
          entityType: 'Drug',
          entityId: drug._id,
          description: `Xác minh lô thuốc qua QR code: ${drug.batchNumber}`,
          result: 'success',
          severity: 'low',
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          requestMethod: 'GET',
          requestPath: `/api/drugs/verify/${drug.batchNumber}`,
          timestamp: new Date(timestamp.getTime() + Math.random() * 172800000),
          correlationId: `drug-verify-${drug._id}`
        });
        drugLogCount++;
      }
    }
    console.log(`  ✅ Đã tạo ${drugLogCount} drug management logs`);

    // ========== 3. SUPPLY CHAIN LOGS ==========
    console.log('📝 3. Tạo supply chain logs...');
    let supplyChainLogCount = 0;
    for (const supplyChain of supplyChains) {
      const user = users[Math.floor(Math.random() * users.length)];
      const daysAgo = Math.floor(Math.random() * 45);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Supply chain create
      auditLogs.push({
        user: user._id,
        username: user.username,
        userRole: user.role,
        action: 'supply_chain_create',
        module: 'supply_chain',
        entityType: 'SupplyChain',
        entityId: supplyChain._id,
        description: `Tạo chuỗi cung ứng cho lô: ${supplyChain.drugBatchNumber}`,
        result: 'success',
        severity: 'medium',
        afterData: {
          drugBatchNumber: supplyChain.drugBatchNumber,
          status: supplyChain.status,
          stepsCount: supplyChain.steps?.length || 0
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        requestMethod: 'POST',
        requestPath: '/api/supply-chains',
        timestamp: new Date(timestamp.getTime() - Math.random() * 3600000),
        correlationId: `sc-create-${supplyChain._id}`
      });
      supplyChainLogCount++;

      // Supply chain update (add step)
      if (supplyChain.steps && supplyChain.steps.length > 0 && Math.random() > 0.4) {
        auditLogs.push({
          user: user._id,
          username: user.username,
          userRole: user.role,
          action: 'supply_chain_update',
          module: 'supply_chain',
          entityType: 'SupplyChain',
          entityId: supplyChain._id,
          description: `Thêm bước mới vào chuỗi cung ứng: ${supplyChain.drugBatchNumber}`,
          result: 'success',
          severity: 'medium',
          beforeData: { stepsCount: supplyChain.steps.length - 1 },
          afterData: { stepsCount: supplyChain.steps.length },
          changedFields: [
            { field: 'steps', oldValue: supplyChain.steps.length - 1, newValue: supplyChain.steps.length }
          ],
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          requestMethod: 'POST',
          requestPath: `/api/supply-chains/${supplyChain._id}/steps`,
          timestamp: new Date(timestamp.getTime() + Math.random() * 86400000),
          correlationId: `sc-update-${supplyChain._id}`
        });
        supplyChainLogCount++;
      }

      // Status change
      if (Math.random() > 0.7) {
        const oldStatus = 'active';
        const newStatus = supplyChain.status;
        if (oldStatus !== newStatus) {
          auditLogs.push({
            user: user._id,
            username: user.username,
            userRole: user.role,
            action: 'supply_chain_status_change',
            module: 'supply_chain',
            entityType: 'SupplyChain',
            entityId: supplyChain._id,
            description: `Thay đổi trạng thái chuỗi cung ứng: ${oldStatus} → ${newStatus}`,
            result: 'success',
            severity: 'high',
            beforeData: { status: oldStatus },
            afterData: { status: newStatus },
            changedFields: [
              { field: 'status', oldValue: oldStatus, newValue: newStatus }
            ],
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            requestMethod: 'PUT',
            requestPath: `/api/supply-chains/${supplyChain._id}`,
            timestamp: new Date(timestamp.getTime() + Math.random() * 172800000),
            correlationId: `sc-status-${supplyChain._id}`
          });
          supplyChainLogCount++;
        }
      }
    }
    console.log(`  ✅ Đã tạo ${supplyChainLogCount} supply chain logs`);

    // ========== 4. DIGITAL SIGNATURE LOGS ==========
    console.log('📝 4. Tạo digital signature logs...');
    let signatureLogCount = 0;
    for (const signature of digitalSignatures) {
      const user = users[Math.floor(Math.random() * users.length)];
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Signature create
      auditLogs.push({
        user: user._id,
        username: user.username,
        userRole: user.role,
        action: 'signature_create',
        module: 'digital_signature',
        entityType: 'DigitalSignature',
        entityId: signature._id,
        description: `Tạo chữ ký số cho ${signature.targetType}: ${signature.targetId}`,
        result: 'success',
        severity: 'high',
        afterData: {
          targetType: signature.targetType,
          caProvider: signature.certificate?.caProvider,
          status: signature.status
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        requestMethod: 'POST',
        requestPath: '/api/digital-signatures',
        timestamp: new Date(timestamp.getTime() - Math.random() * 3600000),
        correlationId: `sig-create-${signature._id}`
      });
      signatureLogCount++;

      // Signature verify
      if (Math.random() > 0.5) {
        auditLogs.push({
          user: users[Math.floor(Math.random() * users.length)]._id,
          username: users[Math.floor(Math.random() * users.length)].username,
          userRole: 'patient',
          action: 'signature_verify',
          module: 'digital_signature',
          entityType: 'DigitalSignature',
          entityId: signature._id,
          description: `Xác thực chữ ký số: ${signature.targetType}`,
          result: signature.status === 'active' ? 'success' : 'failure',
          severity: 'medium',
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          requestMethod: 'GET',
          requestPath: `/api/digital-signatures/${signature._id}/verify`,
          timestamp: new Date(timestamp.getTime() + Math.random() * 86400000),
          correlationId: `sig-verify-${signature._id}`
        });
        signatureLogCount++;
      }
    }
    console.log(`  ✅ Đã tạo ${signatureLogCount} digital signature logs`);

    // ========== 5. REVIEW LOGS ==========
    console.log('📝 5. Tạo review logs...');
    let reviewLogCount = 0;
    for (const review of reviews) {
      const user = users.find(u => u._id.toString() === review.userId?.toString()) || users[0];
      const daysAgo = Math.floor(Math.random() * 20);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      auditLogs.push({
        user: user._id,
        username: user.username,
        userRole: user.role,
        action: 'review_create',
        module: 'review',
        entityType: 'Review',
        entityId: review._id,
        description: `Tạo đánh giá cho lô thuốc: ${review.drugId || 'N/A'}`,
        result: 'success',
        severity: 'low',
        afterData: {
          rating: review.rating,
          hasComment: !!review.comment
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        requestMethod: 'POST',
        requestPath: '/api/reviews',
        timestamp: new Date(timestamp.getTime() - Math.random() * 3600000),
        correlationId: `review-create-${review._id}`
      });
      reviewLogCount++;
    }
    console.log(`  ✅ Đã tạo ${reviewLogCount} review logs`);

    // ========== 6. TASK LOGS ==========
    console.log('📝 6. Tạo task logs...');
    let taskLogCount = 0;
    for (const task of tasks) {
      const user = users.find(u => u._id.toString() === task.assignedTo?.toString()) || users[0];
      const daysAgo = Math.floor(Math.random() * 15);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      // Task create
      auditLogs.push({
        user: user._id,
        username: user.username,
        userRole: user.role,
        action: 'task_create',
        module: 'task',
        entityType: 'Task',
        entityId: task._id,
        description: `Tạo nhiệm vụ: ${task.title}`,
        result: 'success',
        severity: 'low',
        afterData: {
          title: task.title,
          priority: task.priority,
          status: task.status
        },
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        requestMethod: 'POST',
        requestPath: '/api/tasks',
        timestamp: new Date(timestamp.getTime() - Math.random() * 3600000),
        correlationId: `task-create-${task._id}`
      });
      taskLogCount++;

      // Task complete
      if (task.status === 'completed' && Math.random() > 0.3) {
        auditLogs.push({
          user: user._id,
          username: user.username,
          userRole: user.role,
          action: 'task_complete',
          module: 'task',
          entityType: 'Task',
          entityId: task._id,
          description: `Hoàn thành nhiệm vụ: ${task.title}`,
          result: 'success',
          severity: 'low',
          beforeData: { status: 'pending' },
          afterData: { status: 'completed' },
          changedFields: [
            { field: 'status', oldValue: 'pending', newValue: 'completed' }
          ],
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          requestMethod: 'PUT',
          requestPath: `/api/tasks/${task._id}`,
          timestamp: new Date(timestamp.getTime() + Math.random() * 86400000),
          correlationId: `task-complete-${task._id}`
        });
        taskLogCount++;
      }
    }
    console.log(`  ✅ Đã tạo ${taskLogCount} task logs`);

    // ========== 7. USER MANAGEMENT LOGS ==========
    console.log('📝 7. Tạo user management logs...');
    let userLogCount = 0;
    const adminUsers = users.filter(u => u.role === 'admin');
    if (adminUsers.length > 0) {
      for (let i = 0; i < Math.min(10, users.length); i++) {
        const user = users[i];
        const admin = adminUsers[0];
        const daysAgo = Math.floor(Math.random() * 60);
        const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        // User create
        if (Math.random() > 0.5) {
          auditLogs.push({
            user: admin._id,
            username: admin.username,
            userRole: admin.role,
            action: 'user_create',
            module: 'user',
            entityType: 'User',
            entityId: user._id,
            description: `Tạo tài khoản mới: ${user.username} (${user.role})`,
            result: 'success',
            severity: 'high',
            afterData: {
              username: user.username,
              role: user.role,
              fullName: user.fullName
            },
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            requestMethod: 'POST',
            requestPath: '/api/users',
            timestamp: new Date(timestamp.getTime() - Math.random() * 3600000),
            correlationId: `user-create-${user._id}`
          });
          userLogCount++;
        }

        // User update
        if (Math.random() > 0.6) {
          auditLogs.push({
            user: admin._id,
            username: admin.username,
            userRole: admin.role,
            action: 'user_update',
            module: 'user',
            entityType: 'User',
            entityId: user._id,
            description: `Cập nhật thông tin tài khoản: ${user.username}`,
            result: 'success',
            severity: 'medium',
            beforeData: { isActive: true },
            afterData: { isActive: user.isActive },
            changedFields: [
              { field: 'isActive', oldValue: true, newValue: user.isActive }
            ],
            ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
            requestMethod: 'PUT',
            requestPath: `/api/users/${user._id}`,
            timestamp: new Date(timestamp.getTime() + Math.random() * 86400000),
            correlationId: `user-update-${user._id}`
          });
          userLogCount++;
        }
      }
    }
    console.log(`  ✅ Đã tạo ${userLogCount} user management logs`);

    // ========== 8. BLOCKCHAIN LOGS ==========
    console.log('📝 8. Tạo blockchain logs...');
    let blockchainLogCount = 0;
    for (const drug of drugs.slice(0, 10)) {
      if (drug.blockchain?.isOnBlockchain) {
        const user = users.find(u => u._id.toString() === drug.manufacturerId?.toString()) || users[0];
        const daysAgo = Math.floor(Math.random() * 60);
        const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

        auditLogs.push({
          user: user._id,
          username: user.username,
          userRole: user.role,
          action: 'blockchain_record',
          module: 'blockchain',
          entityType: 'Drug',
          entityId: drug._id,
          description: `Ghi dữ liệu lên blockchain: ${drug.batchNumber}`,
          result: 'success',
          severity: 'high',
          afterData: {
            blockchainId: drug.blockchain.blockchainId,
            transactionHash: drug.blockchain.transactionHash,
            blockNumber: drug.blockchain.blockNumber
          },
          ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
          requestMethod: 'POST',
          requestPath: '/api/drugs',
          timestamp: new Date(timestamp.getTime() - Math.random() * 3600000),
          correlationId: `blockchain-record-${drug._id}`
        });
        blockchainLogCount++;
      }
    }
    console.log(`  ✅ Đã tạo ${blockchainLogCount} blockchain logs`);

    // ========== 9. PASSWORD CHANGE LOGS ==========
    console.log('📝 9. Tạo password change logs...');
    let passwordLogCount = 0;
    for (let i = 0; i < Math.min(5, users.length); i++) {
      const user = users[i];
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      auditLogs.push({
        user: user._id,
        username: user.username,
        userRole: user.role,
        action: 'password_change',
        module: 'auth',
        description: `User ${user.username} đổi mật khẩu`,
        result: 'success',
        severity: 'medium',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        requestMethod: 'PUT',
        requestPath: '/api/auth/change-password',
        timestamp: new Date(timestamp.getTime() - Math.random() * 3600000),
        correlationId: `password-change-${user._id}`
      });
      passwordLogCount++;
    }
    console.log(`  ✅ Đã tạo ${passwordLogCount} password change logs`);

    // ========== 10. ACCESS DENIED LOGS ==========
    console.log('📝 10. Tạo access denied logs...');
    let accessDeniedCount = 0;
    for (let i = 0; i < 5; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const daysAgo = Math.floor(Math.random() * 20);
      const timestamp = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);

      auditLogs.push({
        user: user._id,
        username: user.username,
        userRole: user.role,
        action: 'access_denied',
        module: 'other',
        description: `Truy cập bị từ chối: ${user.username} cố gắng truy cập tài nguyên không có quyền`,
        result: 'failure',
        severity: 'high',
        errorMessage: 'Không có quyền truy cập',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        requestMethod: ['GET', 'POST', 'PUT', 'DELETE'][Math.floor(Math.random() * 4)],
        requestPath: ['/api/users', '/api/drugs', '/api/supply-chains'][Math.floor(Math.random() * 3)],
        timestamp: new Date(timestamp.getTime() - Math.random() * 3600000),
        correlationId: `access-denied-${Date.now()}-${i}`
      });
      accessDeniedCount++;
    }
    console.log(`  ✅ Đã tạo ${accessDeniedCount} access denied logs`);

    // ========== INSERT ALL LOGS ==========
    console.log(`\n💾 Đang lưu ${auditLogs.length} audit logs vào database...`);
    await AuditLog.insertMany(auditLogs);
    console.log(`  ✅ Đã lưu thành công!\n`);

    // ========== SUMMARY ==========
    console.log('=== TỔNG KẾT ===');
    console.log(`✅ Tổng số audit logs đã tạo: ${auditLogs.length}`);
    console.log(`  - Authentication: ${auditLogs.filter(l => l.module === 'auth').length}`);
    console.log(`  - Drug Management: ${auditLogs.filter(l => l.module === 'drug').length}`);
    console.log(`  - Supply Chain: ${auditLogs.filter(l => l.module === 'supply_chain').length}`);
    console.log(`  - Digital Signature: ${auditLogs.filter(l => l.module === 'digital_signature').length}`);
    console.log(`  - Review: ${auditLogs.filter(l => l.module === 'review').length}`);
    console.log(`  - Task: ${auditLogs.filter(l => l.module === 'task').length}`);
    console.log(`  - User Management: ${auditLogs.filter(l => l.module === 'user').length}`);
    console.log(`  - Blockchain: ${auditLogs.filter(l => l.module === 'blockchain').length}`);
    console.log(`  - Other: ${auditLogs.filter(l => l.module === 'other').length}`);
    console.log(`\n✅ Hoàn thành!\n`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi khi tạo audit logs:', error);
    process.exit(1);
  }
};

// Chạy script
seedAuditLogs();

