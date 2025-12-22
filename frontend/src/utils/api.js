import axios from 'axios';
import toast from 'react-hot-toast';
import logger from './logger';

// Tạo axios instance
// Tự động detect API URL: ưu tiên REACT_APP_API_URL, nếu không có thì dùng IP hiện tại hoặc localhost
const getApiUrl = () => {
  // Nếu có REACT_APP_API_URL trong env, dùng nó
  if (process.env.REACT_APP_API_URL) {
    console.log('Using REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
    return process.env.REACT_APP_API_URL;
  }
  
  // Nếu đang chạy trên network (không phải localhost), dùng hostname hiện tại
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '5000'; // Backend port
    const apiUrl = `${protocol}//${hostname}:${port}/api`;
    console.log('Using network API URL:', apiUrl);
    return apiUrl;
  }
  
  // Mặc định là localhost
  const defaultUrl = 'http://localhost:5000/api';
  console.log('Using default API URL:', defaultUrl);
  return defaultUrl;
};

const apiUrl = getApiUrl();
console.log('🔗 API Base URL:', apiUrl);

const api = axios.create({
  baseURL: apiUrl,
  timeout: 60000, // Tăng timeout lên 60s để tránh timeout khi backend chậm (đặc biệt cho blockchain)
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor để thêm token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor để xử lý lỗi
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Log error để debug
    if (error.code === 'ECONNABORTED') {
      console.error('⏱️ Request timeout:', error.config?.url);
    } else if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
      console.error('🌐 Network error:', {
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        message: error.message
      });
      console.error('💡 Kiểm tra:');
      console.error('   1. Backend có đang chạy không? (http://localhost:5000/api/health)');
      console.error('   2. CORS có được cấu hình đúng không?');
      console.error('   3. Firewall có chặn kết nối không?');
    } else if (error.response) {
      console.error('📡 API Error:', {
        status: error.response.status,
        url: error.config?.url,
        message: error.response.data?.message
      });
    } else {
      console.error('❌ Request error:', error);
    }

    // Cho phép bỏ qua xử lý lỗi toàn cục cho một số request (ví dụ: quét QR, empty data)
    if (error.config && error.config.skipErrorHandler) {
      return Promise.reject(error);
    }

    const { response, config } = error;
    
    if (response) {
      const { status, data } = response;
      const message = data?.message;
      const code = data?.code;
      const details = data?.details || data?.errors;

      switch (status) {
        case 401:
          // Token hết hạn hoặc không hợp lệ
          // Chỉ redirect nếu không phải đang ở trang login
          if (window.location.pathname !== '/login') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            // Delay một chút để toast hiển thị
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
            toast.error(message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.', {
              duration: 3000
            });
          }
          break;
        case 500:
          // Chỉ hiển thị toast cho lỗi 500 nếu không có skipErrorHandler
          if (config.skipErrorHandler) {
            // Không hiển thị toast, chỉ log
            console.warn('Server error (suppressed toast):', message || 'Lỗi server');
          } else {
            toast.error(message || 'Lỗi server. Vui lòng thử lại sau.');
          }
          break;

        case 403:
          toast.error(message || 'Bạn không có quyền truy cập tài nguyên này.');
          break;

        case 404:
          // Chỉ hiển thị toast cho 404 nếu:
          // 1. Không phải GET request (POST/PUT/DELETE 404 là lỗi thực sự)
          // 2. Hoặc có message cụ thể từ server (không phải empty data)
          const isGetRequest = !config.method || config.method.toLowerCase() === 'get';
          const hasSpecificMessage = message && message !== 'Không tìm thấy dữ liệu.' && message !== 'Not found';
          
          if (!isGetRequest || hasSpecificMessage) {
            toast.error(message || 'Không tìm thấy dữ liệu.');
          }
          // Nếu là GET request và không có message cụ thể, coi như empty data hợp lệ, không hiển thị toast
          break;

        case 400:
        case 422:
          // Validation / bad request errors
          if (Array.isArray(details)) {
            details.forEach(errMsg => toast.error(errMsg));
          } else {
            toast.error(message || 'Dữ liệu không hợp lệ.');
          }
          break;

        case 500:
        case 502:
        case 503:
        case 504:
          // Lỗi hệ thống / network phía server
          // Nếu là GET request với skipErrorHandler, không hiển thị toast
          if (config.method === 'get' && config.skipErrorHandler) {
            console.warn('Server error (suppressed toast):', message || 'Lỗi server');
          } else {
            toast.error(message || 'Hệ thống đang bận hoặc gặp sự cố. Vui lòng thử lại sau.');
          }
          break;

        default:
          // Một số lỗi đặc thù (dựa trên code) có thể xử lý riêng nếu cần
          if (code === 'BLOCKCHAIN_ERROR' || code === 'HSM_ERROR' || code === 'CACHE_ERROR') {
            toast.error(message || 'Dịch vụ nền tảng đang gặp sự cố. Hệ thống sẽ tự động chuyển sang chế độ an toàn.');
          } else if (status >= 500) {
            toast.error(message || 'Có lỗi xảy ra. Vui lòng thử lại.');
          }
          // Không hiển thị toast cho các lỗi khác (như 404 GET đã xử lý ở trên)
      }
    } else {
      // Network error - không kết nối được đến server
      toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng hoặc thử lại sau.', {
        id: 'network-error' // Dùng id để tránh duplicate toasts
      });
    }
    
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  // Đăng nhập
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },
  
  // Đăng ký
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },
  
  // Đăng ký công khai (Public Registration)
  publicRegister: async (userData) => {
    const response = await api.post('/auth/register/public', userData);
    return response.data;
  },
  
  // Đổi mật khẩu
  changePassword: async (passwordData) => {
    const response = await api.put('/auth/change-password', passwordData);
    return response.data;
  },
  
  // Đổi mật khẩu lần đầu
  firstChangePassword: async (passwordData) => {
    const response = await api.put('/auth/first-change-password', passwordData);
    return response.data;
  },
  
  // Lấy thông tin user hiện tại
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
  
  // Cập nhật profile
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/update-profile', profileData);
    return response.data;
  },

  // Upload avatar
  uploadAvatar: async (avatarFile) => {
    const formData = new FormData();
    formData.append('avatar', avatarFile, 'avatar.jpg');
    
    console.log('FormData:', formData);
    console.log('Avatar file:', avatarFile);
    
    const response = await api.post('/auth/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Đăng xuất
  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },
  
  // Tạo tài khoản mặc định
  createDefaultAccounts: async () => {
    const response = await api.post('/auth/create-default-accounts');
    return response.data;
  },
  
  // Đăng nhập bằng Google (Passport.js - redirect)
  loginWithGoogle: () => {
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    window.location.href = `${backendUrl}/auth/google`;
  },
  
  // Đăng nhập bằng Firebase Google
  loginWithFirebase: async (idToken) => {
    try {
      const response = await api.post('/auth/firebase', { idToken });
      return response.data;
    } catch (error) {
      // Re-throw để component có thể handle
      throw error;
    }
  },
};

// User API
export const userAPI = {
  // Lấy danh sách users
  getUsers: async (params = {}) => {
    const response = await api.get('/users', { params });
    return response.data;
  },
  
  // Lấy thông tin user theo ID
  getUserById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  
  // Cập nhật user
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  
  // Xóa user
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  
  // Khóa/mở khóa user
  toggleUserLock: async (id) => {
    const response = await api.put(`/users/${id}/toggle-lock`);
    return response.data;
  },
  
  // Reset mật khẩu user
  resetUserPassword: async (id, passwordData) => {
    const response = await api.put(`/users/${id}/reset-password`, passwordData);
    return response.data;
  },
  
  // Lấy thống kê users
  getUserStats: async () => {
    const response = await api.get('/users/stats');
    return response.data;
  },
  
  // Lấy users theo tổ chức
  getUsersByOrganization: async (organizationId) => {
    const response = await api.get(`/users/organization/${organizationId}`);
    return response.data;
  },
  
  // Kiểm tra credit status (creditLimit, currentDebt, availableCredit)
  // Thông tin này được trả về trong user object, nhưng có thể tạo endpoint riêng nếu cần
  checkCreditStatus: async (userId = null) => {
    // Nếu không có userId, lấy thông tin user hiện tại từ profile
    if (!userId) {
      const response = await api.get('/auth/me'); // Hoặc endpoint profile
      if (response.data.success && response.data.data.user) {
        const user = response.data.data.user;
        return {
          success: true,
          data: {
            creditLimit: user.creditLimit || 0,
            currentDebt: user.currentDebt || 0,
            availableCredit: (user.creditLimit || 0) - (user.currentDebt || 0),
            canUseCredit: user.creditLimit > 0 && user.currentDebt < user.creditLimit
          }
        };
      }
      throw new Error('Không thể lấy thông tin credit');
    }
    // Nếu có userId, lấy thông tin user đó
    const response = await api.get(`/users/${userId}`);
    if (response.data.success && response.data.data.user) {
      const user = response.data.data.user;
      return {
        success: true,
        data: {
          creditLimit: user.creditLimit || 0,
          currentDebt: user.currentDebt || 0,
          availableCredit: (user.creditLimit || 0) - (user.currentDebt || 0),
          canUseCredit: user.creditLimit > 0 && user.currentDebt < user.creditLimit
        }
      };
    }
    throw new Error('Không thể lấy thông tin credit');
  },
};

// Drug API
export const drugAPI = {
  // Lấy danh sách drugs
  getDrugs: async (params = {}) => {
    const response = await api.get('/drugs', { params });
    return response.data;
  },
  
  // Lấy thông tin drug theo ID
  getDrugById: async (id) => {
    const response = await api.get(`/drugs/${id}`);
    return response.data;
  },
  
  // Tạo drug mới
  createDrug: async (drugData) => {
    const response = await api.post('/drugs', drugData);
    return response.data;
  },
  
  // Cập nhật drug
  updateDrug: async (id, drugData) => {
    const response = await api.put(`/drugs/${id}`, drugData);
    return response.data;
  },
  
  // Xóa drug
  deleteDrug: async (id) => {
    const response = await api.delete(`/drugs/${id}`);
    return response.data;
  },
  
  // Scan QR code
  scanQRCode: async (qrData) => {
    // skipErrorHandler: để QRScanner tự xử lý message chi tiết,
    // tránh hiện toast lỗi 2 lần và giữ nguyên message từ backend
    const response = await api.post(
      '/drugs/scan-qr',
      { qrData },
      { skipErrorHandler: true }
    );
    return response.data;
  },
  
  // Lấy server URL để tạo QR code
  getServerUrl: async () => {
    const response = await api.get('/drugs/server-url');
    return response.data;
  },
  
  // Recall drug
  recallDrug: async (id, recallData) => {
    const response = await api.put(`/drugs/${id}/recall`, recallData);
    return response.data;
  },
  
  // Update distribution status
  updateDistributionStatus: async (id, statusData) => {
    const response = await api.put(`/drugs/${id}/distribution-status`, statusData);
    return response.data;
  },
  
  // Lấy thống kê drugs
  getDrugStats: async () => {
    const response = await api.get('/drugs/stats');
    return response.data;
  },
  
  // Verify QR code (public)
  verifyQRCode: async (blockchainId) => {
    const response = await api.get(`/drugs/verify/${blockchainId}`);
    return response.data;
  },
  
  // Generate QR code cho drug
  generateQRCode: async (id) => {
    const response = await api.post(`/drugs/${id}/generate-qr`);
    return response.data;
  },
};

// Settings API
export const settingsAPI = {
  // Lấy cài đặt hệ thống
  getSettings: async () => {
    const response = await api.get('/settings');
    return response.data;
  },
  
  // Cập nhật cài đặt
  updateSettings: async (settingsData) => {
    const response = await api.put('/settings', settingsData);
    return response.data;
  },
  
  // Lấy thông tin hệ thống
  getSystemInfo: async () => {
    const response = await api.get('/settings/system-info');
    return response.data;
  },
  
  // Lấy trạng thái blockchain
  getBlockchainStatus: async () => {
    const response = await api.get('/settings/blockchain-status');
    return response.data;
  },
  
  // Test kết nối blockchain
  testBlockchainConnection: async () => {
    const response = await api.post('/settings/test-blockchain');
    return response.data;
  },
  
  // Reset về mặc định
  resetToDefaults: async () => {
    const response = await api.post('/settings/reset');
    return response.data;
  }
};

// Supply Chain API
export const supplyChainAPI = {
  // Get supply chains
  getSupplyChains: async (params = '') => {
    const response = await api.get(`/supply-chain?${params}`);
    return response.data;
  },

  // Get supply chain by ID
  getSupplyChain: async (id) => {
    // Đảm bảo id là string
    const supplyChainId = typeof id === 'object' && id?.toString ? id.toString() : String(id);
    const response = await api.get(`/supply-chain/${supplyChainId}`);
    return response.data;
  },

  // Create supply chain
  createSupplyChain: async (data) => {
    const response = await api.post('/supply-chain', data);
    return response.data;
  },

  // Add step to supply chain
  addStep: async (id, data) => {
    const response = await api.post(`/supply-chain/${id}/steps`, data);
    return response.data;
  },

  // Recall supply chain
  recallSupplyChain: async (id, data) => {
    const response = await api.post(`/supply-chain/${id}/recall`, data);
    return response.data;
  },

  // Get supply chain by QR
  getByQR: async (batchNumber) => {
    const response = await api.get(`/supply-chain/qr/${batchNumber}`);
    return response.data;
  },

  // Get supply chain map data
  getMapData: async (params = '') => {
    const url = params ? `/supply-chain/map/data?${params}` : '/supply-chain/map/data';
    const response = await api.get(url);
    return response.data;
  },

  // Bulk delete supply chains
  bulkDelete: async (ids) => {
    const response = await api.post('/supply-chain/bulk-delete', { ids });
    return response.data;
  },

  // Export supply chains
  export: async (params = '', format = 'csv') => {
    // Params đã bao gồm format, không cần thêm
    const url = params ? `/supply-chain/export?${params}` : `/supply-chain/export?format=${format}`;
    const response = await api.get(url, {
      responseType: 'blob'
    });
    return response.data;
  }
};

// Task API
export const taskAPI = {
  // Get tasks
  getTasks: async (params = '') => {
    const response = await api.get(`/tasks?${params}`);
    return response.data;
  },

  // Get task by ID
  getTask: async (id) => {
    const response = await api.get(`/tasks/${id}`);
    return response.data;
  },

  // Create task
  createTask: async (data) => {
    const response = await api.post('/tasks', data);
    return response.data;
  },

  // Update task
  updateTask: async (id, data) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  // Add task update
  addUpdate: async (id, data) => {
    const response = await api.post(`/tasks/${id}/updates`, data);
    return response.data;
  },

  // Rate task
  rateTask: async (id, data) => {
    const response = await api.post(`/tasks/${id}/rate`, data);
    return response.data;
  },

  // Delete task
  deleteTask: async (id) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },

  // Get task stats
  getStats: async () => {
    const response = await api.get('/tasks/stats');
    return response.data;
  }
};

// Notification API
export const notificationAPI = {
  // Get notifications
  getNotifications: async (params = '') => {
    const response = await api.get(`/notifications?${params}`);
    return response.data;
  },

  // Get notification by ID
  getNotification: async (id) => {
    const response = await api.get(`/notifications/${id}`);
    return response.data;
  },

  // Create notification
  createNotification: async (data) => {
    const response = await api.post('/notifications', data);
    return response.data;
  },

  // Send system notification
  sendSystemNotification: async (data) => {
    const response = await api.post('/notifications/system', data);
    return response.data;
  },

  // Update notification
  updateNotification: async (id, data) => {
    const response = await api.put(`/notifications/${id}`, data);
    return response.data;
  },

  // Delete notification
  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },

  // Mark as read
  markAsRead: async (id) => {
    const response = await api.put(`/notifications/${id}/read`);
    return response.data;
  },

  // Mark as unread
  markAsUnread: async (id) => {
    const response = await api.put(`/notifications/${id}/unread`);
    return response.data;
  },

  // Mark all as read
  markAllAsRead: async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
  },

  // Get notification stats
  getStats: async () => {
    const response = await api.get('/notifications/stats');
    return response.data;
  },

  // Get sent notifications
  getSentNotifications: async (params = '') => {
    const response = await api.get(`/notifications/sent?${params}`);
    return response.data;
  }
};

// Review API
export const digitalSignatureAPI = {
  // Ký số cho một đối tượng
  signDocument: async (data) => {
    const response = await api.post('/digital-signatures/sign', data);
    return response.data;
  },
  
  // Xác thực chữ ký số
  verifySignature: (data) => api.post('/digital-signatures/verify', data),
  
  // Lấy danh sách chữ ký số
  getSignatures: async (params) => {
    const response = await api.get('/digital-signatures', { params });
    return response.data;
  },
  
  // Lấy chi tiết chữ ký số
  getSignatureById: (id) => api.get(`/digital-signatures/${id}`),
  
  // Lấy chữ ký số của một đối tượng
  getSignaturesByTarget: (targetType, targetId) => 
    api.get(`/digital-signatures/target/${targetType}/${targetId}`),
  
  // Thu hồi chữ ký số
  revokeSignature: (id, reason) => 
    api.post(`/digital-signatures/${id}/revoke`, { reason }),
  
  // Thống kê chữ ký số
  getStats: async (params) => {
    const response = await api.get('/digital-signatures/stats', { params });
    return response.data;
  }
};

export const reviewAPI = {
  // Create review
  createReview: async (data) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  // Get my reviews (authenticated)
  getMyReviews: async (params = '') => {
    const response = await api.get(`/reviews/my?${params}`);
    return response.data;
  },

  // Get reviews by target
  getReviewsByTarget: async (targetType, targetId, params = '') => {
    const response = await api.get(`/reviews/target/${targetType}/${targetId}?${params}`);
    return response.data;
  },

  // Get review stats
  getReviewStats: async (targetType, targetId) => {
    const response = await api.get(`/reviews/stats/${targetType}/${targetId}`);
    return response.data;
  },

  // Get review by ID
  getReview: async (id) => {
    const response = await api.get(`/reviews/${id}`);
    return response.data;
  },

  // Vote helpful
  voteHelpful: async (id) => {
    const response = await api.post(`/reviews/${id}/vote/helpful`);
    return response.data;
  },

  // Vote not helpful
  voteNotHelpful: async (id) => {
    const response = await api.post(`/reviews/${id}/vote/not-helpful`);
    return response.data;
  },

  // Add response
  addResponse: async (id, data) => {
    const response = await api.post(`/reviews/${id}/response`, data);
    return response.data;
  },

  // Report review
  reportReview: async (id, data) => {
    const response = await api.post(`/reviews/${id}/report`, data);
    return response.data;
  },

  // Admin: update a report status on a review
  updateReviewReportStatus: async (reviewId, reportId, data) => {
    const response = await api.put(`/reviews/${reviewId}/reports/${reportId}`, data);
    return response.data;
  },

  // Get top rated targets
  getTopRatedTargets: async (targetType, limit = 10) => {
    const response = await api.get(`/reviews/top-rated/${targetType}?limit=${limit}`);
    return response.data;
  },

  // Get reviews for admin
  getReviewsForAdmin: async (params = '') => {
    const response = await api.get(`/reviews/admin/list?${params}`);
    return response.data;
  },

  // Update review status
  updateReviewStatus: async (id, data) => {
    const response = await api.put(`/reviews/${id}/status`, data);
    return response.data;
  },

  // Delete review
  deleteReview: async (id) => {
    const response = await api.delete(`/reviews/${id}`);
    return response.data;
  }
};

// Reports API
export const reportAPI = {
  // Get system overview
  getSystemOverview: async () => {
    const response = await api.get('/reports/overview');
    return response.data;
  },

  // Get dashboard summary
  getDashboardSummary: async () => {
    const response = await api.get('/reports/dashboard', {
      skipErrorHandler: true // Bỏ qua error handler để tránh toast cho empty data
    });
    return response.data;
  },

  // Get module stats
  getModuleStats: async (module, params = {}) => {
    const response = await api.get(`/reports/module/${module}`, { params });
    return response.data;
  },

  // Get distribution journey report
  getDistributionJourneyReport: async (params = {}) => {
    const response = await api.get('/reports/distribution-journey', { params });
    return response.data;
  },

  // Get suspicious drugs report
  getSuspiciousDrugsReport: async () => {
    const response = await api.get('/reports/suspicious-drugs');
    return response.data;
  },

  // Get quality assessment report
  getQualityAssessmentReport: async (params = {}) => {
    const response = await api.get('/reports/quality-assessment', { params });
    return response.data;
  },

  // QR scan stats & high risk drugs
  getQRScanStats: async (params = {}) => {
    const response = await api.get('/reports/module/qr-scans', { 
      params,
      skipErrorHandler: true // Không hiển thị toast tự động, để component tự xử lý
    });
    return response.data;
  },

  // Get high risk drugs (AI-based)
  getRiskyDrugsReport: async (params = {}) => {
    const response = await api.get('/reports/risky-drugs', { 
      params,
      skipErrorHandler: true // Không hiển thị toast tự động, để component tự xử lý
    });
    return response.data;
  },

  exportModuleReport: async (module, params = {}, format = 'excel') => {
    const endpoint = format === 'pdf' ? '/reports/export/pdf' : '/reports/export/excel';
    const response = await api.get(endpoint, {
      params: {
        module,
        ...params
      },
      responseType: 'blob'
    });
    return response;
  },

  // Get KPIs
  getKPIs: async (params = {}) => {
    const response = await api.get('/reports/kpi', { params });
    return response.data;
  },

  // Get KPI time series
  getKPITimeSeries: async (kpiType, days = 30) => {
    const response = await api.get('/reports/kpi/timeseries', {
      params: { kpiType, days }
    });
    return response.data;
  },

  // Get real-time alerts
  getAlerts: async () => {
    const response = await api.get('/reports/alerts');
    return response.data;
  },

  // Mark alert as read
  markAlertAsRead: async (alertId) => {
    const response = await api.post(`/reports/alerts/${alertId}/read`);
    return response.data;
  },

  // Export custom report
  exportCustomReport: async (data) => {
    const response = await api.post('/reports/export/custom', data, {
      responseType: 'blob'
    });
    return response;
  }
};

// Trust Scores API
export const trustScoreAPI = {
  // Get trust score for a supplier
  getTrustScore: async (supplierId) => {
    const response = await api.get(`/trust-scores/${supplierId}`);
    return response.data;
  },

  // Get ranking
  getRanking: async (params = {}) => {
    const response = await api.get('/trust-scores/ranking', { params });
    return response.data;
  },

  // Get stats
  getStats: async () => {
    const response = await api.get('/trust-scores/stats', {
      skipErrorHandler: true // Không hiển thị toast tự động, để component tự xử lý
    });
    return response.data;
  },

  // Get score history
  getScoreHistory: async (supplierId, params = {}) => {
    const response = await api.get(`/trust-scores/${supplierId}/history`, { params });
    return response.data;
  },

  // Recalculate trust score (Admin only)
  recalculateTrustScore: async (supplierId) => {
    const response = await api.post(`/trust-scores/${supplierId}/recalculate`);
    return response.data;
  },

  // Add reward or penalty (Admin only)
  addRewardOrPenalty: async (supplierId, data) => {
    const response = await api.post(`/trust-scores/${supplierId}/reward-penalty`, data);
    return response.data;
  },

  // Recalculate all trust scores (Admin only)
  recalculateAll: async () => {
    const response = await api.post('/trust-scores/recalculate-all');
    return response.data;
  }
};

// Audit Logs API
export const auditLogAPI = {
  // Get audit logs
  getAuditLogs: async (params = {}) => {
    const response = await api.get('/audit-logs', { 
      params,
      skipErrorHandler: true // Bỏ qua error handler để tránh toast cho empty data
    });
    return response.data;
  },

  // Get audit log by ID
  getAuditLogById: async (id) => {
    const response = await api.get(`/audit-logs/${id}`);
    return response.data;
  },

  // Get entity history
  getEntityHistory: async (entityType, entityId) => {
    const response = await api.get(`/audit-logs/entity/${entityType}/${entityId}`);
    return response.data;
  },

  // Get audit stats
  getAuditStats: async (params = {}) => {
    const response = await api.get('/audit-logs/stats', { 
      params,
      skipErrorHandler: true // Bỏ qua error handler để tránh toast cho empty data
    });
    return response.data;
  },

  // Alias for getAuditStats (for consistency with other APIs)
  getStats: async (params = {}) => {
    const response = await api.get('/audit-logs/stats', { 
      params,
      skipErrorHandler: true // Bỏ qua error handler để tránh toast cho empty data
    });
    return response.data;
  },

  // Export audit logs
  exportAuditLogs: async (params = {}) => {
    const response = await api.get('/audit-logs/export', { params, responseType: 'blob' });
    return response;
  }
};

// Backups API
export const backupAPI = {
  // Get backups
  getBackups: async (params = {}) => {
    const response = await api.get('/backups', { params });
    return response.data;
  },

  // Get backup by ID
  getBackupById: async (id) => {
    const response = await api.get(`/backups/${id}`);
    return response.data;
  },

  // Create backup
  createBackup: async (data = {}) => {
    const response = await api.post('/backups', data);
    return response.data;
  },

  // Restore backup
  restoreBackup: async (id, data = {}) => {
    const response = await api.post(`/backups/${id}/restore`, data);
    return response.data;
  },

  // Download backup
  downloadBackup: async (id) => {
    // Đảm bảo id là string
    const backupId = typeof id === 'object' && id?.toString ? id.toString() : String(id);
    const response = await api.get(`/backups/${backupId}/download`, { responseType: 'blob' });
    return response;
  },

  // Delete backup
  deleteBackup: async (id) => {
    const response = await api.delete(`/backups/${id}`);
    return response.data;
  },

  // Get backup stats
  getBackupStats: async () => {
    const response = await api.get('/backups/stats');
    return response.data;
  },

  // Alias for getBackupStats (for consistency with other APIs)
  getStats: async () => {
    const response = await api.get('/backups/stats');
    return response.data;
  },

  // Cleanup backups
  cleanupBackups: async () => {
    const response = await api.post('/backups/cleanup');
    return response.data;
  }
};

// Inventory API
export const inventoryAPI = {
  // Get inventory
  getInventory: async (params = {}) => {
    const response = await api.get('/inventory', { params });
    return response.data;
  },

  // Get inventory by ID
  getInventoryById: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  // Get inventory by location
  getInventoryByLocation: async (locationId) => {
    const response = await api.get(`/inventory/location/${locationId}`);
    return response.data;
  },

  // Get list of locations
  getLocations: async () => {
    const response = await api.get('/inventory/locations');
    return response.data;
  },

  // Get total stock for a drug
  getTotalStock: async (drugId) => {
    const response = await api.get(`/inventory/drug/${drugId}/total`);
    return response.data;
  },

  // Get inventory stats
  getInventoryStats: async () => {
    const response = await api.get('/inventory/stats', {
      skipErrorHandler: true // Bỏ qua error handler để tránh toast cho empty data
    });
    return response.data;
  },

  // Alias for getInventoryStats
  getStats: async (params = {}) => {
    const response = await api.get('/inventory/stats', { 
      params,
      skipErrorHandler: true // Bỏ qua error handler để tránh toast cho empty data
    });
    return response.data;
  },

  // Stock in
  stockIn: async (data) => {
    const response = await api.post('/inventory/stock-in', data);
    return response.data;
  },

  // Stock out
  stockOut: async (data) => {
    const response = await api.post('/inventory/stock-out', data);
    return response.data;
  },

  // Adjust stock
  adjustStock: async (data) => {
    const response = await api.post('/inventory/adjust', data);
    return response.data;
  },

  // Transfer stock
  transferStock: async (data) => {
    const response = await api.post('/inventory/transfer', data);
    return response.data;
  },

  // Stocktake
  stocktake: async (data) => {
    const response = await api.post('/inventory/stocktake', data);
    return response.data;
  },

  // Get transactions
  getTransactions: async (params = {}) => {
    const response = await api.get('/inventory/transactions', { params });
    return response.data;
  },

  // Get transaction stats
  getTransactionStats: async () => {
    const response = await api.get('/inventory/transactions/stats');
    return response.data;
  }
};

// Orders API
export const orderAPI = {
  // Get orders
  getOrders: async (params = {}) => {
    const response = await api.get('/orders', { 
      params,
      skipErrorHandler: true // Bỏ qua error handler để tránh toast cho empty data
    });
    return response.data;
  },

  // Get order by ID
  getOrderById: async (id) => {
    // Đảm bảo id là string
    const orderId = typeof id === 'object' && id?.toString ? id.toString() : String(id);
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  // Create order
  createOrder: async (data) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  // Confirm order
  confirmOrder: async (id) => {
    // Đảm bảo id là string
    const orderId = typeof id === 'object' && id?.toString ? id.toString() : String(id);
    const response = await api.post(`/orders/${orderId}/confirm`);
    return response.data;
  },

  // Process order
  processOrder: async (id) => {
    // Đảm bảo id là string
    const orderId = typeof id === 'object' && id?.toString ? id.toString() : String(id);
    const response = await api.post(`/orders/${orderId}/process`);
    return response.data;
  },

  // Ship order
  shipOrder: async (id, data = {}) => {
    // Đảm bảo id là string
    const orderId = typeof id === 'object' && id?.toString ? id.toString() : String(id);
    const response = await api.post(`/orders/${orderId}/ship`, data);
    return response.data;
  },

  // Deliver order
  deliverOrder: async (id) => {
    // Đảm bảo id là string
    const orderId = typeof id === 'object' && id?.toString ? id.toString() : String(id);
    const response = await api.post(`/orders/${orderId}/deliver`);
    return response.data;
  },

  // Cancel order
  cancelOrder: async (id, data = {}) => {
    // Đảm bảo id là string
    const orderId = typeof id === 'object' && id?.toString ? id.toString() : String(id);
    const response = await api.post(`/orders/${orderId}/cancel`, data);
    return response.data;
  },

  // Get order stats
  getOrderStats: async () => {
    const response = await api.get('/orders/stats', {
      skipErrorHandler: true // Bỏ qua error handler để tránh toast cho empty data
    });
    return response.data;
  },

  // Alias for getOrderStats
  getStats: async (params = {}) => {
    const response = await api.get('/orders/stats', { 
      params,
      skipErrorHandler: true // Bỏ qua error handler để tránh toast cho empty data
    });
    return response.data;
  },
  
  // Re-order - Lấy items từ đơn hàng cũ để đặt lại
  reorder: async (orderId) => {
    const id = typeof orderId === 'object' && orderId?.toString ? orderId.toString() : String(orderId);
    const response = await api.post(`/orders/${id}/reorder`);
    return response.data;
  }
};

// Invoices API
export const invoiceAPI = {
  // Get invoices
  getInvoices: async (params = {}) => {
    const response = await api.get('/invoices', { params });
    return response.data;
  },

  // Get invoice by ID
  getInvoiceById: async (id) => {
    const response = await api.get(`/invoices/${id}`);
    return response.data;
  },

  // Create invoice
  createInvoice: async (data) => {
    const response = await api.post('/invoices', data);
    return response.data;
  },

  // Create invoice from order
  createInvoiceFromOrder: async (orderId) => {
    const response = await api.post(`/invoices/from-order/${orderId}`);
    return response.data;
  },

  // Record payment
  recordPayment: async (id, data) => {
    const response = await api.post(`/invoices/${id}/payment`, data);
    return response.data;
  },

  // Get invoice stats
  getInvoiceStats: async () => {
    const response = await api.get('/invoices/stats');
    return response.data;
  }
};

// Payments API
export const paymentAPI = {
  // Get payments
  getPayments: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  // Get payment by ID
  getPaymentById: async (id) => {
    const response = await api.get(`/payments/${id}`);
    return response.data;
  },

  // Get payment stats
  getPaymentStats: async () => {
    const response = await api.get('/payments/stats');
    return response.data;
  }
};

// Suppliers API
export const supplierAPI = {
  // Get suppliers
  getSuppliers: async (params = {}) => {
    const response = await api.get('/suppliers', { 
      params,
      skipErrorHandler: true // Bỏ qua error handler để tránh toast cho empty data
    });
    return response.data;
  },

  // Get supplier by ID
  getSupplierById: async (id) => {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  },

  // Create supplier
  createSupplier: async (data) => {
    const response = await api.post('/suppliers', data);
    return response.data;
  },

  // Update supplier rating
  updateSupplierRating: async (id, data) => {
    const response = await api.post(`/suppliers/${id}/rating`, data);
    return response.data;
  },

  // Create contract
  createContract: async (id, data) => {
    const response = await api.post(`/suppliers/${id}/contracts`, data);
    return response.data;
  },

  // Get contracts
  getContracts: async (params = {}) => {
    const response = await api.get('/suppliers/contracts', { params });
    return response.data;
  }
};

// Import/Export API
export const importExportAPI = {
  // Import drugs
  importDrugs: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/import-export/drugs/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Import drugs from PDF (Ministry of Health document)
  importDrugsFromPDF: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/import-export/drugs/import-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Import inventory
  importInventory: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post('/import-export/inventory/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Export drugs
  exportDrugs: async (params = {}) => {
    const response = await api.get('/import-export/drugs/export', { 
      params,
      responseType: 'blob'
    });
    return response;
  },

  // Export inventory
  exportInventory: async (params = {}) => {
    const response = await api.get('/import-export/inventory/export', { 
      params,
      responseType: 'blob'
    });
    return response;
  },

  // Export orders
  exportOrders: async (params = {}) => {
    const response = await api.get('/import-export/orders/export', { 
      params,
      responseType: 'blob'
    });
    return response;
  },

  // Export invoices
  exportInvoices: async (params = {}) => {
    const response = await api.get('/import-export/invoices/export', { 
      params,
      responseType: 'blob'
    });
    return response;
  }
};

// Bids API
export const bidAPI = {
  // Tạo bid mới
  createBid: async (bidData) => {
    const response = await api.post('/bids', bidData);
    return response.data;
  },
  
  // Lấy danh sách bids (với filters)
  getBids: async (params = {}) => {
    const response = await api.get('/bids', { params });
    return response.data;
  },
  
  // Lấy bid theo ID
  getBidById: async (id) => {
    const response = await api.get(`/bids/${id}`);
    return response.data;
  },
  
  // Lấy bids của user hiện tại
  getMyBids: async (params = {}) => {
    const response = await api.get('/bids/my-bids', { params });
    return response.data;
  },
  
  // Lấy bids cho manufacturer
  getManufacturerBids: async (params = {}) => {
    const response = await api.get('/bids/manufacturer-bids', { params });
    return response.data;
  },
  
  // Chấp nhận bid
  acceptBid: async (id, notes = null) => {
    const response = await api.put(`/bids/${id}/accept`, { notes });
    return response.data;
  },
  
  // Từ chối bid
  rejectBid: async (id, notes = null) => {
    const response = await api.put(`/bids/${id}/reject`, { notes });
    return response.data;
  },
  
  // Hủy bid
  cancelBid: async (id) => {
    const response = await api.put(`/bids/${id}/cancel`);
    return response.data;
  },
  
  // Gửi counter offer (Manufacturer gửi giá đối ứng)
  counterOffer: async (id, counterPrice, counterNotes = null) => {
    const response = await api.put(`/bids/${id}/counter-offer`, {
      counterPrice,
      counterNotes
    });
    return response.data;
  }
};

// Blockchain Transactions API
export const blockchainTransactionAPI = {
  // Get recent transactions
  getRecentTransactions: async (params = {}) => {
    try {
      const response = await api.get('/blockchain/transactions', { 
        params,
        skipErrorHandler: true // Bỏ qua error handler để tránh toast cho empty data
      });
      return response.data;
    } catch (error) {
      // Re-throw để component có thể handle
      throw error;
    }
  },

  // Verify transaction on chain
  verifyTransaction: async (txHash) => {
    const response = await api.post('/blockchain/verify-transaction', { txHash });
    return response.data;
  },

  // Get transaction details
  getTransactionDetails: async (txHash) => {
    const response = await api.get(`/blockchain/transaction/${txHash}`);
    return response.data;
  }
};

// Utility functions
export const setAuthToken = (token) => {
  if (token) {
    localStorage.setItem('token', token);
    api.defaults.headers.Authorization = `Bearer ${token}`;
  } else {
    localStorage.removeItem('token');
    delete api.defaults.headers.Authorization;
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('token');
};

export const clearAuth = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  delete api.defaults.headers.Authorization;
};

export const isAuthenticated = () => {
  const token = getAuthToken();
  return !!token;
};

// Role Upgrade API
export const roleUpgradeAPI = {
  // Tạo yêu cầu nâng cấp role
  createRequest: async (formData) => {
    const response = await api.post('/role-upgrade/request', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  
  // Lấy yêu cầu của user hiện tại
  getMyRequests: async () => {
    const response = await api.get('/role-upgrade/my-requests');
    return response.data;
  },
  
  // Lấy tất cả yêu cầu (Admin only)
  getAllRequests: async (status) => {
    const params = status ? { status } : {};
    const response = await api.get('/role-upgrade/requests', { params });
    return response.data;
  },
  
  // Duyệt yêu cầu
  approveRequest: async (id, adminNotes) => {
    // Đảm bảo ID là string hợp lệ - xử lý cả trường hợp là object
    if (!id) {
      throw new Error('ID yêu cầu không hợp lệ');
    }
    
    // Chuyển đổi object thành string nếu cần
    let requestId = id;
    if (typeof requestId === 'object') {
      if (typeof requestId.toString === 'function') {
        requestId = requestId.toString();
      } else if (requestId.$oid) {
        requestId = requestId.$oid;
      } else {
        throw new Error('ID yêu cầu không hợp lệ (object không thể chuyển đổi)');
      }
    }
    
    requestId = String(requestId);
    if (!requestId || requestId === 'undefined' || requestId === 'null') {
      throw new Error('ID yêu cầu không hợp lệ');
    }
    
    const response = await api.put(`/role-upgrade/requests/${requestId}/approve`, {
      adminNotes
    });
    return response.data;
  },
  
  // Từ chối yêu cầu
  rejectRequest: async (id, adminNotes) => {
    // Đảm bảo ID là string hợp lệ - xử lý cả trường hợp là object
    if (!id) {
      throw new Error('ID yêu cầu không hợp lệ');
    }
    
    // Chuyển đổi object thành string nếu cần
    let requestId = id;
    if (typeof requestId === 'object') {
      if (typeof requestId.toString === 'function') {
        requestId = requestId.toString();
      } else if (requestId.$oid) {
        requestId = requestId.$oid;
      } else {
        throw new Error('ID yêu cầu không hợp lệ (object không thể chuyển đổi)');
      }
    }
    
    requestId = String(requestId);
    if (!requestId || requestId === 'null' || requestId === 'undefined') {
      throw new Error('ID yêu cầu không hợp lệ');
    }
    
    const response = await api.put(`/role-upgrade/requests/${requestId}/reject`, {
      adminNotes
    });
    return response.data;
  }
};

export default api;
