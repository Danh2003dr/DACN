import React, { useState, useEffect } from 'react';

const SimpleAddressMap = ({ 
  value = '', 
  onChange, 
  placeholder = 'Nhập địa chỉ hoặc click để chọn vị trí',
  height = '300px'
}) => {
  const [address, setAddress] = useState(value);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [suggestions, setSuggestions] = useState([]);

  // Danh sách địa chỉ mẫu tại Việt Nam
  const vietnamLocations = [
    { name: 'Bệnh viện Chợ Rẫy, Quận 5, TP.HCM', lat: 10.7603, lng: 106.6889 },
    { name: 'Bệnh viện Bạch Mai, Quận Đống Đa, Hà Nội', lat: 21.0285, lng: 105.8542 },
    { name: 'Bệnh viện Vinmec, Quận Hai Bà Trưng, Hà Nội', lat: 21.0285, lng: 105.8542 },
    { name: 'Công ty Dược phẩm MediPhar, Quận 10, TP.HCM', lat: 10.8231, lng: 106.6297 },
    { name: 'Công ty Pharmexim, Quận Hai Bà Trưng, Hà Nội', lat: 21.0285, lng: 105.8542 },
    { name: 'Công ty Dược liệu Hà Nội GMP, Thanh Hóa', lat: 19.8067, lng: 105.7844 },
    { name: 'Công ty Đông dược Phúc Hưng, Quận Hà Đông, Hà Nội', lat: 20.9808, lng: 105.7878 }
  ];

  useEffect(() => {
    if (value && value !== address) {
      setAddress(value);
    }
  }, [value]);

  const handleAddressChange = (newAddress) => {
    setAddress(newAddress);
    onChange && onChange(newAddress);
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) return;
    
    const filtered = vietnamLocations.filter(location => 
      location.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setSuggestions(filtered);
  };

  const handleLocationSelect = (location) => {
    setSelectedLocation(location);
    setAddress(location.name);
    onChange && onChange(location.name);
    setSuggestions([]);
    setSearchQuery('');
  };

  const handleMapClick = (lat, lng) => {
    const location = { lat, lng, name: `${lat.toFixed(4)}, ${lng.toFixed(4)}` };
    setSelectedLocation(location);
    setAddress(location.name);
    onChange && onChange(location.name);
  };

  return (
    <div className="address-map-container">
      {/* Input địa chỉ */}
      <div className="mb-4">
        <input
          type="text"
          value={address}
          onChange={(e) => handleAddressChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Nút hiện/ẩn bản đồ */}
      <div className="mb-4">
        <button
          type="button"
          onClick={() => setIsMapVisible(!isMapVisible)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isMapVisible ? 'Ẩn bản đồ' : 'Hiện bản đồ'}
        </button>
      </div>

      {/* Tìm kiếm địa chỉ */}
      {isMapVisible && (
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm địa chỉ..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Tìm kiếm
            </button>
          </div>
          
          {/* Gợi ý địa chỉ */}
          {suggestions.length > 0 && (
            <div className="mt-2 border border-gray-200 rounded-md bg-white shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((location, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleLocationSelect(location)}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-gray-900">{location.name}</div>
                  <div className="text-sm text-gray-500">
                    Tọa độ: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Bản đồ đơn giản */}
      {isMapVisible && (
        <div className="border border-gray-300 rounded-md overflow-hidden" style={{ height }}>
          <div className="relative w-full h-full bg-gray-100">
            {/* Bản đồ giả lập */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-100 to-green-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">🗺️</div>
                <p className="text-gray-600 mb-4">Bản đồ tương tác</p>
                <p className="text-sm text-gray-500 mb-4">Click vào các vị trí dưới đây để chọn:</p>
                
                {/* Các vị trí có thể click */}
                <div className="grid grid-cols-2 gap-2 max-w-md">
                  {vietnamLocations.slice(0, 4).map((location, index) => (
                    <button
                      key={index}
                      type="button"
                      onClick={() => handleMapClick(location.lat, location.lng)}
                      className="p-2 bg-white rounded border hover:bg-blue-50 hover:border-blue-300 transition-colors"
                    >
                      <div className="text-xs font-medium text-gray-900 truncate">
                        {location.name.split(',')[0]}
                      </div>
                      <div className="text-xs text-gray-500">
                        {location.lat.toFixed(2)}, {location.lng.toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Marker cho vị trí đã chọn */}
            {selectedLocation && (
              <div 
                className="absolute w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg transform -translate-x-2 -translate-y-2"
                style={{
                  left: '50%',
                  top: '50%'
                }}
              >
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                  {selectedLocation.name}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Thông tin vị trí */}
      {isMapVisible && selectedLocation && (
        <div className="mt-2 text-sm text-gray-600">
          <p><strong>Tọa độ:</strong> {selectedLocation.lat.toFixed(6)}, {selectedLocation.lng.toFixed(6)}</p>
          <p><strong>Địa chỉ:</strong> {selectedLocation.name}</p>
          <p className="text-xs text-gray-500 mt-1">
            💡 Click vào các vị trí trên bản đồ để chọn địa chỉ chính xác
          </p>
        </div>
      )}

      {/* Hướng dẫn sử dụng */}
      {isMapVisible && !selectedLocation && (
        <div className="mt-2 text-sm text-gray-500">
          <p>💡 <strong>Hướng dẫn:</strong></p>
          <ul className="list-disc list-inside mt-1 space-y-1">
            <li>Nhập địa chỉ vào ô tìm kiếm và nhấn Enter</li>
            <li>Click vào các vị trí trên bản đồ để chọn</li>
            <li>Hoặc nhập trực tiếp địa chỉ vào ô đầu tiên</li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default SimpleAddressMap;
