import React from 'react';
import MapContainer from '../../components/Map/MapContainer';
import Sidebar from '../../components/Layout/Sidebar';
import MobileHeader from '../../components/Layout/MobileHeader';
import MissingStatusBoard from '../../components/Layout/MissingStatusBoard';

const HomePage: React.FC = () => {
  return (
    <div className="w-full h-screen flex flex-col md:flex-row">
      {/* 모바일 헤더 */}
      <MobileHeader />
      
      {/* 모바일 실종현황판 - 탑바 바로 밑에 표시 */}
      <div className="md:hidden flex-shrink-0">
        <MissingStatusBoard isMobile={true} />
      </div>
      
      {/* 데스크톱 사이드바 */}
      <div className="hidden md:block">
        <Sidebar />
      </div>
      
      {/* 지도 영역 */}
      <div className="flex-1 relative min-h-0">
        <MapContainer />
      </div>
    </div>
  );
};

export default HomePage;
