// hooks/useSession.ts
// TOBIRA — Session Manager Hook
//
// Handles:
// - Auto-saving sessions when conversations pause
// - Saving on window close
// - Forget message calls
// - Start fresh

import { useEffect, useRef, useCallback } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function useSession(
  sessionId: string,
  messages: Message[]
) {
  const lastSaveRef = useRef<number>(0);
  const messagesRef = useRef<Message[]>(messages);
  const sessionIdRef = useRef<string>(sessionId);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep refs current
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    sessionIdRef.current = sessionId;
  }, [sessionId]);

  // Save session to memory
  const saveSession = useCallback(async (
    sid: string,
    msgs: Message[]
  ) => {
    if (msgs.length < 2) return;
    if (Date.now() - lastSaveRef.current < 30000) return; // Debounce 30s

    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save',
          sessionId: sid,
          messages: msgs,
        }),
      });
      lastSaveRef.current = Date.now();
    } catch {
      // Silent fail — memory is best-effort
    }
  }, []);

  // Auto-save after 5 minutes of inactivity
  useEffect(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }

    if (messages.length >= 2) {
      inactivityTimerRef.current = setTimeout(() => {
        saveSession(sessionIdRef.current, messagesRef.current);
      }, 5 * 60 * 1000); // 5 minutes
    }

    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [messages, saveSession]);

  // Save on window close
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (messagesRef.current.length >= 2) {
        // sendBeacon: fire-and-forget on tab close (no await; best-effort)
        const data = JSON.stringify({
          action: 'save',
          sessionId: sessionIdRef.current,
          messages: messagesRef.current,
        });
        navigator.sendBeacon('/api/session', data);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  // Forget a specific message
  const forgetMessage = useCallback(async (
    messageContent: string,
    messageTimestamp: number
  ) => {
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'forget_message',
          sessionId: sessionIdRef.current,
          messageContent,
          messageTimestamp,
        }),
      });
    } catch {
      // Silent fail
    }
  }, []);

  // Start fresh — wipe everything
  const clearMemory = useCallback(async () => {
    try {
      await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_fresh',
          sessionId: sessionIdRef.current,
        }),
      });
    } catch {
      // Silent fail
    }
  }, []);

  return { saveSession, forgetMessage, clearMemory };
}