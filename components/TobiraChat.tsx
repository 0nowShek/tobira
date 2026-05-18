'use client';

// components/TobiraChat.tsx
// TOBIRA — Main Chat Interface
//
// Multimodal input:  text · voice · images
// Multimodal output: text · ElevenLabs TTS
// Memory:            AES-256 encrypted local storage across sessions
// Privacy:           nothing leaves the device except ElevenLabs TTS calls
//
// DESIGN PHILOSOPHY:
// Built for people who have withdrawn from the world.
// Every decision traces back to hikikomori psychology.
//
// Near-black background: mirrors the dimly lit rooms they inhabit.
// No navigation: removes the sense of being inside a product.
// Messages arrive from below: like a note slid under a door.
// Thinking pause before responding: like someone actually considering.
// Breathing cursor while thinking: presence, not processing.
// Screen fades in on load: an arrival, not a page load.
// Voice output speaks word by word: a presence, not a screen reader.
// Voice input accepts the unedited: rawer than typed words.
// Image input sees the space: for when words aren't enough.

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  checkTTSConfigured,
  getVoicePreference,
  setVoicePreference,
  feedWord,
  flushVoice,
  stopVoice,
  WordBuffer,
  getPauseDuration,
  sleep,
  type VoiceMode,
} from '@/lib/voice';
import {
  isSpeechInputAvailable,
  startListening,
  stopListening,
} from '@/lib/speechInput';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  arriving?: boolean;
  images?: string[];
}

export default function TobiraChat() {
  const router = useRouter();

  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [ollamaReady, setOllamaReady] = useState<boolean | null>(null);
  const [mounted, setMounted] = useState(false);

  // UI state
  const [showForgetConfirm, setShowForgetConfirm] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [pendingImage, setPendingImage] = useState<string | null>(null);

  // Voice output state (ElevenLabs TTS)
  const [voiceMode, setVoiceMode] = useState<VoiceMode>('off');
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  // Voice input state (Web Speech API)
  const [isRecording, setIsRecording] = useState(false);
  const [voiceInputAvailable, setVoiceInputAvailable] = useState(false);

  // Family bridge — dot when someone left a message; panel to read original or summary
  const [hasFamily, setHasFamily] = useState(false);
const [showFamilyNotice, setShowFamilyNotice] = useState(false);
const [familyNoticeCount, setFamilyNoticeCount] = useState(0);
const [familyMessages, setFamilyMessages] = useState<Array<{
  id: string;
  from: string;
  content: string;
  timestamp: number;
}>>([]);const [familyViewMode, setFamilyViewMode] = useState<'choice' | 'original' | 'summary' | 'loading'>('choice');
const [familySummary, setFamilySummary] = useState('');

  // Refs
  const wordBufferRef = useRef(new WordBuffer());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sessionId = useRef<string>('');

  // Keep voiceMode ref in sync so streaming callbacks always see current value
  const voiceModeRef = useRef<VoiceMode>('off');
  useEffect(() => { voiceModeRef.current = voiceMode; }, [voiceMode]);

  // Screen fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(t);
  }, []);

  // Session + capability initialization
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Restore or create session ID
    const stored = localStorage.getItem('tobira_session');
    const sid = stored ?? crypto.randomUUID();
    if (!stored) localStorage.setItem('tobira_session', sid);
    sessionId.current = sid;

    // Check ElevenLabs TTS availability
    checkTTSConfigured().then(configured => {
      setVoiceAvailable(configured);
      if (configured) {
        const saved = getVoicePreference();
        setVoiceMode(saved);
        voiceModeRef.current = saved;
      }
    });

    // Check voice input availability
    setVoiceInputAvailable(isSpeechInputAvailable());

    checkOllama();
  }, []);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when Ollama is ready
  useEffect(() => {
    if (ollamaReady) setTimeout(() => inputRef.current?.focus(), 100);
  }, [ollamaReady]);

  // ============================================================
  // OLLAMA HEALTH CHECK
  // ============================================================

  async function checkOllama() {
    try {
      const sid = typeof window !== 'undefined'
        ? localStorage.getItem('tobira_session') || ''
        : '';
      const url = sid ? `/api/chat?session=${encodeURIComponent(sid)}` : '/api/chat';
      const res = await fetch(url);
      const data = await res.json() as {
        running: boolean;
        family?: { hasNew: boolean; count: number; hasUnsent: boolean };
      };
      setOllamaReady(data.running);
      if (data.family?.hasNew) {
        setHasFamily(true);
        setFamilyNoticeCount(data.family.count);
      }
    } catch {
      setOllamaReady(false);
    }
  }

  // ============================================================
  // VOICE OUTPUT
  // ============================================================

  function handleVoiceChange(mode: VoiceMode) {
    setVoiceMode(mode);
    voiceModeRef.current = mode;
    setVoicePreference(mode);
    if (mode === 'off') stopVoice();
  }

  const nextVoiceMode = (): VoiceMode => {
    if (voiceMode === 'off') return 'soft';
    if (voiceMode === 'soft') return 'quieter';
    return 'off';
  };

  // ============================================================
  // VOICE INPUT
  // Hold mic button to record. Release to transcribe and send.
  // No audio leaves the device — transcription is browser-native.
  // ============================================================

  function handleMicStart() {
    if (isGenerating || isThinking || isRecording) return;

    setIsRecording(true);

    startListening(
      (transcript) => {
        // Transcript received — send directly as a message
        // No intermediate state manipulation needed
        void sendTextAsMessage(transcript);
      },
      () => {
        setIsRecording(false);
      },
    );
  }

  function handleMicEnd() {
    stopListening();
    // isRecording cleared by the onEnd callback in startListening
  }

  // ============================================================
  // IMAGE INPUT
  // ============================================================

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = (reader.result as string).split(',')[1];
      setPendingImage(base64);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  // ============================================================
  // CORE SEND LOGIC
  // Single path for all input types — text, voice, image.
  // Voice transcript calls sendTextAsMessage directly.
  // Text + image calls sendMessage via the input field.
  // ============================================================

  async function sendTextAsMessage(text: string) {
    if (!text.trim() || isGenerating || isThinking) return;

    stopVoice();
    wordBufferRef.current = new WordBuffer();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text.trim(),
      timestamp: Date.now(),
      arriving: true,
    };

    const userId = userMessage.id;
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === userId ? { ...m, arriving: false } : m));
    }, 300);

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    await sendWithMessages(updatedMessages);
  }

  function formatFamilyTime(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text && !pendingImage) return;
    if (isGenerating || isThinking) return;

    stopVoice();
    wordBufferRef.current = new WordBuffer();

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      arriving: true,
      images: pendingImage ? [pendingImage] : undefined,
    };

    setPendingImage(null);

    const userId = userMessage.id;
    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === userId ? { ...m, arriving: false } : m));
    }, 300);

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');

    await sendWithMessages(updatedMessages);
  }

  // ============================================================
  // STREAMING CHAT
  // Sends messages to /api/chat and streams the response.
  // Feeds tokens to TTS engine word by word as they arrive.
  // Memory is saved server-side after each response.
  // ============================================================

  const sendWithMessages = useCallback(async (msgs: Message[]) => {
    // Thinking pause — 1.2 to 2 seconds, variable
    // Breathing cursor shown during this time, not a spinner
    setIsThinking(true);
    await sleep(1200 + Math.random() * 800);
    setIsThinking(false);

    setIsGenerating(true);
    const assistantId = crypto.randomUUID();

    // Add empty assistant message — content fills as tokens stream in
    setMessages(prev => [...prev, {
      id: assistantId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
      arriving: true,
    }]);

    setTimeout(() => {
      setMessages(prev => prev.map(m => m.id === assistantId ? { ...m, arriving: false } : m));
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
            ...(m.images ? { images: m.images } : {}),
          })),
          sessionId: sessionId.current,
        }),
      });

      if (!response.ok || !response.body) throw new Error('Failed to connect');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') break;

          try {
            const parsed = JSON.parse(payload) as { token?: string };
            if (!parsed.token) continue;

            fullContent += parsed.token;
            setMessages(prev =>
              prev.map(m => m.id === assistantId ? { ...m, content: fullContent } : m)
            );

            // Feed to TTS engine — sentence accumulates, plays on completion
            const word = wordBufferRef.current.add(parsed.token);
            if (word) {
              const pause = getPauseDuration(word);
              if (pause > 0) await sleep(pause);
              feedWord(word, voiceModeRef.current);
            }
          } catch {
            // Skip malformed SSE chunks
          }
        }
      }

      // Flush any remaining word + sentence fragment
      const remaining = wordBufferRef.current.flush();
      if (remaining) feedWord(remaining, voiceModeRef.current);
      flushVoice(voiceModeRef.current);
      wordBufferRef.current = new WordBuffer();

    } catch {
      setMessages(prev =>
        prev.map(m => m.id === assistantId ? { ...m, content: '...' } : m)
      );
    } finally {
      setIsGenerating(false);
      inputRef.current?.focus();
    }
  }, []);

  async function loadFamilyMessages(mode: 'original' | 'summary') {
    setFamilyViewMode('loading');
  
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch_unsurfaced',
          sessionId: sessionId.current,
        }),
      });
  
      const data = await res.json() as {
        messages: Array<{
          id: string;
          from: string;
          content: string;
          timestamp: number;
        }>;
      };
  
      const msgs = data.messages.filter(m => m.content.trim());
      const ids = msgs.map(m => m.id);
  
      if (mode === 'original') {
        setFamilyMessages(msgs);
        setFamilyViewMode('original');
        // Mark surfaced immediately — user is seeing them now
        await markFamilySurfaced(ids);
      } else {
        const combined = msgs
          .map(m => `${m.from !== 'someone who cares' ? m.from + ': ' : ''}${m.content}`)
          .join('\n');
  
        const summaryRes = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [{
              role: 'user',
              content: `Someone left this message for a person who has withdrawn from the world. Summarize it in one quiet sentence — the feeling, not the details. Do not use the word "summary". Do not explain what you are doing. Just the sentence.\n\n${combined}`,
              timestamp: Date.now(),
            }],
            sessionId: sessionId.current,
          }),
        });
  
        const reader = summaryRes.body?.getReader();
        const decoder = new TextDecoder();
        let summary = '';
  
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n').filter(Boolean);
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue;
              const payload = line.slice(6);
              if (payload === '[DONE]') break;
              try {
                const parsed = JSON.parse(payload) as { token?: string };
                if (parsed.token) summary += parsed.token;
              } catch { /* skip */ }
            }
          }
        }
  
        setFamilySummary(summary.trim() || 'someone is thinking of you.');
        setFamilyViewMode('summary');
        // Mark surfaced — user has received the summary
        await markFamilySurfaced(ids);
      }
    } catch {
      setFamilyViewMode('choice');
    }
  }

  async function markFamilySurfaced(ids: string[]) {
    if (ids.length === 0) return;
    try {
      await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_surfaced',
          sessionId: sessionId.current,
          messageIds: ids,
        }),
      });
    } catch { /* silent */ }
  }

  // ============================================================
  // KEYBOARD
  // ============================================================

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void sendMessage();
    }
  }

  // ============================================================
  // HOLD TO FORGET
  // Hold any message for 800ms to get the option to forget it.
  // Removes it from the current session view.
  // ============================================================

  function handleMessageHoldStart(messageId: string) {
    holdTimerRef.current = setTimeout(() => setShowForgetConfirm(messageId), 800);
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

  // ============================================================
  // SETTINGS ACTIONS
  // ============================================================

  function openUnsentLetter() {
    setShowSettings(false);
    router.push('/unsent');
  }

  function copyFamilyLink() {
    if (typeof window !== 'undefined') {
      const link = `${window.location.origin}/family?for=${btoa(sessionId.current)}`;
      navigator.clipboard.writeText(link).catch(() => { });
    }
    setShowSettings(false);
  }

  function startFresh() {
    setMessages([]);
    setShowSettings(false);
    stopVoice();
    setPendingImage(null);
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

  const voiceLabel = { off: 'voice  off', soft: 'voice  on', quieter: 'voice  quiet' }[voiceMode];

  // ============================================================
  // SETUP SCREEN
  // Shown when Ollama is not running locally.
  // The setup instructions ARE the product argument:
  // this runs on your machine, not ours.
  // ============================================================

  if (ollamaReady === false) {
    return (
      <div style={styles.setupContainer}>
        <div style={styles.setupContent}>
          <p style={styles.setupTitle}>tobira runs on your device.</p>
          <p style={styles.setupSubtitle}>that's not a bug. that's the point.</p>
          <p style={styles.setupStep}>1. Install Ollama at ollama.com</p>
          <p style={styles.setupStep}>2. Open terminal and run:</p>
          <code style={styles.setupCode}>ollama pull gemma4:e4b</code>
          <p style={styles.setupStep}>3. Refresh this page</p>
          <button style={styles.setupRetry} onClick={checkOllama}>check again</button>
        </div>
      </div>
    );
  }

  if (ollamaReady === null) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.cursor} />
      </div>
    );
  }

  // ============================================================
  // MAIN INTERFACE
  // ============================================================

  return (
    <div style={{ ...styles.container, opacity: mounted ? 1 : 0, transition: 'opacity 0.8s ease' }}>

      {/* Top bar */}
      <div style={styles.topBar}>
  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
    <span style={styles.wordmark}>tobira</span>
    {hasFamily && (
      <button
        style={styles.familyDot}
        onClick={() => setShowFamilyNotice(v => !v)}
        title="someone left something"
        aria-label="new family message"
      />
    )}
  </div>
  <button
    style={styles.menuButton}
    onClick={() => setShowSettings(s => !s)}
    aria-label={showSettings ? 'Close menu' : 'Menu'}
    aria-expanded={showSettings}
  >
    ···
  </button>
</div>

{showFamilyNotice && (
  <div style={styles.familyNotice}>

    {/* Choice view — default */}
    {familyViewMode === 'choice' && (
      <>
        <p style={styles.familyNoticeText}>
          {familyNoticeCount === 1
            ? 'someone left something for you.'
            : `${familyNoticeCount} people left something for you.`}
        </p>
        <p style={styles.familyNoticeSubtext}>
          tobira will let you know when the moment feels right.
          or you can look now.
        </p>
        <div style={styles.familyNoticeActions}>
          <button
            style={styles.familyNoticeBtn}
            onClick={() => loadFamilyMessages('original')}
          >
            see it
          </button>
          <button
            style={styles.familyNoticeBtn}
            onClick={() => loadFamilyMessages('summary')}
          >
            have tobira summarize
          </button>
        </div>
<button
  style={styles.familyNoticeClose}
  onClick={() => setShowFamilyNotice(false)}
>
  not now
</button>
      </>
    )}

    {/* Loading */}
    {familyViewMode === 'loading' && (
      <p style={styles.familyNoticeSubtext}>reading...</p>
    )}

    {/* Original messages */}
    {familyViewMode === 'original' && (
  <>
    <p style={styles.familyNoticeLabel}>they left:</p>
    {familyMessages.map((m, i) => (
      <div key={i} style={styles.familyMessageItem}>
        <div style={styles.familyMessageMeta}>
          {m.from && m.from !== 'someone who cares' && (
            <span style={styles.familyMessageFrom}>{m.from}</span>
          )}
          <span style={styles.familyMessageTime}>
            {formatFamilyTime(m.timestamp)}
          </span>
        </div>
        <p style={styles.familyMessageContent}>"{m.content}"</p>
      </div>
    ))}
    <button
      style={styles.familyNoticeClose}
      onClick={async () => {
        setShowFamilyNotice(false);
        setFamilyViewMode('choice');
        setHasFamily(false);
      }}
    >
      close
    </button>
  </>
)}

    {/* Tobira summary */}
    {familyViewMode === 'summary' && (
      <>
        <p style={styles.familyNoticeLabel}>tobira read it.</p>
        <p style={styles.familyMessageContent}>{familySummary}</p>
        <button
          style={styles.familyNoticeClose}
          onClick={() => {
            setShowFamilyNotice(false);
            setFamilyViewMode('choice');
            setHasFamily(false);
          }}
        >
          close
        </button>
      </>
    )}

  </div>
)}

      {/* Settings drawer */}
      {showSettings && (
        <>
          <div style={styles.drawerBackdrop} aria-hidden onClick={() => setShowSettings(false)} />
          <div style={styles.drawer} role="menu">
            {voiceAvailable && (
              <>
                <button
                  style={{ ...styles.drawerItem, color: voiceMode === 'off' ? '#2a2a2a' : '#666' }}
                  onClick={() => handleVoiceChange(nextVoiceMode())}
                  role="menuitem"
                >
                  {voiceLabel}
                </button>
                <div style={styles.drawerDivider} />
              </>
            )}
            <button style={styles.drawerItem} onClick={openUnsentLetter} role="menuitem">
              unsent letter
            </button>
            <div style={styles.drawerDivider} />
            <button style={styles.drawerItem} onClick={copyFamilyLink} role="menuitem">
              copy family link
            </button>
            <button style={styles.drawerItem} onClick={startFresh} role="menuitem">
              start fresh
            </button>
          </div>
        </>
      )}

      {/* Messages */}
      <div style={styles.messagesContainer} role="log" aria-live="polite">

        {/* Onboarding — Tobira already in the room */}
        {messages.length === 0 && (
          <div style={styles.onboarding}>
            <p style={styles.onboardingMessage}>still here.</p>
            <p style={styles.onboardingSubtext}>no advice. no fixing. just here.</p>
          </div>
        )}

        {messages.map((message, index) => (
          <div
            key={message.id}
            style={{
              ...styles.messageWrapper,
              justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
              opacity: message.arriving ? 0 : 1,
              transform: message.arriving ? 'translateY(8px)' : 'translateY(0)',
              transition: 'opacity 0.25s ease, transform 0.25s ease',
            }}
            onMouseDown={() => handleMessageHoldStart(message.id)}
            onMouseUp={handleMessageHoldEnd}
            onTouchStart={() => handleMessageHoldStart(message.id)}
            onTouchEnd={handleMessageHoldEnd}
          >
            {showForgetConfirm === message.id && (
              <div style={{
                ...styles.forgetOverlay,
                ...(message.role === 'user' ? styles.forgetOverlayUser : styles.forgetOverlayAssistant),
              }}>
                <button style={styles.forgetButton} onClick={() => forgetMessage(message.id)}>
                  forget this
                </button>
                <button style={styles.cancelButton} onClick={() => setShowForgetConfirm(null)}>
                  keep
                </button>
              </div>
            )}

            <div style={{
              ...styles.messageBubble,
              ...(message.role === 'user' ? styles.userBubble : styles.assistantBubble),
            }}>
              {message.images && message.images.length > 0 && (
                <img
                  src={`data:image/jpeg;base64,${message.images[0]}`}
                  alt="shared image"
                  style={styles.messageImage}
                />
              )}
              {message.content}
              {isGenerating && message.role === 'assistant' && index === messages.length - 1 && (
                <span style={styles.generatingCursor} aria-hidden>▋</span>
              )}
            </div>
          </div>
        ))}

        {/* Breathing cursor during thinking pause */}
        {isThinking && (
          <div style={styles.thinkingRow} aria-label="Tobira is thinking">
            <span style={styles.breathingCursor} aria-hidden>▋</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Hidden file input for image selection */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageSelect}
        aria-hidden
      />

      {/* Input area */}
      <div style={styles.inputContainer}>

        {/* Image preview */}
        {pendingImage && (
          <div style={styles.imagePreview}>
            <img
              src={`data:image/jpeg;base64,${pendingImage}`}
              alt="pending attachment"
              style={styles.imagePreviewImg}
            />
            <button
              type="button"
              style={styles.imagePreviewRemove}
              onClick={() => setPendingImage(null)}
              aria-label="Remove image"
            >
              ×
            </button>
          </div>
        )}

        {/* Recording indicator */}
        {isRecording && (
          <div style={styles.recordingIndicator} aria-live="polite">
            <span style={styles.recordingDot} aria-hidden />
            <span style={styles.recordingText}>listening...</span>
          </div>
        )}

        {/* Input row */}
        <div style={styles.inputRow}>
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            style={styles.input}
            rows={1}
            disabled={isGenerating || isThinking || isRecording}
            placeholder={isRecording ? '' : "what's on your mind today"}
            aria-label="Message input"
          />

          {/* Mic button — hold to speak */}
          {voiceInputAvailable && (
            <button
              type="button"
              style={{ ...styles.iconButton, color: isRecording ? '#884444' : '#333' }}
              onMouseDown={handleMicStart}
              onMouseUp={handleMicEnd}
              onTouchStart={handleMicStart}
              onTouchEnd={handleMicEnd}
              disabled={isGenerating || isThinking}
              aria-label="Hold to speak"
              aria-pressed={isRecording}
            >
              <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          )}

          {/* Camera button — share an image */}
          <button
            type="button"
            style={styles.iconButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={isGenerating || isThinking || isRecording}
            aria-label="Share an image"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </button>
        </div>

        <p style={styles.inputHint} aria-hidden>
          {voiceInputAvailable ? 'enter ↵  ·  hold mic to speak' : 'enter ↵'}
        </p>
      </div>
    </div>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', flexDirection: 'column', height: '100dvh',
    width: '100%', maxWidth: '680px', margin: '0 auto',
    backgroundColor: '#0a0a0a', color: '#c8c8c8',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    fontSize: '15px', lineHeight: '1.7', position: 'relative', overflow: 'hidden',
  },
  topBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: 'calc(16px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) 0 calc(20px + env(safe-area-inset-left, 0px))',
    flexShrink: 0,
  },
  wordmark: { color: '#444', fontSize: '12px', letterSpacing: '0.15em', userSelect: 'none' },
  menuButton: {
    background: 'none', border: 'none', color: '#444', fontSize: '18px',
    cursor: 'pointer', padding: '4px 8px', fontFamily: 'inherit',
    letterSpacing: '0.15em', lineHeight: 1,
  },
  drawerBackdrop: { position: 'fixed', inset: 0, zIndex: 99 },
  drawer: {
    position: 'absolute',
    top: 'calc(48px + env(safe-area-inset-top, 0px))',
    right: 'calc(16px + env(safe-area-inset-right, 0px))',
    backgroundColor: '#0f0f0f', border: '1px solid #2a2a2a',
    boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
    zIndex: 100, minWidth: '180px', display: 'flex', flexDirection: 'column',
  },
  drawerItem: {
    background: 'none', border: 'none', color: '#888',
    fontFamily: "'JetBrains Mono', monospace", fontSize: '12px',
    padding: '10px 20px', cursor: 'pointer', textAlign: 'left',
    letterSpacing: '0.04em', width: '100%', transition: 'color 0.2s ease',
  },
  drawerDivider: { height: '1px', backgroundColor: '#1a1a1a', margin: '4px 0' },
  messagesContainer: {
    flex: 1, overflowY: 'auto',
    padding: '24px calc(20px + env(safe-area-inset-right, 0px)) 20px calc(20px + env(safe-area-inset-left, 0px))',
    display: 'flex', flexDirection: 'column', gap: '20px', scrollbarWidth: 'none',
  },
  onboarding: {
    flex: 1, display: 'flex', flexDirection: 'column',
    alignItems: 'flex-start', justifyContent: 'center',
    paddingBottom: '60px', gap: '10px', animation: 'fadeIn 1.5s ease',
  },
  onboardingMessage: { color: '#555', fontSize: '15px', letterSpacing: '0.02em', fontStyle: 'italic', margin: 0 },
  onboardingSubtext: { color: '#252525', fontSize: '11px', letterSpacing: '0.06em', margin: 0 },
  messageWrapper: { display: 'flex', width: '100%', position: 'relative', userSelect: 'text' },
  messageBubble: {
    maxWidth: '80%', lineHeight: '1.6', wordBreak: 'break-word',
    whiteSpace: 'pre-wrap', position: 'relative',
    display: 'flex', flexDirection: 'column', gap: '8px',
  },
  messageImage: { width: '120px', height: '120px', objectFit: 'cover', opacity: 0.65, borderRadius: '2px', alignSelf: 'flex-end' },
  userBubble: { color: '#777', textAlign: 'right', fontSize: '14px', alignItems: 'flex-end' },
  assistantBubble: { color: '#d4d4d4', fontSize: '15px' },
  generatingCursor: { display: 'inline-block', marginLeft: '2px', animation: 'blink 1s step-end infinite', color: '#555' },
  thinkingRow: { display: 'flex', justifyContent: 'flex-start', width: '100%' },
  breathingCursor: { display: 'inline-block', color: '#2a2a2a', fontSize: '15px', animation: 'breathe 2s ease-in-out infinite' },
  inputContainer: {
    padding: '14px calc(20px + env(safe-area-inset-right, 0px)) calc(28px + env(safe-area-inset-bottom, 0px)) calc(20px + env(safe-area-inset-left, 0px))',
    borderTop: '1px solid #141414', display: 'flex', flexDirection: 'column', gap: '10px',
  },
  imagePreview: { position: 'relative', alignSelf: 'flex-start' },
  imagePreviewImg: { width: '64px', height: '64px', objectFit: 'cover', opacity: 0.55, borderRadius: '2px', display: 'block' },
  imagePreviewRemove: {
    position: 'absolute', top: '-6px', right: '-6px',
    background: '#111', border: '1px solid #2a2a2a', color: '#555',
    fontSize: '11px', width: '18px', height: '18px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: '50%', padding: 0, lineHeight: 1,
  },
  recordingIndicator: { display: 'flex', alignItems: 'center', gap: '8px' },
  recordingDot: {
    width: '5px', height: '5px', borderRadius: '50%',
    backgroundColor: '#884444', display: 'inline-block',
    animation: 'breathe 1s ease-in-out infinite',
  },
  recordingText: { color: '#444', fontSize: '11px', letterSpacing: '0.06em' },
  inputRow: { display: 'flex', alignItems: 'flex-end', gap: '12px' },
  input: {
    flex: 1, background: 'none', border: 'none',
    borderBottom: '1px solid #2e2e2e', color: '#c8c8c8',
    fontFamily: 'inherit', fontSize: '15px', lineHeight: '1.6',
    padding: '8px 0', resize: 'none', outline: 'none', caretColor: '#777',
  },
  iconButton: {
    background: 'none', border: 'none', color: '#333', cursor: 'pointer',
    padding: '8px 0', flexShrink: 0, lineHeight: 1,
    transition: 'color 0.2s', display: 'flex', alignItems: 'center',
  },
  inputHint: { color: '#222', fontSize: '10px', letterSpacing: '0.1em', userSelect: 'none', margin: 0 },
  forgetOverlay: { position: 'absolute', top: '-40px', display: 'flex', gap: '10px', zIndex: 10 },
  forgetOverlayAssistant: { left: 0 },
  forgetOverlayUser: { right: 0 },
  forgetButton: {
    background: '#111', border: '1px solid #2a2a2a', color: '#777',
    fontSize: '11px', padding: '6px 12px', cursor: 'pointer',
    fontFamily: 'inherit', letterSpacing: '0.04em',
  },
  cancelButton: {
    background: 'none', border: '1px solid #1e1e1e', color: '#444',
    fontSize: '11px', padding: '6px 12px', cursor: 'pointer',
    fontFamily: 'inherit', letterSpacing: '0.04em',
  },
  setupContainer: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    height: '100dvh', backgroundColor: '#0a0a0a',
    fontFamily: "'JetBrains Mono', monospace", padding: '40px 20px',
  },
  setupContent: { maxWidth: '400px', display: 'flex', flexDirection: 'column', gap: '16px' },
  setupTitle: { color: '#888', fontSize: '14px', letterSpacing: '0.02em', margin: 0 },
  setupSubtitle: { color: '#333', fontSize: '12px', letterSpacing: '0.02em', margin: '0 0 8px' },
  setupStep: { fontSize: '13px', color: '#555', margin: 0 },
  setupCode: { display: 'block', background: '#0f0f0f', border: '1px solid #1e1e1e', padding: '12px 16px', color: '#777', fontSize: '13px', letterSpacing: '0.02em' },
  setupRetry: {
    background: 'none', border: '1px solid #1e1e1e', color: '#444',
    padding: '10px 20px', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: '12px', letterSpacing: '0.05em', alignSelf: 'flex-start', marginTop: '8px',
  },
  loadingContainer: { display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', backgroundColor: '#0a0a0a' },
  cursor: { width: '2px', height: '20px', backgroundColor: '#2a2a2a', animation: 'blink 1s step-end infinite' },
  familyDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#3a3a3a',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    flexShrink: 0,
    animation: 'familyGlow 2s ease-in-out infinite',
  },
  familyNotice: {
    position: 'absolute',
    top: 'calc(48px + env(safe-area-inset-top, 0px))',
    left: 'calc(20px + env(safe-area-inset-left, 0px))',
    backgroundColor: '#0f0f0f',
    border: '1px solid #1e1e1e',
    padding: '20px',
    zIndex: 100,
    maxWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  familyNoticeText: {
    color: '#666',
    fontSize: '13px',
    letterSpacing: '0.02em',
    margin: 0,
  },
  familyNoticeSubtext: {
    color: '#333',
    fontSize: '11px',
    letterSpacing: '0.02em',
    margin: 0,
    lineHeight: '1.6',
  },
  familyNoticeLabel: {
    color: '#444',
    fontSize: '11px',
    letterSpacing: '0.06em',
    margin: 0,
  },
  familyNoticeActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  familyNoticeBtn: {
    background: 'none',
    border: '1px solid #2a2a2a',
    color: '#666',
    fontFamily: 'inherit',
    fontSize: '11px',
    padding: '8px 14px',
    cursor: 'pointer',
    letterSpacing: '0.04em',
    textAlign: 'left' as const,
    transition: 'border-color 0.2s',
  },
  familyMessageItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
    paddingLeft: '12px',
    borderLeft: '1px solid #1e1e1e',
  },
  familyMessageFrom: {
    color: '#333',
    fontSize: '10px',
    letterSpacing: '0.06em',
    margin: 0,
  },
  familyMessageContent: {
    color: '#666',
    fontSize: '12px',
    lineHeight: '1.6',
    fontStyle: 'italic',
    margin: 0,
  },
  familyNoticeClose: {
    background: 'none',
    border: 'none',
    color: '#252525',
    fontFamily: 'inherit',
    fontSize: '10px',
    letterSpacing: '0.06em',
    cursor: 'pointer',
    padding: 0,
    alignSelf: 'flex-start',
  },

  familyMessageMeta: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: '8px',
  },
  familyMessageTime: {
    color: '#252525',
    fontSize: '10px',
    letterSpacing: '0.04em',
    flexShrink: 0,
  },
};
