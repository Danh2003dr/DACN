const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

async function mockDeploy() {
  try {
    console.log('🚀 MOCK DEPLOY SMART CONTRACT...');
    console.log('=================================');

    // Tạo mock contract address
    const contractAddress = `0x${crypto.randomBytes(20).toString('hex')}`;
    const transactionHash = `0x${crypto.randomBytes(32).toString('hex')}`;
    const blockNumber = Math.floor(Math.random() * 1000000) + 1000000;
    const gasUsed = Math.floor(Math.random() * 100000) + 50000;

    console.log('📍 Mock Contract Address:', contractAddress);
    console.log('🔗 Mock Transaction Hash:', transactionHash);
    console.log('📊 Mock Block Number:', blockNumber);
    console.log('⛽ Mock Gas Used:', gasUsed);

    // Tạo contract info
    const contractInfo = {
      address: contractAddress,
      abi: [
        {
          "inputs": [],
          "stateMutability": "nonpayable",
          "type": "constructor"
        },
        {
          "inputs": [
            {"internalType": "string", "name": "_drugId", "type": "string"},
            {"internalType": "string", "name": "_name", "type": "string"},
            {"internalType": "string", "name": "_activeIngredient", "type": "string"},
            {"internalType": "string", "name": "_manufacturerId", "type": "string"},
            {"internalType": "string", "name": "_batchNumber", "type": "string"},
            {"internalType": "uint256", "name": "_productionDate", "type": "uint256"},
            {"internalType": "uint256", "name": "_expiryDate", "type": "uint256"},
            {"internalType": "string", "name": "_qualityTestResult", "type": "string"},
            {"internalType": "string", "name": "_qrCodeData", "type": "string"}
          ],
          "name": "createDrugBatch",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [{"internalType": "string", "name": "_drugId", "type": "string"}],
          "name": "getDrugBatch",
          "outputs": [
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "uint256", "name": "", "type": "uint256"},
            {"internalType": "uint256", "name": "", "type": "uint256"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "address", "name": "", "type": "address"},
            {"internalType": "uint256", "name": "", "type": "uint256"},
            {"internalType": "bool", "name": "", "type": "bool"},
            {"internalType": "bool", "name": "", "type": "bool"},
            {"internalType": "string", "name": "", "type": "string"},
            {"internalType": "uint256", "name": "", "type": "uint256"}
          ],
          "stateMutability": "view",
          "type": "function"
        },
        {
          "inputs": [
            {"internalType": "string", "name": "_drugId", "type": "string"},
            {"internalType": "string", "name": "_name", "type": "string"},
            {"internalType": "string", "name": "_activeIngredient", "type": "string"},
            {"internalType": "string", "name": "_qualityTestResult", "type": "string"}
          ],
          "name": "updateDrugBatch",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {"internalType": "string", "name": "_drugId", "type": "string"},
            {"internalType": "string", "name": "_reason", "type": "string"}
          ],
          "name": "recallDrugBatch",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        },
        {
          "inputs": [
            {"internalType": "string", "name": "_drugId", "type": "string"},
            {"internalType": "address", "name": "_to", "type": "address"},
            {"internalType": "string", "name": "_location", "type": "string"},
            {"internalType": "string", "name": "_status", "type": "string"},
            {"internalType": "string", "name": "_notes", "type": "string"}
          ],
          "name": "recordDistribution",
          "outputs": [],
          "stateMutability": "nonpayable",
          "type": "function"
        }
      ],
      transactionHash: transactionHash,
      blockNumber: blockNumber,
      gasUsed: gasUsed,
      deployer: `0x${crypto.randomBytes(20).toString('hex')}`,
      deployedAt: new Date().toISOString(),
      mock: true
    };

    // Lưu contract info
    const contractInfoPath = path.join(__dirname, '../contract-info.json');
    fs.writeFileSync(contractInfoPath, JSON.stringify(contractInfo, null, 2));
    console.log('💾 Contract info saved to:', contractInfoPath);

    // Cập nhật .env file
    const envPath = path.join(__dirname, '../.env');
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    } else {
      // Tạo .env từ env.example
      const envExamplePath = path.join(__dirname, '../env.example');
      if (fs.existsSync(envExamplePath)) {
        envContent = fs.readFileSync(envExamplePath, 'utf8');
      }
    }
    
    // Thêm hoặc cập nhật CONTRACT_ADDRESS
    if (envContent.includes('CONTRACT_ADDRESS=')) {
      envContent = envContent.replace(/CONTRACT_ADDRESS=.*/, `CONTRACT_ADDRESS=${contractAddress}`);
    } else {
      envContent += `\nCONTRACT_ADDRESS=${contractAddress}\n`;
    }
    
    // Thêm PRIVATE_KEY nếu chưa có
    if (!envContent.includes('PRIVATE_KEY=')) {
      const privateKey = `0x${crypto.randomBytes(32).toString('hex')}`;
      envContent += `PRIVATE_KEY=${privateKey}\n`;
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log('🔧 Updated .env file with contract address');

    // Tạo mock blockchain data
    const mockBlockchainData = {
      network: 'mock',
      contractAddress: contractAddress,
      deployedAt: new Date().toISOString(),
      status: 'active',
      mock: true
    };

    const blockchainDataPath = path.join(__dirname, '../blockchain-data.json');
    fs.writeFileSync(blockchainDataPath, JSON.stringify(mockBlockchainData, null, 2));
    console.log('💾 Blockchain data saved to:', blockchainDataPath);

    console.log('\n🎉 MOCK DEPLOY HOÀN THÀNH!');
    console.log('===========================');
    console.log('✅ Contract Address:', contractAddress);
    console.log('✅ ABI saved to contract-info.json');
    console.log('✅ .env file updated');
    console.log('✅ Mock blockchain data created');
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Khởi động server: npm start');
    console.log('2. Test API endpoints với mock contract');
    console.log('3. Kiểm tra blockchain integration');
    console.log('4. Sử dụng mock mode cho development');

    return {
      success: true,
      contractAddress,
      transactionHash,
      blockNumber,
      mock: true
    };

  } catch (error) {
    console.error('❌ Mock deploy failed:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// Chạy mock deploy
mockDeploy()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Mock deploy completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Mock deploy failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  });
