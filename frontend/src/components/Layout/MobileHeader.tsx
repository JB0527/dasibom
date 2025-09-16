import React from 'react';
import dasibomLogo from '../../assets/dasibom.svg';

const MobileHeader: React.FC = () => {
  return (
    <div className="md:hidden bg-white shadow-sm border-b border-gray-200 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* 로고 */}
        <div className="flex items-center space-x-2">
          <img 
            src={dasibomLogo} 
            alt="다시봄 로고" 
            className="w-8 h-8"
          />
          <h1 className="text-lg font-bold text-gray-800">다시봄</h1>
        </div>

        {/* 메뉴 버튼 */}
        <button className="p-2 text-gray-600 hover:text-gray-800">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default MobileHeader;
