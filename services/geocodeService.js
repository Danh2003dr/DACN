const axios = require('axios');

/**
 * Geocode địa chỉ thành tọa độ (latitude, longitude) sử dụng OpenStreetMap Nominatim API
 * @param {string} address - Địa chỉ cần geocode
 * @returns {Promise<{lat: number, lng: number} | null>} - Tọa độ hoặc null nếu không tìm thấy
 */
const geocodeAddress = async (address) => {
  if (!address || typeof address !== 'string' || address.trim() === '') {
    return null;
  }

  const trimmedAddress = address.trim();
  
  // Bỏ qua địa chỉ quá ngắn hoặc không hợp lệ
  if (trimmedAddress.length < 3) {
    console.warn(`⚠️ Địa chỉ quá ngắn, bỏ qua geocoding: "${trimmedAddress}"`);
    return null;
  }

  try {
    // Sử dụng Nominatim API (OpenStreetMap) - miễn phí, không cần API key
    // Thử nhiều cách format để tăng độ chính xác cho địa chỉ Việt Nam
    const searchQueries = [
      `${trimmedAddress}, Vietnam`,
      `${trimmedAddress}, Bình Dương, Vietnam`,
      `${trimmedAddress}, Việt Nam`
    ];
    
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
              console.log(`✅ Geocoded "${trimmedAddress}" to coordinates: [${lat}, ${lng}] (Vietnam)`);
              return {
                lat,
                lng,
                formattedAddress: result.display_name,
                osmType: result.type,
                osmId: result.osm_id
              };
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

    console.warn(`⚠️ Không tìm thấy tọa độ hợp lệ cho địa chỉ: "${trimmedAddress}"`);
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
