import React from 'react';
import type { CertaintyOption } from '../../types/report';

interface CertaintySelectorProps {
  value: 'high' | 'medium' | 'low';
  onChange: (value: 'high' | 'medium' | 'low') => void;
  options: CertaintyOption[];
}

export const CertaintySelector: React.FC<CertaintySelectorProps> = ({
  value,
  onChange,
  options
}) => {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
            value === option.value
              ? `${option.color} border-current`
              : 'border-gray-200 hover:border-gray-300'
          }`}
        >
          <input
            type="radio"
            name="certainty"
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            className="sr-only"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium">{option.label}</span>
              <div className={`w-4 h-4 rounded-full border-2 ${
                value === option.value
                  ? 'border-current bg-current'
                  : 'border-gray-300'
              }`}>
                {value === option.value && (
                  <div className="w-2 h-2 bg-white rounded-full m-0.5" />
                )}
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-1">{option.description}</p>
          </div>
        </label>
      ))}
    </div>
  );
};