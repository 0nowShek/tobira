'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  initVoice,
  speakWord,
  stopSpeaking,
  isVoiceAvailable,
  getVoicePreference,
  setVoicePreference,
  WordBuffer,
  getPauseDuration,
  sleep,
  type VoiceMode,
} from '@/lib/voice';

// ============================================================
// TOBIRA — Main Chat Interface
//
// DESIGN PHILOSOPHY:
// This UI was designed for people who have withdrawn from the world.
// Every decision traces back to hikikomori psychology:
//
// - Near-black background: mirrors the dimly lit rooms they inhabit.
//   Bright white UIs feel like fluorescent lights — aggressive, demanding.
//
// - No logo, no header, no navigation: removes the sense of being
//   inside a product. It should feel like a space, not an app.
//
// - Messages arrive gently from below: quiet arrival,
//   like a message slid under a door. Not a data stream.
//
// - Input at the bottom, always visible: the threshold is always there.
//   They never have to search for where to speak.
//
// - No send button visible by default: reduces the sense of
//   performance. Just press Enter. Or don't.
//
// - Tobira's responses are left-aligned, user messages right-aligned:
//   creates natural conversational distance without clinical bubble styling.
//
// - Thinking pause before responding: 1.5-2 seconds of silence.
//   Like someone actually considering before they speak.
//
// - Breathing cursor while thinking: pulses slowly instead of blinking.
//   Presence, not processing.
//
// - Screen fades in on load: the room comes into focus.
//   Not a page load. An arrival.
//
// - Voice streams word by word in sync with text:
//   not a screen reader. a presence.
// ============================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  arriving?: boolean; // true during fade-in animation
}

export default function TobiraChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false); // thinking pause state
  const [ollamaReady, setOllamaReady] = useState<boolean | null>(null);
  const [showForgetConfirm, setShowForgetConfirm] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false); // for screen wake fade-in

  // Voice state
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('off');
  const [voiceAvailable, setVoiceAvailable] = useState(false);
  const wordBufferRef = useRef(new WordBuffer());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionId = useRef<string>('');

  // ============================================================
  // PRESENCE IMPROVEMENT 4 — Screen wake on load
  // Fades in from black over 800ms.
  // The room comes into focus. Not a page load.
  // ============================================================
  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Initialize session + voice
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tobira_session');
      const sid = stored || crypto.randomUUID();
      if (!stored) localStorage.setItem('tobira_session', sid);
      sessionId.current = sid;

      // Voice initialization
      const available = isVoiceAvailable();
      setVoiceAvailable(available);
      if (available) {
        initVoice();
        const saved = getVoicePreference();
        setVoiceMode(saved);
      }
    }
    checkOllama();
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input
  useEffect(() => {
    if (ollamaReady) inputRef.current?.focus();
  }, [ollamaReady]);

  async function checkOllama() {
    try {
      const res = await fetch('/api/chat');
      const data = await res.json();
      setOllamaReady(data.running);
    } catch {
      setOllamaReady(false);
    }
  }

  function handleVoiceChange(mode: VoiceMode) {
    setVoiceMode(mode);
    setVoicePreference(mode);
    if (mode === 'off') stopSpeaking();
  }

  const sendWithMessages = useCallback(async (msgs: Message[]) => {

    // ============================================================
    // PRESENCE IMPROVEMENT 1 — Thinking pause
    // 1.2-2 seconds of silence before Tobira responds.
    // Variable — never exactly the same. Like a real person.
    // Shows as breathing cursor, not loading spinner.
    // ============================================================
    setIsThinking(true);
    const thinkingDelay = 1200 + Math.random() * 800;
    await sleep(thinkingDelay);
    setIsThinking(false);

    setIsGenerating(true);
    const assistantId = crypto.randomUUID();

    // ============================================================
    // PRESENCE IMPROVEMENT 3 — Message arrives from below
    // New messages start with arriving: true
    // CSS animation fades them in from 8px below
    // arriving flag removed after animation completes
    // ============================================================
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      arriving: true,
    }]);

    // Remove arriving flag after animation
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, arriving: false } : m)
      );
    }, 300);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgs.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp,
          })),
          sessionId: sessionId.current,
        }),
      });

      if (!response.ok || !response.body) {
        throw new Error('Failed to connect');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') break;
            try {
              const parsed = JSON.parse(data);
              if (parsed.token) {
                fullContent += parsed.token;
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId
                      ? { ...m, content: fullContent }
                      : m
                  )
                );

                // Voice — speak word by word as tokens arrive
                const word = wordBufferRef.current.add(parsed.token);
                if (word) {
                  const pause = getPauseDuration(word);
                  if (pause > 0) await sleep(pause);
                  speakWord(word, voiceMode);
                }
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }

      // Flush remaining word in buffer
      const remaining = wordBufferRef.current.flush();
      if (remaining) speakWord(remaining, voiceMode);
      wordBufferRef.current = new WordBuffer();

    } catch {
      setMessages(prev =>
        prev.map(m =>
          m.id === assistantId
            ? { ...m, content: '...' }
            : m
        )
      );
    } finally {
      setIsGenerating(false);
      inputRef.current?.focus();
    }
  }, [voiceMode]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || isGenerating || isThinking) return;

    // Stop any speech in progress
    stopSpeaking();
    wordBufferRef.current = new WordBuffer();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      arriving: true,
    };

    // Remove arriving flag after animation
    const userId = userMessage.id;
    setTimeout(() => {
      setMessages(prev =>
        prev.map(m => m.id === userId ? { ...m, arriving: false } : m)
      );
    }, 300);

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    await sendWithMessages(updatedMessages);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function handleMessageHoldStart(messageId: string) {
    holdTimerRef.current = setTimeout(() => {
      setShowForgetConfirm(messageId);
    }, 800);
  }

  function handleMessageHoldEnd() {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function forgetMessage(messageId: string) {
    setMessages(prev => prev.filter(m => m.id !== messageId));
    setShowForgetConfirm(null);
  }

  function startFresh() {
    setMessages([]);
    setShowSettings(false);
    stopSpeaking();
    wordBufferRef.current = new WordBuffer();
    if (typeof window !== 'undefined') {
      localStorage.removeItem('tobira_session');
      localStorage.removeItem('tobira_memory');
      const newId = crypto.randomUUID();
      sessionId.current = newId;
      localStorage.setItem('tobira_session', newId);
    }
    inputRef.current?.focus();
  }

  function copyFamilyLink() {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/family?for=${btoa(sessionId.current)}`;
      navigator.clipboard.writeText(link).catch(() => { });
    }
    setShowSettings(false);
  }

  // Voice toggle — cycles off → soft → quieter → off
  const nextVoiceMode = (): VoiceMode => {
    if (voiceMode === 'off') return 'soft';
    if (voiceMode === 'soft') return 'quieter';
    return 'off';
  };

  const voiceLabel = {
    off: 'voice  off',
    soft: 'voice  on',
    quieter: 'voice  quiet',
  }[voiceMode];

  // ============================================================
  // SETUP SCREEN
  // ============================================================
  if (ollamaReady === false) {
    return (
      <div style={styles.setupContainer}>
        <div style={styles.setupContent}>
          <p style={styles.setupTitle}>tobira needs one thing</p>
          <p style={styles.setupStep}>1. Install Ollama at ollama.ai</p>
          <p style={styles.setupStep}>2. Open terminal and run:</p>
          <code style={styles.setupCode}>ollama pull gemma2:2b</code>
          <p style={styles.setupStep}>3. Refresh this page</p>
          <button style={styles.setupRetry} onClick={checkOllama}>
            check again
          </button>
        </div>
      </div>
    );
  }

  // ============================================================
  // LOADING STATE
  // ============================================================
  if (ollamaReady === null) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.cursor} />
      </div>
    );
  }

  // ============================================================
  // MAIN CHAT INTERFACE
  // Screen wake: opacity transitions from 0 to 1 over 800ms
  // ============================================================
  return (
    <div style={{
      ...styles.container,
      opacity: mounted ? 1 : 0,
      transition: 'opacity 0.8s ease',
    }}>

      {/* Top bar — wordmark + settings */}
      <div style={styles.topBar}>
        <span style={styles.wordmark}>tobira</span>
        <button
          style={styles.menuButton}
          onClick={() => setShowSettings(!showSettings)}
        >
          ···
        </button>
      </div>

      {/* Settings drawer */}
      {showSettings && (
        <div style={styles.drawer}>
          {voiceAvailable && (
            <button
              style={{
                ...styles.drawerItem,
                color: voiceMode === 'off' ? '#2a2a2a' : '#555',
              }}
              onClick={() => handleVoiceChange(nextVoiceMode())}
            >
              {voiceLabel}
            </button>
          )}
          <div style={styles.drawerDivider} />
          <button style={styles.drawerItem} onClick={copyFamilyLink}>
            copy family link
          </button>
          <button style={styles.drawerItem} onClick={startFresh}>
            start fresh
          </button>
        </div>
      )}

      {/* Messages */}
      <div style={styles.messagesContainer}>
        {messages.length === 0 && (
          <div style={styles.emptyState} />
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            style={{
              ...styles.messageWrapper,
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              // PRESENCE IMPROVEMENT 3 — arrive from below
              opacity: message.arriving ? 0 : 1,
              transform: message.arriving ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.25s ease, transform 0.25s ease',
            }}
            onMouseDown={() => handleMessageHoldStart(message.id)}
            onMouseUp={handleMessageHoldEnd}
            onTouchStart={() => handleMessageHoldStart(message.id)}
            onTouchEnd={handleMessageHoldEnd}
          >
            {/* Forget confirmation */}
            {showForgetConfirm === message.id && (
              <div style={styles.forgetOverlay}>
                <button
                  style={styles.forgetButton}
                  onClick={() => forgetMessage(message.id)}
                >
                  forget this
                </button>
                <button
                  style={styles.cancelButton}
                  onClick={() => setShowForgetConfirm(null)}
                >
                  keep
                </button>
              </div>
            )}

            <div
              style={{
                ...styles.messageBubble,
                ...(message.role === 'user'
                  ? styles.userBubble
                  : styles.assistantBubble),
              }}
            >
              {message.content}
              {/* Blinking cursor while generating */}
              {isGenerating &&
                message.role === 'assistant' &&
                index === messages.length - 1 && (
                  <span style={styles.generatingCursor}>▋</span>
                )}
            </div>
          </div>
        ))}

        {/* PRESENCE IMPROVEMENT 2 — Breathing cursor while thinking */}
        {isThinking && (
          <div style={styles.thinkingRow}>
            <span style={styles.breathingCursor}>▋</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={styles.inputContainer}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          style={styles.input}
          rows={1}
          disabled={isGenerating || isThinking}
          placeholder=""
        />
        <p style={styles.inputHint}>enter ↵</p>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100dvh',
    width: '100%',
    maxWidth: '680px',
    margin: '0 auto',
    backgroundColor: '#0a0a0a',
    color: '#c8c8c8',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    fontSize: '15px',
    lineHeight: '1.7',
    position: 'relative',
    overflow: 'hidden',
  },

  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 20px 0',
    flexShrink: 0,
  },

  wordmark: {
    color: '#222',
    fontSize: '12px',
    letterSpacing: '0.15em',
    userSelect: 'none',
  },

  menuButton: {
    background: 'none',
    border: 'none',
    color: '#222',
    fontSize: '18px',
    cursor: 'pointer',
    padding: '4px 8px',
    fontFamily: 'inherit',
    letterSpacing: '0.15em',
    lineHeight: 1,
  },

  drawer: {
    position: 'absolute',
    top: '48px',
    right: '16px',
    backgroundColor: '#0f0f0f',
    border: '1px solid #1a1a1a',
    zIndex: 100,
    minWidth: '180px',
    display: 'flex',
    flexDirection: 'column',
  },

  drawerItem: {
    background: 'none',
    border: 'none',
    color: '#555',
    fontFamily: "'JetBrains Mono', monospace",
    fontSize: '12px',
    padding: '10px 20px',
    cursor: 'pointer',
    textAlign: 'left',
    letterSpacing: '0.04em',
    width: '100%',
    transition: 'color 0.3s ease',
  },

  drawerDivider: {
    height: '1px',
    backgroundColor: '#141414',
    margin: '4px 0',
  },

  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    scrollbarWidth: 'none',
  },

  emptyState: {
    flex: 1,
  },

  messageWrapper: {
    display: 'flex',
    width: '100%',
    position: 'relative',
    userSelect: 'text',
  },

  messageBubble: {
    maxWidth: '80%',
    lineHeight: '1.6',
    wordBreak: 'break-word',
    whiteSpace: 'pre-wrap',
    position: 'relative',
  },

  userBubble: {
    color: '#888',
    textAlign: 'right',
    fontSize: '14px',
  },

  assistantBubble: {
    color: '#d4d4d4',
    fontSize: '15px',
  },

  generatingCursor: {
    display: 'inline-block',
    marginLeft: '2px',
    // Standard blink while generating text
    animation: 'blink 1s step-end infinite',
    color: '#666',
  },

  // ============================================================
  // PRESENCE IMPROVEMENT 2 — Breathing cursor
  // Appears during the thinking pause — before text starts.
  // Pulses slowly. Like breathing. Like someone present.
  // CSS animation defined in globals.css
  // ============================================================
  thinkingRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    width: '100%',
  },

  breathingCursor: {
    display: 'inline-block',
    color: '#333',
    fontSize: '15px',
    // Slow pulse — breathing, not blinking
    // Animation defined in globals.css as 'breathe'
    animation: 'breathe 2s ease-in-out infinite',
  },

  inputContainer: {
    padding: '16px 20px 32px',
    borderTop: '1px solid #1a1a1a',
  },

  input: {
    width: '100%',
    background: 'none',
    border: 'none',
    borderBottom: '1px solid #2a2a2a',
    color: '#c8c8c8',
    fontFamily: 'inherit',
    fontSize: '15px',
    lineHeight: '1.6',
    padding: '8px 0',
    resize: 'none',
    outline: 'none',
    caretColor: '#666',
  },

  inputHint: {
    marginTop: '6px',
    color: '#1a1a1a',
    fontSize: '10px',
    letterSpacing: '0.1em',
    userSelect: 'none',
  },

  forgetOverlay: {
    position: 'absolute',
    top: '-40px',
    left: '0',
    display: 'flex',
    gap: '12px',
    zIndex: 10,
  },

  forgetButton: {
    background: '#1a1a1a',
    border: '1px solid #333',
    color: '#888',
    fontSize: '11px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.05em',
  },

  cancelButton: {
    background: 'none',
    border: '1px solid #222',
    color: '#555',
    fontSize: '11px',
    padding: '6px 12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    letterSpacing: '0.05em',
  },

  setupContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100dvh',
    backgroundColor: '#0a0a0a',
    color: '#666',
    fontFamily: "'JetBrains Mono', monospace",
  },

  setupContent: {
    maxWidth: '400px',
    padding: '40px 20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },

  setupTitle: {
    color: '#888',
    fontSize: '14px',
    marginBottom: '8px',
  },

  setupStep: {
    fontSize: '13px',
    color: '#555',
  },

  setupCode: {
    display: 'block',
    background: '#111',
    border: '1px solid #222',
    padding: '12px 16px',
    color: '#888',
    fontSize: '13px',
    letterSpacing: '0.02em',
  },

  setupRetry: {
    background: 'none',
    border: '1px solid #222',
    color: '#555',
    padding: '10px 20px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    fontSize: '12px',
    marginTop: '8px',
    letterSpacing: '0.05em',
    alignSelf: 'flex-start',
  },

  loadingContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100dvh',
    backgroundColor: '#0a0a0a',
  },

  cursor: {
    width: '2px',
    height: '20px',
    backgroundColor: '#333',
    animation: 'blink 1s step-end infinite',
  },
};
