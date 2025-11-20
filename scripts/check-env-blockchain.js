const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load .env manually to ensure we get the raw values
const envConfig = dotenv.parse(fs.readFileSync(path.join(__dirname, '../.env')));

console.log('--- KIỂM TRA CẤU HÌNH BLOCKCHAIN TRONG .ENV ---\n');

const mnemonic = envConfig.MNEMONIC;
const privateKey = envConfig.PRIVATE_KEY;
const infuraId = envConfig.INFURA_PROJECT_ID;

// 1. Kiểm tra Infura ID
if (!infuraId) {
    console.log('❌ INFURA_PROJECT_ID: Chưa được set');
} else {
    console.log(`✅ INFURA_PROJECT_ID: Đã set (${infuraId.length} ký tự)`);
}

// 2. Kiểm tra Mnemonic
if (mnemonic) {
    console.log(`ℹ️  MNEMONIC: Đã set (${mnemonic.split(' ').length} từ)`);
    if (mnemonic.trim() !== mnemonic) {
        console.log('⚠️  Cảnh báo: MNEMONIC có chứa khoảng trắng thừa ở đầu hoặc cuối');
    }
} else {
    console.log('ℹ️  MNEMONIC: Không sử dụng');
}

// 3. Kiểm tra Private Key
if (privateKey) {
    console.log('\n--- Kiểm tra PRIVATE_KEY ---');
    let cleanKey = privateKey.trim();
    
    // Check for quotes
    if ((cleanKey.startsWith('"') && cleanKey.endsWith('"')) || 
        (cleanKey.startsWith("'") && cleanKey.endsWith("'"))) {
        console.log('⚠️  Cảnh báo: PRIVATE_KEY đang được bao quanh bởi dấu ngoặc kép/đơn. Hãy xóa chúng.');
        cleanKey = cleanKey.substring(1, cleanKey.length - 1);
    }

    // Remove 0x prefix
    if (cleanKey.startsWith('0x')) {
        console.log('ℹ️  Phát hiện prefix 0x, sẽ tự động loại bỏ khi chạy');
        cleanKey = cleanKey.substring(2);
    }

    console.log(`Độ dài key (sau khi xử lý): ${cleanKey.length} ký tự`);
    
    const isHex = /^[0-9a-fA-F]+$/.test(cleanKey);
    if (!isHex) {
        console.log('❌ Lỗi: PRIVATE_KEY chứa ký tự không phải HEX (chỉ chấp nhận 0-9, a-f)');
    } else {
        console.log('✅ Định dạng HEX: Hợp lệ');
    }

    if (cleanKey.length !== 64) {
        console.log(`❌ Lỗi: PRIVATE_KEY có độ dài ${cleanKey.length}, yêu cầu chính xác 64 ký tự`);
        if (cleanKey.length < 64) console.log('   -> Key quá ngắn');
        if (cleanKey.length > 64) console.log('   -> Key quá dài');
    } else if (isHex) {
        console.log('✅ PRIVATE_KEY: Hợp lệ và sẵn sàng sử dụng');
    }
} else {
    if (!mnemonic) {
        console.log('\n❌ Lỗi: Cần set ít nhất MNEMONIC hoặc PRIVATE_KEY');
    } else {
        console.log('\n✅ Sử dụng MNEMONIC để deploy');
    }
}

console.log('\n-----------------------------------------------');

