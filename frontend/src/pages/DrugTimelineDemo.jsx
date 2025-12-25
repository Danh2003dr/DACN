import React from 'react';
import Layout from '../components/Layout';
import DrugTimeline from '../components/DrugTimeline';

/**
 * Demo page for DrugTimeline component
 * Shows mock data with 3 steps including a temperature warning
 */
const DrugTimelineDemo = () => {
  // Mock data: 3 steps (Manufacturing, Transportation with temp warning, Hospital Reception)
  const mockEvents = [
    {
      stageName: 'Sản xuất',
      location: 'Nhà máy Dược phẩm ABC, Hà Nội',
      timestamp: new Date('2025-01-15T08:30:00'),
      signerName: 'Nguyễn Văn A',
      isVerified: true,
      temperature: 22,
      status: 'normal'
    },
    {
      stageName: 'Vận chuyển',
      location: 'Kho trung chuyển, TP. Hồ Chí Minh',
      timestamp: new Date('2025-01-16T14:45:00'),
      signerName: 'Trần Thị B',
      isVerified: true,
      temperature: 30, // High temperature - warning
      status: 'warning',
      warningMessage: 'Nhiệt độ vận chuyển vượt quá giới hạn cho phép (25°C)'
    },
    {
      stageName: 'Tiếp nhận tại Bệnh viện',
      location: 'Bệnh viện Đa khoa XYZ, TP. Hồ Chí Minh',
      timestamp: new Date('2025-01-17T10:20:00'),
      signerName: 'Lê Văn C',
      isVerified: true,
      temperature: 20,
      status: 'normal'
    }
  ];

  return (
    <Layout>
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Hành trình Thuốc
            </h1>
            <p className="text-gray-600">
              Theo dõi hành trình của lô thuốc qua chuỗi cung ứng
            </p>
          </div>

          {/* Timeline Component */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <DrugTimeline events={mockEvents} />
          </div>

          {/* Additional Info */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">i</span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 mb-1">
                  Giải thích Timeline
                </h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>Màu xanh:</strong> Trạng thái bình thường, đã hoàn thành</li>
                  <li>• <strong>Màu đỏ:</strong> Cảnh báo (nhiệt độ cao, sốc, v.v.)</li>
                  <li>• <strong>Màu xám:</strong> Đang chờ xử lý</li>
                  <li>• <strong>Verified badge:</strong> Đã được ký số và xác minh trên blockchain</li>
                  <li>• <strong>Đường nét liền:</strong> Bước đã hoàn thành</li>
                  <li>• <strong>Đường nét đứt:</strong> Bước đang chờ xử lý</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default DrugTimelineDemo;

