
export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
  Custom = 'custom',
}

export interface VoiceOption {
  id: VoiceName;
  name: string;
  gender: 'Male' | 'Female' | 'Any';
  description: string;
}

export interface LanguageOption {
  code: string;
  name: string;
  flag: string;
}

export interface StyleOption {
  id: string;
  label: string;
  promptPrefix: string;
  category?: string;
}

export interface BackgroundTrack {
  id: string;
  name: string;
  type: 'synth' | 'file';
  synthType?: 'calm' | 'inspirational' | 'lofi';
}

export interface AudioState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  buffer: AudioBuffer | null;
}

export interface ToastState {
  message: string;
  type: 'success' | 'error' | 'info';
  visible: boolean;
}
