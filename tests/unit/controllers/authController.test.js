const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const User = require('../../../models/User');
const { login, register, getMe } = require('../../../controllers/authController');

// Tạo Express app cho testing
const app = express();
app.use(express.json());
app.post('/api/auth/login', login);
app.post('/api/auth/register', register);
app.get('/api/auth/me', getMe);

describe('Auth Controller - Unit Tests', () => {
  let testUser;
  let adminUser;

  beforeEach(async () => {
    // Tạo admin user cho testing
    adminUser = await User.create({
      username: 'admin',
      email: 'admin@test.com',
      password: 'Test123!@#',
      fullName: 'Admin Test',
      role: 'admin',
      organizationId: 'ADMIN_ORG',
      mustChangePassword: false
    });

    // Tạo test user
    testUser = await User.create({
      username: 'testuser',
      email: 'test@test.com',
      password: 'Test123!@#',
      fullName: 'Test User',
      role: 'manufacturer',
      organizationId: 'ORG001',
      mustChangePassword: false
    });
  });

  afterEach(async () => {
    await User.deleteMany({});
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'testuser',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user.username).toBe('testuser');
    });

    it('should login with email as identifier', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'test@test.com',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('should fail with invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'testuser',
          password: 'WrongPassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message.toLowerCase()).toMatch(/mật khẩu|password/i);
    });

    it('should fail with missing credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'testuser'
          // Missing password
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          identifier: 'nonexistent',
          password: 'Test123!@#'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully (Admin only)', async () => {
      // Mock req.user for admin
      const originalRegister = require('../../../controllers/authController').register;
      
      // Dùng unique identifier để tránh conflict (chỉ chữ cái và số)
      const uniqueId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const mockReq = {
        body: {
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
          patientId: undefined // Đảm bảo không conflict với patientId
        },
        user: { _id: adminUser._id, role: 'admin' }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      await originalRegister(mockReq, mockRes);

      // Debug: In ra response nếu test fail
      if (mockRes.status.mock.calls.length > 0 && mockRes.status.mock.calls[0][0] !== 201) {
        console.log('Response status:', mockRes.status.mock.calls[0][0]);
        console.log('Response body:', mockRes.json.mock.calls[0] ? mockRes.json.mock.calls[0][0] : 'No body');
      }

      // Kiểm tra response
      const statusCall = mockRes.status.mock.calls[0];
      const jsonCall = mockRes.json.mock.calls[0];
      
      if (statusCall && statusCall[0] !== 201) {
        console.log('Unexpected status:', statusCall[0]);
        console.log('Response:', jsonCall ? jsonCall[0] : 'No response');
      }
      
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Tạo tài khoản thành công.'
        })
      );
    });

    it('should fail to register duplicate username', async () => {
      const mockReq = {
        body: {
          username: 'testuser', // Already exists
          email: 'newemail@test.com',
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
          organizationId: 'ORG_NEW'
        },
        user: { _id: adminUser._id, role: 'admin' }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const originalRegister = require('../../../controllers/authController').register;
      await originalRegister(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining('đã tồn tại')
        })
      );
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user info', async () => {
      const token = testUser.generateAuthToken();
      
      const mockReq = {
        user: { _id: testUser._id }
      };

      const mockRes = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };

      const originalGetMe = require('../../../controllers/authController').getMe;
      await originalGetMe(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            user: expect.objectContaining({
              username: 'testuser',
              email: 'test@test.com'
            })
          })
        })
      );
    });
  });
});

