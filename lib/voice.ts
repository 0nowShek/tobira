// lib/voice.ts
// TOBIRA — Voice Engine
//
// Speaks Tobira's responses word by word as they stream in.
// Not text-to-speech after the fact.
// Word by word. In sync with text appearing on screen.
// That's the difference between a screen reader and a presence.

// ============================================================
// VOICE PREFERENCES
// Stored in localStorage. User controls this.
// ============================================================

export type VoiceMode = 'off' | 'soft' | 'quieter';

export function getVoicePreference(): VoiceMode {
  if (typeof window === 'undefined') return 'off';
  return (localStorage.getItem('tobira_voice') as VoiceMode) || 'off';
}

export function setVoicePreference(mode: VoiceMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tobira_voice', mode);
}

// ============================================================
// VOICE SELECTOR
// Finds the best available voice for Tobira.
// Priority order — warmest voices first.
// ============================================================

const PREFERRED_VOICES = [
  'Samantha',        // Mac/iOS — warm, calm
  'Karen',           // Mac — slightly lower
  'Moira',           // Mac — Irish, gentle
  'Microsoft Zira',  // Windows — cleaner than default
  'Google US English', // Chrome
];

let selectedVoice: SpeechSynthesisVoice | null = null;

export function initVoice(): void {
  if (typeof window === 'undefined') return;
  if (!window.speechSynthesis) return;

  const setVoice = () => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;

    // Try preferred voices first
    for (const name of PREFERRED_VOICES) {
      const match = voices.find(v => v.name.includes(name));
      if (match) {
        selectedVoice = match;
        return;
      }
    }

    // Fallback — first English voice
    const english = voices.find(v => v.lang.startsWith('en'));
    selectedVoice = english || voices[0];
  };

  // Voices load asynchronously in some browsers
  if (window.speechSynthesis.getVoices().length > 0) {
    setVoice();
  } else {
    window.speechSynthesis.onvoiceschanged = setVoice;
  }
}

// ============================================================
// SPEAK WORD
// Called for each word as it streams in.
// Handles pauses after punctuation.
// ============================================================

export function speakWord(word: string, mode: VoiceMode): void {
  if (mode === 'off') return;
  if (typeof window === 'undefined') return;
  if (!window.speechSynthesis) return;
  if (!word.trim()) return;

  const utterance = new SpeechSynthesisUtterance(word);

  // Voice settings
  if (selectedVoice) utterance.voice = selectedVoice;
  utterance.rate = 0.88;                           // Slightly slower — unhurried
  utterance.pitch = 0.92;                          // Slightly lower — calm
  utterance.volume = mode === 'quieter' ? 0.5 : 0.8;

  window.speechSynthesis.speak(utterance);
}

// ============================================================
// WORD BUFFER
// Accumulates tokens until a complete word is ready.
// Returns the word to speak and resets the buffer.
// ============================================================

export class WordBuffer {
  private buffer: string = '';

  add(token: string): string | null {
    this.buffer += token;

    // Complete word detected — space, punctuation, or end
    if (
      this.buffer.endsWith(' ') ||
      this.buffer.endsWith('\n') ||
      this.buffer.match(/[.?!,;:…]$/)
    ) {
      const word = this.buffer.trim();
      this.buffer = '';
      return word || null;
    }

    return null;
  }

  // Flush remaining buffer at end of stream
  flush(): string | null {
    const word = this.buffer.trim();
    this.buffer = '';
    return word || null;
  }
}

// ============================================================
// PAUSE LOGIC
// Natural pauses after punctuation.
// Makes Tobira sound like it means what it says.
// ============================================================

export function getPauseDuration(word: string): number {
  if (word.endsWith('...') || word.endsWith('…')) return 500;
  if (word.endsWith('.')) return 250;
  if (word.endsWith('?')) return 300;
  if (word.endsWith('!')) return 250;
  if (word.endsWith(',')) return 120;
  if (word.endsWith(';') || word.endsWith(':')) return 150;
  return 0;
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================
// STOP SPEAKING
// Called when user sends a new message or toggles voice off.
// Cancels any in-progress speech immediately.
// ============================================================

export function stopSpeaking(): void {
  if (typeof window === 'undefined') return;
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
}

// ============================================================
// VOICE AVAILABLE CHECK
// Some browsers don't support Web Speech API.
// ============================================================

export function isVoiceAvailable(): boolean {
  if (typeof window === 'undefined') return false;
  return 'speechSynthesis' in window;
}