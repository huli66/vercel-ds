"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { LocalChatStorage } from "@/lib/storage";
import type { ConversationMeta, Conversation } from "@/lib/storage";
import type { UIMessage } from "ai";

// 存储实例，当前使用 localStorage 适配器
// 如需切换为服务端存储，只需替换为实现了 ChatStorage 接口的其他 adapter
const storage = new LocalChatStorage();

// 根据对话中第一条用户消息自动生成标题（取前 20 个字符）
function generateTitle(messages: UIMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "新对话";
  const text = firstUserMsg.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
  return text.slice(0, 20) || "新对话";
}

export default function Page() {
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<UIMessage[]>([]);
  const [apiKey, setApiKey] = useState("");

  // 页面加载时从存储中读取对话列表
  useEffect(() => {
    storage.listConversations().then(setConversations);
  }, []);

  const handleNew = useCallback(() => {
    const id = crypto.randomUUID();
    const now = Date.now();
    const conv: Conversation = {
      id,
      title: "新对话",
      createdAt: now,
      updatedAt: now,
      messages: [],
    };
    storage.saveConversation(conv).then(() => {
      storage.listConversations().then(setConversations);
      setActiveId(id);
      setActiveMessages([]);
    });
  }, []);

  const handleSelect = useCallback(async (id: string) => {
    const conv = await storage.getConversation(id);
    if (conv) {
      setActiveId(id);
      setActiveMessages(conv.messages);
    }
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      await storage.deleteConversation(id);
      const list = await storage.listConversations();
      setConversations(list);
      if (activeId === id) {
        setActiveId(null);
        setActiveMessages([]);
      }
    },
    [activeId]
  );

  // 当 ChatArea ��消息变化时（发送/���收消息后），持久化到��储并更���侧边栏标题
  const handleMessagesChange = useCallback(
    (messages: UIMessage[]) => {
      if (!activeId) return;
      const title = generateTitle(messages);
      storage
        .saveConversation({
          id: activeId,
          title,
          createdAt:
            conversations.find((c) => c.id === activeId)?.createdAt ??
            Date.now(),
          updatedAt: Date.now(),
          messages,
        })
        .then(() => {
          storage.listConversations().then(setConversations);
        });
    },
    [activeId, conversations]
  );

  return (
    <div style={{ display: "flex", height: "100vh" }}>
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        onSelect={handleSelect}
        onNew={handleNew}
        onDelete={handleDelete}
      />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
        <div style={{ padding: "12px 20px", borderBottom: "1px solid #e0e0e0", flexShrink: 0 }}>
          <label style={{ fontSize: 14, color: "#666" }}>
            API Key (可选):
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="sk-..."
            style={{
              marginLeft: 8,
              padding: "6px 10px",
              border: "1px solid #ddd",
              borderRadius: 4,
              width: 300,
            }}
          />
        </div>

        {/* 使用 key={activeId} 在切换对话时强制重新挂载 ChatArea，
            这样 useChat hook 会用新的 messages 初始化，避免不同对话间状态混乱 */}
        {activeId ? (
          <ChatArea
            key={activeId}
            conversationId={activeId}
            initialMessages={activeMessages}
            apiKey={apiKey}
            onMessagesChange={handleMessagesChange}
          />
        ) : (
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#999",
            }}
          >
            <p>选择一个对话或新建对话开始聊天</p>
          </div>
        )}
      </div>
    </div>
  );
}
