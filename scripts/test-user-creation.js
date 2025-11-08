const mongoose = require('mongoose');
const User = require('../models/User');

// Kết nối MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://127.0.0.1:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Test tạo user
const testUserCreation = async () => {
  try {
    console.log('Đang test tạo user...');

    const testUser = await User.create({
      username: 'test_manufacturer',
      email: 'test@example.com',
      password: 'default123',
      fullName: 'Test Manufacturer',
      phone: '0123456789',
      address: {
        street: '123 Test Street',
        ward: 'Test Ward',
        district: 'Test District',
        city: 'Test City'
      },
      role: 'manufacturer',
      organizationId: 'TEST_MFG_001',
      organizationInfo: {
        name: 'Test Company',
        license: 'TEST_LIC_001',
        type: 'pharmaceutical_company',
        description: 'Test description'
      },
      mustChangePassword: true
    });

    console.log('User created successfully:', testUser);
    
    // Xóa user test
    await User.deleteOne({ _id: testUser._id });
    console.log('Test user deleted');

  } catch (error) {
    console.error('Error creating user:', error);
  }
};

// Chạy test
const run = async () => {
  await connectDB();
  await testUserCreation();
  process.exit(0);
};

run();
