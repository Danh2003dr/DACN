import React, { useState } from 'react';
import SimpleAddressMap from '../components/SimpleAddressMap';

const MapDemo = () => {
  const [personalAddress, setPersonalAddress] = useState('');
  const [organizationAddress, setOrganizationAddress] = useState('');

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Demo Bản Đồ Địa Chỉ
          </h1>
          <p className="text-gray-600">
            Tính năng nhập địa chỉ với bản đồ tương tác để chọn vị trí chính xác
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Địa chỉ cá nhân */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Địa chỉ cá nhân
            </h2>
            
            <SimpleAddressMap
              value={personalAddress}
              onChange={setPersonalAddress}
              placeholder="Nhập địa chỉ cá nhân hoặc click trên bản đồ để chọn vị trí"
              height="300px"
            />

            {personalAddress && (
              <div className="mt-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Địa chỉ đã chọn:</strong> {personalAddress}
                </p>
              </div>
            )}
          </div>

          {/* Địa chỉ tổ chức */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Địa chỉ tổ chức
            </h2>
            
            <SimpleAddressMap
              value={organizationAddress}
              onChange={setOrganizationAddress}
              placeholder="Nhập địa chỉ tổ chức hoặc click trên bản đồ để chọn vị trí"
              height="300px"
            />

            {organizationAddress && (
              <div className="mt-4 p-3 bg-green-50 rounded-md">
                <p className="text-sm text-green-800">
                  <strong>Địa chỉ tổ chức:</strong> {organizationAddress}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Thông tin tổng hợp */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Thông tin tổng hợp
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Địa chỉ cá nhân:</h4>
              <p className="text-gray-600">
                {personalAddress || 'Chưa chọn địa chỉ'}
              </p>
            </div>
            
            <div>
              <h4 className="font-medium text-gray-700 mb-2">Địa chỉ tổ chức:</h4>
              <p className="text-gray-600">
                {organizationAddress || 'Chưa chọn địa chỉ'}
              </p>
            </div>
          </div>

          {/* Nút reset */}
          <div className="mt-4">
            <button
              onClick={() => {
                setPersonalAddress('');
                setOrganizationAddress('');
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              Reset tất cả
            </button>
          </div>
        </div>

        {/* Hướng dẫn sử dụng */}
        <div className="mt-6 bg-blue-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">
            📖 Hướng dẫn sử dụng
          </h3>
          
          <div className="space-y-3 text-blue-800">
            <div className="flex items-start">
              <span className="font-semibold mr-2">1.</span>
              <p>Nhập địa chỉ trực tiếp vào ô input đầu tiên</p>
            </div>
            
            <div className="flex items-start">
              <span className="font-semibold mr-2">2.</span>
              <p>Click nút "Hiện bản đồ" để mở bản đồ tương tác</p>
            </div>
            
            <div className="flex items-start">
              <span className="font-semibold mr-2">3.</span>
              <p>Sử dụng ô tìm kiếm để tìm địa chỉ cụ thể</p>
            </div>
            
            <div className="flex items-start">
              <span className="font-semibold mr-2">4.</span>
              <p>Click vào các vị trí trên bản đồ để chọn địa chỉ</p>
            </div>
            
            <div className="flex items-start">
              <span className="font-semibold mr-2">5.</span>
              <p>Xem thông tin tọa độ và địa chỉ đã chọn</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapDemo;
