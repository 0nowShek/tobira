// app/api/session/route.ts
// TOBIRA — Session Save Route
//
// Called by the frontend when:
// 1. User closes the app (beforeunload)
// 2. User clicks "start fresh"
// 3. A natural conversation pause (5 min inactivity)
//
// This triggers Gemma to extract what mattered
// and saves it to local encrypted storage.

import { saveSession, startFresh, forgetMessage } from '@/lib/memory';
import { NextRequest } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, sessionId, messages, messageContent, messageTimestamp } = body;

    if (!sessionId) {
      return new Response('Missing sessionId', { status: 400 });
    }

    switch (action) {

      // Save session — extract memory from this conversation
      case 'save':
        if (!messages || !Array.isArray(messages)) {
          return new Response('Missing messages', { status: 400 });
        }
        await saveSession(sessionId, messages);
        return new Response(JSON.stringify({ saved: true }), {
          headers: { 'Content-Type': 'application/json' }
        });

      // Start fresh — wipe everything
      case 'start_fresh':
        startFresh(sessionId);
        return new Response(JSON.stringify({ cleared: true }), {
          headers: { 'Content-Type': 'application/json' }
        });

      // Forget message — remove specific message from memory
      case 'forget_message':
        if (!messageContent || !messageTimestamp) {
          return new Response('Missing message data', { status: 400 });
        }
        forgetMessage(sessionId, messageContent, messageTimestamp);
        return new Response(JSON.stringify({ forgotten: true }), {
          headers: { 'Content-Type': 'application/json' }
        });

      default:
        return new Response('Unknown action', { status: 400 });
    }

  } catch (error) {
    console.error('Session API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500 }
    );
  }
}