const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test API với xác thực
const testAPI = async () => {
  try {
    console.log('🧪 BẮT ĐẦU TEST API...');
    console.log('======================');

    // 1. Test health check
    console.log('\n1. Test Health Check...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health Check:', healthResponse.data);

    // 2. Đăng nhập admin
    console.log('\n2. Đăng nhập admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin',
      password: 'default123'
    });
    console.log('✅ Đăng nhập thành công');
    const token = loginResponse.data.token;

    // 3. Test API chuỗi cung ứng
    console.log('\n3. Test API chuỗi cung ứng...');
    const supplyChainResponse = await axios.get(`${BASE_URL}/supply-chain`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Chuỗi cung ứng:', supplyChainResponse.data);

    // 4. Test API thuốc
    console.log('\n4. Test API thuốc...');
    const drugsResponse = await axios.get(`${BASE_URL}/drugs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Thuốc:', drugsResponse.data);

    // 5. Test API người dùng
    console.log('\n5. Test API người dùng...');
    const usersResponse = await axios.get(`${BASE_URL}/users`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    console.log('✅ Người dùng:', usersResponse.data);

    console.log('\n🎉 TẤT CẢ API HOẠT ĐỘNG BÌNH THƯỜNG!');
    console.log('=====================================');
    console.log('✅ Health Check: OK');
    console.log('✅ Authentication: OK');
    console.log('✅ Supply Chain API: OK');
    console.log('✅ Drugs API: OK');
    console.log('✅ Users API: OK');

  } catch (error) {
    console.error('❌ Lỗi khi test API:', error.response?.data || error.message);
  }
};

testAPI();
