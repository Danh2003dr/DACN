const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const User = require('../../models/User');

// Tạo Express app riêng cho testing để tránh conflict với server.js
const app = express();
app.use(express.json());

// Mock authentication middleware cho testing
const { authenticate, authorize } = require('../../middleware/auth');
const authController = require('../../controllers/authController');
const { validate, registerSchema } = require('../../utils/validation');

// Setup routes với mock middleware
app.post('/api/auth/login', authController.login);
app.post('/api/auth/register', async (req, res, next) => {
  // Mock req.user từ token
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ success: false, message: 'Unauthorized: No token' });
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only');
    
    // Debug: Log decoded token
    console.log('Decoded token:', decoded);
    
    // Tìm user từ database để có đầy đủ thông tin
    // User.findById tự động xử lý string hoặc ObjectId
    const user = await User.findById(decoded.id);
    
    if (!user) {
      console.log('User not found with id:', decoded.id);
      return res.status(401).json({ success: false, message: 'Unauthorized: User not found' });
    }
    
    if (!user.isActive) {
      return res.status(401).json({ success: false, message: 'Unauthorized: User inactive' });
    }
    
    // Kiểm tra role admin
    if (user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Forbidden: Not admin' });
    }
    
    req.user = user;
    next();
  } catch (e) {
    console.error('Auth middleware error:', e.message);
    return res.status(401).json({ success: false, message: 'Unauthorized: ' + e.message });
  }
}, validate(registerSchema), authController.register);
app.get('/api/auth/me', async (req, res, next) => {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-only');
      // Tìm user từ database để có đầy đủ thông tin
      // User.findById tự động xử lý string hoặc ObjectId
      const user = await User.findById(decoded.id);
      if (!user || !user.isActive) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }
      req.user = user;
    } catch (e) {
      return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
  } else {
    return res.status(401).json({ success: false, message: 'Unauthorized' });
  }
  next();
}, authController.getMe);

describe('Auth API - Integration Tests', () => {
  let adminToken;
  let testUser;

  beforeAll(async () => {
    // Tạo admin user
    const admin = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'Test123!@#',
      fullName: 'Admin User',
      role: 'admin',
      organizationId: 'ADMIN_ORG',
      mustChangePassword: false,
      isActive: true
    });
    adminToken = admin.generateAuthToken();
  });

  beforeEach(async () => {
    // Cleanup trước mỗi test - giữ lại admin user
    await User.deleteMany({ username: { $ne: 'admin' } });
    
    // Đảm bảo admin user tồn tại
    let admin = await User.findOne({ username: 'admin' });
    if (!admin) {
      admin = await User.create({
        username: 'admin',
        email: 'admin@test.com',
        password: 'Test123!@#',
        fullName: 'Admin User',
        role: 'admin',
        organizationId: 'ADMIN_ORG',
        mustChangePassword: false,
        isActive: true
      });
      adminToken = admin.generateAuthToken();
    }
  });

  afterAll(async () => {
    await User.deleteMany({});
    await mongoose.connection.close();
  });

  describe('POST /api/auth/login', () => {
    it('should login and return token', async () => {
      // Tạo user để test login
      testUser = await User.create({
        username: 'testuser',
        email: 'test@test.com',
        password: 'Test123!@#',
        fullName: 'Test User',
        role: 'manufacturer',
        organizationId: 'ORG001',
        mustChangePassword: false
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'testuser',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).toHaveProperty('username', 'testuser');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should fail with wrong password', async () => {
      testUser = await User.create({
        username: 'testuser2',
        email: 'test2@test.com',
        password: 'Test123!@#',
        fullName: 'Test User 2',
        role: 'manufacturer',
        organizationId: 'ORG002'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'testuser2',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user (Admin only)', async () => {
      // Đảm bảo admin user tồn tại và có token
      let admin = await User.findOne({ username: 'admin' });
      if (!admin) {
        admin = await User.create({
          username: 'admin',
          email: 'admin@test.com',
          password: 'Test123!@#',
          fullName: 'Admin User',
          role: 'admin',
          organizationId: 'ADMIN_ORG',
          mustChangePassword: false,
          isActive: true
        });
        adminToken = admin.generateAuthToken();
      }
      
      // Dùng unique identifier để tránh conflict (chỉ chữ cái và số)
      const uniqueId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const response = await request(app)
        .post('/api/auth/register')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: `newuser${uniqueId}`,
          email: `newuser${uniqueId}@test.com`,
          password: 'Test123!@#',
          fullName: 'New User',
          phone: '0123456789',
          address: {
            street: '123 Test Street',
            ward: 'Test Ward',
            district: 'Test District',
            city: 'Test City'
          },
          role: 'distributor',
          organizationId: `ORG_NEW_${uniqueId}`,
          patientId: undefined // Đảm bảo không conflict
        });

      if (response.status !== 201) {
        console.log('Response status:', response.status);
        console.log('Response body:', response.body);
      }

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user).toHaveProperty('username', `newuser${uniqueId}`);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should fail without admin token', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser2',
          email: 'newuser2@test.com',
          password: 'Test123!@#',
          fullName: 'New User 2',
          phone: '0123456789',
          address: {
            street: '123 Test Street',
            ward: 'Test Ward',
            district: 'Test District',
            city: 'Test City'
          },
          role: 'distributor',
          organizationId: 'ORG_NEW2'
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user info with valid token', async () => {
      testUser = await User.create({
        username: 'testuser3',
        email: 'test3@test.com',
        password: 'Test123!@#',
        fullName: 'Test User 3',
        role: 'hospital',
        organizationId: 'ORG003'
      });
      const token = testUser.generateAuthToken();

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.username).toBe('testuser3');
    });

    it('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/me');

      expect(response.status).toBe(401);
    });
  });
});

