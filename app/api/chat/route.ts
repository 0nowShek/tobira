// app/api/chat/route.ts
// TOBIRA — Chat API Route
// Handles text and image messages.
// Streams tokens back as Server-Sent Events.
// Saves session to memory after each response.
// GET returns Ollama health + family notification status.

import { streamChat, checkOllama } from "@/lib/ollama";
import {
  getMemoryContext,
  loadMemory,
  saveMemory,
  saveSession,
  type Memory,
  type Message,
} from "@/lib/memory";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// FAMILY NOTIFICATION CHECK
// ============================================================

function getFamilyNotification(sessionId: string): {
  hasNew: boolean;
  count: number;
  hasUnsent: boolean;
} {
  try {
    const FAMILY_DIR = path.join(process.cwd(), ".tobira", "family");
    // Hashed filename — session id never appears on disk in plaintext
    const hash = crypto
      .createHash("sha256")
      .update(sessionId + "_family")
      .digest("hex")
      .slice(0, 16);
    const filePath = path.join(FAMILY_DIR, `${hash}.json`);

    if (!fs.existsSync(filePath)) {
      return { hasNew: false, count: 0, hasUnsent: false };
    }

    const data = JSON.parse(fs.readFileSync(filePath, "utf8")) as Array<{
      surfaced: boolean;
      type?: string;
    }>;

    // Only count messages FROM family — never unsent_letter
    const familyMessages = data.filter(
      m => !m.surfaced && (m.type === "message" || !m.type)
    );

    return {
      hasNew: familyMessages.length > 0,
      count: familyMessages.length,
      hasUnsent: false,
    };
  } catch {
    return { hasNew: false, count: 0, hasUnsent: false };
  }
}

// ============================================================
// POST — Chat endpoint
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages", { status: 400 });
    }

    const health = await checkOllama();
    if (!health.running) {
      return new Response(
        JSON.stringify({
          error: "ollama_not_running",
          message: health.error,
        }),
        { status: 503 }
      );
    }

    let memoryContext;
    try {
      memoryContext = sessionId
        ? await getMemoryContext(sessionId)
        : undefined;
    } catch {
      memoryContext = undefined;
    }

    const stream = await streamChat({
      messages,
      memoryContext,
      // Live memory writes when model calls save_memory / note_feeling (see lib/ollama.ts)
      onToolCall: (name, args) => {
        if (name === "save_memory" && args.fact && sessionId) {
          try {
            const memory: Memory = loadMemory(sessionId) ?? {
              sessionId,
              createdAt: Date.now(),
              lastActiveAt: Date.now(),
              sessions: [],
              facts: [],
              totalMessages: 0,
            };
            if (!memory.facts.includes(args.fact)) {
              memory.facts.push(args.fact);
              memory.facts = [...new Set(memory.facts)].slice(-30);
              memory.lastActiveAt = Date.now();
              saveMemory(memory);
              // ── TOOL CALL LOG ──
              console.log("\n╭─ tobira saved (live) ───────────────────────────────");
              console.log(`│  + ${args.fact}`);
              console.log("╰─────────────────────────────────────────────────────\n");
            }
          } catch { /* silent */ }
        }
        if (name === "note_feeling" && args.theme && sessionId) {
          try {
            const memory = loadMemory(sessionId);
            if (memory) {
              const theme = `[feeling: ${args.theme}]`;
              if (!memory.facts.includes(theme)) {
                memory.facts.push(theme);
                memory.facts = [...new Set(memory.facts)].slice(-30);
                saveMemory(memory);
                console.log("\n╭─ tobira noted (live) ───────────────────────────────");
                console.log(`│  ~ ${args.theme}`);
                console.log("╰─────────────────────────────────────────────────────\n");
              }
            }
          } catch { /* silent */ }
        }
      },
    });

    const reader = stream.getReader();
    let fullAssistantResponse = "";

    const sseStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              controller.enqueue(encoder.encode("data: [DONE]\n\n"));
              controller.close();
              break;
            }
            fullAssistantResponse += value;
            const sseData = `data: ${JSON.stringify({ token: value })}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }
        } catch (error) {
          controller.error(error);
        } finally {
          // Persist full turn after stream ends — separate from live tool-call saves above
          const assistantContent = fullAssistantResponse.trim();
          if (sessionId && assistantContent && assistantContent !== "...") {
            const messagesForStorage: Message[] = messages.map((m: {
              role: "user" | "assistant";
              content: string;
              timestamp: number;
              images?: string[];
            }) => ({
              role: m.role,
              content: m.images
                ? `[shared an image] ${m.content}`.trim()
                : m.content,
              timestamp: m.timestamp,
            }));

            const fullConversation: Message[] = [
              ...messagesForStorage,
              {
                role: "assistant",
                content: assistantContent,
                timestamp: Date.now(),
              },
            ];

            // ── SESSION SAVE LOG ──
            saveSession(sessionId, fullConversation)
              .then(() => {
                // Load memory to show what was extracted
                const mem = loadMemory(sessionId);
                if (mem && mem.facts.length > 0) {
                  console.log("\n╭─ tobira holds ──────────────────────────────────────");
                  mem.facts.slice(-5).forEach(f => {
                    console.log(`│  · ${f}`);
                  });
                  console.log("╰─────────────────────────────────────────────────────\n");
                }
              })
              .catch((err: Error) => {
                console.error("Memory save error:", err);
              });
          }
        }
      },
    });

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });

  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500 }
    );
  }
}

// ============================================================
// GET — Health check + family notification
// ============================================================

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const sessionId = searchParams.get("session");

  const health = await checkOllama();

  const family = sessionId
    ? getFamilyNotification(sessionId)
    : { hasNew: false, count: 0, hasUnsent: false };

  return new Response(
    JSON.stringify({ ...health, family }),
    { headers: { "Content-Type": "application/json" } }
  );
}