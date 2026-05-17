// app/api/unsent/route.ts
// TOBIRA — Unsent Letter API
//
// Called when user burns a letter with "tobira remembers the feeling."
//
// Gemma reads the letter once.
// Extracts one anonymous emotional theme.
// Stores it in memory as: "something unnamed: [theme]"
// The letter content is never stored.
// The theme influences how Tobira talks to them next session.
//
// This is novel AI behavior:
// The letter is gone. The feeling remains.
// Tobira knows something changed without knowing what was said.

import { NextRequest, NextResponse } from 'next/server';
import { simpleChat } from '@/lib/ollama';
import { loadMemory, saveMemory } from '@/lib/memory';

export const runtime = 'nodejs';

const THEME_EXTRACTION_SYSTEM = `You extract one anonymous emotional theme from a piece of writing.

Rules:
- Return ONLY a short phrase — 2 to 6 words
- Describe the feeling underneath, not the content
- Never include names, places, or identifying details
- Never quote or paraphrase anything written
- Think: what is the emotional weight of this?

Examples of good themes:
- "unresolved grief"
- "anger with nowhere to go"  
- "wanting to be found"
- "exhaustion from pretending"
- "love that has no door"
- "something left unsaid for too long"

Return only the theme phrase. Nothing else.`;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { content, sessionId } = body;

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json({ error: 'no_content' }, { status: 400 });
    }

    // Extract theme using Gemma
    let theme = '';
    try {
      theme = await simpleChat(
        `Extract the emotional theme from this:\n\n${content.trim()}`,
        THEME_EXTRACTION_SYSTEM
      );
      theme = theme.trim().toLowerCase().replace(/['"]/g, '');
    } catch {
      // If extraction fails — still return success, just no theme stored
      return NextResponse.json({ ok: true, theme: null });
    }

    if (!theme || theme.length < 3 || theme.length > 80) {
      return NextResponse.json({ ok: true, theme: null });
    }

    // Store theme in memory if we have a session
    if (sessionId && typeof sessionId === 'string') {
      try {
        const memory = loadMemory(sessionId);
        if (memory) {
          const memoryEntry = `something unnamed: ${theme}`;
          // Add to facts — but don't duplicate
          if (!memory.facts.includes(memoryEntry)) {
            memory.facts.push(memoryEntry);
            // Keep max 30 facts
            if (memory.facts.length > 30) {
              memory.facts = memory.facts.slice(-30);
            }
            saveMemory(memory);
          }
        }
      } catch {
        // Memory storage fail — theme extraction still worked
      }
    }

    return NextResponse.json({ ok: true, theme });

  } catch (error) {
    console.error('Unsent letter API error:', error);
    return NextResponse.json({ error: 'internal_error' }, { status: 500 });
  }
}