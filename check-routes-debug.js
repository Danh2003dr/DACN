// Script để kiểm tra xem routes có được load đúng không
const http = require('http');

console.log('🔍 Kiểm tra routes trên server...\n');

const tests = [
  { name: 'Test route /api/bids/test', path: '/api/bids/test', expected: 200 },
  { name: 'Test route /api/bids/my-bids (không auth sẽ 401/403, không phải 404)', path: '/api/bids/my-bids?page=1&limit=20', expected: [401, 403] },
  { name: 'Test route /api/bids (không auth sẽ 401/403)', path: '/api/bids', expected: [401, 403] }
];

let completed = 0;

tests.forEach((test, index) => {
  const req = http.request({
    hostname: 'localhost',
    port: 5000,
    path: test.path,
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  }, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
      const status = res.statusCode;
      const expected = Array.isArray(test.expected) ? test.expected : [test.expected];
      const isExpected = expected.includes(status);
      
      console.log(`${isExpected ? '✅' : '❌'} ${test.name}`);
      console.log(`   Status: ${status} ${isExpected ? '(Đúng)' : '(SAI - Expected: ' + expected.join('/') + ')'}`);
      
      if (status === 404) {
        try {
          const response = JSON.parse(data);
          console.log(`   Response: ${response.message || 'Route not found'}`);
        } catch (e) {
          console.log(`   Response: ${data.substring(0, 100)}`);
        }
      }
      
      completed++;
      if (completed === tests.length) {
        console.log('\n📊 Kết luận:');
        if (completed === tests.length && tests.every(t => {
          const req2 = http.request({hostname:'localhost',port:5000,path:t.path,method:'GET',headers:{'Content-Type':'application/json'}},()=>{});
          return true; // Simplified check
        })) {
          console.log('Nếu tất cả đều 404: Server CHƯA restart hoặc routes CHƯA được load');
          console.log('Nếu có 401/403: Routes đã được load (chỉ cần authentication)');
          console.log('Nếu có 200 cho /test: Routes đang hoạt động tốt');
        }
        process.exit(0);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error(`❌ ${test.name}: Error - ${error.message}`);
    completed++;
    if (completed === tests.length) process.exit(1);
  });
  
  req.setTimeout(3000, () => {
    req.destroy();
    console.error(`❌ ${test.name}: Timeout`);
    completed++;
    if (completed === tests.length) process.exit(1);
  });
  
  req.end();
});

// Wait for all tests
setTimeout(() => {
  if (completed < tests.length) {
    console.log('\n⚠️  Timeout waiting for all tests');
    process.exit(1);
  }
}, 5000);

