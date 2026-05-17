// app/api/family/route.ts
// TOBIRA — Family Bridge API
//
// THE DOOR GOES ONE WAY.
// Family can ADD messages only.
// Family cannot READ conversations.
// User controls what surfaces.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { NextRequest } from 'next/server';

const FAMILY_DIR = path.join(process.cwd(), '.tobira', 'family');

interface FamilyMessage {
  id: string;
  from: string;
  content: string;
  timestamp: number;
  surfaced: boolean;
  type?: 'message' | 'unsent_letter';
  allowRead?: boolean;
  familySeen?: boolean; // family has viewed this letter
}

function getFamilyPath(sessionId: string): string {
  const hash = crypto
    .createHash('sha256')
    .update(sessionId + '_family')
    .digest('hex')
    .slice(0, 16);
  return path.join(FAMILY_DIR, `${hash}.json`);
}

function loadFamilyMessages(sessionId: string): FamilyMessage[] {
  try {
    const filePath = getFamilyPath(sessionId);
    if (!fs.existsSync(filePath)) return [];
    return JSON.parse(fs.readFileSync(filePath, 'utf8')) as FamilyMessage[];
  } catch {
    return [];
  }
}

function saveFamilyMessages(sessionId: string, messages: FamilyMessage[]): void {
  try {
    if (!fs.existsSync(FAMILY_DIR)) {
      fs.mkdirSync(FAMILY_DIR, { recursive: true });
    }
    const filePath = getFamilyPath(sessionId);
    fs.writeFileSync(filePath, JSON.stringify(messages), { mode: 0o600 });
  } catch { /* silent */ }
}

function decodeSessionId(encoded: string): string {
  try {
    const decoded = Buffer.from(encoded, 'base64').toString('utf8');
    if (decoded.includes('-') && decoded.length > 30) return decoded;
    return encoded;
  } catch {
    return encoded;
  }
}

function formatAge(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  if (diffMins < 60) return diffMins <= 1 ? 'just now' : `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sessionId: rawSessionId, message } = body;

    if (!rawSessionId) {
      return new Response('Missing sessionId', { status: 400 });
    }

    const sessionId = rawSessionId.length > 40
      ? decodeSessionId(rawSessionId)
      : rawSessionId;

    switch (action) {

      case 'add': {
        if (!message) return new Response('Missing message', { status: 400 });
        const messages = loadFamilyMessages(sessionId);
        messages.push({ ...(message as FamilyMessage), type: 'message', surfaced: false });
        saveFamilyMessages(sessionId, messages.slice(-50));
        return new Response(JSON.stringify({ added: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'leave_at_door': {
        const { content, allowRead } = body as { content?: string; allowRead?: boolean };
        const messages = loadFamilyMessages(sessionId);
        messages.push({
          id: crypto.randomUUID(),
          from: 'unsent',
          content: allowRead ? (content || '') : '',
          timestamp: Date.now(),
          surfaced: false,
          type: 'unsent_letter',
          allowRead: allowRead ?? false,
          familySeen: false,
        });
        saveFamilyMessages(sessionId, messages.slice(-50));
        return new Response(JSON.stringify({ left: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'fetch_unsurfaced': {
        const allMessages = loadFamilyMessages(sessionId);
        const unsurfaced = allMessages.filter(
          m => !m.surfaced && (m.type === 'message' || !m.type)
        );
        return new Response(JSON.stringify({ messages: unsurfaced }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'check': {
        const allMessages = loadFamilyMessages(sessionId);
        const familyMessages = allMessages.filter(
          m => !m.surfaced && (m.type === 'message' || !m.type)
        );
        return new Response(JSON.stringify({
          hasNew: familyMessages.length > 0,
          count: familyMessages.length,
          hasUnsent: false,
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // ── FAMILY side check ──
      // Returns total count, new (unseen) count, seen count, and readable letters
      // Count never resets — accumulates as a quiet record of persistence
      case 'family_check': {
        const allMessages = loadFamilyMessages(sessionId);
        const unsentLetters = allMessages.filter(m => m.type === 'unsent_letter');

        const newLetters = unsentLetters.filter(m => !m.familySeen);
        const seenLetters = unsentLetters.filter(m => m.familySeen);
        const readable = newLetters.filter(m => m.allowRead && m.content);

        return new Response(JSON.stringify({
          hasLetter: unsentLetters.length > 0,
          totalCount: unsentLetters.length,
          newCount: newLetters.length,
          seenCount: seenLetters.length,
          hasReadable: readable.length > 0,
          letters: readable.map(m => ({
            id: m.id,
            content: m.content,
            timestamp: m.timestamp,
            age: formatAge(m.timestamp),
          })),
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // ── Mark unsent letters as seen by family ──
      // Does NOT remove them — count persists as a record
      case 'family_mark_seen': {
        const { letterIds } = body as { letterIds: string[] };
        if (!letterIds || !Array.isArray(letterIds)) {
          return new Response('Missing letterIds', { status: 400 });
        }
        const existing = loadFamilyMessages(sessionId);
        const updated = existing.map(m =>
          letterIds.includes(m.id) ? { ...m, familySeen: true } : m
        );
        saveFamilyMessages(sessionId, updated);
        return new Response(JSON.stringify({ marked: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      case 'mark_surfaced': {
        const { messageIds } = body as { messageIds: string[] };
        if (!messageIds || !Array.isArray(messageIds)) {
          return new Response('Missing messageIds', { status: 400 });
        }
        const existing = loadFamilyMessages(sessionId);
        const updated = existing.map(m =>
          messageIds.includes(m.id) ? { ...m, surfaced: true } : m
        );
        saveFamilyMessages(sessionId, updated);
        return new Response(JSON.stringify({ marked: true }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response('Unknown action', { status: 400 });
    }

  } catch (error) {
    console.error('Family API error:', error);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500 });
  }
}

export function generateFamilyLink(sessionId: string, baseUrl: string): string {
  return `${baseUrl}/family?for=${Buffer.from(sessionId).toString('base64')}`;
}

export function decodeFamilyLink(encoded: string): string {
  try { return Buffer.from(encoded, 'base64').toString('utf8'); } catch { return ''; }
}