# tobira — 扉

A local-first AI companion for people who have withdrawn from the world.

Not a mental health chatbot. No recovery agenda. No pushing. It stays.

---

## The Problem

Hikikomori — severe social withdrawal lasting six months or more — affects 1.46 million people in Japan alone. The same pattern is documented across South Korea, Italy, Spain, and exists unnamed across the West. Post-COVID, millions more developed withdrawal patterns without meeting clinical criteria and without any tool designed for them.

The clinical research is consistent: direct intervention fails and frequently accelerates withdrawal. The only approach that doesn't make things worse is indirect, non-threatening presence with no recovery agenda. Every existing tool gets this wrong. They assume the person wants to recover.

Tobira doesn't assume anything. It's just there.

---

## Why Gemma 4

Three capabilities made Gemma 4 the only viable foundation:

**Local inference.** A person who has withdrawn from the world will not send their most vulnerable thoughts to a server they don't control. Local-first is not a deployment choice — it's the ethical prerequisite for this population. Gemma 4 runs on consumer hardware via Ollama.

**128K context window.** Most companions use RAG — retrieve facts, inject facts. That produces clinical, database-like responses that break trust. Tobira uses the 128K window as a relationship container. Not just what was said, but how. The things that trailed off. The pattern of what someone keeps returning to.

**Multimodal natively.** Someone in withdrawal doesn't always have words. Gemma 4 processes images and audio directly. A photo of their room. A voice note at 2am. The model responds to what it actually receives.

**Fine-tuneable.** Base Gemma 4 responds to "I haven't left my room in three weeks" with crisis resources. Fine-tuned Tobira responds: "Three weeks." The behavioral change required training, not prompting.

---

## Installation

### Requirements

- [Ollama](https://ollama.com) installed and running
- Node.js 18+

### Setup

```bash
git clone https://github.com/0nowShek/tobira.git
cd tobira
npm install

# Pull the model
ollama pull gemma4:e2b

# Configure
cp .env.example .env.local
```

`.env.local`:
```bash
TOBIRA_MODEL=gemma4:e2b
OLLAMA_URL=http://localhost:11434

# Optional — voice output
ELEVENLABS_API_KEY=your_key
ELEVENLABS_VOICE_ID=your_voice_id
```

```bash
npm run dev
```

Open [localhost:3000](http://localhost:3000).

### Using the Fine-Tuned Weights

```bash
ollama pull akadel/tobira-gemma4-e2b

# Update .env.local
TOBIRA_MODEL=akadel/tobira-gemma4-e2b
```

---

## Features

### Conversation

Tobira responds the way a quiet friend would — sometimes a question, sometimes a statement, sometimes nothing. It follows the user's energy. It never gives advice. It never suggests therapy. It never says "that must be hard."

The system prompt is 150 words. No rules. Just identity and posture. The fine-tuned weights reinforce this behavior at the model level so it holds under any input.

### Memory

After each session, Gemma extracts what mattered from the conversation — concrete facts, not emotional states — and stores them encrypted on the device. The next session, these facts are injected naturally into the context.

In session five, when the user mentions drawing, Tobira already knows. Not because it was told again. Because it remembers.

**Architecture:** AES-256 encrypted `.mem` files in `.tobira/`. Device key generated on first run, stored locally, never transmitted. Memory extraction uses `simpleChat()` with a structured extraction prompt, returns a JSON array of facts, deduplicates across sessions, keeps max 30 facts and 20 sessions.

**Why not RAG:** RAG retrieves facts. The 128K window preserves the texture of conversations — how something was said, what trailed off, the pattern of return. That distinction is the product argument.

### Multimodal Input

**Images:** Camera button in the input row. User selects a photo. Image encoded as base64, attached to the message, passed directly to Ollama's vision API. Gemma 4 responds to what it sees — one specific detail, the way a quiet friend would notice.

**Voice:** Hold the mic button. Web Speech API transcribes locally in the browser — no audio leaves the device. Words appear in the input field as they're spoken (interim results). Release to confirm. User can edit before sending.

### Voice Output

ElevenLabs TTS proxied through `/api/tts` — API key stays server-side, never reaches the browser. Sentences accumulate as tokens stream in and are synthesized in arrival order. Playback epoch system prevents stale audio from playing after the user sends a new message.

### Family Bridge

A one-way channel for family members.

Family opens a link (no account required), leaves context — things Tobira should know. "He used to love drawing as a kid." "I'm not angry. I just miss him." These are stored separately from the conversation and surfaced naturally by Tobira — never as "you have a message," just as something it knows.

A glowing dot appears next to the wordmark when family has left something. User chooses: see it directly, have Tobira summarize it, or ignore it until the moment feels right.

**The door goes one way. Family can knock. Only the user decides if it opens.**

### Unsent Letter

A room inside Tobira where Tobira is absent. The user writes what they cannot say. Three paths:

**Burn** — Gemma reads once, extracts one anonymous emotional theme, stores only that theme in memory, deletes the letter. The words are gone. The feeling remains.

**Burn completely** — requires finding a barely-visible link on the confirmation screen. Then an 8-second countdown timer that defaults to regular burn if it runs out. Nothing stored. The friction communicates weight.

**Leave at the door** — user chooses between letting family read it or sending only the notification that something was left. Two distinct acts. The user decides which.

This is the most technically simple feature and the most philosophically significant. An AI that deliberately absents itself from the most important moment a user might have. Engagement maximization in reverse.

### Silent Notification System

Two separate notification tracks that never cross:

**User side** — glowing dot next to wordmark. Populated only by messages of `type: 'message'` from family. Never populated by `type: 'unsent_letter'` (which flows the other direction). Clicking opens a panel: view original with timestamps, or have Tobira produce a one-sentence summary. Messages marked surfaced only after user views — not on panel open.

**Family side** — accumulating count of unsent letters left at the door. Count never resets — it's a record of persistence. `newCount` vs `seenCount` tracked separately. "5 things were left at the door · 1 new." After viewing: count stays, new badge clears.

---

## Architecture

```
User device:
  Next.js PWA (localhost:3000)
  └── Gemma 4 E2B via Ollama (localhost:11434)
  └── .tobira/
      ├── {session_hash}.mem   ← AES-256 encrypted memory
      ├── family/{hash}.json   ← family messages
      └── .key                 ← device encryption key

(frontend hosting only):
  └── /api/chat    ← streaming, memory save, notification check
  └── /api/family  ← 7 actions: add, leave_at_door, fetch_unsurfaced,
  │                             check, family_check, family_mark_seen,
  │                             mark_surfaced
  └── /api/tts     ← ElevenLabs proxy (key server-side only)
  └── /api/unsent  ← theme extraction endpoint

Nothing from the user's conversation leaves the device.
ElevenLabs receives only Tobira's response text — never the user's input.
```

### Key Files

```
lib/
  ollama.ts        — Gemma 4 integration. Multimodal message building.
                     Thinking token stripping. Memory preamble injection.
                     streamChat() returns ReadableStream<string>.

  memory.ts        — AES-256 session storage. loadMemory(), saveMemory(),
                     getMemoryContext(), saveSession(), forgetMessage(),
                     startFresh(). buildContextWindow() manages 128K budget.

  voice.ts         — ElevenLabs TTS. Sentence accumulation from streaming
                     tokens. Playback epoch system. feedWord(), flushVoice(),
                     stopVoice(). WordBuffer class for token → word assembly.

  speechInput.ts   — Web Speech API voice input. startListening() with
                     three callbacks: onInterim, onFinal, onEnd.
                     Proper TypeScript interfaces for browser Speech API.

components/
  TobiraChat.tsx   — Main UI. Handles all input types. Manages voice mode
                     ref sync for streaming callbacks. Family notification
                     state. Hold-to-forget. Settings drawer.

app/unsent/
  page.tsx         — 6-phase state machine: writing → confirm → door_choice
                     → confirm_complete → burning → gone/left.
                     8-second timer with interval cleanup.

app/family/
  page.tsx         — Decodes session ID from URL. Checks unsent letters on
                     load. Tracks totalCount/newCount/seenCount separately.
                     Letter reading view with per-letter timestamps.
```

---

## Fine-Tuning

**Base model:** Gemma 4 E2B  
**Framework:** Unsloth on Kaggle T4  
**Method:** LoRA adapters  
**Dataset:** 283 hand-constructed conversations demonstrating non-interventionist behavior  
**Runs:** 3  
**Loss:** 9.85 → 2.48

The training objective was behavioral: make the model respond the way the clinical research says works, not the way a helpful AI defaults to. Every training conversation was constructed around a specific failure mode of base Gemma 4 — advice-giving, resource-flooding, agenda-carrying — and replaced with the correct non-interventionist response.

**Weights:** [akadel/tobira-gemma4-e2b](https://huggingface.co/akadel/tobira-gemma4-e2b)

---

## Limitations

Tobira is not a clinical intervention. For users expressing immediate intent to harm themselves, Tobira asks only "What's happening right now?" — consistent with clinical findings that resource-flooding increases distress. It does not perform risk assessment.

Response latency on consumer hardware is 4-8 seconds. The breathing cursor and thinking pause reframe this as presence rather than processing. The wait is real.

The family bridge uses server-side storage. Production would use E2E encryption where only the user holds the decryption key. The path is documented.

---

## Built By

Avishek (developer, Masters in AI) and Dr. Anuska Thanju (MBBS, Nepal) — who read a paper, recognized someone they love, and built the tool that might reach him and people like him.

---

*github.com/0nowShek/tobira · huggingface.co/akadel/tobira-gemma4-e2b*