const signatureTemplateService = require('../services/signatureTemplateService');

exports.createTemplate = async (req, res) => {
  try {
    const template = await signatureTemplateService.createTemplate(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Tạo template thành công',
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateTemplate = async (req, res) => {
  try {
    const template = await signatureTemplateService.updateTemplate(
      req.params.id,
      req.body,
      req.user.id
    );
    res.json({
      success: true,
      message: 'Cập nhật template thành công',
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getTemplates = async (req, res) => {
  try {
    const result = await signatureTemplateService.listTemplates(req.query, req.query);
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

exports.getTemplateById = async (req, res) => {
  try {
    const template = await signatureTemplateService.getTemplateById(req.params.id);
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message
    });
  }
};

exports.changeTemplateStatus = async (req, res) => {
  try {
    const template = await signatureTemplateService.changeStatus(
      req.params.id,
      req.body.status,
      req.user.id
    );
    res.json({
      success: true,
      data: template
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

