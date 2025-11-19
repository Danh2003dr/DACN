import axios from 'axios';

// Tạo axios instance với base URL
const axiosClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor: Tự động thêm token vào header
axiosClient.interceptors.request.use(
  (config) => {
    // Lấy token từ localStorage
    const token = localStorage.getItem('token');
    
    // Nếu có token, thêm vào header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Xử lý lỗi 401 (Unauthorized)
axiosClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Xử lý lỗi 401: Token không hợp lệ hoặc đã hết hạn
    if (error.response && error.response.status === 401) {
      // Xóa token khỏi localStorage
      localStorage.removeItem('token');
      
      // Xóa thông tin user (nếu có)
      localStorage.removeItem('user');
      
      // Redirect về trang đăng nhập (chỉ khi không phải đang ở trang login)
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

export default axiosClient;

