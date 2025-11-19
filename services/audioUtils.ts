
/**
 * Decodes a base64 string into a Uint8Array of bytes.
 */
export function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Decodes raw PCM audio data (Int16) into an AudioBuffer.
 */
export async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number = 1,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      // Convert Int16 (-32768 to 32767) to Float32 (-1.0 to 1.0)
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

/**
 * Reads a File object into an ArrayBuffer.
 */
export async function readFileToArrayBuffer(file: File): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(reader.result);
      } else {
        reject(new Error("Failed to read file"));
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

/**
 * Generates a synthetic background track using Web Audio API.
 * This avoids external file dependencies and CORS issues.
 */
export async function generateSynthBackground(
  ctx: AudioContext,
  type: 'calm' | 'inspirational' | 'lofi',
  duration: number
): Promise<AudioBuffer> {
  // Use OfflineAudioContext to render faster than real-time
  const offlineCtx = new OfflineAudioContext(2, ctx.sampleRate * duration, ctx.sampleRate);
  
  const mainGain = offlineCtx.createGain();
  mainGain.connect(offlineCtx.destination);
  
  // Fade in/out envelope
  mainGain.gain.setValueAtTime(0, 0);
  mainGain.gain.linearRampToValueAtTime(0.2, 0.5); // Fade in
  mainGain.gain.setValueAtTime(0.2, duration - 1.5);
  mainGain.gain.linearRampToValueAtTime(0, duration); // Fade out

  if (type === 'calm' || type === 'inspirational') {
     const osc1 = offlineCtx.createOscillator();
     const osc2 = offlineCtx.createOscillator();
     const osc3 = offlineCtx.createOscillator();
     
     osc1.type = 'sine';
     osc2.type = 'sine';
     osc3.type = 'triangle';

     // F3 Major chord (F3, A3, C4) or C3
     const root = type === 'calm' ? 130.81 : 174.61; 
     osc1.frequency.value = root;
     osc2.frequency.value = root * 1.25; // Major 3rd
     osc3.frequency.value = root * 1.5;  // Perfect 5th

     // Detune for thickness
     osc1.detune.value = -8;
     osc2.detune.value = 8;

     osc1.connect(mainGain);
     osc2.connect(mainGain);
     osc3.connect(mainGain);

     osc1.start(0);
     osc2.start(0);
     osc3.start(0);
  } else if (type === 'lofi') {
      // Brown/Pinkish noise simulation
      const bufferSize = offlineCtx.sampleRate * duration;
      const buffer = offlineCtx.createBuffer(1, bufferSize, offlineCtx.sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          data[i] = (lastOut + (0.02 * white)) / 1.02;
          lastOut = data[i];
          data[i] *= 3.5; 
      }

      const noiseSrc = offlineCtx.createBufferSource();
      noiseSrc.buffer = buffer;
      
      const filter = offlineCtx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 400;
      
      noiseSrc.connect(filter);
      filter.connect(mainGain);
      noiseSrc.start(0);
  }

  return await offlineCtx.startRendering();
}

/**
 * Mixes two AudioBuffers together.
 * Loops the overlay if it's shorter than base.
 */
export function mixAudio(
  base: AudioBuffer,
  overlay: AudioBuffer,
  ctx: AudioContext,
  overlayVolume: number = 0.5
): AudioBuffer {
  const channels = base.numberOfChannels;
  const length = base.length;
  const mixed = ctx.createBuffer(channels, length, base.sampleRate);

  for (let i = 0; i < channels; i++) {
    const baseData = base.getChannelData(i);
    // If overlay is mono, duplicate it for stereo mix if needed
    const overlayData = overlay.numberOfChannels > i ? overlay.getChannelData(i) : overlay.getChannelData(0);
    const mixedData = mixed.getChannelData(i);
    
    for (let j = 0; j < length; j++) {
      // Loop the overlay track if it's shorter than the base
      const overlaySample = overlayData[j % overlay.length];
      mixedData[j] = baseData[j] + (overlaySample * overlayVolume);
    }
  }
  return mixed;
}


/**
 * Wraps raw PCM data with a WAV header to create a downloadable Blob.
 */
export function createWavBlob(audioBuffer: AudioBuffer): Blob {
  const numOfChan = audioBuffer.numberOfChannels;
  const length = audioBuffer.length * numOfChan * 2 + 44;
  const buffer = new ArrayBuffer(length);
  const view = new DataView(buffer);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  // Write WAV Header
  setUint32(0x46464952); // "RIFF"
  setUint32(length - 8); // file length - 8
  setUint32(0x45564157); // "WAVE"

  setUint32(0x20746d66); // "fmt " chunk
  setUint32(16); // length = 16
  setUint16(1); // PCM (uncompressed)
  setUint16(numOfChan);
  setUint32(audioBuffer.sampleRate);
  setUint32(audioBuffer.sampleRate * 2 * numOfChan); // avg. bytes/sec
  setUint16(numOfChan * 2); // block-align
  setUint16(16); // 16-bit (hardcoded in this example)

  setUint32(0x61746164); // "data" - chunk
  setUint32(length - pos - 4); // chunk length

  // Interleave channels
  for (i = 0; i < audioBuffer.numberOfChannels; i++)
    channels.push(audioBuffer.getChannelData(i));

  while (pos < audioBuffer.length) {
    for (i = 0; i < numOfChan; i++) {
      // clamp
      sample = Math.max(-1, Math.min(1, channels[i][pos]));
      // scale to 16-bit signed int
      sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767) | 0;
      view.setInt16(44 + offset, sample, true);
      offset += 2;
    }
    pos++;
  }

  return new Blob([buffer], { type: 'audio/wav' });

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }
}
