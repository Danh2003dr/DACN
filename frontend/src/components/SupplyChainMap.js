import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Truck, Factory, Building2, Package, MapPin } from 'lucide-react';

// Fix cho default markers trong React Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png'),
  iconUrl: require('leaflet/dist/images/marker-icon.png'),
  shadowUrl: require('leaflet/dist/images/marker-shadow.png'),
});

// Custom icons cho các loại bước
const createCustomIcon = (color, iconType) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background-color: ${color};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 3px solid white;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
      ">
        ${getIconSymbol(iconType)}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

const getIconSymbol = (type) => {
  switch (type) {
    case 'manufacturing':
      return '🏭';
    case 'transportation':
      return '🚚';
    case 'storage':
      return '📦';
    case 'delivery':
      return '🏥';
    default:
      return '📍';
  }
};

const getIconColor = (type) => {
  switch (type) {
    case 'manufacturing':
      return '#3B82F6'; // Blue
    case 'transportation':
      return '#F59E0B'; // Orange
    case 'storage':
      return '#8B5CF6'; // Purple
    case 'delivery':
      return '#10B981'; // Green
    default:
      return '#6B7280'; // Gray
  }
};

// Component để fit bounds
const FitBounds = ({ bounds, focusAddress, onFocusComplete }) => {
  const map = useMap();
  
  useEffect(() => {
    if (bounds && bounds.length > 0) {
      const latlngs = bounds.map(b => [b.lat, b.lng]);
      map.fitBounds(latlngs, { padding: [50, 50] });
    }
  }, [bounds, map]);
  
  // Focus vào địa chỉ cụ thể
  useEffect(() => {
    if (focusAddress && typeof focusAddress === 'string' && focusAddress.trim()) {
      // Geocode địa chỉ và center map
      const geocodeAddress = async () => {
        try {
          const searchQuery = `${focusAddress.trim()}, Vietnam`;
          const url = `https://nominatim.openstreetmap.org/search`;
          
          const response = await fetch(
            `${url}?q=${encodeURIComponent(searchQuery)}&format=json&limit=1&addressdetails=1`,
            {
              headers: {
                'User-Agent': 'Drug-Traceability-System/1.0'
              }
            }
          );
          
          const data = await response.json();
          
          if (data && data.length > 0) {
            const result = data[0];
            const lat = parseFloat(result.lat);
            const lng = parseFloat(result.lon);
            
            if (!isNaN(lat) && !isNaN(lng)) {
              console.log(`📍 Focusing map on address: "${focusAddress}" -> [${lat}, ${lng}]`);
              // Center và zoom vào địa chỉ
              map.setView([lat, lng], 15);
              
              // Tạo marker tạm thời để highlight
              const marker = L.marker([lat, lng], {
                icon: L.divIcon({
                  className: 'focus-marker',
                  html: `
                    <div style="
                      background-color: #EF4444;
                      width: 40px;
                      height: 40px;
                      border-radius: 50%;
                      border: 4px solid white;
                      box-shadow: 0 2px 12px rgba(0,0,0,0.5);
                      display: flex;
                      align-items: center;
                      justify-content: center;
                      animation: pulse 2s infinite;
                    ">
                      📍
                    </div>
                    <style>
                      @keyframes pulse {
                        0%, 100% { transform: scale(1); }
                        50% { transform: scale(1.1); }
                      }
                    </style>
                  `,
                  iconSize: [40, 40],
                  iconAnchor: [20, 40]
                })
              }).addTo(map);
              
              // Thêm popup
              marker.bindPopup(`<strong>📍 ${focusAddress}</strong>`).openPopup();
              
              // Scroll marker vào view sau một chút
              setTimeout(() => {
                map.setView([lat, lng], 15);
              }, 100);
              
              // Xóa marker sau 5 giây
              setTimeout(() => {
                map.removeLayer(marker);
              }, 5000);
              
              // Gọi callback khi focus xong
              if (onFocusComplete) {
                setTimeout(() => {
                  onFocusComplete();
                }, 100);
              }
            } else {
              console.warn(`⚠️ Invalid coordinates for address: "${focusAddress}"`);
              if (onFocusComplete) onFocusComplete();
            }
          } else {
            console.warn(`⚠️ Không tìm thấy tọa độ cho địa chỉ: "${focusAddress}"`);
            if (onFocusComplete) onFocusComplete();
          }
        } catch (error) {
          console.error('❌ Geocoding error:', error);
          if (onFocusComplete) onFocusComplete();
        }
      };
      
      geocodeAddress();
    }
  }, [focusAddress, map, onFocusComplete]);
  
  return null;
};

const SupplyChainMap = ({ supplyChains = [], height = '600px', focusAddress = null, onFocusComplete = null }) => {
  const [selectedChain, setSelectedChain] = useState(null);
  const [allBounds, setAllBounds] = useState([]);

  // Log khi component mount hoặc supplyChains thay đổi
  useEffect(() => {
    console.log('🗺️ SupplyChainMap received supplyChains:', supplyChains.length);
    if (supplyChains.length === 0) {
      console.warn('⚠️ SupplyChainMap: No supply chains data provided');
    }
  }, [supplyChains]);

  // Tính toán bounds từ tất cả supply chains
  useEffect(() => {
    const bounds = [];
    console.log('🗺️ Processing supply chains for map:', supplyChains.length);
    
    supplyChains.forEach((chain, idx) => {
      console.log(`📍 Chain ${idx + 1}:`, {
        batchNumber: chain.batchNumber,
        hasPath: !!chain.path,
        pathLength: chain.path?.length || 0,
        hasCurrentLocation: !!chain.currentLocation,
        currentLocationCoords: chain.currentLocation?.coordinates
      });
      
      // Xử lý path (steps)
      if (chain.path && chain.path.length > 0) {
        chain.path.forEach((point, pointIdx) => {
          if (point.coordinates && point.coordinates.length === 2) {
            // MongoDB GeoJSON format: [longitude, latitude]
            const [lng, lat] = point.coordinates;
            if (!isNaN(lat) && !isNaN(lng)) {
              bounds.push({
                lat: lat,
                lng: lng,
                chain: chain,
                point: point
              });
              console.log(`  ✅ Added path point ${pointIdx + 1}: [${lat}, ${lng}] - ${point.address}`);
            }
          } else {
            console.warn(`  ⚠️ Path point ${pointIdx + 1} missing coordinates:`, point);
          }
        });
      }
      
      // Xử lý currentLocation nếu không có path hoặc path rỗng
      if (chain.currentLocation?.coordinates && chain.currentLocation.coordinates.length === 2) {
        // MongoDB GeoJSON format: [longitude, latitude]
        const [lng, lat] = chain.currentLocation.coordinates;
        if (!isNaN(lat) && !isNaN(lng)) {
          bounds.push({
            lat: lat,
            lng: lng,
            chain: chain,
            point: null
          });
          console.log(`  ✅ Added currentLocation: [${lat}, ${lng}] - ${chain.currentLocation.address}`);
        }
      } else if (chain.currentLocation) {
        console.warn(`  ⚠️ CurrentLocation missing coordinates:`, chain.currentLocation);
      }
    });
    
    console.log(`🗺️ Total bounds points: ${bounds.length}`);
    setAllBounds(bounds);
  }, [supplyChains]);

      // Tạo polyline cho mỗi chain
      const getPolylines = () => {
        const polylines = [];
        supplyChains.forEach((chain, chainIndex) => {
          if (chain.path && chain.path.length > 1) {
            const positions = chain.path
              .filter(point => point.coordinates && point.coordinates.length === 2)
              .map(point => {
                // MongoDB GeoJSON format: [longitude, latitude]
                // Leaflet cần [latitude, longitude]
                const [lng, lat] = point.coordinates;
                return [lat, lng];
              })
              .filter(pos => !isNaN(pos[0]) && !isNaN(pos[1]));
        
        if (positions.length > 1) {
          polylines.push({
            positions,
            color: getIconColor(chain.path[0]?.action || 'default'),
            chainIndex,
            chain
          });
        }
      }
    });
    return polylines;
  };

  const polylines = getPolylines();

  // Default center (Vietnam)
  const defaultCenter = [10.8231, 106.6297];
  const defaultZoom = 6;

  return (
    <div className="supply-chain-map-container">
      <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Fit bounds nếu có dữ liệu hoặc focus vào địa chỉ */}
          {allBounds.length > 0 && (
            <FitBounds 
              bounds={allBounds} 
              focusAddress={focusAddress}
              onFocusComplete={onFocusComplete}
            />
          )}
          {allBounds.length === 0 && focusAddress && (
            <FitBounds 
              bounds={[]} 
              focusAddress={focusAddress}
              onFocusComplete={onFocusComplete}
            />
          )}
          
          {/* Polylines - Đường đi của các chuỗi cung ứng */}
          {polylines.map((polyline, idx) => (
            <Polyline
              key={`polyline-${idx}`}
              positions={polyline.positions}
              color={polyline.color}
              weight={3}
              opacity={0.6}
            />
          ))}
          
          {/* Markers - Các điểm trong chuỗi cung ứng */}
          {supplyChains.flatMap((chain, chainIndex) => {
            const markers = [];
            
            // Hiển thị các điểm trong path
            if (chain.path && chain.path.length > 0) {
              chain.path.forEach((point, pointIndex) => {
                if (!point.coordinates || !Array.isArray(point.coordinates) || point.coordinates.length !== 2) {
                  console.warn(`⚠️ Path point ${pointIndex} missing valid coordinates:`, point);
                  return null;
                }
                
                // MongoDB GeoJSON format: [longitude, latitude]
                // Leaflet cần [latitude, longitude]
                const [lng, lat] = point.coordinates;
                if (isNaN(lat) || isNaN(lng)) {
                  console.warn(`⚠️ Path point ${pointIndex} has invalid coordinates:`, point.coordinates);
                  return null;
                }
                
                const iconType = point.action || 'default';
                
                markers.push(
                  <Marker
                    key={`chain-${chainIndex}-point-${pointIndex}`}
                    position={[lat, lng]}
                    icon={createCustomIcon(getIconColor(iconType), iconType)}
                    eventHandlers={{
                      click: () => setSelectedChain({ chain, point, type: 'path' })
                    }}
                  >
                    <Popup>
                      <div className="p-2">
                        <h4 className="font-semibold text-sm mb-2">
                          {chain.batchNumber || chain.drugBatchNumber}
                        </h4>
                        <p className="text-xs text-gray-600 mb-1">
                          <strong>Bước:</strong> {point.action || 'N/A'}
                        </p>
                        {point.address && (
                          <p className="text-xs text-gray-600 mb-1">
                            <strong>Địa chỉ:</strong> {point.address}
                          </p>
                        )}
                        {point.actorRole && (
                          <p className="text-xs text-gray-600 mb-1">
                            <strong>Vai trò:</strong> {point.actorRole}
                          </p>
                        )}
                        {point.timestamp && (
                          <p className="text-xs text-gray-500">
                            <strong>Thời gian:</strong> {new Date(point.timestamp).toLocaleString('vi-VN')}
                          </p>
                        )}
                      </div>
                    </Popup>
                  </Marker>
                );
              });
            }
            
            // Hiển thị vị trí hiện tại nếu không có path HOẶC có path nhưng muốn hiển thị cả currentLocation
            if (chain.currentLocation?.coordinates && Array.isArray(chain.currentLocation.coordinates) && chain.currentLocation.coordinates.length === 2) {
              // MongoDB GeoJSON format: [longitude, latitude]
              const [lng, lat] = chain.currentLocation.coordinates;
              if (!isNaN(lat) && !isNaN(lng)) {
                // Chỉ hiển thị currentLocation nếu không có path (để tránh duplicate)
                if (!chain.path || chain.path.length === 0) {
                  markers.push(
                    <Marker
                      key={`chain-${chainIndex}-current`}
                      position={[lat, lng]}
                      icon={createCustomIcon('#10B981', 'current')}
                      eventHandlers={{
                        click: () => setSelectedChain({ chain, point: null, type: 'current' })
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-semibold text-sm mb-2">
                            {chain.batchNumber || chain.drugBatchNumber}
                          </h4>
                          <p className="text-xs text-gray-600 mb-1">
                            <strong>Trạng thái:</strong> {chain.status || 'N/A'}
                          </p>
                          {chain.currentLocation.address && (
                            <p className="text-xs text-gray-600 mb-1">
                              <strong>Địa chỉ:</strong> {chain.currentLocation.address}
                            </p>
                          )}
                          {chain.currentLocation.actorName && (
                            <p className="text-xs text-gray-600 mb-1">
                              <strong>Tại:</strong> {chain.currentLocation.actorName}
                            </p>
                          )}
                          {chain.drug?.name && (
                            <p className="text-xs text-gray-500">
                              <strong>Thuốc:</strong> {chain.drug.name}
                            </p>
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  );
                }
              }
            }
            
            return markers;
          })}
        </MapContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Chú thích:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-blue-500"></div>
            <span>Sản xuất</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-orange-500"></div>
            <span>Vận chuyển</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-purple-500"></div>
            <span>Lưu kho</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-green-500"></div>
            <span>Giao hàng</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainMap;

