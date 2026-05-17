// app/api/chat/route.ts
// TOBIRA — Chat API Route
// Handles text and image messages.
// Streams tokens back as Server-Sent Events.
// Saves session to memory after each response.
// GET returns Ollama health + family notification status.

import { streamChat, checkOllama } from "@/lib/ollama";
import { getMemoryContext, saveSession, type Message } from "@/lib/memory";
import { NextRequest } from "next/server";
import fs from "fs";
import path from "path";
import crypto from "crypto";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ============================================================
// FAMILY NOTIFICATION CHECK
// Reads family messages directly from filesystem.
// Called on every health check — lightweight, no API roundtrip.
// Returns only count metadata — never message content.
// ============================================================

function getFamilyNotification(sessionId: string): {
  hasNew: boolean;
  count: number;
  hasUnsent: boolean;
} {
  try {
    const FAMILY_DIR = path.join(process.cwd(), ".tobira", "family");
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

    const unsurfaced = data.filter(m => !m.surfaced);
    const hasUnsent = unsurfaced.some(m => m.type === "unsent_letter");

    // Only count messages FROM family — never unsent_letter (user → family direction)
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
// POST — Chat endpoint (unchanged)
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
          message: health.error
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

    const stream = await streamChat({ messages, memoryContext });
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

            saveSession(sessionId, fullConversation).catch(err => {
              console.error("Memory save error:", err);
            });
          }
        }
      }
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
// Accepts optional ?session= param to include family status.
// TobiraChat calls this on load with the session ID.
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