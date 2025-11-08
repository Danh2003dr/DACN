const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test API với token
const testWithToken = async () => {
  try {
    console.log('🧪 TEST API VỚI TOKEN...');
    console.log('=========================');

    // 1. Đăng nhập admin
    console.log('\n1. Đăng nhập admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin',
      password: 'default123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Token:', token.substring(0, 50) + '...');

    // 2. Test API chuỗi cung ứng
    console.log('\n2. Test API chuỗi cung ứng...');
    try {
      const supplyChainResponse = await axios.get(`${BASE_URL}/supply-chain`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Chuỗi cung ứng:', supplyChainResponse.data);
    } catch (error) {
      console.log('❌ Lỗi chuỗi cung ứng:', error.response?.data || error.message);
    }

    // 3. Test API thuốc
    console.log('\n3. Test API thuốc...');
    try {
      const drugsResponse = await axios.get(`${BASE_URL}/drugs`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Thuốc:', drugsResponse.data);
    } catch (error) {
      console.log('❌ Lỗi thuốc:', error.response?.data || error.message);
    }

    // 4. Test API người dùng
    console.log('\n4. Test API người dùng...');
    try {
      const usersResponse = await axios.get(`${BASE_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('✅ Người dùng:', usersResponse.data);
    } catch (error) {
      console.log('❌ Lỗi người dùng:', error.response?.data || error.message);
    }

    console.log('\n🎉 TEST API HOÀN THÀNH!');
    console.log('=========================');

  } catch (error) {
    console.error('❌ Lỗi khi test API:', error.response?.data || error.message);
  }
};

testWithToken();
