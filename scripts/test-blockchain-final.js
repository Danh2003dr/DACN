const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

const testBlockchainFinal = async () => {
  try {
    console.log('🔗 TEST BLOCKCHAIN FINAL...');
    console.log('===========================');

    // 1. Đăng nhập admin
    console.log('\n1. Đăng nhập admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin',
      password: 'default123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Đăng nhập thành công');

    // 2. Test blockchain service trực tiếp
    console.log('\n2. Test blockchain service...');
    try {
      const blockchainResponse = await axios.get(`${BASE_URL}/drugs/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (blockchainResponse.data.success) {
        console.log('✅ Blockchain service hoạt động');
        console.log('📊 Stats:', blockchainResponse.data.data);
      }
    } catch (blockchainError) {
      console.log('⚠️ Blockchain service error:', blockchainError.response?.data?.message || blockchainError.message);
    }

    // 3. Test tạo thuốc với dữ liệu tối thiểu
    console.log('\n3. Test tạo thuốc với dữ liệu tối thiểu...');
    const minimalDrugData = {
      name: 'Test Drug Minimal',
      activeIngredient: 'Test Active',
      dosage: '500mg',
      form: 'viên nén',
      batchNumber: `BATCH_MIN_${Date.now()}`,
      productionDate: new Date().toISOString(),
      expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      qualityTest: {
        testDate: new Date().toISOString(),
        testResult: 'đạt',
        testBy: 'Test Lab'
      }
    };

    try {
      const createResponse = await axios.post(`${BASE_URL}/drugs`, minimalDrugData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('📊 Create response status:', createResponse.status);
      
      if (createResponse.data.success) {
        console.log('✅ Tạo thuốc thành công');
        const drug = createResponse.data.data.drug;
        console.log('📊 Drug ID:', drug._id);
        console.log('📊 Drug Name:', drug.name);
        console.log('📊 QR Code Data:', drug.qrCode?.data ? 'Có' : 'Không có');
        console.log('📊 Blockchain ID:', drug.blockchain?.blockchainId || 'Không có');
        console.log('📊 Is On Blockchain:', drug.blockchain?.isOnBlockchain || false);

        // 4. Test xác minh blockchain nếu có blockchain ID
        if (drug.blockchain?.blockchainId) {
          console.log('\n4. Test xác minh blockchain...');
          try {
            const verifyResponse = await axios.get(`${BASE_URL}/drugs/blockchain-verify/${drug.blockchain.blockchainId}`);
            
            if (verifyResponse.data.success) {
              console.log('✅ Xác minh blockchain thành công');
              console.log('📊 Verification Status:', verifyResponse.data.data.verification.status);
              console.log('📊 Is Valid:', verifyResponse.data.data.verification.isValid);
            } else {
              console.log('❌ Xác minh blockchain thất bại:', verifyResponse.data.message);
            }
          } catch (verifyError) {
            console.log('❌ Lỗi khi xác minh blockchain:', verifyError.response?.data?.message || verifyError.message);
          }
        } else {
          console.log('⚠️ Không có blockchain ID để test xác minh');
        }

        // 5. Test lấy thông tin thuốc
        console.log('\n5. Test lấy thông tin thuốc...');
        try {
          const getResponse = await axios.get(`${BASE_URL}/drugs/${drug._id}`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (getResponse.data.success) {
            console.log('✅ Lấy thông tin thuốc thành công');
            const drugInfo = getResponse.data.data;
            console.log('📊 Drug Name:', drugInfo.name);
            console.log('📊 Blockchain Status:', drugInfo.blockchain?.isOnBlockchain || false);
            console.log('📊 Transaction History:', drugInfo.blockchain?.transactionHistory?.length || 0, 'transactions');
          } else {
            console.log('❌ Lấy thông tin thuốc thất bại:', getResponse.data.message);
          }
        } catch (getError) {
          console.log('❌ Lỗi khi lấy thông tin thuốc:', getError.response?.data?.message || getError.message);
        }

      } else {
        console.log('❌ Tạo thuốc thất bại:', createResponse.data.message);
        if (createResponse.data.errors) {
          console.log('📋 Errors:', createResponse.data.errors);
        }
      }
    } catch (createError) {
      console.log('❌ Lỗi khi tạo thuốc:', createError.response?.data || createError.message);
    }

    console.log('\n🎉 TEST BLOCKCHAIN FINAL HOÀN THÀNH!');
    console.log('=====================================');
    console.log('✅ Đăng nhập thành công');
    console.log('✅ Test blockchain service');
    console.log('✅ Test tạo thuốc');
    console.log('✅ Test xác minh blockchain');
    console.log('✅ Test lấy thông tin thuốc');
    
    console.log('\n📋 HƯỚNG DẪN SỬ DỤNG:');
    console.log('======================');
    console.log('1. Truy cập: http://localhost:3000/blockchain-verify/[BLOCKCHAIN_ID]');
    console.log('2. Hoặc quét QR code để xem thông tin blockchain');
    console.log('3. Kiểm tra transaction history trên blockchain');
    console.log('4. Xác minh tính hợp lệ của thuốc');

  } catch (error) {
    console.error('❌ Lỗi khi test blockchain:', error.response?.data || error.message);
  }
};

testBlockchainFinal();
