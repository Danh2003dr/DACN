const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Tạo thư mục uploads/documents nếu chưa có
const uploadsDir = path.join(__dirname, '../uploads');
const documentsDir = path.join(uploadsDir, 'documents');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(documentsDir)) {
  fs.mkdirSync(documentsDir, { recursive: true });
}

// Cấu hình storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, documentsDir);
  },
  filename: function (req, file, cb) {
    // Tên file: doc-{timestamp}-{random}.{ext}
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 9);
    const ext = path.extname(file.originalname);
    cb(null, `doc-${timestamp}-${randomString}${ext}`);
  }
});

// Filter file - chỉ cho phép PDF, JPG, JPEG, PNG
const fileFilter = (req, file, cb) => {
  const allowedMimes = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ cho phép upload file PDF, JPG, JPEG hoặc PNG!'), false);
  }
};

// Cấu hình multer
const uploadDocuments = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5 // Tối đa 5 files
  },
  fileFilter: fileFilter
});

module.exports = uploadDocuments;

