(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/lib/voice.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// lib/voice.ts
// TOBIRA — Voice Engine
//
// Speaks Tobira's responses word by word as they stream in.
// Not text-to-speech after the fact.
// Word by word. In sync with text appearing on screen.
// That's the difference between a screen reader and a presence.
// ============================================================
// VOICE PREFERENCES
// Stored in localStorage. User controls this.
// ============================================================
__turbopack_context__.s([
    "WordBuffer",
    ()=>WordBuffer,
    "getPauseDuration",
    ()=>getPauseDuration,
    "getVoicePreference",
    ()=>getVoicePreference,
    "initVoice",
    ()=>initVoice,
    "isVoiceAvailable",
    ()=>isVoiceAvailable,
    "setVoicePreference",
    ()=>setVoicePreference,
    "sleep",
    ()=>sleep,
    "speakWord",
    ()=>speakWord,
    "stopSpeaking",
    ()=>stopSpeaking
]);
function getVoicePreference() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return localStorage.getItem('tobira_voice') || 'off';
}
function setVoicePreference(mode) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    localStorage.setItem('tobira_voice', mode);
}
// ============================================================
// VOICE SELECTOR
// Finds the best available voice for Tobira.
// Priority order — warmest voices first.
// ============================================================
const PREFERRED_VOICES = [
    'Samantha',
    'Karen',
    'Moira',
    'Microsoft Zira',
    'Google US English'
];
let selectedVoice = null;
function initVoice() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (!window.speechSynthesis) return;
    const setVoice = ()=>{
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) return;
        // Try preferred voices first
        for (const name of PREFERRED_VOICES){
            const match = voices.find((v)=>v.name.includes(name));
            if (match) {
                selectedVoice = match;
                return;
            }
        }
        // Fallback — first English voice
        const english = voices.find((v)=>v.lang.startsWith('en'));
        selectedVoice = english || voices[0];
    };
    // Voices load asynchronously in some browsers
    if (window.speechSynthesis.getVoices().length > 0) {
        setVoice();
    } else {
        window.speechSynthesis.onvoiceschanged = setVoice;
    }
}
function speakWord(word, mode) {
    if (mode === 'off') return;
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (!window.speechSynthesis) return;
    if (!word.trim()) return;
    const utterance = new SpeechSynthesisUtterance(word);
    // Voice settings
    if (selectedVoice) utterance.voice = selectedVoice;
    utterance.rate = 0.88; // Slightly slower — unhurried
    utterance.pitch = 0.92; // Slightly lower — calm
    utterance.volume = mode === 'quieter' ? 0.5 : 0.8;
    window.speechSynthesis.speak(utterance);
}
class WordBuffer {
    buffer = '';
    add(token) {
        this.buffer += token;
        // Complete word detected — space, punctuation, or end
        if (this.buffer.endsWith(' ') || this.buffer.endsWith('\n') || this.buffer.match(/[.?!,;:…]$/)) {
            const word = this.buffer.trim();
            this.buffer = '';
            return word || null;
        }
        return null;
    }
    // Flush remaining buffer at end of stream
    flush() {
        const word = this.buffer.trim();
        this.buffer = '';
        return word || null;
    }
}
function getPauseDuration(word) {
    if (word.endsWith('...') || word.endsWith('…')) return 500;
    if (word.endsWith('.')) return 250;
    if (word.endsWith('?')) return 300;
    if (word.endsWith('!')) return 250;
    if (word.endsWith(',')) return 120;
    if (word.endsWith(';') || word.endsWith(':')) return 150;
    return 0;
}
function sleep(ms) {
    return new Promise((resolve)=>setTimeout(resolve, ms));
}
function stopSpeaking() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
}
function isVoiceAvailable() {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    return 'speechSynthesis' in window;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/components/TobiraChat.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TobiraChat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/voice.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
function TobiraChat() {
    _s();
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [isGenerating, setIsGenerating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isThinking, setIsThinking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false); // thinking pause state
    const [ollamaReady, setOllamaReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showForgetConfirm, setShowForgetConfirm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showSettings, setShowSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false); // for screen wake fade-in
    // Voice state
    const [voiceMode, setVoiceMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('off');
    const [voiceAvailable, setVoiceAvailable] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const wordBufferRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WordBuffer"]());
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const holdTimerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const sessionId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])('');
    // ============================================================
    // PRESENCE IMPROVEMENT 4 — Screen wake on load
    // Fades in from black over 800ms.
    // The room comes into focus. Not a page load.
    // ============================================================
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TobiraChat.useEffect": ()=>{
            const timer = setTimeout({
                "TobiraChat.useEffect.timer": ()=>setMounted(true)
            }["TobiraChat.useEffect.timer"], 50);
            return ({
                "TobiraChat.useEffect": ()=>clearTimeout(timer)
            })["TobiraChat.useEffect"];
        }
    }["TobiraChat.useEffect"], []);
    // Initialize session + voice
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TobiraChat.useEffect": ()=>{
            if ("TURBOPACK compile-time truthy", 1) {
                const stored = localStorage.getItem('tobira_session');
                const sid = stored || crypto.randomUUID();
                if (!stored) localStorage.setItem('tobira_session', sid);
                sessionId.current = sid;
                // Voice initialization
                const available = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["isVoiceAvailable"])();
                setVoiceAvailable(available);
                if (available) {
                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["initVoice"])();
                    const saved = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getVoicePreference"])();
                    setVoiceMode(saved);
                }
            }
            checkOllama();
        }
    }["TobiraChat.useEffect"], []);
    // Auto-scroll
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TobiraChat.useEffect": ()=>{
            messagesEndRef.current?.scrollIntoView({
                behavior: 'smooth'
            });
        }
    }["TobiraChat.useEffect"], [
        messages
    ]);
    // Focus input
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "TobiraChat.useEffect": ()=>{
            if (ollamaReady) inputRef.current?.focus();
        }
    }["TobiraChat.useEffect"], [
        ollamaReady
    ]);
    async function checkOllama() {
        try {
            const res = await fetch('/api/chat');
            const data = await res.json();
            setOllamaReady(data.running);
        } catch  {
            setOllamaReady(false);
        }
    }
    function handleVoiceChange(mode) {
        setVoiceMode(mode);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["setVoicePreference"])(mode);
        if (mode === 'off') (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stopSpeaking"])();
    }
    const sendWithMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "TobiraChat.useCallback[sendWithMessages]": async (msgs)=>{
            // ============================================================
            // PRESENCE IMPROVEMENT 1 — Thinking pause
            // 1.2-2 seconds of silence before Tobira responds.
            // Variable — never exactly the same. Like a real person.
            // Shows as breathing cursor, not loading spinner.
            // ============================================================
            setIsThinking(true);
            const thinkingDelay = 1200 + Math.random() * 800;
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sleep"])(thinkingDelay);
            setIsThinking(false);
            setIsGenerating(true);
            const assistantId = crypto.randomUUID();
            // ============================================================
            // PRESENCE IMPROVEMENT 3 — Message arrives from below
            // New messages start with arriving: true
            // CSS animation fades them in from 8px below
            // arriving flag removed after animation completes
            // ============================================================
            setMessages({
                "TobiraChat.useCallback[sendWithMessages]": (prev)=>[
                        ...prev,
                        {
                            id: assistantId,
                            role: 'assistant',
                            content: '',
                            timestamp: Date.now(),
                            arriving: true
                        }
                    ]
            }["TobiraChat.useCallback[sendWithMessages]"]);
            // Remove arriving flag after animation
            setTimeout({
                "TobiraChat.useCallback[sendWithMessages]": ()=>{
                    setMessages({
                        "TobiraChat.useCallback[sendWithMessages]": (prev)=>prev.map({
                                "TobiraChat.useCallback[sendWithMessages]": (m)=>m.id === assistantId ? {
                                        ...m,
                                        arriving: false
                                    } : m
                            }["TobiraChat.useCallback[sendWithMessages]"])
                    }["TobiraChat.useCallback[sendWithMessages]"]);
                }
            }["TobiraChat.useCallback[sendWithMessages]"], 300);
            try {
                const response = await fetch('/api/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        messages: msgs.map({
                            "TobiraChat.useCallback[sendWithMessages]": (m)=>({
                                    role: m.role,
                                    content: m.content,
                                    timestamp: m.timestamp
                                })
                        }["TobiraChat.useCallback[sendWithMessages]"]),
                        sessionId: sessionId.current
                    })
                });
                if (!response.ok || !response.body) {
                    throw new Error('Failed to connect');
                }
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let fullContent = '';
                while(true){
                    const { done, value } = await reader.read();
                    if (done) break;
                    const chunk = decoder.decode(value, {
                        stream: true
                    });
                    const lines = chunk.split('\n').filter(Boolean);
                    for (const line of lines){
                        if (line.startsWith('data: ')) {
                            const data = line.slice(6);
                            if (data === '[DONE]') break;
                            try {
                                const parsed = JSON.parse(data);
                                if (parsed.token) {
                                    fullContent += parsed.token;
                                    setMessages({
                                        "TobiraChat.useCallback[sendWithMessages]": (prev)=>prev.map({
                                                "TobiraChat.useCallback[sendWithMessages]": (m)=>m.id === assistantId ? {
                                                        ...m,
                                                        content: fullContent
                                                    } : m
                                            }["TobiraChat.useCallback[sendWithMessages]"])
                                    }["TobiraChat.useCallback[sendWithMessages]"]);
                                    // Voice — speak word by word as tokens arrive
                                    const word = wordBufferRef.current.add(parsed.token);
                                    if (word) {
                                        const pause = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPauseDuration"])(word);
                                        if (pause > 0) await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["sleep"])(pause);
                                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["speakWord"])(word, voiceMode);
                                    }
                                }
                            } catch  {
                            // skip malformed chunks
                            }
                        }
                    }
                }
                // Flush remaining word in buffer
                const remaining = wordBufferRef.current.flush();
                if (remaining) (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["speakWord"])(remaining, voiceMode);
                wordBufferRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WordBuffer"]();
            } catch  {
                setMessages({
                    "TobiraChat.useCallback[sendWithMessages]": (prev)=>prev.map({
                            "TobiraChat.useCallback[sendWithMessages]": (m)=>m.id === assistantId ? {
                                    ...m,
                                    content: '...'
                                } : m
                        }["TobiraChat.useCallback[sendWithMessages]"])
                }["TobiraChat.useCallback[sendWithMessages]"]);
            } finally{
                setIsGenerating(false);
                inputRef.current?.focus();
            }
        }
    }["TobiraChat.useCallback[sendWithMessages]"], [
        voiceMode
    ]);
    async function sendMessage() {
        const text = input.trim();
        if (!text || isGenerating || isThinking) return;
        // Stop any speech in progress
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stopSpeaking"])();
        wordBufferRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WordBuffer"]();
        const userMessage = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            timestamp: Date.now(),
            arriving: true
        };
        // Remove arriving flag after animation
        const userId = userMessage.id;
        setTimeout(()=>{
            setMessages((prev)=>prev.map((m)=>m.id === userId ? {
                        ...m,
                        arriving: false
                    } : m));
        }, 300);
        const updatedMessages = [
            ...messages,
            userMessage
        ];
        setMessages(updatedMessages);
        setInput('');
        await sendWithMessages(updatedMessages);
    }
    function handleKeyDown(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }
    function handleMessageHoldStart(messageId) {
        holdTimerRef.current = setTimeout(()=>{
            setShowForgetConfirm(messageId);
        }, 800);
    }
    function handleMessageHoldEnd() {
        if (holdTimerRef.current) {
            clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
    }
    function forgetMessage(messageId) {
        setMessages((prev)=>prev.filter((m)=>m.id !== messageId));
        setShowForgetConfirm(null);
    }
    function startFresh() {
        setMessages([]);
        setShowSettings(false);
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["stopSpeaking"])();
        wordBufferRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["WordBuffer"]();
        if ("TURBOPACK compile-time truthy", 1) {
            localStorage.removeItem('tobira_session');
            localStorage.removeItem('tobira_memory');
            const newId = crypto.randomUUID();
            sessionId.current = newId;
            localStorage.setItem('tobira_session', newId);
        }
        inputRef.current?.focus();
    }
    function copyFamilyLink() {
        if ("TURBOPACK compile-time truthy", 1) {
            const link = `${window.location.origin}/family?for=${btoa(sessionId.current)}`;
            navigator.clipboard.writeText(link).catch(()=>{});
        }
        setShowSettings(false);
    }
    // Voice toggle — cycles off → soft → quieter → off
    const nextVoiceMode = ()=>{
        if (voiceMode === 'off') return 'soft';
        if (voiceMode === 'soft') return 'quieter';
        return 'off';
    };
    const voiceLabel = {
        off: 'voice  off',
        soft: 'voice  on',
        quieter: 'voice  quiet'
    }[voiceMode];
    // ============================================================
    // SETUP SCREEN
    // ============================================================
    if (ollamaReady === false) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: styles.setupContainer,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: styles.setupContent,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: styles.setupTitle,
                        children: "tobira needs one thing"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 353,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: styles.setupStep,
                        children: "1. Install Ollama at ollama.ai"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 354,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: styles.setupStep,
                        children: "2. Open terminal and run:"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 355,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        style: styles.setupCode,
                        children: "ollama pull gemma2:2b"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 356,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: styles.setupStep,
                        children: "3. Refresh this page"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 357,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        style: styles.setupRetry,
                        onClick: checkOllama,
                        children: "check again"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 358,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TobiraChat.tsx",
                lineNumber: 352,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/TobiraChat.tsx",
            lineNumber: 351,
            columnNumber: 7
        }, this);
    }
    // ============================================================
    // LOADING STATE
    // ============================================================
    if (ollamaReady === null) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: styles.loadingContainer,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: styles.cursor
            }, void 0, false, {
                fileName: "[project]/components/TobiraChat.tsx",
                lineNumber: 372,
                columnNumber: 9
            }, this)
        }, void 0, false, {
            fileName: "[project]/components/TobiraChat.tsx",
            lineNumber: 371,
            columnNumber: 7
        }, this);
    }
    // ============================================================
    // MAIN CHAT INTERFACE
    // Screen wake: opacity transitions from 0 to 1 over 800ms
    // ============================================================
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            ...styles.container,
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.8s ease'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: styles.topBar,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: styles.wordmark,
                        children: "tobira"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 390,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        style: styles.menuButton,
                        onClick: ()=>setShowSettings(!showSettings),
                        children: "···"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 391,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TobiraChat.tsx",
                lineNumber: 389,
                columnNumber: 7
            }, this),
            showSettings && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: styles.drawer,
                children: [
                    voiceAvailable && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        style: {
                            ...styles.drawerItem,
                            color: voiceMode === 'off' ? '#2a2a2a' : '#555'
                        },
                        onClick: ()=>handleVoiceChange(nextVoiceMode()),
                        children: voiceLabel
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 403,
                        columnNumber: 13
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: styles.drawerDivider
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 413,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        style: styles.drawerItem,
                        onClick: copyFamilyLink,
                        children: "copy family link"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 414,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        style: styles.drawerItem,
                        onClick: startFresh,
                        children: "start fresh"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 417,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TobiraChat.tsx",
                lineNumber: 401,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: styles.messagesContainer,
                children: [
                    messages.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: styles.emptyState
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 426,
                        columnNumber: 11
                    }, this),
                    messages.map((message, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            style: {
                                ...styles.messageWrapper,
                                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                                // PRESENCE IMPROVEMENT 3 — arrive from below
                                opacity: message.arriving ? 0 : 1,
                                transform: message.arriving ? 'translateY(8px)' : 'translateY(0)',
                                transition: 'opacity 0.25s ease, transform 0.25s ease'
                            },
                            onMouseDown: ()=>handleMessageHoldStart(message.id),
                            onMouseUp: handleMessageHoldEnd,
                            onTouchStart: ()=>handleMessageHoldStart(message.id),
                            onTouchEnd: handleMessageHoldEnd,
                            children: [
                                showForgetConfirm === message.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: styles.forgetOverlay,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            style: styles.forgetButton,
                                            onClick: ()=>forgetMessage(message.id),
                                            children: "forget this"
                                        }, void 0, false, {
                                            fileName: "[project]/components/TobiraChat.tsx",
                                            lineNumber: 448,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            style: styles.cancelButton,
                                            onClick: ()=>setShowForgetConfirm(null),
                                            children: "keep"
                                        }, void 0, false, {
                                            fileName: "[project]/components/TobiraChat.tsx",
                                            lineNumber: 454,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/TobiraChat.tsx",
                                    lineNumber: 447,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        ...styles.messageBubble,
                                        ...message.role === 'user' ? styles.userBubble : styles.assistantBubble
                                    },
                                    children: [
                                        message.content,
                                        isGenerating && message.role === 'assistant' && index === messages.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            style: styles.generatingCursor,
                                            children: "▋"
                                        }, void 0, false, {
                                            fileName: "[project]/components/TobiraChat.tsx",
                                            lineNumber: 476,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/components/TobiraChat.tsx",
                                    lineNumber: 463,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, message.id, true, {
                            fileName: "[project]/components/TobiraChat.tsx",
                            lineNumber: 430,
                            columnNumber: 11
                        }, this)),
                    isThinking && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: styles.thinkingRow,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            style: styles.breathingCursor,
                            children: "▋"
                        }, void 0, false, {
                            fileName: "[project]/components/TobiraChat.tsx",
                            lineNumber: 485,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 484,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        ref: messagesEndRef
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 489,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TobiraChat.tsx",
                lineNumber: 424,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: styles.inputContainer,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
                        ref: inputRef,
                        value: input,
                        onChange: (e)=>setInput(e.target.value),
                        onKeyDown: handleKeyDown,
                        style: styles.input,
                        rows: 1,
                        disabled: isGenerating || isThinking,
                        placeholder: ""
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 494,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: styles.inputHint,
                        children: "enter ↵"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 504,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/components/TobiraChat.tsx",
                lineNumber: 493,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/components/TobiraChat.tsx",
        lineNumber: 382,
        columnNumber: 5
    }, this);
}
_s(TobiraChat, "7DSJcEjWCIU85AamixmKoVQjMmc=");
_c = TobiraChat;
// ============================================================
// STYLES
// ============================================================
const styles = {
    container: {
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',
        width: '100%',
        maxWidth: '680px',
        margin: '0 auto',
        backgroundColor: '#0a0a0a',
        color: '#c8c8c8',
        fontFamily: "'JetBrains Mono', 'Fira Code', 'Courier New', monospace",
        fontSize: '15px',
        lineHeight: '1.7',
        position: 'relative',
        overflow: 'hidden'
    },
    topBar: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 20px 0',
        flexShrink: 0
    },
    wordmark: {
        color: '#222',
        fontSize: '12px',
        letterSpacing: '0.15em',
        userSelect: 'none'
    },
    menuButton: {
        background: 'none',
        border: 'none',
        color: '#222',
        fontSize: '18px',
        cursor: 'pointer',
        padding: '4px 8px',
        fontFamily: 'inherit',
        letterSpacing: '0.15em',
        lineHeight: 1
    },
    drawer: {
        position: 'absolute',
        top: '48px',
        right: '16px',
        backgroundColor: '#0f0f0f',
        border: '1px solid #1a1a1a',
        zIndex: 100,
        minWidth: '180px',
        display: 'flex',
        flexDirection: 'column'
    },
    drawerItem: {
        background: 'none',
        border: 'none',
        color: '#555',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '12px',
        padding: '10px 20px',
        cursor: 'pointer',
        textAlign: 'left',
        letterSpacing: '0.04em',
        width: '100%',
        transition: 'color 0.3s ease'
    },
    drawerDivider: {
        height: '1px',
        backgroundColor: '#141414',
        margin: '4px 0'
    },
    messagesContainer: {
        flex: 1,
        overflowY: 'auto',
        padding: '24px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        scrollbarWidth: 'none'
    },
    emptyState: {
        flex: 1
    },
    messageWrapper: {
        display: 'flex',
        width: '100%',
        position: 'relative',
        userSelect: 'text'
    },
    messageBubble: {
        maxWidth: '80%',
        lineHeight: '1.6',
        wordBreak: 'break-word',
        whiteSpace: 'pre-wrap',
        position: 'relative'
    },
    userBubble: {
        color: '#888',
        textAlign: 'right',
        fontSize: '14px'
    },
    assistantBubble: {
        color: '#d4d4d4',
        fontSize: '15px'
    },
    generatingCursor: {
        display: 'inline-block',
        marginLeft: '2px',
        // Standard blink while generating text
        animation: 'blink 1s step-end infinite',
        color: '#666'
    },
    // ============================================================
    // PRESENCE IMPROVEMENT 2 — Breathing cursor
    // Appears during the thinking pause — before text starts.
    // Pulses slowly. Like breathing. Like someone present.
    // CSS animation defined in globals.css
    // ============================================================
    thinkingRow: {
        display: 'flex',
        justifyContent: 'flex-start',
        width: '100%'
    },
    breathingCursor: {
        display: 'inline-block',
        color: '#333',
        fontSize: '15px',
        // Slow pulse — breathing, not blinking
        // Animation defined in globals.css as 'breathe'
        animation: 'breathe 2s ease-in-out infinite'
    },
    inputContainer: {
        padding: '16px 20px 32px',
        borderTop: '1px solid #1a1a1a'
    },
    input: {
        width: '100%',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid #2a2a2a',
        color: '#c8c8c8',
        fontFamily: 'inherit',
        fontSize: '15px',
        lineHeight: '1.6',
        padding: '8px 0',
        resize: 'none',
        outline: 'none',
        caretColor: '#666'
    },
    inputHint: {
        marginTop: '6px',
        color: '#1a1a1a',
        fontSize: '10px',
        letterSpacing: '0.1em',
        userSelect: 'none'
    },
    forgetOverlay: {
        position: 'absolute',
        top: '-40px',
        left: '0',
        display: 'flex',
        gap: '12px',
        zIndex: 10
    },
    forgetButton: {
        background: '#1a1a1a',
        border: '1px solid #333',
        color: '#888',
        fontSize: '11px',
        padding: '6px 12px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        letterSpacing: '0.05em'
    },
    cancelButton: {
        background: 'none',
        border: '1px solid #222',
        color: '#555',
        fontSize: '11px',
        padding: '6px 12px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        letterSpacing: '0.05em'
    },
    setupContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        backgroundColor: '#0a0a0a',
        color: '#666',
        fontFamily: "'JetBrains Mono', monospace"
    },
    setupContent: {
        maxWidth: '400px',
        padding: '40px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px'
    },
    setupTitle: {
        color: '#888',
        fontSize: '14px',
        marginBottom: '8px'
    },
    setupStep: {
        fontSize: '13px',
        color: '#555'
    },
    setupCode: {
        display: 'block',
        background: '#111',
        border: '1px solid #222',
        padding: '12px 16px',
        color: '#888',
        fontSize: '13px',
        letterSpacing: '0.02em'
    },
    setupRetry: {
        background: 'none',
        border: '1px solid #222',
        color: '#555',
        padding: '10px 20px',
        cursor: 'pointer',
        fontFamily: 'inherit',
        fontSize: '12px',
        marginTop: '8px',
        letterSpacing: '0.05em',
        alignSelf: 'flex-start'
    },
    loadingContainer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100dvh',
        backgroundColor: '#0a0a0a'
    },
    cursor: {
        width: '2px',
        height: '20px',
        backgroundColor: '#333',
        animation: 'blink 1s step-end infinite'
    }
};
var _c;
__turbopack_context__.k.register(_c, "TobiraChat");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
/**
 * @license React
 * react-jsx-dev-runtime.development.js
 *
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */ "use strict";
"production" !== ("TURBOPACK compile-time value", "development") && function() {
    function getComponentNameFromType(type) {
        if (null == type) return null;
        if ("function" === typeof type) return type.$$typeof === REACT_CLIENT_REFERENCE ? null : type.displayName || type.name || null;
        if ("string" === typeof type) return type;
        switch(type){
            case REACT_FRAGMENT_TYPE:
                return "Fragment";
            case REACT_PROFILER_TYPE:
                return "Profiler";
            case REACT_STRICT_MODE_TYPE:
                return "StrictMode";
            case REACT_SUSPENSE_TYPE:
                return "Suspense";
            case REACT_SUSPENSE_LIST_TYPE:
                return "SuspenseList";
            case REACT_ACTIVITY_TYPE:
                return "Activity";
            case REACT_VIEW_TRANSITION_TYPE:
                return "ViewTransition";
        }
        if ("object" === typeof type) switch("number" === typeof type.tag && console.error("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), type.$$typeof){
            case REACT_PORTAL_TYPE:
                return "Portal";
            case REACT_CONTEXT_TYPE:
                return type.displayName || "Context";
            case REACT_CONSUMER_TYPE:
                return (type._context.displayName || "Context") + ".Consumer";
            case REACT_FORWARD_REF_TYPE:
                var innerType = type.render;
                type = type.displayName;
                type || (type = innerType.displayName || innerType.name || "", type = "" !== type ? "ForwardRef(" + type + ")" : "ForwardRef");
                return type;
            case REACT_MEMO_TYPE:
                return innerType = type.displayName || null, null !== innerType ? innerType : getComponentNameFromType(type.type) || "Memo";
            case REACT_LAZY_TYPE:
                innerType = type._payload;
                type = type._init;
                try {
                    return getComponentNameFromType(type(innerType));
                } catch (x) {}
        }
        return null;
    }
    function testStringCoercion(value) {
        return "" + value;
    }
    function checkKeyStringCoercion(value) {
        try {
            testStringCoercion(value);
            var JSCompiler_inline_result = !1;
        } catch (e) {
            JSCompiler_inline_result = !0;
        }
        if (JSCompiler_inline_result) {
            JSCompiler_inline_result = console;
            var JSCompiler_temp_const = JSCompiler_inline_result.error;
            var JSCompiler_inline_result$jscomp$0 = "function" === typeof Symbol && Symbol.toStringTag && value[Symbol.toStringTag] || value.constructor.name || "Object";
            JSCompiler_temp_const.call(JSCompiler_inline_result, "The provided key is an unsupported type %s. This value must be coerced to a string before using it here.", JSCompiler_inline_result$jscomp$0);
            return testStringCoercion(value);
        }
    }
    function getTaskName(type) {
        if (type === REACT_FRAGMENT_TYPE) return "<>";
        if ("object" === typeof type && null !== type && type.$$typeof === REACT_LAZY_TYPE) return "<...>";
        try {
            var name = getComponentNameFromType(type);
            return name ? "<" + name + ">" : "<...>";
        } catch (x) {
            return "<...>";
        }
    }
    function getOwner() {
        var dispatcher = ReactSharedInternals.A;
        return null === dispatcher ? null : dispatcher.getOwner();
    }
    function UnknownOwner() {
        return Error("react-stack-top-frame");
    }
    function hasValidKey(config) {
        if (hasOwnProperty.call(config, "key")) {
            var getter = Object.getOwnPropertyDescriptor(config, "key").get;
            if (getter && getter.isReactWarning) return !1;
        }
        return void 0 !== config.key;
    }
    function defineKeyPropWarningGetter(props, displayName) {
        function warnAboutAccessingKey() {
            specialPropKeyWarningShown || (specialPropKeyWarningShown = !0, console.error("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://react.dev/link/special-props)", displayName));
        }
        warnAboutAccessingKey.isReactWarning = !0;
        Object.defineProperty(props, "key", {
            get: warnAboutAccessingKey,
            configurable: !0
        });
    }
    function elementRefGetterWithDeprecationWarning() {
        var componentName = getComponentNameFromType(this.type);
        didWarnAboutElementRef[componentName] || (didWarnAboutElementRef[componentName] = !0, console.error("Accessing element.ref was removed in React 19. ref is now a regular prop. It will be removed from the JSX Element type in a future release."));
        componentName = this.props.ref;
        return void 0 !== componentName ? componentName : null;
    }
    function ReactElement(type, key, props, owner, debugStack, debugTask) {
        var refProp = props.ref;
        type = {
            $$typeof: REACT_ELEMENT_TYPE,
            type: type,
            key: key,
            props: props,
            _owner: owner
        };
        null !== (void 0 !== refProp ? refProp : null) ? Object.defineProperty(type, "ref", {
            enumerable: !1,
            get: elementRefGetterWithDeprecationWarning
        }) : Object.defineProperty(type, "ref", {
            enumerable: !1,
            value: null
        });
        type._store = {};
        Object.defineProperty(type._store, "validated", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: 0
        });
        Object.defineProperty(type, "_debugInfo", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: null
        });
        Object.defineProperty(type, "_debugStack", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugStack
        });
        Object.defineProperty(type, "_debugTask", {
            configurable: !1,
            enumerable: !1,
            writable: !0,
            value: debugTask
        });
        Object.freeze && (Object.freeze(type.props), Object.freeze(type));
        return type;
    }
    function jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStack, debugTask) {
        var children = config.children;
        if (void 0 !== children) if (isStaticChildren) if (isArrayImpl(children)) {
            for(isStaticChildren = 0; isStaticChildren < children.length; isStaticChildren++)validateChildKeys(children[isStaticChildren]);
            Object.freeze && Object.freeze(children);
        } else console.error("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
        else validateChildKeys(children);
        if (hasOwnProperty.call(config, "key")) {
            children = getComponentNameFromType(type);
            var keys = Object.keys(config).filter(function(k) {
                return "key" !== k;
            });
            isStaticChildren = 0 < keys.length ? "{key: someKey, " + keys.join(": ..., ") + ": ...}" : "{key: someKey}";
            didWarnAboutKeySpread[children + isStaticChildren] || (keys = 0 < keys.length ? "{" + keys.join(": ..., ") + ": ...}" : "{}", console.error('A props object containing a "key" prop is being spread into JSX:\n  let props = %s;\n  <%s {...props} />\nReact keys must be passed directly to JSX without using spread:\n  let props = %s;\n  <%s key={someKey} {...props} />', isStaticChildren, children, keys, children), didWarnAboutKeySpread[children + isStaticChildren] = !0);
        }
        children = null;
        void 0 !== maybeKey && (checkKeyStringCoercion(maybeKey), children = "" + maybeKey);
        hasValidKey(config) && (checkKeyStringCoercion(config.key), children = "" + config.key);
        if ("key" in config) {
            maybeKey = {};
            for(var propName in config)"key" !== propName && (maybeKey[propName] = config[propName]);
        } else maybeKey = config;
        children && defineKeyPropWarningGetter(maybeKey, "function" === typeof type ? type.displayName || type.name || "Unknown" : type);
        return ReactElement(type, children, maybeKey, getOwner(), debugStack, debugTask);
    }
    function validateChildKeys(node) {
        isValidElement(node) ? node._store && (node._store.validated = 1) : "object" === typeof node && null !== node && node.$$typeof === REACT_LAZY_TYPE && ("fulfilled" === node._payload.status ? isValidElement(node._payload.value) && node._payload.value._store && (node._payload.value._store.validated = 1) : node._store && (node._store.validated = 1));
    }
    function isValidElement(object) {
        return "object" === typeof object && null !== object && object.$$typeof === REACT_ELEMENT_TYPE;
    }
    var React = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)"), REACT_ELEMENT_TYPE = Symbol.for("react.transitional.element"), REACT_PORTAL_TYPE = Symbol.for("react.portal"), REACT_FRAGMENT_TYPE = Symbol.for("react.fragment"), REACT_STRICT_MODE_TYPE = Symbol.for("react.strict_mode"), REACT_PROFILER_TYPE = Symbol.for("react.profiler"), REACT_CONSUMER_TYPE = Symbol.for("react.consumer"), REACT_CONTEXT_TYPE = Symbol.for("react.context"), REACT_FORWARD_REF_TYPE = Symbol.for("react.forward_ref"), REACT_SUSPENSE_TYPE = Symbol.for("react.suspense"), REACT_SUSPENSE_LIST_TYPE = Symbol.for("react.suspense_list"), REACT_MEMO_TYPE = Symbol.for("react.memo"), REACT_LAZY_TYPE = Symbol.for("react.lazy"), REACT_ACTIVITY_TYPE = Symbol.for("react.activity"), REACT_VIEW_TRANSITION_TYPE = Symbol.for("react.view_transition"), REACT_CLIENT_REFERENCE = Symbol.for("react.client.reference"), ReactSharedInternals = React.__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE, hasOwnProperty = Object.prototype.hasOwnProperty, isArrayImpl = Array.isArray, createTask = console.createTask ? console.createTask : function() {
        return null;
    };
    React = {
        react_stack_bottom_frame: function(callStackForError) {
            return callStackForError();
        }
    };
    var specialPropKeyWarningShown;
    var didWarnAboutElementRef = {};
    var unknownOwnerDebugStack = React.react_stack_bottom_frame.bind(React, UnknownOwner)();
    var unknownOwnerDebugTask = createTask(getTaskName(UnknownOwner));
    var didWarnAboutKeySpread = {};
    exports.Fragment = REACT_FRAGMENT_TYPE;
    exports.jsxDEV = function(type, config, maybeKey, isStaticChildren) {
        var trackActualOwner = 1e4 > ReactSharedInternals.recentlyCreatedOwnerStacks++;
        if (trackActualOwner) {
            var previousStackTraceLimit = Error.stackTraceLimit;
            Error.stackTraceLimit = 10;
            var debugStackDEV = Error("react-stack-top-frame");
            Error.stackTraceLimit = previousStackTraceLimit;
        } else debugStackDEV = unknownOwnerDebugStack;
        return jsxDEVImpl(type, config, maybeKey, isStaticChildren, debugStackDEV, trackActualOwner ? createTask(getTaskName(type)) : unknownOwnerDebugTask);
    };
}();
}),
"[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
'use strict';
if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
;
else {
    module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/compiled/react/cjs/react-jsx-dev-runtime.development.js [app-client] (ecmascript)");
}
}),
]);

//# sourceMappingURL=_0l7~~eu._.js.map