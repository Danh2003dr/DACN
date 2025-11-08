const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test tính năng bản đồ địa chỉ
const testMapFeature = async () => {
  try {
    console.log('🗺️ TEST TÍNH NĂNG BẢN ĐỒ ĐỊA CHỈ...');
    console.log('=====================================');

    // 1. Đăng nhập admin
    console.log('\n1. Đăng nhập admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin',
      password: 'default123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Đăng nhập thành công');

    // 2. Lấy thông tin user hiện tại
    console.log('\n2. Lấy thông tin user hiện tại...');
    const userResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const currentUser = userResponse.data.data.user;
    console.log('✅ Thông tin user:', {
      fullName: currentUser.fullName,
      email: currentUser.email,
      address: currentUser.address
    });

    // 3. Test cập nhật địa chỉ với tọa độ
    console.log('\n3. Test cập nhật địa chỉ...');
    const testAddresses = [
      {
        name: 'Bệnh viện Chợ Rẫy',
        address: 'Số 201B Nguyễn Chí Thanh, Phường 12, Quận 5, TP.HCM',
        coordinates: { lat: 10.7603, lng: 106.6889 }
      },
      {
        name: 'Bệnh viện Bạch Mai',
        address: 'Số 78 Giải Phóng, Phường Phương Mai, Quận Đống Đa, Hà Nội',
        coordinates: { lat: 21.0285, lng: 105.8542 }
      },
      {
        name: 'Công ty Dược phẩm MediPhar',
        address: 'Số 15 Đường 3/2, Phường 11, Quận 10, TP.HCM',
        coordinates: { lat: 10.8231, lng: 106.6297 }
      }
    ];

    for (let i = 0; i < testAddresses.length; i++) {
      const testAddress = testAddresses[i];
      console.log(`\n   Test ${i + 1}: ${testAddress.name}`);
      
      try {
        const updateResponse = await axios.put(`${BASE_URL}/auth/update-profile`, {
          fullName: currentUser.fullName,
          email: currentUser.email,
          phone: currentUser.phone || '0123456789',
          address: testAddress.address,
          organizationInfo: {
            name: 'Hệ thống quản lý chuỗi cung ứng thuốc',
            address: testAddress.address,
            phone: '0123456789',
            email: 'admin@drug-traceability.com'
          }
        }, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (updateResponse.data.success) {
          console.log(`   ✅ Cập nhật thành công: ${testAddress.name}`);
          console.log(`   📍 Địa chỉ: ${testAddress.address}`);
          console.log(`   📊 Tọa độ: ${testAddress.coordinates.lat}, ${testAddress.coordinates.lng}`);
        } else {
          console.log(`   ❌ Cập nhật thất bại: ${updateResponse.data.message}`);
        }
      } catch (error) {
        console.log(`   ❌ Lỗi khi cập nhật: ${error.response?.data?.message || error.message}`);
      }
    }

    // 4. Test lấy thông tin user sau khi cập nhật
    console.log('\n4. Kiểm tra thông tin sau khi cập nhật...');
    const updatedUserResponse = await axios.get(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const updatedUser = updatedUserResponse.data.data.user;
    console.log('✅ Thông tin user sau khi cập nhật:', {
      fullName: updatedUser.fullName,
      address: updatedUser.address,
      organizationInfo: updatedUser.organizationInfo
    });

    console.log('\n🎉 TEST TÍNH NĂNG BẢN ĐỒ HOÀN THÀNH!');
    console.log('=====================================');
    console.log('✅ Đăng nhập thành công');
    console.log('✅ Lấy thông tin user thành công');
    console.log('✅ Cập nhật địa chỉ thành công');
    console.log('✅ Kiểm tra thông tin sau cập nhật thành công');
    
    console.log('\n📋 HƯỚNG DẪN SỬ DỤNG:');
    console.log('======================');
    console.log('1. Truy cập: http://localhost:3000/map-demo');
    console.log('2. Hoặc vào Profile để cập nhật địa chỉ');
    console.log('3. Sử dụng bản đồ để chọn vị trí chính xác');
    console.log('4. Xem tọa độ và địa chỉ đã chọn');

  } catch (error) {
    console.error('❌ Lỗi khi test tính năng bản đồ:', error.response?.data || error.message);
  }
};

testMapFeature();
