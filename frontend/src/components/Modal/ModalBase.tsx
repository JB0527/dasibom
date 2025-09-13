import React, { useEffect, useState, useRef, useCallback } from 'react';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const ModalBase: React.FC<ModalBaseProps> = ({ isOpen, onClose, children, title }) => {
  const [modalHeight, setModalHeight] = useState(40); // 기본 높이 40%
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
      // 모달 열릴 때 기본 높이로 리셋
      setModalHeight(40);
    } else {
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    }

    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setIsDragging(true);
    setStartY(e.touches[0].clientY);
    setStartHeight(modalHeight);
  }, [modalHeight]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setStartY(e.clientY);
    setStartHeight(modalHeight);
  }, [modalHeight]);

  const handleMove = useCallback((clientY: number) => {
    if (!isDragging) return;

    const deltaY = startY - clientY; // 위로 드래그하면 양수
    const newHeight = Math.max(20, Math.min(90, startHeight + (deltaY / window.innerHeight) * 100));
    setModalHeight(newHeight);
  }, [isDragging, startY, startHeight]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    handleMove(e.touches[0].clientY);
  }, [handleMove]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    handleMove(e.clientY);
  }, [handleMove]);

  const handleEnd = useCallback(() => {
    if (!isDragging) return;
    
    setIsDragging(false);
    
    // 드래그가 끝났을 때 스냅 포인트로 조정
    if (modalHeight < 30) {
      // 30% 미만이면 모달 닫기
      onClose();
    } else if (modalHeight < 50) {
      setModalHeight(40); // 기본 높이
    } else if (modalHeight < 70) {
      setModalHeight(60); // 중간 높이
    } else {
      setModalHeight(80); // 최대 높이
    }
  }, [isDragging, modalHeight, onClose]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleEnd);
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleEnd);
    }

    return () => {
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, [isDragging, handleTouchMove, handleMouseMove, handleEnd]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Desktop Modal */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4" onClick={onClose}>
        <div 
          className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {title && (
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <button
                onClick={onClose}
                className="flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-100 transition-colors"
                aria-label="뒤로가기"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h2 className="text-lg font-semibold flex-1 text-center mr-8">{title}</h2>
            </div>
          )}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Draggable Bottom Sheet */}
      <div className="md:hidden fixed inset-0 z-50">
        {/* Mobile Backdrop */}
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300"
          onClick={onClose}
        />
        
        <div 
          ref={modalRef}
          className="fixed left-0 right-0 bg-white rounded-t-lg shadow-xl overflow-hidden transition-all duration-200 ease-out"
          style={{ 
            height: `${modalHeight}vh`,
            bottom: 0,
            transform: isDragging ? 'none' : 'translateY(0)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag Handle */}
          <div 
            className="flex justify-center py-3 cursor-grab active:cursor-grabbing select-none"
            onTouchStart={handleTouchStart}
            onMouseDown={handleMouseDown}
          >
            <div className="w-10 h-1.5 bg-gray-400 rounded-full"></div>
          </div>
          
          {title && (
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
          )}
          
          <div className="p-4 overflow-y-auto" style={{ height: `calc(${modalHeight}vh - 60px)` }}>
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalBase;
