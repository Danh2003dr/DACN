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

// Setup demo reviews
const setupReviewDemo = async () => {
  try {
    console.log('🚀 Setting up Review Demo Data...');

    // Get users and drugs
    const users = await User.find().limit(5);
    const drugs = await Drug.find().limit(3);

    if (users.length === 0 || drugs.length === 0) {
      console.error('❌ No users or drugs found. Please run setup scripts first.');
      return;
    }

    // Clear existing reviews
    await Review.deleteMany({});
    console.log('✅ Cleared existing reviews');

    // Create demo reviews
    const demoReviews = [
      {
        targetType: 'drug',
        targetId: drugs[0]._id,
        targetName: drugs[0].name || `Lô thuốc ${drugs[0].batchNumber}`,
        overallRating: 5,
        criteriaRatings: {
          drugQuality: 5,
          effectiveness: 5,
          sideEffects: 4,
          packaging: 5
        },
        title: 'Thuốc rất hiệu quả',
        content: 'Tôi đã sử dụng thuốc này trong 2 tuần và thấy hiệu quả rõ rệt. Không có tác dụng phụ nào, đóng gói cẩn thận. Rất hài lòng với chất lượng.',
        reviewType: 'usage',
        isAnonymous: true,
        reviewerInfo: {
          role: 'patient',
          experience: 'regular'
        },
        isVerified: true,
        verificationInfo: {
          purchaseDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
          batchNumber: drugs[0].batchNumber,
          verificationMethod: 'qr_code'
        },
        tags: ['hiệu quả', 'không tác dụng phụ', 'chất lượng tốt'],
        status: 'approved',
        helpfulVotes: 12,
        notHelpfulVotes: 1
      },
      {
        targetType: 'drug',
        targetId: drugs[0]._id,
        targetName: drugs[0].name,
        overallRating: 4,
        criteriaRatings: {
          drugQuality: 4,
          effectiveness: 4,
          sideEffects: 3,
          packaging: 4
        },
        title: 'Thuốc tốt nhưng có tác dụng phụ nhẹ',
        content: 'Thuốc có hiệu quả nhưng tôi gặp một số tác dụng phụ nhẹ như buồn ngủ. Chất lượng tổng thể vẫn tốt.',
        reviewType: 'usage',
        isAnonymous: true,
        reviewerInfo: {
          role: 'patient',
          experience: 'first_time'
        },
        isVerified: false,
        tags: ['tốt', 'tác dụng phụ nhẹ'],
        status: 'approved',
        helpfulVotes: 8,
        notHelpfulVotes: 2
      },
      {
        targetType: 'drug',
        targetId: drugs[1]._id,
        targetName: drugs[1].name || `Lô thuốc ${drugs[1].batchNumber}`,
        overallRating: 3,
        criteriaRatings: {
          drugQuality: 3,
          effectiveness: 3,
          sideEffects: 3,
          packaging: 3
        },
        title: 'Thuốc trung bình',
        content: 'Thuốc có tác dụng nhưng không nổi bật. Đóng gói bình thường, giá cả hợp lý.',
        reviewType: 'usage',
        reviewer: users[1]._id,
        isAnonymous: false,
        reviewerInfo: {
          role: users[1].role
        },
        isVerified: true,
        verificationInfo: {
          purchaseDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          batchNumber: drugs[1].batchNumber,
          verificationMethod: 'receipt'
        },
        tags: ['trung bình', 'giá hợp lý'],
        status: 'approved',
        helpfulVotes: 5,
        notHelpfulVotes: 3
      },
      {
        targetType: 'distributor',
        targetId: users[2]._id,
        targetName: users[2].organizationInfo?.name || 'Nhà phân phối ABC',
        overallRating: 5,
        criteriaRatings: {
          deliveryTime: 5,
          customerService: 5,
          communication: 4,
          reliability: 5
        },
        title: 'Dịch vụ giao hàng xuất sắc',
        content: 'Nhà phân phối này có dịch vụ giao hàng rất tốt. Thời gian giao hàng đúng hẹn, nhân viên thân thiện và hỗ trợ nhiệt tình.',
        reviewType: 'service',
        isAnonymous: true,
        reviewerInfo: {
          role: 'hospital',
          location: 'TP.HCM'
        },
        isVerified: false,
        tags: ['giao hàng tốt', 'dịch vụ xuất sắc', 'đúng hẹn'],
        status: 'approved',
        helpfulVotes: 15,
        notHelpfulVotes: 0
      },
      {
        targetType: 'hospital',
        targetId: users[3]._id,
        targetName: users[3].organizationInfo?.name || 'Bệnh viện XYZ',
        overallRating: 4,
        criteriaRatings: {
          deliveryTime: 4,
          customerService: 5,
          communication: 4,
          reliability: 4
        },
        title: 'Bệnh viện có dịch vụ tốt',
        content: 'Bệnh viện có dịch vụ chăm sóc bệnh nhân tốt. Nhân viên y tế nhiệt tình, cơ sở vật chất hiện đại.',
        reviewType: 'service',
        reviewer: users[4]._id,
        isAnonymous: false,
        reviewerInfo: {
          role: users[4].role
        },
        isVerified: false,
        tags: ['dịch vụ tốt', 'nhân viên nhiệt tình'],
        status: 'approved',
        helpfulVotes: 10,
        notHelpfulVotes: 1
      },
      ...(drugs.length >= 3 ? [{
        targetType: 'drug',
        targetId: drugs[2]._id,
        targetName: drugs[2].name || `Lô thuốc ${drugs[2].batchNumber}`,
        overallRating: 2,
        criteriaRatings: {
          drugQuality: 2,
          effectiveness: 2,
          sideEffects: 2,
          packaging: 3
        },
        title: 'Thuốc không hiệu quả như mong đợi',
        content: 'Thuốc không có hiệu quả rõ rệt sau 1 tuần sử dụng. Có một số tác dụng phụ khó chịu. Đóng gói có vẻ cũ.',
        reviewType: 'complaint',
        isAnonymous: true,
        reviewerInfo: {
          role: 'patient',
          experience: 'occasional'
        },
        isVerified: false,
        tags: ['không hiệu quả', 'tác dụng phụ', 'chất lượng kém'],
        status: 'pending',
        helpfulVotes: 3,
        notHelpfulVotes: 8
      }] : []),
      {
        targetType: 'manufacturer',
        targetId: users[0]._id,
        targetName: users[0].organizationInfo?.name || 'Nhà sản xuất Dược phẩm ABC',
        overallRating: 5,
        criteriaRatings: {
          deliveryTime: 5,
          customerService: 5,
          communication: 5,
          reliability: 5
        },
        title: 'Nhà sản xuất uy tín',
        content: 'Nhà sản xuất này rất uy tín trong ngành dược phẩm. Sản phẩm chất lượng cao, dịch vụ hỗ trợ chuyên nghiệp.',
        reviewType: 'recommendation',
        isAnonymous: true,
        reviewerInfo: {
          role: 'distributor',
          location: 'Hà Nội'
        },
        isVerified: true,
        verificationInfo: {
          verificationMethod: 'manual'
        },
        tags: ['uy tín', 'chất lượng cao', 'chuyên nghiệp'],
        status: 'approved',
        helpfulVotes: 20,
        notHelpfulVotes: 0
      },
      {
        targetType: 'drug',
        targetId: drugs[0]._id,
        targetName: drugs[0].name,
        overallRating: 4,
        criteriaRatings: {
          drugQuality: 4,
          effectiveness: 4,
          sideEffects: 4,
          packaging: 4
        },
        title: 'Thuốc ổn định',
        content: 'Thuốc có hiệu quả ổn định, ít tác dụng phụ. Đóng gói đẹp, dễ sử dụng. Giá cả phù hợp.',
        reviewType: 'usage',
        isAnonymous: true,
        reviewerInfo: {
          role: 'patient',
          experience: 'regular'
        },
        isVerified: true,
        verificationInfo: {
          purchaseDate: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
          batchNumber: drugs[0].batchNumber,
          verificationMethod: 'qr_code'
        },
        tags: ['ổn định', 'ít tác dụng phụ', 'giá phù hợp'],
        status: 'approved',
        helpfulVotes: 7,
        notHelpfulVotes: 1
      }
    ];

    // Create reviews
    for (const reviewData of demoReviews) {
      // Remove null values from verificationInfo
      if (reviewData.verificationInfo) {
        Object.keys(reviewData.verificationInfo).forEach(key => {
          if (reviewData.verificationInfo[key] === null) {
            delete reviewData.verificationInfo[key];
          }
        });
      }
      
      const review = new Review(reviewData);
      await review.save();
      console.log(`✅ Created review: ${review.title}`);
    }

    console.log('🎉 Review Demo Data Setup Complete!');
    console.log('\n📝 Created Reviews:');
    console.log('1. Thuốc rất hiệu quả (5 sao) - Đã xác minh');
    console.log('2. Thuốc tốt nhưng có tác dụng phụ nhẹ (4 sao)');
    console.log('3. Thuốc trung bình (3 sao) - Không ẩn danh');
    console.log('4. Dịch vụ giao hàng xuất sắc (5 sao) - Nhà phân phối');
    console.log('5. Bệnh viện có dịch vụ tốt (4 sao) - Bệnh viện');
    console.log('6. Thuốc không hiệu quả như mong đợi (2 sao) - Chờ duyệt');
    console.log('7. Nhà sản xuất uy tín (5 sao) - Đã xác minh');
    console.log('8. Thuốc ổn định (4 sao) - Đã xác minh');
    
    console.log('\n🔗 Access URLs:');
    console.log('- Review Management: http://localhost:3000/reviews');
    console.log('- Dashboard: http://localhost:3000/dashboard');

  } catch (error) {
    console.error('❌ Error setting up review demo:', error);
  }
};

// Main execution
const main = async () => {
  await connectDB();
  await setupReviewDemo();
  process.exit(0);
};

main();
