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
        {/* 경과 시간 */}
        <div className="flex items-center justify-between p-4 bg-red-50 rounded-lg border border-red-200">
          <span className="text-sm text-red-700 font-medium">실종 후 경과시간</span>
          <ElapsedTimeBadge elapsedTime={elapsedTime} variant="large" />
        </div>

        {/* 기본 정보 */}
        <div className="flex gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-lg flex-shrink-0">
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
          
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">이름</span>
                  <span className="font-semibold text-lg">{person.name}</span>
                </div>
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
                  <span className="text-sm text-gray-500">사건상태</span>
                  <span className="font-medium">{detailInfo?.status === 'OPEN' ? '수색중' : '종료'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">발생장소</span>
                  <span className="text-right text-sm font-medium">{detailInfo?.occurAddress || 'N/A'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 신체 정보 */}
        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
          <h3 className="text-sm font-semibold text-blue-700 mb-3">신체 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex justify-between">
              <span className="text-sm text-blue-600">키</span>
              <span className="font-medium text-blue-800">
                {detailInfo?.height ? `${detailInfo.height}cm` : '정보 없음'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-blue-600">체중</span>
              <span className="font-medium text-blue-800">
                {detailInfo?.weight ? `${detailInfo.weight}kg` : '정보 없음'}
              </span>
            </div>
          </div>
        </div>

        {/* 외모 정보 */}
        {(detailInfo?.frmDscd || detailInfo?.faceshpeDscd || detailInfo?.hairshpeDscd || detailInfo?.haircolrDscd) && (
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-sm font-semibold text-green-700 mb-3">외모 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              {detailInfo?.frmDscd && (
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">체형</span>
                  <span className="font-medium text-green-800">{detailInfo.frmDscd}</span>
                </div>
              )}
              {detailInfo?.faceshpeDscd && (
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">얼굴형</span>
                  <span className="font-medium text-green-800">{detailInfo.faceshpeDscd}</span>
                </div>
              )}
              {detailInfo?.hairshpeDscd && (
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">머리형</span>
                  <span className="font-medium text-green-800">{detailInfo.hairshpeDscd}</span>
                </div>
              )}
              {detailInfo?.haircolrDscd && (
                <div className="flex justify-between">
                  <span className="text-sm text-green-600">머리색</span>
                  <span className="font-medium text-green-800">{detailInfo.haircolrDscd}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 복장 정보 */}
        {detailInfo?.alldressingDscd && detailInfo.alldressingDscd !== '불상' && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-sm font-semibold text-purple-700 mb-3">복장 정보</h3>
            <div className="flex justify-between">
              <span className="text-sm text-purple-600">복장</span>
              <span className="text-right text-sm font-medium text-purple-800">{detailInfo.alldressingDscd}</span>
            </div>
          </div>
        )}


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
              <span className="text-sm text-gray-500">상태</span>
              <span>{detailInfo.status === 'OPEN' ? '수색중' : '종료'}</span>
            </div>
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
});

PersonInfoModal.displayName = 'PersonInfoModal';

export default PersonInfoModal;
