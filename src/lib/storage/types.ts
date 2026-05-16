import type { UIMessage } from "ai";

// 对话元数据（用于侧边栏列表展示，不含消息内容以减少数据量）
export interface ConversationMeta {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
}

// 完整对话数据（包含消息列表）
export interface Conversation extends ConversationMeta {
  messages: UIMessage[];
}

/**
 * 聊天存储接口
 * 所有方法返回 Promise，便于未来替换为服务端 API 调用
 * 实现此接口即可创建新的存储后端（如 REST API、IndexedDB 等）
 */
export interface ChatStorage {
  listConversations(): Promise<ConversationMeta[]>;
  getConversation(id: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
}
