// 신고 폼 컴포넌트
import React, { useState, useRef, useEffect } from 'react';
import { useReport } from '../../hooks/useReport';
import type { ReportFormData, CertaintyOption } from '../../types/report';
import type { MissingPersonDetail, MissingPersonListItem } from '../../types/missingPerson';
import { useListMissingPerson } from '../../hooks/useListMissingPerson';

interface ReportFormProps {
  missingPerson: MissingPersonListItem | MissingPersonDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

const certaintyOptions: CertaintyOption[] = [
  {
    value: 'low',
    label: '의심',
    description: '불확실하지만 비슷해 보입니다',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    value: 'medium',
    label: '유력함',
    description: '아마도 본 것 같습니다',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  },
  {
    value: 'high',
    label: '확신',
    description: '확실히 본 것 같습니다',
    color: 'text-red-600 bg-red-50 border-red-200'
  }
];


export const ReportForm: React.FC<ReportFormProps> = ({ 
  missingPerson, 
  onSuccess
}) => {
  const { submitReport, isSubmitting, error } = useReport();
  const { getCaseDetail } = useListMissingPerson();
  
  // 상세 정보 상태
  const [detailInfo, setDetailInfo] = useState<MissingPersonDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  const [formData, setFormData] = useState<Partial<ReportFormData>>({
    missingPersonId: missingPerson.id.toString(),
    certainty: 'medium',
    sightingDate: new Date().toISOString().split('T')[0],
    sightingTime: new Date().toTimeString().slice(0, 5),
  });
  
  const [photos, setPhotos] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // 컴포넌트 마운트 시 상세 정보 가져오기
  useEffect(() => {
    const loadDetailInfo = async () => {
      setIsLoadingDetail(true);
      try {
        const detail = await getCaseDetail(missingPerson.id);
        setDetailInfo(detail);
      } catch (error) {
        console.error('상세 정보 로드 실패:', error);
      } finally {
        setIsLoadingDetail(false);
      }
    };
    loadDetailInfo();
  }, [missingPerson.id, getCaseDetail]);

  const handleInputChange = (field: keyof ReportFormData, value: string | number) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileChange = (files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    setPhotos(prev => [...prev, ...fileArray]);
  };

  const removeFile = (index: number) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sightingLocation || !formData.description) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    const reportData: ReportFormData = {
      missingPersonId: missingPerson.id.toString(),
      reporterName: '익명', // 기본값
      reporterPhone: '000-0000-0000', // 기본값
      sightingDate: formData.sightingDate!,
      sightingTime: formData.sightingTime!,
      sightingLocation: formData.sightingLocation!,
      latitude: 0, // 기본값
      longitude: 0, // 기본값
      certainty: formData.certainty!,
      description: formData.description!,
      photos: photos.length > 0 ? photos : undefined,
    };

    const result = await submitReport(reportData);
    if (result) {
      onSuccess();
    }
  };


  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 bg-white rounded-lg shadow-sm">
      <div className="mb-6">
        <h1 className="text-xl md:text-2xl font-bold text-gray-900 mb-2">실종자 신고</h1>
        <p className="text-gray-600">아래 정보를 정확히 입력해주세요.</p>
      </div>

      {/* 실종자 정보 요약 */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6">
        <h3 className="font-semibold text-gray-900 mb-2">신고 대상 실종자</h3>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-200 rounded-lg flex-shrink-0">
            {(detailInfo?.photoUrl || missingPerson.photoUrl) ? (
              <img 
                src={detailInfo?.photoUrl || missingPerson.photoUrl} 
                alt={missingPerson.name}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          <div>
            <p className="font-semibold">
              {missingPerson.name}
              {detailInfo && (
                <span className="text-sm text-gray-500 font-normal ml-2">
                  ({detailInfo.age || detailInfo.ageNow || 'N/A'}세, {detailInfo.sexCode === '1' ? '남성' : detailInfo.sexCode === '2' ? '여성' : 'N/A'})
                </span>
              )}
            </p>
            <p className="text-sm text-gray-600">상태: {missingPerson.status === 'OPEN' ? '진행중' : '해제'}</p>
            <p className="text-sm text-gray-600">발생일: {missingPerson.occurDate.substring(0, 4)}-{missingPerson.occurDate.substring(4, 6)}-{missingPerson.occurDate.substring(6, 8)}</p>
            <p className="text-sm text-gray-600">발생장소: {detailInfo?.occurAddress || 'N/A'}</p>
            {detailInfo && (detailInfo.height || detailInfo.weight) && (
              <p className="text-sm text-gray-600">
                신체: {detailInfo.height ? `${detailInfo.height}cm` : ''}
                {detailInfo.height && detailInfo.weight ? ', ' : ''}
                {detailInfo.weight ? `${detailInfo.weight}kg` : ''}
              </p>
            )}
          </div>
        </div>
        {isLoadingDetail && (
          <div className="mt-2 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-xs text-gray-600">상세 정보를 불러오는 중...</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 확신정도 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">확신정도</h3>
          <div className="flex gap-4">
            {certaintyOptions.map((option) => (
              <label key={option.value} className="flex-1">
                <input
                  type="radio"
                  name="certainty"
                  value={option.value}
                  checked={formData.certainty === option.value}
                  onChange={(e) => handleInputChange('certainty', e.target.value)}
                  className="sr-only"
                />
                <div className={`p-3 rounded-lg border-2 cursor-pointer transition-colors ${
                  formData.certainty === option.value 
                    ? 'border-blue-500 bg-blue-50 text-blue-700' 
                    : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                }`}>
                  <div className="font-medium text-center">{option.label}</div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* 목격 정보 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">목격 정보</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              목격시각 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={`${formData.sightingDate || ''} ${formData.sightingTime || ''}`}
              onChange={(e) => {
                const [date, time] = e.target.value.split(' ');
                if (date) handleInputChange('sightingDate', date);
                if (time) handleInputChange('sightingTime', time);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 2024-01-15 14:30"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              목격위치 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.sightingLocation || ''}
              onChange={(e) => handleInputChange('sightingLocation', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 서울시 강남구 테헤란로 123"
              required
            />
          </div>
        </div>

        {/* 상세 설명 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">상세 설명</h3>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              목격 상황 설명 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.description || ''}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="목격한 상황을 자세히 설명해주세요..."
              required
            />
          </div>
        </div>

        {/* 파일 첨부 */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">사진</h3>
          
          <div>
            <input
              ref={photoInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileChange(e.target.files)}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => photoInputRef.current?.click()}
              className="w-full px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 transition-colors"
            >
              첨부하기
            </button>
            {photos.length > 0 && (
              <div className="mt-2 space-y-1">
                {photos.map((photo, index) => (
                  <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                    <span className="text-sm text-gray-700">{photo.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      삭제
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        {/* 접수 버튼 */}
        <div className="pt-6">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isSubmitting ? '접수 중...' : '접수하기'}
          </button>
        </div>
      </form>
    </div>
  );
};

