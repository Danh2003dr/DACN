import React, { useState, useEffect } from 'react';
import { MapPin, X } from 'lucide-react';

const AddressMap = ({ address, onClose, onAddressSelect }) => {
  const [coordinates, setCoordinates] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Geocoding function to get coordinates from address
  const geocodeAddress = async (address) => {
    if (!address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Using Nominatim (OpenStreetMap) geocoding service (free)
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=vn`
      );
      
      const data = await response.json();
      
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        setCoordinates({
          lat: parseFloat(lat),
          lng: parseFloat(lon),
          address: display_name
        });
      } else {
        setError('Không tìm thấy địa chỉ trên bản đồ');
      }
    } catch (err) {
      setError('Lỗi khi tìm kiếm địa chỉ');
      console.error('Geocoding error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      geocodeAddress(address);
    }
  }, [address]);

  const handleMapClick = () => {
    // In a real implementation, you would integrate with a map service
    // For now, we'll just show the coordinates
    if (coordinates) {
      onAddressSelect(coordinates);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Vị trí địa chỉ</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="mb-4">
          <div className="flex items-center space-x-2 text-gray-600">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">{address}</span>
          </div>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600">Đang tìm kiếm vị trí...</span>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {coordinates && !loading && (
          <div className="space-y-4">
            {/* Map placeholder - in a real app, you would integrate with Google Maps or similar */}
            <div 
              className="w-full h-64 bg-gray-200 rounded-lg flex items-center justify-center cursor-pointer hover:bg-gray-300 transition-colors"
              onClick={handleMapClick}
            >
              <div className="text-center">
                <MapPin className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                <p className="text-gray-600">Bản đồ tương tác</p>
                <p className="text-sm text-gray-500 mt-1">
                  Tọa độ: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}
                </p>
              </div>
            </div>

            {/* Coordinates info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Thông tin vị trí</h4>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Địa chỉ:</span> {coordinates.address}</p>
                <p><span className="font-medium">Vĩ độ:</span> {coordinates.lat.toFixed(6)}</p>
                <p><span className="font-medium">Kinh độ:</span> {coordinates.lng.toFixed(6)}</p>
              </div>
            </div>

            {/* Google Maps link */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-medium text-green-900 mb-2">Xem trên Google Maps</h4>
              <a
                href={`https://www.google.com/maps?q=${coordinates.lat},${coordinates.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-green-600 hover:text-green-700"
              >
                <MapPin className="h-4 w-4" />
                <span>Mở Google Maps</span>
              </a>
            </div>

            {/* Action buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Đóng
              </button>
              <button
                onClick={() => onAddressSelect(coordinates)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Sử dụng vị trí này
              </button>
            </div>
          </div>
        )}

        {!coordinates && !loading && !error && (
          <div className="text-center py-8 text-gray-500">
            <MapPin className="h-12 w-12 mx-auto mb-2 text-gray-400" />
            <p>Nhập địa chỉ để xem vị trí trên bản đồ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressMap;
