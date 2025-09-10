import React, { useState } from 'react';
import PersonInfoModal from '../Modal/PersonInfoModal';

// 임시 데이터 (나중에 API에서 가져올 예정)
const mockMissingPersons = [
  {
    id: '1',
    name: '왕성민',
    age: 26,
    nationality: '내국인',
    height: 170,
    weight: 60,
    build: '보통 이상',
    faceShape: '갸름한형',
    lastSeenDate: '2025년 08월30일',
    lastSeenLocation: '서울 중구 을지로 281',
    elapsedTime: '00:23',
    coordinates: { lat: 37.5665, lng: 126.9780 }
  }
];

const MapContainer: React.FC = () => {
  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleMarkerClick = (person: any) => {
    console.log('마커 클릭됨:', person);
    setSelectedPerson(person);
    setIsModalOpen(true);
    console.log('모달 상태:', isModalOpen);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPerson(null);
  };

  const handleReport = () => {
    // 신고 페이지로 이동
    console.log('신고하기 클릭:', selectedPerson);
    // router.push(`/report/${selectedPerson.id}`);
  };

  return (
    <div className="relative w-full h-screen">
      {/* 지도 영역 (임시로 배경색으로 표시) */}
      <div className="w-full h-full bg-blue-200 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">지도 영역</h2>
          <p className="text-green-500 mb-4">여기에 실제 지도가 표시됩니다</p>
          
          {/* Tailwind 테스트 */}
          <div className="bg-yellow-300 p-4 rounded-lg mb-4">
            <p className="text-black font-bold">Tailwind CSS 테스트</p>
          </div>
          
          {/* 임시 마커 버튼들 */}
          <div className="space-y-2">
            {mockMissingPersons.map((person) => (
              <button
                key={person.id}
                onClick={() => handleMarkerClick(person)}
                className="block mx-auto bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors"
              >
                {person.name} 마커 클릭
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 실종자 정보 모달 */}
      <PersonInfoModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        person={selectedPerson}
        onReport={handleReport}
      />
    </div>
  );
};

export default MapContainer;
