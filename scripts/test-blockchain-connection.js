/**
 * Script để test kết nối blockchain thực (Sepolia)
 * Chạy: node scripts/test-blockchain-connection.js
 */

require('dotenv').config();
const { Web3 } = require('web3');
const HDWalletProvider = require('@truffle/hdwallet-provider');

async function testBlockchainConnection() {
  console.log('🧪 TEST KẾT NỐI BLOCKCHAIN THỰC');
  console.log('================================\n');

  // 1. Kiểm tra environment variables
  console.log('1️⃣ Kiểm tra Environment Variables:');
  console.log('-----------------------------------');
  
  const requiredVars = {
    'BLOCKCHAIN_NETWORK': process.env.BLOCKCHAIN_NETWORK,
    'INFURA_PROJECT_ID': process.env.INFURA_PROJECT_ID ? '✅ Đã set' : '❌ Chưa set',
    'PRIVATE_KEY': process.env.PRIVATE_KEY ? '✅ Đã set (ẩn)' : '❌ Chưa set',
    'CONTRACT_ADDRESS_SEPOLIA': process.env.CONTRACT_ADDRESS_SEPOLIA || process.env.CONTRACT_ADDRESS || '❌ Chưa set'
  };

  for (const [key, value] of Object.entries(requiredVars)) {
    if (key === 'PRIVATE_KEY' && value === '✅ Đã set (ẩn)') {
      const pk = process.env.PRIVATE_KEY;
      const isValid = pk && pk.length >= 64 && /^[0-9a-fA-F]+$/.test(pk.replace('0x', ''));
      console.log(`   ${key}: ${isValid ? '✅ Format hợp lệ' : '❌ Format không hợp lệ'}`);
    } else {
      console.log(`   ${key}: ${value}`);
    }
  }

  const network = process.env.BLOCKCHAIN_NETWORK || 'development';
  console.log(`\n   Network hiện tại: ${network}`);

  if (network === 'development' || network === 'mock') {
    console.log('   ⚠️  Đang dùng development/mock network, không test blockchain thực');
    return;
  }

  // 2. Test kết nối RPC
  console.log('\n2️⃣ Test kết nối RPC:');
  console.log('---------------------');

  try {
    if (!process.env.INFURA_PROJECT_ID) {
      throw new Error('INFURA_PROJECT_ID chưa được set');
    }

    const rpcUrl = `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
    console.log(`   RPC URL: ${rpcUrl.replace(process.env.INFURA_PROJECT_ID, '***')}`);

    const web3 = new Web3(rpcUrl);
    
    // Test getBlockNumber
    const blockNumber = await web3.eth.getBlockNumber();
    console.log(`   ✅ Kết nối thành công!`);
    console.log(`   📊 Block number hiện tại: ${blockNumber}`);

    // Test getGasPrice
    const gasPrice = await web3.eth.getGasPrice();
    console.log(`   ⛽ Gas price: ${web3.utils.fromWei(gasPrice, 'gwei')} gwei`);

  } catch (error) {
    console.error(`   ❌ Lỗi kết nối RPC: ${error.message}`);
    return;
  }

  // 3. Test wallet
  console.log('\n3️⃣ Test Wallet:');
  console.log('----------------');

  try {
    if (!process.env.PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY chưa được set');
    }

    let privateKey = process.env.PRIVATE_KEY.trim();
    
    // Remove quotes
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    
    // Remove 0x prefix
    if (privateKey.startsWith('0x')) {
      privateKey = privateKey.substring(2);
    }

    // Validate
    if (privateKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(privateKey)) {
      throw new Error('Private key format không hợp lệ. Cần 64 hex characters.');
    }

    const provider = new HDWalletProvider({
      privateKeys: [privateKey],
      providerOrUrl: `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
    });

    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    const account = accounts[0];

    console.log(`   ✅ Wallet hợp lệ!`);
    console.log(`   📍 Address: ${account}`);

    // Check balance
    const balance = await web3.eth.getBalance(account);
    const balanceEth = web3.utils.fromWei(balance, 'ether');
    console.log(`   💰 Balance: ${balanceEth} ETH`);

    if (parseFloat(balanceEth) < 0.001) {
      console.log(`   ⚠️  Balance thấp! Cần ít nhất 0.001 ETH để deploy và test.`);
      console.log(`   💡 Lấy Sepolia ETH từ: https://sepoliafaucet.com`);
    } else {
      console.log(`   ✅ Balance đủ để test!`);
    }

    provider.engine.stop();

  } catch (error) {
    console.error(`   ❌ Lỗi wallet: ${error.message}`);
    return;
  }

  // 4. Test contract (nếu có)
  console.log('\n4️⃣ Test Smart Contract:');
  console.log('----------------------');

  const contractAddress = process.env.CONTRACT_ADDRESS_SEPOLIA || process.env.CONTRACT_ADDRESS;

  if (!contractAddress || contractAddress === '0x...') {
    console.log('   ⚠️  Contract address chưa được set hoặc là placeholder');
    console.log('   💡 Deploy contract trước: npx truffle migrate --network sepolia');
    return;
  }

  try {
    const DrugTraceability = require('../build/contracts/DrugTraceability.json');
    const rpcUrl = `https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`;
    const web3 = new Web3(rpcUrl);

    const contract = new web3.eth.Contract(
      DrugTraceability.abi,
      contractAddress
    );

    // Test getTotalDrugBatches
    const totalBatches = await contract.methods.getTotalDrugBatches().call();
    console.log(`   ✅ Contract hợp lệ!`);
    console.log(`   📍 Contract Address: ${contractAddress}`);
    console.log(`   📊 Total Drug Batches: ${totalBatches}`);

    // Test getContractStats
    const stats = await contract.methods.getContractStats().call();
    console.log(`   📈 Stats:`);
    console.log(`      - Total: ${stats.totalBatches}`);
    console.log(`      - Active: ${stats.activeBatches}`);
    console.log(`      - Recalled: ${stats.recalledBatches}`);
    console.log(`      - Expired: ${stats.expiredBatches}`);

    // Verify trên Etherscan
    console.log(`\n   🔗 Xem trên Etherscan:`);
    console.log(`      https://sepolia.etherscan.io/address/${contractAddress}`);

  } catch (error) {
    console.error(`   ❌ Lỗi contract: ${error.message}`);
    console.log(`   💡 Kiểm tra:`);
    console.log(`      - Contract đã deploy chưa?`);
    console.log(`      - Contract address đúng chưa?`);
    console.log(`      - File build/contracts/DrugTraceability.json tồn tại chưa?`);
  }

  // 5. Tổng kết
  console.log('\n✅ HOÀN THÀNH TEST!');
  console.log('==================');
  console.log('\n📋 Next steps:');
  console.log('   1. Nếu tất cả đều ✅, bạn có thể ghi transactions lên blockchain');
  console.log('   2. Khởi động server: npm start');
  console.log('   3. Test tạo drug mới và kiểm tra transaction trên Etherscan');
  console.log('   4. Sync dữ liệu hiện có: node scripts/sync-drugs-to-blockchain.js');
}

// Chạy test
testBlockchainConnection()
  .then(() => {
    console.log('\n');
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Lỗi không mong đợi:', error);
    process.exit(1);
  });

