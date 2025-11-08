const os = require('os');

/**
 * Lấy URL của server để sử dụng trong QR code
 * Ưu tiên: CLIENT_URL > FRONTEND_URL > Tự động detect IP > localhost
 */
const getServerUrl = () => {
  // Nếu có CLIENT_URL trong env, dùng nó
  if (process.env.CLIENT_URL) {
    return process.env.CLIENT_URL;
  }
  
  // Nếu có FRONTEND_URL trong env, dùng nó
  if (process.env.FRONTEND_URL) {
    return process.env.FRONTEND_URL;
  }
  
  // Tự động detect IP address của máy
  const networkInterfaces = os.networkInterfaces();
  let localIP = 'localhost';
  let wifiIP = null;
  
  // Ưu tiên tìm WiFi adapter (thường có "WiFi" trong tên)
  // Sau đó mới tìm các adapter khác (tránh VPN như CloudflareWARP)
  const preferredInterfaces = [];
  const otherInterfaces = [];
  
  for (const interfaceName in networkInterfaces) {
    const addresses = networkInterfaces[interfaceName];
    const hasAddresses = addresses.some(addr => 
      addr.family === 'IPv4' && !addr.internal
    );
    
    if (hasAddresses) {
      // Ưu tiên WiFi, Ethernet, Local Area Connection
      if (interfaceName.toLowerCase().includes('wifi') || 
          interfaceName.toLowerCase().includes('ethernet') ||
          interfaceName.toLowerCase().includes('local area connection')) {
        preferredInterfaces.push(interfaceName);
      } 
      // Tránh VPN adapters (CloudflareWARP, TAP, etc.)
      else if (!interfaceName.toLowerCase().includes('warp') &&
               !interfaceName.toLowerCase().includes('tap') &&
               !interfaceName.toLowerCase().includes('vpn') &&
               !interfaceName.toLowerCase().includes('virtual')) {
        otherInterfaces.push(interfaceName);
      }
    }
  }
  
  // Tìm IP từ preferred interfaces trước
  const interfacesToCheck = [...preferredInterfaces, ...otherInterfaces];
  
  for (const interfaceName of interfacesToCheck) {
    const addresses = networkInterfaces[interfaceName];
    for (const address of addresses) {
      // Chỉ lấy IPv4, không phải loopback, không phải internal
      // Ưu tiên IP trong dải 192.168.x.x hoặc 10.x.x.x (local network)
      if (address.family === 'IPv4' && !address.internal) {
        const ip = address.address;
        if (ip.startsWith('192.168.') || ip.startsWith('10.')) {
          localIP = ip;
          break;
        } else if (localIP === 'localhost') {
          localIP = ip;
        }
      }
    }
    if (localIP !== 'localhost' && (localIP.startsWith('192.168.') || localIP.startsWith('10.'))) {
      break;
    }
  }
  
  // Nếu không tìm thấy IP, dùng localhost
  const frontendPort = process.env.FRONTEND_PORT || process.env.CLIENT_PORT || 3000;
  const protocol = process.env.FRONTEND_PROTOCOL || 'http';
  
  return `${protocol}://${localIP}:${frontendPort}`;
};

module.exports = getServerUrl;

