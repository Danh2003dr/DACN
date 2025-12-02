const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Có thể dùng service account key hoặc environment variables
let firebaseAdmin;

try {
  // Nếu có service account key file
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    firebaseAdmin = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  } 
  // Hoặc dùng environment variables
  else if (process.env.FIREBASE_PROJECT_ID) {
    firebaseAdmin = admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID
    });
  }
  // Hoặc dùng default credentials (nếu deploy lên Firebase/GCP)
  else {
    firebaseAdmin = admin.initializeApp();
  }
  
  console.log('✅ Firebase Admin SDK đã được khởi tạo');
  console.log(`   Project ID: ${process.env.FIREBASE_PROJECT_ID || JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY || '{}').project_id || 'N/A'}`);
} catch (error) {
  console.warn('⚠️  Firebase Admin SDK chưa được cấu hình:', error.message);
  console.warn('   Để sử dụng Firebase Authentication, thêm FIREBASE_SERVICE_ACCOUNT_KEY hoặc FIREBASE_PROJECT_ID vào file .env');
  firebaseAdmin = null;
}

module.exports = firebaseAdmin;

