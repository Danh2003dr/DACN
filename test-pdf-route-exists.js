/**
 * Script kiểm tra route PDF import có tồn tại không
 */

const routes = require('./routes/importExport');

console.log('🔍 Kiểm tra route import-export...\n');

// Kiểm tra xem router có được export không
if (!routes) {
  console.error('❌ Routes không được export!');
  process.exit(1);
}

// Kiểm tra router có phải là Express router không
if (typeof routes === 'function' && routes.stack) {
  console.log('✅ Router được load thành công');
  
  // In ra tất cả các routes
  console.log('\n📋 Danh sách routes trong importExport router:');
  routes.stack.forEach((layer) => {
    if (layer.route) {
      const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
      console.log(`   ${methods.padEnd(6)} ${layer.route.path}`);
    }
  });
  
  // Kiểm tra route cụ thể
  const hasPDFRoute = routes.stack.some((layer) => {
    return layer.route && 
           layer.route.path === '/drugs/import-pdf' && 
           layer.route.methods.post;
  });
  
  if (hasPDFRoute) {
    console.log('\n✅ Route POST /drugs/import-pdf được tìm thấy!');
  } else {
    console.log('\n❌ Route POST /drugs/import-pdf KHÔNG được tìm thấy!');
    console.log('\n📋 Tất cả routes có sẵn:');
    routes.stack.forEach((layer) => {
      if (layer.route) {
        const methods = Object.keys(layer.route.methods).join(', ').toUpperCase();
        console.log(`   ${methods.padEnd(6)} ${layer.route.path}`);
      }
    });
  }
} else {
  console.error('❌ Routes không phải là Express router!');
  console.log('Type:', typeof routes);
  process.exit(1);
}

console.log('\n✅ Kiểm tra hoàn tất!');
console.log('\n💡 Lưu ý: Nếu route đã tồn tại nhưng vẫn bị 404, hãy restart server!');

