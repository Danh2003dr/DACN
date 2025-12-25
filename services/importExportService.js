const fs = require('fs');
const path = require('path');
const pdfParse = require('pdf-parse');
const Drug = require('../models/Drug');
const Inventory = require('../models/Inventory');
const Order = require('../models/Order');
const Invoice = require('../models/Invoice');
const Supplier = require('../models/Supplier');
const SupplyChain = require('../models/SupplyChain');
const ExcelJS = require('exceljs');
const auditService = require('./auditService');
const blockchainService = require('./blockchainService');
const getServerUrl = require('../utils/getServerUrl');
const QRCode = require('qrcode');
const { generateDrugImageDataUrl } = require('../utils/generateDrugImage');

/**
 * Import/Export Service
 * Service để xử lý import/export dữ liệu từ Excel/CSV
 */

/**
 * Mapping dạng bào chế từ tiếng Việt sang enum của model Drug
 */
const mapDrugFormToEnum = (formValue) => {
  if (!formValue || typeof formValue !== 'string') {
    return 'khác';
  }
  
  const formLower = formValue.toLowerCase().trim();
  
  // Mapping từ các giá trị tiếng Việt sang enum (theo thứ tự ưu tiên từ cụ thể đến chung)
  const formMapping = {
    // Viên nén - tất cả các biến thể
    'viên nén': 'viên nén',
    'viên nén bao phim': 'viên nén',
    'viên nén sủi bọt': 'viên nén',
    'viên nén phân tán': 'viên nén',
    
    // Viên nang - tất cả các biến thể
    'viên nang': 'viên nang',
    'viên nang mềm': 'viên nang',
    'viên nang cứng': 'viên nang',
    
    // Dung dịch tiêm
    'dung dịch tiêm': 'dung dịch tiêm',
    'thuốc tiêm': 'dung dịch tiêm',
    
    // Siro
    'siro': 'siro',
    'siro thuốc': 'siro',
    
    // Kem
    'kem': 'kem',
    'kem bôi da': 'kem',
    
    // Gel
    'gel': 'gel',
    
    // Thuốc mỡ
    'thuốc mỡ': 'thuốc mỡ',
    
    // Cao
    'cao khô': 'cao khô',
    'cao đặc': 'cao đặc',
    
    // Bột pha
    'bột pha': 'khác',
    'bột pha hỗn dịch': 'khác',
    'bột pha hỗn dịch uống': 'khác',
    'bột pha dung dịch uống': 'khác',
    
    // Nguyên liệu
    'nguyên liệu': 'khác',
    'nguyên liệu làm thuốc': 'khác',
    
    // Hỗn dịch
    'hỗn dịch': 'khác',
    'hỗn dịch xịt mũi': 'khác',
    
    // Tất cả các loại còn lại map về "khác"
    'dung dịch': 'khác',
    'dung dịch dùng ngoài': 'khác',
    'dung dịch nhỏ mũi': 'khác',
    'dung dịch vệ sinh': 'khác',
    'thuốc xịt': 'khác',
    'thuốc xịt mũi': 'khác',
    'thuốc cốm': 'khác',
    'thuốc bột': 'khác'
  };
  
  // Kiểm tra mapping trực tiếp (chính xác)
  if (formMapping[formLower]) {
    return formMapping[formLower];
  }
  
  // Kiểm tra pattern matching (từ cụ thể đến chung)
  if (formLower.includes('viên nén')) {
    return 'viên nén';
  }
  if (formLower.includes('viên nang')) {
    return 'viên nang';
  }
  if (formLower.includes('siro')) {
    return 'siro';
  }
  if (formLower.includes('dung dịch tiêm') || formLower.includes('thuốc tiêm')) {
    return 'dung dịch tiêm';
  }
  if (formLower.includes('kem')) {
    return 'kem';
  }
  if (formLower.includes('gel')) {
    return 'gel';
  }
  if (formLower.includes('thuốc mỡ')) {
    return 'thuốc mỡ';
  }
  if (formLower.includes('cao khô')) {
    return 'cao khô';
  }
  if (formLower.includes('cao đặc')) {
    return 'cao đặc';
  }
  // Xử lý các form đặc biệt - phải kiểm tra trước khi log warning
  if (formLower.includes('bột pha')) {
    return 'khác'; // Không log warning vì đã xử lý
  }
  if (formLower.includes('nguyên liệu')) {
    return 'khác'; // Không log warning vì đã xử lý
  }
  if (formLower.includes('hỗn dịch')) {
    return 'khác'; // Không log warning vì đã xử lý
  }
  if (formLower.includes('thuốc bột')) {
    return 'khác'; // Không log warning vì đã xử lý
  }
  
  // Mặc định: tất cả các dạng khác đều map về "khác"
  // Chỉ log warning nếu form value không rỗng và không phải "khác" và không phải giá trị đã được xử lý
  if (formValue && formValue.trim() && formLower !== 'khác' && !formLower.includes('khác')) {
    console.log(`⚠️ Form value "${formValue}" không có trong mapping, sử dụng giá trị mặc định "khác"`);
  }
  return 'khác';
};

// Thư mục uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Parse CSV hoặc Excel file
const parseCSV = async (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  
  // Nếu là file Excel (.xlsx, .xls)
  if (['.xlsx', '.xls'].includes(ext)) {
    try {
      const ExcelJS = require('exceljs');
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      
      const worksheet = workbook.worksheets[0]; // Lấy sheet đầu tiên
      if (!worksheet) {
        return [];
      }
      
      const results = [];
      let headers = [];
      
      // Đọc header từ dòng đầu tiên
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) {
          // Header row
          headers = row.values.slice(1).map(h => h ? String(h).trim() : '').filter(h => h);
        } else {
          // Data rows
          const rowData = {};
          headers.forEach((header, index) => {
            const cellValue = row.getCell(index + 1).value;
            rowData[header] = cellValue ? String(cellValue).trim() : '';
          });
          // Chỉ thêm row nếu có ít nhất một giá trị
          if (Object.values(rowData).some(v => v)) {
            results.push(rowData);
          }
        }
      });
      
      return results;
    } catch (error) {
      console.error('Error parsing Excel file:', error);
      throw new Error('Không thể đọc file Excel: ' + error.message);
    }
  }
  
  // Nếu là file CSV
  return new Promise((resolve, reject) => {
    try {
      const results = [];
      const lines = fs.readFileSync(filePath, 'utf-8').split('\n');
      
      if (lines.length === 0) {
        resolve(results);
        return;
      }
      
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        // Chỉ thêm row nếu có ít nhất một giá trị
        if (Object.values(row).some(v => v)) {
          results.push(row);
        }
      }
      
      resolve(results);
    } catch (error) {
      reject(error);
    }
  });
};

// Helper function để format date
const formatDate = (value) => {
  if (!value) return '';
  
  // Nếu đã là Date object
  if (value instanceof Date) {
    return value.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  }
  
  // Nếu là string, thử parse
  if (typeof value === 'string') {
    // Nếu đã là format YYYY-MM-DD, trả về luôn
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    
    // Thử parse date string
    const date = new Date(value);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    }
    
    // Nếu không parse được, trả về string gốc (nhưng sẽ bị escape)
    return value;
  }
  
  return '';
};

// Helper function để format giá trị cho CSV
const formatCSVValue = (value) => {
  // Nếu là null hoặc undefined
  if (value === null || value === undefined) {
    return '';
  }
  
  // Nếu là object (như manufacturerId sau khi populate)
  if (typeof value === 'object' && value !== null) {
    // Nếu là Date object
    if (value instanceof Date) {
      return formatDate(value);
    }
    
    // Nếu có _id, dùng _id
    if (value._id) {
      return String(value._id);
    }
    // Nếu có fullName, dùng fullName
    if (value.fullName) {
      return String(value.fullName);
    }
    // Nếu có name, dùng name
    if (value.name) {
      return String(value.name);
    }
    // Nếu có organizationInfo.name, dùng nó
    if (value.organizationInfo?.name) {
      return String(value.organizationInfo.name);
    }
    // Nếu là array, join bằng dấu phẩy
    if (Array.isArray(value)) {
      return value.map(v => formatCSVValue(v)).join(', ');
    }
    // Mặc định: stringify object (tránh [object Object])
    try {
      return JSON.stringify(value);
    } catch (e) {
      return '';
    }
  }
  
  // Nếu là string có thể là date
  if (typeof value === 'string') {
    // Kiểm tra nếu có vẻ là date string (chứa GMT, Time, hoặc format dài)
    if (value.includes('GMT') || value.includes('Time') || /^\w{3}\s+\w{3}\s+\d{1,2}\s+\d{4}/.test(value)) {
      const formatted = formatDate(value);
      if (formatted && formatted !== value) {
        return formatted;
      }
    }
  }
  
  // Convert sang string và escape
  const str = String(value);
  // Escape quotes và newlines
  return str.replace(/"/g, '""').replace(/\n/g, ' ').replace(/\r/g, '');
};

// Simple CSV generator với xử lý object fields và UTF-8 BOM
const generateCSV = (data, fields) => {
  if (!data || data.length === 0) return '';
  
  // Get headers
  const headers = fields || Object.keys(data[0]);
  
  // Generate CSV với UTF-8 BOM để Excel hiển thị tiếng Việt đúng
  let csv = '\uFEFF'; // UTF-8 BOM
  csv += headers.join(',') + '\n';
  
  data.forEach(row => {
    const values = headers.map(header => {
      let value;
      
      // Xử lý nested fields (như manufacturerId.fullName)
      if (header.includes('.')) {
        value = header.split('.').reduce((obj, key) => obj?.[key], row) || '';
      } else {
        value = row[header];
      }
      
      // Format giá trị
      const formattedValue = formatCSVValue(value);
      
      // Wrap trong quotes và escape
      return `"${formattedValue}"`;
    });
    csv += values.join(',') + '\n';
  });
  
  return csv;
};

/**
 * Helper function để lấy giá trị từ row với nhiều tên cột
 */
const getValue = (row, columnNames) => {
  for (const colName of columnNames) {
    if (row[colName] !== undefined && row[colName] !== null && row[colName] !== '') {
      return String(row[colName]).trim();
    }
  }
  return null;
};

/**
 * Import Drugs từ CSV/Excel
 */
const importDrugsFromCSV = async (filePath, user, req = null) => {
  try {
    console.log('🔍 Starting CSV import from file:', filePath);
    const rows = await parseCSV(filePath);
    console.log('📊 Total rows to process:', rows.length);
    
    if (rows.length === 0) {
      return {
        success: false,
        imported: 0,
        errors: [{ error: 'File không có dữ liệu hoặc không đọc được' }],
        results: []
      };
    }
    
    // Log columns để debug
    if (rows.length > 0) {
      console.log('📋 Available columns:', Object.keys(rows[0]));
      console.log('📋 Sample row:', rows[0]);
    }
    
    const results = [];
    const errors = [];
    
    // Tìm manufacturer mặc định
    const User = require('../models/User');
    let manufacturerId = user._id;
    if (user.role !== 'manufacturer') {
      const manufacturer = await User.findOne({ role: 'manufacturer' });
      if (manufacturer) {
        manufacturerId = manufacturer._id;
      }
    }

    for (let index = 0; index < rows.length; index++) {
      const row = rows[index];
      try {
        // Helper function để lấy giá trị với nhiều tên cột
        const getRowValue = (columnNames) => {
          for (const colName of columnNames) {
            const value = row[colName];
            if (value !== undefined && value !== null && String(value).trim() !== '') {
              return String(value).trim();
            }
          }
          return null;
        };
        
        const name = getRowValue([
          'name', 'Tên thuốc', 'tên thuốc', 'Tên Thuốc', 'TÊN THUỐC'
        ]);
        
        const activeIngredient = getRowValue([
          'activeIngredient', 'Hoạt chất - Hàm lượng', 'hoạt chất - hàm lượng',
          'Hoạt chất', 'hoạt chất', 'Thành phần', 'thành phần',
          'Active Ingredient', 'ACTIVE INGREDIENT'
        ]);
        
        const dosage = getRowValue([
          'dosage', 'Liều lượng', 'liều lượng', 'Dosage', 'DOSAGE'
        ]) || 'Theo chỉ định';
        
        const formRaw = getRowValue([
          'form', 'Dạng bào chế', 'dạng bào chế', 'Dạng Bào Chế', 'DẠNG BÀO CHẾ'
        ]) || 'viên nén';
        
        // Áp dụng mapping
        const form = mapDrugFormToEnum(formRaw);
        console.log(`🔧 Row ${index + 1}: Mapping form "${formRaw}" → "${form}"`);
        
        const registrationNumber = getRowValue([
          'registrationNumber', 'SĐK Gia hạn (Mới)', 'SĐK Gia hạn', 
          'Số đăng ký', 'Số Đăng Ký', 'SĐK', 'SĐK Cũ',
          'SĐK Gia hạn (Mới SĐK Cũ)', 'Số ĐK gia hạn', 'Số ĐK cũ'
        ]);
        
        // Tạo batch number unique: dùng registrationNumber + index để đảm bảo unique
        const batchNumberRaw = getRowValue([
          'batchNumber', 'Số lô', 'số lô', 'Số Lô', 'SỐ LÔ', 'Batch Number'
        ]);
        const batchNumber = batchNumberRaw || `BATCH_${registrationNumber || 'UNKNOWN'}_${index + 1}_${Date.now()}`;
        
        const productionDate = getRowValue([
          'productionDate', 'Ngày sản xuất', 'ngày sản xuất', 'Ngày Sản Xuất'
        ]);
        
        const expiryDate = getRowValue([
          'expiryDate', 'Hạn sử dụng', 'hạn sử dụng', 'Hạn Sử Dụng', 'Ngày hết hạn'
        ]);
        
        // Validate required fields
        if (!name || name.trim() === '') {
          console.log(`❌ Row ${index + 1}: Thiếu tên thuốc - SKIP`);
          errors.push({ 
            row: index + 1, 
            rowData: row,
            error: 'Thiếu tên thuốc (name/Tên thuốc)' 
          });
          continue;
        }
        
        console.log(`✅ Row ${index + 1}: Processing "${name}" (Batch: ${batchNumber})`);
        
        // Đảm bảo form đã được map đúng (kiểm tra lại một lần nữa để chắc chắn)
        const finalForm = mapDrugFormToEnum(form || formRaw || 'viên nén');
        
        // Validate: Đảm bảo form là một trong các enum hợp lệ
        const validForms = ['viên nén', 'viên nang', 'siro', 'dung dịch tiêm', 'kem', 'gel', 'thuốc mỡ', 'cao khô', 'cao đặc', 'khác'];
        const validatedForm = validForms.includes(finalForm) ? finalForm : 'khác';
        
        if (finalForm !== validatedForm) {
          console.log(`⚠️ Row ${index + 1}: Form "${finalForm}" không hợp lệ, chuyển sang "khác"`);
        }
        
        // Tạo drug data với giá trị mặc định nếu thiếu
        const drugData = {
          name: name.trim(),
          activeIngredient: (activeIngredient || name).trim(),
          dosage: dosage.trim(),
          form: validatedForm, // Sử dụng giá trị đã map và validate
          batchNumber: batchNumber,
          productionDate: productionDate ? new Date(productionDate) : new Date(),
          expiryDate: expiryDate ? new Date(expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        };
        
        // Log để debug (nếu cần)
        if (validatedForm !== formRaw && formRaw) {
          console.log(`🔧 Row ${index + 1}: Form "${formRaw}" → "${validatedForm}"`);
        }
        
        // Validate ngày
        if (isNaN(drugData.productionDate.getTime())) {
          drugData.productionDate = new Date();
        }
        if (isNaN(drugData.expiryDate.getTime())) {
          drugData.expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        }
        
        // Đảm bảo expiryDate sau productionDate
        if (drugData.expiryDate <= drugData.productionDate) {
          drugData.expiryDate = new Date(drugData.productionDate.getTime() + 365 * 24 * 60 * 60 * 1000);
        }
        
        // Kiểm tra batch number đã tồn tại
        const existing = await Drug.findOne({ batchNumber: drugData.batchNumber });
        if (existing) {
          console.log(`⚠️ Row ${index + 1}: Batch number đã tồn tại "${drugData.batchNumber}" - SKIP`);
          errors.push({ 
            row: index + 1,
            rowData: row,
            error: 'Batch number đã tồn tại: ' + drugData.batchNumber 
          });
          continue;
        }
        
        // Đảm bảo form được map lại một lần nữa trước khi tạo drug
        drugData.form = mapDrugFormToEnum(drugData.form || formRaw || 'viên nén');
        const validFormsList = ['viên nén', 'viên nang', 'siro', 'dung dịch tiêm', 'kem', 'gel', 'thuốc mỡ', 'cao khô', 'cao đặc', 'khác'];
        if (!validFormsList.includes(drugData.form)) {
          console.log(`⚠️ Row ${index + 1}: Form "${drugData.form}" không hợp lệ, chuyển sang "khác"`);
          drugData.form = 'khác';
        }
        
        let drug;
        try {
          drug = await Drug.create({
            ...drugData,
            imageUrl: drugData.imageUrl || generateDrugImageDataUrl({
              name: drugData.name,
              activeIngredient: drugData.activeIngredient,
              dosage: drugData.dosage,
              form: drugData.form,
              certificateNumber: registrationNumber || `CV_${Date.now()}_${index + 1}`
            }),
            manufacturerId: manufacturerId,
            createdBy: user._id,
            qualityTest: {
              testDate: new Date(),
              testResult: 'đạt',
              testBy: 'Hệ thống',
              certificateNumber: registrationNumber || `CV_${Date.now()}_${index + 1}`
            }
          });
          console.log(`✅ Row ${index + 1}: Drug created successfully - ID: ${drug._id}`);
        } catch (createError) {
          console.error(`❌ Row ${index + 1}: Error creating drug:`, createError.message);
          if (createError.name === 'ValidationError') {
            const validationErrors = Object.values(createError.errors).map(err => err.message).join(', ');
            throw new Error(`Validation error: ${validationErrors}`);
          }
          throw createError;
        }
        
        // Blockchain integration
        const networkName = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
        if (!blockchainService.isInitialized || blockchainService.currentNetwork !== networkName) {
          await blockchainService.initialize(networkName);
        }
        
        let blockchainResult;
        try {
          blockchainResult = await blockchainService.recordDrugBatchOnBlockchain({
            ...drugData,
            drugId: drug.drugId,
            manufacturerId: drug.manufacturerId.toString()
          });
        } catch (error) {
          console.error('Error recording to blockchain:', error);
          blockchainResult = { success: false, error: error.message };
        }
        
        if (blockchainResult && blockchainResult.success) {
          const contractAddress = blockchainService.getContractAddress
            ? blockchainService.getContractAddress(blockchainService.currentNetwork)
            : (process.env.CONTRACT_ADDRESS_SEPOLIA || process.env.CONTRACT_ADDRESS || 'mock');
          
          drug.blockchain = {
            blockchainId: blockchainResult.blockchainId,
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber,
            blockchainTimestamp: blockchainResult.timestamp,
            digitalSignature: blockchainResult.signature,
            dataHash: blockchainResult.hash,
            isOnBlockchain: true,
            blockchainStatus: blockchainResult.mock ? 'pending' : 'confirmed',
            contractAddress: contractAddress,
            transactionHistory: [{
              transactionHash: blockchainResult.transactionHash,
              blockNumber: blockchainResult.blockNumber,
              timestamp: blockchainResult.timestamp,
              action: 'create',
              details: 'Tạo lô thuốc mới trên blockchain'
            }]
          };
          await drug.save();
          
          // Generate QR code
          const qrData = {
            drugId: drug.drugId,
            name: drug.name,
            batchNumber: drug.batchNumber,
            expiryDate: drug.expiryDate,
            manufacturerId: drug.manufacturerId,
            blockchainId: drug.blockchain?.blockchainId,
            timestamp: Date.now()
          };
          const serverUrl = getServerUrl();
          qrData.verificationUrl = `${serverUrl}/verify/${drug.blockchain?.blockchainId || drug.drugId}`;
          
          const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
          drug.qrCode = {
            data: JSON.stringify(qrData),
            imageUrl: qrCodeDataURL,
            generatedAt: new Date(),
            blockchainId: drug.blockchain?.blockchainId,
            verificationUrl: qrData.verificationUrl
          };
          await drug.save();
        } else {
          drug.blockchain = {
            isOnBlockchain: false,
            blockchainStatus: 'pending',
            lastUpdated: new Date(),
            transactionHistory: [],
            error: blockchainResult?.error || 'Unknown error'
          };
          await drug.save();
        }
        
        results.push(drug);
        console.log(`✅ Row ${index + 1}: Successfully imported "${name}"`);
      } catch (error) {
        console.error(`❌ Row ${index + 1}: Error importing:`, error.message);
        console.error(`   Stack:`, error.stack);
        errors.push({ 
          row: index + 1,
          rowData: row,
          error: error.message,
          stack: error.stack
        });
      }
    }
    
    console.log('📊 ========================================');
    console.log(`📊 Import completed:`);
    console.log(`   ✅ Successful: ${results.length}/${rows.length}`);
    console.log(`   ❌ Errors: ${errors.length}/${rows.length}`);
    console.log('📊 ========================================');
    
    // Log chi tiết errors nếu có
    if (errors.length > 0) {
      console.log('📋 Error details:');
      errors.forEach((err, idx) => {
        console.log(`   ${idx + 1}. Row ${err.row}: ${err.error}`);
      });
    }

    // Ghi audit log
    await auditService.logCRUD.create(
      user,
      'Drug',
      null,
      { imported: results.length, errors: errors.length },
      'drug',
      req,
      `Import drugs từ CSV/Excel: ${results.length} thành công, ${errors.length} lỗi`
    );

    return {
      success: results.length > 0,
      imported: results.length,
      errors: errors,
      results,
      errors: errors
    };
  } catch (error) {
    console.error('❌ Error in importDrugsFromCSV:', error);
    throw error;
  }
};

/**
 * Import Inventory từ CSV
 */
const importInventoryFromCSV = async (filePath, user, req = null) => {
  try {
    const rows = await parseCSV(filePath);
    const results = [];
    const errors = [];

    for (const row of rows) {
      try {
        const inventoryData = {
          drugId: row.drugId || row['Mã thuốc'],
          locationId: row.locationId || row['Location ID'],
          locationName: row.locationName || row['Tên địa điểm'],
          quantity: parseInt(row.quantity || row['Số lượng']),
          unit: row.unit || row['Đơn vị'] || 'viên',
          unitPrice: parseFloat(row.unitPrice || row['Giá đơn vị'] || 0)
        };

        // Tìm drug
        const drug = await Drug.findOne({ drugId: inventoryData.drugId });
        if (!drug) {
          errors.push({ row, error: 'Không tìm thấy thuốc' });
          continue;
        }

        // Tìm hoặc tạo inventory
        let inventory = await Inventory.findOne({
          drugId: inventoryData.drugId,
          'location.locationId': inventoryData.locationId
        });

        if (inventory) {
          // Cập nhật số lượng
          inventory.quantity += inventoryData.quantity;
          await inventory.save();
        } else {
          // Tạo mới
          inventory = await Inventory.create({
            drug: drug._id,
            drugId: drug.drugId,
            drugName: drug.name,
            batchNumber: drug.batchNumber,
            location: {
              type: 'warehouse',
              locationId: inventoryData.locationId,
              locationName: inventoryData.locationName
            },
            quantity: inventoryData.quantity,
            unit: inventoryData.unit,
            unitPrice: inventoryData.unitPrice,
            expiryDate: drug.expiryDate,
            productionDate: drug.productionDate,
            createdBy: user._id
          });
        }

        results.push(inventory);
      } catch (error) {
        errors.push({ row, error: error.message });
      }
    }

    await auditService.createAuditLog({
      user,
      action: 'data_import',
      module: 'import_export',
      description: `Import inventory từ CSV: ${results.length} thành công`,
      metadata: {
        type: 'inventory',
        format: 'csv',
        success: results.length,
        errors: errors.length
      },
      severity: 'medium'
    }, req);

    return {
      success: true,
      imported: results.length,
      errors: errors.length,
      results,
      errors
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export Drugs ra CSV
 */
const exportDrugsToCSV = async (filters = {}, user, req = null) => {
  try {
    const drugs = await Drug.find(filters)
      .populate('manufacturerId', 'fullName organizationInfo')
      .lean();

    // Flatten nested fields để tránh [object Object]
    const flattenedDrugs = drugs.map(drug => ({
      drugId: drug.drugId || '',
      name: drug.name || '',
      activeIngredient: drug.activeIngredient || '',
      dosage: drug.dosage || '',
      form: drug.form || '',
      batchNumber: drug.batchNumber || '',
      productionDate: drug.productionDate ? (drug.productionDate instanceof Date ? drug.productionDate.toISOString().split('T')[0] : drug.productionDate) : '',
      expiryDate: drug.expiryDate ? (drug.expiryDate instanceof Date ? drug.expiryDate.toISOString().split('T')[0] : drug.expiryDate) : '',
      manufacturerId: drug.manufacturerId 
        ? (drug.manufacturerId.fullName || drug.manufacturerId.organizationInfo?.name || drug.manufacturerId._id || '')
        : '',
      registrationNumber: drug.registrationNumber || '',
      packaging: drug.packaging || '',
      unit: drug.unit || '',
      price: drug.price || '',
      status: drug.status || ''
    }));

    const fields = [
      'drugId',
      'name',
      'activeIngredient',
      'dosage',
      'form',
      'batchNumber',
      'productionDate',
      'expiryDate',
      'manufacturerId',
      'registrationNumber',
      'packaging',
      'unit',
      'price',
      'status'
    ];

    const csvData = generateCSV(flattenedDrugs, fields);

    // Ghi audit log
    await auditService.createAuditLog({
      user,
      action: 'data_export',
      module: 'import_export',
      description: `Export drugs ra CSV: ${drugs.length} records`,
      metadata: {
        type: 'drugs',
        format: 'csv',
        count: drugs.length
      },
      severity: 'low'
    }, req);

    return {
      success: true,
      data: csvData,
      count: drugs.length
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export Inventory ra CSV
 */
const exportInventoryToCSV = async (filters = {}, user, req = null) => {
  try {
    const items = await Inventory.find(filters)
      .populate('drug', 'name drugId')
      .lean();

    // Helper để format date
    const formatDateValue = (dateValue) => {
      if (!dateValue) return '';
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0]; // YYYY-MM-DD
      }
      if (typeof dateValue === 'string') {
        // Nếu đã là YYYY-MM-DD, trả về luôn
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
          return dateValue;
        }
        // Thử parse string date
        const parsed = new Date(dateValue);
        if (!isNaN(parsed.getTime())) {
          return parsed.toISOString().split('T')[0];
        }
      }
      return '';
    };

    // Flatten nested fields for CSV
    const flattenedItems = items.map(item => ({
      drugId: item.drugId || '',
      drugName: item.drugName || (item.drug?.name || ''),
      batchNumber: item.batchNumber || '',
      locationId: item.location?.locationId || '',
      locationName: item.location?.locationName || '',
      quantity: item.quantity || 0,
      unit: item.unit || '',
      unitPrice: item.unitPrice || 0,
      totalValue: item.totalValue || (item.quantity * item.unitPrice) || 0,
      expiryDate: formatDateValue(item.expiryDate),
      status: item.status || ''
    }));

    const fields = [
      'drugId',
      'drugName',
      'batchNumber',
      'locationId',
      'locationName',
      'quantity',
      'unit',
      'unitPrice',
      'totalValue',
      'expiryDate',
      'status'
    ];

    const csvData = generateCSV(flattenedItems, fields);

    await auditService.createAuditLog({
      user,
      action: 'data_export',
      module: 'import_export',
      description: `Export inventory ra CSV: ${items.length} records`,
      metadata: {
        type: 'inventory',
        format: 'csv',
        count: items.length
      },
      severity: 'low'
    }, req);

    return {
      success: true,
      data: csvData,
      count: items.length
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export Orders ra CSV
 */
const exportOrdersToCSV = async (filters = {}, user, req = null) => {
  try {
    const orders = await Order.find(filters)
      .populate('items')
      .lean();

    // Flatten nested fields
    const flattenedOrders = orders.map(order => ({
      orderNumber: order.orderNumber || '',
      orderType: order.orderType || '',
      status: order.status || '',
      buyerName: order.buyerName || '',
      sellerName: order.sellerName || '',
      orderDate: order.orderDate ? (order.orderDate instanceof Date ? order.orderDate.toISOString().split('T')[0] : order.orderDate) : '',
      totalAmount: order.totalAmount || 0,
      paymentStatus: order.paymentStatus || ''
    }));

    const fields = [
      'orderNumber',
      'orderType',
      'status',
      'buyerName',
      'sellerName',
      'orderDate',
      'totalAmount',
      'paymentStatus'
    ];

    const csvData = generateCSV(flattenedOrders, fields);

    await auditService.createAuditLog({
      user,
      action: 'data_export',
      module: 'import_export',
      description: `Export orders ra CSV: ${orders.length} records`,
      metadata: {
        type: 'orders',
        format: 'csv',
        count: orders.length
      },
      severity: 'low'
    }, req);

    return {
      success: true,
      data: csvData,
      count: orders.length
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Export Invoices ra CSV
 */
const exportInvoicesToCSV = async (filters = {}, user, req = null) => {
  try {
    const invoices = await Invoice.find(filters).lean();

    // Flatten nested fields
    const flattenedInvoices = invoices.map(invoice => ({
      invoiceNumber: invoice.invoiceNumber || '',
      invoiceType: invoice.invoiceType || '',
      status: invoice.status || '',
      buyerName: invoice.buyerInfo?.name || '',
      sellerName: invoice.sellerInfo?.name || '',
      issueDate: invoice.issueDate ? (invoice.issueDate instanceof Date ? invoice.issueDate.toISOString().split('T')[0] : invoice.issueDate) : '',
      dueDate: invoice.dueDate ? (invoice.dueDate instanceof Date ? invoice.dueDate.toISOString().split('T')[0] : invoice.dueDate) : '',
      totalAmount: invoice.totalAmount || 0,
      paidAmount: invoice.paidAmount || 0,
      dueAmount: invoice.dueAmount || 0,
      paymentStatus: invoice.paymentStatus || ''
    }));

    const fields = [
      'invoiceNumber',
      'invoiceType',
      'status',
      'buyerName',
      'sellerName',
      'issueDate',
      'dueDate',
      'totalAmount',
      'paidAmount',
      'dueAmount',
      'paymentStatus'
    ];

    const csvData = generateCSV(flattenedInvoices, fields);

    await auditService.createAuditLog({
      user,
      action: 'data_export',
      module: 'import_export',
      description: `Export invoices ra CSV: ${invoices.length} records`,
      metadata: {
        type: 'invoices',
        format: 'csv',
        count: invoices.length
      },
      severity: 'low'
    }, req);

    return {
      success: true,
      data: csvData,
      count: invoices.length
    };
  } catch (error) {
    throw error;
  }
};

// ==========================================
// PHẦN LOGIC PARSE PDF MỚI (BUFFER STRATEGY)
// ==========================================

/**
 * Hàm sửa lỗi font tiếng Việt bị tách chữ từ PDF
 * @param {string} text - Chuỗi gốc bị lỗi (VD: "d ưới d ạng")
 * @return {string} - Chuỗi đã sửa (VD: "dưới dạng")
 */
function fixVietnameseSpacing(text) {
  if (!text) return "";
  
  let fixedText = text;

  // PHƯƠNG PHÁP 1: Sửa các từ ghép cụ thể (ưu tiên)
  const commonErrors = [
    // Các từ thường gặp trong văn bản dược phẩm
    { regex: /d\s+ưới/gi, replace: "dưới" },
    { regex: /d\s+ạng/gi, replace: "dạng" },
    { regex: /h\s+ộp/gi, replace: "hộp" },
    { regex: /v\s+iên/gi, replace: "viên" },
    { regex: /n\s+én/gi, replace: "nén" },
    { regex: /n\s+ang/gi, replace: "nang" },
    { regex: /l\s+ọ/gi, replace: "lọ" },
    { regex: /t\s+úi/gi, replace: "túi" },
    { regex: /g\s+ói/gi, replace: "gói" },
    { regex: /d\s+ung/gi, replace: "dung" },
    { regex: /d\s+ịch/gi, replace: "dịch" },
    { regex: /t\s+huốc/gi, replace: "thuốc" },
    { regex: /c\s+ốm/gi, replace: "cốm" },
    { regex: /p\s+ha/gi, replace: "pha" },
    { regex: /k\s+hác/gi, replace: "khác" },
    { regex: /x\s+uất/gi, replace: "xuất" },
    { regex: /s\s+ản/gi, replace: "sản" },
    { regex: /q\s+uản/gi, replace: "quản" },
    { regex: /l\s+ý/gi, replace: "lý" },
    { regex: /đ\s+ược/gi, replace: "được" },
    { regex: /c\s+ủa/gi, replace: "của" },
    { regex: /n\s+gày/gi, replace: "ngày" },
    { regex: /t\s+ại/gi, replace: "tại" },
    { regex: /c\s+ột/gi, replace: "cột" },
    { regex: /c\s+hất/gi, replace: "chất" },
    { regex: /l\s+ượng/gi, replace: "lượng" },
    { regex: /t\s+iêu/gi, replace: "tiêu" },
    { regex: /c\s+huẩn/gi, replace: "chuẩn" },
    { regex: /n\s+hà/gi, replace: "nhà" },
    { regex: /m\s+ỗi/gi, replace: "mỗi" },
    { regex: /v\s+à/gi, replace: "và" },
    { regex: /t\s+ương/gi, replace: "tương" },
    { regex: /ứ\s+ng/gi, replace: "ứng" },
    { regex: /b\s+ột/gi, replace: "bột" },
    { regex: /h\s+ỗn/gi, replace: "hỗn" },
    { regex: /k\s+em/gi, replace: "kem" },
    { regex: /b\s+ôi/gi, replace: "bôi" },
    { regex: /d\s+a/gi, replace: "da" },
    { regex: /x\s+ịt/gi, replace: "xịt" },
    { regex: /m\s+ũi/gi, replace: "mũi" },
    { regex: /c\s+hai/gi, replace: "chai" },
    { regex: /m\s+l/gi, replace: "ml" },
    { regex: /m\s+g/gi, replace: "mg" },
    { regex: /g\s+/gi, replace: "g " },
    { regex: /v\s+ỉ/gi, replace: "vỉ" },
    { regex: /ố\s+ng/gi, replace: "ống" },
    { regex: /t\s+uýp/gi, replace: "tuýp" },
    { regex: /t\s+úyp/gi, replace: "tuýp" },
    { regex: /h\s+oạt/gi, replace: "hoạt" },
    { regex: /h\s+óa/gi, replace: "hóa" },
    { regex: /n\s+ước/gi, replace: "nước" },
    { regex: /t\s+hành/gi, replace: "thành" },
    { regex: /p\s+hố/gi, replace: "phố" },
    { regex: /t\s+ỉnh/gi, replace: "tỉnh" },
    { regex: /n\s+am/gi, replace: "nam" },
    { regex: /v\s+iệt/gi, replace: "việt" },
    // Các từ hóa học và dược phẩm bị tách
    { regex: /g\s+astrolium/gi, replace: "Gastrolium" },
    { regex: /a\s+ttapulgite/gi, replace: "Attapulgite" },
    { regex: /a\s+ttapulg\s+ite/gi, replace: "Attapulgite" },
    { regex: /g\s+el/gi, replace: "Gel" },
    { regex: /m\s+agnesi/gi, replace: "magnesi" },
    { regex: /m\s+ag\s+nesi/gi, replace: "magnesi" },
    { regex: /m\s+ormoiron/gi, replace: "Mormoiron" },
    { regex: /h\s+ydroxyde/gi, replace: "hydroxyde" },
    { regex: /c\s+arbonate/gi, replace: "carbonate" },
    { regex: /h\s+oạt\s+hóa/gi, replace: "hoạt hóa" },
    // Thêm các từ bị tách phức tạp hơn
    { regex: /t\s+ỉ\s+êu/gi, replace: "tiêu" },
    { regex: /c\s+h\s+uẩn/gi, replace: "chuẩn" },
    { regex: /c\s+h\s+ất/gi, replace: "chất" },
    { regex: /l\s+ư\s+ợng/gi, replace: "lượng" },
    { regex: /n\s+h\s+à/gi, replace: "nhà" },
    { regex: /s\s+ả\s+n/gi, replace: "sản" },
    { regex: /x\s+u\s+ất/gi, replace: "xuất" },
    { regex: /v\s+ỉ\s+/gi, replace: "vỉ " },
    { regex: /v\s+i\s+ên/gi, replace: "viên" },
    { regex: /n\s+é\s+n/gi, replace: "nén" },
    { regex: /g\s+ó\s+i/gi, replace: "gói" },
    { regex: /h\s+ộ\s+p/gi, replace: "hộp" },
    { regex: /t\s+ư\s+ơng/gi, replace: "tương" },
    { regex: /ứ\s+n\s+g/gi, replace: "ứng" },
  ];

  // Thực hiện thay thế
  commonErrors.forEach(item => {
    fixedText = fixedText.replace(item.regex, item.replace);
  });

  // PHƯƠNG PHÁP 2: Pattern tổng quát - Sửa chữ cái + space + dấu thanh tiếng Việt
  // Pattern: [chữ cái thường] + space + [dấu thanh: áàảãạăắằẳẵặâấầẩẫậéèẻẽẹêếềểễệíìỉĩịóòỏõọôốồổỗộơớờởỡợúùủũụưứừửữựýỳỷỹỵđ]
  const vietnameseToneMarks = /([a-zàáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ])\s+([àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđ])/gi;
  fixedText = fixedText.replace(vietnameseToneMarks, '$1$2');

  // PHƯƠNG PHÁP 3: Sửa các trường hợp đặc biệt (chữ + space + chữ có dấu)
  // VD: "v i" -> "vỉ", "g ói" -> "gói"
  const specialCases = [
    { regex: /\bv\s+i\b/gi, replace: "vỉ" },
    { regex: /\bg\s+ói\b/gi, replace: "gói" },
    { regex: /\bh\s+ộp\b/gi, replace: "hộp" },
    { regex: /\bv\s+iên\b/gi, replace: "viên" },
    { regex: /\bn\s+én\b/gi, replace: "nén" },
  ];
  specialCases.forEach(item => {
    fixedText = fixedText.replace(item.regex, item.replace);
  });

  // Xóa khoảng trắng kép thành đơn
  return fixedText.replace(/\s+/g, ' ').trim();
}

/**
 * Kiểm tra xem dòng này có phải là dòng rác (không phải thuốc) không
 */
const JUNK_KEYWORDS = [
  "số đăng ký tại cột",
  "cách ghi tiêu chuẩn",
  "cách ghi tỉ êu chu ẩn", // Chữ bị tách
  "cách ghi t iêu chu ẩn", // Chữ bị tách
  "dược điển",
  "bộ trưởng",
  "cục quản lý dược",
  "cộng hoà",
  "bộ y tế",
  "quyết định",
  "căn cứ",
  "nghị định",
  "thông tư",
  "điều",
  "ban hành",
  "danh mục",
  "ghi chú",
  "lưu:",
  "như điều",
  "nhà sản xuất", // Nếu chỉ có từ này mà không có số đăng ký
  "tiêu chuẩn nhà sản xuất",
  "tccs",
  "tcnsx"
];

function isValidDrugLine(line) {
  if (!line || line.length < 5) return false;
  
  // Áp dụng fixVietnameseSpacing để kiểm tra chính xác hơn
  const cleanedLine = fixVietnameseSpacing(line);
  const lower = cleanedLine.toLowerCase();
  
  // Nếu chứa từ khóa rác -> trả về false (bỏ qua)
  if (JUNK_KEYWORDS.some(key => {
    // Kiểm tra cả trường hợp chữ bị tách
    const keyLower = key.toLowerCase();
    return lower.includes(keyLower) || 
           lower.includes(keyLower.replace(/\s+/g, ' ')) ||
           // Kiểm tra pattern: "cách ghi" có thể là "c ách g hi"
           (keyLower.includes("cách ghi") && lower.match(/c\s*ách\s*g\s*hi/i));
  })) {
    return false;
  }
  
  // Loại bỏ các dòng chỉ có số và ký tự đặc biệt
  if (/^[\d\.\s\-\(\)]+$/.test(line)) {
    return false;
  }
  
  // Loại bỏ các dòng chỉ là hướng dẫn (chứa "tại cột" hoặc "cách ghi" mà không có số đăng ký)
  if ((lower.includes("tại cột") || lower.includes("cách ghi")) && 
      !line.match(/\d{12}/) && 
      !line.match(/[VDIS]{2,3}\d?-\d{4,5}-\d{2,3}/i)) {
    return false;
  }
  
  return true;
}

/**
 * Kiểm tra xem dòng này có phải là tín hiệu bắt đầu một thuốc mới không
 * Updated: Xử lý lỗi font PDF (dính chữ, mất khoảng trắng)
 */
const isNewDrugSignal = (line) => {
  // 1. Làm sạch dòng text: Loại bỏ ký tự rác và khoảng trắng thừa
  const t = line.replace(/[\u0000-\u001F\u007F-\u009F]/g, "").trim();
  
  // 2. Tín hiệu STT (Mạnh mẽ hơn): 
  // Chấp nhận: "1.", "1)", "1 " hoặc "1TênThuốc" (trường hợp mất space)
  // Logic: Bắt đầu bằng số 1-3 chữ số, theo sau là chấm/ngoặc HOẶC chữ cái viết hoa/tiếng Việt
  const strongSTT = /^(?:"?)\d{1,3}(?:"?)(?:[\.\)\s]+|(?=[A-ZÀ-Ỹ]))/.test(t);
  
  // 3. Tín hiệu SĐK (Regex tìm SĐK 12 số hoặc VD-... nằm độc lập)
  const hasRegNo = /(\b\d{12}\b)|(\b[A-Z]{2,3}\d{0,1}-\d{4,5}-\d{2,3}\b)/i.test(t);

  // 4. Loại trừ các dòng hệ thống (System lines) và dòng rác
  const lower = t.toLowerCase();
  
  // Loại trừ các dòng bắt đầu bằng số + chấm + từ khóa rác (VD: "1. Cách ghi...", "2. Số đăng ký...")
  if (/^\d+\.\s*(cách ghi|số đăng ký|ghi chú|điều|ban hành|danh mục|phụ lục|cơ sở)/i.test(lower)) {
    return false;
  }
  
  const isSystemLine = 
    /^(?:1\.|2\.)\s*(?:cơ sở|điều|ban hành|danh mục|phụ lục)/i.test(lower) ||
    lower.includes("stttên thuốc") || // Header dính
    lower.includes("stt tên thuốc") ||
    lower.startsWith("ghi chú") ||
    lower.startsWith("cộng hoà") ||
    lower.startsWith("bộ y tế") ||
    lower.includes("cách ghi tiêu chuẩn") ||
    lower.includes("số đăng ký tại cột") ||
    lower.includes("dược điển") ||
    lower.includes("bộ trưởng") ||
    lower.includes("cục quản lý dược");

  if (isSystemLine) return false;
  
  // Kiểm tra dòng rác
  if (!isValidDrugLine(line)) return false;

  // Logic quyết định:
  if (strongSTT) return true;
  
  // Nếu không có STT nhưng có SĐK và dòng đủ dài (tránh bắt nhầm SĐK nằm lửng lơ ở dòng quy cách)
  if (hasRegNo && t.length > 15 && !t.startsWith("Hộp") && !t.startsWith("Chai")) return true; 

  return false;
};

/**
 * Kiểm tra dòng thông tin công ty/bối cảnh
 */
const isContextLine = (line) => {
  const t = line.toLowerCase();
  return t.includes('cơ sở đăng ký') || 
         t.includes('cơ sở sản xuất') || 
         t.includes('phụ lục') ||
         (t.includes('hiệu lực') && (t.includes('năm') || t.includes('đến')));
};

/**
 * Xử lý Buffer (Updated v3 - Fix Validation Error & Better Split)
 */
const processDrugBuffer = (buffer, context) => {
  if (!buffer || buffer.length === 0) return null;

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importExportService.js:processDrugBuffer',message:'BUFFER_INPUT',data:{bufferLength:buffer.length,bufferLines:buffer.slice(0,3),timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion

  // 1. Gộp dòng và xử lý dính chữ cơ bản
  let fullText = buffer.join(' ').replace(/\s+/g, ' ').trim();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importExportService.js:processDrugBuffer',message:'FULLTEXT_AFTER_JOIN',data:{fullText:fullText.substring(0,200),length:fullText.length,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H1'})}).catch(()=>{});
  // #endregion
  
  // Fix dính chữ - Cải thiện logic để xử lý tốt hơn các cột bị dính trong bảng PDF
  // Thứ tự quan trọng: xử lý pattern cụ thể trước, sau đó mới xử lý pattern chung
  
  // PHASE 1: Xử lý các pattern đặc biệt trong dược phẩm (ưu tiên cao nhất)
  // Pattern: "5mgViên" -> "5mg Viên", "10mlHộp" -> "10ml Hộp", "250mgViên" -> "250mg Viên"
  fullText = fullText.replace(/(\d+(?:,\d+)?)\s*(mg|ml|g|kg|%)\s*([A-ZÀ-Ỹ])/gi, '$1$2 $3');
  // Pattern: "5mgViên nén" -> "5mg Viên nén" (không có space giữa mg và Viên)
  fullText = fullText.replace(/(\d+(?:,\d+)?)(mg|ml|g|kg|%)([A-ZÀ-Ỹ])/gi, '$1$2 $3');
  
  // Pattern: "viênHộp" -> "viên Hộp", "góiHộp" -> "gói Hộp", "chaiHộp" -> "chai Hộp"
  fullText = fullText.replace(/(viên|gói|chai|hộp|vỉ|lọ|tuýp|ống|can)([A-ZÀ-Ỹ])/gi, '$1 $2');
  // Pattern: "Viên nénHộp" -> "Viên nén Hộp"
  fullText = fullText.replace(/(viên\s+nén|viên\s+nang|dung\s+dịch|bột\s+pha|thuốc\s+bột|thuốc\s+cốm|siro|kem|hỗn\s+dịch|thuốc\s+xịt|thuốc\s+mỡ|nguyên\s+liệu)([A-ZÀ-Ỹ])/gi, '$1 $2');
  
  // Pattern: "mgViên" -> "mg Viên" (không có số trước)
  fullText = fullText.replace(/(mg|ml|g|kg|%)([A-ZÀ-Ỹ])/gi, '$1 $2');
  
  // PHASE 2: Xử lý dính chữ giữa các từ (pattern chung)
  // Pattern: Số + chữ hoa (1Iodine -> 1 Iodine, 2Prednison -> 2 Prednison)
  fullText = fullText.replace(/(\d{1,3})([A-ZÀ-Ỹ][a-zà-ỹ])/g, '$1 $2');
  
  // Pattern: Chữ thường + chữ hoa (IodinePovidone -> Iodine Povidone, Prednison5mg -> Prednison 5mg)
  fullText = fullText.replace(/([a-zà-ỹ])([A-ZÀ-Ỹ])/g, '$1 $2');
  
  // Pattern: Chữ hoa + chữ hoa (nếu sau đó là chữ thường) - nhưng giữ nguyên viết tắt như "A.F."
  // Tránh tách "A.F." thành "A. F."
  fullText = fullText.replace(/([A-ZÀ-Ỹ])([A-ZÀ-Ỹ][a-zà-ỹ])/g, '$1 $2');
  
  // Pattern: Số + chữ thường (5mg -> giữ nguyên, nhưng 5viên -> 5 viên)
  fullText = fullText.replace(/(\d)(viên|gói|chai|hộp|vỉ|lọ|tuýp|ống)/gi, '$1 $2');
  
  // PHASE 3: Xử lý các pattern đặc biệt trong tên thuốc và hoạt chất
  // Pattern: "Acid/Acid" -> "Acid / Acid" (dấu gạch chéo)
  fullText = fullText.replace(/([a-zà-ỹ])\/([A-ZÀ-Ỹ])/gi, '$1 / $2');
  
  // Pattern: Tên thuốc có số và chữ dính: "Midantin 250/31,25" -> giữ nguyên, nhưng "250/31,25Acid" -> "250/31,25 Acid"
  fullText = fullText.replace(/(\d+\/\d+(?:,\d+)?)([A-ZÀ-Ỹ])/gi, '$1 $2');
  
  // Pattern: "dưới dạng" bị dính: "dướidạng" -> "dưới dạng"
  fullText = fullText.replace(/(dưới)(dạng)/gi, '$1 $2');
  
  // Pattern: Các từ tiếng Việt bị dính: "trihydrat" -> giữ nguyên, nhưng "trihydratAcid" -> "trihydrat Acid"
  fullText = fullText.replace(/(trihydrat|monohydrat|dihydrat|hexahydrat|proxetil|citrat|phosphat|sulfat|hydroclorid|hydrochlorid|valerat|propionat|maleat|attapulgite|magnesi|mormoiron|hydroxyde|carbonate|gastrolium)([A-ZÀ-Ỹ])/gi, '$1 $2');
  
  // PHASE 4: Xử lý các từ hóa học bị tách (chữ thường + space + chữ thường)
  // Pattern: "g astrolium" -> "Gastrolium", "g el" -> "Gel", "mag nesi" -> "magnesi"
  fullText = fullText.replace(/\b(g)\s+(astrolium|el)\b/gi, (match, p1, p2) => {
    if (p2.toLowerCase() === 'astrolium') return 'Gastrolium';
    if (p2.toLowerCase() === 'el') return 'Gel';
    return match;
  });
  fullText = fullText.replace(/\b(mag)\s+(nesi)\b/gi, 'magnesi');
  fullText = fullText.replace(/\b(a)\s+(ttapulgite)\b/gi, 'Attapulgite');
  fullText = fullText.replace(/\b(a)\s+(ttapulg)\s+(ite)\b/gi, 'Attapulgite');
  
  // Loại bỏ các từ khóa rác ở đầu dòng nếu có (VD: "1. Cách ghi...", "2. Số đăng ký...")
  // Kiểm tra cả trường hợp chữ bị tách: "Cách ghi" có thể là "C ách g hi"
  const cleanedForCheck = fixVietnameseSpacing(fullText);
  if (cleanedForCheck.match(/^\d+\.\s*(Cách ghi|Số đăng ký)/i)) return null;
  if (fullText.match(/^\d+\.\s*Cách\s+ghi/i)) return null;
  if (fullText.match(/^\d+\.\s*Số\s+đăng\s+ký/i)) return null;
  
  // Kiểm tra nếu toàn bộ buffer chỉ là hướng dẫn (không có số đăng ký và tên thuốc hợp lệ)
  if (cleanedForCheck.toLowerCase().includes("cách ghi tiêu chuẩn") && 
      !cleanedForCheck.match(/\d{12}/) && 
      !cleanedForCheck.match(/[VDIS]{2,3}\d?-\d{4,5}-\d{2,3}/i)) {
    return null;
  }
  if (cleanedForCheck.toLowerCase().includes("số đăng ký tại cột") && 
      !cleanedForCheck.match(/\d{12}/) && 
      !cleanedForCheck.match(/[VDIS]{2,3}\d?-\d{4,5}-\d{2,3}/i)) {
    return null;
  }
  
  // Áp dụng fixVietnameseSpacing để sửa lỗi chữ bị tách
  fullText = fixVietnameseSpacing(fullText);

  const drugInfo = {
    stt: '',
    name: '',
    activeIngredient: '',
    form: 'viên nén',
    registrationNumber: '',
    oldRegistrationNumber: '',
    shelfLife: null,
    expiryDate: null,
    registrationFacility: context.registrationFacility,
    registrationFacilityAddress: context.registrationFacilityAddress,
    manufacturingFacility: context.manufacturingFacility,
    manufacturingFacilityAddress: context.manufacturingFacilityAddress,
    appendix: context.appendix,
    validityPeriod: context.validityPeriod,
    validityDate: context.validityDate,
    packaging: '', // Quy cách đóng gói
    standard: '', // Tiêu chuẩn
    notes: '' // Ghi chú đặc biệt (cho Phụ lục II)
  };

  // 2. Tách STT - Cải thiện để xử lý trường hợp không có khoảng trắng sau STT
  // Pattern: số 1-3 chữ số, theo sau là dấu chấm/ngoặc/khoảng trắng HOẶC chữ cái viết hoa
  const sttMatch = fullText.match(/^(?:"?)(\d{1,3})(?:"?)(?:[\.\)\s]+|(?=[A-ZÀ-Ỹ]))/);
  let contentWithoutSTT = fullText;
  if (sttMatch) {
    drugInfo.stt = sttMatch[1];
    const sttEndIndex = sttMatch[0].length;
    contentWithoutSTT = fullText.substring(sttEndIndex).trim();
    
    // Nếu sau STT là chữ cái viết hoa (không có khoảng trắng), thêm khoảng trắng
    if (contentWithoutSTT && /^[A-ZÀ-Ỹ]/.test(contentWithoutSTT)) {
      // Không cần thêm khoảng, sẽ xử lý ở bước sau
    }
  } else {
    // Nếu không có STT, bỏ qua nếu dòng quá ngắn (rác)
    if (fullText.length < 20) return null;
    drugInfo.stt = `AUTO_${Date.now().toString().slice(-4)}`;
  }

  // 3. Tìm SĐK (Neo quan trọng) - Cải thiện theo cấu trúc công văn Bộ Y tế
  // Pattern: SĐK mới (12 số) có thể kèm SĐK cũ trong ngoặc đơn: "893100493025 (VS-4878-14)"
  // Hoặc format: "893100493025 (VD-22739-15)" - SĐK mới 12 số, SĐK cũ trong ngoặc
  const reg12Match = contentWithoutSTT.match(/(\d{12})/);
  // Pattern SĐK cũ: VD-22739-15, VS-4878-14, VD3-99-21, VD-33603-19, etc.
  const regOldMatch = contentWithoutSTT.match(/\(([A-Z]{2,3}\d{0,1}-\d{4,5}-\d{2,3})\)/i); // Tìm trong ngoặc đơn
  let splitIndex = -1;

  if (reg12Match) {
    drugInfo.registrationNumber = reg12Match[0];
    splitIndex = contentWithoutSTT.indexOf(reg12Match[0]);
    
    // Tìm SĐK cũ trong ngoặc đơn sau SĐK mới (có thể ngay sau hoặc cách một vài ký tự)
    // Pattern: "893100493025 (VD-22739-15)" hoặc "893100493025(VD-22739-15)"
    const afterReg12 = contentWithoutSTT.substring(reg12Match.index + 12);
    const oldRegInParen = afterReg12.match(/\(([A-Z]{2,3}\d{0,1}-\d{4,5}-\d{2,3})\)/i);
    if (oldRegInParen) {
      drugInfo.oldRegistrationNumber = oldRegInParen[1]; // Lấy nội dung trong ngoặc, không lấy dấu ngoặc
    }
    
    // Nếu không tìm thấy trong ngoặc, thử tìm pattern cũ (không có ngoặc) ngay sau SĐK mới
    if (!drugInfo.oldRegistrationNumber) {
      const regOldMatchNoParen = afterReg12.match(/\s+([A-Z]{2,3}\d{0,1}-\d{4,5}-\d{2,3})\b/i);
      if (regOldMatchNoParen) {
        drugInfo.oldRegistrationNumber = regOldMatchNoParen[1];
      }
    }
  } else if (regOldMatch) {
    // Chỉ có SĐK cũ (không có SĐK mới 12 số) - trường hợp hiếm
    drugInfo.oldRegistrationNumber = regOldMatch[1];
    drugInfo.registrationNumber = regOldMatch[1]; // Dùng SĐK cũ làm SĐK chính
    splitIndex = contentWithoutSTT.indexOf(regOldMatch[0]);
  }

  // 4. Tìm Tuổi thọ (tháng) - Cải thiện theo công văn Bộ Y tế
  // Pattern: "36", "24", "48" (có thể có "tháng" sau)
  // Tìm số 2 chữ số (24, 36, 48) hoặc 3 chữ số (60) đứng độc lập hoặc có "tháng" sau
  const shelfLifeMatch = contentWithoutSTT.match(/\b(24|36|48|60)\s*(?:tháng)?\b/i);
  if (shelfLifeMatch) {
    drugInfo.shelfLife = parseInt(shelfLifeMatch[1]);
  }
  
  // 5. Tìm Quy cách đóng gói (sau dạng bào chế, trước SĐK)
  // Pattern: "Hộp 1 chai 20ml; Hộp 1 chai 30ml" hoặc "Hộp 10 vỉ x 10 viên"
  // Hoặc: "Hộp 12 gói x 1,5g", "Hộp 1 vỉ x 4 viên", "Chai 125ml; Chai 500ml"
  // Tìm từ đầu dòng hoặc sau dạng bào chế đến trước SĐK
  let packagingText = '';
  if (splitIndex > -1) {
    // Lấy phần trước SĐK
    packagingText = contentWithoutSTT.substring(0, splitIndex);
  } else {
    // Nếu không có SĐK, lấy toàn bộ
    packagingText = contentWithoutSTT;
  }
  
  // Tìm quy cách: bắt đầu bằng Hộp/Chai/Vỉ/Gói/Lọ/Tuýp/Ống, có số, có thể có dấu chấm phẩy
  const packagingPattern = /(Hộp|Chai|Vỉ|Gói|Lọ|Tuýp|Ống|Can)[^0-9]*\d+[^0-9]*\d*[^0-9]*(?:ml|viên|gói|g|vỉ|lọ|chai|tuýp|ống|lit|lít)?(?:\s*;\s*(?:Hộp|Chai|Vỉ|Gói|Lọ|Tuýp|Ống|Can)[^0-9]*\d+[^0-9]*\d*[^0-9]*(?:ml|viên|gói|g|vỉ|lọ|chai|tuýp|ống|lit|lít)?)*/gi;
  const packagingMatch = packagingText.match(packagingPattern);
  if (packagingMatch) {
    // Lấy phần quy cách đầu tiên (có thể có nhiều quy cách, lấy tất cả)
    drugInfo.packaging = packagingMatch[0].trim();
    // Loại bỏ phần tiêu chuẩn nếu có ở cuối
    drugInfo.packaging = drugInfo.packaging.replace(/\s+(NSX|BP|USP|DĐVN|TCCS|JP|EP|TCNSX|TCCS).*$/i, '').trim();
  }
  
  // 6. Tìm Tiêu chuẩn (NSX, BP, USP, DĐVN, TCCS, JP, EP)
  // Tìm trong phần trước SĐK hoặc sau quy cách
  const standardPattern = /\b(NSX|BP|USP|DĐVN|TCCS|JP|EP|TCNSX|In-house)\b/i;
  const standardMatch = contentWithoutSTT.match(standardPattern);
  if (standardMatch) {
    drugInfo.standard = standardMatch[0].toUpperCase();
    // Map một số giá trị
    if (drugInfo.standard === 'TCNSX' || drugInfo.standard === 'IN-HOUSE') {
      drugInfo.standard = 'NSX'; // Tiêu chuẩn nhà sản xuất
    }
  }

  // 7. Phân tích Tên và Hoạt chất (loại bỏ quy cách, tiêu chuẩn, tuổi thọ đã extract)
  let mainContent = (splitIndex > -1) ? contentWithoutSTT.substring(0, splitIndex).trim() : contentWithoutSTT;
  
  // Loại bỏ phần quy cách, tiêu chuẩn, tuổi thọ đã extract khỏi mainContent
  if (drugInfo.packaging) {
    // Loại bỏ quy cách (có thể có nhiều lần xuất hiện)
    mainContent = mainContent.replace(new RegExp(drugInfo.packaging.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi'), '').trim();
  }
  if (drugInfo.standard) {
    mainContent = mainContent.replace(new RegExp(drugInfo.standard, 'gi'), '').trim();
  }
  if (drugInfo.shelfLife) {
    // Loại bỏ tuổi thọ (ví dụ: "36", "36 tháng")
    mainContent = mainContent.replace(new RegExp(`\\b${drugInfo.shelfLife}\\s*(?:tháng)?\\b`, 'gi'), '').trim();
  }
  
  // Loại bỏ số lần gia hạn nếu có (thường là "1" ở cuối)
  mainContent = mainContent.replace(/\s+\b\d+\s*$/, '').trim();
  
  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importExportService.js:processDrugBuffer',message:'MAIN_CONTENT_BEFORE_CLEAN',data:{mainContent:mainContent.substring(0,200),splitIndex,hasRegNumber:!!drugInfo.registrationNumber,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H2'})}).catch(()=>{});
  // #endregion
  
  // Clean rác cuối chuỗi
  mainContent = mainContent.replace(/\s+(nsx|tccs|bp|usp|dđvn).*$/i, '').replace(/\s+\d+\s*tháng.*$/i, '').trim();

  // Tìm dạng bào chế - Cải thiện theo công văn Bộ Y tế
  // Các dạng bào chế phổ biến trong công văn:
  const forms = [
    'viên nén bao phim', 'viên nén sủi bọt', 'viên nén phân tán', 'viên nén',
    'viên nang mềm', 'viên nang',
    'dung dịch dùng ngoài', 'dung dịch nhỏ mũi', 'dung dịch vệ sinh phụ nữ', 'dung dịch',
    'thuốc tiêm', 'dung dịch tiêm',
    'thuốc bột pha hỗn dịch uống', 'bột pha hỗn dịch uống', 'bột pha hỗn dịch', 'bột pha dung dịch uống', 'bột pha',
    'thuốc bột uống', 'thuốc bột',
    'thuốc cốm',
    'siro thuốc', 'siro',
    'kem bôi da', 'kem',
    'hỗn dịch xịt mũi', 'hỗn dịch',
    'thuốc xịt mũi', 'thuốc xịt',
    'thuốc mỡ',
    'nguyên liệu làm thuốc', 'nguyên liệu'
  ];
  let formFound = false;
  let formIndex = -1;
  
  // Tìm từ dạng cụ thể nhất đến chung nhất
  for (const f of forms) {
    const formRegex = new RegExp(f.replace(/\s+/g, '\\s*'), 'i');
    const match = mainContent.match(formRegex);
    
    if (match) {
      drugInfo.form = f;
      formIndex = match.index;
      formFound = true;
      break; // Lấy dạng cụ thể nhất (đã sắp xếp từ cụ thể đến chung)
    }
  }
  
  if (formFound && formIndex >= 0) {
    const preForm = mainContent.substring(0, formIndex).trim();
      
      // Tách Tên / Hoạt chất - Cải thiện theo cấu trúc công văn Bộ Y tế
      // Format trong công văn: "Tên thuốc" ở cột (2), "Hoạt chất chính - Hàm lượng" ở cột (3)
      // Trong PDF có thể bị dính: "IodinePovidone iodine 10% (w/v)" -> cần tách
      
      // Pattern 0: Phát hiện tên và hoạt chất bị lặp hoặc dính chữ
      // Ví dụ: "Prednison 5 mgPrednison 5mg", "IodinePovidone iodine"
      
      let nameParsed = false;
      let activeIngredientParsed = false;
      
      // Pattern 0a: Tên và hoạt chất bị lặp (tên xuất hiện 2 lần gần nhau)
      // Tìm: [Tên][Tên lặp lại hoặc biến thể][Hoạt chất]
      // Pattern 0b: Tên thuốc thường là 1 từ (ví dụ: Gastrolium, Iodine, Prednison)
      // Hoạt chất thường bắt đầu bằng chữ hoa (ví dụ: Attapulgite, Povidone)
      const words = preForm.split(/\s+/).filter(w => w.length > 0);
      
      // Kiểm tra nếu từ đầu là tên thuốc (thường là 1 từ, viết hoa chữ cái đầu)
      // và từ thứ 2 là hoạt chất (cũng viết hoa chữ cái đầu, nhưng khác tên)
      if (words.length >= 2) {
        const firstWord = words[0];
        const secondWord = words[1];
        
        // Nếu từ đầu là tên thuốc (1 từ, viết hoa) và từ thứ 2 là hoạt chất (viết hoa, khác tên)
        if (/^[A-ZÀ-Ỹ][a-zà-ỹ]+$/.test(firstWord) && /^[A-ZÀ-Ỹ]/.test(secondWord) && 
            firstWord.toLowerCase() !== secondWord.toLowerCase()) {
          // Tên là từ đầu, hoạt chất là phần còn lại
          drugInfo.name = firstWord;
          drugInfo.activeIngredient = words.slice(1).join(' ').trim();
          nameParsed = true;
          activeIngredientParsed = true;
        } else if (words.length >= 3) {
          // Tìm từ thứ 2 hoặc 3 có vẻ giống từ đầu (lặp)
          for (let i = 1; i < Math.min(4, words.length); i++) {
            const currentWord = words[i];
            // Nếu từ hiện tại giống với từ đầu (có thể có biến thể nhỏ)
            const firstWordLower = firstWord.toLowerCase();
            const currentWordLower = currentWord.toLowerCase();
            if (firstWordLower.length >= 3 && currentWordLower.length >= 3 &&
                (currentWordLower.startsWith(firstWordLower.substring(0, Math.min(4, firstWordLower.length))) ||
                 firstWordLower.startsWith(currentWordLower.substring(0, Math.min(4, currentWordLower.length))))) {
              // Tìm thấy lặp: tên là từ đầu, hoạt chất là phần sau (bỏ phần lặp)
              drugInfo.name = words.slice(0, i).join(' ');
              drugInfo.activeIngredient = words.slice(i + 1).join(' ').trim() || currentWord;
              nameParsed = true;
              activeIngredientParsed = true;
              break;
            }
          }
        }
      }
      
      // Nếu đã tách được từ pattern lặp, bỏ qua các pattern khác
      if (!nameParsed || !activeIngredientParsed) {
        if (preForm.includes(';')) {
          // Pattern 1: Có dấu chấm phẩy - tên và hoạt chất được tách rõ
          const parts = preForm.split(';');
          if (!nameParsed) drugInfo.name = parts[0].trim();
          if (!activeIngredientParsed) drugInfo.activeIngredient = parts.slice(1).join('; ').trim();
        } else if (preForm.includes(' - ')) {
        // Có dấu gạch ngang với space: "Hoạt chất - Hàm lượng"
        // Tìm dấu gạch ngang cuối cùng (thường là separator giữa hoạt chất và hàm lượng)
        const dashIndex = preForm.lastIndexOf(' - ');
        if (dashIndex > 0) {
          // Phần trước dấu gạch ngang cuối: có thể là "Tên thuốc Hoạt chất" hoặc chỉ "Hoạt chất"
          const beforeDash = preForm.substring(0, dashIndex).trim();
          const afterDash = preForm.substring(dashIndex + 3).trim();
          
          // Nếu phần trước có nhiều từ, tách: 1-2 từ đầu là tên, còn lại là hoạt chất
          const beforeWords = beforeDash.split(/\s+/).filter(w => w.length > 0);
          if (beforeWords.length <= 2) {
            // 1-2 từ: thường là tên thuốc
            if (!nameParsed) drugInfo.name = beforeWords.join(' ');
            if (!activeIngredientParsed) drugInfo.activeIngredient = beforeDash + ' - ' + afterDash;
          } else {
            // > 2 từ: 1-2 từ đầu là tên, còn lại là hoạt chất
            if (!nameParsed) drugInfo.name = beforeWords.slice(0, 2).join(' ');
            if (!activeIngredientParsed) drugInfo.activeIngredient = beforeWords.slice(2).join(' ') + ' - ' + afterDash;
          }
        } else {
          // Dấu gạch ngang không phải separator chính
          if (!nameParsed) drugInfo.name = preForm;
          if (!activeIngredientParsed) drugInfo.activeIngredient = preForm;
        }
      } else {
        // Không có separator rõ ràng: tách thông minh
        // Trong công văn, tên thuốc thường là 1-3 từ đầu, còn lại là hoạt chất
        const words = preForm.split(/\s+/).filter(w => w.length > 0);
        
        if (words.length === 0) {
          if (!nameParsed) drugInfo.name = preForm;
          if (!activeIngredientParsed) drugInfo.activeIngredient = preForm;
        } else if (words.length === 1) {
          if (!nameParsed) drugInfo.name = words[0];
          if (!activeIngredientParsed) drugInfo.activeIngredient = words[0];
        } else {
          // Tìm pattern: Tên thuốc thường bắt đầu bằng chữ hoa, có thể có số
          // Hoạt chất thường dài hơn, có thể có "dưới dạng", "tương đương", etc.
          
          // Thử tách dựa trên pattern: Tên ngắn (1-2 từ) + Hoạt chất dài
          // Hoặc: Tên có số đơn giản (ví dụ: "Prednison 5 mg") + Hoạt chất phức tạp
          
          // Pattern 1: Tên là 1-2 từ đầu, còn lại là hoạt chất
          if (words.length <= 4) {
            // 2-4 từ: thường là tên (1-2 từ) + hoạt chất (1-2 từ)
            const nameWordCount = Math.min(2, Math.floor(words.length / 2));
            drugInfo.name = words.slice(0, nameWordCount).join(' ');
            drugInfo.activeIngredient = words.slice(nameWordCount).join(' ').trim() || drugInfo.name;
          } else {
            // > 4 từ: tên thường là 1-3 từ đầu, còn lại là hoạt chất
            // Tìm điểm tách: sau khi có từ viết hoa đơn lẻ hoặc sau số + đơn vị
            let splitIndex = -1;
            
            // Tìm pattern: "Tên" + "Hoạt chất" (hoạt chất thường có từ dài hơn hoặc có dấu gạch ngang)
            for (let i = 1; i < Math.min(4, words.length); i++) {
              const currentWord = words[i];
              const nextWord = words[i + 1];
              
              // Nếu từ hiện tại là số + đơn vị và từ tiếp theo là chữ hoa -> có thể là điểm tách
              if (/\d+(mg|ml|g|%)/i.test(currentWord) && nextWord && /^[A-ZÀ-Ỹ]/.test(nextWord)) {
                splitIndex = i + 1;
                break;
              }
              
              // Nếu từ hiện tại là chữ hoa đơn lẻ và từ tiếp theo là chữ thường -> có thể là điểm tách
              if (/^[A-ZÀ-Ỹ]$/.test(currentWord) && nextWord && /^[a-zà-ỹ]/.test(nextWord)) {
                splitIndex = i + 1;
                break;
              }
            }
            
            if (splitIndex > 0 && splitIndex < words.length) {
              if (!nameParsed) drugInfo.name = words.slice(0, splitIndex).join(' ');
              if (!activeIngredientParsed) drugInfo.activeIngredient = words.slice(splitIndex).join(' ').trim();
            } else {
              // Không tìm thấy điểm tách rõ ràng: dùng heuristic
              const nameWordCount = Math.min(3, Math.floor(words.length / 2));
              if (!nameParsed) drugInfo.name = words.slice(0, nameWordCount).join(' ');
              if (!activeIngredientParsed) drugInfo.activeIngredient = words.slice(nameWordCount).join(' ').trim() || drugInfo.name;
            }
          }
        }
      }
      } // Đóng if (!nameParsed || !activeIngredientParsed)
      
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importExportService.js:processDrugBuffer',message:'PARSED_NAME_INGREDIENT',data:{preForm:preForm.substring(0,150),parsedName:drugInfo.name,parsedIngredient:drugInfo.activeIngredient.substring(0,100),formFound:formFound,form:drugInfo.form,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3'})}).catch(()=>{});
      // #endregion
  }

  if (!formFound) {
    // Nếu không tìm thấy dạng bào chế, cắt thông minh hơn
    const words = mainContent.split(/\s+/).filter(w => w.length > 0);
    
    if (words.length === 0) {
      drugInfo.name = mainContent;
      drugInfo.activeIngredient = mainContent;
    } else if (words.length === 1) {
      drugInfo.name = words[0];
      drugInfo.activeIngredient = words[0];
    } else if (words.length <= 3) {
      // 2-3 từ: thường là tên thuốc
      drugInfo.name = words.join(' ');
      drugInfo.activeIngredient = words.join(' ');
    } else {
      // > 3 từ: 1-2 từ đầu là tên, còn lại là hoạt chất
      const nameWordCount = Math.min(2, Math.floor(words.length / 2));
      drugInfo.name = words.slice(0, nameWordCount).join(' ');
      drugInfo.activeIngredient = words.slice(nameWordCount).join(' ').trim() || drugInfo.name;
    }
  }

  // Map form - chỉ map nếu form chưa phải là enum hợp lệ
  const validForms = ['viên nén', 'viên nang', 'siro', 'dung dịch tiêm', 'kem', 'gel', 'thuốc mỡ', 'cao khô', 'cao đặc', 'khác'];
  if (!validForms.includes(drugInfo.form)) {
    drugInfo.form = mapDrugFormToEnum(drugInfo.form || 'khác');
  }

  // Tính ngày hết hạn - Cải thiện theo QĐ 720/QĐ-QLD
  if (!drugInfo.expiryDate) {
      if (drugInfo.validityDate) {
          // Phụ lục III: có ngày cụ thể
          drugInfo.expiryDate = new Date(drugInfo.validityDate);
      } else if (drugInfo.validityPeriod) {
          // Phụ lục I (5 năm) hoặc II (3 năm)
          const now = new Date();
          drugInfo.expiryDate = new Date(now.getFullYear() + drugInfo.validityPeriod, now.getMonth(), now.getDate());
      } else {
          // Mặc định: 5 năm
          const now = new Date();
          drugInfo.expiryDate = new Date(now.getFullYear() + 5, now.getMonth(), now.getDate());
      }
  }
  
  // Xử lý ghi chú đặc biệt cho Phụ lục II
  if (drugInfo.appendix === 'II' || drugInfo.appendix === '2') {
    drugInfo.notes = 'Sau khi hết hạn giấy đăng ký lưu hành, phải bổ sung công thức tham chiếu hoặc dữ liệu lâm sàng chứng minh an toàn, hiệu quả của thuốc';
  }
  
  // Áp dụng fixVietnameseSpacing cho tên và hoạt chất TRƯỚC KHI truncate
  // Điều này đảm bảo chữ bị tách được sửa trước, giảm độ dài thực tế
  drugInfo.name = fixVietnameseSpacing(drugInfo.name);
  drugInfo.activeIngredient = fixVietnameseSpacing(drugInfo.activeIngredient);
  
  // === CRITICAL FIX: TRUNCATE FIELDS FOR DB VALIDATION ===
  // Cắt ngắn tên và hoạt chất để thỏa mãn validation của DB (thường là 200-500 ký tự)
  // Làm SAU fixVietnameseSpacing để đảm bảo độ dài chính xác
  if (drugInfo.name.length > 190) {
      drugInfo.name = drugInfo.name.substring(0, 190) + '...';
  }
  if (drugInfo.activeIngredient && drugInfo.activeIngredient.length > 490) {
      drugInfo.activeIngredient = drugInfo.activeIngredient.substring(0, 490) + '...';
  }
  
  // Fallback nếu tên quá ngắn hoặc rỗng
  if ((!drugInfo.name || drugInfo.name.length < 2) && drugInfo.registrationNumber) {
      drugInfo.name = `Thuốc ${drugInfo.registrationNumber}`;
  }

  // #region agent log
  fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'importExportService.js:processDrugBuffer',message:'FINAL_DRUG_INFO',data:{stt:drugInfo.stt,name:drugInfo.name,activeIngredient:drugInfo.activeIngredient.substring(0,100),form:drugInfo.form,registrationNumber:drugInfo.registrationNumber,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H4'})}).catch(()=>{});
  // #endregion

  // Validate cuối cùng: Phải có tên hoặc SĐK
  if (!drugInfo.name && !drugInfo.registrationNumber) return null;

  return drugInfo;
};

/**
 * MAIN FUNCTION: Parse PDF từ công văn Bộ Y tế (Fix Font Issue)
 * Updated: Xử lý lỗi font PDF (dính chữ, mất khoảng trắng) và thêm log debug
 */
const parsePDFFromMinistryOfHealth = async (filePath) => {
  try {
    console.log('🔍 Starting PDF import (Buffer Strategy - Fixed) from:', filePath);
    const dataBuffer = fs.readFileSync(filePath);
    
    // Thêm options cho pdf-parse để xử lý tốt hơn (nếu thư viện hỗ trợ)
    const pdfData = await pdfParse(dataBuffer);
    
    // CLEANING: Xử lý lỗi font undefined function 32 (Mất space)
    // Thay thế các ký tự điều khiển lạ bằng space nếu cần, tách dòng
    const rawText = pdfData.text;
    const lines = rawText.split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0);

    console.log('📄 Total lines to process:', lines.length);
    
    const drugs = [];
    let buffer = [];
    let currentContext = {
      appendix: null,
      validityPeriod: null,
      validityDate: null,
      registrationFacility: null,
      registrationFacilityAddress: null, // Lưu địa chỉ đầy đủ
      manufacturingFacility: null,
      manufacturingFacilityAddress: null // Lưu địa chỉ đầy đủ
    };

    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      
      // Fix lỗi dính chữ phổ biến trong PDF lỗi font (Ví dụ: "1.Tên" -> "1. Tên")
      // Thêm khoảng trắng sau dấu chấm nếu liền sau là chữ cái
      line = line.replace(/(\d+\.)([A-ZÀ-Ỹ])/g, '$1 $2');
      
      const lowerLine = line.toLowerCase();

      // 1. Skip Header rác (Đặc biệt là dòng STTTên thuốc...)
      if (lowerLine.includes('stttên') || (lowerLine.includes('stt') && lowerLine.includes('tên thuốc'))) {
        console.log(`🗑️ Skipping header line ${i}:`, line.substring(0, 50));
        continue;
      }
      if (lowerLine.match(/^trang\s*\d+/)) continue;

      // 2. Context Change - Cải thiện để lấy địa chỉ đầy đủ (có thể kéo dài nhiều dòng)
      if (isContextLine(line)) {
        if (buffer.length > 0) {
          const drug = processDrugBuffer(buffer, currentContext);
          if (drug) drugs.push(drug);
          buffer = [];
        }

        // Logic cập nhật context - Cải thiện theo công văn Bộ Y tế
        // Xử lý địa chỉ có thể kéo dài nhiều dòng: đọc các dòng tiếp theo nếu địa chỉ chưa đầy đủ
        let addressLines = [line];
        let addressComplete = false;
        
        // Kiểm tra xem dòng này có chứa "Địa chỉ:" chưa
        const hasAddressStart = /Địa chỉ[:\s]/i.test(line);
        
        // Nếu có "Địa chỉ:" nhưng chưa có "Việt Nam" hoặc chưa có dấu đóng ngoặc, đọc thêm các dòng tiếp theo
        if (hasAddressStart && !/Việt Nam/i.test(line) && !/\)\s*$/.test(line)) {
          // Đọc các dòng tiếp theo cho đến khi gặp "Việt Nam" hoặc dòng mới (cơ sở khác/thuốc mới)
          let linesRead = 0;
          for (let j = i + 1; j < Math.min(i + 5, lines.length); j++) {
            const nextLine = lines[j].trim();
            if (!nextLine) break;
            
            // Nếu là dòng mới (cơ sở khác hoặc thuốc mới), dừng lại
            const nextLowerLine = nextLine.toLowerCase();
            if (isContextLine(nextLine) || isNewDrugSignal(nextLine)) {
              break;
            }
            
            addressLines.push(nextLine);
            linesRead++;
            
            // Nếu đã có "Việt Nam" hoặc dấu đóng ngoặc, địa chỉ đã đầy đủ
            if (/Việt Nam/i.test(nextLine) || /\)\s*$/.test(nextLine)) {
              addressComplete = true;
              break;
            }
          }
          
          // Gộp các dòng địa chỉ lại
          if (addressLines.length > 1) {
            line = addressLines.join(' ');
            lowerLine = line.toLowerCase();
            // Cập nhật i để bỏ qua các dòng đã đọc (trừ dòng hiện tại)
            if (linesRead > 0) {
              i += linesRead;
            }
          }
        }
        
        if (lowerLine.includes('phụ lục')) {
            const match = lowerLine.match(/phụ lục\s+([IVX123]+)/i);
            if (match) {
              currentContext.appendix = match[1];
              // Xác định hiệu lực dựa trên Phụ lục
              // Phụ lục I: Gia hạn 05 năm
              // Phụ lục II: Gia hạn 03 năm  
              // Phụ lục III: Gia hạn đến ngày cụ thể (31/12/2025)
              if (match[1] === 'I' || match[1] === '1') {
                currentContext.validityPeriod = 5;
              } else if (match[1] === 'II' || match[1] === '2') {
                currentContext.validityPeriod = 3;
              } else if (match[1] === 'III' || match[1] === '3') {
                // Phụ lục III: gia hạn đến 31/12/2025 (hoặc ngày khác nếu có trong text)
                // Tìm ngày cụ thể trong dòng
                const dateMatch = line.match(/đến\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
                if (dateMatch) {
                  const parts = dateMatch[1].split('/');
                  currentContext.validityDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
                } else {
                  // Mặc định: 31/12/2025
                  currentContext.validityDate = new Date(2025, 11, 31); // Tháng 11 = tháng 12 (0-indexed)
                }
              }
            }
        }
        // Kiểm tra pattern "gia hạn 05 năm" hoặc "gia hạn 03 năm" (có thể viết liền hoặc có space)
        if (lowerLine.includes('gia hạn 05 năm') || lowerLine.includes('gia hạn 05năm') || lowerLine.includes('05 năm') || lowerLine.includes('hiệu lực 05 năm')) {
          currentContext.validityPeriod = 5;
        }
        if (lowerLine.includes('gia hạn 03 năm') || lowerLine.includes('gia hạn 03năm') || lowerLine.includes('03 năm') || lowerLine.includes('hiệu lực 03 năm')) {
          currentContext.validityPeriod = 3;
        }
        // Kiểm tra pattern "gia hạn đến" với ngày cụ thể
        const dateMatch = line.match(/gia hạn đến\s*(\d{1,2}\/\d{1,2}\/\d{4})/i) || line.match(/đến\s*(\d{1,2}\/\d{1,2}\/\d{4})/);
        if (dateMatch) {
            const parts = dateMatch[1].split('/');
            currentContext.validityDate = new Date(parseInt(parts[2]), parseInt(parts[1])-1, parseInt(parts[0]));
        }
        // Parse cơ sở đăng ký: "1. Cơ sở đăng ký: Công ty..." hoặc "Cơ sở đăng ký: Công ty..."
        // Format: "Cơ sở đăng ký: Công ty Cổ phần Dược phẩm Minh Dân (Địa chỉ: ...)"
        // Cải thiện: Lấy cả tên và địa chỉ đầy đủ (có thể đã được gộp từ nhiều dòng)
        const regMatch = line.match(/(?:^\d+\.\s*)?Cơ sở đăng ký[:\s]+(.+)$/i);
        if (regMatch) {
          let fullText = regMatch[1].trim();
          // Tách tên và địa chỉ
          // Pattern 1: Có dấu ngoặc đơn chứa "Địa chỉ" (địa chỉ trong ngoặc)
          const addressMatch = fullText.match(/(.+?)\s*\([^)]*Địa chỉ[:\s]+(.+?)\)/i);
          if (addressMatch) {
            currentContext.registrationFacility = fixVietnameseSpacing(addressMatch[1].trim());
            currentContext.registrationFacilityAddress = fixVietnameseSpacing(addressMatch[2].trim());
          } else {
            // Pattern 2: Có "Địa chỉ:" không có ngoặc đơn (có thể kéo dài nhiều dòng, đã được gộp)
            const addressMatch2 = fullText.match(/(.+?)\s*Địa chỉ[:\s]+(.+)$/i);
            if (addressMatch2) {
              currentContext.registrationFacility = fixVietnameseSpacing(addressMatch2[1].trim());
              // Lấy toàn bộ phần sau "Địa chỉ:" (có thể đã được gộp từ nhiều dòng)
              let address = addressMatch2[2].trim();
              // Loại bỏ dấu đóng ngoặc nếu có ở cuối
              address = address.replace(/\s*\)\s*$/, '').trim();
              // Loại bỏ dấu chấm phẩy thừa ở cuối nếu có
              address = address.replace(/\s*;\s*$/, '').trim();
              currentContext.registrationFacilityAddress = fixVietnameseSpacing(address);
            } else {
              // Không có địa chỉ rõ ràng, lấy toàn bộ làm tên
              currentContext.registrationFacility = fixVietnameseSpacing(fullText);
              currentContext.registrationFacilityAddress = null;
            }
          }
        }
        // Parse cơ sở sản xuất: "1.1. Cơ sở sản xuất: Công ty..." hoặc "Cơ sở sản xuất: Công ty..."
        // Format: "Cơ sở sản xuất: Công ty Cổ phần Dược phẩm Minh Dân (Địa chỉ: ...)"
        // Cải thiện: Lấy cả tên và địa chỉ đầy đủ (có thể đã được gộp từ nhiều dòng)
        const manuMatch = line.match(/(?:^\d+\.\d+\.\s*)?Cơ sở sản xuất[:\s]+(.+)$/i);
        if (manuMatch) {
          let fullText = manuMatch[1].trim();
          // Tách tên và địa chỉ
          // Pattern 1: Có dấu ngoặc đơn chứa "Địa chỉ" (địa chỉ trong ngoặc)
          const addressMatch = fullText.match(/(.+?)\s*\([^)]*Địa chỉ[:\s]+(.+?)\)/i);
          if (addressMatch) {
            currentContext.manufacturingFacility = fixVietnameseSpacing(addressMatch[1].trim());
            currentContext.manufacturingFacilityAddress = fixVietnameseSpacing(addressMatch[2].trim());
          } else {
            // Pattern 2: Có "Địa chỉ:" không có ngoặc đơn (có thể kéo dài nhiều dòng, đã được gộp)
            const addressMatch2 = fullText.match(/(.+?)\s*Địa chỉ[:\s]+(.+)$/i);
            if (addressMatch2) {
              currentContext.manufacturingFacility = fixVietnameseSpacing(addressMatch2[1].trim());
              // Lấy toàn bộ phần sau "Địa chỉ:" (có thể đã được gộp từ nhiều dòng)
              let address = addressMatch2[2].trim();
              // Loại bỏ dấu đóng ngoặc nếu có ở cuối
              address = address.replace(/\s*\)\s*$/, '').trim();
              // Loại bỏ dấu chấm phẩy thừa ở cuối nếu có
              address = address.replace(/\s*;\s*$/, '').trim();
              currentContext.manufacturingFacilityAddress = fixVietnameseSpacing(address);
            } else {
              // Không có địa chỉ rõ ràng, lấy toàn bộ làm tên
              currentContext.manufacturingFacility = fixVietnameseSpacing(fullText);
              currentContext.manufacturingFacilityAddress = null;
            }
          }
        }
        
        continue;
      }

      // 3. Kiểm tra dòng rác trước khi xử lý signal
      // Đặc biệt loại bỏ các dòng "1. Cách ghi..." và "2. Số đăng ký..." ngay từ đầu
      const lowerLineForJunk = line.toLowerCase();
      if (lowerLineForJunk.includes("cách ghi tiêu chuẩn") || 
          lowerLineForJunk.includes("số đăng ký tại cột") ||
          lowerLineForJunk.match(/^\d+\.\s*(cách ghi|số đăng ký)/i)) {
        // Nếu là dòng rác và đang có buffer, flush buffer trước
        if (buffer.length > 0) {
          const drug = processDrugBuffer(buffer, currentContext);
          if (drug) drugs.push(drug);
          buffer = [];
        }
        continue; // Bỏ qua dòng rác
      }
      
      if (!isValidDrugLine(line)) {
        // Nếu là dòng rác và đang có buffer, flush buffer trước
        if (buffer.length > 0) {
          const drug = processDrugBuffer(buffer, currentContext);
          if (drug) drugs.push(drug);
          buffer = [];
        }
        continue; // Bỏ qua dòng rác
      }

      // 4. Signal Detection
      if (isNewDrugSignal(line)) {
        console.log(`✨ Signal detected at line ${i}:`, line.substring(0, 50)); // LOG DEBUG
        if (buffer.length > 0) {
          const drug = processDrugBuffer(buffer, currentContext);
          if (drug) drugs.push(drug);
        }
        buffer = [line];
      } else {
        // 5. Continuation - Nối dòng vào buffer
        if (buffer.length > 0) {
          // Kiểm tra xem dòng này có phải là phần tiếp theo của quy cách đóng gói không
          // Pattern: "Hộp...", "Chai...", "500 viên", "10 vỉ x 10 viên", etc.
          const isPackagingContinuation = /^(Hộp|Chai|Vỉ|Gói|Lọ|Tuýp|Ống|Can|\d+\s*(viên|vỉ|gói|chai|lọ|tuýp|ống|ml|g|lit|lít))/i.test(line.trim());
          
          // Hoặc là phần tiếp theo của hoạt chất (có chữ thường, không bắt đầu bằng số lớn)
          const isIngredientContinuation = /^[a-zà-ỹ]/.test(line.trim()) && !/^\d{3,}/.test(line.trim());
          
          if (isPackagingContinuation || isIngredientContinuation || line.length < 100) {
            // Nối vào buffer nếu là phần tiếp theo hợp lệ
            buffer.push(line);
          } else {
            // Dòng này có vẻ là thuốc mới hoặc rác - flush buffer trước
            const drug = processDrugBuffer(buffer, currentContext);
            if (drug) drugs.push(drug);
            buffer = [];
            // Không thêm dòng này vào buffer mới (để signal detection xử lý ở lần lặp tiếp theo)
          }
        } else {
          // Log những dòng bị bỏ qua khi buffer rỗng để debug
          // Chỉ log nếu dòng có vẻ quan trọng (có số hoặc text dài) và không phải rác
          if (line.length > 10 && !line.includes('.....') && isValidDrugLine(line)) {
             console.log(`⚠️ Ignored Orphan Line ${i}:`, line.substring(0, 50));
          }
        }
      }
    }

    // Flush buffer cuối
    if (buffer.length > 0) {
      const drug = processDrugBuffer(buffer, currentContext);
      if (drug) drugs.push(drug);
    }

    console.log(`📊 PDF Import Completed. Extracted ${drugs.length} drugs.`);
    return drugs;

  } catch (error) {
    console.error('❌ Error parsing PDF:', error);
    throw new Error('Không thể đọc file PDF: ' + error.message);
  }
};

// ==========================================
// CÁC HÀM CŨ ĐÃ ĐƯỢC THAY THẾ BẰNG BUFFER STRATEGY
// Các hàm parseCSVRow, parseTextRowWithoutSTT, parseDrugRow đã được thay thế
// bởi logic mới trong processDrugBuffer và parsePDFFromMinistryOfHealth
// ==========================================

/**
 * Import Drugs từ PDF công văn Bộ Y tế
 */
const importDrugsFromPDF = async (filePath, user, req = null) => {
  try {
    console.log('🔍 Starting PDF import from file:', filePath);
    
    // Parse PDF
    const extractedDrugs = await parsePDFFromMinistryOfHealth(filePath);
    
    console.log('📊 Extracted drugs count:', extractedDrugs.length);
    if (extractedDrugs.length === 0) {
      return {
        success: false,
        imported: 0,
        errors: [{ error: 'Không tìm thấy dữ liệu thuốc trong PDF. Vui lòng kiểm tra lại file hoặc định dạng PDF.' }],
        results: []
      };
    }
    
    const results = [];
    const errors = [];
    
    // Tìm manufacturer mặc định
    const User = require('../models/User');
    let manufacturerId = user._id;
    if (user.role !== 'manufacturer') {
      const manufacturer = await User.findOne({ role: 'manufacturer' });
      if (manufacturer) {
        manufacturerId = manufacturer._id;
      } else {
        throw new Error('Không tìm thấy nhà sản xuất trong hệ thống');
      }
    }
    
    // Import từng thuốc
    for (const drugInfo of extractedDrugs) {
      try {
        // Tính ngày hết hạn
        let expiryDate = drugInfo.expiryDate;
        if (!expiryDate && drugInfo.extensionPeriod) {
          const now = new Date();
          expiryDate = new Date(now.getFullYear() + drugInfo.extensionPeriod, now.getMonth(), now.getDate());
        } else if (!expiryDate) {
          expiryDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
        }
        
        // Tạo drug data
        const certificateNumber = drugInfo.oldRegistrationNumber || drugInfo.registrationNumber || `CV_${Date.now()}_${drugInfo.stt || 'UNKNOWN'}`;
        
        const qualityTestInfo = {
          testDate: new Date(),
          testResult: 'đạt',
          testBy: 'Bộ Y tế - Cục Quản lý Dược',
          certificateNumber: certificateNumber,
          testReport: `Giấy đăng ký lưu hành số ${certificateNumber} được gia hạn theo công văn Bộ Y tế${drugInfo.appendix ? ` - Phụ lục ${drugInfo.appendix}` : ''}`
        };
        
        // Thêm thông tin cơ sở đăng ký và sản xuất với địa chỉ đầy đủ
        if (drugInfo.registrationFacility || drugInfo.manufacturingFacility) {
          const facilityInfo = [];
          if (drugInfo.registrationFacility) {
            let regInfo = `Cơ sở đăng ký: ${drugInfo.registrationFacility}`;
            if (drugInfo.registrationFacilityAddress) {
              regInfo += ` (Địa chỉ: ${drugInfo.registrationFacilityAddress})`;
            }
            facilityInfo.push(regInfo);
          }
          if (drugInfo.manufacturingFacility) {
            let manuInfo = `Cơ sở sản xuất: ${drugInfo.manufacturingFacility}`;
            if (drugInfo.manufacturingFacilityAddress) {
              manuInfo += ` (Địa chỉ: ${drugInfo.manufacturingFacilityAddress})`;
            }
            facilityInfo.push(manuInfo);
          }
          if (facilityInfo.length > 0) {
            qualityTestInfo.testReport += `. ${facilityInfo.join('; ')}`;
          }
        }
        
        const drugData = {
          name: drugInfo.name || 'Tên thuốc không xác định',
          activeIngredient: drugInfo.activeIngredient || drugInfo.name || 'Hoạt chất không xác định',
          dosage: 'Theo chỉ định',
          form: mapDrugFormToEnum(drugInfo.form || 'viên nén'),
          batchNumber: `BATCH_${drugInfo.registrationNumber || drugInfo.oldRegistrationNumber || Date.now()}_${drugInfo.stt || 'UNKNOWN'}`,
          productionDate: new Date(),
          expiryDate: expiryDate,
          manufacturerId: manufacturerId,
          qualityTest: qualityTestInfo,
          // Thêm các trường mới theo cấu trúc QĐ 720/QĐ-QLD
          registrationNumber: drugInfo.registrationNumber || drugInfo.oldRegistrationNumber || null,
          packaging: drugInfo.packaging || null, // Quy cách đóng gói
          shelfLife: drugInfo.shelfLife || null, // Tuổi thọ (tháng)
          // Lưu thông tin bổ sung trong qualityTest.testReport
          notes: drugInfo.notes || null // Ghi chú đặc biệt (cho Phụ lục II)
        };
        
        // Cập nhật testReport với thông tin đầy đủ hơn
        if (drugInfo.packaging) {
          qualityTestInfo.testReport += `. Quy cách: ${drugInfo.packaging}`;
        }
        if (drugInfo.standard) {
          qualityTestInfo.testReport += `. Tiêu chuẩn: ${drugInfo.standard}`;
        }
        if (drugInfo.shelfLife) {
          qualityTestInfo.testReport += `. Tuổi thọ: ${drugInfo.shelfLife} tháng`;
        }
        if (drugInfo.notes) {
          qualityTestInfo.testReport += `. ${drugInfo.notes}`;
        }
        
        // Kiểm tra batch number đã tồn tại
        const existing = await Drug.findOne({ batchNumber: drugData.batchNumber });
        if (existing) {
          errors.push({ drugInfo, error: 'Batch number đã tồn tại' });
          continue;
        }
        
        const drug = await Drug.create({
          ...drugData,
          imageUrl: drugData.imageUrl || generateDrugImageDataUrl({
            name: drugData.name,
            activeIngredient: drugData.activeIngredient,
            dosage: drugData.dosage,
            form: drugData.form,
            certificateNumber: drugData.qualityTest?.certificateNumber || `PDF_${Date.now()}`
          }),
          createdBy: user._id
        });
        
        // Blockchain integration
        const networkName = process.env.BLOCKCHAIN_NETWORK || 'sepolia';
        if (!blockchainService.isInitialized || blockchainService.currentNetwork !== networkName) {
          await blockchainService.initialize(networkName);
        }
        
        let blockchainResult;
        try {
          blockchainResult = await blockchainService.recordDrugBatchOnBlockchain({
            ...drugData,
            drugId: drug.drugId,
            manufacturerId: drug.manufacturerId.toString()
          });
        } catch (error) {
          console.error('Error recording to blockchain:', error);
          blockchainResult = { success: false, error: error.message };
        }
        
        if (blockchainResult && blockchainResult.success) {
          const contractAddress = blockchainService.getContractAddress
            ? blockchainService.getContractAddress(blockchainService.currentNetwork)
            : (process.env.CONTRACT_ADDRESS_SEPOLIA || process.env.CONTRACT_ADDRESS || 'mock');
          
          drug.blockchain = {
            blockchainId: blockchainResult.blockchainId,
            transactionHash: blockchainResult.transactionHash,
            blockNumber: blockchainResult.blockNumber,
            blockchainTimestamp: blockchainResult.timestamp,
            digitalSignature: blockchainResult.signature,
            dataHash: blockchainResult.hash,
            isOnBlockchain: true,
            blockchainStatus: blockchainResult.mock ? 'pending' : 'confirmed',
            contractAddress: contractAddress,
            transactionHistory: [{
              transactionHash: blockchainResult.transactionHash,
              blockNumber: blockchainResult.blockNumber,
              timestamp: blockchainResult.timestamp,
              action: 'create',
              details: 'Tạo lô thuốc từ import PDF'
            }]
          };
          await drug.save();
          
          // Generate QR code
          const qrData = {
            drugId: drug.drugId,
            name: drug.name,
            batchNumber: drug.batchNumber,
            expiryDate: drug.expiryDate,
            manufacturerId: drug.manufacturerId,
            blockchainId: drug.blockchain?.blockchainId,
            timestamp: Date.now()
          };
          const serverUrl = getServerUrl();
          qrData.verificationUrl = `${serverUrl}/verify/${drug.blockchain?.blockchainId || drug.drugId}`;
          
          const qrCodeDataURL = await QRCode.toDataURL(JSON.stringify(qrData));
          drug.qrCode = {
            data: JSON.stringify(qrData),
            imageUrl: qrCodeDataURL,
            generatedAt: new Date(),
            blockchainId: drug.blockchain?.blockchainId,
            verificationUrl: qrData.verificationUrl
          };
          await drug.save();
        } else {
          drug.blockchain = {
            isOnBlockchain: false,
            blockchainStatus: 'pending',
            lastUpdated: new Date(),
            transactionHistory: [],
            error: blockchainResult?.error || 'Unknown error'
          };
          await drug.save();
        }
        
        results.push(drug);
      } catch (error) {
        console.error('❌ Error importing drug:', error.message);
        errors.push({ drugInfo, error: error.message });
      }
    }
    
    // Ghi audit log
    await auditService.logCRUD.create(
      user,
      'Drug',
      null,
      { imported: results.length, errors: errors.length },
      'drug',
      req,
      `Import drugs từ PDF: ${results.length} thành công, ${errors.length} lỗi`
    );
    
    return {
      success: results.length > 0,
      imported: results.length,
      errors: errors,
      results: results
    };
  } catch (error) {
    console.error('❌ Error in importDrugsFromPDF:', error);
    throw error;
  }
};

/**
 * Export Supply Chains ra CSV
 */
const exportSupplyChainsToCSV = async (supplyChains) => {
  try {
    const flattened = supplyChains.map(chain => ({
      id: chain._id?.toString() || '',
      drugBatchNumber: chain.drugBatchNumber || '',
      drugName: chain.drugId?.name || '',
      activeIngredient: chain.drugId?.activeIngredient || '',
      status: chain.status || '',
      currentLocation: chain.currentLocation?.address || chain.currentLocation?.actorName || '',
      currentActor: chain.currentLocation?.actorName || '',
      currentActorRole: chain.currentLocation?.actorRole || '',
      stepsCount: chain.steps?.length || 0,
      createdAt: chain.createdAt ? formatDate(chain.createdAt) : '',
      updatedAt: chain.updatedAt ? formatDate(chain.updatedAt) : '',
      createdBy: chain.createdBy?.fullName || '',
      blockchainHash: chain.blockchain?.hash || ''
    }));

    const fields = [
      'id',
      'drugBatchNumber',
      'drugName',
      'activeIngredient',
      'status',
      'currentLocation',
      'currentActor',
      'currentActorRole',
      'stepsCount',
      'createdAt',
      'updatedAt',
      'createdBy',
      'blockchainHash'
    ];

    return generateCSV(flattened, fields);
  } catch (error) {
    console.error('Export supply chains to CSV error:', error);
    throw error;
  }
};

/**
 * Export Supply Chains ra Excel
 */
const exportSupplyChainsToExcel = async (supplyChains) => {
  try {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Chuỗi Cung ứng');

    // Headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 30 },
      { header: 'Số lô', key: 'drugBatchNumber', width: 20 },
      { header: 'Tên thuốc', key: 'drugName', width: 30 },
      { header: 'Hoạt chất', key: 'activeIngredient', width: 25 },
      { header: 'Trạng thái', key: 'status', width: 15 },
      { header: 'Vị trí hiện tại', key: 'currentLocation', width: 40 },
      { header: 'Người phụ trách', key: 'currentActor', width: 25 },
      { header: 'Vai trò', key: 'currentActorRole', width: 15 },
      { header: 'Số bước', key: 'stepsCount', width: 10 },
      { header: 'Ngày tạo', key: 'createdAt', width: 15 },
      { header: 'Cập nhật', key: 'updatedAt', width: 15 },
      { header: 'Người tạo', key: 'createdBy', width: 20 },
      { header: 'Blockchain Hash', key: 'blockchainHash', width: 40 }
    ];

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' }
    };

    // Add data
    supplyChains.forEach(chain => {
      worksheet.addRow({
        id: chain._id?.toString() || '',
        drugBatchNumber: chain.drugBatchNumber || '',
        drugName: chain.drugId?.name || '',
        activeIngredient: chain.drugId?.activeIngredient || '',
        status: chain.status || '',
        currentLocation: chain.currentLocation?.address || chain.currentLocation?.actorName || '',
        currentActor: chain.currentLocation?.actorName || '',
        currentActorRole: chain.currentLocation?.actorRole || '',
        stepsCount: chain.steps?.length || 0,
        createdAt: chain.createdAt ? formatDate(chain.createdAt) : '',
        updatedAt: chain.updatedAt ? formatDate(chain.updatedAt) : '',
        createdBy: chain.createdBy?.fullName || '',
        blockchainHash: chain.blockchain?.hash || ''
      });
    });

    return workbook;
  } catch (error) {
    console.error('Export supply chains to Excel error:', error);
    throw error;
  }
};

module.exports = {
  importDrugsFromCSV,
  importInventoryFromCSV,
  exportDrugsToCSV,
  exportInventoryToCSV,
  exportOrdersToCSV,
  exportInvoicesToCSV,
  exportSupplyChainsToCSV,
  exportSupplyChainsToExcel,
  importDrugsFromPDF,
  UPLOAD_DIR
};
