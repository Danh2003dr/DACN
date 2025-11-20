const signatureBatchService = require('../services/signatureBatchService');

exports.createBatch = async (req, res) => {
  try {
    const batch = await signatureBatchService.createBatch(req.body, req.user);
    res.status(201).json({
      success: true,
      message: 'Khởi tạo batch ký số thành công',
      data: batch
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getBatchById = async (req, res) => {
  try {
    const batch = await signatureBatchService.getBatchById(req.params.id);
    res.json({
      success: true,
      data: batch
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

exports.getBatches = async (req, res) => {
  try {
    const result = await signatureBatchService.listBatches(req.query, req.query);
    res.json({
      success: true,
      data: result.items,
      pagination: result.pagination
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

