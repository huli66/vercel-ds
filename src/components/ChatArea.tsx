"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, useEffect, useRef, useCallback, type FormEvent } from "react";
import type { UIMessage } from "ai";
import { MessageBubble } from "./MessageBubble";
import { ModelSelector } from "./ModelSelector";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Square, ArrowDown } from "lucide-react";
import { getModelConfig } from "@/lib/models";
import { useSettings } from "@/contexts/SettingsContext";

interface ChatAreaProps {
  conversationId: string;
  initialMessages: UIMessage[];
  model: string;
  systemPrompt: string;
  onMessagesChange: (messages: UIMessage[]) => void;
  onModelChange: (model: string) => void;
  onSystemPromptChange: (prompt: string) => void;
}

export function ChatArea({
  conversationId,
  initialMessages,
  model,
  systemPrompt,
  onMessagesChange,
  onModelChange,
  onSystemPromptChange,
}: ChatAreaProps) {
  const { settings } = useSettings();
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const autoScrollRef = useRef(true);

  const modelConfig = getModelConfig(model);
  const provider = modelConfig?.provider ?? "deepseek";
  const modelId = modelConfig?.modelId ?? "deepseek-chat";

  const apiKey =
    provider === "openai"
      ? settings.apiKeys.openai
      : settings.apiKeys.deepseek;

  const { messages, setMessages, sendMessage, status, stop } = useChat({
    id: conversationId,
    transport: new DefaultChatTransport({ api: "/api/chat" }),
    messages: initialMessages,
  });

  const isLoading = status === "streaming" || status === "submitted";

  const buildBody = useCallback(() => {
    return {
      apiKey: apiKey || undefined,
      provider,
      modelId,
      systemPrompt: systemPrompt || undefined,
      temperature: settings.modelParams.temperature,
      maxTokens: settings.modelParams.maxTokens,
    };
  }, [apiKey, provider, modelId, systemPrompt, settings.modelParams]);

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

  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottom();
    setShowScrollBtn(!nearBottom);
    autoScrollRef.current = nearBottom;
  }, [isNearBottom]);

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
    autoScrollRef.current = true;
    await sendMessage({ text }, { body: buildBody() });
  };

  const handleStop = () => {
    stop();
  };

  const handleRegenerate = useCallback(() => {
    const lastUserIdx = messages.findLastIndex((m) => m.role === "user");
    if (lastUserIdx === -1) return;

    const userMessage = messages[lastUserIdx];
    const userText = userMessage.parts
      .filter((p) => p.type === "text")
      .map((p) => p.text)
      .join("");

    const truncated = messages.slice(0, lastUserIdx);
    setMessages(truncated);
    autoScrollRef.current = true;

    setTimeout(() => {
      sendMessage({ text: userText }, { body: buildBody() });
    }, 0);
  }, [messages, setMessages, sendMessage, buildBody]);

  const handleEdit = useCallback(
    (index: number, newText: string) => {
      const truncated = messages.slice(0, index);
      setMessages(truncated);
      autoScrollRef.current = true;

      setTimeout(() => {
        sendMessage({ text: newText }, { body: buildBody() });
      }, 0);
    },
    [messages, setMessages, sendMessage, buildBody]
  );

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Model selector bar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border flex-shrink-0">
        <ModelSelector value={model} onChange={onModelChange} />
        <input
          type="text"
          value={systemPrompt}
          onChange={(e) => onSystemPromptChange(e.target.value)}
          placeholder="系统提示词 (可选)"
          className="flex-1 text-sm bg-transparent border-none outline-none text-muted-foreground placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Scrollable message area */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex-1 min-h-0 overflow-y-auto relative"
      >
        <div className="max-w-3xl mx-auto px-4">
          {messages.length === 0 && (
            <div className="flex items-center justify-center h-full min-h-[200px]">
              <p className="text-muted-foreground">发送消息开始对话</p>
            </div>
          )}
          {messages.map((message, idx) => (
            <MessageBubble
              key={message.id}
              message={message}
              isLast={idx === messages.length - 1}
              isStreaming={isLoading}
              onEdit={
                message.role === "user"
                  ? (newText) => handleEdit(idx, newText)
                  : undefined
              }
              onRegenerate={
                message.role === "assistant" && idx === messages.length - 1
                  ? handleRegenerate
                  : undefined
              }
            />
          ))}
          {isLoading && messages[messages.length - 1]?.role === "user" && (
            <div className="flex gap-3 py-4">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
              </div>
              <div className="text-muted-foreground text-sm pt-2">
                AI 正在思考...
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <div className="relative">
          <Button
            onClick={scrollToBottom}
            size="icon"
            variant="secondary"
            className="absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full shadow-lg z-10 h-9 w-9"
            aria-label="滚动到底部"
          >
            <ArrowDown className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2 p-3 border-t border-border flex-shrink-0"
      >
        <div className="flex-1 max-w-3xl mx-auto flex items-end gap-2 w-full">
          <Textarea
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
            rows={1}
            className="flex-1 resize-none min-h-[40px] max-h-[200px]"
          />
          {isLoading ? (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="flex-shrink-0"
              onClick={handleStop}
            >
              <Square className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              size="icon"
              className="flex-shrink-0"
              disabled={!input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
