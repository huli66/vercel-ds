"use client";

import { useState, useEffect, useCallback } from "react";
import { Sidebar } from "@/components/Sidebar";
import { ChatArea } from "@/components/ChatArea";
import { MobileSidebarToggle } from "@/components/MobileSidebarToggle";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";
import { LocalChatStorage } from "@/lib/storage";
import type { ConversationMeta, Conversation } from "@/lib/storage";
import type { UIMessage } from "ai";
import { Sheet, SheetContent } from "@/components/ui/sheet";

const storage = new LocalChatStorage();

function generateTitle(messages: UIMessage[]): string {
  const firstUserMsg = messages.find((m) => m.role === "user");
  if (!firstUserMsg) return "新对话";
  const text = firstUserMsg.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
  return text.slice(0, 20) || "新对话";
}

function ChatApp() {
  const { settings } = useSettings();
  const [conversations, setConversations] = useState<ConversationMeta[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeMessages, setActiveMessages] = useState<UIMessage[]>([]);
  const [activeModel, setActiveModel] = useState(settings.defaultModel);
  const [activeSystemPrompt, setActiveSystemPrompt] = useState(
    settings.defaultSystemPrompt
  );
  const [mobileOpen, setMobileOpen] = useState(false);

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
      model: settings.defaultModel,
      systemPrompt: settings.defaultSystemPrompt,
      messages: [],
    };
    storage.saveConversation(conv).then(() => {
      storage.listConversations().then(setConversations);
      setActiveId(id);
      setActiveMessages([]);
      setActiveModel(settings.defaultModel);
      setActiveSystemPrompt(settings.defaultSystemPrompt);
    });
    setMobileOpen(false);
  }, [settings.defaultModel, settings.defaultSystemPrompt]);

  const handleSelect = useCallback(async (id: string) => {
    const conv = await storage.getConversation(id);
    if (conv) {
      setActiveId(id);
      setActiveMessages(conv.messages);
      setActiveModel(conv.model ?? "deepseek:deepseek-chat");
      setActiveSystemPrompt(conv.systemPrompt ?? "");
    }
    setMobileOpen(false);
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
          model: activeModel,
          systemPrompt: activeSystemPrompt,
          messages,
        })
        .then(() => {
          storage.listConversations().then(setConversations);
        });
    },
    [activeId, conversations, activeModel, activeSystemPrompt]
  );

  const handleModelChange = useCallback(
    (model: string) => {
      setActiveModel(model);
      if (activeId) {
        const conv = conversations.find((c) => c.id === activeId);
        if (conv) {
          storage.saveConversation({
            ...conv,
            model,
            updatedAt: Date.now(),
            messages: [],
          });
        }
      }
    },
    [activeId, conversations]
  );

  const handleSystemPromptChange = useCallback(
    (prompt: string) => {
      setActiveSystemPrompt(prompt);
    },
    []
  );

  const sidebarContent = (
    <Sidebar
      conversations={conversations}
      activeId={activeId}
      onSelect={handleSelect}
      onNew={handleNew}
      onDelete={handleDelete}
    />
  );

  return (
    <div className="flex h-screen">
      {/* Desktop sidebar */}
      <div className="hidden md:block">{sidebarContent}</div>

      {/* Mobile sidebar sheet */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-64">
          {sidebarContent}
        </SheetContent>
      </Sheet>

      <div className="flex-1 flex flex-col min-h-0">
        {/* Mobile header */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 border-b border-border">
          <MobileSidebarToggle onClick={() => setMobileOpen(true)} />
          <span className="text-sm font-medium">AI Chat</span>
        </div>

        {activeId ? (
          <ChatArea
            key={activeId}
            conversationId={activeId}
            initialMessages={activeMessages}
            model={activeModel}
            systemPrompt={activeSystemPrompt}
            onMessagesChange={handleMessagesChange}
            onModelChange={handleModelChange}
            onSystemPromptChange={handleSystemPromptChange}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <p>选择一个对话或新建对话开始聊天</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function Page() {
  return (
    <SettingsProvider>
      <ChatApp />
    </SettingsProvider>
  );
}
