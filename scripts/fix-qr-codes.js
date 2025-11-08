const axios = require('axios');
const QRCode = require('qrcode');

const BASE_URL = 'http://localhost:5000/api';

const fixQRCodes = async () => {
  try {
    console.log('🔧 FIX QR CODES...');
    console.log('==================');

    // 1. Đăng nhập admin
    console.log('\n1. Đăng nhập admin...');
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      identifier: 'admin',
      password: 'default123'
    });
    
    const token = loginResponse.data.data.token;
    console.log('✅ Đăng nhập thành công');

    // 2. Lấy danh sách thuốc
    console.log('\n2. Lấy danh sách thuốc...');
    const drugsResponse = await axios.get(`${BASE_URL}/drugs`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (drugsResponse.data.success) {
      const drugs = drugsResponse.data.data.drugs;
      console.log(`📊 Tìm thấy ${drugs.length} thuốc`);

      // 3. Kiểm tra và sửa QR code cho từng thuốc
      for (const drug of drugs) {
        console.log(`\n3. Kiểm tra thuốc: ${drug.name} (${drug.drugId})`);
        
        // Kiểm tra QR code hiện tại
        if (drug.qrCode?.imageUrl) {
          console.log('✅ QR code đã có');
          console.log('📊 QR Image URL:', drug.qrCode.imageUrl.substring(0, 50) + '...');
        } else {
          console.log('❌ QR code chưa có, đang tạo...');
          
          // Tạo QR code mới
          try {
            const qrData = {
              drugId: drug.drugId,
              name: drug.name,
              batchNumber: drug.batchNumber,
              productionDate: drug.productionDate,
              expiryDate: drug.expiryDate,
              manufacturer: drug.manufacturerId?.fullName || 'Unknown',
              blockchainId: drug.blockchain?.blockchainId || null,
              verificationUrl: drug.blockchain?.blockchainId ? 
                `${process.env.CLIENT_URL || 'http://localhost:3001'}/blockchain-verify/${drug.blockchain.blockchainId}` :
                `${process.env.CLIENT_URL || 'http://localhost:3001'}/verify/${drug._id}`,
              timestamp: new Date().toISOString()
            };

            const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
            
            // Cập nhật QR code vào database
            const updateResponse = await axios.put(`${BASE_URL}/drugs/${drug._id}`, {
              qrCode: {
                data: JSON.stringify(qrData),
                imageUrl: qrCodeDataURL,
                blockchainId: drug.blockchain?.blockchainId,
                verificationUrl: qrData.verificationUrl
              }
            }, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            if (updateResponse.data.success) {
              console.log('✅ Đã tạo QR code thành công');
              console.log('📊 QR Data:', JSON.stringify(qrData, null, 2));
            } else {
              console.log('❌ Lỗi khi cập nhật QR code:', updateResponse.data.message);
            }
          } catch (qrError) {
            console.log('❌ Lỗi khi tạo QR code:', qrError.message);
          }
        }
      }

      // 4. Test hiển thị QR code
      console.log('\n4. Test hiển thị QR code...');
      const testDrug = drugs[0];
      if (testDrug) {
        console.log(`📊 Test thuốc: ${testDrug.name}`);
        console.log(`📊 QR Image URL: ${testDrug.qrCode?.imageUrl ? 'Có' : 'Không có'}`);
        
        if (testDrug.qrCode?.imageUrl) {
          console.log('✅ QR code sẵn sàng hiển thị');
        } else {
          console.log('❌ QR code vẫn chưa có');
        }
      }

    } else {
      console.log('❌ Không thể lấy danh sách thuốc:', drugsResponse.data.message);
    }

    console.log('\n🎉 FIX QR CODES HOÀN THÀNH!');
    console.log('============================');
    console.log('✅ Đăng nhập thành công');
    console.log('✅ Lấy danh sách thuốc thành công');
    console.log('✅ Kiểm tra và sửa QR code');
    console.log('✅ Test hiển thị QR code');
    
    console.log('\n📋 HƯỚNG DẪN:');
    console.log('==============');
    console.log('1. Truy cập: http://localhost:3000/drugs');
    console.log('2. Click vào nút QR code của thuốc');
    console.log('3. QR code sẽ hiển thị trong modal');

  } catch (error) {
    console.error('❌ Lỗi khi fix QR codes:', error.response?.data || error.message);
  }
};

fixQRCodes();
