
import React from 'react';
import { LANGUAGES } from '../constants';

interface LanguageSelectorProps {
  selectedLanguage: string;
  onSelect: (code: string) => void;
  disabled?: boolean;
}

const LanguageSelector: React.FC<LanguageSelectorProps> = ({ selectedLanguage, onSelect, disabled }) => {
  return (
    <div className="relative w-full group">
      <select
        value={selectedLanguage}
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
        {LANGUAGES.map((lang) => (
          <option key={lang.code} value={lang.code} className="bg-gray-800 text-gray-200">
            {lang.flag} {lang.name}
          </option>
        ))}
      </select>
      
      {/* Custom Chevron Icon */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-400 group-hover:text-gray-300 transition-colors">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
};

export default LanguageSelector;
