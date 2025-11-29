const mongoose = require('mongoose');
require('dotenv').config();
const Drug = require('../models/Drug');
const BlockchainTransaction = require('../models/BlockchainTransaction');

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/drug-traceability';
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Generate random transaction hash
const generateTxHash = () => {
  return '0x' + Array.from({ length: 64 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

// Generate random address
const generateAddress = () => {
  return '0x' + Array.from({ length: 40 }, () => 
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
};

// Networks
const networks = [
  'development',
  'sepolia',
  'polygon_mumbai',
  'bsc_testnet'
];

// Transaction types
const transactionTypes = [
  'createDrugBatch',
  'updateDrugBatch',
  'recallDrugBatch',
  'recordDistribution',
  'verifyDrugBatch'
];

// Statuses
const statuses = ['success', 'failed', 'pending'];

// Seed blockchain transactions
const seedBlockchainTransactions = async () => {
  try {
    console.log('Starting to seed blockchain transactions...');

    // Get all drugs with blockchain data
    const drugs = await Drug.find({
      'blockchain.blockchainId': { $exists: true, $ne: null }
    }).limit(50);

    if (drugs.length === 0) {
      console.log('No drugs with blockchain data found. Creating transactions without drug references...');
    }

    console.log(`Found ${drugs.length} drugs with blockchain data`);

    // Clear existing transactions (optional - comment out if you want to keep existing data)
    // await BlockchainTransaction.deleteMany({});
    // console.log('Cleared existing blockchain transactions');

    const transactions = [];
    const now = new Date();
    
    // Create transactions for each drug
    for (let i = 0; i < Math.min(drugs.length, 30); i++) {
      const drug = drugs[i];
      const network = networks[Math.floor(Math.random() * networks.length)];
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      // Create 1-3 transactions per drug
      const numTransactions = Math.floor(Math.random() * 3) + 1;
      
      for (let j = 0; j < numTransactions; j++) {
        const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000); // Random time in last 30 days
        const blockNumber = Math.floor(Math.random() * 10000000) + 1000000;
        const gasUsed = Math.floor(Math.random() * 200000) + 50000;
        const gasPrice = (Math.random() * 100 + 10).toFixed(0);
        
        const transaction = {
          transactionHash: generateTxHash(),
          blockNumber: blockNumber,
          drugId: drug._id,
          from: generateAddress(),
          to: generateAddress(),
          gasUsed: gasUsed,
          gasPrice: gasPrice,
          timestamp: timestamp,
          status: status,
          network: network,
          contractAddress: generateAddress(),
          value: '0',
          transactionType: transactionType,
          confirmations: Math.floor(Math.random() * 100),
          metadata: {
            drugName: drug.name,
            batchNumber: drug.batchNumber,
            action: transactionType
          }
        };
        
        transactions.push(transaction);
      }
    }

    // Create some additional transactions without drug references (for testing)
    for (let i = 0; i < 20; i++) {
      const network = networks[Math.floor(Math.random() * networks.length)];
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      const timestamp = new Date(now.getTime() - Math.random() * 30 * 24 * 60 * 60 * 1000);
      const blockNumber = Math.floor(Math.random() * 10000000) + 1000000;
      const gasUsed = Math.floor(Math.random() * 200000) + 50000;
      const gasPrice = (Math.random() * 100 + 10).toFixed(0);
      
      const transaction = {
        transactionHash: generateTxHash(),
        blockNumber: blockNumber,
        drugId: null,
        from: generateAddress(),
        to: generateAddress(),
        gasUsed: gasUsed,
        gasPrice: gasPrice,
        timestamp: timestamp,
        status: status,
        network: network,
        contractAddress: generateAddress(),
        value: '0',
        transactionType: transactionType,
        confirmations: Math.floor(Math.random() * 100),
        metadata: {
          action: transactionType
        }
      };
      
      transactions.push(transaction);
    }

    // Insert transactions in batches
    const batchSize = 50;
    let inserted = 0;
    
    for (let i = 0; i < transactions.length; i += batchSize) {
      const batch = transactions.slice(i, i + batchSize);
      try {
        await BlockchainTransaction.insertMany(batch, { ordered: false });
        inserted += batch.length;
        console.log(`Inserted ${inserted}/${transactions.length} transactions...`);
      } catch (error) {
        // Skip duplicates
        if (error.code === 11000) {
          console.log(`Skipped ${batch.length} duplicate transactions`);
        } else {
          console.error('Error inserting batch:', error);
        }
      }
    }

    console.log(`\n✅ Successfully seeded ${inserted} blockchain transactions!`);
    
    // Print summary
    const stats = await BlockchainTransaction.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n📊 Transaction Status Summary:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    const networkStats = await BlockchainTransaction.aggregate([
      {
        $group: {
          _id: '$network',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n🌐 Network Summary:');
    networkStats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });

    const totalGas = await BlockchainTransaction.aggregate([
      {
        $group: {
          _id: null,
          totalGas: { $sum: '$gasUsed' }
        }
      }
    ]);

    if (totalGas.length > 0) {
      console.log(`\n⛽ Total Gas Used: ${totalGas[0].totalGas.toLocaleString('vi-VN')}`);
    }

  } catch (error) {
    console.error('Error seeding blockchain transactions:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await seedBlockchainTransactions();
  await mongoose.connection.close();
  console.log('\n✅ Database connection closed');
  process.exit(0);
};

main();

