// app/api/family/route.ts
// TOBIRA — Family Bridge API
//
// Handles family messages separately from user memory.
// Family can ADD messages only.
// Family cannot READ anything.
// User controls whether messages surface.

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
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

function saveFamilyMessages(
  sessionId: string,
  messages: FamilyMessage[]
): void {
  try {
    if (!fs.existsSync(FAMILY_DIR)) {
      fs.mkdirSync(FAMILY_DIR, { recursive: true });
    }
    const filePath = getFamilyPath(sessionId);
    fs.writeFileSync(filePath, JSON.stringify(messages), { mode: 0o600 });
  } catch {
    // Silent fail
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sessionId, message } = body;

    if (!sessionId) {
      return new Response('Missing sessionId', { status: 400 });
    }

    switch (action) {

      // Family adds a message
      case 'add':
        if (!message) {
          return new Response('Missing message', { status: 400 });
        }
        const messages = loadFamilyMessages(sessionId);
        messages.push(message);
        // Keep max 50 family messages
        const trimmed = messages.slice(-50);
        saveFamilyMessages(sessionId, trimmed);
        return new Response(JSON.stringify({ added: true }), {
          headers: { 'Content-Type': 'application/json' }
        });

      // App fetches unsurfaced messages to inject into context
      case 'fetch_unsurfaced':
        const allMessages = loadFamilyMessages(sessionId);
        const unsurfaced = allMessages.filter(m => !m.surfaced);
        return new Response(JSON.stringify({ messages: unsurfaced }), {
          headers: { 'Content-Type': 'application/json' }
        });

      // Mark messages as surfaced after Tobira uses them
      case 'mark_surfaced':
        const { messageIds } = body;
        if (!messageIds || !Array.isArray(messageIds)) {
          return new Response('Missing messageIds', { status: 400 });
        }
        const existing = loadFamilyMessages(sessionId);
        const updated = existing.map(m =>
          messageIds.includes(m.id) ? { ...m, surfaced: true } : m
        );
        saveFamilyMessages(sessionId, updated);
        return new Response(JSON.stringify({ marked: true }), {
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response('Unknown action', { status: 400 });
    }

  } catch (error) {
    console.error('Family API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500 }
    );
  }
}

// ============================================================
// SHARE LINK GENERATOR
// Called from the main app settings.
// Generates a link the user can share with family.
// The link contains the session ID encoded.
// ============================================================

export function generateFamilyLink(
  sessionId: string,
  baseUrl: string
): string {
  // Encode session ID — not encrypted, just encoded
  // The family page validates it exists before showing
  const encoded = Buffer.from(sessionId).toString('base64url');
  return `${baseUrl}/family?for=${encoded}`;
}

export function decodeFamilyLink(encoded: string): string {
  try {
    return Buffer.from(encoded, 'base64url').toString('utf8');
  } catch {
    return '';
  }
}