// app/api/chat/route.ts
// TOBIRA — Chat API Route
// Frontend calls this. This calls Ollama.
// Streams tokens back as Server-Sent Events.

import { streamChat, checkOllama } from "@/lib/ollama";
import { getMemoryContext } from "@/lib/memory";
import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, sessionId } = body;

    if (!messages || !Array.isArray(messages)) {
      return new Response("Invalid messages", { status: 400 });
    }

    // Check Ollama is running
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

    // Load memory context for this session
    const memoryContext = sessionId 
      ? await getMemoryContext(sessionId)
      : undefined;

    // Stream response back as Server-Sent Events
    const stream = await streamChat({ messages, memoryContext });
    const reader = stream.getReader();

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
            // SSE format: data: <token>\n\n
            const sseData = `data: ${JSON.stringify({ token: value })}\n\n`;
            controller.enqueue(encoder.encode(sseData));
          }
        } catch (error) {
          controller.error(error);
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

// Health check endpoint
export async function GET() {
  const health = await checkOllama();
  return new Response(JSON.stringify(health), {
    headers: { "Content-Type": "application/json" }
  });
}