import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import MapContainer from '../../components/Map/MapContainer';
import Sidebar from '../../components/Layout/Sidebar';
import MobileHeader from '../../components/Layout/MobileHeader';
import MissingStatusBoard from '../../components/Layout/MissingStatusBoard';
import MissingPersonListPage from '../MissingPersonList/MissingPersonListPage';
import { ReportPage } from '../Report/ReportPage';

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // URL에 따라 초기 페이지 설정
  const getInitialPage = () => {
    if (location.pathname === '/missing-list') return 'missing-list';
    if (location.pathname.startsWith('/report/')) return 'report';
    return 'map';
  };
  
  const [currentPage, setCurrentPage] = useState<'map' | 'missing-list' | 'report'>(getInitialPage());

  const handleMenuClick = (menu: string) => {
    switch (menu) {
      case 'missing-list':
        setCurrentPage('missing-list');
        navigate('/missing-list');
        break;
      case 'report':
        // 실종자 접수 페이지로 이동 (실제로는 특정 실종자 선택 후 이동)
        break;
      default:
        setCurrentPage('map');
        navigate('/');
        break;
    }
  };

  // URL에 따라 현재 페이지 결정
  React.useEffect(() => {
    if (location.pathname === '/missing-list') {
      setCurrentPage('missing-list');
    } else if (location.pathname.startsWith('/report/')) {
      setCurrentPage('report');
    } else {
      setCurrentPage('map');
    }
  }, [location.pathname]);

  const renderContent = () => {
    switch (currentPage) {
      case 'missing-list':
        return <MissingPersonListPage />;
      case 'report':
        // URL에서 missingPersonId 추출
        const pathParts = location.pathname.split('/');
        const missingPersonId = pathParts[2]; // /report/:missingPersonId
        return <ReportPage missingPersonId={missingPersonId} />;
      default:
        return <MapContainer />;
    }
  };

  // 신고 페이지는 전체 화면으로 표시
  if (currentPage === 'report') {
    return (
      <div className="w-full h-screen">
        {renderContent()}
      </div>
    );
  }

  return (
    <div className="w-full h-screen flex flex-col md:flex-row">
      {/* 모바일 헤더 */}
      <MobileHeader onMenuClick={handleMenuClick} />
      
      {/* 모바일 실종현황판 - 탑바 바로 밑에 표시 (지도 페이지에서만) */}
      {currentPage === 'map' && (
        <div className="md:hidden flex-shrink-0">
          <MissingStatusBoard isMobile={true} />
        </div>
      )}
      
      {/* 데스크톱 사이드바 */}
      <div className="hidden md:block">
        <Sidebar onMenuClick={handleMenuClick} currentPage={currentPage} />
      </div>
      
      {/* 메인 콘텐츠 영역 */}
      <div className="flex-1 relative min-h-0">
        {renderContent()}
      </div>
    </div>
  );
};

export default HomePage;
