import React, { useEffect, useState } from 'react';

interface ModalBaseProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
}

const ModalBase: React.FC<ModalBaseProps> = ({ isOpen, onClose, children, title }) => {
  useEffect(() => {
    if (isOpen) {
      // 모달이 열릴 때 body 스크롤 방지
      document.body.style.overflow = 'hidden';
    } else {
      // 모달이 닫힐 때 body 스크롤 복원
      document.body.style.overflow = 'unset';
    }

    // 컴포넌트 언마운트 시 스크롤 복원
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Desktop Modal */}
      <div className="hidden md:flex fixed inset-0 z-50 items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[80vh] overflow-hidden">
          {title && (
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
          )}
          <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
            {children}
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet */}
      <div className="md:hidden fixed inset-0 z-50">
        <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-xl max-h-[80vh] overflow-hidden">
          {/* Drag Handle */}
          <div className="flex justify-center py-2">
            <div className="w-8 h-1 bg-gray-300 rounded-full"></div>
          </div>
          
          {title && (
            <div className="px-4 py-3 border-b border-gray-200">
              <h2 className="text-lg font-semibold">{title}</h2>
            </div>
          )}
          
          <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)]">
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default ModalBase;
