// app/family/page.tsx
// TOBIRA — Family Bridge
//
// This is a separate interface for family members.
// It is intentionally different from the main chat UI —
// warmer, slightly more visible, but still quiet.
//
// WHAT FAMILY CAN DO:
// - Leave messages, context, small updates
// - Tell Tobira things that might help ("he used to love drawing")
// - Let the user know they're thinking of them
//
// WHAT FAMILY CANNOT DO:
// - Read any conversations
// - See what the user has said
// - Force anything into the conversation
//
// HOW IT WORKS:
// Family messages are stored separately.
// The main app checks for them and surfaces them
// through natural conversation — never as "you have a message."
// The user can also choose to never surface them at all.
//
// THE DOOR GOES ONE WAY.
// Family can knock. Only the user decides if it opens.

'use client';

import { useState, useEffect } from 'react';

interface FamilyMessage {
  id: string;
  from: string;
  content: string;
  timestamp: number;
  surfaced: boolean; // Has Tobira used this yet?
}

export default function FamilyBridge() {
  const [messages, setMessages] = useState<FamilyMessage[]>([]);
  const [from, setFrom] = useState('');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get the session ID from URL param or stored value
    const params = new URLSearchParams(window.location.search);
    const sid = params.get('for') || localStorage.getItem('tobira_family_session') || '';
    setSessionId(sid);
    setLoading(false);
  }, []);

  async function submitMessage() {
    if (!content.trim() || !sessionId) return;

    const message: FamilyMessage = {
      id: crypto.randomUUID(),
      from: from.trim() || 'someone who cares',
      content: content.trim(),
      timestamp: Date.now(),
      surfaced: false,
    };

    try {
      await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add',
          sessionId,
          message,
        }),
      });

      setSubmitted(true);
      setContent('');
    } catch {
      // Silent fail
    }
  }

  if (loading) {
    return <div style={styles.container} />;
  }

  if (!sessionId) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <p style={styles.errorText}>
            this link isn't valid.
          </p>
          <p style={styles.subText}>
            ask the person you're trying to reach to share their tobira link with you.
          </p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <p style={styles.sentText}>left.</p>
          <p style={styles.subText}>
            they'll see it when they're ready.
          </p>
          <button
            style={styles.anotherButton}
            onClick={() => setSubmitted(false)}
          >
            leave another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>

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

        {/* Examples — helps family know what to write */}
        <div style={styles.examples}>
          <p style={styles.examplesLabel}>some people write things like:</p>
          <p style={styles.example}>"he used to love drawing as a kid"</p>
          <p style={styles.example}>"i'm not angry. i just miss him."</p>
          <p style={styles.example}>"she liked that band, the one with the piano"</p>
          <p style={styles.example}>"i left food outside the door again. the good kind."</p>
        </div>

        {/* Submit */}
        <button
          style={{
            ...styles.submitButton,
            opacity: content.trim() ? 1 : 0.4,
          }}
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100dvh',
    backgroundColor: '#0d0d0d',
    padding: '40px 20px',
    fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
  },

  content: {
    width: '100%',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    gap: '32px',
  },

  header: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },

  title: {
    color: '#c8c8c8',
    fontSize: '18px',
    fontWeight: 300,
    letterSpacing: '0.02em',
  },

  subtitle: {
    color: '#555',
    fontSize: '12px',
    lineHeight: '1.6',
    letterSpacing: '0.02em',
  },

  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  label: {
    color: '#444',
    fontSize: '11px',
    letterSpacing: '0.08em',
    textTransform: 'lowercase',
  },

  input: {
    background: 'none',
    border: 'none',
    borderBottom: '1px solid #222',
    color: '#999',
    fontFamily: 'inherit',
    fontSize: '14px',
    padding: '8px 0',
    outline: 'none',
    caretColor: '#555',
    width: '100%',
  },

  textarea: {
    background: '#111',
    border: '1px solid #1e1e1e',
    color: '#aaa',
    fontFamily: 'inherit',
    fontSize: '14px',
    lineHeight: '1.7',
    padding: '16px',
    outline: 'none',
    resize: 'none',
    caretColor: '#555',
    width: '100%',
  },

  examples: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    padding: '16px',
    borderLeft: '1px solid #1e1e1e',
  },

  examplesLabel: {
    color: '#333',
    fontSize: '11px',
    marginBottom: '4px',
    letterSpacing: '0.04em',
  },

  example: {
    color: '#444',
    fontSize: '12px',
    lineHeight: '1.6',
    fontStyle: 'italic',
  },

  submitButton: {
    background: 'none',
    border: '1px solid #2a2a2a',
    color: '#777',
    fontFamily: 'inherit',
    fontSize: '13px',
    padding: '12px 24px',
    cursor: 'pointer',
    letterSpacing: '0.06em',
    alignSelf: 'flex-start',
    transition: 'opacity 0.2s',
  },

  sentText: {
    color: '#888',
    fontSize: '18px',
    letterSpacing: '0.02em',
  },

  subText: {
    color: '#444',
    fontSize: '12px',
    lineHeight: '1.6',
  },

  anotherButton: {
    background: 'none',
    border: 'none',
    color: '#444',
    fontFamily: 'inherit',
    fontSize: '12px',
    cursor: 'pointer',
    padding: '0',
    letterSpacing: '0.04em',
    textDecoration: 'underline',
    alignSelf: 'flex-start',
  },

  errorText: {
    color: '#666',
    fontSize: '14px',
  },
};