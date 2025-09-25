import React, { useState } from 'react';
import SidebarHeader from './SidebarHeader';
import SidebarMenu from './SidebarMenu';
import MissingStatusBoard from './MissingStatusBoard';
import ReportNumber from './ReportNumber';

interface SidebarProps {
  onMenuClick?: (menu: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onMenuClick }) => {
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
      <MissingStatusBoard />
      <ReportNumber />
    </div>
  );
};

export default Sidebar;
