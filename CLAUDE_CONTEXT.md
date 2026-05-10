# TOBIRA — Project Context for Cursor Agent

## What This Project Is
Tobira is a local-first AI companion for hikikomori — people who have
withdrawn completely from social life. Built for the Gemma 4 for Good
Hackathon on Kaggle. Deadline: May 18, 2026.

## Core Principle
Tobira cannot exist on any closed model. A hikikomori user will never
trust a server they don't control. Gemma 4 running locally via Ollama
is not a deployment choice — it is the ethical foundation.

## Tech Stack
- Next.js 14 App Router + TypeScript
- Ollama (localhost:11434) running gemma2:2b locally
- Streaming SSE responses
- Encrypted local JSON memory storage
- Web Speech API for voice (work in progress)
- Demo mode: NEXT_PUBLIC_DEMO_MODE=true in .env.local

## Public Demo Mode
Use this mode for live demos where response behavior must be deterministic.

### Enable
1. Set `NEXT_PUBLIC_DEMO_MODE=true` in `.env.local`
2. Restart the dev server
3. Verify chat is using fixed demo responses instead of Ollama

### Disable
1. Set `NEXT_PUBLIC_DEMO_MODE=false` in `.env.local` (or remove the variable)
2. Restart the dev server
3. Verify Ollama-backed streaming responses are active again

## The 25 Laws (Never Break These)
Tobira NEVER:
- Suggests therapy or professional help
- Says "I understand how you feel"
- Says "You're not alone" or "I'm here for you"
- Uses words: healing, journey, recovery, progress
- Gives unsolicited advice
- Says "That must be really hard"
- Uses "should", "need to", "ought to"
- Says "I remember you said..." — just knows things naturally
- Asks more than one question at a time
- Uses exclamation marks or emoji

Tobira ALWAYS:
- Asks one small specific curious question
- Matches user energy — if quiet, be quiet
- Uses short sentences
- Lets conversations end naturally
- References past things the way a friend would
- Is comfortable with silence

## File Structure
```
tobira/
├── app/
│   ├── page.tsx              # Root page
│   ├── layout.tsx            # Root layout
│   ├── globals.css           # Global styles + animations
│   └── api/
│       ├── chat/route.ts     # Chat API — streams Ollama
│       ├── session/route.ts  # Session save/forget/fresh
│       └── family/route.ts   # Family bridge API
├── app/family/
│   └── page.tsx              # Family bridge interface
├── components/
│   └── TobiraChat.tsx        # Main chat UI
├── lib/
│   ├── ollama.ts             # Ollama integration
│   ├── memory.ts             # Memory engine
│   ├── demoMode.ts           # Hardcoded demo responses
│   ├── familyBridge.ts       # Family context injector
│   └── voice.ts              # Voice engine
└── hooks/
    └── useSession.ts         # Session auto-save
```

## Current Status
- UI: Working, dark minimal, presence improvements added
- Ollama: Running, gemma2:2b loaded
- Demo mode: Built, needs end-to-end verification
- Memory: Built, needs end-to-end test
- Family bridge: Built, needs polish
- Silent notification: Built, needs wiring
- Voice: Built, quality issue with Mac system voices
- Fine-tune: v3 trained on Kaggle, results pending
- GitHub: https://github.com/0nowShek/tobira
- Vercel: Not deployed yet

## Demo Mode Responses
When NEXT_PUBLIC_DEMO_MODE=true, these exact responses fire:
- "hey" → "Hey."
- "i don't know what to say" → "What do you feel?"
- "i used to draw. haven't in years" → "Really? What did you like about drawing?"
- "what did they leave" → "Your brother said he still thinks about those buildings you used to draw."
- "he said that?" → "He did."

## What Needs To Be Done
Priority order:
1. Demo mode end-to-end verified
2. Silent notification wired up
3. Family bridge polished
4. Memory end-to-end test
5. Vercel deployment
6. Cactus React Native app
7. Voice quality fix (ElevenLabs)
8. Unsent Letter feature
9. Kaggle writeup
10. Video filming

## Competition Prizes Targeting
- Main Track: up to $50,000
- Digital Equity & Inclusivity: $10,000
- Safety & Trust: $10,000
- Ollama Special Prize: $10,000
- Unsloth Special Prize: $10,000
- Cactus Special Prize: $10,000

## Key Arguments For Writeup
1. Trust: hikikomori users will never trust a cloud server
2. Ownership: open weights = user can inspect the model
3. Access: economically inactive population, free model = no barrier

## Research Citations
- Lim et al. (2024): 8% global prevalence, consistent across cultures
- Li & Wong (2015): internet is primary contact point, direct intervention fails
- Mavranezouli et al. (2022): indirect non-threatening approaches recommended
- Kato et al. (2023): family role critical, lacks channel to help

## Important Notes For Agent
- Never add clinical language to Tobira's responses
- Never suggest the UI should be bright or colorful
- Memory uses AES-256 encryption, device key stored in .tobira/.key
- .tobira/ folder must be in .gitignore — contains user data
- Demo mode bypasses Ollama entirely
- Family bridge is one-way — family writes, user controls surfacing
- "start fresh" deletes everything with no confirmation dialog
- The word "remember" never appears in the UI