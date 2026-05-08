module.exports = [
"[project]/lib/voice.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
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
    if ("TURBOPACK compile-time truthy", 1) return 'off';
    //TURBOPACK unreachable
    ;
}
function setVoicePreference(mode) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
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
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const setVoice = undefined;
}
function speakWord(word, mode) {
    if (mode === 'off') return;
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const utterance = undefined;
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
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
}
function isVoiceAvailable() {
    if ("TURBOPACK compile-time truthy", 1) return false;
    //TURBOPACK unreachable
    ;
}
}),
"[project]/components/TobiraChat.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>TobiraChat
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/voice.ts [app-ssr] (ecmascript)");
'use client';
;
;
;
function TobiraChat() {
    const [messages, setMessages] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [input, setInput] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [isGenerating, setIsGenerating] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [isThinking, setIsThinking] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false); // thinking pause state
    const [ollamaReady, setOllamaReady] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showForgetConfirm, setShowForgetConfirm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [showSettings, setShowSettings] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [mounted, setMounted] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false); // for screen wake fade-in
    // Voice state
    const [voiceMode, setVoiceMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('off');
    const [voiceAvailable, setVoiceAvailable] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const wordBufferRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WordBuffer"]());
    const messagesEndRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const inputRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const holdTimerRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const sessionId = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])('');
    // ============================================================
    // PRESENCE IMPROVEMENT 4 — Screen wake on load
    // Fades in from black over 800ms.
    // The room comes into focus. Not a page load.
    // ============================================================
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        const timer = setTimeout(()=>setMounted(true), 50);
        return ()=>clearTimeout(timer);
    }, []);
    // Initialize session + voice
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        checkOllama();
    }, []);
    // Auto-scroll
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        });
    }, [
        messages
    ]);
    // Focus input
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (ollamaReady) inputRef.current?.focus();
    }, [
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["setVoicePreference"])(mode);
        if (mode === 'off') (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stopSpeaking"])();
    }
    const sendWithMessages = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (msgs)=>{
        // ============================================================
        // PRESENCE IMPROVEMENT 1 — Thinking pause
        // 1.2-2 seconds of silence before Tobira responds.
        // Variable — never exactly the same. Like a real person.
        // Shows as breathing cursor, not loading spinner.
        // ============================================================
        setIsThinking(true);
        const thinkingDelay = 1200 + Math.random() * 800;
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sleep"])(thinkingDelay);
        setIsThinking(false);
        setIsGenerating(true);
        const assistantId = crypto.randomUUID();
        // ============================================================
        // PRESENCE IMPROVEMENT 3 — Message arrives from below
        // New messages start with arriving: true
        // CSS animation fades them in from 8px below
        // arriving flag removed after animation completes
        // ============================================================
        setMessages((prev)=>[
                ...prev,
                {
                    id: assistantId,
                    role: 'assistant',
                    content: '',
                    timestamp: Date.now(),
                    arriving: true
                }
            ]);
        // Remove arriving flag after animation
        setTimeout(()=>{
            setMessages((prev)=>prev.map((m)=>m.id === assistantId ? {
                        ...m,
                        arriving: false
                    } : m));
        }, 300);
        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    messages: msgs.map((m)=>({
                            role: m.role,
                            content: m.content,
                            timestamp: m.timestamp
                        })),
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
                                setMessages((prev)=>prev.map((m)=>m.id === assistantId ? {
                                            ...m,
                                            content: fullContent
                                        } : m));
                                // Voice — speak word by word as tokens arrive
                                const word = wordBufferRef.current.add(parsed.token);
                                if (word) {
                                    const pause = (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["getPauseDuration"])(word);
                                    if (pause > 0) await (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["sleep"])(pause);
                                    (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["speakWord"])(word, voiceMode);
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
            if (remaining) (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["speakWord"])(remaining, voiceMode);
            wordBufferRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WordBuffer"]();
        } catch  {
            setMessages((prev)=>prev.map((m)=>m.id === assistantId ? {
                        ...m,
                        content: '...'
                    } : m));
        } finally{
            setIsGenerating(false);
            inputRef.current?.focus();
        }
    }, [
        voiceMode
    ]);
    async function sendMessage() {
        const text = input.trim();
        if (!text || isGenerating || isThinking) return;
        // Stop any speech in progress
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stopSpeaking"])();
        wordBufferRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WordBuffer"]();
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
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["stopSpeaking"])();
        wordBufferRef.current = new __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$voice$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["WordBuffer"]();
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        inputRef.current?.focus();
    }
    function copyFamilyLink() {
        if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
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
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: styles.setupContainer,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: styles.setupContent,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: styles.setupTitle,
                        children: "tobira needs one thing"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 353,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: styles.setupStep,
                        children: "1. Install Ollama at ollama.ai"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 354,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: styles.setupStep,
                        children: "2. Open terminal and run:"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 355,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                        style: styles.setupCode,
                        children: "ollama pull gemma2:2b"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 356,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        style: styles.setupStep,
                        children: "3. Refresh this page"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 357,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            style: styles.loadingContainer,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        style: {
            ...styles.container,
            opacity: mounted ? 1 : 0,
            transition: 'opacity 0.8s ease'
        },
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: styles.topBar,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        style: styles.wordmark,
                        children: "tobira"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 390,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
            showSettings && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: styles.drawer,
                children: [
                    voiceAvailable && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: styles.drawerDivider
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 413,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        style: styles.drawerItem,
                        onClick: copyFamilyLink,
                        children: "copy family link"
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 414,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: styles.messagesContainer,
                children: [
                    messages.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: styles.emptyState
                    }, void 0, false, {
                        fileName: "[project]/components/TobiraChat.tsx",
                        lineNumber: 426,
                        columnNumber: 11
                    }, this),
                    messages.map((message, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
                                showForgetConfirm === message.id && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: styles.forgetOverlay,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            style: styles.forgetButton,
                                            onClick: ()=>forgetMessage(message.id),
                                            children: "forget this"
                                        }, void 0, false, {
                                            fileName: "[project]/components/TobiraChat.tsx",
                                            lineNumber: 448,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    style: {
                                        ...styles.messageBubble,
                                        ...message.role === 'user' ? styles.userBubble : styles.assistantBubble
                                    },
                                    children: [
                                        message.content,
                                        isGenerating && message.role === 'assistant' && index === messages.length - 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    isThinking && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        style: styles.thinkingRow,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
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
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                style: styles.inputContainer,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("textarea", {
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
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
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
}),
"[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

module.exports = __turbopack_context__.r("[project]/node_modules/next/dist/server/route-modules/app-page/module.compiled.js [app-ssr] (ecmascript)").vendored['react-ssr'].ReactJsxDevRuntime;
}),
];

//# sourceMappingURL=_0uxoh1t._.js.map