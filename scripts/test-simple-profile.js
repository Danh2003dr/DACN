const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testSimpleProfile = async () => {
  try {
    console.log('🔧 TEST CẬP NHẬT PROFILE ĐỚN GIẢN...');
    console.log('===================================');

    // 1. Đăng nhập admin
    console.log('\n1. Đăng nhập admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin',
      password: 'default123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Đăng nhập thành công');

    // 2. Test cập nhật profile đơn giản
    console.log('\n2. Test cập nhật profile...');
    try {
      const updateResponse = await axios.put(`${BASE_URL}/auth/update-profile`, {
        fullName: 'Admin Test Avatar Updated',
        email: 'admin@example.com',
        phone: '0123456789',
        address: {
          street: 'Số 123 Đường ABC',
          ward: 'Phường 1',
          district: 'Quận 1',
          city: 'TP.HCM'
        }
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('✅ Cập nhật thành công:', updateResponse.data);
    } catch (error) {
      console.log('❌ Lỗi khi cập nhật:', error.response?.data || error.message);
    }

    // 3. Lấy thông tin user sau khi cập nhật
    console.log('\n3. Lấy thông tin user sau khi cập nhật...');
    const userResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const user = userResponse.data.data.user;
    console.log('✅ Thông tin user:', {
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      address: user.address
    });

  } catch (error) {
    console.error('❌ Lỗi:', error.response?.data || error.message);
  }
};

testSimpleProfile();
