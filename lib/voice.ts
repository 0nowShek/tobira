// lib/voice.ts
// TOBIRA — Voice Engine (ElevenLabs)
//
// Server-mediated TTS — API key never reaches the browser.
// Sentences accumulate as tokens stream in.
// Playback queues in arrival order.
// One presence. One voice.

export type VoiceMode = 'off' | 'soft' | 'quieter';

// ============================================================
// PREFERENCES
// ============================================================

export function getVoicePreference(): VoiceMode {
  if (typeof window === 'undefined') return 'off';
  const v = localStorage.getItem('tobira_voice');
  if (v === 'soft' || v === 'quieter' || v === 'off') return v;
  return 'off';
}

export function setVoicePreference(mode: VoiceMode): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('tobira_voice', mode);
}

// ============================================================
// CONFIGURATION CHECK
// Calls /api/tts to verify server has API key set.
// ============================================================

export async function checkTTSConfigured(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  try {
    const res = await fetch('/api/tts');
    if (!res.ok) return false;
    const data = await res.json() as { enabled?: boolean };
    return Boolean(data.enabled);
  } catch {
    return false;
  }
}

// ============================================================
// PLAYBACK STATE
// Module-level — one audio queue per page session.
// ============================================================

let _accumulator = '';
let _epoch = 0;
let _chain: Promise<void> = Promise.resolve();
let _audio: HTMLAudioElement | null = null;

function volumeFor(mode: VoiceMode): number {
  if (mode === 'off') return 0;
  return mode === 'quieter' ? 0.45 : 0.72;
}

// ============================================================
// SENTENCE DETECTION
// Finds the end of the first complete sentence in text.
// Returns the index of the final punctuation character, or null.
// ============================================================

function findSentenceEnd(text: string): number | null {
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === '?' || ch === '!' || ch === '…') return i;
    if (ch === '.') {
      let j = i;
      while (j < text.length && text[j] === '.') j++;
      const after = text[j];
      if (after === undefined || /\s/.test(after)) return j - 1;
    }
  }
  return null;
}

// ============================================================
// ENQUEUE SYNTHESIS
// Fetches audio for one sentence and appends to playback chain.
// Epoch check prevents stale audio from playing after stopTTS().
// ============================================================

function enqueue(text: string, mode: VoiceMode, epoch: number): void {
  if (mode === 'off' || !text.trim()) return;

  _chain = _chain.then(async () => {
    if (epoch !== _epoch) return;

    try {
      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: text.trim() }),
      });

      if (!res.ok || epoch !== _epoch) return;

      const blob = await res.blob();
      if (epoch !== _epoch) return;

      const url = URL.createObjectURL(blob);

      await new Promise<void>(resolve => {
        if (epoch !== _epoch) {
          URL.revokeObjectURL(url);
          resolve();
          return;
        }

        const el = new Audio();
        _audio = el;
        el.volume = volumeFor(mode);
        el.src = url;

        el.onended = () => {
          URL.revokeObjectURL(url);
          if (_audio === el) _audio = null;
          resolve();
        };
        el.onerror = () => {
          URL.revokeObjectURL(url);
          if (_audio === el) _audio = null;
          resolve();
        };

        void el.play().catch(() => {
          URL.revokeObjectURL(url);
          if (_audio === el) _audio = null;
          resolve();
        });
      });

    } catch {
      // Network glitch or aborted — continue chain
    }
  });
}

// ============================================================
// DRAIN ACCUMULATOR
// Pulls complete sentences from the accumulator and enqueues them.
// Leaves incomplete sentence fragment in accumulator.
// ============================================================

function drain(mode: VoiceMode): void {
  if (mode === 'off') {
    _accumulator = '';
    return;
  }

  const epoch = _epoch;
  let work = _accumulator;
  const sentences: string[] = [];

  while (work.length) {
    const end = findSentenceEnd(work);
    if (end === null) break;
    const phrase = work.slice(0, end + 1).trim();
    if (phrase) sentences.push(phrase);
    work = work.slice(end + 1).trimStart();
  }

  _accumulator = work;
  for (const s of sentences) enqueue(s, mode, epoch);
}

// ============================================================
// PUBLIC API
// ============================================================

/**
 * Feed a word token into the TTS engine.
 * Called for each word as it streams in from the model.
 * Sentences are synthesized as they complete.
 */
export function feedWord(word: string, mode: VoiceMode): void {
  if (mode === 'off' || !word.trim()) return;
  _accumulator += (_accumulator ? ' ' : '') + word.trim();
  drain(mode);
}

/**
 * Flush any remaining text in the accumulator.
 * Call after the model stream ends.
 */
export function flushVoice(mode: VoiceMode): void {
  if (mode === 'off') return;
  const rest = _accumulator.trim();
  _accumulator = '';
  if (rest) enqueue(rest, mode, _epoch);
}

/**
 * Stop all speech immediately.
 * Cancels in-flight requests and pauses current audio.
 */
export function stopVoice(): void {
  _epoch++;
  _accumulator = '';
  _chain = Promise.resolve();
  if (_audio) {
    _audio.pause();
    _audio.src = '';
    _audio.load();
    _audio = null;
  }
}

// ============================================================
// WORD BUFFER
// Accumulates streaming tokens into complete words.
// Returns a word when a boundary is detected.
// ============================================================

export class WordBuffer {
  private buffer = '';

  add(token: string): string | null {
    this.buffer += token;
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

  flush(): string | null {
    const word = this.buffer.trim();
    this.buffer = '';
    return word || null;
  }
}

// ============================================================
// PAUSE DURATIONS
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