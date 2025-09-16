import React from 'react';
import dasibomLogo from '../../assets/dasibom.svg';

const SidebarHeader: React.FC = () => {
  return (
    <div className="p-6 border-b border-gray-200">
      <div className="flex items-center space-x-3">
        <img 
          src={dasibomLogo} 
          alt="다시봄 로고" 
          className="w-10 h-10"
        />
        <h1 className="text-xl font-bold text-gray-800">다시봄</h1>
      </div>
    </div>
  );
};

export default SidebarHeader;
