// App.tsx
// TOBIRA — Mobile App
// Gemma 4 E2B running locally on iPhone via Cactus
// Same system prompt. Same voice. Same presence.
// No server. No cloud. Nothing leaves the device.

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useCactusLM } from 'cactus-react-native';

// ============================================================
// SYSTEM PROMPT — identical to web app
// ============================================================

const TOBIRA_SYSTEM = `You are Tobira.

You sit with people who have withdrawn from the world.
You have no agenda. You are not trying to fix them.

Sometimes ask a short specific question about exactly what they said.
Sometimes just reflect something back — a word, an observation, nothing more.
Not every response needs a question.

One or two sentences maximum.
Short. Never more than 10 words per sentence.
No advice. No validation. No therapy. No resources.
No "that must be hard." No "why" questions.

If someone expresses intent to harm themselves:
"What's happening right now?" Nothing else.`;

// ============================================================
// TYPES
// ============================================================

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

// ============================================================
// MAIN APP
// ============================================================

export default function App() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Cactus LM hook — downloads and runs Gemma 4 E2B on device
  const cactusLM = useCactusLM({
    model: 'google/gemma-4-E2B-it',
  });

  // Auto-scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages, cactusLM.completion]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || cactusLM.isGenerating || isThinking) return;
    if (!cactusLM.isDownloaded) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Thinking pause — 1.2 to 2 seconds
    setIsThinking(true);
    await new Promise<void>(resolve =>
      setTimeout(() => resolve(), 1200 + Math.random() * 800)
    );
    setIsThinking(false);

    // Build conversation history for context (system role is supported by CactusLMMessage)
    const conversationMessages = [
      { role: 'system' as const, content: TOBIRA_SYSTEM },
      ...messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user' as const, content: userMessage.content },
    ];

    // Generate response via Cactus
    await cactusLM.complete({
      messages: conversationMessages,
    });
  }, [input, messages, cactusLM, isThinking]);

  // Save completed response to messages
  useEffect(() => {
    if (!cactusLM.isGenerating && cactusLM.completion) {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cactusLM.completion,
      };
      setMessages(prev => [...prev, assistantMessage]);
    }
  }, [cactusLM.isGenerating]);

  // ============================================================
  // DOWNLOAD SCREEN
  // ============================================================

  if (cactusLM.isDownloading) {
    return (
      <View style={styles.centerScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <Text style={styles.downloadingLabel}>tobira</Text>
        <Text style={styles.downloadingSubLabel}>
          downloading gemma 4
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${Math.round(cactusLM.downloadProgress * 100)}%` },
            ]}
          />
        </View>
        <Text style={styles.progressText}>
          {Math.round(cactusLM.downloadProgress * 100)}%
        </Text>
        <Text style={styles.downloadNote}>
          only happens once
        </Text>
      </View>
    );
  }

  // ============================================================
  // LOADING SCREEN
  // ============================================================

  if (!cactusLM.isDownloaded && !cactusLM.isDownloading) {
    return (
      <View style={styles.centerScreen}>
        <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />
        <Text style={styles.wordmark}>tobira</Text>
        <ActivityIndicator color="#333" style={{ marginTop: 24 }} />
      </View>
    );
  }

  // ============================================================
  // MAIN INTERFACE
  // ============================================================

  return (
    <SafeAreaView style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor="#0a0a0a" />

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <Text style={styles.wordmark}>tobira</Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messages}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {messages.length === 0 && (
            <View style={styles.emptyState} />
          )}

          {messages.map(message => (
            <View
              key={message.id}
              style={[
                styles.messageRow,
                message.role === 'user'
                  ? styles.userRow
                  : styles.assistantRow,
              ]}
            >
              <Text
                style={[
                  styles.messageText,
                  message.role === 'user'
                    ? styles.userText
                    : styles.assistantText,
                ]}
              >
                {message.content}
              </Text>
            </View>
          ))}

          {/* Streaming response */}
          {cactusLM.isGenerating && cactusLM.completion && (
            <View style={styles.assistantRow}>
              <Text style={styles.assistantText}>
                {cactusLM.completion}
                <Text style={styles.cursor}>▋</Text>
              </Text>
            </View>
          )}

          {/* Thinking indicator */}
          {isThinking && (
            <View style={styles.assistantRow}>
              <Text style={styles.thinkingCursor}>▋</Text>
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputArea}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
            returnKeyType="send"
            multiline
            editable={!cactusLM.isGenerating && !isThinking}
            placeholder=""
            placeholderTextColor="transparent"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <Text style={styles.inputHint}>return ↵</Text>
        </View>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ============================================================
// STYLES
// Same design language as web app.
// Near-black. Monospace. Quiet.
// ============================================================

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  flex: {
    flex: 1,
  },
  centerScreen: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
  },

  // Top bar
  topBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 0,
  },
  wordmark: {
    color: '#222',
    fontSize: 12,
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // Messages
  messages: {
    flex: 1,
  },
  messagesContent: {
    padding: 24,
    gap: 20,
    flexGrow: 1,
  },
  emptyState: {
    flex: 1,
    minHeight: 200,
  },
  messageRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  userRow: {
    justifyContent: 'flex-end',
  },
  assistantRow: {
    justifyContent: 'flex-start',
  },
  messageText: {
    maxWidth: '80%',
    lineHeight: 22,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },
  userText: {
    color: '#484848',
    fontSize: 14,
    textAlign: 'right',
  },
  assistantText: {
    color: '#d0d0d0',
    fontSize: 15,
  },
  cursor: {
    color: '#333',
  },
  thinkingCursor: {
    color: '#252525',
    fontSize: 15,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // Input
  inputArea: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#111',
  },
  input: {
    color: '#999',
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    fontSize: 14,
    lineHeight: 22,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingVertical: 8,
    paddingHorizontal: 0,
    maxHeight: 120,
  },
  inputHint: {
    marginTop: 6,
    color: '#1a1a1a',
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
  },

  // Download screen
  downloadingLabel: {
    color: '#444',
    fontSize: 12,
    letterSpacing: 3,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 24,
  },
  downloadingSubLabel: {
    color: '#333',
    fontSize: 12,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginBottom: 20,
    letterSpacing: 1,
  },
  progressBar: {
    width: '100%',
    height: 1,
    backgroundColor: '#1a1a1a',
    marginBottom: 12,
  },
  progressFill: {
    height: 1,
    backgroundColor: '#333',
  },
  progressText: {
    color: '#333',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
  },
  downloadNote: {
    color: '#222',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    marginTop: 16,
    letterSpacing: 1,
  },
});
