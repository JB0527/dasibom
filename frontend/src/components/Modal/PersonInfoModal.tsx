import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalBase from './ModalBase';
import WalkingRangeMap from '../Map/WalkingRange';
import type { MissingPerson } from '../../types/missingPerson';
import { calculateElapsedTime } from '../../utils/timeUtils';

interface PersonInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: MissingPerson | null;
  elapsedTime?: { formatted: string } | null; // 실제 지도에서 계산된 시간을 받음
}

const PersonInfoModal: React.FC<PersonInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  person,
  elapsedTime: propElapsedTime
}) => {
  const navigate = useNavigate();
  
  // props로 받은 시간이 있으면 사용, 없으면 자체 계산
  const [elapsedTime, setElapsedTime] = useState(
    propElapsedTime || calculateElapsedTime(person?.lastSeenDate || '')
  );
  
  console.log('PersonInfoModal 렌더링:', { isOpen, person });

  // props로 시간을 받지 않은 경우에만 자체 타이머 사용
  useEffect(() => {
    if (!person || propElapsedTime) return;
    
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTime(person.lastSeenDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [person?.lastSeenDate, propElapsedTime]);

  // props로 받은 시간이 변경되면 상태 업데이트
  useEffect(() => {
    if (propElapsedTime) {
      setElapsedTime(propElapsedTime);
    }
  }, [propElapsedTime]);

  const handleReport = () => {
    if (person) {
      navigate(`/report/${person.id}`);
    }
  };

  const handleShare = () => {
    if (!person) return;
    
    const shareText = `${person.name} 실종자 정보\n나이: ${person.age}세\n실종일시: ${new Date(person.lastSeenDate).toLocaleString('ko-KR')}\n실종장소: ${person.lastSeenLocation}\n경과시간: ${elapsedTime.formatted}`;
    
    if (navigator.share) {
      navigator.share({
        title: '실종자 정보',
        text: shareText,
        url: window.location.href
      });
    } else {
      navigator.clipboard.writeText(shareText).then(() => {
        alert('실종자 정보가 클립보드에 복사되었습니다.');
      });
    }
  };

  if (!person) {
    console.log('person이 없어서 모달 렌더링 안함');
    return null;
  }

  return (
    <ModalBase 
      isOpen={isOpen} 
      onClose={onClose}
      title="실종자 정보"
    >
      <div className="space-y-4">
        {/* 경과 시간 */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">실종 후 경과시간</span>
          <span className="text-red-500 font-semibold font-mono">{elapsedTime.formatted}</span>
        </div>

        {/* 기본 정보 */}
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
            {person.photo ? (
              <img 
                src={person.photo} 
                alt={person.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex-1 space-y-1">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">이름</span>
              <span className="font-semibold">{person.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">나이</span>
              <span>{person.age}세</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">국적</span>
              <span>{person.nationality}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">발생일시</span>
              <span>{new Date(person.lastSeenDate).toLocaleString('ko-KR', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">발생장소</span>
              <span className="text-right text-sm">{person.lastSeenLocation}</span>
            </div>
          </div>
        </div>

        {/* 추가 정보 (항상 표시) */}
        <div className="space-y-2 pt-4 border-t">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">키</span>
            <span>{person.height}cm</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">몸무게</span>
            <span>{person.weight}kg</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">체격</span>
            <span>{person.build}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">얼굴형</span>
            <span>{person.faceShape}</span>
          </div>
        </div>

        {/* 도보 이동 범위 지도 */}
        <div className="pt-4 border-t">
          <WalkingRangeMap person={person} />
        </div>

        {/* 액션 버튼들 */}
        <div className="flex gap-3">
          <button
            onClick={handleReport}
            className="flex-1 bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
          >
            신고하기
          </button>
          <button
            onClick={handleShare}
            className="flex-1 bg-gray-200 text-gray-800 py-3 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            공유하기
          </button>
        </div>
      </div>
    </ModalBase>
  );
};

export default PersonInfoModal;
