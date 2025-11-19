
import React, { useRef, useState } from 'react';
import { BACKGROUND_TRACKS } from '../constants';

interface BackgroundSelectorProps {
  selectedTrack: string;
  onSelect: (trackId: string) => void;
  onFileSelect: (file: File) => void;
  disabled?: boolean;
}

const BackgroundSelector: React.FC<BackgroundSelectorProps> = ({ selectedTrack, onSelect, onFileSelect, disabled }) => {
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
      onFileSelect(file);
    }
  };

  return (
    <div className="relative w-full group">
      <div className="relative">
        <select
          value={selectedTrack}
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
          {BACKGROUND_TRACKS.map((track) => (
            <option key={track.id} value={track.id} className="bg-gray-800 text-gray-200 py-1">
              {track.name}
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
      
      {/* Helper text for selected track type */}
      <div className="min-h-[20px] mt-2 px-1">
        {BACKGROUND_TRACKS.map(track => {
             if (track.id === selectedTrack) {
               if (track.id === 'none') return null;
               return (
                 <p key={track.id} className="text-xs text-gray-500 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block shadow-[0_0_5px_rgba(99,102,241,0.5)]"></span>
                    {track.type === 'synth' ? 'Real-time Generated Ambience' : 'Local File Upload'}
                 </p>
               )
             }
             return null;
        })}
      </div>

      {/* File Upload UI - Only visible when Custom is selected */}
      {selectedTrack === 'custom' && (
        <div className="mt-2 animate-fade-in-up">
          <label 
            className={`
              flex items-center justify-center w-full p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all duration-200
              ${fileName ? 'border-indigo-500 bg-indigo-500/10' : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'}
              ${disabled ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
             <div className="flex flex-col items-center gap-2">
               {fileName ? (
                 <>
                   <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                   </svg>
                   <span className="text-sm text-indigo-200 font-medium truncate max-w-[200px]">{fileName}</span>
                   <span className="text-xs text-indigo-400">Click to change</span>
                 </>
               ) : (
                 <>
                    <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-400 font-medium">Upload MP3 or WAV</span>
                 </>
               )}
             </div>
             <input 
               ref={fileInputRef}
               type="file" 
               accept="audio/*" 
               className="hidden" 
               onChange={handleFileChange}
               disabled={disabled}
             />
          </label>
        </div>
      )}
    </div>
  );
};

export default BackgroundSelector;
