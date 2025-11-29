const jwt = require('jsonwebtoken');
const User = require('../../../models/User');
const { authenticate: auth } = require('../../../middleware/auth');

describe('Auth Middleware - Unit Tests', () => {
  let testUser;
  let mockReq;
  let mockRes;
  let mockNext;

  beforeEach(async () => {
    testUser = await User.create({
      username: 'testuser',
      email: 'test@test.com',
      password: 'Test123!@#',
      fullName: 'Test User',
      role: 'manufacturer',
      organizationId: 'ORG001',
      mustChangePassword: false
    });

    mockReq = {
      headers: {},
      body: {}
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };

    mockNext = jest.fn();
  });

  afterEach(async () => {
    await User.deleteMany({});
    jest.clearAllMocks();
  });

  describe('Token Authentication', () => {
    it('should authenticate user with valid token', async () => {
      const token = testUser.generateAuthToken();
      mockReq.headers.authorization = `Bearer ${token}`;

      await auth(mockReq, mockRes, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockReq.user).toBeDefined();
      expect(mockReq.user._id.toString()).toBe(testUser._id.toString());
    });

    it('should reject request without token', async () => {
      await auth(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringMatching(/token|unauthorized/i)
        })
      );
    });

    it('should reject request with invalid token', async () => {
      mockReq.headers.authorization = 'Bearer invalid-token';

      await auth(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject request with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: testUser._id.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '-1h' } // Expired
      );

      mockReq.headers.authorization = `Bearer ${expiredToken}`;

      await auth(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });

    it('should reject request if user not found', async () => {
      const mongoose = require('mongoose');
      const fakeUserId = new mongoose.Types.ObjectId();
      const token = jwt.sign(
        { userId: fakeUserId.toString() },
        process.env.JWT_SECRET || 'test-secret',
        { expiresIn: '1h' }
      );

      mockReq.headers.authorization = `Bearer ${token}`;

      await auth(mockReq, mockRes, mockNext);

      expect(mockNext).not.toHaveBeenCalled();
      expect(mockRes.status).toHaveBeenCalledWith(401);
    });
  });
});

