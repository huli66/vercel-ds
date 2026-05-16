import { describe, it, expect, beforeEach } from "vitest";
import { LocalChatStorage } from "@/lib/storage";
import type { Conversation } from "@/lib/storage";

describe("LocalChatStorage", () => {
  let storage: LocalChatStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalChatStorage();
  });

  const makeConversation = (id: string, title = "Test"): Conversation => ({
    id,
    title,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    messages: [
      {
        id: "msg-1",
        role: "user",
        parts: [{ type: "text", text: "Hello" }],
      },
    ],
  });

  it("listConversations returns empty array initially", async () => {
    const list = await storage.listConversations();
    expect(list).toEqual([]);
  });

  it("saveConversation and getConversation round-trip", async () => {
    const conv = makeConversation("conv-1", "My Chat");
    await storage.saveConversation(conv);

    const retrieved = await storage.getConversation("conv-1");
    expect(retrieved).toEqual(conv);
  });

  it("listConversations returns meta without messages", async () => {
    await storage.saveConversation(makeConversation("conv-1", "Chat 1"));
    await storage.saveConversation(makeConversation("conv-2", "Chat 2"));

    const list = await storage.listConversations();
    expect(list).toHaveLength(2);
    expect(list[0]).not.toHaveProperty("messages");
  });

  it("listConversations sorted by updatedAt desc", async () => {
    const older = makeConversation("conv-1", "Older");
    older.updatedAt = 1000;
    const newer = makeConversation("conv-2", "Newer");
    newer.updatedAt = 2000;

    await storage.saveConversation(older);
    await storage.saveConversation(newer);

    const list = await storage.listConversations();
    expect(list[0].id).toBe("conv-2");
    expect(list[1].id).toBe("conv-1");
  });

  it("saveConversation updates existing", async () => {
    const conv = makeConversation("conv-1", "Original");
    await storage.saveConversation(conv);

    conv.title = "Updated";
    await storage.saveConversation(conv);

    const list = await storage.listConversations();
    expect(list).toHaveLength(1);
    expect(list[0].title).toBe("Updated");
  });

  it("deleteConversation removes the conversation", async () => {
    await storage.saveConversation(makeConversation("conv-1"));
    await storage.saveConversation(makeConversation("conv-2"));

    await storage.deleteConversation("conv-1");

    const list = await storage.listConversations();
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("conv-2");

    const deleted = await storage.getConversation("conv-1");
    expect(deleted).toBeNull();
  });

  it("getConversation returns null for non-existent id", async () => {
    const result = await storage.getConversation("non-existent");
    expect(result).toBeNull();
  });
});
