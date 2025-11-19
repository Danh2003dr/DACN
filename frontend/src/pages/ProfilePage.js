import React, { useState, useEffect } from 'react';
import { getProfile } from '../api/profileApi';
import ProfileHeader from '../components/profile/ProfileHeader';
import ProfileTabs from '../components/profile/ProfileTabs';
import ProfileGeneralTab from '../components/profile/tabs/ProfileGeneralTab';
import ProfileOrganizationTab from '../components/profile/tabs/ProfileOrganizationTab';
import ProfileSecurityTab from '../components/profile/tabs/ProfileSecurityTab';
import ProfileNotificationTab from '../components/profile/tabs/ProfileNotificationTab';

const ProfilePage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('general');

  // Lấy dữ liệu profile khi component mount
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getProfile();
        
        if (response.success && response.data.user) {
          setUser(response.data.user);
        } else {
          setError('Không thể tải thông tin profile');
        }
      } catch (err) {
        setError(err.response?.data?.message || 'Đã xảy ra lỗi khi tải thông tin profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Render tab content dựa trên activeTab
  const renderTabContent = () => {
    if (!user) return null;

    switch (activeTab) {
      case 'general':
        return <ProfileGeneralTab user={user} onUpdate={setUser} />;
      case 'organization':
        return <ProfileOrganizationTab user={user} onUpdate={setUser} />;
      case 'security':
        return <ProfileSecurityTab user={user} />;
      case 'notification':
        return <ProfileNotificationTab user={user} onUpdate={setUser} />;
      default:
        return <ProfileGeneralTab user={user} onUpdate={setUser} />;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin profile...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Lỗi tải thông tin</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  // Main content
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        {user && <ProfileHeader user={user} onUpdate={setUser} />}

        {/* Tabs Navigation */}
        <ProfileTabs activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

