// app/api/tts/route.ts
// TOBIRA — Text-to-Speech proxy
// ElevenLabs API key stays server-side. Client sends text, receives audio/mpeg.

import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const MAX_CHARS = 4_000;
const UPSTREAM_URL = "https://api.elevenlabs.io";

function configured(): boolean {
  return Boolean(
    process.env.ELEVENLABS_API_KEY?.trim() && process.env.ELEVENLABS_VOICE_ID?.trim(),
  );
}

export async function GET() {
  return NextResponse.json({ enabled: configured() });
}

export async function POST(req: NextRequest) {
  if (!configured()) {
    return NextResponse.json({ error: "tts_not_configured" }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const text =
    typeof body === "object" &&
    body !== null &&
    "text" in body &&
    typeof (body as { text: unknown }).text === "string"
      ? (body as { text: string }).text.trim()
      : "";

  if (!text.length) {
    return NextResponse.json({ error: "missing_text" }, { status: 400 });
  }
  if (text.length > MAX_CHARS) {
    return NextResponse.json({ error: "text_too_long" }, { status: 413 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY!.trim();
  const voiceId = process.env.ELEVENLABS_VOICE_ID!.trim();
  const modelId =
    process.env.ELEVENLABS_MODEL_ID?.trim() || "eleven_multilingual_v2";

  // Proxy to ElevenLabs — response body streamed back unchanged
  const upstream = await fetch(
    `${UPSTREAM_URL}/v1/text-to-speech/${encodeURIComponent(voiceId)}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: modelId,
        voice_settings: {
          stability: 0.55,
          similarity_boost: 0.72,
          style: 0,
          use_speaker_boost: true,
        },
      }),
    },
  );

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    return NextResponse.json(
      {
        error: "upstream_error",
        status: upstream.status,
        detail: detail.slice(0, 512),
      },
      { status: 502 },
    );
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Cache-Control": "no-store",
    },
  });
}
