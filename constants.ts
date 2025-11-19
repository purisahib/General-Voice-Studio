
import { VoiceName, VoiceOption, LanguageOption, StyleOption, BackgroundTrack } from './types';

// Using the Flash TTS model as it is the currently supported model for TTS tasks.
export const MODEL_NAME = 'gemini-2.5-flash-preview-tts';

export const LANGUAGES: LanguageOption[] = [
  { code: 'en-US', name: 'English (US)', flag: '🇺🇸' },
  { code: 'en-GB', name: 'English (UK)', flag: '🇬🇧' },
  { code: 'en-IN', name: 'English (India)', flag: '🇮🇳' },
  { code: 'hi-IN', name: 'Hindi (India)', flag: '🇮🇳' },
  { code: 'es-ES', name: 'Spanish (Spain)', flag: '🇪🇸' },
  { code: 'fr-FR', name: 'French (France)', flag: '🇫🇷' },
  { code: 'ja-JP', name: 'Japanese (Japan)', flag: '🇯🇵' },
];

export const VOICES: VoiceOption[] = [
  {
    id: VoiceName.Puck,
    name: 'Rohan', // Mapped from Puck
    gender: 'Male',
    description: 'Soft, slightly raspy, articulate.',
  },
  {
    id: VoiceName.Charon,
    name: 'Vikram', // Mapped from Charon
    gender: 'Male',
    description: 'Deep, resonant, authoritative.',
  },
  {
    id: VoiceName.Kore,
    name: 'Meera', // Mapped from Kore
    gender: 'Female',
    description: 'Calm, soothing, clear.',
  },
  {
    id: VoiceName.Fenrir,
    name: 'Kabir', // Mapped from Fenrir
    gender: 'Male',
    description: 'Energetic, fast-paced, intense.',
  },
  {
    id: VoiceName.Zephyr,
    name: 'Aditi', // Mapped from Zephyr
    gender: 'Female',
    description: 'Bright, friendly, conversational.',
  },
  {
    id: VoiceName.Custom,
    name: 'Custom Voice ID',
    gender: 'Any',
    description: 'Enter a valid Gemini Voice ID manually.',
  },
];

export const STYLES: StyleOption[] = [
  { id: 'none', label: 'Natural (स्वाभाविक)', promptPrefix: '', category: 'General' },
  
  // Speaking Styles
  { id: 'narrative', label: 'Narrative (कथात्मक)', promptPrefix: 'Speak in a narrative storytelling style: ', category: 'Speaking Styles' },
  { id: 'conversational', label: 'Conversational (संवादात्मक)', promptPrefix: 'Speak in a natural conversational tone: ', category: 'Speaking Styles' },
  { id: 'pace', label: 'Pace (गति)', promptPrefix: 'Speak with a varied and engaging pace: ', category: 'Speaking Styles' },
  { id: 'pronunciation', label: 'Pronunciation (उच्चारण)', promptPrefix: 'Speak with very clear and precise pronunciation: ', category: 'Speaking Styles' },
  { id: 'accents', label: 'Accents (विशिष्ट)', promptPrefix: 'Speak with a distinct character accent: ', category: 'Speaking Styles' },
  { id: 'dialects', label: 'Dialects (लहजे)', promptPrefix: 'Speak with a regional dialect flair: ', category: 'Speaking Styles' },
  { id: 'pauses', label: 'Pauses (खामोशी)', promptPrefix: 'Speak with dramatic pauses for effect: ', category: 'Speaking Styles' },
  { id: 'gaps', label: 'Gaps (अंतराल)', promptPrefix: 'Speak with natural gaps between phrases: ', category: 'Speaking Styles' },

  // Positive Emotions
  { id: 'happy', label: 'Happy (खुश)', promptPrefix: 'Say happily: ', category: 'Positive Emotions' },
  { id: 'excited', label: 'Excited (उत्साहित)', promptPrefix: 'Say excitedly: ', category: 'Positive Emotions' },
  { id: 'joyful', label: 'Joyful (आनंदित)', promptPrefix: 'Speak with pure joy: ', category: 'Positive Emotions' },
  { id: 'surprised', label: 'Surprised (आश्चर्यचकित)', promptPrefix: 'Speak with surprise: ', category: 'Positive Emotions' },
  { id: 'hopeful', label: 'Hopeful (आशावान)', promptPrefix: 'Speak with a hopeful tone: ', category: 'Positive Emotions' },
  { id: 'calm', label: 'Calm (शांत)', promptPrefix: 'Speak calmly: ', category: 'Positive Emotions' },
  { id: 'satisfied', label: 'Satisfied (संतुष्ट)', promptPrefix: 'Speak with a satisfied tone: ', category: 'Positive Emotions' },
  { id: 'peaceful', label: 'Peaceful (शांतिपूर्ण)', promptPrefix: 'Speak peacefully: ', category: 'Positive Emotions' },

  // Negative/Complex Emotions
  { id: 'tired', label: 'Tired (थका हुआ)', promptPrefix: 'Speak in a tired voice: ', category: 'Negative/Complex Emotions' },
  { id: 'bored', label: 'Bored (ऊब गया)', promptPrefix: 'Speak in a bored tone: ', category: 'Negative/Complex Emotions' },
  { id: 'angry', label: 'Angry (गुस्सा)', promptPrefix: 'Say angrily: ', category: 'Negative/Complex Emotions' },
  { id: 'sad', label: 'Sad (उदास)', promptPrefix: 'Say sadly: ', category: 'Negative/Complex Emotions' },
  { id: 'scared', label: 'Scared (डरा हुआ)', promptPrefix: 'Speak in a scared voice: ', category: 'Negative/Complex Emotions' },
  { id: 'spooky_whisper', label: 'Spooky whisper (चुपके से फुसफुसाना)', promptPrefix: 'Whisper spookily: ', category: 'Negative/Complex Emotions' },
  { id: 'anxious', label: 'Anxious (चिंतित)', promptPrefix: 'Speak with anxiety: ', category: 'Negative/Complex Emotions' },
  { id: 'frustrated', label: 'Frustrated (निराश)', promptPrefix: 'Speak with frustration: ', category: 'Negative/Complex Emotions' },
];

export const BACKGROUND_TRACKS: BackgroundTrack[] = [
  { id: 'none', name: 'None', type: 'synth' },
  { id: 'custom', name: 'Custom Upload (MP3/WAV)', type: 'file' },
  { id: 'calm', name: 'Calm (Ambient Pad)', type: 'synth', synthType: 'calm' },
  { id: 'inspirational', name: 'Inspirational (Bright)', type: 'synth', synthType: 'inspirational' },
  { id: 'lofi', name: 'Focus (Lo-Fi Noise)', type: 'synth', synthType: 'lofi' },
];

export const SAMPLE_RATE = 24000;
export const DEFAULT_TEXT = "The universe is not only stranger than we suppose, but stranger than we can suppose.";
