'use client';

import React from 'react';

interface SystemMessageTagProps {
  message: string;
  timestamp?: string;
}

export default function SystemMessageTag({ message, timestamp }: SystemMessageTagProps) {
  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch (error) {
      return '';
    }
  };

  return (
    <div className="flex justify-center my-2">
      <div className="inline-flex items-center px-3 py-2 rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs font-medium shadow-sm">
        <svg className="w-3 h-3 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
        <span className="flex-1 text-center">{message}</span>
        {timestamp && (
          <span className="ml-2 text-blue-600 dark:text-blue-300 text-xs">
            {formatTime(timestamp)}
          </span>
        )}
      </div>
    </div>
  );
} 