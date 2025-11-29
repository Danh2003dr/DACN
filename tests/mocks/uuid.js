/**
 * Mock UUID module để tránh ES module issues trong Jest
 * Tạo UUID v4 đơn giản
 */

function v4() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

module.exports = {
  v4: v4
};

// Export default cho ES module compatibility
module.exports.default = {
  v4: v4
};

