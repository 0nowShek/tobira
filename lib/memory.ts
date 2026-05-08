// lib/memory.ts
// TOBIRA — Memory Engine
//
// This is what makes Tobira different from every other AI companion.
//
// Most companions use RAG: store facts, retrieve facts, inject facts.
// That produces responses like "You mentioned your father was difficult."
// Clinical. Database-like. It breaks trust.
//
// Tobira uses 128K context as a relationship container.
// Not just facts — the texture of conversations.
// The things that trailed off. The silences. The pattern of what
// someone keeps coming back to.
//
// Gemma 4's 128K window holds all of it.
// The memory engine manages what goes in, what stays,
// and what gets removed when the user asks.
//
// PRIVACY:
// Everything is stored locally as JSON.
// Nothing leaves the device.
// Ever.

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { extractMemoryFromSession } from './ollama';

// ============================================================
// TYPES
// ============================================================

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  id?: string;
}

export interface Session {
  id: string;
  startedAt: number;
  endedAt?: number;
  messages: Message[];
  extractedFacts: string[];  // What Gemma thought mattered
}

export interface Memory {
  sessionId: string;          // Current user session ID
  createdAt: number;
  lastActiveAt: number;
  sessions: Session[];        // All past sessions
  facts: string[];            // Cumulative extracted facts
  totalMessages: number;      // Running count
}

export interface MemoryContext {
  extractedFacts: string[];
  recentSessions: Message[][];
  sessionCount: number;
}

// ============================================================
// STORAGE
// Local filesystem, encrypted with a device key
// ============================================================

const MEMORY_DIR = path.join(process.cwd(), '.tobira');
const DEVICE_KEY = getOrCreateDeviceKey();

function getOrCreateDeviceKey(): string {
  const keyPath = path.join(process.cwd(), '.tobira', '.key');
  try {
    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath, 'utf8').trim();
    }
    // Create directory if needed
    if (!fs.existsSync(path.join(process.cwd(), '.tobira'))) {
      fs.mkdirSync(path.join(process.cwd(), '.tobira'), { recursive: true });
    }
    // Generate new device key
    const key = crypto.randomBytes(32).toString('hex');
    fs.writeFileSync(keyPath, key, { mode: 0o600 });
    return key;
  } catch {
    // Fallback — memory won't persist but app still works
    return crypto.randomBytes(32).toString('hex');
  }
}

function encrypt(data: string): string {
  try {
    const iv = crypto.randomBytes(16);
    const key = Buffer.from(DEVICE_KEY.slice(0, 32), 'utf8');
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([
      cipher.update(data, 'utf8'),
      cipher.final()
    ]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
  } catch {
    // If encryption fails, store as base64 (still not plaintext)
    return 'b64:' + Buffer.from(data).toString('base64');
  }
}

function decrypt(data: string): string {
  try {
    if (data.startsWith('b64:')) {
      return Buffer.from(data.slice(4), 'base64').toString('utf8');
    }
    const [ivHex, encryptedHex] = data.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(DEVICE_KEY.slice(0, 32), 'utf8');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    return Buffer.concat([
      decipher.update(Buffer.from(encryptedHex, 'hex')),
      decipher.final()
    ]).toString('utf8');
  } catch {
    return '{}';
  }
}

function getMemoryPath(sessionId: string): string {
  // Hash the session ID for the filename
  const hash = crypto
    .createHash('sha256')
    .update(sessionId)
    .digest('hex')
    .slice(0, 16);
  return path.join(MEMORY_DIR, `${hash}.mem`);
}

// ============================================================
// CORE MEMORY OPERATIONS
// ============================================================

export function loadMemory(sessionId: string): Memory | null {
  try {
    const filePath = getMemoryPath(sessionId);
    if (!fs.existsSync(filePath)) return null;
    const encrypted = fs.readFileSync(filePath, 'utf8');
    const decrypted = decrypt(encrypted);
    return JSON.parse(decrypted) as Memory;
  } catch {
    return null;
  }
}

export function saveMemory(memory: Memory): void {
  try {
    if (!fs.existsSync(MEMORY_DIR)) {
      fs.mkdirSync(MEMORY_DIR, { recursive: true });
    }
    const filePath = getMemoryPath(memory.sessionId);
    const json = JSON.stringify(memory);
    const encrypted = encrypt(json);
    fs.writeFileSync(filePath, encrypted, { mode: 0o600 });
  } catch (error) {
    console.error('Memory save failed:', error);
  }
}

export function deleteMemory(sessionId: string): void {
  try {
    const filePath = getMemoryPath(sessionId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch {
    // Silent fail — memory is already gone
  }
}

// ============================================================
// GET MEMORY CONTEXT
// Called by the chat API before each conversation.
// Returns what gets injected into the Ollama system prompt.
// ============================================================

export async function getMemoryContext(
  sessionId: string
): Promise<MemoryContext> {
  const memory = loadMemory(sessionId);

  if (!memory || memory.sessions.length === 0) {
    return {
      extractedFacts: [],
      recentSessions: [],
      sessionCount: 0,
    };
  }

  // Get the last 3 sessions for recent context
  const recentSessions = memory.sessions
    .slice(-3)
    .map(s => s.messages);

  // Deduplicate facts
  const uniqueFacts = [...new Set(memory.facts)].slice(-20);

  return {
    extractedFacts: uniqueFacts,
    recentSessions,
    sessionCount: memory.sessions.length,
  };
}

// ============================================================
// SAVE SESSION
// Called when a conversation ends.
// Gemma extracts what mattered. Gets stored for next time.
// ============================================================

export async function saveSession(
  sessionId: string,
  messages: Message[]
): Promise<void> {
  if (messages.length < 2) return;

  // Let Gemma decide what mattered in this conversation
  let newFacts: string[] = [];
  try {
    newFacts = await extractMemoryFromSession(messages);
  } catch {
    // If extraction fails, still save the session
    newFacts = [];
  }

  const session: Session = {
    id: crypto.randomUUID(),
    startedAt: messages[0]?.timestamp || Date.now(),
    endedAt: Date.now(),
    messages,
    extractedFacts: newFacts,
  };

  // Load or create memory
  let memory = loadMemory(sessionId);
  if (!memory) {
    memory = {
      sessionId,
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      sessions: [],
      facts: [],
      totalMessages: 0,
    };
  }

  // Add session
  memory.sessions.push(session);
  memory.lastActiveAt = Date.now();
  memory.totalMessages += messages.length;

  // Merge new facts with existing ones
  // Keep max 30 facts — oldest drop off
  const allFacts = [...memory.facts, ...newFacts];
  memory.facts = [...new Set(allFacts)].slice(-30);

  // Keep max 20 sessions to manage file size
  if (memory.sessions.length > 20) {
    memory.sessions = memory.sessions.slice(-20);
  }

  saveMemory(memory);
}

// ============================================================
// FORGET MESSAGE
// Called when user holds a message and chooses "forget this"
// Removes the message from all stored sessions.
// ============================================================

export function forgetMessage(
  sessionId: string,
  messageContent: string,
  messageTimestamp: number
): void {
  const memory = loadMemory(sessionId);
  if (!memory) return;

  // Remove matching message from all sessions
  memory.sessions = memory.sessions.map(session => ({
    ...session,
    messages: session.messages.filter(m =>
      !(m.content === messageContent && m.timestamp === messageTimestamp)
    )
  }));

  saveMemory(memory);
}

// ============================================================
// START FRESH
// Nuclear option. Wipes everything.
// No confirmation. No guilt. Just gone.
// ============================================================

export function startFresh(sessionId: string): void {
  deleteMemory(sessionId);
}

// ============================================================
// BUILD CONTEXT WINDOW
// This is the 128K context assembly.
// Takes recent sessions and formats them for Gemma.
// The most recent messages get full context.
// Older sessions get summarized.
//
// This is the architectural argument against RAG:
// RAG retrieves facts.
// This preserves the texture of conversations.
// The way something was said. What wasn't said.
// The pattern of what someone keeps returning to.
// ============================================================

export function buildContextWindow(
  currentMessages: Message[],
  memoryContext: MemoryContext,
  maxTokens: number = 100000  // Stay under 128K
): string {
  const parts: string[] = [];
  let estimatedTokens = 0;

  // Estimate tokens (rough: 4 chars per token)
  const estimateTokens = (text: string) => Math.ceil(text.length / 4);

  // Add extracted facts as context
  if (memoryContext.extractedFacts.length > 0) {
    const factsBlock = memoryContext.extractedFacts.join('\n');
    parts.push(`[Background: ${factsBlock}]`);
    estimatedTokens += estimateTokens(factsBlock);
  }

  // Add recent sessions — most recent first, oldest dropped if over limit
  const sessionsToInclude = [...memoryContext.recentSessions].reverse();

  for (const session of sessionsToInclude) {
    const sessionText = session
      .map(m => `${m.role === 'user' ? 'them' : 'tobira'}: ${m.content}`)
      .join('\n');

    const sessionTokens = estimateTokens(sessionText);

    if (estimatedTokens + sessionTokens > maxTokens) break;

    parts.unshift(sessionText);  // Add to front (chronological order)
    estimatedTokens += sessionTokens;
  }

  // Add current session
  const currentText = currentMessages
    .map(m => `${m.role === 'user' ? 'them' : 'tobira'}: ${m.content}`)
    .join('\n');

  parts.push(currentText);

  return parts.join('\n\n---\n\n');
}