import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalBase from './ModalBase';
import WalkingRangeMap from '../Map/WalkingRange';
import type { MissingPersonDetail, MissingPersonListItem } from '../../types/missingPerson';
import { calculateElapsedTime } from '../../utils/timeUtils';
import { useMapMissingPerson } from '../../hooks/useMissingPerson';

interface PersonInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: MissingPersonListItem | null;
  elapsedTime?: { formatted: string } | null; // 실제 지도에서 계산된 시간을 받음
}

const PersonInfoModal: React.FC<PersonInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  person,
  elapsedTime: propElapsedTime
}) => {
  const navigate = useNavigate();
  const { getCaseDetail } = useMapMissingPerson();
  
  // 상세 정보 상태
  const [detailInfo, setDetailInfo] = useState<MissingPersonDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  // props로 받은 시간이 있으면 사용, 없으면 자체 계산
  const [elapsedTime, setElapsedTime] = useState(
    propElapsedTime || calculateElapsedTime(person?.occurDate || '')
  );
  
  console.log('PersonInfoModal 렌더링:', { isOpen, person });

  // props로 시간을 받지 않은 경우에만 자체 타이머 사용
  useEffect(() => {
    if (!person || propElapsedTime) return;
    
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTime(person.occurDate));
    }, 1000);

    return () => clearInterval(interval);
  }, [person?.occurDate, propElapsedTime]);

  // props로 받은 시간이 변경되면 상태 업데이트
  useEffect(() => {
    if (propElapsedTime) {
      setElapsedTime(propElapsedTime);
    }
  }, [propElapsedTime]);

  // 모달이 열릴 때 상세 정보 가져오기
  useEffect(() => {
    if (isOpen && person) {
      const loadDetailInfo = async () => {
        setIsLoadingDetail(true);
        try {
          const detail = await getCaseDetail(person.id);
          setDetailInfo(detail);
        } catch (error) {
          console.error('상세 정보 로드 실패:', error);
        } finally {
          setIsLoadingDetail(false);
        }
      };
      loadDetailInfo();
    }
  }, [isOpen, person, getCaseDetail]);

  const handleReport = () => {
    if (person) {
      navigate(`/report/${person.id}`);
    }
  };

  const handleShare = () => {
    if (!person) return;
    
    const shareText = `${person.name} 실종자 정보\n상태: ${person.status === 'OPEN' ? '진행중' : '해제'}\n발생일: ${person.occurDate.substring(0, 4)}-${person.occurDate.substring(4, 6)}-${person.occurDate.substring(6, 8)}\n위치: ${person.point.lat.toFixed(4)}, ${person.point.lon.toFixed(4)}\n경과시간: ${elapsedTime.formatted}`;
    
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
            {(detailInfo?.photoUrl || person.photoUrl) ? (
              <img 
                src={detailInfo?.photoUrl || person.photoUrl} 
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
              <span className="text-sm text-gray-500">상태</span>
              <span>{person.status === 'OPEN' ? '진행중' : '해제'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">나이</span>
              <span>{detailInfo?.age || detailInfo?.ageNow || 'N/A'}세</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">성별</span>
              <span>{detailInfo?.sexCode === '1' ? '남성' : detailInfo?.sexCode === '2' ? '여성' : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">발생일</span>
              <span>{person.occurDate.substring(0, 4)}-{person.occurDate.substring(4, 6)}-{person.occurDate.substring(6, 8)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">발생장소</span>
              <span className="text-right text-sm">{detailInfo?.occurAddress || 'N/A'}</span>
            </div>
          </div>
        </div>

        {/* 예측 정보 (있는 경우) */}
        {person.prediction && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">예측 시간</span>
              <span>{new Date(person.prediction.predictedAt).toLocaleString('ko-KR')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">예측 범위</span>
              <span>{person.prediction.horizonHours}시간</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">예상 속도</span>
              <span>{person.prediction.speedKmh}km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">현재 반경</span>
              <span>{(person.prediction.currentRadiusM / 1000).toFixed(1)}km</span>
            </div>
          </div>
        )}

        {/* 추가 정보 (상세 정보가 있을 때만 표시) */}
        {detailInfo && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">키</span>
              <span>{detailInfo.height ? `${detailInfo.height}cm` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">몸무게</span>
              <span>{detailInfo.weight ? `${detailInfo.weight}kg` : 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-500">대상코드</span>
              <span>{detailInfo.targetCode || 'N/A'}</span>
            </div>
            {detailInfo.endedAt && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">종료시각</span>
                <span>{new Date(detailInfo.endedAt).toLocaleString('ko-KR')}</span>
              </div>
            )}
          </div>
        )}

        {/* 로딩 상태 */}
        {isLoadingDetail && (
          <div className="pt-4 border-t">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mr-2"></div>
              <span className="text-sm text-gray-600">상세 정보를 불러오는 중...</span>
            </div>
          </div>
        )}

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
