const AuditLog = require('../models/AuditLog');
const auditService = require('../services/auditService');

/**
 * @desc    Lấy danh sách audit logs
 * @route   GET /api/audit-logs
 * @access  Private (Admin only)
 */
const getAuditLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      sortBy = 'timestamp',
      sortOrder = 'desc',
      // Filters
      user,
      action,
      module,
      entityType,
      entityId,
      result,
      severity,
      startDate,
      endDate,
      search
    } = req.query;

    // Build filter
    const filter = {};

    if (user) {
      filter.user = user;
    }

    if (action) {
      filter.action = action;
    }

    if (module) {
      filter.module = module;
    }

    if (entityType) {
      filter.entityType = entityType;
    }

    if (entityId) {
      filter.entityId = entityId;
    }

    if (result) {
      filter.result = result;
    }

    if (severity) {
      filter.severity = severity;
    }

    // Date range
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    // Search in description
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    // Get logs
    const result_data = await AuditLog.getLogs(filter, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    res.status(200).json({
      success: true,
      data: result_data
    });
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy audit logs.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy audit log theo ID
 * @route   GET /api/audit-logs/:id
 * @access  Private (Admin only)
 */
const getAuditLogById = async (req, res) => {
  try {
    const log = await AuditLog.findById(req.params.id)
      .populate('user', 'username fullName role organizationId')
      .lean();

    if (!log) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy audit log.'
      });
    }

    res.status(200).json({
      success: true,
      data: { log }
    });
  } catch (error) {
    console.error('Error getting audit log:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy audit log.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy lịch sử audit log cho một entity
 * @route   GET /api/audit-logs/entity/:entityType/:entityId
 * @access  Private (Admin only)
 */
const getEntityHistory = async (req, res) => {
  try {
    const { entityType, entityId } = req.params;
    const limit = parseInt(req.query.limit) || 100;

    const logs = await AuditLog.getEntityHistory(entityType, entityId, limit);

    res.status(200).json({
      success: true,
      data: { logs }
    });
  } catch (error) {
    console.error('Error getting entity history:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy lịch sử entity.',
      error: error.message
    });
  }
};

/**
 * @desc    Lấy thống kê audit logs
 * @route   GET /api/audit-logs/stats
 * @access  Private (Admin only)
 */
const getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dateRange = {};
    if (startDate) dateRange.startDate = startDate;
    if (endDate) dateRange.endDate = endDate;

    const stats = await AuditLog.getStats(dateRange);

    res.status(200).json({
      success: true,
      data: { stats }
    });
  } catch (error) {
    console.error('Error getting audit stats:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê audit logs.',
      error: error.message
    });
  }
};

/**
 * @desc    Export audit logs
 * @route   GET /api/audit-logs/export
 * @access  Private (Admin only)
 */
const exportAuditLogs = async (req, res) => {
  try {
    const {
      format = 'excel', // excel, csv, json
      startDate,
      endDate,
      ...filters
    } = req.query;

    // Build filter
    const filter = {};
    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }
    Object.assign(filter, filters);

    // Get all logs (no pagination for export)
    const logs = await AuditLog.find(filter)
      .sort({ timestamp: -1 })
      .populate('user', 'username fullName role')
      .lean();

    if (format === 'json') {
      return res.status(200).json({
        success: true,
        data: { logs }
      });
    }

    // Export Excel/CSV
    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Audit Logs');

    // Headers
    worksheet.columns = [
      { header: 'Thời gian', key: 'timestamp', width: 20 },
      { header: 'Người dùng', key: 'username', width: 20 },
      { header: 'Vai trò', key: 'userRole', width: 15 },
      { header: 'Hành động', key: 'action', width: 25 },
      { header: 'Module', key: 'module', width: 20 },
      { header: 'Entity Type', key: 'entityType', width: 15 },
      { header: 'Mô tả', key: 'description', width: 50 },
      { header: 'Kết quả', key: 'result', width: 10 },
      { header: 'Mức độ', key: 'severity', width: 10 },
      { header: 'IP Address', key: 'ipAddress', width: 15 }
    ];

    // Add rows
    logs.forEach(log => {
      worksheet.addRow({
        timestamp: log.timestamp,
        username: log.username,
        userRole: log.userRole,
        action: log.action,
        module: log.module,
        entityType: log.entityType || '',
        description: log.description,
        result: log.result,
        severity: log.severity,
        ipAddress: log.ipAddress || ''
      });
    });

    // Set response headers
    const filename = `audit-logs-${new Date().toISOString().split('T')[0]}.${format === 'csv' ? 'csv' : 'xlsx'}`;
    res.setHeader('Content-Type', format === 'csv' ? 'text/csv' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    if (format === 'csv') {
      await workbook.csv.write(res);
    } else {
      await workbook.xlsx.write(res);
    }
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi export audit logs.',
      error: error.message
    });
  }
};

module.exports = {
  getAuditLogs,
  getAuditLogById,
  getEntityHistory,
  getAuditStats,
  exportAuditLogs
};

