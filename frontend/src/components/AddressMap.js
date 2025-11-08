import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix cho default markers trong React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

const AddressMap = ({ 
  value = '', 
  onChange, 
  placeholder = 'Nhập địa chỉ hoặc click trên bản đồ để chọn vị trí',
  height = '300px',
  zoom = 13,
  center = [10.8231, 106.6297] // TP.HCM mặc định
}) => {
  const [position, setPosition] = useState(center);
  const [address, setAddress] = useState(value);
  const [isMapVisible, setIsMapVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef(null);

  // Component để xử lý click trên bản đồ
  const MapClickHandler = () => {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        setPosition([lat, lng]);
        
        // Reverse geocoding để lấy địa chỉ
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1&accept-language=vi`
          );
          const data = await response.json();
          
          if (data.display_name) {
            const formattedAddress = formatAddress(data);
            setAddress(formattedAddress);
            onChange && onChange(formattedAddress);
          }
        } catch (error) {
          console.error('Lỗi khi lấy địa chỉ:', error);
          const formattedAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
          setAddress(formattedAddress);
          onChange && onChange(formattedAddress);
        }
      }
    });
    return null;
  };

  // Format địa chỉ từ dữ liệu Nominatim
  const formatAddress = (data) => {
    const components = data.address || {};
    const parts = [];
    
    if (components.house_number && components.road) {
      parts.push(`${components.house_number} ${components.road}`);
    } else if (components.road) {
      parts.push(components.road);
    }
    
    if (components.ward) {
      parts.push(`Phường ${components.ward}`);
    }
    
    if (components.district) {
      parts.push(`Quận ${components.district}`);
    }
    
    if (components.city) {
      parts.push(components.city);
    }
    
    if (components.state) {
      parts.push(components.state);
    }
    
    return parts.join(', ');
  };

  // Tìm kiếm địa chỉ
  const searchAddress = async () => {
    if (!searchQuery.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&addressdetails=1&accept-language=vi&countrycodes=vn&limit=5`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setPosition([lat, lng]);
        setAddress(result.display_name);
        onChange && onChange(result.display_name);
        
        // Zoom vào vị trí tìm được
        if (mapRef.current) {
          mapRef.current.setView([lat, lng], 16);
        }
      }
    } catch (error) {
      console.error('Lỗi khi tìm kiếm địa chỉ:', error);
    }
  };

  // Geocoding từ địa chỉ có sẵn
  const geocodeAddress = async (addr) => {
    if (!addr.trim()) return;
    
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addr)}&addressdetails=1&accept-language=vi&countrycodes=vn&limit=1`
      );
      const data = await response.json();
      
      if (data.length > 0) {
        const result = data[0];
        const lat = parseFloat(result.lat);
        const lng = parseFloat(result.lon);
        setPosition([lat, lng]);
      }
    } catch (error) {
      console.error('Lỗi khi geocoding:', error);
    }
  };

  // Effect để geocoding khi có địa chỉ
  useEffect(() => {
    if (value && value !== address) {
      setAddress(value);
      geocodeAddress(value);
    }
  }, [value]);

  return (
    <div className="address-map-container">
      {/* Input địa chỉ */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Địa chỉ
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              onChange && onChange(e.target.value);
            }}
            placeholder={placeholder}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <button
            type="button"
            onClick={() => setIsMapVisible(!isMapVisible)}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {isMapVisible ? 'Ẩn bản đồ' : 'Hiện bản đồ'}
          </button>
        </div>
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
              onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
            />
            <button
              type="button"
              onClick={searchAddress}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              Tìm kiếm
            </button>
          </div>
        </div>
      )}

      {/* Bản đồ */}
      {isMapVisible && (
        <div className="border border-gray-300 rounded-md overflow-hidden" style={{ height }}>
          <MapContainer
            center={position}
            zoom={zoom}
            style={{ height: '100%', width: '100%' }}
            ref={mapRef}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={position}>
              <Popup>
                <div>
                  <strong>Vị trí đã chọn:</strong><br />
                  {address || 'Chưa có địa chỉ'}
                </div>
              </Popup>
            </Marker>
            <MapClickHandler />
          </MapContainer>
        </div>
      )}

      {/* Thông tin vị trí */}
      {isMapVisible && (
        <div className="mt-2 text-sm text-gray-600">
          <p><strong>Tọa độ:</strong> {position[0].toFixed(6)}, {position[1].toFixed(6)}</p>
          <p><strong>Địa chỉ:</strong> {address || 'Chưa có địa chỉ'}</p>
          <p className="text-xs text-gray-500 mt-1">
            💡 Click trên bản đồ để chọn vị trí chính xác
          </p>
        </div>
      )}
    </div>
  );
};

export default AddressMap;