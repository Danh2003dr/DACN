const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testSimpleDrug = async () => {
  try {
    console.log('🧪 TEST TẠO THUỐC ĐỚN GIẢN...');
    console.log('==============================');

    // 1. Đăng nhập admin
    console.log('\n1. Đăng nhập admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin',
      password: 'default123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Đăng nhập thành công');

    // 2. Tạo thuốc đơn giản
    console.log('\n2. Tạo thuốc đơn giản...');
    const drugData = {
      name: 'Test Drug Simple',
      activeIngredient: 'Test Active Ingredient',
      dosage: '500mg',
      form: 'viên nén',
      batchNumber: `BATCH_SIMPLE_${Date.now()}`,
      productionDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
    };

    console.log('📝 Drug data:', JSON.stringify(drugData, null, 2));

    const createResponse = await axios.post(`${BASE_URL}/drugs`, drugData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('📊 Response status:', createResponse.status);
    console.log('📊 Response data:', JSON.stringify(createResponse.data, null, 2));

    if (createResponse.data.success) {
      console.log('✅ Tạo thuốc thành công');
      const drug = createResponse.data.data.drug;
      console.log('📊 Drug ID:', drug._id);
      console.log('📊 Drug Name:', drug.name);
      console.log('📊 QR Code Data:', drug.qrCode?.data ? 'Có' : 'Không có');
      console.log('📊 Blockchain ID:', drug.blockchain?.blockchainId || 'Không có');
    } else {
      console.log('❌ Tạo thuốc thất bại:', createResponse.data.message);
      if (createResponse.data.errors) {
        console.log('📋 Errors:', createResponse.data.errors);
      }
    }

  } catch (error) {
    console.error('❌ Lỗi:', error.response?.data || error.message);
  }
};

testSimpleDrug();
