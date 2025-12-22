const axios = require('axios');

// In-memory cache cho geocoding (có thể nâng cấp lên Redis sau)
const geocodeCache = new Map();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 giờ
const MAX_CACHE_SIZE = 10000; // Giới hạn cache size

// Helper để normalize address key cho cache
const normalizeAddressKey = (address) => {
  if (!address || typeof address !== 'string') return null;
  return address.trim().toLowerCase().replace(/\s+/g, ' ');
};

// Helper để clean và normalize địa chỉ trước khi geocode
// Sửa các lỗi chính tả phổ biến và chuẩn hóa format
const cleanAddress = (address) => {
  if (!address || typeof address !== 'string') return null;
  
  let cleaned = address.trim();
  
  // Loại bỏ các ký tự đặc biệt không cần thiết (giữ lại dấu tiếng Việt và ký tự thông thường)
  cleaned = cleaned.replace(/[^\w\s,.-àáảãạăắằẳẵặâấầẩẫậèéẻẽẹêếềểễệìíỉĩịòóỏõọôốồổỗộơớờởỡợùúủũụưứừửữựỳýỷỹỵđĐ]/gi, '');
  
  // Lưu địa chỉ gốc để so sánh
  const originalAddress = cleaned;
  
  // Sửa lỗi ký tự lặp lại: giảm 3+ ký tự giống nhau xuống 2
  // Ví dụ: "Bììình" -> "Bìình"
  cleaned = cleaned.replace(/(.)\1{2,}/g, '$1$1');
  
  // Sửa lỗi ký tự lặp lại 2 lần trong từ (pattern: XxX -> Xx)
  // Ví dụ: "Bìình" -> "Bình", "Thắnng" -> "Thắng"
  // Pattern: một ký tự (bao gồm cả ký tự có dấu), sau đó ký tự đó lặp lại, rồi một ký tự khác
  // Sử dụng Unicode property để match cả ký tự có dấu
  cleaned = cleaned.replace(/([\p{L}])\1([\p{L}])/gu, '$1$2');
  
  // Nếu có thay đổi, log để debug
  if (cleaned !== originalAddress) {
    console.log(`🧹 Cleaned typo pattern: "${originalAddress}" -> "${cleaned}"`);
  }
  
  // Sửa các lỗi chính tả phổ biến cụ thể (sau khi đã xử lý pattern chung)
  const beforeCommonTypos = cleaned;
  const commonTypos = {
    'xxã': 'xã',
    'xãã': 'xã',
    'bìình': 'bình',  // Thêm case cụ thể
    'thắnng': 'thắng', // Thêm case cụ thể
    'bình dương': 'Bình Dương',
    'dĩ an': 'Dĩ An'
  };
  
  // Áp dụng các sửa lỗi chính tả (case-insensitive)
  Object.keys(commonTypos).forEach(typo => {
    const regex = new RegExp(typo, 'gi');
    if (regex.test(cleaned)) {
      cleaned = cleaned.replace(regex, commonTypos[typo]);
    }
  });
  
  // Nếu có thay đổi từ commonTypos, log để debug
  if (cleaned !== beforeCommonTypos) {
    console.log(`🧹 Cleaned common typos: "${beforeCommonTypos}" -> "${cleaned}"`);
  }
  
  // Chuẩn hóa khoảng trắng
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  // Loại bỏ các từ quá ngắn và không có ý nghĩa (như "ấ" đơn lẻ)
  const words = cleaned.split(/\s+/);
  if (words.length === 1 && words[0].length < 3) {
    console.warn(`⚠️ Địa chỉ quá ngắn và không hợp lệ: "${address}"`);
    return null;
  }
  
  // Nếu địa chỉ quá ngắn tổng thể (< 5 ký tự), có thể không hợp lệ
  if (cleaned.length < 5) {
    console.warn(`⚠️ Địa chỉ quá ngắn sau khi clean: "${address}" -> "${cleaned}"`);
    // Vẫn trả về để thử geocode, nhưng có thể sẽ fail
  }
  
  return cleaned;
};

// Helper để clean cache cũ
const cleanExpiredCache = () => {
  const now = Date.now();
  for (const [key, value] of geocodeCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      geocodeCache.delete(key);
    }
  }
  
  // Nếu cache quá lớn, xóa các entry cũ nhất
  if (geocodeCache.size > MAX_CACHE_SIZE) {
    const entries = Array.from(geocodeCache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    const toDelete = entries.slice(0, geocodeCache.size - MAX_CACHE_SIZE);
    toDelete.forEach(([key]) => geocodeCache.delete(key));
  }
};

// Clean cache mỗi 1 giờ
setInterval(cleanExpiredCache, 60 * 60 * 1000);

/**
 * Geocode địa chỉ thành tọa độ (latitude, longitude) sử dụng OpenStreetMap Nominatim API
 * @param {string} address - Địa chỉ cần geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - Tọa độ hoặc null nếu không tìm thấy
 */
const geocodeAddress = async (address) => {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    return null;
  }

  // Clean và normalize địa chỉ trước
  const cleanedAddress = cleanAddress(address);
  if (!cleanedAddress) {
    return null;
  }
  
  // Kiểm tra cache với địa chỉ đã clean
  const cacheKey = normalizeAddressKey(cleanedAddress);
  if (cacheKey && geocodeCache.has(cacheKey)) {
    const cached = geocodeCache.get(cacheKey);
    const now = Date.now();
    if (now - cached.timestamp < CACHE_TTL) {
      console.log(`📦 Using cached geocode for: "${address}" (cleaned: "${cleanedAddress}")`);
      return cached.result;
    } else {
      // Cache expired, xóa
      geocodeCache.delete(cacheKey);
    }
  }
  
  // Bỏ qua địa chỉ quá ngắn hoặc không hợp lệ
  if (cleanedAddress.length < 3) {
    console.warn(`⚠️ Địa chỉ quá ngắn sau khi clean, bỏ qua geocoding: "${address}" -> "${cleanedAddress}"`);
    return null;
  }
  
  // Log để debug nếu địa chỉ đã được clean
  if (address.trim() !== cleanedAddress) {
    console.log(`🧹 Cleaned address: "${address}" -> "${cleanedAddress}"`);
  }
  
  const trimmedAddress = cleanedAddress;

  try {
    // Sử dụng Nominatim API (OpenStreetMap) - miễn phí, không cần API key
    // Thử nhiều cách format để tăng độ chính xác cho địa chỉ Việt Nam
    // Thử cả địa chỉ gốc (nếu khác với cleaned) và địa chỉ đã clean
    const searchQueries = [];
    
    // Thêm địa chỉ gốc nếu khác với cleaned (để thử cả 2)
    if (address.trim() !== cleanedAddress) {
      searchQueries.push(
        `${address.trim()}, Vietnam`,
        `${address.trim()}, Bình Dương, Vietnam`
      );
    }
    
    // Thêm địa chỉ đã clean
    searchQueries.push(
      `${trimmedAddress}, Vietnam`,
      `${trimmedAddress}, Bình Dương, Vietnam`,
      `${trimmedAddress}, Việt Nam`
    );
    
    // Nếu có từ khóa "Dĩ An" hoặc "Bình Dương", thử thêm các biến thể
    if (trimmedAddress.toLowerCase().includes('dĩ an') || trimmedAddress.toLowerCase().includes('bình dương')) {
      searchQueries.push(
        `${trimmedAddress.replace(/dĩ an/gi, 'Dĩ An').replace(/bình dương/gi, 'Bình Dương')}, Vietnam`
      );
    }
    
    const url = `https://nominatim.openstreetmap.org/search`;
    
    // Thử từng query cho đến khi tìm thấy kết quả
    for (const searchQuery of searchQueries) {
      try {
        const response = await axios.get(url, {
          params: {
            q: searchQuery,
            format: 'json',
            limit: 5, // Tăng limit để có nhiều kết quả hơn
            addressdetails: 1,
            countrycodes: 'vn' // Chỉ tìm trong Việt Nam
          },
          headers: {
            'User-Agent': 'Drug-Traceability-System/1.0' // Nominatim yêu cầu User-Agent
          },
          timeout: 10000 // 10 giây timeout
        });

        if (response.data && response.data.length > 0) {
          // Tìm kết quả tốt nhất (ưu tiên kết quả có country_code là 'vn')
          let result = response.data[0];
          const vietnamResult = response.data.find(r => r.address?.country_code === 'vn');
          if (vietnamResult) {
            result = vietnamResult;
          }
          
          const lat = parseFloat(result.lat);
          const lng = parseFloat(result.lon);
          
          // Kiểm tra xem tọa độ có nằm trong phạm vi Việt Nam không
          // Việt Nam: latitude khoảng 8.5°N - 23.5°N, longitude khoảng 102°E - 110°E
          const isInVietnam = lat >= 8.5 && lat <= 23.5 && lng >= 102 && lng <= 110;
          
          if (!isNaN(lat) && !isNaN(lng)) {
            if (isInVietnam) {
              const geocodeResult = {
                lat,
                lng,
                formattedAddress: result.display_name,
                osmType: result.type,
                osmId: result.osm_id
              };
              
              // Lưu vào cache
              if (cacheKey) {
                geocodeCache.set(cacheKey, {
                  result: geocodeResult,
                  timestamp: Date.now()
                });
              }
              
              console.log(`✅ Geocoded "${address}" (cleaned: "${trimmedAddress}") to coordinates: [${lat}, ${lng}] (Vietnam)`);
              return geocodeResult;
            } else {
              console.warn(`⚠️ Tọa độ tìm được không nằm trong phạm vi Việt Nam: [${lat}, ${lng}], tiếp tục thử query khác...`);
              continue; // Thử query tiếp theo
            }
          }
        }
      } catch (queryError) {
        console.warn(`⚠️ Geocoding query failed for "${searchQuery}":`, queryError.message);
        continue; // Thử query tiếp theo
      }
    }

    console.warn(`⚠️ Không tìm thấy tọa độ hợp lệ cho địa chỉ: "${address}" (cleaned: "${trimmedAddress}")`);
    
    // Cache null result để tránh query lại nhiều lần (với TTL ngắn hơn)
    if (cacheKey) {
      geocodeCache.set(cacheKey, {
        result: null,
        timestamp: Date.now()
      });
    }
    
    return null;
  } catch (error) {
    console.error(`❌ Geocoding error for "${trimmedAddress}":`, error.message);
    // Không throw error, chỉ log và return null
    // Để không làm gián đoạn flow chính nếu geocoding fail
    return null;
  }
};

/**
 * Geocode địa chỉ và trả về dạng coordinates array [lng, lat] (MongoDB GeoJSON format)
 * @param {string} address - Địa chỉ cần geocode
 * @returns {Promise<number[] | null>} - [longitude, latitude] hoặc null
 */
const geocodeToCoordinates = async (address) => {
  const result = await geocodeAddress(address);
  if (result) {
    // MongoDB GeoJSON format: [longitude, latitude]
    return [result.lng, result.lat];
  }
  return null;
};

module.exports = {
  geocodeAddress,
  geocodeToCoordinates
};
