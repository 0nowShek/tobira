'use client';

// components/VoiceToggle.tsx
// TOBIRA — Voice Toggle
// Lives in the settings drawer.
// Three states: off, soft, quieter.
// No labels that make voice feel like a feature.
// Just presence or no presence.

import { VoiceMode } from '@/lib/voice';

export function VoiceToggle({
  mode,
  onChange,
  available,
}: {
  mode: VoiceMode;
  onChange: (mode: VoiceMode) => void;
  available: boolean;
}) {
  if (!available) return null;

  const next = (): VoiceMode => {
    if (mode === 'off') return 'soft';
    if (mode === 'soft') return 'quieter';
    return 'off';
  };

  const label = {
    off: 'voice  off',
    soft: 'voice  on',
    quieter: 'voice  quiet',
  }[mode];

  return (
    <button
      onClick={() => onChange(next())}
      style={{
        background: 'none',
        border: 'none',
        color: mode === 'off' ? '#2a2a2a' : '#555',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '12px',
        padding: '10px 20px',
        cursor: 'pointer',
        textAlign: 'left',
        letterSpacing: '0.04em',
        width: '100%',
        transition: 'color 0.3s ease',
      }}
    >
      {label}
    </button>
  );
}
