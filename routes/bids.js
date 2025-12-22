const express = require('express');
const router = express.Router();

// Ghi chú: repo từng có "agent log" dùng fetch() (không có trong Node < 18).
// Để tránh crash khi require routes trên môi trường Node cũ, bỏ log fetch ở đây.

// Import controllers
const {
  createBid,
  getBids,
  getBidById,
  getMyBids,
  getManufacturerBids,
  counterOffer,
  acceptBid,
  rejectBid,
  cancelBid
} = require('../controllers/bidController');

// Import middleware
const {
  authenticate,
  authorize
} = require('../middleware/auth');

// Import validation
const {
  validateQuery,
  paginationSchema
} = require('../utils/validation');

// Test endpoint để verify routes được load
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Bids routes are working!' });
});

// Tất cả routes yêu cầu authentication
router.use(authenticate);

// @route   POST /api/bids
// @desc    Tạo bid mới
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.post('/',
  authorize('admin', 'manufacturer', 'distributor', 'hospital'),
  // #region agent log
  (req, res, next) => {
    try {
      const fs = require('fs');
      const path = require('path');
      const debugLog = (data) => { try { fs.appendFileSync(path.join(__dirname, '..', '.cursor', 'debug.log'), JSON.stringify(data) + '\n'); } catch(e) {} };
      console.log('🔥 POST /bids route middleware - before createBid', { drugId: req.body?.drugId, hasUser: !!req.user });
      debugLog({location:'routes/bids.js:40',message:'POST /bids route handler, before createBid',data:{method:req.method,path:req.path,hasUser:!!req.user,userId:req.user?._id?.toString(),body:req.body,drugId:req.body?.drugId,drugIdType:typeof req.body?.drugId,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H6'});
    } catch (logErr) {
      console.error('🔥 Error in route logging:', logErr);
    }
    next();
  },
  // #endregion
  createBid
);

// @route   GET /api/bids/my-bids
// @desc    Lấy bids của user hiện tại
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
// QUAN TRỌNG: Route cụ thể phải đặt TRƯỚC route dynamic /:id
router.get('/my-bids',
  // #region agent log
  (req, res, next) => {
    fetch('http://127.0.0.1:7242/ingest/225bc8d1-6824-4e38-b617-49570f639471',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'routes/bids.js:49',message:'Route /my-bids middleware called',data:{method:req.method,path:req.path,originalUrl:req.originalUrl,hasAuthHeader:!!req.headers?.authorization,timestamp:Date.now()},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'H3,H4'})}).catch(()=>{});
    next();
  },
  // #endregion
  authorize('admin', 'manufacturer', 'distributor', 'hospital'),
  validateQuery(paginationSchema),
  getMyBids
);

// @route   GET /api/bids/manufacturer-bids
// @desc    Lấy bids cho manufacturer (bids nhận được)
// @access  Private (Manufacturer, Admin)
// QUAN TRỌNG: Route cụ thể phải đặt TRƯỚC route dynamic /:id
router.get('/manufacturer-bids',
  authorize('manufacturer', 'admin'),
  validateQuery(paginationSchema),
  getManufacturerBids
);

// @route   GET /api/bids
// @desc    Lấy danh sách bids (với filters)
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.get('/',
  authorize('admin', 'manufacturer', 'distributor', 'hospital'),
  validateQuery(paginationSchema),
  getBids
);

// @route   GET /api/bids/:id
// @desc    Lấy bid theo ID
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
// Route dynamic phải đặt SAU các route cụ thể
router.get('/:id',
  authorize('admin', 'manufacturer', 'distributor', 'hospital'),
  getBidById
);

// @route   PUT /api/bids/:id/counter-offer
// @desc    Gửi counter offer (Manufacturer gửi giá đối ứng)
// @access  Private (Manufacturer, Admin)
router.put('/:id/counter-offer',
  authorize('manufacturer', 'admin'),
  counterOffer
);

// @route   PUT /api/bids/:id/accept
// @desc    Chấp nhận bid (Manufacturer accept bidder's bid, hoặc Bidder accept counter offer)
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.put('/:id/accept',
  authorize('admin', 'manufacturer', 'distributor', 'hospital'),
  acceptBid
);

// @route   PUT /api/bids/:id/reject
// @desc    Từ chối bid
// @access  Private (Manufacturer, Admin)
router.put('/:id/reject',
  authorize('manufacturer', 'admin'),
  rejectBid
);

// @route   PUT /api/bids/:id/cancel
// @desc    Hủy bid (chỉ người đấu thầu)
// @access  Private (Admin, Manufacturer, Distributor, Hospital)
router.put('/:id/cancel',
  authorize('admin', 'manufacturer', 'distributor', 'hospital'),
  cancelBid
);

module.exports = router;

