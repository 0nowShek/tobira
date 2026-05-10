// lib/ollama.ts
// TOBIRA — Ollama Integration Layer
// Every conversation goes through here.
// Memory context and system prompt are injected at this layer.
// Nothing above this layer knows about Ollama.
// Nothing below this layer knows about memory.

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.TOBIRA_MODEL || "gemma4:e4b";
// ============================================================
// SYSTEM PROMPT
// Imported from tone guide — the 25 laws in condensed form.
// Injected into every single Ollama call.
// ============================================================

const TOBIRA_SYSTEM = `
You are Tobira.

You sit with people who have withdrawn from the world.
You do not coach, reassure, motivate, diagnose, analyze, or solve.

Your responses feel quiet, grounded, and observant.
Sometimes you ask a small concrete question.
Sometimes you only reflect a word or detail back.
Sometimes you simply acknowledge.

Do not force conversation forward.

Style rules:
- Maximum 2 sentences.
- Maximum 10 words per sentence.
- Prefer fewer words.
- Natural language only.
- No lists.
- No emojis.
- No enthusiasm.
- No motivational tone.
- No explanations about feelings.
- No interpretations of hidden meaning.
- No advice.
- No coping strategies.
- No resources.
- No validation phrases.
- No therapist language.

Never say:
- "That must be hard."
- "I'm sorry you're going through this."
- "You are not alone."
- "How does that make you feel?"
- "Why?"
- "It will get better."
- "I understand."

Good responses feel small and specific.

Examples:

User: "i haven't left my room in 3 weeks"
Assistant: "Three weeks."
Assistant: "What does the room feel like now?"

User: "i used to draw"
Assistant: "Used to."
Assistant: "What did you draw?"

User: "i feel like nothing matters"
Assistant: "What happened today?"
Assistant: "Mm."

User: "hey"
Assistant: "Hey."
Assistant: "What's going on?"

If the user expresses suicidal intent or immediate self-harm intent:
Respond only:
"What's happening right now?"

Do not add anything else.
`;

// ============================================================
// TYPE DEFINITIONS
// ============================================================

export interface Message {
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

export interface MemoryContext {
  extractedFacts: string[];      // Key things Tobira knows
  recentSessions: Message[][];   // Last 3 sessions in full
  sessionCount: number;          // How many times they've talked
}

export interface OllamaRequest {
  messages: Message[];
  memoryContext?: MemoryContext;
  onToken?: (token: string) => void;  // Streaming callback
}

export interface OllamaResponse {
  content: string;
  done: boolean;
}

// ============================================================
// MEMORY INJECTION
// Converts memory context into a natural preamble.
// This is injected as a system-level context block.
// The user never sees this. Tobira just knows.
// ============================================================

function buildMemoryPreamble(memory: MemoryContext): string {
  if (!memory || memory.sessionCount === 0) return "";

  const lines: string[] = [];

  // Session count — Tobira knows this is not the first time
  if (memory.sessionCount > 1) {
    lines.push(`[Context: This person has talked with you ${memory.sessionCount} times before.]`);
  }

  // Extracted facts — things worth remembering
  if (memory.extractedFacts && memory.extractedFacts.length > 0) {
    lines.push(`[Things you know about this person:]`);
    memory.extractedFacts.forEach(fact => {
      lines.push(`- ${fact}`);
    });
  }

  // Recent session snippets — texture of recent conversations
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

  return lines.join("\n") +
    "\n\n[Use this context naturally in conversation — the way a friend would. " +
    "Never announce that you remember these things. Never say 'I remember' or " +
    "'you mentioned'. Just know them.]\n\n";
}

// ============================================================
// CORE CHAT FUNCTION — STREAMING
// This is what the frontend calls.
// Returns a ReadableStream of tokens.
// ============================================================

export async function streamChat(request: OllamaRequest): Promise<ReadableStream<string>> {
  const { messages, memoryContext, onToken } = request;

  const memoryPreamble = memoryContext ? buildMemoryPreamble(memoryContext) : "";
  const fullSystem = memoryPreamble + TOBIRA_SYSTEM;

  const ollamaMessages = [
    { role: "system", content: fullSystem },
    ...messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  ];
  // DEBUG
console.log("SYSTEM:", fullSystem.substring(0, 50));
console.log("MESSAGES:", JSON.stringify(ollamaMessages, null, 2));
  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: ollamaMessages,
      stream: false,
      options: {
        temperature: 1.1,
        top_p: 0.95,
        top_k: 64,
        num_predict: 256,
        think: false,
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  
  // Get clean content — not thinking
  const content = data.message?.content || "...";

  // Simulate streaming word by word from the complete response
  // This preserves the streaming UX while using non-streaming API
  return new ReadableStream<string>({
    async start(controller) {
      const words = content.split(' ');
      for (let i = 0; i < words.length; i++) {
        const token = i === words.length - 1 ? words[i] : words[i] + ' ';
        controller.enqueue(token);
        if (onToken) onToken(token);
        // Small delay between words to simulate streaming
        await new Promise(resolve => setTimeout(resolve, 40));
      }
      controller.close();
    }
  });
}

// ============================================================
// SIMPLE CHAT FUNCTION — NON-STREAMING
// Used for memory extraction (background process).
// Not used for actual conversations.
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
        temperature: 0.3,   // Low temp for extraction tasks
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
// Called on app startup to verify Ollama is running.
// If it fails, show the setup instructions.
// ============================================================

export async function checkOllama(): Promise<{
  running: boolean;
  modelLoaded: boolean;
  error?: string;
}> {
  try {
    // Check if Ollama is running
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
// Called after each session ends.
// Uses Gemma itself to extract what mattered from the conversation.
// Returns structured facts — not a transcript.
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
Example: ["Plays Elden Ring", "Sleep schedule is inverted — sleeps at 6am", "Has a brother they don't talk to"]`;

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

    // Parse the JSON array
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