import React from 'react';
import { useNavigate } from 'react-router-dom';
import MapContainer from '../../components/Map/MapContainer';
import Sidebar from '../../components/Layout/Sidebar';
import MobileHeader from '../../components/Layout/MobileHeader';
import MissingStatusBoard from '../../components/Layout/MissingStatusBoard';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  const handleMenuClick = (menu: string) => {
    switch (menu) {
      case 'missing-list':
        navigate('/missing-list');
        break;
      case 'report':
        // 실종자 접수 페이지로 이동 (실제로는 특정 실종자 선택 후 이동)
        break;
      default:
        // map은 현재 페이지이므로 아무것도 하지 않음
        break;
    }
  };

  return (
    <div className="w-full h-screen flex flex-col md:flex-row">
      {/* 모바일 헤더 */}
      <MobileHeader onMenuClick={handleMenuClick} />
      
      {/* 모바일 실종현황판 - 탑바 바로 밑에 표시 */}
      <div className="md:hidden flex-shrink-0">
        <MissingStatusBoard isMobile={true} />
      </div>
      
      {/* 데스크톱 사이드바 */}
      <div className="hidden md:block">
        <Sidebar onMenuClick={handleMenuClick} />
      </div>
      
      {/* 지도 영역 */}
      <div className="flex-1 relative min-h-0">
        <MapContainer />
      </div>
    </div>
  );
};

export default HomePage;
