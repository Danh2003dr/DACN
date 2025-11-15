import axios from 'axios';
import toast from 'react-hot-toast';

// Tạo axios instance
// Tự động detect API URL: ưu tiên REACT_APP_API_URL, nếu không có thì dùng IP hiện tại hoặc localhost
const getApiUrl = () => {
  // Nếu có REACT_APP_API_URL trong env, dùng nó
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }
  
  // Nếu đang chạy trên network (không phải localhost), dùng hostname hiện tại
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const protocol = window.location.protocol;
    const hostname = window.location.hostname;
    const port = '5000'; // Backend port
    return `${protocol}//${hostname}:${port}/api`;
  }
  
  // Mặc định là localhost
  return 'http://localhost:5000/api';
};

const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
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
    const { response } = error;
    
    if (response) {
      const { status, data } = response;
      
      switch (status) {
        case 401:
          // Token hết hạn hoặc không hợp lệ
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
          break;
          
        case 403:
          toast.error('Bạn không có quyền truy cập tài nguyên này.');
          break;
          
        case 404:
          toast.error('Không tìm thấy dữ liệu.');
          break;
          
        case 422:
          // Validation errors
          if (data.errors && Array.isArray(data.errors)) {
            data.errors.forEach(err => toast.error(err));
          } else {
            toast.error(data.message || 'Dữ liệu không hợp lệ.');
          }
          break;
          
        case 500:
          toast.error('Lỗi server. Vui lòng thử lại sau.');
          break;
          
        default:
          toast.error(data.message || 'Có lỗi xảy ra. Vui lòng thử lại.');
      }
    } else {
      toast.error('Không thể kết nối đến server. Vui lòng kiểm tra kết nối mạng.');
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
  
  // Đăng nhập bằng Google
  loginWithGoogle: () => {
    const backendUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    window.location.href = `${backendUrl}/auth/google`;
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
    const response = await api.post('/drugs/scan-qr', { qrData });
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
    const response = await api.get(`/supply-chain/${id}`);
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
export const reviewAPI = {
  // Create review
  createReview: async (data) => {
    const response = await api.post('/reviews', data);
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
    const response = await api.get('/reports/dashboard');
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

export default api;
