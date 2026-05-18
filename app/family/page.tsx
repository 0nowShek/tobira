'use client';

// app/family/page.tsx
// TOBIRA — Family Bridge
//
// THE DOOR GOES ONE WAY.
// Family can knock. Only the user decides if it opens.
//
// The count of things left at the door never resets.
// It accumulates as a quiet record of persistence.
// Family knocked 5 times. Then 6. That matters.

import { useState, useEffect } from 'react';

interface FamilyMessage {
  id: string;
  from: string;
  content: string;
  timestamp: number;
  surfaced: boolean;
  type?: 'message' | 'unsent_letter';
}

interface LetterEntry {
  id: string;
  content: string;
  timestamp: number;
  age: string;
}

type PageState = 'loading' | 'invalid' | 'form' | 'submitted';

export default function FamilyBridge() {
  const [pageState, setPageState] = useState<PageState>('loading');
  const [sessionId, setSessionId] = useState('');
  const [from, setFrom] = useState('');
  const [content, setContent] = useState('');

  // Unsent letter state
  const [hasLetter, setHasLetter] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [newCount, setNewCount] = useState(0);
  const [seenCount, setSeenCount] = useState(0);
  const [hasReadable, setHasReadable] = useState(false);
  const [letters, setLetters] = useState<LetterEntry[]>([]);
  const [showLetter, setShowLetter] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('for') || '';
    if (!encoded) { setPageState('invalid'); return; }

    let sid = '';
    try { sid = atob(encoded); } catch { sid = encoded; }
    if (!sid) { setPageState('invalid'); return; }

    setSessionId(sid);
    checkLetters(sid);
    setPageState('form');
  }, []);

  async function checkLetters(sid: string) {
    try {
      const res = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'family_check', sessionId: sid }),
      });
      if (!res.ok) return;
      const data = await res.json() as {
        hasLetter: boolean;
        totalCount: number;
        newCount: number;
        seenCount: number;
        hasReadable: boolean;
        letters: LetterEntry[];
      };
      setHasLetter(data.hasLetter);
      setTotalCount(data.totalCount);
      setNewCount(data.newCount);
      setSeenCount(data.seenCount);
      setHasReadable(data.hasReadable);
      setLetters(data.letters ?? []);
    } catch { /* silent */ }
  }

  async function markLettersSeen(letterIds: string[]) {
    if (letterIds.length === 0) return;
    try {
      await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'family_mark_seen',
          sessionId,
          letterIds,
        }),
      });
      // Update local state — new becomes seen, count stays
      setNewCount(0);
      setSeenCount(totalCount);
    } catch { /* silent */ }
  }

  async function handleReadIt() {
    setShowLetter(true);
    // Seen state persists — total count at the door never decreases
    const newLetterIds = letters.map(l => l.id);
    await markLettersSeen(newLetterIds);
  }

  async function submitMessage() {
    if (!content.trim() || !sessionId) return;
    const message: FamilyMessage = {
      id: crypto.randomUUID(),
      from: from.trim() || 'someone who cares',
      content: content.trim(),
      timestamp: Date.now(),
      surfaced: false,
      type: 'message',
    };
    try {
      await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', sessionId, message }),
      });
      setPageState('submitted');
    } catch { /* silent */ }
  }

  // ── LOADING ──
  if (pageState === 'loading') return <div style={styles.container} />;

  // ── INVALID ──
  if (pageState === 'invalid') {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <p style={styles.errorText}>this link isn't valid.</p>
          <p style={styles.subText}>
            ask the person you're trying to reach to share their tobira link with you.
          </p>
        </div>
      </div>
    );
  }

  // ── READING LETTER ──
  if (showLetter && letters.length > 0) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <p style={styles.letterLabel}>they left this for you.</p>
          {letters.map((letter, i) => (
            <div key={i} style={styles.letterBlock}>
              <p style={styles.letterAge}>{letter.age}</p>
              <p style={styles.letterContent}>{letter.content}</p>
            </div>
          ))}
          <p style={styles.letterNote}>they chose to share this with you.</p>
          <button style={styles.anotherButton} onClick={() => setShowLetter(false)}>
            back
          </button>
        </div>
      </div>
    );
  }

  // ── SUBMITTED ──
  if (pageState === 'submitted') {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <p style={styles.sentText}>left.</p>
          <p style={styles.subText}>they'll see it when they're ready.</p>
          <button style={styles.anotherButton} onClick={() => { setPageState('form'); setContent(''); }}>
            leave another
          </button>
        </div>
      </div>
    );
  }

  // ── FORM ──
  return (
    <div style={styles.container}>
      <div style={styles.content}>

        {/* Unsent letter notification — accumulates, never resets */}
        {hasLetter && (
          <div style={styles.unsentNotice}>
            <div style={styles.unsentInner}>

              {/* Total count — quiet, permanent record */}
              <div style={styles.unsentCountRow}>
                <p style={styles.unsentTitle}>
                  {totalCount === 1
                    ? 'something was left at the door.'
                    : `${totalCount} things were left at the door.`}
                </p>
                {/* New indicator — only shown when there are unseen letters */}
                {newCount > 0 && (
                  <span style={styles.newBadge}>
                    {newCount} new
                  </span>
                )}
              </div>

              {hasReadable ? (
                <>
                  <p style={styles.unsentSubtext}>
                    {newCount > 0
                      ? 'they chose to let you read it.'
                      : 'you have already read what was shared.'}
                  </p>
                  {newCount > 0 && (
                    <button style={styles.readItBtn} onClick={handleReadIt}>
                      read it
                    </button>
                  )}
                </>
              ) : (
                <p style={styles.unsentSubtext}>
                  {newCount > 0
                    ? 'they chose to share only that they reached out. you won\'t see the words.'
                    : 'they keep reaching out.'}
                </p>
              )}

            </div>
          </div>
        )}

        {/* Header */}
        <div style={styles.header}>
          <p style={styles.title}>leave something</p>
          <p style={styles.subtitle}>
            they'll hear it when they're ready.
            you won't see their response.
          </p>
        </div>

        {/* From field */}
        <div style={styles.field}>
          <label style={styles.label}>from</label>
          <input
            style={styles.input}
            type="text"
            value={from}
            onChange={e => setFrom(e.target.value)}
            placeholder="your name (optional)"
          />
        </div>

        {/* Message field */}
        <div style={styles.field}>
          <label style={styles.label}>message</label>
          <textarea
            style={styles.textarea}
            value={content}
            onChange={e => setContent(e.target.value)}
            placeholder="something you want them to know..."
            rows={5}
          />
        </div>

        {/* Examples */}
        <div style={styles.examples}>
          <p style={styles.examplesLabel}>some people write things like:</p>
          <p style={styles.example}>"he used to love drawing as a kid"</p>
          <p style={styles.example}>"i'm not angry. i just miss him."</p>
          <p style={styles.example}>"she liked that band, the one with the piano"</p>
          <p style={styles.example}>"i left food outside the door again. the good kind."</p>
        </div>

        <button
          style={{ ...styles.submitButton, opacity: content.trim() ? 1 : 0.4 }}
          onClick={submitMessage}
          disabled={!content.trim()}
        >
          leave it
        </button>

      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    minHeight: '100dvh', backgroundColor: '#0d0d0d',
    padding: 'calc(40px + env(safe-area-inset-top, 0px)) calc(20px + env(safe-area-inset-right, 0px)) calc(40px + env(safe-area-inset-bottom, 0px)) calc(20px + env(safe-area-inset-left, 0px))',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },
  content: { width: '100%', maxWidth: '480px', display: 'flex', flexDirection: 'column', gap: '32px' },

  // Unsent notice
  unsentNotice: { backgroundColor: '#0f0f0f', border: '1px solid #1a1a1a', padding: '20px' },
  unsentInner: { display: 'flex', flexDirection: 'column', gap: '10px' },
  unsentCountRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: '12px' },
  unsentTitle: { color: '#555', fontSize: '13px', letterSpacing: '0.02em', margin: 0 },
  newBadge: {
    color: '#666', fontSize: '10px', letterSpacing: '0.06em',
    border: '1px solid #2a2a2a', padding: '2px 8px', flexShrink: 0,
    whiteSpace: 'nowrap' as const,
  },
  unsentSubtext: { color: '#2a2a2a', fontSize: '11px', lineHeight: '1.6', letterSpacing: '0.02em', margin: 0 },
  readItBtn: {
    background: 'none', border: '1px solid #2a2a2a', color: '#555',
    fontFamily: 'inherit', fontSize: '11px', padding: '8px 16px',
    cursor: 'pointer', letterSpacing: '0.04em', alignSelf: 'flex-start' as const,
  },

  // Letter reading view
  letterLabel: { color: '#444', fontSize: '12px', letterSpacing: '0.04em', margin: 0 },
  letterBlock: { padding: '20px', backgroundColor: '#0f0f0f', border: '1px solid #1a1a1a', display: 'flex', flexDirection: 'column', gap: '10px' },
  letterAge: { color: '#252525', fontSize: '10px', letterSpacing: '0.06em', margin: 0 },
  letterContent: {
    color: '#888', fontSize: '14px', lineHeight: '1.8',
    letterSpacing: '0.02em', margin: 0, whiteSpace: 'pre-wrap' as const,
  },
  letterNote: { color: '#252525', fontSize: '11px', letterSpacing: '0.04em', margin: 0 },

  // Form
  header: { display: 'flex', flexDirection: 'column', gap: '10px' },
  title: { color: '#c8c8c8', fontSize: '16px', fontWeight: 300, letterSpacing: '0.02em', margin: 0 },
  subtitle: { color: '#444', fontSize: '12px', lineHeight: '1.6', letterSpacing: '0.02em', margin: 0 },
  field: { display: 'flex', flexDirection: 'column', gap: '8px' },
  label: { color: '#333', fontSize: '11px', letterSpacing: '0.08em' },
  input: {
    background: 'none', border: 'none', borderBottom: '1px solid #1e1e1e',
    color: '#888', fontFamily: 'inherit', fontSize: '14px',
    padding: '8px 0', outline: 'none', caretColor: '#444', width: '100%',
  },
  textarea: {
    background: '#0f0f0f', border: '1px solid #1a1a1a', color: '#999',
    fontFamily: 'inherit', fontSize: '14px', lineHeight: '1.7',
    padding: '16px', outline: 'none', resize: 'none', caretColor: '#444', width: '100%',
  },
  examples: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '16px', borderLeft: '1px solid #1a1a1a' },
  examplesLabel: { color: '#252525', fontSize: '11px', letterSpacing: '0.04em', margin: 0 },
  example: { color: '#333', fontSize: '12px', lineHeight: '1.6', fontStyle: 'italic', margin: 0 },
  submitButton: {
    background: 'none', border: '1px solid #2a2a2a', color: '#666',
    fontFamily: 'inherit', fontSize: '13px', padding: '12px 24px',
    cursor: 'pointer', letterSpacing: '0.06em', alignSelf: 'flex-start' as const,
    transition: 'opacity 0.2s',
  },
  sentText: { color: '#777', fontSize: '18px', letterSpacing: '0.02em', margin: 0 },
  subText: { color: '#333', fontSize: '12px', lineHeight: '1.6', margin: 0 },
  anotherButton: {
    background: 'none', border: 'none', color: '#333', fontFamily: 'inherit',
    fontSize: '12px', cursor: 'pointer', padding: '0',
    letterSpacing: '0.04em', textDecoration: 'underline', alignSelf: 'flex-start' as const,
  },
  errorText: { color: '#555', fontSize: '14px', margin: 0 },
};
