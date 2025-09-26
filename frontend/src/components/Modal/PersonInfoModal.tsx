import React, { useState, useEffect, memo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import ModalBase from './ModalBase';
import WalkingRangeMap from '../Map/WalkingRange';
import type { MissingPersonDetail, MissingPersonMapItem } from '../../types/missingPerson';
import { calculateElapsedTimeFromCreated } from '../../utils/timeUtils';
import { getTargetCodeLabel } from '../../utils/targetCodeUtils';
import { useListMissingPerson } from '../../hooks/useOptimizedMissingPerson';
import ElapsedTimeBadge from '../Common/ElapsedTimeBadge';

interface PersonInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: MissingPersonMapItem | null;
}

const PersonInfoModal: React.FC<PersonInfoModalProps> = memo(({ 
  isOpen, 
  onClose, 
  person
}) => {
  const navigate = useNavigate();
  const { getCaseDetail } = useListMissingPerson();
  
  // 상세 정보 상태
  const [detailInfo, setDetailInfo] = useState<MissingPersonDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  // 자체 타이머로 시간 관리 (1초마다) - createdAt 기준
  const [elapsedTime, setElapsedTime] = useState(
    person?.createdAt ? calculateElapsedTimeFromCreated(person.createdAt) : { 
      hours: 0, 
      minutes: 0, 
      seconds: 0, 
      totalSeconds: 0, 
      formatted: '00:00:00' 
    }
  );
  
  // 실시간 경과시간 업데이트 (1초마다) - createdAt 기준
  useEffect(() => {
    if (!person || !person.createdAt) return;
    
    // 즉시 한 번 계산
    setElapsedTime(calculateElapsedTimeFromCreated(person.createdAt));
    
    const interval = setInterval(() => {
      setElapsedTime(calculateElapsedTimeFromCreated(person.createdAt));
    }, 1000);

    return () => clearInterval(interval);
  }, [person?.createdAt]);

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
  }, [isOpen, person?.id]); // getCaseDetail 의존성 제거

  const handleReport = useCallback(() => {
    if (person) {
      navigate(`/report/${person.id}`);
    } else {
      console.error('person 정보가 없습니다');
    }
  }, [person, navigate]);

  const handleShare = useCallback(() => {
    if (!person) return;
    
    const locationText = person.point ? 
      `${person.point.lat.toFixed(4)}, ${person.point.lon.toFixed(4)}` : 
      '위치 정보 없음';
    
    const shareText = `${person.name} 실종자 정보\n상태: ${person.status === 'OPEN' ? '진행중' : '해제'}\n발생일: ${person.occurDate.substring(0, 4)}-${person.occurDate.substring(4, 6)}-${person.occurDate.substring(6, 8)}\n위치: ${locationText}\n경과시간: ${elapsedTime.formatted}`;
    
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
  }, [person, elapsedTime]);

  if (!person) {
    return null;
  }

  return (
    <ModalBase 
      isOpen={isOpen} 
      onClose={onClose}
      title="실종자 정보"
    >
      <div className="space-y-6">

        {/* 기본 정보 */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex gap-6">
            <div className="flex-shrink-0 w-28 h-32 bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col items-center justify-start p-3 rounded-lg">
              <div className="relative w-20 h-20">
                {(detailInfo?.photoUrl || person.photoUrl) ? (
                  <img 
                    src={detailInfo?.photoUrl || person.photoUrl} 
                    alt={person.name}
                    className="w-full h-full object-cover rounded-lg shadow-sm"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-200 rounded-lg">
                    <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
              {/* 경과시간 - 이미지 밑에 표시 */}
              <div className="mt-2 w-full text-center">
                <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-semibold text-gray-800 shadow-sm border border-white/50">
                  {elapsedTime.hours < 24 
                    ? elapsedTime.formatted 
                    : elapsedTime.hours < 168 
                      ? `${Math.floor(elapsedTime.hours / 24)}일 전`
                      : elapsedTime.hours < 720
                        ? `${Math.floor(elapsedTime.hours / 168)}주 전`
                        : elapsedTime.hours < 8760
                          ? `${Math.floor(elapsedTime.hours / 720)}개월 전`
                          : `${Math.floor(elapsedTime.hours / 8760)}년 전`
                  }
                </div>
              </div>
            </div>
            
            <div className="flex-1">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{person.name}</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">상태</span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      person.status === 'OPEN' 
                        ? 'bg-red-100 text-red-700' 
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {person.status === 'OPEN' ? '진행중' : '해제'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">나이</span>
                    <span className="font-medium">{detailInfo?.age || detailInfo?.ageNow || 'N/A'}세</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">성별</span>
                    <span className="font-medium">{detailInfo?.sexCode === '1' ? '남성' : detailInfo?.sexCode === '2' ? '여성' : 'N/A'}</span>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">발생일</span>
                    <span className="font-medium">{person.occurDate.substring(0, 4)}-{person.occurDate.substring(4, 6)}-{person.occurDate.substring(6, 8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">대상타입</span>
                    <span className="font-medium">{getTargetCodeLabel(detailInfo?.targetCode)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">발생장소</span>
                    <span className="text-right text-sm font-medium">{detailInfo?.occurAddress || 'N/A'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 상세 정보 - 컴팩트한 구조 */}
        <div className="bg-white border rounded-lg p-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">상세 정보</h3>
          
          <div className="grid grid-cols-3 gap-3">
            {/* 신체 정보 */}
            {detailInfo?.height && (
              <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">📏</span>
                  <span className="text-xs text-blue-600 font-medium">키</span>
                </div>
                <div className="text-sm font-semibold text-blue-800">{detailInfo.height}cm</div>
              </div>
            )}
            {detailInfo?.weight && (
              <div className="bg-blue-50 p-2 rounded border-l-2 border-blue-400">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">⚖️</span>
                  <span className="text-xs text-blue-600 font-medium">체중</span>
                </div>
                <div className="text-sm font-semibold text-blue-800">{detailInfo.weight}kg</div>
              </div>
            )}
            
            {/* 외모 정보 */}
            {detailInfo?.frmDscd && (
              <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">👤</span>
                  <span className="text-xs text-green-600 font-medium">체형</span>
                </div>
                <div className="text-sm font-semibold text-green-800">{detailInfo.frmDscd}</div>
              </div>
            )}
            {detailInfo?.faceshpeDscd && (
              <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">😊</span>
                  <span className="text-xs text-green-600 font-medium">얼굴형</span>
                </div>
                <div className="text-sm font-semibold text-green-800">{detailInfo.faceshpeDscd}</div>
              </div>
            )}
            {detailInfo?.hairshpeDscd && (
              <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">💇</span>
                  <span className="text-xs text-green-600 font-medium">머리형</span>
                </div>
                <div className="text-sm font-semibold text-green-800">{detailInfo.hairshpeDscd}</div>
              </div>
            )}
            {detailInfo?.haircolrDscd && (
              <div className="bg-green-50 p-2 rounded border-l-2 border-green-400">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">🎨</span>
                  <span className="text-xs text-green-600 font-medium">머리색</span>
                </div>
                <div className="text-sm font-semibold text-green-800">{detailInfo.haircolrDscd}</div>
              </div>
            )}
            
            {/* 복장 정보 */}
            {detailInfo?.alldressingDscd && detailInfo.alldressingDscd !== '불상' && (
              <div className="bg-purple-50 p-2 rounded border-l-2 border-purple-400 col-span-3">
                <div className="flex items-center gap-1 mb-1">
                  <span className="text-xs">👕</span>
                  <span className="text-xs text-purple-600 font-medium">복장</span>
                </div>
                <div className="text-sm font-semibold text-purple-800">{detailInfo.alldressingDscd}</div>
              </div>
            )}
          </div>
        </div>

        {/* AI 이미지와 이동 범위 - 데스크탑에서는 한 행에 배치 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* AI 예측 이미지 */}
          {detailInfo?.aiImageUrl && (
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="relative w-full h-80 bg-gray-50 flex items-center justify-center">
                <img 
                  src={detailInfo.aiImageUrl} 
                  alt={`${person.name} AI 예측 이미지`}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg width="400" height="320" xmlns="http://www.w3.org/2000/svg"><rect width="400" height="320" fill="#F3F4F6"/><text x="200" y="160" text-anchor="middle" fill="#6B7280" font-family="Arial" font-size="16">AI 이미지 로드 실패</text></svg>`)}`;
                  }}
                />
                <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  AI 예측
                </div>
              </div>
            </div>
          )}

          {/* 도보 이동 범위 지도 */}
          <div className="bg-white border rounded-lg overflow-hidden">
            <div className="w-full h-80">
              <WalkingRangeMap person={person} speedKmh={detailInfo?.speedKmh} />
            </div>
          </div>
        </div>


        {/* 로딩 상태 */}
        {isLoadingDetail && (
          <div className="bg-white border rounded-lg p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 mr-2"></div>
              <span className="text-sm text-gray-600">상세 정보를 불러오는 중...</span>
            </div>
          </div>
        )}

        {/* 액션 버튼들 */}
        <div className="flex gap-3 pt-4">
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
});

PersonInfoModal.displayName = 'PersonInfoModal';

export default PersonInfoModal;
