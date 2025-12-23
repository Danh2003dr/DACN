/**
 * Script để kiểm tra xem Order model có enum 'vnpay' chưa
 * Chạy script này để verify: node check-vnpay-enum.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/drug-traceability', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

// Load Order model
const Order = require('./models/Order');

async function checkVnpayEnum() {
  try {
    console.log('🔍 Đang kiểm tra enum paymentMethod trong Order model...\n');
    
    // Lấy schema
    const schema = Order.schema;
    const paymentMethodPath = schema.path('paymentMethod');
    
    if (paymentMethodPath && paymentMethodPath.enumValues) {
      const enumValues = paymentMethodPath.enumValues;
      console.log('📋 Các giá trị enum hiện tại:', enumValues);
      
      if (enumValues.includes('vnpay')) {
        console.log('✅ Enum đã có giá trị "vnpay"!');
        console.log('✅ Model Order đã được cập nhật đúng.\n');
        console.log('⚠️  LƯU Ý: Nếu vẫn gặp lỗi validation, hãy restart backend server:');
        console.log('   1. Dừng server (Ctrl + C)');
        console.log('   2. Chạy lại: npm start hoặc node server.js\n');
      } else {
        console.log('❌ Enum CHƯA có giá trị "vnpay"!');
        console.log('❌ Cần kiểm tra lại file models/Order.js\n');
      }
    } else {
      console.log('⚠️  Không tìm thấy enum trong paymentMethod path');
    }
    
    // Test validation riêng cho paymentMethod enum
    console.log('\n🧪 Đang test validation paymentMethod enum...');
    const paymentMethodPath = schema.path('paymentMethod');
    
    // Kiểm tra xem 'vnpay' có trong enum không
    if (paymentMethodPath.enumValues.includes('vnpay')) {
      console.log('✅ Enum validation: paymentMethod "vnpay" là giá trị hợp lệ!');
      console.log('✅ Có thể sử dụng paymentMethod = "vnpay" trong orders.\n');
      
      // Test validate riêng cho giá trị 'vnpay'
      console.log('🧪 Đang test validate giá trị "vnpay"...');
      paymentMethodPath.doValidate('vnpay', function(err) {
        if (err) {
          console.log('❌ paymentMethod "vnpay" KHÔNG hợp lệ:', err.message);
          console.log('\n⚠️  Có thể cần restart backend server để áp dụng thay đổi!\n');
        } else {
          console.log('✅ paymentMethod "vnpay" đã được validate thành công!');
          console.log('✅ Enum đã sẵn sàng sử dụng trong ứng dụng.\n');
        }
      });
    } else {
      console.log('❌ Enum CHƯA có giá trị "vnpay" trong enumValues!');
      console.log('❌ Cần kiểm tra lại file models/Order.js\n');
    }
    
  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Đã đóng kết nối MongoDB');
  }
}

checkVnpayEnum();

