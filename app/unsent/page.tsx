'use client';

// app/unsent/page.tsx
// TOBIRA — Unsent Letter
//
// A room inside Tobira where Tobira is absent.
//
// Three paths:
//
// [burn]
//   Gemma reads once. Extracts one anonymous feeling.
//   Words deleted. Feeling stored. Relationship continues.
//
// [burn completely]
//   Requires finding a barely-visible link.
//   8-second timer defaults to regular burn.
//   The friction is the message.
//
// [leave at the door →]
//   User chooses: let family read it, or just let them know.
//   Two very different acts. User decides which.

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

type Phase =
  | 'writing'
  | 'confirm'
  | 'confirm_complete'
  | 'door_choice'       // NEW — user decides what family sees
  | 'burning'
  | 'gone'
  | 'gone_complete'
  | 'left'
  | 'returning';

const TIMER_SECONDS = 8;

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default function UnsentLetter() {
  const [content, setContent] = useState('');
  const [phase, setPhase] = useState<Phase>('writing');
  const [mounted, setMounted] = useState(false);
  const [timer, setTimer] = useState(TIMER_SECONDS);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      setTimeout(() => textareaRef.current?.focus(), 100);
    }, 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (phase !== 'confirm_complete') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    setTimer(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      setTimer(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          void executeBurn('remember');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  function returnToChat() {
    setPhase('returning');
    setTimeout(() => router.push('/'), 600);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape') {
      if (phase === 'confirm' || phase === 'confirm_complete' || phase === 'door_choice') {
        setPhase(phase === 'door_choice' ? 'confirm' : 'writing');
      } else if (phase === 'writing') {
        returnToChat();
      }
    }
  }

  function handleBurnTap() {
    if (!content.trim()) { returnToChat(); return; }
    setPhase('confirm');
  }

  async function executeBurn(mode: 'remember' | 'complete') {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('burning');
    await sleep(600);

    if (mode === 'remember') {
      try {
        await fetch('/api/unsent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content,
            sessionId: typeof window !== 'undefined'
              ? localStorage.getItem('tobira_session') || ''
              : '',
          }),
        });
      } catch { /* silent */ }
    }

    setContent('');
    setPhase(mode === 'complete' ? 'gone_complete' : 'gone');
    await sleep(2200);
    setPhase('returning');
    await sleep(600);
    router.push('/');
  }

  // ── Leave at door — show choice screen first ──
  function handleLeaveAtDoor() {
    if (timerRef.current) clearInterval(timerRef.current);
    setPhase('door_choice');
  }

  async function executeLeaveAtDoor(allowRead: boolean) {
    setPhase('burning');
    await sleep(600);

    try {
      const sessionId = typeof window !== 'undefined'
        ? localStorage.getItem('tobira_session') || ''
        : '';

      await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'leave_at_door',
          sessionId,
          content: allowRead ? content.trim() : '',
          allowRead,
        }),
      });
    } catch { /* silent */ }

    setContent('');
    setPhase('left');
    await sleep(2200);
    setPhase('returning');
    await sleep(600);
    router.push('/');
  }

  const timerPercent = (timer / TIMER_SECONDS) * 100;

  return (
    <div
      style={{
        ...styles.room,
        opacity: mounted && phase !== 'returning' ? 1 : 0,
        transition: phase === 'returning' ? 'opacity 0.6s ease' : 'opacity 1s ease',
      }}
      onKeyDown={handleKeyDown}
    >

      {/* ── WRITING ── */}
      {(phase === 'writing' || phase === 'burning') && (
        <textarea
          ref={textareaRef}
          value={content}
          onChange={e => setContent(e.target.value)}
          style={{
            ...styles.letter,
            opacity: phase === 'burning' ? 0 : 1,
            transition: phase === 'burning' ? 'opacity 0.6s ease' : 'none',
          }}
          placeholder=""
          disabled={phase === 'burning'}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
        />
      )}

      {/* ── CONFIRM 1 ── */}
      {phase === 'confirm' && (
        <div style={styles.confirmRoom}>
          <div style={styles.confirmText}>
            <p style={styles.confirmLine}>once it's gone, it's gone.</p>
            <p style={styles.confirmSubline}>
              tobira will hold only the feeling — not the words. never the words.
            </p>
          </div>

          <div style={styles.primaryActions}>
            <button type="button" style={styles.burnBtn} onClick={() => void executeBurn('remember')}>
              burn
            </button>
            <button type="button" style={styles.leaveAtDoorBtn} onClick={handleLeaveAtDoor}>
              leave at the door →
            </button>
          </div>

          <button type="button" style={styles.burnCompletelyLink} onClick={() => setPhase('confirm_complete')}>
            burn completely — tobira forgets everything
          </button>

          <button type="button" style={styles.goBackBtn} onClick={() => setPhase('writing')}>
            go back
          </button>
        </div>
      )}

      {/* ── DOOR CHOICE — user decides what family sees ── */}
      {phase === 'door_choice' && (
        <div style={styles.confirmRoom}>
          <div style={styles.confirmText}>
            <p style={styles.confirmLine}>what do you want them to have?</p>
            <p style={styles.confirmSubline}>
              the door goes one way. this is your choice.
            </p>
          </div>

          <div style={styles.doorChoiceActions}>
            {/* Let family read it */}
            <button
              type="button"
              style={styles.doorChoiceBtn}
              onClick={() => void executeLeaveAtDoor(true)}
            >
              <span style={styles.doorChoiceTitle}>let them read it</span>
              <span style={styles.doorChoiceDesc}>
                they'll see your words. all of them.
              </span>
            </button>

            {/* Just the notification */}
            <button
              type="button"
              style={styles.doorChoiceBtn}
              onClick={() => void executeLeaveAtDoor(false)}
            >
              <span style={styles.doorChoiceTitle}>just let them know something is there</span>
              <span style={styles.doorChoiceDesc}>
                they'll know you reached out. not what you said.
              </span>
            </button>
          </div>

          <button type="button" style={styles.goBackBtn} onClick={() => setPhase('confirm')}>
            go back
          </button>
        </div>
      )}

      {/* ── CONFIRM 2 — burn completely ── */}
      {phase === 'confirm_complete' && (
        <div style={styles.confirmRoom}>
          <div style={styles.confirmText}>
            <p style={styles.confirmLine}>tobira will remember nothing.</p>
            <p style={styles.confirmSubline}>not the feeling. not that this happened.</p>
          </div>

          <div style={styles.timerTrack}>
            <div style={{ ...styles.timerFill, width: `${timerPercent}%`, transition: 'width 1s linear' }} />
          </div>
          <p style={styles.timerLabel}>defaulting to tobira remembers in {timer}s</p>

          <div style={styles.primaryActions}>
            <button type="button" style={styles.goBackBtn} onClick={() => { if (timerRef.current) clearInterval(timerRef.current); setPhase('confirm'); }}>
              go back
            </button>
            <button type="button" style={styles.burnCompletelyBtn} onClick={() => void executeBurn('complete')}>
              yes, forget everything
            </button>
          </div>
        </div>
      )}

      {/* ── GONE ── */}
      {phase === 'gone' && (
        <div style={styles.goneRoom}>
          <p style={styles.goneText}>gone.</p>
          <p style={styles.goneSubtext}>tobira holds the feeling.</p>
        </div>
      )}

      {/* ── GONE COMPLETELY ── */}
      {phase === 'gone_complete' && (
        <div style={styles.goneRoom}>
          <p style={styles.goneText}>gone.</p>
          <p style={styles.goneSubtext}>completely.</p>
        </div>
      )}

      {/* ── LEFT AT DOOR ── */}
      {phase === 'left' && (
        <div style={styles.goneRoom}>
          <p style={styles.goneText}>left at the door.</p>
          <p style={styles.goneSubtext}>they'll see something is there.</p>
        </div>
      )}

      {/* ── BOTTOM BAR ── */}
      {phase === 'writing' && (
        <div style={styles.bottomBar}>
          <button type="button" style={styles.leaveButton} onClick={returnToChat}>leave</button>
          <button
            type="button"
            style={{ ...styles.burnButton, opacity: content.trim() ? 1 : 0.2 }}
            onClick={handleBurnTap}
            disabled={!content.trim()}
          >
            burn
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  room: {
    display: 'flex', flexDirection: 'column', height: '100dvh',
    width: '100%', maxWidth: '680px', margin: '0 auto',
    backgroundColor: '#0a0a0a',
    padding: 'calc(52px + env(safe-area-inset-top, 0px)) calc(28px + env(safe-area-inset-right, 0px)) calc(36px + env(safe-area-inset-bottom, 0px)) calc(28px + env(safe-area-inset-left, 0px))',
    boxSizing: 'border-box',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
  },
  letter: {
    flex: 1, background: 'none', border: 'none', outline: 'none',
    resize: 'none', color: '#c0c0c0',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    fontSize: '15px', lineHeight: '1.9', caretColor: '#666',
    width: '100%', padding: 0, scrollbarWidth: 'none',
  },
  confirmRoom: {
    flex: 1, display: 'flex', flexDirection: 'column',
    justifyContent: 'center', gap: '36px', animation: 'fadeIn 0.5s ease',
  },
  confirmText: { display: 'flex', flexDirection: 'column', gap: '12px' },
  confirmLine: { color: '#888', fontSize: '15px', letterSpacing: '0.02em', margin: 0 },
  confirmSubline: { color: '#3a3a3a', fontSize: '12px', letterSpacing: '0.02em', lineHeight: '1.7', margin: 0 },
  primaryActions: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },

  // Door choice screen
  doorChoiceActions: { display: 'flex', flexDirection: 'column', gap: '12px' },
  doorChoiceBtn: {
    background: 'none', border: '1px solid #1e1e1e', cursor: 'pointer',
    padding: '16px 20px', textAlign: 'left' as const,
    display: 'flex', flexDirection: 'column', gap: '6px',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    transition: 'border-color 0.2s',
  },
  doorChoiceTitle: { color: '#666', fontSize: '12px', letterSpacing: '0.04em' },
  doorChoiceDesc: { color: '#2a2a2a', fontSize: '11px', letterSpacing: '0.02em', lineHeight: '1.5' },

  burnBtn: {
    background: 'none', border: '1px solid #2a2a2a', color: '#555',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    fontSize: '11px', letterSpacing: '0.12em', cursor: 'pointer', padding: '10px 28px',
  },
  leaveAtDoorBtn: {
    background: 'none', border: '1px solid #3d3d3d', color: '#888',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    fontSize: '11px', letterSpacing: '0.08em', cursor: 'pointer', padding: '10px 20px',
  },
  burnCompletelyLink: {
    background: 'none', border: 'none', color: '#252525',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    fontSize: '10px', letterSpacing: '0.05em', cursor: 'pointer',
    padding: '0', textAlign: 'left' as const, alignSelf: 'flex-start',
  },
  goBackBtn: {
    background: 'none', border: 'none', color: '#2e2e2e',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    fontSize: '11px', letterSpacing: '0.06em', cursor: 'pointer', padding: '0',
  },
  timerTrack: { width: '100%', height: '1px', backgroundColor: '#181818', marginTop: '-20px' },
  timerFill: { height: '1px', backgroundColor: '#2e2e2e' },
  timerLabel: { color: '#252525', fontSize: '10px', letterSpacing: '0.05em', margin: '6px 0 0 0' },
  burnCompletelyBtn: {
    background: 'none', border: '1px solid #2a2a2a', color: '#555',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    fontSize: '11px', letterSpacing: '0.08em', cursor: 'pointer', padding: '10px 20px',
  },
  goneRoom: {
    flex: 1, display: 'flex', flexDirection: 'column',
    justifyContent: 'center', gap: '12px', animation: 'fadeIn 0.5s ease',
  },
  goneText: { color: '#3a3a3a', fontSize: '14px', letterSpacing: '0.08em', margin: 0 },
  goneSubtext: { color: '#1e1e1e', fontSize: '11px', letterSpacing: '0.06em', margin: 0 },
  bottomBar: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    paddingTop: '20px', borderTop: '1px solid #111', flexShrink: 0,
  },
  leaveButton: {
    background: 'none', border: 'none', color: '#444',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    fontSize: '11px', letterSpacing: '0.08em', cursor: 'pointer', padding: '8px 0',
  },
  burnButton: {
    background: 'none', border: '1px solid #2a2a2a', color: '#555',
    fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
    fontSize: '11px', letterSpacing: '0.12em', cursor: 'pointer',
    padding: '8px 20px', transition: 'opacity 0.2s ease',
  },
};
