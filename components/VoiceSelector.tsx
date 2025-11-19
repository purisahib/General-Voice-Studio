
import React from 'react';
import { VOICES } from '../constants';
import { VoiceName } from '../types';

interface VoiceSelectorProps {
  selectedVoice: VoiceName;
  onSelect: (voice: VoiceName) => void;
  customVoiceId: string;
  onCustomVoiceIdChange: (id: string) => void;
  disabled?: boolean;
}

const VoiceSelector: React.FC<VoiceSelectorProps> = ({ 
  selectedVoice, 
  onSelect, 
  customVoiceId,
  onCustomVoiceIdChange,
  disabled 
}) => {
  const currentVoice = VOICES.find(v => v.id === selectedVoice);

  return (
    <div className="w-full space-y-3">
      <div className="relative w-full group">
        <select
          value={selectedVoice}
          onChange={(e) => onSelect(e.target.value as VoiceName)}
          disabled={disabled}
          className={`
            w-full appearance-none bg-gray-900/50 border border-gray-700 
            text-gray-200 py-3 pl-4 pr-10 rounded-xl 
            focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 
            transition-all duration-200 font-medium text-sm shadow-sm
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-gray-600 hover:bg-gray-800/50'}
          `}
        >
          {VOICES.map((voice) => (
            <option key={voice.id} value={voice.id} className="bg-gray-800 text-gray-200">
              {voice.name} ({voice.gender})
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

      {/* Custom Voice ID Input */}
      {selectedVoice === VoiceName.Custom && (
        <div className="animate-fade-in-up">
           <input
             type="text"
             value={customVoiceId}
             onChange={(e) => onCustomVoiceIdChange(e.target.value)}
             placeholder="Enter Gemini Voice ID (e.g. 'Aoede')"
             disabled={disabled}
             className={`
               w-full bg-indigo-900/20 border border-indigo-500/50 
               text-indigo-200 placeholder-indigo-400/50 py-3 px-4 rounded-xl
               focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
               transition-all duration-200 text-sm font-mono
             `}
           />
           <p className="mt-1 text-[10px] text-gray-500 pl-1">
             Requires a valid Voice ID from the Gemini API documentation.
           </p>
        </div>
      )}

      {/* Description Info Box */}
      {currentVoice && selectedVoice !== VoiceName.Custom && (
        <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50 animate-fade-in">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold text-gray-300">{currentVoice.name}</span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${currentVoice.gender === 'Male' ? 'bg-blue-900/30 text-blue-300' : 'bg-pink-900/30 text-pink-300'}`}>
              {currentVoice.gender}
            </span>
          </div>
          <p className="text-xs text-gray-400 leading-relaxed">
            {currentVoice.description}
          </p>
        </div>
      )}
    </div>
  );
};

export default VoiceSelector;
