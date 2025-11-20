const HDWalletProvider = require('@truffle/hdwallet-provider');
require('dotenv').config();

// Helper function để tạo provider
const createProvider = (rpcUrl) => {
  if (!process.env.MNEMONIC && !process.env.PRIVATE_KEY) {
    throw new Error('Please set MNEMONIC or PRIVATE_KEY in .env file');
  }
  
  let providerOptions;
  
  if (process.env.MNEMONIC) {
    providerOptions = { mnemonic: process.env.MNEMONIC.trim() };
  } else {
    // Validate private key
    let privateKey = process.env.PRIVATE_KEY.trim();
    
    // Remove quotes if user added them
    if ((privateKey.startsWith('"') && privateKey.endsWith('"')) || 
        (privateKey.startsWith("'") && privateKey.endsWith("'"))) {
      privateKey = privateKey.substring(1, privateKey.length - 1);
    }
    
    // Remove 0x prefix if exists
    if (privateKey.startsWith('0x')) {
      privateKey = privateKey.substring(2);
    }
    
    // Check length and hex format
    if (privateKey.length !== 64 || !/^[0-9a-fA-F]+$/.test(privateKey)) {
      throw new Error('Invalid PRIVATE_KEY format. Expected 64 hex characters (32 bytes). Please check your .env file.');
    }
    
    providerOptions = { privateKeys: [privateKey] };
  }
  
  return new HDWalletProvider({
    ...providerOptions,
    providerOrUrl: rpcUrl
  });
};

module.exports = {
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*"
    },
    // Ethereum Networks
    sepolia: {
      provider: () => createProvider(`https://sepolia.infura.io/v3/${process.env.INFURA_PROJECT_ID}`),
      network_id: 11155111,
      gas: 5500000,
      gasPrice: 20000000000, // 20 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    mainnet: {
      provider: () => createProvider(`https://mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`),
      network_id: 1,
      gas: 5500000,
      gasPrice: 30000000000, // 30 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    // Binance Smart Chain (BSC)
    bsc_testnet: {
      provider: () => createProvider('https://data-seed-prebsc-1-s1.binance.org:8545'),
      network_id: 97,
      gas: 5500000,
      gasPrice: 10000000000, // 10 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    bsc_mainnet: {
      provider: () => createProvider('https://bsc-dataseed1.binance.org'),
      network_id: 56,
      gas: 5500000,
      gasPrice: 5000000000, // 5 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    // Polygon
    polygon_mumbai: {
      provider: () => createProvider('https://rpc-mumbai.maticvigil.com'),
      network_id: 80001,
      gas: 5500000,
      gasPrice: 30000000000, // 30 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    polygon_mainnet: {
      provider: () => createProvider('https://polygon-rpc.com'),
      network_id: 137,
      gas: 5500000,
      gasPrice: 30000000000, // 30 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    // Layer 2: Arbitrum
    arbitrum_sepolia: {
      provider: () => createProvider('https://sepolia-rollup.arbitrum.io/rpc'),
      network_id: 421614,
      gas: 5500000,
      gasPrice: 100000000, // 0.1 gwei (Layer 2 có gas rẻ hơn)
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    arbitrum_one: {
      provider: () => createProvider('https://arb1.arbitrum.io/rpc'),
      network_id: 42161,
      gas: 5500000,
      gasPrice: 100000000, // 0.1 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    // Layer 2: Optimism
    optimism_sepolia: {
      provider: () => createProvider('https://sepolia.optimism.io'),
      network_id: 11155420,
      gas: 5500000,
      gasPrice: 100000000, // 0.1 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    },
    optimism_mainnet: {
      provider: () => createProvider('https://mainnet.optimism.io'),
      network_id: 10,
      gas: 5500000,
      gasPrice: 100000000, // 0.1 gwei
      confirmations: 2,
      timeoutBlocks: 200,
      skipDryRun: true
    }
  },
  compilers: {
    solc: {
      version: "0.8.19",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200 // Tối ưu hóa cho gas usage
        },
        viaIR: true // Sử dụng IR-based codegen để tối ưu hóa tốt hơn
      }
    }
  },
  contracts_build_directory: "./build/contracts",
  migrations_directory: "./migrations"
};
