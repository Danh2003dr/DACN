const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Debug login API
const debugLogin = async () => {
  try {
    console.log('🔍 DEBUG LOGIN API...');
    console.log('=====================');

    // Đăng nhập admin
    console.log('\nĐăng nhập admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin',
      password: 'default123'
    });
    
    console.log('Response status:', loginResponse.status);
    console.log('Response headers:', loginResponse.headers);
    console.log('Response data:', JSON.stringify(loginResponse.data, null, 2));

  } catch (error) {
    console.error('❌ Lỗi khi debug login:', error.response?.data || error.message);
  }
};

debugLogin();
