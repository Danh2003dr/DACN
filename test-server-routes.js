// Script để kiểm tra xem server có load routes đúng không
const http = require('http');

console.log('🔍 Kiểm tra routes trên server đang chạy...\n');

// Test endpoint /api/bids (cần auth nhưng sẽ thấy 401 thay vì 404 nếu route tồn tại)
const testOptions = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/bids/test',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(testOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log(`📊 Status Code: ${res.statusCode}`);
    try {
      const response = JSON.parse(data);
      console.log(`📄 Response:`, JSON.stringify(response, null, 2));
    } catch (e) {
      console.log(`📄 Response (raw):`, data.substring(0, 200));
    }
    
    console.log('\n' + '='.repeat(50));
    
    if (res.statusCode === 401 || res.statusCode === 403) {
      console.log('✅ Routes ĐÃ ĐƯỢC LOAD!');
      console.log('   Server trả về 401/403 nghĩa là route tồn tại,');
      console.log('   chỉ là cần authentication (đây là hành vi đúng).\n');
      console.log('💡 Nếu frontend vẫn báo 404, có thể là:');
      console.log('   - Frontend đang cache response cũ');
      console.log('   - Cần hard refresh browser (Ctrl+Shift+R)');
      console.log('   - Hoặc clear browser cache');
    } else if (res.statusCode === 404) {
      console.log('❌ Routes CHƯA ĐƯỢC LOAD!');
      console.log('   Server trả về 404 nghĩa là route không tồn tại.\n');
      console.log('💡 Hãy:');
      console.log('   1. Tìm terminal đang chạy backend server');
      console.log('   2. Nhấn Ctrl+C để dừng server');
      console.log('   3. Chạy lại: npm start (hoặc nodemon server.js)');
      console.log('   4. Kiểm tra console có lỗi không');
    } else {
      console.log(`⚠️  Server trả về status ${res.statusCode}`);
      console.log('   Cần kiểm tra thêm...');
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Không thể kết nối đến server!');
  console.error(`   Error: ${error.message}\n`);
  console.log('💡 Hãy đảm bảo backend server đang chạy trên port 5000');
  console.log('   Chạy: npm start');
});

req.setTimeout(5000, () => {
  req.destroy();
  console.error('\n❌ Timeout! Server không phản hồi.');
});

req.end();

