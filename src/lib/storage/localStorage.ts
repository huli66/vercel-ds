import type { ChatStorage, Conversation, ConversationMeta } from "./types";

// localStorage 中存储��有对话的 key
const STORAGE_KEY = "chat-conversations";

/**
 * 基于 localStorage 的聊天存储适配器
 * 实现了 ChatStorage 接口，所有方法返回 Promise 以保持与服务端存储一致的 API
 * 如需切换为服务端存储，创建一个新类实现 ChatStorage 接口即可，无需修改业务代码
 */
export class LocalChatStorage implements ChatStorage {
  private getAll(): Conversation[] {
    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  }

  private saveAll(conversations: Conversation[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  }

  // 返回对话列表（不含 messages），按更新时间倒序排列
  async listConversations(): Promise<ConversationMeta[]> {
    return this.getAll()
      .map(({ id, title, createdAt, updatedAt }) => ({
        id,
        title,
        createdAt,
        updatedAt,
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async getConversation(id: string): Promise<Conversation | null> {
    return this.getAll().find((c) => c.id === id) ?? null;
  }

  // 保存对话：��果 id 已存在则更新，否则新增
  async saveConversation(conversation: Conversation): Promise<void> {
    const all = this.getAll();
    const index = all.findIndex((c) => c.id === conversation.id);
    if (index >= 0) {
      all[index] = conversation;
    } else {
      all.push(conversation);
    }
    this.saveAll(all);
  }

  async deleteConversation(id: string): Promise<void> {
    const all = this.getAll().filter((c) => c.id !== id);
    this.saveAll(all);
  }
}
