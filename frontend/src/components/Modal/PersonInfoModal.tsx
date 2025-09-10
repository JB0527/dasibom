import React from 'react';
import ModalBase from './ModalBase';

interface MissingPerson {
  id: string;
  name: string;
  age: number;
  nationality: string;
  height: number;
  weight: number;
  build: string;
  faceShape: string;
  lastSeenDate: string;
  lastSeenLocation: string;
  imageUrl?: string;
  elapsedTime: string;
}

interface PersonInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  person: MissingPerson | null;
  onReport: () => void;
}

const PersonInfoModal: React.FC<PersonInfoModalProps> = ({ 
  isOpen, 
  onClose, 
  person, 
  onReport 
}) => {
  console.log('PersonInfoModal 렌더링:', { isOpen, person });

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
          <span className="text-red-500 font-semibold">{person.elapsedTime}</span>
        </div>

        {/* 기본 정보 */}
        <div className="flex gap-4">
          <div className="w-20 h-20 bg-gray-200 rounded-lg flex-shrink-0">
            {person.imageUrl ? (
              <img 
                src={person.imageUrl} 
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
              <span>{person.lastSeenDate}</span>
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

        {/* 신고 버튼 */}
        <button
          onClick={onReport}
          className="w-full bg-blue-500 text-white py-3 rounded-lg font-semibold hover:bg-blue-600 transition-colors"
        >
          신고하기
        </button>
      </div>
    </ModalBase>
  );
};

export default PersonInfoModal;
