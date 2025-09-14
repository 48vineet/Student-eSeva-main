import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LogoutModal from './LogoutModal';
import ProfileSettingsModal from './ProfileSettingsModal';

const ModalUserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      setShowLogoutModal(false);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  const getRoleColor = (role) => {
    const colors = {
      'counselor': 'from-purple-500 to-purple-600',
      'faculty': 'from-blue-500 to-blue-600',
      'exam-department': 'from-green-500 to-green-600',
      'student': 'from-orange-500 to-orange-600',
      'local-guardian': 'from-pink-500 to-pink-600'
    };
    return colors[role] || 'from-gray-500 to-gray-600';
  };

  const getRoleDisplayName = (role) => {
    const names = {
      'counselor': 'Counselor',
      'faculty': 'Faculty',
      'exam-department': 'Exam Department',
      'student': 'Student',
      'local-guardian': 'Local Guardian'
    };
    return names[role] || 'User';
  };

  const handleButtonClick = (action) => {
    console.log(`${action} button clicked!`);
    setIsOpen(false);
    
    switch(action) {
      case 'Dashboard':
        navigate('/dashboard');
        break;
      case 'Profile Settings':
        setShowProfileModal(true);
        break;
      case 'Help & Support':
        setShowHelpModal(true);
        break;
      case 'Sign Out':
        setShowLogoutModal(true);
        break;
      default:
        break;
    }
  };

  const dropdownContent = isOpen && createPortal(
     <div
       className="fixed top-20 right-6 z-50 bg-white/95 backdrop-blur-md border border-gray-200/50 rounded-2xl shadow-2xl w-72 py-3 animate-dropdown-fade-in"
       ref={menuRef}
     >
      {/* User Info Header */}
      <div className="px-6 py-4 border-b border-gray-200/50">
        <div className="flex items-center gap-4">
          <div 
            className={`w-12 h-12 rounded-full bg-gradient-to-r ${getRoleColor(user?.role)} flex items-center justify-center text-white font-bold shadow-lg ring-2 ring-white/50`}
          >
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-base font-semibold text-gray-900 truncate">
              {user?.username || 'User'}
            </div>
            <div className="text-sm text-gray-600 truncate">
              {getRoleDisplayName(user?.role)}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Online
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="py-2">
        {/* Dashboard */}
        <button
          onClick={() => handleButtonClick('Dashboard')}
          className="w-full px-6 py-3 text-left text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 flex items-center gap-3 rounded-xl group"
          type="button"
        >
          <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-blue-100 transition-colors duration-200">
            <svg className="w-4 h-4 text-gray-600 group-hover:text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Dashboard</span>
            <span className="text-xs text-gray-500">View your dashboard</span>
          </div>
        </button>

        {/* Profile Settings */}
        <button
          onClick={() => handleButtonClick('Profile Settings')}
          className="w-full px-6 py-3 text-left text-gray-700 hover:bg-green-50 hover:text-green-700 transition-all duration-200 flex items-center gap-3 rounded-xl group"
          type="button"
        >
          <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-green-100 transition-colors duration-200">
            <svg className="w-4 h-4 text-gray-600 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Profile Settings</span>
            <span className="text-xs text-gray-500">Manage your account</span>
          </div>
        </button>

        {/* Help & Support */}
        <button
          onClick={() => handleButtonClick('Help & Support')}
          className="w-full px-6 py-3 text-left text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-all duration-200 flex items-center gap-3 rounded-xl group"
          type="button"
        >
          <div className="p-2 rounded-lg bg-gray-100 group-hover:bg-purple-100 transition-colors duration-200">
            <svg className="w-4 h-4 text-gray-600 group-hover:text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Help & Support</span>
            <span className="text-xs text-gray-500">Get assistance</span>
          </div>
        </button>

        <div className="border-t border-gray-200/50 my-3"></div>
        
        {/* Sign Out */}
        <button
          onClick={() => handleButtonClick('Sign Out')}
          className="w-full px-6 py-3 text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-all duration-200 flex items-center gap-3 rounded-xl group"
          type="button"
        >
          <div className="p-2 rounded-lg bg-red-100 group-hover:bg-red-200 transition-colors duration-200">
            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-sm">Sign Out</span>
            <span className="text-xs text-red-500">Logout from your account</span>
          </div>
        </button>
      </div>
    </div>,
    document.body
  );

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* User Button */}
        <button
          onClick={() => {
            console.log('Toggle clicked!');
            setIsOpen(!isOpen);
          }}
          className="flex items-center space-x-3 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-all duration-300 group shadow-lg hover:shadow-xl border border-white/20 hover:border-white/30"
        >
          {/* Avatar */}
          <div className={`w-10 h-10 rounded-full bg-gradient-to-r ${getRoleColor(user?.role)} flex items-center justify-center text-white text-sm font-bold shadow-lg ring-2 ring-white/50 group-hover:scale-105 transition-transform duration-200`}>
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </div>
          
          {/* User Info */}
          <div className="text-left flex-1 min-w-0">
            <div className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors duration-200">
              {user?.username || 'User'}
            </div>
            <div className="text-xs text-white/70 truncate group-hover:text-white/90 transition-colors duration-200">
              {getRoleDisplayName(user?.role)}
            </div>
          </div>
          
          {/* Dropdown Arrow */}
          <div className="p-2 rounded-lg bg-white/10 group-hover:bg-white/20 transition-all duration-200">
            <svg 
              className={`w-4 h-4 text-white/70 group-hover:text-white transition-all duration-200 ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </button>
      </div>

      {/* Portal Dropdown */}
      {dropdownContent}

      {/* Logout Modal */}
      <LogoutModal 
        isOpen={showLogoutModal} 
        onClose={() => setShowLogoutModal(false)} 
        onConfirm={handleLogout} 
        isLoading={isLoggingOut} 
      />

      {/* Profile Settings Modal */}
      <ProfileSettingsModal 
        isOpen={showProfileModal} 
        onClose={() => setShowProfileModal(false)} 
      />

      {/* Help & Support Modal */}
      {showHelpModal && createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-custom flex items-center justify-center" style={{ zIndex: 999999 }}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Help & Support</h3>
            <p className="text-gray-600 mb-4">Help and support functionality coming soon!</p>
            <button
              onClick={() => setShowHelpModal(false)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
};

export default ModalUserMenu;
