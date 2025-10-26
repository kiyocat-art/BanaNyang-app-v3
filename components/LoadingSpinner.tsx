import React from 'react';

export const LoadingSpinner: React.FC<{ fullScreen?: boolean; className?: string }> = ({ fullScreen = false, className = "h-8 w-8" }) => (
  <div className={`flex justify-center items-center ${fullScreen ? 'fixed inset-0 bg-black/80 backdrop-blur-sm z-[200]' : ''}`}>
    <div className={`animate-spin rounded-full ${className} border-t-2 border-b-2 border-white`}></div>
  </div>
);