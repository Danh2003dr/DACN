import React, { useState } from 'react';
import {
  Factory,
  Truck,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  User,
  Thermometer,
  Shield,
  Circle
} from 'lucide-react';

/**
 * DrugTimeline Component
 * 
 * Displays a vertical timeline showing the journey of a drug through the supply chain.
 * Similar to shipment tracking in Shopee/Grab.
 * 
 * @param {Array} events - Array of event objects with:
 *   - stageName: string - Name of the stage (e.g., "Manufacturing", "Transportation")
 *   - location: string - Location where the event occurred
 *   - timestamp: string|Date - Timestamp of the event
 *   - signerName: string - Name of the person who signed/verified
 *   - isVerified: boolean - Whether the event is blockchain verified
 *   - temperature: number - Temperature reading (optional)
 *   - status: 'normal' | 'warning' | 'pending' - Status of the event
 */
const DrugTimeline = ({ events = [], onAddressClick = null }) => {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  // Get icon based on stage name
  const getStageIcon = (stageName) => {
    const stage = stageName.toLowerCase();
    if (stage.includes('manufactur') || stage.includes('sản xuất')) {
      return Factory;
    }
    if (stage.includes('transport') || stage.includes('vận chuyển') || stage.includes('logistics')) {
      return Truck;
    }
    if (stage.includes('hospital') || stage.includes('bệnh viện') || stage.includes('reception')) {
      return Building2;
    }
    return Circle;
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;
    
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  // Get status colors
  const getStatusColors = (status, isCompleted) => {
    if (status === 'warning') {
      return {
        node: 'bg-red-500 border-red-600',
        line: 'bg-red-500',
        card: 'border-red-300 bg-red-50',
        text: 'text-red-700'
      };
    }
    if (status === 'pending' || !isCompleted) {
      return {
        node: 'bg-gray-300 border-gray-400',
        line: 'bg-gray-300',
        card: 'border-gray-200 bg-gray-50',
        text: 'text-gray-600'
      };
    }
    // normal/completed
    return {
      node: 'bg-blue-500 border-blue-600',
      line: 'bg-blue-500',
      card: 'border-blue-200 bg-blue-50',
      text: 'text-blue-700'
    };
  };

  // Check if step is completed
  const isCompleted = (event) => {
    return event.status !== 'pending' && event.timestamp;
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6">
      <div className="relative">
        {/* Timeline line - continuous vertical line */}
        <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200" />
        
        {/* Timeline events */}
        <div className="space-y-8">
          {events.map((event, index) => {
            const Icon = getStageIcon(event.stageName);
            const colors = getStatusColors(event.status, isCompleted(event));
            const completed = isCompleted(event);
            const isLast = index === events.length - 1;
            
            return (
              <div key={index} className="relative flex items-start gap-6">
                {/* Left: Timestamp */}
                <div className="w-24 flex-shrink-0 pt-1">
                  <div className="text-xs text-gray-500 font-medium">
                    {formatTimestamp(event.timestamp)}
                  </div>
                </div>

                {/* Center: Timeline node and line */}
                <div className="relative flex-shrink-0">
                  {/* Timeline node */}
                  <div
                    className={`relative z-10 w-16 h-16 rounded-full border-2 ${colors.node} flex items-center justify-center shadow-lg transition-all duration-200 ${
                      event.status === 'warning' ? 'animate-pulse' : ''
                    }`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                    
                    {/* Status indicator dot */}
                    {completed && event.status === 'normal' && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                        <CheckCircle2 className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Connecting line segment */}
                  {!isLast && (
                    <div
                      className={`absolute left-8 top-16 w-0.5 ${
                        completed && events[index + 1] && isCompleted(events[index + 1])
                          ? 'bg-blue-500'
                          : 'bg-gray-300 border-dashed'
                      }`}
                      style={{ height: 'calc(100% + 2rem)' }}
                    />
                  )}
                </div>

                {/* Right: Details card */}
                <div className={`flex-1 rounded-lg border-2 ${colors.card} p-4 shadow-sm transition-all duration-200 hover:shadow-md`}>
                  {/* Stage name and location */}
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className={`text-lg font-semibold ${colors.text} mb-1`}>
                        {event.stageName}
                      </h3>
                      {event.location && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <MapPin className="w-4 h-4" />
                          {onAddressClick && event.location !== 'N/A' ? (
                            <button
                              onClick={() => onAddressClick(event.location)}
                              className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                              title="Click để xem trên bản đồ"
                            >
                              {event.location}
                            </button>
                          ) : (
                            <span>{event.location}</span>
                          )}
                        </div>
                      )}
                    </div>
                    
                    {/* Verified badge */}
                    {event.isVerified && (
                      <div className="relative group">
                        <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                          <Shield className="w-3 h-3" />
                          <span>Verified</span>
                        </div>
                        {/* Tooltip */}
                        <div className="absolute right-0 top-full mt-2 w-48 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-20 shadow-xl">
                          <div className="absolute -top-1 right-4 w-2 h-2 bg-gray-900 transform rotate-45"></div>
                          Digitally Signed by {event.signerName || 'Unknown'}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Signer information */}
                  {event.signerName && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                      <User className="w-4 h-4" />
                      <span>
                        {event.isVerified ? 'Ký bởi' : 'Xử lý bởi'}: <span className="font-medium">{event.signerName}</span>
                      </span>
                    </div>
                  )}

                  {/* Warning alert box */}
                  {event.status === 'warning' && (
                    <div className="mt-3 p-3 bg-red-100 border border-red-300 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-red-800 mb-1">
                            Cảnh báo
                          </div>
                          {event.temperature && (
                            <div className="flex items-center gap-1 text-sm text-red-700">
                              <Thermometer className="w-4 h-4" />
                              <span>
                                Nhiệt độ: <strong>{event.temperature}°C</strong> - Vượt quá giới hạn cho phép
                              </span>
                            </div>
                          )}
                          {event.warningMessage && (
                            <div className="text-sm text-red-700 mt-1">
                              {event.warningMessage}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Temperature display (normal) */}
                  {event.temperature && event.status === 'normal' && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-gray-600">
                      <Thermometer className="w-4 h-4" />
                      <span>Nhiệt độ: {event.temperature}°C</span>
                    </div>
                  )}

                  {/* Pending status */}
                  {event.status === 'pending' && (
                    <div className="mt-2 flex items-center gap-1 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      <span>Đang chờ xử lý...</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DrugTimeline;

