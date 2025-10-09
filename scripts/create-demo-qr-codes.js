const mongoose = require('mongoose');
const QRCode = require('qrcode');
const Drug = require('../models/Drug');
const fs = require('fs');
const path = require('path');

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};

// Create demo QR codes
const createDemoQRCodes = async () => {
  try {
    console.log('🚀 Creating Demo QR Codes...');

    // Get existing drugs
    const drugs = await Drug.find().limit(3);

    if (drugs.length === 0) {
      console.error('❌ No drugs found. Please run setup scripts first.');
      return;
    }

    // Create qr-codes directory if it doesn't exist
    const qrDir = path.join(__dirname, '..', 'qr-codes');
    if (!fs.existsSync(qrDir)) {
      fs.mkdirSync(qrDir);
    }

    console.log('✅ Creating QR codes for drugs...');

    for (const drug of drugs) {
      // Generate QR code data
      const qrData = JSON.stringify({
        drugId: drug.drugId,
        name: drug.name,
        batchNumber: drug.batchNumber,
        expiryDate: drug.expiryDate,
        manufacturerId: drug.manufacturerId,
        timestamp: Date.now()
      });

      // Generate QR code image
      const qrCodePath = path.join(qrDir, `${drug.batchNumber}.png`);
      
      try {
        await QRCode.toFile(qrCodePath, qrData, {
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        console.log(`✅ Created QR code for ${drug.name} (${drug.batchNumber})`);
        console.log(`   File: ${qrCodePath}`);
        console.log(`   Data: ${qrData.substring(0, 100)}...`);
        
      } catch (error) {
        console.error(`❌ Error creating QR code for ${drug.batchNumber}:`, error);
      }
    }

    // Create a sample QR data for testing
    const sampleQRData = JSON.stringify({
      drugId: 'DRUG_001',
      name: 'Paracetamol 500mg',
      batchNumber: 'BATCH001',
      expiryDate: '2026-01-01T00:00:00.000Z',
      manufacturerId: '68e20fb1f72db7c621792e89',
      timestamp: Date.now()
    });

    const sampleQRPath = path.join(qrDir, 'sample-qr.png');
    await QRCode.toFile(sampleQRPath, sampleQRData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });

    console.log('✅ Created sample QR code for testing');
    console.log(`   File: ${sampleQRPath}`);
    console.log(`   Data: ${sampleQRData}`);

    console.log('\n🎉 Demo QR Codes Creation Complete!');
    console.log('\n📱 How to test QR Scanner:');
    console.log('1. Go to: http://localhost:3000/qr-scanner');
    console.log('2. Click "Nhập thủ công" (Manual Input)');
    console.log('3. Copy and paste this QR data:');
    console.log(`   ${sampleQRData}`);
    console.log('4. Click "Tra cứu" to see drug information');
    
    console.log('\n📁 QR Code files created in: qr-codes/');
    console.log('   You can print these QR codes and scan them with a QR scanner app');

  } catch (error) {
    console.error('❌ Error creating demo QR codes:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await createDemoQRCodes();
  process.exit(0);
};

main();
