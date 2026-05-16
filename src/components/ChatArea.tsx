"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import type { UIMessage } from "ai";
import { MarkdownRenderer } from "./MarkdownRenderer";

interface ChatAreaProps {
  conversationId: string;
  initialMessages: UIMessage[];
  apiKey: string;
  onMessagesChange: (messages: UIMessage[]) => void;
}

export function ChatArea({
  conversationId,
  initialMessages,
  apiKey,
  onMessagesChange,
}: ChatAreaProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const autoScrollRef = useRef(true);

  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    messages: initialMessages,
  });

  const isLoading = status === "streaming" || status === "submitted";

  const isNearBottom = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 80;
  }, []);

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  }, []);

  // Track scroll position to show/hide the floating button
  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottom();
    setShowScrollBtn(!nearBottom);
    autoScrollRef.current = nearBottom;
  }, [isNearBottom]);

  // Auto-scroll when messages change (new message or streaming update)
  useEffect(() => {
    if (autoScrollRef.current) {
      const el = scrollRef.current;
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    }
  }, [messages]);

  useEffect(() => {
    if (messages.length > 0) {
      onMessagesChange(messages);
    }
  }, [messages]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const text = input;
    setInput("");
    // Force scroll on send
    autoScrollRef.current = true;
    await sendMessage({ text }, { body: { apiKey: apiKey || undefined } });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
      {/* Scrollable message area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: "auto",
          padding: 16,
          position: "relative",
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#999", textAlign: "center" }}>
            发送消息开始对话
          </p>
        )}
        {messages.map((message) => (
          <div
            key={message.id}
            style={{
              marginBottom: 12,
              padding: 12,
              borderRadius: 8,
              backgroundColor:
                message.role === "user" ? "#e3f2fd" : "#f5f5f5",
            }}
          >
            <strong>{message.role === "user" ? "你" : "AI"}: </strong>
            {message.role === "user" ? (
              <span style={{ whiteSpace: "pre-wrap" }}>
                {message.parts
                  .filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join("")}
              </span>
            ) : (
              <MarkdownRenderer
                content={message.parts
                  .filter((part) => part.type === "text")
                  .map((part) => part.text)
                  .join("")}
                isStreaming={
                  isLoading &&
                  message === messages[messages.length - 1]
                }
              />
            )}
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div style={{ color: "#999", padding: 12 }}>AI 正在思考...</div>
        )}
      </div>

      {/* Scroll to bottom floating button */}
      {showScrollBtn && (
        <div style={{ position: "relative" }}>
          <button
            onClick={scrollToBottom}
            aria-label="滚动到底部"
            style={{
              position: "absolute",
              bottom: 8,
              left: "50%",
              transform: "translateX(-50%)",
              width: 40,
              height: 40,
              borderRadius: "50%",
              backgroundColor: "#1976d2",
              color: "#fff",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
              lineHeight: 1,
              boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 10,
            }}
          >
            ↓
          </button>
        </div>
      )}

      {/* Fixed input area */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: 8,
          padding: "12px 16px",
          borderTop: "1px solid #e0e0e0",
          flexShrink: 0,
          alignItems: "flex-end",
        }}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              if (input.trim() && !isLoading) {
                handleSubmit(e);
              }
            }
          }}
          placeholder="输入消息... (Shift+Enter 换行)"
          rows={3}
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 6,
            fontSize: 16,
            resize: "none",
            lineHeight: 1.5,
            minHeight: `${3 * 1.5}em`,
            maxHeight: `${10 * 1.5}em`,
            overflowY: "auto",
            fontFamily: "inherit",
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !input.trim()}
          style={{
            padding: "10px 20px",
            backgroundColor: isLoading ? "#ccc" : "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: 16,
            alignSelf: "flex-end",
          }}
        >
          发送
        </button>
      </form>
    </div>
  );
}
