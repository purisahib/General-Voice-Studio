
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { VoiceName, AudioState, ToastState } from './types';
import { DEFAULT_TEXT, SAMPLE_RATE, VOICES, LANGUAGES, STYLES, BACKGROUND_TRACKS } from './constants';
import { generateSpeech } from './services/geminiService';
import { decodeAudioData, decodeBase64, createWavBlob, generateSynthBackground, mixAudio, readFileToArrayBuffer } from './services/audioUtils';
import Header from './components/Header';
import VoiceSelector from './components/VoiceSelector';
import LanguageSelector from './components/LanguageSelector';
import StyleSelector from './components/StyleSelector';
import BackgroundSelector from './components/BackgroundSelector';
import Visualizer from './components/Visualizer';
import Toast from './components/Toast';

const App: React.FC = () => {
  const [text, setText] = useState(DEFAULT_TEXT);
  const [selectedVoice, setSelectedVoice] = useState<VoiceName>(VoiceName.Kore);
  const [customVoiceId, setCustomVoiceId] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en-US');
  const [selectedStyle, setSelectedStyle] = useState<string>('none');
  const [styleIntensity, setStyleIntensity] = useState<number>(50); // 0 to 100
  const [selectedBgMusic, setSelectedBgMusic] = useState<string>('none');
  const [customBgBuffer, setCustomBgBuffer] = useState<AudioBuffer | null>(null);
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    buffer: null,
  });
  const [toast, setToast] = useState<ToastState>({ message: '', type: 'info', visible: false });

  // Refs for audio context and scheduling
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  const showToast = (message: string, type: 'success' | 'error' | 'info') => {
    setToast({ message, type, visible: true });
    setTimeout(() => setToast(prev => ({ ...prev, visible: false })), 4000);
  };

  // Initialize Audio Context on user interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      audioContextRef.current = new AudioContextClass({ sampleRate: SAMPLE_RATE });
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
    }
  }, []);

  const handleFileSelect = async (file: File) => {
     initAudioContext();
     if (!audioContextRef.current) return;

     try {
       const arrayBuffer = await readFileToArrayBuffer(file);
       // Decode the file. Note: AudioContext.decodeAudioData works best with complete files.
       // We might need to resample if the file sample rate differs, but decodeAudioData handles that mostly.
       const decodedBuffer = await audioContextRef.current.decodeAudioData(arrayBuffer);
       setCustomBgBuffer(decodedBuffer);
       showToast(`Loaded music: ${file.name}`, 'success');
     } catch (e) {
       console.error("Error decoding custom file", e);
       showToast("Failed to load audio file. Please try a valid MP3 or WAV.", 'error');
       setCustomBgBuffer(null);
     }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      showToast("Please enter some text first.", 'error');
      return;
    }

    initAudioContext();
    stopPlayback(); // Stop current playback if any
    setIsGenerating(true);

    try {
      // 1. Construct the prompt with style instructions
      const styleOption = STYLES.find(s => s.id === selectedStyle);
      let promptText = text;

      if (styleOption && styleOption.promptPrefix) {
         // Apply intensity logic to the prompt
         let prefix = styleOption.promptPrefix;
         let instruction = "";

         if (styleIntensity > 80) {
           instruction = " (Intensity: Very High, Emphatic)";
         } else if (styleIntensity > 60) {
            instruction = " (Intensity: High)";
         } else if (styleIntensity < 20) {
            instruction = " (Intensity: Very Subtle)";
         } else if (styleIntensity < 40) {
            instruction = " (Intensity: Mild)";
         }

         // Combine prefix with instruction for the model
         // e.g., "Say cheerfully (Intensity: High): Hello"
         if (prefix.endsWith(": ")) {
            promptText = `${prefix.slice(0, -2)}${instruction}: "${text}"`;
         } else {
            promptText = `${prefix}${instruction} "${text}"`;
         }
      }

      // 2. Determine Voice Name
      let voiceToUse: string = selectedVoice;
      if (selectedVoice === VoiceName.Custom) {
        if (!customVoiceId.trim()) {
           throw new Error("Please enter a valid Custom Voice ID.");
        }
        voiceToUse = customVoiceId.trim();
      }

      // 3. Generate Speech
      const base64Audio = await generateSpeech(promptText, voiceToUse, selectedLanguage);

      if (!base64Audio) {
        throw new Error("No audio data received from API.");
      }

      const audioBytes = decodeBase64(base64Audio);
      
      if (!audioContextRef.current) return; 
      
      // 4. Decode Speech
      const speechBuffer = await decodeAudioData(
        audioBytes,
        audioContextRef.current,
        SAMPLE_RATE
      );

      let finalBuffer = speechBuffer;

      // 5. Mix Background Music if selected
      const bgTrack = BACKGROUND_TRACKS.find(t => t.id === selectedBgMusic);
      
      if (bgTrack && bgTrack.id !== 'none') {
        let musicBuffer: AudioBuffer | null = null;

        if (bgTrack.type === 'file') {
            if (!customBgBuffer) {
               showToast("Please upload a custom audio file first.", 'error');
               // We continue without bg music
            } else {
               musicBuffer = customBgBuffer;
            }
        } else if (bgTrack.synthType) {
            musicBuffer = await generateSynthBackground(
              audioContextRef.current,
              bgTrack.synthType,
              speechBuffer.duration
            );
        }

        if (musicBuffer) {
           // Mix with looping if needed
           finalBuffer = mixAudio(speechBuffer, musicBuffer, audioContextRef.current, 0.4);
        }
      }

      setAudioState({
        isPlaying: false,
        currentTime: 0,
        duration: finalBuffer.duration,
        buffer: finalBuffer,
      });

      showToast("Audio generated successfully!", 'success');
    } catch (error: any) {
      console.error(error);
      showToast(`${error.message || "Failed to generate speech"}`, 'error');
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = () => {
    if (!audioState.buffer || !audioContextRef.current || !analyserRef.current) return;

    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) { /* ignore */ }
    }

    const ctx = audioContextRef.current;
    const source = ctx.createBufferSource();
    source.buffer = audioState.buffer;
    
    source.connect(analyserRef.current);
    analyserRef.current.connect(ctx.destination);
    
    sourceRef.current = source;

    source.onended = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
      cancelAnimationFrame(animationFrameRef.current!);
    };

    source.start(0);
    startTimeRef.current = ctx.currentTime;
    
    setAudioState(prev => ({ ...prev, isPlaying: true }));
    updateProgress();
  };

  const stopPlayback = () => {
    if (sourceRef.current) {
      try {
        sourceRef.current.stop();
      } catch (e) { /* ignore */ }
      sourceRef.current = null;
    }
    setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }));
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
  };

  const togglePlayPause = () => {
    if (audioState.isPlaying) {
      stopPlayback();
    } else {
      playAudio();
    }
  };

  const updateProgress = () => {
    if (!audioContextRef.current || !audioState.isPlaying) return;
    
    const elapsed = audioContextRef.current.currentTime - startTimeRef.current;
    
    if (elapsed < audioState.duration) {
      setAudioState(prev => ({ ...prev, currentTime: elapsed }));
      animationFrameRef.current = requestAnimationFrame(updateProgress);
    }
  };

  const handleDownload = () => {
    if (!audioState.buffer) return;
    const wavBlob = createWavBlob(audioState.buffer);
    const url = URL.createObjectURL(wavBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gemini-speech-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 font-sans selection:bg-indigo-500/30">
      <Header />
      
      <main className="max-w-6xl mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Col: Controls */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Row 1: Language and Voice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <div className="bg-gray-800/30 border border-gray-700 p-5 rounded-3xl backdrop-blur-sm flex flex-col">
                <div className="flex justify-between items-center mb-3">
                   <h2 className="text-md font-semibold text-gray-200 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                    </svg>
                    Language
                  </h2>
                </div>
                <LanguageSelector 
                  selectedLanguage={selectedLanguage} 
                  onSelect={setSelectedLanguage} 
                  disabled={isGenerating || audioState.isPlaying}
                />
             </div>

             <div className="bg-gray-800/30 border border-gray-700 p-5 rounded-3xl backdrop-blur-sm flex flex-col">
               <div className="flex justify-between items-center mb-3">
                 <h2 className="text-md font-semibold text-gray-200 flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    Voice Persona
                 </h2>
               </div>
               <VoiceSelector 
                 selectedVoice={selectedVoice} 
                 onSelect={setSelectedVoice}
                 customVoiceId={customVoiceId}
                 onCustomVoiceIdChange={setCustomVoiceId}
                 disabled={isGenerating || audioState.isPlaying}
               />
             </div>
          </div>

          {/* Row 2: Text Input */}
          <div className="bg-gray-800/30 border border-gray-700 p-6 rounded-3xl backdrop-blur-sm flex flex-col min-h-[280px]">
            <div className="flex justify-between items-center mb-2">
               <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                Script
              </h2>
              <span className="text-xs text-gray-500">{text.length} chars</span>
            </div>
            <textarea
              className="flex-1 w-full bg-gray-900/50 border border-gray-700 rounded-xl p-4 text-lg leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all placeholder-gray-600"
              placeholder="Type something amazing here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              disabled={isGenerating}
            />
          </div>
          
          {/* Generate Button */}
           <button
             onClick={handleGenerate}
             disabled={isGenerating || !text.trim()}
             className={`
               w-full py-4 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-[0.99] flex items-center justify-center gap-3 text-lg
               ${isGenerating 
                 ? 'bg-gray-700 cursor-not-allowed' 
                 : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 hover:shadow-indigo-500/25'}
             `}
           >
             {isGenerating ? (
               <>
                 <svg className="animate-spin h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                   <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                   <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                 </svg>
                 Synthesizing Audio...
               </>
             ) : (
               <>
                 <span>Generate Speech</span>
                 <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                   <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                 </svg>
               </>
             )}
           </button>
        </div>

        {/* Right Col: Enhancements & Output */}
        <div className="lg:col-span-5 space-y-6">
           
           {/* Enhancements Box */}
           <div className="bg-gray-800/30 border border-gray-700 p-6 rounded-3xl backdrop-blur-sm">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>
                Enhancements
              </h3>
              
              <div className="mb-6">
                 <label className="text-sm text-gray-300 mb-2 block">Style & Emotion</label>
                 <StyleSelector 
                    selectedStyle={selectedStyle} 
                    onSelect={setSelectedStyle} 
                    intensity={styleIntensity}
                    onIntensityChange={setStyleIntensity}
                    disabled={isGenerating || audioState.isPlaying} 
                 />
              </div>

              <div>
                 <label className="text-sm text-gray-300 mb-2 block">Background Ambience</label>
                 <BackgroundSelector 
                    selectedTrack={selectedBgMusic} 
                    onSelect={setSelectedBgMusic} 
                    onFileSelect={handleFileSelect}
                    disabled={isGenerating || audioState.isPlaying} 
                 />
              </div>
           </div>

           {/* Player Box */}
           <div className="bg-gray-800/30 border border-gray-700 p-6 rounded-3xl backdrop-blur-sm h-[340px] flex flex-col">
             <div className="flex justify-between items-center mb-6">
               <h2 className="text-lg font-semibold text-gray-200 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                Preview
              </h2>
              {audioState.buffer && (
                <span className="text-xs bg-green-900/30 text-green-400 px-2 py-1 rounded-full border border-green-800 animate-pulse">
                  Ready
                </span>
              )}
             </div>

             {/* Visualizer Container */}
             <div className="flex-1 bg-black/40 rounded-2xl border border-gray-800 overflow-hidden relative mb-6">
               <Visualizer analyser={analyserRef.current} isPlaying={audioState.isPlaying} />
               {!audioState.buffer && !isGenerating && (
                 <div className="absolute inset-0 flex items-center justify-center text-gray-600 text-sm">
                   Waiting for audio...
                 </div>
               )}
             </div>

             {/* Controls */}
             <div className="space-y-4">
               {/* Progress Bar */}
               <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                 <div 
                    className="bg-indigo-500 h-full transition-all duration-100 ease-linear"
                    style={{ width: `${audioState.duration > 0 ? (audioState.currentTime / audioState.duration) * 100 : 0}%` }}
                 />
               </div>
               <div className="flex justify-between text-xs text-gray-400 font-mono">
                 <span>{audioState.currentTime.toFixed(2)}s</span>
                 <span>{audioState.duration.toFixed(2)}s</span>
               </div>

               <div className="flex gap-3 pt-1">
                 <button
                   onClick={togglePlayPause}
                   disabled={!audioState.buffer}
                   className="flex-1 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-xl font-bold transition-colors flex justify-center items-center gap-2"
                 >
                   {audioState.isPlaying ? (
                     <>
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       Pause
                     </>
                   ) : (
                     <>
                       <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                       Play
                     </>
                   )}
                 </button>
                 
                 <button
                   onClick={handleDownload}
                   disabled={!audioState.buffer}
                   className="bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white p-3 rounded-xl transition-colors"
                   title="Download WAV"
                 >
                   <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                   </svg>
                 </button>
               </div>
             </div>
           </div>
        </div>

      </main>

      <Toast 
        message={toast.message} 
        type={toast.type} 
        visible={toast.visible} 
        onClose={() => setToast(prev => ({...prev, visible: false}))} 
      />
    </div>
  );
};

export default App;
