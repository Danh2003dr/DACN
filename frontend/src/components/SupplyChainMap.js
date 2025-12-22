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
    case 'current':
      return '📍';
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
      
      // Lọc các điểm nằm trong lãnh thổ Việt Nam
      const vietnamBounds = {
        north: 23.5,
        south: 8.5,
        east: 110.0,
        west: 102.0
      };
      
      const validLatlngs = latlngs.filter(([lat, lng]) => {
        return lat >= vietnamBounds.south && 
               lat <= vietnamBounds.north && 
               lng >= vietnamBounds.west && 
               lng <= vietnamBounds.east;
      });
      
      if (validLatlngs.length > 0) {
        // Fit bounds với padding và giới hạn zoom
        map.fitBounds(validLatlngs, { 
          padding: [50, 50],
          maxZoom: 12 // Giới hạn zoom tối đa khi fit bounds để không zoom quá sát
        });
      } else {
        // Nếu không có điểm hợp lệ, center vào Việt Nam
        map.setView([16.0, 106.0], 6);
      }
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
            
            // Kiểm tra xem tọa độ có nằm trong lãnh thổ Việt Nam không
            const isInVietnam = lat >= 8.5 && lat <= 23.5 && lng >= 102.0 && lng <= 110.0;
            
            if (!isNaN(lat) && !isNaN(lng) && isInVietnam) {
              console.log(`📍 Focusing map on address: "${focusAddress}" -> [${lat}, ${lng}]`);
              // Center và zoom vào địa chỉ (giới hạn zoom tối đa)
              const zoomLevel = Math.min(15, map.getMaxZoom());
              map.setView([lat, lng], zoomLevel);
              
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
                const zoomLevel = Math.min(15, map.getMaxZoom());
                map.setView([lat, lng], zoomLevel);
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
      
      // Xử lý currentLocation - LUÔN thêm vào bounds nếu có coordinates
      if (chain.currentLocation?.coordinates && chain.currentLocation.coordinates.length === 2) {
        // MongoDB GeoJSON format: [longitude, latitude]
        const [lng, lat] = chain.currentLocation.coordinates;
        if (!isNaN(lat) && !isNaN(lng)) {
          // Kiểm tra xem currentLocation có trùng với điểm cuối cùng trong path không
          let isDuplicate = false;
          if (chain.path && chain.path.length > 0) {
            const lastPathPoint = chain.path[chain.path.length - 1];
            if (lastPathPoint.coordinates && Array.isArray(lastPathPoint.coordinates) && lastPathPoint.coordinates.length === 2) {
              const [lastLng, lastLat] = lastPathPoint.coordinates;
              // So sánh với độ chính xác 0.0001 (khoảng 10m)
              if (Math.abs(lat - lastLat) < 0.0001 && Math.abs(lng - lastLng) < 0.0001) {
                isDuplicate = true;
              }
            }
          }
          
          // Chỉ thêm vào bounds nếu không trùng với điểm cuối cùng trong path
          if (!isDuplicate) {
            bounds.push({
              lat: lat,
              lng: lng,
              chain: chain,
              point: null,
              isCurrentLocation: true
            });
            console.log(`  ✅ Added currentLocation: [${lat}, ${lng}] - ${chain.currentLocation.address}`);
          } else {
            console.log(`  ℹ️ CurrentLocation trùng với điểm cuối cùng trong path, bỏ qua để tránh duplicate`);
          }
        }
      } else if (chain.currentLocation?.address) {
        console.warn(`  ⚠️ CurrentLocation có address nhưng chưa có coordinates: "${chain.currentLocation.address}"`);
        // Có thể thêm logic geocode ở đây nếu cần
      }
    });
    
    console.log(`🗺️ Total bounds points: ${bounds.length}`);
    setAllBounds(bounds);
  }, [supplyChains]);

      // Tạo polyline cho mỗi chain - bao gồm cả currentLocation nếu có
      const getPolylines = () => {
        const polylines = [];
        supplyChains.forEach((chain, chainIndex) => {
          const positions = [];
          
          // Thêm các điểm trong path
          if (chain.path && chain.path.length > 0) {
            chain.path.forEach(point => {
              if (point.coordinates && point.coordinates.length === 2) {
                // MongoDB GeoJSON format: [longitude, latitude]
                // Leaflet cần [latitude, longitude]
                const [lng, lat] = point.coordinates;
                if (!isNaN(lat) && !isNaN(lng)) {
                  positions.push([lat, lng]);
                }
              }
            });
          }
          
          // Thêm currentLocation vào cuối polyline nếu có và không trùng với điểm cuối cùng
          if (chain.currentLocation?.coordinates && chain.currentLocation.coordinates.length === 2) {
            const [lng, lat] = chain.currentLocation.coordinates;
            if (!isNaN(lat) && !isNaN(lng)) {
              // Kiểm tra xem có trùng với điểm cuối cùng không
              if (positions.length === 0 || 
                  Math.abs(positions[positions.length - 1][0] - lat) >= 0.0001 || 
                  Math.abs(positions[positions.length - 1][1] - lng) >= 0.0001) {
                positions.push([lat, lng]);
              }
            }
          }
          
          // Chỉ tạo polyline nếu có ít nhất 2 điểm
          if (positions.length > 1) {
            polylines.push({
              positions,
              color: getIconColor(chain.path?.[0]?.action || 'default'),
              chainIndex,
              chain
            });
          }
        });
        return polylines;
      };

  const polylines = getPolylines();

  // Default center (Vietnam - TP.HCM)
  const defaultCenter = [10.8231, 106.6297];
  const defaultZoom = 6;
  
  // Giới hạn bản đồ chỉ trong lãnh thổ Việt Nam
  // Việt Nam: latitude 8.5°N - 23.5°N, longitude 102°E - 110°E
  const vietnamBounds = [
    [8.5, 102.0],  // Southwest corner (Tây Nam)
    [23.5, 110.0]  // Northeast corner (Đông Bắc)
  ];

  return (
    <div className="supply-chain-map-container">
      <div className="border border-gray-300 rounded-lg overflow-hidden" style={{ height }}>
        <MapContainer
          center={defaultCenter}
          zoom={defaultZoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
          maxBounds={vietnamBounds}
          maxBoundsViscosity={1.0} // Giữ bản đồ trong bounds, không cho pan ra ngoài
          minZoom={5} // Zoom tối thiểu để vẫn thấy toàn bộ Việt Nam
          maxZoom={18} // Zoom tối đa
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
            
            // Hiển thị vị trí hiện tại - LUÔN hiển thị nếu có coordinates
            // Kiểm tra xem currentLocation có phải là điểm cuối cùng trong path không để tránh duplicate
            if (chain.currentLocation?.coordinates && Array.isArray(chain.currentLocation.coordinates) && chain.currentLocation.coordinates.length === 2) {
              // MongoDB GeoJSON format: [longitude, latitude]
              const [lng, lat] = chain.currentLocation.coordinates;
              if (!isNaN(lat) && !isNaN(lng)) {
                // Kiểm tra xem currentLocation có trùng với điểm cuối cùng trong path không
                let isDuplicate = false;
                if (chain.path && chain.path.length > 0) {
                  const lastPathPoint = chain.path[chain.path.length - 1];
                  if (lastPathPoint.coordinates && Array.isArray(lastPathPoint.coordinates) && lastPathPoint.coordinates.length === 2) {
                    const [lastLng, lastLat] = lastPathPoint.coordinates;
                    // So sánh với độ chính xác 0.0001 (khoảng 10m)
                    if (Math.abs(lat - lastLat) < 0.0001 && Math.abs(lng - lastLng) < 0.0001) {
                      isDuplicate = true;
                    }
                  }
                }
                
                // Hiển thị currentLocation nếu không trùng hoặc không có path
                if (!isDuplicate) {
                  markers.push(
                    <Marker
                      key={`chain-${chainIndex}-current`}
                      position={[lat, lng]}
                      icon={createCustomIcon('#EF4444', 'current')} // Màu đỏ để phân biệt với các bước khác
                      eventHandlers={{
                        click: () => setSelectedChain({ chain, point: null, type: 'current' })
                      }}
                    >
                      <Popup>
                        <div className="p-2">
                          <h4 className="font-semibold text-sm mb-2">
                            {chain.batchNumber || chain.drugBatchNumber}
                          </h4>
                          <p className="text-xs text-red-600 font-semibold mb-1">
                            📍 <strong>Vị trí hiện tại</strong>
                          </p>
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
                          {chain.currentLocation.actorRole && (
                            <p className="text-xs text-gray-600 mb-1">
                              <strong>Vai trò:</strong> {chain.currentLocation.actorRole}
                            </p>
                          )}
                          {chain.currentLocation.lastUpdated && (
                            <p className="text-xs text-gray-500">
                              <strong>Cập nhật:</strong> {new Date(chain.currentLocation.lastUpdated).toLocaleString('vi-VN')}
                            </p>
                          )}
                          {chain.drug?.name && (
                            <p className="text-xs text-gray-500 mt-1">
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
            
            // Nếu currentLocation có address nhưng chưa có coordinates, thử geocode
            if (chain.currentLocation?.address && (!chain.currentLocation.coordinates || chain.currentLocation.coordinates.length !== 2)) {
              console.warn(`⚠️ Chain ${chainIndex}: currentLocation có address nhưng chưa có coordinates:`, chain.currentLocation.address);
              // Có thể thêm logic geocode ở đây nếu cần
            }
            
            return markers;
          })}
        </MapContainer>
      </div>
      
      {/* Legend */}
      <div className="mt-4 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-semibold mb-2">Chú thích:</h4>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
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
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 rounded-full bg-red-500"></div>
            <span>Vị trí hiện tại</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SupplyChainMap;

