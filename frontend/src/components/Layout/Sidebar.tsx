import React, { useState } from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarMenu from './SidebarMenu';
import MissingStatusBoard from './MissingStatusBoard';
import ReportNumber from './ReportNumber';

interface SidebarProps {
  onMenuClick?: (menu: string) => void;
  currentPage?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick, currentPage }) => {
  const [activeMenu, setActiveMenu] = useState('map');

  const handleMenuClick = (menu: string) => {
    setActiveMenu(menu);
    onMenuClick?.(menu);
  };

  return (
    <div className="w-80 bg-white shadow-lg flex flex-col h-full">
      <SidebarHeader />
      <SidebarMenu 
        activeMenu={activeMenu} 
        onMenuClick={handleMenuClick} 
      />
      {/* 지도 페이지에서만 MissingStatusBoard 표시 */}
      {currentPage === 'map' && <MissingStatusBoard />}
      <ReportNumber />
    </div>
  );
};

export default Sidebar;
