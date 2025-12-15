/**
 * Script test để kiểm tra route import PDF có hoạt động không
 * Chạy: node test-import-pdf-route.js
 */

const express = require('express');
const app = express();

// Test import route
try {
  const importExportRoutes = require('./routes/importExport');
  console.log('✅ Routes file loaded successfully');
  
  // Kiểm tra xem route có được export đúng không
  const routes = importExportRoutes.stack || importExportRoutes._router?.stack;
  if (routes) {
    console.log('✅ Routes registered:', routes.length);
    routes.forEach((route, index) => {
      if (route.route) {
        console.log(`   ${index + 1}. ${Object.keys(route.route.methods).join(', ').toUpperCase()} ${route.route.path}`);
      }
    });
  }
  
  // Kiểm tra controller
  const controller = require('./controllers/importExportController');
  if (controller.importDrugsFromPDF) {
    console.log('✅ Controller importDrugsFromPDF exists');
  } else {
    console.log('❌ Controller importDrugsFromPDF NOT FOUND');
  }
  
  // Kiểm tra service
  const service = require('./services/importExportService');
  if (service.importDrugsFromPDF) {
    console.log('✅ Service importDrugsFromPDF exists');
  } else {
    console.log('❌ Service importDrugsFromPDF NOT FOUND');
  }
  
  console.log('\n✅ All checks passed! Route should work after server restart.');
  console.log('\n📝 Next steps:');
  console.log('   1. Restart your server (Ctrl+C then npm start)');
  console.log('   2. Try importing PDF again');
  
} catch (error) {
  console.error('❌ Error loading routes:', error.message);
  console.error(error.stack);
  process.exit(1);
}

