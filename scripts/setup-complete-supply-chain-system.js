const { exec } = require('child_process');
const path = require('path');

// Script chính để thiết lập toàn bộ hệ thống chuỗi cung ứng
const main = async () => {
  try {
    console.log('🚀 BẮT ĐẦU THIẾT LẬP HỆ THỐNG CHUỖI CUNG ỨNG HOÀN CHỈNH...');
    console.log('========================================================');
    console.log('📋 Danh sách các bước sẽ thực hiện:');
    console.log('1. Thiết lập dữ liệu thuốc đã được kiểm định');
    console.log('2. Tạo các tổ chức thật tại Việt Nam');
    console.log('3. Thiết lập chuỗi cung ứng hoàn chỉnh');
    console.log('4. Tạo QR codes và tích hợp blockchain');
    console.log('5. Thiết lập kiểm tra chất lượng');
    console.log('6. Tạo báo cáo và thống kê');
    console.log('');

    // Bước 1: Thiết lập dữ liệu thuốc đã được kiểm định
    console.log('📦 BƯỚC 1: Thiết lập dữ liệu thuốc đã được kiểm định...');
    console.log('=====================================================');
    await runScript('setup-verified-drugs.js');
    console.log('✅ Hoàn thành thiết lập dữ liệu thuốc\n');

    // Bước 2: Tạo các tổ chức thật
    console.log('🏥 BƯỚC 2: Tạo các tổ chức thật tại Việt Nam...');
    console.log('==============================================');
    await runScript('setup-complete-supply-chain.js');
    console.log('✅ Hoàn thành tạo các tổ chức thật\n');

    // Bước 3: Tạo QR codes và tích hợp blockchain
    console.log('📱 BƯỚC 3: Tạo QR codes và tích hợp blockchain...');
    console.log('===============================================');
    await runScript('generate-complete-qr-codes.js');
    console.log('✅ Hoàn thành tạo QR codes và blockchain\n');

    // Bước 4: Thiết lập kiểm tra chất lượng
    console.log('🔬 BƯỚC 4: Thiết lập kiểm tra chất lượng...');
    console.log('==========================================');
    await runScript('setup-quality-control.js');
    console.log('✅ Hoàn thành thiết lập kiểm tra chất lượng\n');

    // Bước 5: Tạo báo cáo và thống kê
    console.log('📊 BƯỚC 5: Tạo báo cáo và thống kê...');
    console.log('====================================');
    await runScript('generate-supply-chain-reports.js');
    console.log('✅ Hoàn thành tạo báo cáo và thống kê\n');

    console.log('🎉 HOÀN THÀNH THIẾT LẬP HỆ THỐNG CHUỖI CUNG ỨNG!');
    console.log('================================================');
    console.log('✅ Dữ liệu thuốc thật đã được thiết lập');
    console.log('✅ Các tổ chức thật tại Việt Nam đã được tạo');
    console.log('✅ Chuỗi cung ứng hoàn chỉnh từ sản xuất đến bệnh viện');
    console.log('✅ QR codes và blockchain đã được tích hợp');
    console.log('✅ Kiểm tra chất lượng và điều kiện bảo quản đã được thiết lập');
    console.log('✅ Báo cáo và thống kê đã được tạo');
    
    console.log('\n🔗 TRUY CẬP HỆ THỐNG:');
    console.log('=====================');
    console.log('- Quản lý chuỗi cung ứng: http://localhost:3000/supply-chain');
    console.log('- Quản lý thuốc: http://localhost:3000/drugs');
    console.log('- Xác minh QR code: http://localhost:3000/verify');
    console.log('- Báo cáo thống kê: http://localhost:3000/reports');
    console.log('- Quản lý người dùng: http://localhost:3000/users');
    
    console.log('\n📁 THƯ MỤC QUAN TRỌNG:');
    console.log('======================');
    console.log('- QR codes: ./qr-codes/');
    console.log('- Báo cáo: ./reports/');
    console.log('- Scripts: ./scripts/');
    
    console.log('\n🎯 TÍNH NĂNG CHÍNH:');
    console.log('===================');
    console.log('✅ Quản lý chuỗi cung ứng từ sản xuất đến bệnh nhân');
    console.log('✅ Truy xuất nguồn gốc thuốc qua QR code');
    console.log('✅ Kiểm tra chất lượng và điều kiện bảo quản');
    console.log('✅ Tích hợp blockchain để đảm bảo tính minh bạch');
    console.log('✅ Báo cáo và thống kê chi tiết');
    console.log('✅ Hệ thống phân quyền theo vai trò');
    console.log('✅ Dữ liệu thật từ Cục Quản lý Dược - Bộ Y tế');

  } catch (error) {
    console.error('❌ Lỗi trong quá trình thiết lập hệ thống:', error);
    process.exit(1);
  }
};

// Hàm chạy script
const runScript = (scriptName) => {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    console.log(`🔄 Đang chạy: ${scriptName}...`);
    
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error(`❌ Lỗi khi chạy ${scriptName}:`, error);
        reject(error);
        return;
      }
      
      if (stderr) {
        console.error(`⚠️ Cảnh báo từ ${scriptName}:`, stderr);
      }
      
      if (stdout) {
        console.log(stdout);
      }
      
      resolve();
    });
  });
};

// Chạy script chính
main();
