import React from 'react';

const LoadingComponent = () => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="flex flex-col items-center space-y-8">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-white border-opacity-30 rounded-full animate-spin">
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-white rounded-full animate-spin"></div>
          </div>
        </div>
        
        <div className="flex items-center space-x-1">
          <span className="text-white text-xl font-medium">Đang tải</span>
          <div className="flex space-x-1 pt-2.5">
            <div 
              className="w-1 h-1 pt-1 bg-white rounded-full animate-bounce" 
              style={{animationDelay: '0ms'}}
            ></div>
            <div 
              className="w-1 h-1 pt-1 bg-white rounded-full animate-bounce" 
              style={{animationDelay: '150ms'}}
            ></div>
            <div 
              className="w-1 h-1 pt-1 bg-white rounded-full animate-bounce" 
              style={{animationDelay: '300ms'}}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoadingComponent;