/**
 * Script deploy contract trực tiếp lên Sepolia (không dùng Truffle)
 * Chạy: node scripts/deploy-sepolia-direct.js
 */

require('dotenv').config();
const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

async function deployContract() {
  try {
    console.log('🚀 BẮT ĐẦU DEPLOY SMART CONTRACT LÊN SEPOLIA...');
    console.log('================================================\n');

    // 1. Kiểm tra environment variables
    console.log('1️⃣ Kiểm tra Environment Variables:');
    console.log('-----------------------------------');
    
    const infuraProjectId = process.env.INFURA_PROJECT_ID;
    const privateKey = process.env.PRIVATE_KEY;
    const network = process.env.BLOCKCHAIN_NETWORK || 'sepolia';

    if (!infuraProjectId) {
      throw new Error('INFURA_PROJECT_ID chưa được set trong .env');
    }
    if (!privateKey) {
      throw new Error('PRIVATE_KEY chưa được set trong .env');
    }

    console.log(`   ✅ INFURA_PROJECT_ID: ${infuraProjectId.substring(0, 10)}...`);
    console.log(`   ✅ PRIVATE_KEY: Đã set (${privateKey.length} ký tự)`);
    console.log(`   ✅ Network: ${network}\n`);

    // 2. Tạo provider
    console.log('2️⃣ Tạo Web3 Provider:');
    console.log('---------------------');
    
    let cleanPrivateKey = privateKey.trim();
    
    // Remove quotes
    if ((cleanPrivateKey.startsWith('"') && cleanPrivateKey.endsWith('"')) || 
        (cleanPrivateKey.startsWith("'") && cleanPrivateKey.endsWith("'"))) {
      cleanPrivateKey = cleanPrivateKey.substring(1, cleanPrivateKey.length - 1);
    }
    
    // Remove 0x prefix
    if (cleanPrivateKey.startsWith('0x')) {
      cleanPrivateKey = cleanPrivateKey.substring(2);
    }

    const rpcUrl = `https://sepolia.infura.io/v3/${infuraProjectId}`;
    console.log(`   RPC URL: ${rpcUrl.replace(infuraProjectId, '***')}`);

    // Tạo Web3 instance trực tiếp với RPC URL
    const web3 = new Web3(rpcUrl);
    
    // Tạo account từ private key
    const account = web3.eth.accounts.privateKeyToAccount('0x' + cleanPrivateKey);
    web3.eth.accounts.wallet.add(account);
    const deployer = account.address;

    console.log(`   ✅ Provider đã được tạo`);
    console.log(`   📍 Deployer address: ${deployer}\n`);

    // 3. Kiểm tra balance
    console.log('3️⃣ Kiểm tra Balance:');
    console.log('---------------------');
    
    const balance = await web3.eth.getBalance(deployer);
    const balanceEth = web3.utils.fromWei(balance, 'ether');
    console.log(`   💰 Balance: ${balanceEth} ETH`);

    if (parseFloat(balanceEth) < 0.01) {
      throw new Error(`Balance không đủ! Cần ít nhất 0.01 ETH, hiện tại: ${balanceEth} ETH`);
    }
    console.log(`   ✅ Balance đủ để deploy\n`);

    // 4. Đọc contract
    console.log('4️⃣ Đọc Contract:');
    console.log('------------------');
    
    const contractPath = path.join(__dirname, '../build/contracts/DrugTraceability.json');
    
    if (!fs.existsSync(contractPath)) {
      throw new Error(`Contract chưa được compile! Chạy: npm run compile`);
    }

    const contractData = JSON.parse(fs.readFileSync(contractPath, 'utf8'));
    console.log(`   ✅ Đã đọc contract từ: ${contractPath}`);
    console.log(`   📝 Contract name: DrugTraceability\n`);

    // 5. Deploy contract
    console.log('5️⃣ Deploy Contract:');
    console.log('--------------------');
    
    const contract = new web3.eth.Contract(contractData.abi);
    const deployTx = contract.deploy({ data: contractData.bytecode });

    // Estimate gas
    console.log('   ⛽ Ước tính gas...');
    const gasEstimate = await deployTx.estimateGas({ from: deployer });
    console.log(`   ⛽ Gas estimate: ${gasEstimate}`);

    // Get gas price
    const gasPrice = await web3.eth.getGasPrice();
    console.log(`   ⛽ Gas price: ${web3.utils.fromWei(gasPrice, 'gwei')} gwei`);

    // Deploy
    console.log('   📤 Đang deploy contract...');
    const deployed = await deployTx.send({
      from: deployer,
      gas: gasEstimate,
      gasPrice: gasPrice
    });

    const contractAddress = deployed.options.address;
    const transactionHash = deployed.transactionHash || deployed.transaction?.hash || 'Pending...';
    const blockNumber = deployed.blockNumber || deployed.transaction?.blockNumber || 'Pending...';
    const gasUsed = deployed.gasUsed || 'Pending...';
    
    console.log(`   ✅ Contract deployed successfully!`);
    console.log(`   📍 Contract Address: ${contractAddress}`);
    console.log(`   🔗 Transaction Hash: ${transactionHash}`);
    console.log(`   📊 Block Number: ${blockNumber}`);
    console.log(`   ⛽ Gas Used: ${gasUsed}\n`);
    
    // Chờ transaction được confirm
    if (transactionHash && transactionHash !== 'Pending...') {
      console.log('   ⏳ Đang chờ transaction được confirm...');
      try {
        const receipt = await web3.eth.getTransactionReceipt(transactionHash);
        if (receipt) {
          console.log(`   ✅ Transaction đã được confirm trong block: ${receipt.blockNumber}`);
          console.log(`   ⛽ Gas Used (actual): ${receipt.gasUsed}\n`);
        }
      } catch (e) {
        console.log(`   ⏳ Transaction đang được xử lý...\n`);
      }
    }

    // 6. Cập nhật .env
    console.log('6️⃣ Cập nhật .env:');
    console.log('------------------');
    
    const envPath = path.join(__dirname, '../.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    // Tìm và thay thế CONTRACT_ADDRESS_SEPOLIA
    if (envContent.includes('CONTRACT_ADDRESS_SEPOLIA=')) {
      envContent = envContent.replace(/CONTRACT_ADDRESS_SEPOLIA=.*/, `CONTRACT_ADDRESS_SEPOLIA=${contractAddress}`);
      console.log('   ✅ Đã cập nhật CONTRACT_ADDRESS_SEPOLIA');
    } else {
      envContent += `\nCONTRACT_ADDRESS_SEPOLIA=${contractAddress}\n`;
      console.log('   ✅ Đã thêm CONTRACT_ADDRESS_SEPOLIA');
    }
    
    fs.writeFileSync(envPath, envContent);
    console.log(`   💾 Đã lưu vào .env\n`);

    // 7. Test contract
    console.log('7️⃣ Test Contract:');
    console.log('-----------------');
    
    const testContract = new web3.eth.Contract(contractData.abi, contractAddress);
    
    try {
      const totalBatches = await testContract.methods.getTotalDrugBatches().call();
      console.log(`   ✅ Contract hoạt động!`);
      console.log(`   📊 Total Drug Batches: ${totalBatches}`);
    } catch (error) {
      console.log(`   ⚠️  Không thể test contract (có thể cần chờ vài block): ${error.message}`);
    }

    // 8. Tổng kết
    console.log('\n🎉 DEPLOY HOÀN THÀNH!');
    console.log('======================');
    console.log(`✅ Contract Address: ${contractAddress}`);
    console.log(`✅ Transaction Hash: ${deployed.transactionHash}`);
    console.log(`✅ Block Number: ${deployed.blockNumber}`);
    console.log(`✅ Gas Used: ${deployed.gasUsed}`);
    console.log(`✅ .env đã được cập nhật`);
    
    console.log('\n📋 NEXT STEPS:');
    console.log('1. Test kết nối: npm run test:blockchain');
    console.log('2. Khởi động server: npm start');
    console.log('3. Test tạo transaction và xem trên Etherscan');
    console.log(`4. Xem contract trên Etherscan: https://sepolia.etherscan.io/address/${contractAddress}`);
    
    return {
      success: true,
      contractAddress,
      transactionHash: transactionHash,
      blockNumber: blockNumber
    };

  } catch (error) {
    console.error('\n❌ DEPLOY FAILED:');
    console.error('==================');
    console.error(`Error: ${error.message}`);
    console.error(`Stack: ${error.stack}`);
    
    console.log('\n🔧 TROUBLESHOOTING:');
    console.log('1. Kiểm tra INFURA_PROJECT_ID trong .env');
    console.log('2. Kiểm tra PRIVATE_KEY trong .env');
    console.log('3. Kiểm tra balance có đủ không (cần ít nhất 0.01 ETH)');
    console.log('4. Kiểm tra contract đã được compile chưa: npm run compile');
    console.log('5. Kiểm tra kết nối internet');
    
    process.exit(1);
  }
}

// Chạy deploy
deployContract()
  .then(result => {
    if (result && result.success) {
      console.log('\n✅ Deploy completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Deploy failed!');
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n❌ Unexpected error:', error);
    process.exit(1);
  });

