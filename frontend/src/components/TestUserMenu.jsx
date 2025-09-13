import React, { useState } from 'react';

const TestUserMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleSignOut = () => {
    console.log('Sign Out button clicked!');
    alert('Sign Out button clicked!');
    setIsOpen(false);
    setShowLogoutModal(true);
  };

  return (
    <div className="relative">
      {/* Test Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-500 text-white px-4 py-2 rounded"
      >
        Test Menu {isOpen ? '▼' : '▶'}
      </button>

      {/* Simple Dropdown */}
      {isOpen && (
        <div className="absolute top-10 left-0 bg-white border border-gray-300 rounded shadow-lg p-2 z-50">
          <button
            onClick={handleSignOut}
            className="block w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 cursor-pointer"
            type="button"
          >
            Sign Out
          </button>
        </div>
      )}

      {/* Simple Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-custom flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Confirm Logout</h3>
            <p className="mb-4">Are you sure you want to sign out?</p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowLogoutModal(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  console.log('Logout confirmed!');
                  alert('Logout confirmed!');
                  setShowLogoutModal(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestUserMenu;
