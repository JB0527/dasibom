import React, { useState, useEffect } from 'react';
import dasibomLogo from '../../assets/dasibom.svg';

interface MobileHeaderProps {
  onMenuClick?: (menu: string) => void;
}

const MobileHeader: React.FC<MobileHeaderProps> = ({ onMenuClick }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleMenuToggle = () => {
    console.log('햄버거 메뉴 클릭됨, 현재 상태:', isMenuOpen);
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClick = (menu: string) => {
    setIsMenuOpen(false);
    onMenuClick?.(menu);
  };

  // 디버깅용 useEffect
  useEffect(() => {
    console.log('isMenuOpen 상태 변경됨:', isMenuOpen);
  }, [isMenuOpen]);

  const menuItems = [
    { id: 'map', label: '실종 지도 페이지' },
    { id: 'missing-list', label: '실종자 목록' },
    { id: 'report', label: '실종자 접수 페이지' }
  ];

  return (
    <div className="md:hidden bg-white shadow-sm border-b border-gray-200">
      {/* 헤더 기본 영역 */}
      <div className="px-4 py-3">
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

          {/* 햄버거 메뉴 버튼 */}
          <button 
            onClick={handleMenuToggle}
            className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* 확장되는 메뉴 영역 */}
      {isMenuOpen && (
        <div className="border-t border-gray-200 bg-gray-50">
          <div className="px-4 py-3 space-y-2">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleMenuClick(item.id)}
                className="w-full text-left p-3 rounded-lg font-medium transition-colors bg-white text-gray-700 hover:bg-gray-100 hover:text-gray-900 border border-gray-200 shadow-sm"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileHeader;
