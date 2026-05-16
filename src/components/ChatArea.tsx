"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, type FormEvent } from "react";
import type { UIMessage } from "ai";

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

  // useChat 是 AI SDK 提供的 React hook，用于管理聊天状态和流式响应
  // - id: 聊天会话标识符，用于区分不同对话
  // - transport: 指定请求发送方式，DefaultChatTransport 默认向 /api/chat 发送 POST 请求
  //   如果不传 transport，useChat 也会默认使用 DefaultChatTransport({ api: "/api/chat" })
  // - messages: 初始消息列表，用于恢复历史对话
  // 返回值:
  // - messages: 当前对话的所有消息（UIMessage[] 格式，包含 parts 数组而非 content 字符串）
  // - sendMessage: 发送消息的方法，接受 { text } 和可选的 options（如 body、headers）
  // - status: 当前状态 "ready" | "submitted" | "streaming" | "error"
  const { messages, sendMessage, status } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    messages: initialMessages,
  });

  const isLoading = status === "streaming" || status === "submitted";

  // 当消息变化时通知父组件，用于持久化到存储层
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
    // sendMessage 的第二个参数 options.body 会合并到 POST 请求体中
    // 服务端可通过 req.json() 获取这些额外字段
    await sendMessage({ text }, { body: { apiKey: apiKey || undefined } });
  };

  return (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: 20 }}>
      <div
        style={{
          flex: 1,
          border: "1px solid #ddd",
          borderRadius: 8,
          padding: 16,
          overflowY: "auto",
          marginBottom: 16,
        }}
      >
        {messages.length === 0 && (
          <p style={{ color: "#999", textAlign: "center" }}>
            发送消息开始对话
          </p>
        )}
        {/* AI SDK v6 中消息内容通过 message.parts 数组获取，而非 message.content */}
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
            <span style={{ whiteSpace: "pre-wrap" }}>
              {message.parts
                .filter((part) => part.type === "text")
                .map((part) => part.text)
                .join("")}
            </span>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div style={{ color: "#999", padding: 12 }}>AI 正在思考...</div>
        )}
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="输入消息..."
          style={{
            flex: 1,
            padding: "10px 14px",
            border: "1px solid #ddd",
            borderRadius: 6,
            fontSize: 16,
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
          }}
        >
          发送
        </button>
      </form>
    </div>
  );
}
