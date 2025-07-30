import React from 'react';
import { useUserStore } from '../../store/userStore';

export const Navbar: React.FC = () => {
  const { agentName, isLoggedIn, logout } = useUserStore();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Chatwoot Dashboard
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-600">
              {agentName}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              isLoggedIn 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {isLoggedIn ? 'Online' : 'Offline'}
            </span>
            {isLoggedIn && (
              <button
                onClick={logout}
                className="text-sm text-red-600 hover:text-red-800"
              >
                Sair
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}; 