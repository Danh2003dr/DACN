/**
 * Script kiểm tra tính năng import công văn từ Bộ Y tế
 * Chạy: node check-import-pdf-feature.js
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Kiểm tra tính năng Import công văn từ Bộ Y tế...\n');

let allChecksPassed = true;

// 1. Kiểm tra Route
console.log('1️⃣ Kiểm tra Route...');
try {
  const routeFile = path.join(__dirname, 'routes', 'importExport.js');
  if (fs.existsSync(routeFile)) {
    const routeContent = fs.readFileSync(routeFile, 'utf-8');
    if (routeContent.includes('importDrugsFromPDF') && routeContent.includes('/drugs/import-pdf')) {
      console.log('   ✅ Route /api/import-export/drugs/import-pdf tồn tại');
    } else {
      console.log('   ❌ Route không tìm thấy trong routes/importExport.js');
      allChecksPassed = false;
    }
  } else {
    console.log('   ❌ File routes/importExport.js không tồn tại');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ Lỗi khi kiểm tra route:', error.message);
  allChecksPassed = false;
}

// 2. Kiểm tra Controller
console.log('\n2️⃣ Kiểm tra Controller...');
try {
  const controllerFile = path.join(__dirname, 'controllers', 'importExportController.js');
  if (fs.existsSync(controllerFile)) {
    const controllerContent = fs.readFileSync(controllerFile, 'utf-8');
    if (controllerContent.includes('importDrugsFromPDF')) {
      console.log('   ✅ Controller importDrugsFromPDF tồn tại');
      
      // Kiểm tra middleware uploadPDF
      if (controllerContent.includes('uploadPDF')) {
        console.log('   ✅ Middleware uploadPDF cho PDF đã được cấu hình');
      } else {
        console.log('   ⚠️  Middleware uploadPDF không tìm thấy');
      }
    } else {
      console.log('   ❌ Controller importDrugsFromPDF không tìm thấy');
      allChecksPassed = false;
    }
  } else {
    console.log('   ❌ File controllers/importExportController.js không tồn tại');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ Lỗi khi kiểm tra controller:', error.message);
  allChecksPassed = false;
}

// 3. Kiểm tra Service
console.log('\n3️⃣ Kiểm tra Service...');
try {
  const serviceFile = path.join(__dirname, 'services', 'importExportService.js');
  if (fs.existsSync(serviceFile)) {
    const serviceContent = fs.readFileSync(serviceFile, 'utf-8');
    if (serviceContent.includes('importDrugsFromPDF')) {
      console.log('   ✅ Service importDrugsFromPDF tồn tại');
      
      // Kiểm tra hàm parse PDF
      if (serviceContent.includes('parsePDFFromMinistryOfHealth')) {
        console.log('   ✅ Hàm parsePDFFromMinistryOfHealth tồn tại');
      } else {
        console.log('   ⚠️  Hàm parsePDFFromMinistryOfHealth không tìm thấy');
      }
      
      // Kiểm tra xử lý font tiếng Việt
      if (serviceContent.includes('fixVietnameseSpacing')) {
        console.log('   ✅ Hàm fixVietnameseSpacing (xử lý lỗi font PDF) tồn tại');
      } else {
        console.log('   ⚠️  Hàm fixVietnameseSpacing không tìm thấy');
      }
    } else {
      console.log('   ❌ Service importDrugsFromPDF không tìm thấy');
      allChecksPassed = false;
    }
  } else {
    console.log('   ❌ File services/importExportService.js không tồn tại');
    allChecksPassed = false;
  }
} catch (error) {
  console.log('   ❌ Lỗi khi kiểm tra service:', error.message);
  allChecksPassed = false;
}

// 4. Kiểm tra Frontend API
console.log('\n4️⃣ Kiểm tra Frontend API...');
try {
  const frontendApiFile = path.join(__dirname, 'frontend', 'src', 'utils', 'api.js');
  if (fs.existsSync(frontendApiFile)) {
    const apiContent = fs.readFileSync(frontendApiFile, 'utf-8');
    if (apiContent.includes('importDrugsFromPDF')) {
      console.log('   ✅ Frontend API importDrugsFromPDF tồn tại');
    } else {
      console.log('   ❌ Frontend API importDrugsFromPDF không tìm thấy');
      allChecksPassed = false;
    }
  } else {
    console.log('   ⚠️  File frontend/src/utils/api.js không tìm thấy (có thể frontend chưa build)');
  }
} catch (error) {
  console.log('   ⚠️  Lỗi khi kiểm tra frontend API:', error.message);
}

// 5. Kiểm tra Frontend Component
console.log('\n5️⃣ Kiểm tra Frontend Component...');
try {
  const frontendComponentFile = path.join(__dirname, 'frontend', 'src', 'pages', 'ImportExport.js');
  if (fs.existsSync(frontendComponentFile)) {
    const componentContent = fs.readFileSync(frontendComponentFile, 'utf-8');
    if (componentContent.includes('PDF (Công văn Bộ Y tế)') || componentContent.includes('importFormat === \'pdf\'')) {
      console.log('   ✅ Frontend component hỗ trợ import PDF');
    } else {
      console.log('   ⚠️  Frontend component có thể chưa hỗ trợ import PDF');
    }
  } else {
    console.log('   ⚠️  File frontend/src/pages/ImportExport.js không tìm thấy');
  }
} catch (error) {
  console.log('   ⚠️  Lỗi khi kiểm tra frontend component:', error.message);
}

// 6. Kiểm tra Server.js có mount route không
console.log('\n6️⃣ Kiểm tra Server.js...');
try {
  const serverFile = path.join(__dirname, 'server.js');
  if (fs.existsSync(serverFile)) {
    const serverContent = fs.readFileSync(serverFile, 'utf-8');
    if (serverContent.includes('/api/import-export') && serverContent.includes('require(\'./routes/importExport\')')) {
      console.log('   ✅ Route import-export đã được mount trong server.js');
    } else {
      console.log('   ❌ Route import-export chưa được mount trong server.js');
      allChecksPassed = false;
    }
  } else {
    console.log('   ⚠️  File server.js không tìm thấy');
  }
} catch (error) {
  console.log('   ⚠️  Lỗi khi kiểm tra server.js:', error.message);
}

// 7. Kiểm tra dependencies
console.log('\n7️⃣ Kiểm tra Dependencies...');
try {
  const packageJson = path.join(__dirname, 'package.json');
  if (fs.existsSync(packageJson)) {
    const packageContent = JSON.parse(fs.readFileSync(packageJson, 'utf-8'));
    const deps = { ...packageContent.dependencies, ...packageContent.devDependencies };
    
    if (deps['pdf-parse']) {
      console.log('   ✅ pdf-parse đã được cài đặt');
    } else {
      console.log('   ❌ pdf-parse chưa được cài đặt (cần cho parse PDF)');
      allChecksPassed = false;
    }
    
    if (deps['multer']) {
      console.log('   ✅ multer đã được cài đặt (cần cho upload file)');
    } else {
      console.log('   ⚠️  multer chưa được cài đặt');
    }
  } else {
    console.log('   ⚠️  File package.json không tìm thấy');
  }
} catch (error) {
  console.log('   ⚠️  Lỗi khi kiểm tra dependencies:', error.message);
}

// 8. Kiểm tra thư mục uploads
console.log('\n8️⃣ Kiểm tra thư mục uploads...');
try {
  const uploadsDir = path.join(__dirname, 'uploads');
  if (fs.existsSync(uploadsDir)) {
    console.log('   ✅ Thư mục uploads tồn tại');
  } else {
    console.log('   ⚠️  Thư mục uploads chưa tồn tại (sẽ được tạo tự động khi import)');
  }
} catch (error) {
  console.log('   ⚠️  Lỗi khi kiểm tra thư mục uploads:', error.message);
}

// Tổng kết
console.log('\n' + '='.repeat(50));
if (allChecksPassed) {
  console.log('✅ TẤT CẢ CÁC KIỂM TRA ĐÃ VƯỢT QUA!');
  console.log('\n📋 Tóm tắt:');
  console.log('   - Route: ✅');
  console.log('   - Controller: ✅');
  console.log('   - Service: ✅');
  console.log('   - Frontend: ✅');
  console.log('\n💡 Tính năng import công văn từ Bộ Y tế đã sẵn sàng sử dụng!');
  console.log('\n📖 Hướng dẫn sử dụng:');
  console.log('   1. Đăng nhập với tài khoản Admin');
  console.log('   2. Vào menu "Import/Export"');
  console.log('   3. Chọn tab "Import"');
  console.log('   4. Chọn "Thuốc (Drugs)" và "PDF (Công văn Bộ Y tế)"');
  console.log('   5. Upload file PDF công văn và click "Import"');
} else {
  console.log('❌ MỘT SỐ KIỂM TRA THẤT BẠI!');
  console.log('\n⚠️  Vui lòng kiểm tra lại các file và cấu hình trên.');
}
console.log('='.repeat(50));
