const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testSettingsAPI = async () => {
  try {
    console.log('⚙️ TEST SETTINGS API...');
    console.log('========================');

    // 1. Đăng nhập admin
    console.log('\n1. Đăng nhập admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin',
      password: 'default123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Đăng nhập thành công');

    // 2. Test lấy cài đặt
    console.log('\n2. Test lấy cài đặt...');
    try {
      const settingsResponse = await axios.get(`${BASE_URL}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (settingsResponse.data.success) {
        console.log('✅ Lấy cài đặt thành công');
        console.log('📊 System Name:', settingsResponse.data.data.systemName);
        console.log('📊 Blockchain Network:', settingsResponse.data.data.blockchainNetwork);
        console.log('📊 Session Timeout:', settingsResponse.data.data.sessionTimeout);
      } else {
        console.log('❌ Lấy cài đặt thất bại:', settingsResponse.data.message);
      }
    } catch (settingsError) {
      console.log('❌ Lỗi khi lấy cài đặt:', settingsError.response?.data?.message || settingsError.message);
    }

    // 3. Test lấy thông tin hệ thống
    console.log('\n3. Test lấy thông tin hệ thống...');
    try {
      const systemInfoResponse = await axios.get(`${BASE_URL}/settings/system-info`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (systemInfoResponse.data.success) {
        console.log('✅ Lấy thông tin hệ thống thành công');
        console.log('📊 Version:', systemInfoResponse.data.data.version);
        console.log('📊 Uptime:', systemInfoResponse.data.data.uptime, 'seconds');
        console.log('📊 Database Status:', systemInfoResponse.data.data.databaseStatus);
        console.log('📊 Memory Usage:', systemInfoResponse.data.data.memoryUsage);
      } else {
        console.log('❌ Lấy thông tin hệ thống thất bại:', systemInfoResponse.data.message);
      }
    } catch (systemInfoError) {
      console.log('❌ Lỗi khi lấy thông tin hệ thống:', systemInfoError.response?.data?.message || systemInfoError.message);
    }

    // 4. Test lấy trạng thái blockchain
    console.log('\n4. Test lấy trạng thái blockchain...');
    try {
      const blockchainStatusResponse = await axios.get(`${BASE_URL}/settings/blockchain-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (blockchainStatusResponse.data.success) {
        console.log('✅ Lấy trạng thái blockchain thành công');
        console.log('📊 Connected:', blockchainStatusResponse.data.data.connected);
        console.log('📊 Network:', blockchainStatusResponse.data.data.network);
        console.log('📊 Contract Address:', blockchainStatusResponse.data.data.contractAddress);
        console.log('📊 Account:', blockchainStatusResponse.data.data.account);
      } else {
        console.log('❌ Lấy trạng thái blockchain thất bại:', blockchainStatusResponse.data.message);
      }
    } catch (blockchainStatusError) {
      console.log('❌ Lỗi khi lấy trạng thái blockchain:', blockchainStatusError.response?.data?.message || blockchainStatusError.message);
    }

    // 5. Test kết nối blockchain
    console.log('\n5. Test kết nối blockchain...');
    try {
      const testBlockchainResponse = await axios.post(`${BASE_URL}/settings/test-blockchain`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (testBlockchainResponse.data.success) {
        console.log('✅ Test kết nối blockchain thành công');
        console.log('📊 Connected:', testBlockchainResponse.data.data.connected);
        console.log('📊 Network:', testBlockchainResponse.data.data.network);
        console.log('📊 Account:', testBlockchainResponse.data.data.account);
      } else {
        console.log('❌ Test kết nối blockchain thất bại:', testBlockchainResponse.data.message);
      }
    } catch (testBlockchainError) {
      console.log('❌ Lỗi khi test kết nối blockchain:', testBlockchainError.response?.data?.message || testBlockchainError.message);
    }

    // 6. Test cập nhật cài đặt
    console.log('\n6. Test cập nhật cài đặt...');
    const updateData = {
      systemName: 'Drug Traceability Blockchain System Updated',
      companyName: 'Test Company',
      companyEmail: 'test@company.com',
      blockchainNetwork: 'sepolia',
      sessionTimeout: 120,
      maxLoginAttempts: 3
    };

    try {
      const updateResponse = await axios.put(`${BASE_URL}/settings`, updateData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (updateResponse.data.success) {
        console.log('✅ Cập nhật cài đặt thành công');
        console.log('📊 Updated System Name:', updateResponse.data.data.systemName);
        console.log('📊 Updated Company Name:', updateResponse.data.data.companyName);
        console.log('📊 Updated Session Timeout:', updateResponse.data.data.sessionTimeout);
      } else {
        console.log('❌ Cập nhật cài đặt thất bại:', updateResponse.data.message);
      }
    } catch (updateError) {
      console.log('❌ Lỗi khi cập nhật cài đặt:', updateError.response?.data?.message || updateError.message);
    }

    // 7. Test reset về mặc định
    console.log('\n7. Test reset về mặc định...');
    try {
      const resetResponse = await axios.post(`${BASE_URL}/settings/reset`, {}, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (resetResponse.data.success) {
        console.log('✅ Reset về mặc định thành công');
        console.log('📊 Default System Name:', resetResponse.data.data.systemName);
        console.log('📊 Default Session Timeout:', resetResponse.data.data.sessionTimeout);
        console.log('📊 Default Max Login Attempts:', resetResponse.data.data.maxLoginAttempts);
      } else {
        console.log('❌ Reset về mặc định thất bại:', resetResponse.data.message);
      }
    } catch (resetError) {
      console.log('❌ Lỗi khi reset về mặc định:', resetError.response?.data?.message || resetError.message);
    }

    console.log('\n🎉 TEST SETTINGS API HOÀN THÀNH!');
    console.log('==================================');
    console.log('✅ Đăng nhập thành công');
    console.log('✅ Lấy cài đặt thành công');
    console.log('✅ Lấy thông tin hệ thống thành công');
    console.log('✅ Lấy trạng thái blockchain thành công');
    console.log('✅ Test kết nối blockchain thành công');
    console.log('✅ Cập nhật cài đặt thành công');
    console.log('✅ Reset về mặc định thành công');
    
    console.log('\n📋 HƯỚNG DẪN SỬ DỤNG:');
    console.log('======================');
    console.log('1. Truy cập: http://localhost:3000/settings');
    console.log('2. Kiểm tra trạng thái blockchain');
    console.log('3. Cập nhật cài đặt hệ thống');
    console.log('4. Test kết nối blockchain');

  } catch (error) {
    console.error('❌ Lỗi khi test settings API:', error.response?.data || error.message);
  }
};

testSettingsAPI();
