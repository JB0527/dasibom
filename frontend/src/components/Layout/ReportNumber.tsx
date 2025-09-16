import React from 'react';
import numberSvg from '../../assets/number.svg';

interface ReportNumberProps {
  description?: string;
}

const ReportNumber: React.FC<ReportNumberProps> = ({
  description = '실종자 신고번호는 경찰청 실종아동 찾기 센터'
}) => {
  return (
    <div className="p-4">
      <div className="bg-blue-50 border border-blue-500 rounded-lg p-4 text-center">
        <p className="text-2xl font-bold text-left text-blue-600 mb-2">
          {description}
        </p>
        <div className="flex justify-center">
          <img 
            src={numberSvg} 
            alt="실종자 신고번호 182" 
            className="h-40 w-auto"
          />
        </div>
      </div>
    </div>
  );
};

export default ReportNumber;
