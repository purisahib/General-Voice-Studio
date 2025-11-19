
import React, { useMemo } from 'react';
import { STYLES } from '../constants';

interface StyleSelectorProps {
  selectedStyle: string;
  onSelect: (styleId: string) => void;
  intensity: number;
  onIntensityChange: (value: number) => void;
  disabled?: boolean;
}

const StyleSelector: React.FC<StyleSelectorProps> = ({ 
  selectedStyle, 
  onSelect, 
  intensity, 
  onIntensityChange, 
  disabled 
}) => {

  // Group styles by category
  const groupedStyles = useMemo(() => {
    const groups: Record<string, typeof STYLES> = {};
    STYLES.forEach(style => {
      const category = style.category || 'Other';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(style);
    });
    return groups;
  }, []);

  return (
    <div className="w-full space-y-4">
      {/* Dropdown Selection */}
      <div className="relative w-full group">
        <select
          value={selectedStyle}
          onChange={(e) => onSelect(e.target.value)}
          disabled={disabled}
          className={`
            w-full appearance-none bg-gray-900/50 border border-gray-700 
            text-gray-200 py-3 pl-4 pr-10 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 
            transition-all duration-200 font-medium text-sm shadow-sm
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-600 hover:bg-gray-800/50'}
          `}
        >
          {Object.entries(groupedStyles).map(([category, styles]) => (
            <optgroup key={category} label={category} className="bg-gray-800 text-gray-400 font-bold">
              {styles.map((style) => (
                <option key={style.id} value={style.id} className="bg-gray-800 text-gray-200 font-normal">
                  {style.label}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
        
        {/* Custom Chevron Icon */}
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-hover:text-gray-300 transition-colors">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>

      {/* Intensity Slider */}
      <div className={`transition-all duration-300 ${selectedStyle === 'none' ? 'opacity-50 grayscale pointer-events-none' : 'opacity-100'}`}>
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Intensity</label>
          <span className="text-xs font-mono text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded">
            {intensity}%
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          value={intensity}
          onChange={(e) => onIntensityChange(Number(e.target.value))}
          disabled={disabled || selectedStyle === 'none'}
          className="
            w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
            accent-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50
          "
        />
        <div className="flex justify-between mt-1 text-[10px] text-gray-500 font-medium">
          <span>Subtle</span>
          <span>Moderate</span>
          <span>Extreme</span>
        </div>
      </div>
    </div>
  );
};

export default StyleSelector;
