import type { UIMessage } from "ai";

export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  model?: string;
  systemPrompt?: string;
}

export interface Conversation extends ConversationMeta {
  messages: UIMessage[];
}

export interface ChatStorage {
  listConversations(): Promise<ConversationMeta[]>;
  getConversation(id: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
}

export interface AppSettings {
  defaultModel: string;
  defaultSystemPrompt: string;
  apiKeys: { deepseek?: string; openai?: string };
  modelParams: { temperature: number; maxTokens: number };
}
