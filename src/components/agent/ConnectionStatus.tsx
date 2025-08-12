'use client';

import React from 'react';

interface ConnectionStatusProps {
  isConnected: boolean;
  error?: string | null;
}

export default function ConnectionStatus({ isConnected, error }: ConnectionStatusProps) {
  if (error) {
    return (
      <div className="flex items-center space-x-2 text-red-500">
        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
        <span className="text-xs">Erro de conexão</span>
      </div>
    );
  }

  if (isConnected) {
    return (
      <div className="flex items-center space-x-2 text-green-500">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="text-xs">Tempo Real</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 text-gray-500">
      <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
      <span className="text-xs">Conectando...</span>
    </div>
  );
}
