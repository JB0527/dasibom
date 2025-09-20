import React from 'react';

interface SidebarMenuProps {
  activeMenu?: string;
  onMenuClick?: (menu: string) => void;
}

const SidebarMenu: React.FC<SidebarMenuProps> = ({ 
  activeMenu = 'map', 
  onMenuClick 
}) => {
  const menuItems = [
    {
      id: 'map',
      label: '실종 지도 페이지',
      isActive: activeMenu === 'map'
    },
    {
      id: 'missing-list',
      label: '실종자 목록',
      isActive: activeMenu === 'missing-list'
    },
    {
      id: 'report',
      label: '실종자 접수 페이지',
      isActive: activeMenu === 'report'
    }
  ];

  return (
    <div className="p-4 space-y-2">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onMenuClick?.(item.id)}
          className={`w-full text-left p-3 rounded-lg font-medium transition-colors text-center ${
            item.isActive
              ? 'bg-yellow-100'
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
          }`}
          style={item.isActive ? { color: '#FFC300' } : undefined}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
};

export default SidebarMenu;
