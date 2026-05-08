module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[project]/lib/ollama.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "checkOllama",
    ()=>checkOllama,
    "extractMemoryFromSession",
    ()=>extractMemoryFromSession,
    "simpleChat",
    ()=>simpleChat,
    "streamChat",
    ()=>streamChat
]);
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
// MEMORY INJECTION
// Converts memory context into a natural preamble.
// This is injected as a system-level context block.
// The user never sees this. Tobira just knows.
// ============================================================
function buildMemoryPreamble(memory) {
    if (!memory || memory.sessionCount === 0) return "";
    const lines = [];
    // Session count — Tobira knows this is not the first time
    if (memory.sessionCount > 1) {
        lines.push(`[Context: This person has talked with you ${memory.sessionCount} times before.]`);
    }
    // Extracted facts — things worth remembering
    if (memory.extractedFacts && memory.extractedFacts.length > 0) {
        lines.push(`[Things you know about this person:]`);
        memory.extractedFacts.forEach((fact)=>{
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
    return lines.join("\n") + "\n\n[Use this context naturally in conversation — the way a friend would. " + "Never announce that you remember these things. Never say 'I remember' or " + "'you mentioned'. Just know them.]\n\n";
}
async function streamChat(request) {
    const { messages, memoryContext, onToken } = request;
    // Build the full system prompt with memory
    const memoryPreamble = memoryContext ? buildMemoryPreamble(memoryContext) : "";
    const fullSystem = memoryPreamble + TOBIRA_SYSTEM;
    // Format messages for Ollama
    const ollamaMessages = [
        {
            role: "system",
            content: fullSystem
        },
        ...messages.map((m)=>({
                role: m.role,
                content: m.content
            }))
    ];
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            model: MODEL,
            messages: ollamaMessages,
            stream: true,
            options: {
                temperature: 0.9,
                top_p: 0.95,
                top_k: 64,
                num_predict: 256,
                stop: [
                    "\n\n\n"
                ]
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
    return new ReadableStream({
        async start (controller) {
            try {
                while(true){
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, {
                        stream: true
                    });
                    const lines = chunk.split("\n").filter(Boolean);
                    for (const line of lines){
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
                        } catch  {
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
async function simpleChat(prompt, systemOverride) {
    const response = await fetch(`${OLLAMA_BASE_URL}/api/chat`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
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
                num_predict: 512
            }
        })
    });
    if (!response.ok) {
        throw new Error(`Ollama error: ${response.status}`);
    }
    const data = await response.json();
    return data.message?.content || "";
}
async function checkOllama() {
    try {
        // Check if Ollama is running
        const response = await fetch(`${OLLAMA_BASE_URL}/api/tags`, {
            signal: AbortSignal.timeout(3000)
        });
        if (!response.ok) {
            return {
                running: false,
                modelLoaded: false,
                error: "Ollama not responding"
            };
        }
        const data = await response.json();
        const models = data.models || [];
        const modelLoaded = models.some((m)=>m.name.includes("gemma4") || m.name.includes("gemma-4") || m.name.includes("gemma2") || m.name.includes("gemma"));
        return {
            running: true,
            modelLoaded
        };
    } catch  {
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
async function extractMemoryFromSession(messages) {
    if (messages.length < 2) return [];
    const conversationText = messages.map((m)=>`${m.role === "user" ? "Person" : "Tobira"}: ${m.content}`).join("\n");
    const prompt = `Extract memorable facts from this conversation:\n\n${conversationText}`;
    try {
        const result = await simpleChat(prompt, EXTRACTION_SYSTEM);
        // Parse the JSON array
        const cleaned = result.trim().replace(/```json|```/g, "").trim();
        const facts = JSON.parse(cleaned);
        if (Array.isArray(facts) && facts.every((f)=>typeof f === "string")) {
            return facts;
        }
        return [];
    } catch  {
        return [];
    }
}
}),
"[externals]/fs [external] (fs, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("fs", () => require("fs"));

module.exports = mod;
}),
"[externals]/path [external] (path, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("path", () => require("path"));

module.exports = mod;
}),
"[externals]/crypto [external] (crypto, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("crypto", () => require("crypto"));

module.exports = mod;
}),
"[project]/lib/memory.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildContextWindow",
    ()=>buildContextWindow,
    "deleteMemory",
    ()=>deleteMemory,
    "forgetMessage",
    ()=>forgetMessage,
    "getMemoryContext",
    ()=>getMemoryContext,
    "loadMemory",
    ()=>loadMemory,
    "saveMemory",
    ()=>saveMemory,
    "saveSession",
    ()=>saveSession,
    "startFresh",
    ()=>startFresh
]);
// lib/memory.ts
// TOBIRA — Memory Engine
//
// This is what makes Tobira different from every other AI companion.
//
// Most companions use RAG: store facts, retrieve facts, inject facts.
// That produces responses like "You mentioned your father was difficult."
// Clinical. Database-like. It breaks trust.
//
// Tobira uses 128K context as a relationship container.
// Not just facts — the texture of conversations.
// The things that trailed off. The silences. The pattern of what
// someone keeps coming back to.
//
// Gemma 4's 128K window holds all of it.
// The memory engine manages what goes in, what stays,
// and what gets removed when the user asks.
//
// PRIVACY:
// Everything is stored locally as JSON.
// Nothing leaves the device.
// Ever.
var __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/fs [external] (fs, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/path [external] (path, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/crypto [external] (crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ollama$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ollama.ts [app-route] (ecmascript)");
;
;
;
;
// ============================================================
// STORAGE
// Local filesystem, encrypted with a device key
// ============================================================
const MEMORY_DIR = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), '.tobira');
const DEVICE_KEY = getOrCreateDeviceKey();
function getOrCreateDeviceKey() {
    const keyPath = __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), '.tobira', '.key');
    try {
        if (__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(keyPath)) {
            return __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].readFileSync(keyPath, 'utf8').trim();
        }
        // Create directory if needed
        if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), '.tobira'))) {
            __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].mkdirSync(__TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(process.cwd(), '.tobira'), {
                recursive: true
            });
        }
        // Generate new device key
        const key = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(32).toString('hex');
        __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].writeFileSync(keyPath, key, {
            mode: 0o600
        });
        return key;
    } catch  {
        // Fallback — memory won't persist but app still works
        return __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(32).toString('hex');
    }
}
function encrypt(data) {
    try {
        const iv = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomBytes(16);
        const key = Buffer.from(DEVICE_KEY.slice(0, 32), 'utf8');
        const cipher = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createCipheriv('aes-256-cbc', key, iv);
        const encrypted = Buffer.concat([
            cipher.update(data, 'utf8'),
            cipher.final()
        ]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    } catch  {
        // If encryption fails, store as base64 (still not plaintext)
        return 'b64:' + Buffer.from(data).toString('base64');
    }
}
function decrypt(data) {
    try {
        if (data.startsWith('b64:')) {
            return Buffer.from(data.slice(4), 'base64').toString('utf8');
        }
        const [ivHex, encryptedHex] = data.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const key = Buffer.from(DEVICE_KEY.slice(0, 32), 'utf8');
        const decipher = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createDecipheriv('aes-256-cbc', key, iv);
        return Buffer.concat([
            decipher.update(Buffer.from(encryptedHex, 'hex')),
            decipher.final()
        ]).toString('utf8');
    } catch  {
        return '{}';
    }
}
function getMemoryPath(sessionId) {
    // Hash the session ID for the filename
    const hash = __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].createHash('sha256').update(sessionId).digest('hex').slice(0, 16);
    return __TURBOPACK__imported__module__$5b$externals$5d2f$path__$5b$external$5d$__$28$path$2c$__cjs$29$__["default"].join(MEMORY_DIR, `${hash}.mem`);
}
function loadMemory(sessionId) {
    try {
        const filePath = getMemoryPath(sessionId);
        if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(filePath)) return null;
        const encrypted = __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].readFileSync(filePath, 'utf8');
        const decrypted = decrypt(encrypted);
        return JSON.parse(decrypted);
    } catch  {
        return null;
    }
}
function saveMemory(memory) {
    try {
        if (!__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(MEMORY_DIR)) {
            __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].mkdirSync(MEMORY_DIR, {
                recursive: true
            });
        }
        const filePath = getMemoryPath(memory.sessionId);
        const json = JSON.stringify(memory);
        const encrypted = encrypt(json);
        __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].writeFileSync(filePath, encrypted, {
            mode: 0o600
        });
    } catch (error) {
        console.error('Memory save failed:', error);
    }
}
function deleteMemory(sessionId) {
    try {
        const filePath = getMemoryPath(sessionId);
        if (__TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].existsSync(filePath)) {
            __TURBOPACK__imported__module__$5b$externals$5d2f$fs__$5b$external$5d$__$28$fs$2c$__cjs$29$__["default"].unlinkSync(filePath);
        }
    } catch  {
    // Silent fail — memory is already gone
    }
}
async function getMemoryContext(sessionId) {
    const memory = loadMemory(sessionId);
    if (!memory || memory.sessions.length === 0) {
        return {
            extractedFacts: [],
            recentSessions: [],
            sessionCount: 0
        };
    }
    // Get the last 3 sessions for recent context
    const recentSessions = memory.sessions.slice(-3).map((s)=>s.messages);
    // Deduplicate facts
    const uniqueFacts = [
        ...new Set(memory.facts)
    ].slice(-20);
    return {
        extractedFacts: uniqueFacts,
        recentSessions,
        sessionCount: memory.sessions.length
    };
}
async function saveSession(sessionId, messages) {
    if (messages.length < 2) return;
    // Let Gemma decide what mattered in this conversation
    let newFacts = [];
    try {
        newFacts = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ollama$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["extractMemoryFromSession"])(messages);
    } catch  {
        // If extraction fails, still save the session
        newFacts = [];
    }
    const session = {
        id: __TURBOPACK__imported__module__$5b$externals$5d2f$crypto__$5b$external$5d$__$28$crypto$2c$__cjs$29$__["default"].randomUUID(),
        startedAt: messages[0]?.timestamp || Date.now(),
        endedAt: Date.now(),
        messages,
        extractedFacts: newFacts
    };
    // Load or create memory
    let memory = loadMemory(sessionId);
    if (!memory) {
        memory = {
            sessionId,
            createdAt: Date.now(),
            lastActiveAt: Date.now(),
            sessions: [],
            facts: [],
            totalMessages: 0
        };
    }
    // Add session
    memory.sessions.push(session);
    memory.lastActiveAt = Date.now();
    memory.totalMessages += messages.length;
    // Merge new facts with existing ones
    // Keep max 30 facts — oldest drop off
    const allFacts = [
        ...memory.facts,
        ...newFacts
    ];
    memory.facts = [
        ...new Set(allFacts)
    ].slice(-30);
    // Keep max 20 sessions to manage file size
    if (memory.sessions.length > 20) {
        memory.sessions = memory.sessions.slice(-20);
    }
    saveMemory(memory);
}
function forgetMessage(sessionId, messageContent, messageTimestamp) {
    const memory = loadMemory(sessionId);
    if (!memory) return;
    // Remove matching message from all sessions
    memory.sessions = memory.sessions.map((session)=>({
            ...session,
            messages: session.messages.filter((m)=>!(m.content === messageContent && m.timestamp === messageTimestamp))
        }));
    saveMemory(memory);
}
function startFresh(sessionId) {
    deleteMemory(sessionId);
}
function buildContextWindow(currentMessages, memoryContext, maxTokens = 100000 // Stay under 128K
) {
    const parts = [];
    let estimatedTokens = 0;
    // Estimate tokens (rough: 4 chars per token)
    const estimateTokens = (text)=>Math.ceil(text.length / 4);
    // Add extracted facts as context
    if (memoryContext.extractedFacts.length > 0) {
        const factsBlock = memoryContext.extractedFacts.join('\n');
        parts.push(`[Background: ${factsBlock}]`);
        estimatedTokens += estimateTokens(factsBlock);
    }
    // Add recent sessions — most recent first, oldest dropped if over limit
    const sessionsToInclude = [
        ...memoryContext.recentSessions
    ].reverse();
    for (const session of sessionsToInclude){
        const sessionText = session.map((m)=>`${m.role === 'user' ? 'them' : 'tobira'}: ${m.content}`).join('\n');
        const sessionTokens = estimateTokens(sessionText);
        if (estimatedTokens + sessionTokens > maxTokens) break;
        parts.unshift(sessionText); // Add to front (chronological order)
        estimatedTokens += sessionTokens;
    }
    // Add current session
    const currentText = currentMessages.map((m)=>`${m.role === 'user' ? 'them' : 'tobira'}: ${m.content}`).join('\n');
    parts.push(currentText);
    return parts.join('\n\n---\n\n');
}
}),
"[project]/app/api/chat/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "POST",
    ()=>POST,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
// app/api/chat/route.ts
// TOBIRA — Chat API Route
// Frontend calls this. This calls Ollama.
// Streams tokens back as Server-Sent Events.
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ollama$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/ollama.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$memory$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/memory.ts [app-route] (ecmascript)");
;
;
const runtime = "nodejs";
const dynamic = "force-dynamic";
async function POST(req) {
    try {
        const body = await req.json();
        const { messages, sessionId } = body;
        if (!messages || !Array.isArray(messages)) {
            return new Response("Invalid messages", {
                status: 400
            });
        }
        // Check Ollama is running
        const health = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ollama$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["checkOllama"])();
        if (!health.running) {
            return new Response(JSON.stringify({
                error: "ollama_not_running",
                message: health.error
            }), {
                status: 503
            });
        }
        // Load memory context for this session
        const memoryContext = sessionId ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$memory$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getMemoryContext"])(sessionId) : undefined;
        // Stream response back as Server-Sent Events
        const stream = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ollama$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["streamChat"])({
            messages,
            memoryContext
        });
        const reader = stream.getReader();
        const sseStream = new ReadableStream({
            async start (controller) {
                const encoder = new TextEncoder();
                try {
                    while(true){
                        const { done, value } = await reader.read();
                        if (done) {
                            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
                            controller.close();
                            break;
                        }
                        // SSE format: data: <token>\n\n
                        const sseData = `data: ${JSON.stringify({
                            token: value
                        })}\n\n`;
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
                "Connection": "keep-alive"
            }
        });
    } catch (error) {
        console.error("Chat API error:", error);
        return new Response(JSON.stringify({
            error: "Internal error"
        }), {
            status: 500
        });
    }
}
async function GET() {
    const health = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$ollama$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["checkOllama"])();
    return new Response(JSON.stringify(health), {
        headers: {
            "Content-Type": "application/json"
        }
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0qk~h01._.js.map