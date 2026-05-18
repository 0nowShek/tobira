// lib/familyBridge.ts
// TOBIRA — Family Bridge Injector
//
// This is the sensitive part.
// Family messages don't pop up as notifications.
// They don't appear as "you have a message from your brother."
// They enter the conversation the way a friend might reference
// something they heard — naturally, gently, without agenda.
//
// The injector adds family context to the memory preamble.
// Gemma decides when and how to surface it.
// It might take three sessions before it comes up.
// That's fine. That's human.

interface FamilyMessage {
    id: string;
    from: string;
    content: string;
    timestamp: number;
    surfaced: boolean;
  }
  
  export async function getFamilyContext(
    sessionId: string
  ): Promise<{ context: string; messageIds: string[] }> {
    try {
      const response = await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'fetch_unsurfaced',
          sessionId,
        }),
      });
  
      if (!response.ok) return { context: '', messageIds: [] };
  
      const data = await response.json();
      const messages: FamilyMessage[] = data.messages || [];
  
      if (messages.length === 0) return { context: '', messageIds: [] };
  
      // Build context block for Gemma
      // Phrased as background knowledge, not as messages to deliver
      const contextLines = messages.map(m => {
        const from = m.from || 'someone close to them';
        return `[Someone who cares about this person (${from}) wanted you to know: "${m.content}"]`;
      });
  
      const context = contextLines.join('\n') +
        '\n[Surface this naturally in conversation when relevant. ' +
        'Do not announce it as a message. Do not say "someone left you a note." ' +
        'Just let it inform how you talk with them.]';
  
      return {
        context,
        messageIds: messages.map(m => m.id),
      };
  
    } catch {
      return { context: '', messageIds: [] };
    }
  }
  
  export async function markFamilyMessagesSurfaced(
    sessionId: string,
    messageIds: string[]
  ): Promise<void> {
    if (messageIds.length === 0) return;
    try {
      await fetch('/api/family', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_surfaced',
          sessionId,
          messageIds,
        }),
      });
    } catch {
      // Silent fail
    }
  }
  
  // Share link for settings drawer — family opens /family?for=<base64 session id>
  export function generateShareLink(sessionId: string): string {
    const baseUrl = window.location.origin;
    const encoded = btoa(sessionId).replace(/=/g, '');
    return `${baseUrl}/family?for=${encoded}`;
  }