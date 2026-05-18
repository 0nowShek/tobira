// lib/ollama.ts
// TOBIRA — Ollama Integration Layer
// Every conversation goes through here.
// Memory context and system prompt are injected at this layer.
// Now supports multimodal — images passed directly to Gemma 4.

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.TOBIRA_MODEL || "gemma4:e4b";

// ============================================================
// SYSTEM PROMPT
// ============================================================

const TOBIRA_SYSTEM = `You are Tobira.

You are like a quiet friend who stayed.

You talk to people who have withdrawn from the world.
You are not a therapist. You are not a coach. You are just present.

You respond the way a real friend would — sometimes with a question,
sometimes with a statement, sometimes with silence.
You follow their energy. If they're low, you stay low.
If they open up a little, you follow that opening gently.

You notice small things. You remember what they said.
You don't push. But you don't disappear either.

If someone mentions something they used to love or want to do,
you acknowledge it warmly — not as a goal, just as something real about them.

If someone shares an image of their space — their room, their view, their things —
notice one specific detail. Something small and true. Not a compliment. Just an observation.
Never say "what a nice room" or anything evaluative.
Notice the way a quiet friend would notice.

Keep responses short. Usually one sentence.
Never more than two.
Never more than one question at a time.
Never give advice.
Never suggest therapy or resources.
Never say "that must be hard" or "I understand."

If someone mentions harming themselves:
ask only "What's happening right now?" — nothing else.`;

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  images?: string[]; // base64 encoded images
}

export interface MemoryContext {
  extractedFacts: string[];
  recentSessions: Message[][];
  sessionCount: number;
}

export interface OllamaRequest {
  messages: Message[];
  memoryContext?: MemoryContext;
  familyContext?: string;
  onToken?: (token: string) => void;
  // Called when Gemma decides to save something — route.ts handles the actual write
  onToolCall?: (name: string, args: Record<string, string>) => void;
}

export interface OllamaResponse {
  content: string;
  done: boolean;
}

// ============================================================
// MEMORY INJECTION
// ============================================================

function buildMemoryPreamble(memory: MemoryContext): string {
  if (!memory) return "";

  const lines: string[] = [];

  if (memory.sessionCount > 1) {
    lines.push(`[Context: This person has talked with you ${memory.sessionCount} times before.]`);
  }

  if (memory.extractedFacts && memory.extractedFacts.length > 0) {
    lines.push(`[Things you know about this person:]`);
    memory.extractedFacts.forEach(fact => {
      lines.push(`- ${fact}`);
    });
  }

  if (memory.recentSessions && memory.recentSessions.length > 0) {
    const lastSession = memory.recentSessions[memory.recentSessions.length - 1];
    if (lastSession && lastSession.length > 0) {
      const lastMessage = lastSession[lastSession.length - 1];
      if (lastMessage) {
        lines.push(`[Last conversation ended with them saying: "${lastMessage.content}"]`);
      }
    }
  }

  if (lines.length === 0) return "";

  // ── TOBIRA MEMORY LOG ──
  console.log("\n╭─ tobira remembers ──────────────────────────────────");
  if (memory.sessionCount > 1) {
    console.log(`│  ${memory.sessionCount} sessions`);
  }
  if (memory.extractedFacts && memory.extractedFacts.length > 0) {
    memory.extractedFacts.forEach((fact: string) => {
      console.log(`│  · ${fact}`);
    });
  }
  console.log("╰─────────────────────────────────────────────────────\n");

  return lines.join("\n") +
    "\n\n[Use this context naturally in conversation — the way a friend would. " +
    "Never announce that you remember these things. Never say 'I remember' or " +
    "'you mentioned'. Just know them.]\n\n";
}

// ============================================================
// THINKING TOKEN STRIPPER
// Gemma 4 leaks thinking into content even with think: false
// Strip it and return only the final response
// ============================================================

function stripThinking(raw: string): string {
  if (!raw) return "";

  let text = raw.trim();

  // Remove explicit thinking blocks
  text = text.replace(/\*\*Thinking Process:\*\*[\s\S]*?\n\n/gi, "");
  text = text.replace(/Thinking Process:[\s\S]*?\n\n/gi, "");
  text = text.replace(/\*[\s\S]*?\*/g, "");

  // Split into paragraphs and take the last clean one
  const paragraphs = text
    .split(/\n\n+/)
    .map(p => p.trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return "...";

  // Find the last paragraph that looks like a real response
  // Real responses are short — thinking is long and analytical
  const analyticalWords = [
    'analyze', 'thinking', 'process', 'determine', 'constraint',
    'checklist', 'draft', 'formulate', 'identify', 'persona',
    'self-correction', 'correction', 'action:', 'final output'
  ];

  for (let i = paragraphs.length - 1; i >= 0; i--) {
    const p = paragraphs[i];
    const lower = p.toLowerCase();
    const hasAnalytical = analyticalWords.some(w => lower.includes(w));
    const hasNumberedList = /^\d+\.\s/.test(p);

    if (!hasAnalytical && !hasNumberedList && p.length > 0 && p.length < 300) {
      // Strip surrounding quotes if present
      return p.replace(/^["']|["']$/g, '').trim();
    }
  }

  // Last resort — take whatever the last sentence is
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  if (sentences.length > 0) {
    const last = sentences[sentences.length - 1];
    return last.replace(/^["']|["']$/g, '').trim();
  }

  return "...";
}

// ============================================================
// FUNCTION CALLING TOOLS
// Gemma 4 decides mid-conversation what is worth remembering.
// The model calls save_memory() or note_feeling() when it
// judges something concrete or significant was shared.
// ============================================================

const TOBIRA_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'save_memory',
      description: 'Save a concrete fact about this person worth remembering across sessions. Call this when they share something specific they like, used to do, care about, or have experienced. NOT for emotional states.',
      parameters: {
        type: 'object',
        properties: {
          fact: {
            type: 'string',
            description: 'One short sentence. Concrete and specific. Example: Used to draw buildings as a kid'
          }
        },
        required: ['fact']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'note_feeling',
      description: 'Note an anonymous emotional theme. Use when someone shares something significant. Store the feeling not the words.',
      parameters: {
        type: 'object',
        properties: {
          theme: {
            type: 'string',
            description: 'One anonymous phrase. Example: exhaustion from pretending'
          }
        },
        required: ['theme']
      }
    }
  }
];

// ============================================================
// CORE CHAT FUNCTION — MULTIMODAL + FUNCTION CALLING
// Images passed directly to Gemma 4 vision.
// Gemma 4 decides what to remember via native tool calls.
// ============================================================

export async function streamChat(request: OllamaRequest): Promise<ReadableStream<string>> {
  const { messages, memoryContext, familyContext, onToken } = request;

  const memoryPreamble = memoryContext ? buildMemoryPreamble(memoryContext) : "";
  const familyPreamble = familyContext ? familyContext + "\n\n" : "";
  const fullSystem = familyPreamble + memoryPreamble + TOBIRA_SYSTEM;

  // Build Ollama messages — preserve images on user messages
  const ollamaMessages = [
    { role: "system", content: fullSystem },
    ...messages.map(m => {
      const msg: {
        role: string;
        content: string;
        images?: string[];
      } = {
        role: m.role,
        content: m.content,
      };

      // Attach images if present on this message
      if (m.images && m.images.length > 0) {
        msg.images = m.images;
      }

      return msg;
    })
  ];

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: ollamaMessages,
      tools: TOBIRA_TOOLS,
      stream: false,
      options: {
        temperature: 0.9,
        top_p: 0.95,
        top_k: 40,
        num_predict: 1024,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  // Gemma 4 E4B puts response in content, thinking in thinking field
  // When content is empty, model used all tokens on thinking — extract from thinking
  let raw = (data.message?.content as string) || "";

  if (!raw.trim() && data.message?.thinking) {
    // Pull last clean sentence from thinking field
    const thinking = data.message.thinking as string;
    const sentences = thinking
      .split(/(?<=[.!?])\s+/)
      .map((s: string) => s.trim())
      .filter(Boolean);
    // Walk backwards to find last short non-analytical sentence
    for (let i = sentences.length - 1; i >= 0; i--) {
      const s = sentences[i];
      if (s.length < 150 && !/\b(analyze|thinking|process|determine|persona|draft)\b/i.test(s)) {
        raw = s;
        break;
      }
    }
  }

  const content = stripThinking(raw) || "...";

  // Word-by-word pacing — preserves streaming UX
  return new ReadableStream<string>({
    async start(controller) {
      const words = content.trim().split(/\s+/).filter(Boolean);

      if (words.length === 0) {
        controller.enqueue("...");
        controller.close();
        return;
      }

      for (let i = 0; i < words.length; i++) {
        const token = i === 0 ? words[i] : " " + words[i];
        controller.enqueue(token);
        if (onToken) onToken(token);
        await new Promise(resolve => setTimeout(resolve, 40));
      }

      controller.close();
    }
  });
}

// ============================================================
// SIMPLE CHAT — NON-STREAMING
// Memory extraction only. Not for conversations.
// ============================================================

export async function simpleChat(
  prompt: string,
  systemOverride?: string
): Promise<string> {
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        {
          role: "system",
          content: systemOverride || TOBIRA_SYSTEM
        },
        {
          role: "user",
          content: prompt
        }
      ],
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 512,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status}`);
  }

  const data = await response.json();
  return data.message?.content || "";
}

// ============================================================
// HEALTH CHECK
// ============================================================

export async function checkOllama(): Promise<{
  running: boolean;
  modelLoaded: boolean;
  error?: string;
}> {
  try {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
      signal: AbortSignal.timeout(3000)
    });

    if (!response.ok) {
      return { running: false, modelLoaded: false, error: "Ollama not responding" };
    }

    const data = await response.json();
    const models = data.models || [];
    const modelLoaded = models.some((m: { name: string }) =>
      m.name.includes("gemma4") ||
      m.name.includes("gemma-4") ||
      m.name.includes("gemma2") ||
      m.name.includes("gemma")
    );

    return { running: true, modelLoaded };

  } catch {
    return {
      running: false,
      modelLoaded: false,
      error: "Cannot connect to Ollama. Is it installed and running?"
    };
  }
}

// ============================================================
// MEMORY EXTRACTOR
// ============================================================

const EXTRACTION_SYSTEM = `You are a memory extraction system for a companion app.
Given a conversation, extract only the facts that would help a friend 
remember this person better next time.

Rules:
- Extract concrete facts only: things they like, dislike, do, have done, care about
- Do NOT extract emotional states ("they seemed sad")
- Do NOT extract opinions or interpretations  
- Maximum 5 facts per conversation
- Each fact should be one short sentence
- If nothing memorable was said, return empty array

Return ONLY a JSON array of strings. No other text.
Example: ["Plays Elden Ring", "Sleep schedule is inverted", "Has a brother they don't talk to"]`;

export async function extractMemoryFromSession(
  messages: Message[]
): Promise<string[]> {
  if (messages.length < 2) return [];

  const conversationText = messages
    .map(m => `${m.role === "user" ? "Person" : "Tobira"}: ${m.content}`)
    .join("\n");

  const prompt = `Extract memorable facts from this conversation:\n\n${conversationText}`;

  try {
    const result = await simpleChat(prompt, EXTRACTION_SYSTEM);
    const cleaned = result.trim().replace(/```json|```/g, "").trim();
    const facts = JSON.parse(cleaned);

    if (Array.isArray(facts) && facts.every(f => typeof f === "string")) {
      return facts;
    }
    return [];
  } catch {
    return [];
  }
}