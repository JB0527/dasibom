// 신고 폼 컴포넌트
import React, { useState, useEffect, useRef } from 'react';
import { useMissingPersonReport } from '../../hooks/useMissingPersonReport';
import type { MissingPersonReportData, CertaintyOption } from '../../types/report';
import type { MissingPersonDetail, MissingPersonListItem } from '../../types/missingPerson';
import { useListMissingPerson } from '../../hooks/useOptimizedMissingPerson';

interface ReportFormProps {
  missingPerson: MissingPersonListItem | MissingPersonDetail;
  onSuccess: () => void;
  onCancel: () => void;
}

const certaintyOptions: CertaintyOption[] = [
  {
    value: 'UNSURE',
    label: '의심',
    description: '불확실하지만 비슷해 보입니다',
    color: 'text-blue-600 bg-blue-50 border-blue-200'
  },
  {
    value: 'LIKELY',
    label: '유력함',
    description: '아마도 본 것 같습니다',
    color: 'text-yellow-600 bg-yellow-50 border-yellow-200'
  },
  {
    value: 'CONFIRMED',
    label: '확신',
    description: '확실히 본 것 같습니다',
    color: 'text-red-600 bg-red-50 border-red-200'
  }
];


export const ReportForm: React.FC<ReportFormProps> = ({ 
  missingPerson, 
  onSuccess
}) => {
  const { submitMissingPersonReport, isSubmitting, error } = useMissingPersonReport();
  const { getCaseDetail } = useListMissingPerson();
  
  // 상세 정보 상태
  const [detailInfo, setDetailInfo] = useState<MissingPersonDetail | null>(null);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  
  const [formData, setFormData] = useState<Partial<MissingPersonReportData>>({
    caseId: missingPerson.id,
    certainty: 'LIKELY',
    location: '',
    description: '',
    reportedAt: new Date().toISOString(),
    attachmentUrl: '',
  });
  
  const [photos, setPhotos] = useState<File[]>([]);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // 신고자 정보 상태
  const [reporterInfo, setReporterInfo] = useState({
    name: '',
    carrier: '',
    phoneNumber: '',
    verificationCode: '',
    isVerified: false
  });

  // 인증번호 전송 상태
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  
  // 인증 모달 상태
  const [showAuthModal, setShowAuthModal] = useState(false);

  // 신고자 정보 핸들러
  const handleReporterInfoChange = (field: string, value: string) => {
    setReporterInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // 인증번호 전송 (목업)
  const handleSendVerificationCode = async () => {
    if (!reporterInfo.phoneNumber) {
      alert('휴대폰 번호를 입력해주세요.');
      return;
    }

    setIsSendingCode(true);
    
    // 목업: 2초 후 완료
    setTimeout(() => {
      setIsSendingCode(false);
      setCodeSent(true);
      alert('인증번호가 전송되었습니다.');
    }, 2000);
  };

  // 인증번호 확인 (목업)
  const handleVerifyCode = () => {
    // 목업: 아무 값이나 입력해도 통과
    if (reporterInfo.verificationCode) {
      setReporterInfo(prev => ({
        ...prev,
        isVerified: true
      }));
      alert('인증이 완료되었습니다.');
      setShowAuthModal(false);
    } else {
      alert('인증번호를 입력해주세요.');
    }
  };

  // 접수하기 버튼 클릭 핸들러
  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reporterInfo.isVerified) {
      setShowAuthModal(true);
      return;
    }
    
    // 인증이 완료된 경우 실제 제출
    handleSubmit(e);
  };

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

  const handleInputChange = (field: keyof MissingPersonReportData, value: string | number) => {
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
    
    if (!formData.location || !formData.description) {
      alert('필수 항목을 모두 입력해주세요.');
      return;
    }

    // 파일 검증
    if (photos.length > 0) {
      // 파일 크기 검증 (10MB 제한)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (photos[0].size > maxSize) {
        alert('파일 크기는 10MB를 초과할 수 없습니다.');
        return;
      }
      
      // 파일 타입 검증
      if (!photos[0].type.startsWith('image/')) {
        alert('이미지 파일만 업로드 가능합니다.');
        return;
      }
    }

    try {
      // FormData 생성하여 파일과 함께 전송
      const submitFormData = new FormData();
      
      // 기본 신고 데이터 추가
      submitFormData.append('caseId', missingPerson.id.toString());
      submitFormData.append('location', formData.location!);
      submitFormData.append('certainty', formData.certainty!);
      submitFormData.append('description', formData.description!);
      submitFormData.append('reportedAt', formData.reportedAt!);
      
      // 파일이 있으면 추가
      if (photos.length > 0) {
        submitFormData.append('attachment', photos[0]);
      }

      // submitMissingPersonReport 함수 사용
      const result = await submitMissingPersonReport(submitFormData);
      if (result) {
        onSuccess();
      }
    } catch (error) {
      console.error('실종접수 제출 실패:', error);
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
              제보시각 <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={formData.reportedAt ? new Date(formData.reportedAt).toISOString().slice(0, 16) : ''}
              onChange={(e) => handleInputChange('reportedAt', new Date(e.target.value).toISOString())}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              목격위치 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location || ''}
              onChange={(e) => handleInputChange('location', e.target.value)}
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
          <h3 className="text-lg font-semibold text-gray-900">사진 첨부</h3>
          
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
              📷 사진 첨부하기
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
            type="button"
            onClick={handleSubmitClick}
            disabled={isSubmitting}
            className="w-full px-4 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-semibold"
          >
            {isSubmitting ? '접수 중...' : '접수하기'}
          </button>
        </div>
      </form>

      {/* 인증 모달 */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">신고자 인증</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={reporterInfo.name}
                  onChange={(e) => handleReporterInfoChange('name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="이름을 입력하세요"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  통신사 <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleReporterInfoChange('carrier', 'SKT')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      reporterInfo.carrier === 'SKT'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 bg-red-500 rounded flex items-center justify-center text-white font-bold text-sm">
                        SK
                      </div>
                      <div className="text-sm font-medium">SKT</div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleReporterInfoChange('carrier', 'KT')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      reporterInfo.carrier === 'KT'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 bg-orange-500 rounded flex items-center justify-center text-white font-bold text-sm">
                        KT
                      </div>
                      <div className="text-sm font-medium">KT</div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleReporterInfoChange('carrier', 'LG U+')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      reporterInfo.carrier === 'LG U+'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 bg-pink-500 rounded flex items-center justify-center text-white font-bold text-sm">
                        LG
                      </div>
                      <div className="text-sm font-medium">LG U+</div>
                    </div>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => handleReporterInfoChange('carrier', '알뜰폰')}
                    className={`p-4 border-2 rounded-lg transition-colors ${
                      reporterInfo.carrier === '알뜰폰'
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-center">
                      <div className="w-8 h-8 mx-auto mb-2 bg-purple-500 rounded flex items-center justify-center text-white font-bold text-sm">
                        알
                      </div>
                      <div className="text-sm font-medium">알뜰폰</div>
                    </div>
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  휴대폰 번호 <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={reporterInfo.phoneNumber}
                    onChange={(e) => handleReporterInfoChange('phoneNumber', e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="010-1234-5678"
                  />
                  <button
                    type="button"
                    onClick={handleSendVerificationCode}
                    disabled={isSendingCode || !reporterInfo.phoneNumber}
                    className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSendingCode ? '전송 중...' : '인증번호 전송'}
                  </button>
                </div>
              </div>
              
              {codeSent && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    인증번호 <span className="text-red-500">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={reporterInfo.verificationCode}
                      onChange={(e) => handleReporterInfoChange('verificationCode', e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="인증번호를 입력하세요"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      disabled={!reporterInfo.verificationCode}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      인증 확인
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleVerifyCode}
                disabled={!reporterInfo.verificationCode}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                인증 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

