// lib/speechInput.ts
// TOBIRA — Voice Input Engine
//
// Browser-native speech recognition via Web Speech API.
// No audio leaves the device. Transcription happens locally in the browser.
//
// Design rationale:
// Hikikomori users often find typed communication performative —
// composing words feels like performing composure.
// Voice input is rawer. Less edited. Closer to what's actually happening.
// Tobira accepts voice because presence means meeting people
// where they are, not where they're comfortable performing.
//
// Usage:
//   if (isSpeechInputAvailable()) {
//     startListening(transcript => setInput(transcript), () => setRecording(false));
//   }
//   stopListening(); // call on button release

// ============================================================
// BROWSER COMPATIBILITY
// Web Speech API is available in Chrome, Edge, and Safari.
// Firefox does not support it — voiceInputAvailable will be false.
// ============================================================

interface SpeechRecognitionInstance {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start(): void;
    stop(): void;
    abort(): void;
    onresult: ((e: SpeechRecognitionEvent) => void) | null;
    onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
    onend: (() => void) | null;
  }
  
  interface SpeechRecognitionEvent {
    results: SpeechRecognitionResultList;
  }
  
  interface SpeechRecognitionResultList {
    readonly length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
  }
  
  interface SpeechRecognitionResult {
    readonly isFinal: boolean;
    readonly length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
  }
  
  interface SpeechRecognitionAlternative {
    readonly transcript: string;
    readonly confidence: number;
  }
  
  interface SpeechRecognitionErrorEvent {
    readonly error: string;
    readonly message: string;
  }
  
  type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;
  
  function getSpeechRecognition(): SpeechRecognitionConstructor | null {
    if (typeof window === 'undefined') return null;
    const w = window as unknown as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  }
  
  // ============================================================
  // STATE
  // One recognition instance at a time.
  // ============================================================
  
  let _instance: SpeechRecognitionInstance | null = null;
  
  // ============================================================
  // PUBLIC API
  // ============================================================
  
  /**
   * Returns true if the browser supports speech recognition.
   * Call once on mount to decide whether to show the mic button.
   */
  export function isSpeechInputAvailable(): boolean {
    return getSpeechRecognition() !== null;
  }
  
  /**
   * Start listening. Calls onResult with the transcript when done.
   * Calls onEnd when recognition stops (whether result or not).
   * Call stopListening() to stop early (on button release).
   */
  export function startListening(
    onResult: (transcript: string) => void,
    onEnd: () => void,
  ): void {
    const SR = getSpeechRecognition();
    if (!SR) return;
  
    // Clean up any existing instance
    if (_instance) {
      _instance.abort();
      _instance = null;
    }
  
    const recognition = new SR();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';
  
    let finalTranscript = '';
  
    recognition.onresult = (e: SpeechRecognitionEvent) => {
      // Take the first final result
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript = e.results[i][0].transcript.trim();
          break;
        }
      }
    };
  
    recognition.onerror = (e: SpeechRecognitionErrorEvent) => {
      // 'no-speech' and 'aborted' are expected — not errors worth logging
      if (e.error !== 'no-speech' && e.error !== 'aborted') {
        console.warn('Speech recognition error:', e.error);
      }
      _instance = null;
      onEnd();
    };
  
    recognition.onend = () => {
      _instance = null;
      if (finalTranscript) {
        onResult(finalTranscript);
      }
      onEnd();
    };
  
    _instance = recognition;
    recognition.start();
  }
  
  /**
   * Stop listening early (called on button release).
   * Will trigger onEnd and onResult if speech was detected.
   */
  export function stopListening(): void {
    if (_instance) {
      _instance.stop();
      _instance = null;
    }
  }