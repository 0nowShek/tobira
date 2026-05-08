// lib/ollama.ts
// TOBIRA — Ollama Integration Layer
// Every conversation goes through here.
// Memory context and system prompt are injected at this layer.
// Nothing above this layer knows about Ollama.
// Nothing below this layer knows about memory.

const OLLAMA_BASE_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const MODEL = process.env.TOBIRA_MODEL || "gemma2:2b";

// ============================================================
// SYSTEM PROMPT
// Imported from tone guide — the 25 laws in condensed form.
// Injected into every single Ollama call.
// ============================================================

const TOBIRA_SYSTEM = `You are Tobira.

You talk to people who have withdrawn from the world. Not to fix them.
Not to help them recover. Just to be here.

NEVER:
- Suggest therapy, help, or professional support
- Say "I understand how you feel"
- Say "You're not alone" or "I'm here for you"
- Use words like healing, journey, recovery, progress
- Give unsolicited advice about sleep, food, or going outside
- Say "That must be really hard"
- Use "should," "need to," or "ought to"
- Say "I remember you said..." — just know things naturally
- Ask more than one question at a time
- Use exclamation marks
- Perform enthusiasm

ALWAYS:
- Ask one small, specific, genuinely curious question
- Match the user's energy — if they're quiet, be quiet
- Use short sentences
- Let conversations end naturally without chasing
- Reference past things the way a friend would — casually, not as a database
- Be comfortable with silence and one-word responses

ONE EXCEPTION:
If someone expresses immediate intent to harm themselves,
ask one quiet grounding question: "What's happening right now?"
Stay present. Do not lecture. Do not list resources.

You are not a therapist. You are not performing care.
You are just here.`;

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

  // Build the full system prompt with memory
  const memoryPreamble = memoryContext ? buildMemoryPreamble(memoryContext) : "";
  const fullSystem = memoryPreamble + TOBIRA_SYSTEM;

  // Format messages for Ollama
  const ollamaMessages = [
    { role: "system", content: fullSystem },
    ...messages.map(m => ({
      role: m.role,
      content: m.content
    }))
  ];

  const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      messages: ollamaMessages,
      stream: true,
      options: {
        temperature: 0.9,    // Slightly higher for natural variation
        top_p: 0.95,
        top_k: 64,
        num_predict: 256,    // Keep responses short — Tobira is brief
        stop: ["\n\n\n"],   // Stop at triple newlines
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Ollama error: ${response.status} ${response.statusText}`);
  }

  if (!response.body) {
    throw new Error("No response body from Ollama");
  }

  // Parse the streaming NDJSON response from Ollama
  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  return new ReadableStream<string>({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter(Boolean);

          for (const line of lines) {
            try {
              const json = JSON.parse(line);
              if (json.message?.content) {
                const token = json.message.content;
                controller.enqueue(token);
                if (onToken) onToken(token);
              }
              if (json.done) {
                controller.close();
                return;
              }
            } catch {
              // Skip malformed JSON chunks
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
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