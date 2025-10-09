const mongoose = require('mongoose');
const User = require('../models/User');
const Drug = require('../models/Drug');
const Review = require('../models/Review');

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

// Setup minimal demo reviews
const setupMinimalReviewDemo = async () => {
  try {
    console.log('🚀 Setting up Minimal Review Demo Data...');

    // Get users and drugs
    const users = await User.find().limit(3);
    const drugs = await Drug.find().limit(2);

    if (users.length === 0 || drugs.length === 0) {
      console.error('❌ No users or drugs found. Please run setup scripts first.');
      return;
    }

    // Clear existing reviews
    await Review.deleteMany({});
    console.log('✅ Cleared existing reviews');

    // Create minimal reviews with only required fields
    const reviews = [
      {
        targetType: 'drug',
        targetId: drugs[0]._id,
        targetName: drugs[0].name,
        overallRating: 5,
        title: 'Thuốc rất hiệu quả',
        content: 'Thuốc có hiệu quả tốt, không có tác dụng phụ.',
        reviewType: 'usage',
        isAnonymous: true,
        status: 'approved'
      },
      {
        targetType: 'drug',
        targetId: drugs[0]._id,
        targetName: drugs[0].name,
        overallRating: 4,
        title: 'Thuốc tốt',
        content: 'Thuốc có hiệu quả, một số tác dụng phụ nhẹ.',
        reviewType: 'usage',
        isAnonymous: true,
        status: 'approved'
      },
      {
        targetType: 'drug',
        targetId: drugs[1]._id,
        targetName: drugs[1].name,
        overallRating: 3,
        title: 'Thuốc trung bình',
        content: 'Thuốc có tác dụng nhưng không nổi bật.',
        reviewType: 'usage',
        reviewer: users[1]._id,
        isAnonymous: false,
        status: 'approved'
      }
    ];

    // Create reviews
    for (const reviewData of reviews) {
      const review = new Review(reviewData);
      await review.save();
      console.log(`✅ Created review: ${review.title}`);
    }

    console.log('🎉 Minimal Review Demo Data Setup Complete!');
    console.log('\n📝 Created Reviews:');
    console.log('1. Thuốc rất hiệu quả (5 sao)');
    console.log('2. Thuốc tốt (4 sao)');
    console.log('3. Thuốc trung bình (3 sao)');
    
    console.log('\n🔗 Access URLs:');
    console.log('- Review Management: http://localhost:3000/reviews');
    console.log('- Dashboard: http://localhost:3000/dashboard');

  } catch (error) {
    console.error('❌ Error setting up minimal review demo:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await setupMinimalReviewDemo();
  process.exit(0);
};

main();
