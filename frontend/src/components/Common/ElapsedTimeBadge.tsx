import React from 'react';
import type { TimeElapsed } from '../../utils/timeUtils';

interface ElapsedTimeBadgeProps {
  elapsedTime: TimeElapsed;
  variant?: 'default' | 'compact' | 'large';
  className?: string;
}

const ElapsedTimeBadge: React.FC<ElapsedTimeBadgeProps> = ({ 
  elapsedTime, 
  variant = 'default',
  className = ''
}) => {
  // 경과 시간에 따른 색상 결정
  const getTimeColor = () => {
    const hours = elapsedTime.hours;
    
    if (hours <= 6) {
      return 'bg-red-500 text-white border-red-600'; // 긴급 (6시간 이내)
    } else if (hours <= 24) {
      return 'bg-orange-500 text-white border-orange-600'; // 신고 (24시간 이내)
    } else if (hours <= 72) {
      return 'bg-yellow-500 text-white border-yellow-600'; // 장기 (3일 이내)
    } else {
      return 'bg-gray-500 text-white border-gray-600'; // 장기 (3일 초과)
    }
  };

  // 경과 시간에 따른 아이콘
  const getTimeIcon = () => {
    const hours = elapsedTime.hours;
    
    if (hours <= 6) {
      return '🚨'; // 긴급
    } else if (hours <= 24) {
      return '⚠️'; // 신고
    } else if (hours <= 72) {
      return '⏰'; // 장기
    } else {
      return '📅'; // 장기
    }
  };

  // 변형에 따른 스타일
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return 'text-xs px-2 py-1';
      case 'large':
        return 'text-sm px-3 py-2';
      default:
        return 'text-xs px-2.5 py-1.5';
    }
  };

  const timeColor = getTimeColor();
  const timeIcon = getTimeIcon();
  const variantStyles = getVariantStyles();

  return (
    <div 
      className={`
        inline-flex items-center gap-1.5 
        ${variantStyles}
        ${timeColor}
        rounded-full 
        font-mono font-semibold
        shadow-lg border-2
        transition-all duration-200
        hover:scale-105
        ${className}
      `}
    >
      <span className="text-xs">{timeIcon}</span>
      <span className="whitespace-nowrap">{elapsedTime.formatted}</span>
    </div>
  );
};

export default ElapsedTimeBadge;
