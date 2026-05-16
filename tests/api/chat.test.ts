import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@ai-sdk/deepseek", () => ({
  createDeepSeek: vi.fn((opts: { apiKey: string }) => {
    return (model: string) => ({ provider: "deepseek", model, apiKey: opts.apiKey });
  }),
}));

vi.mock("ai", () => ({
  streamText: vi.fn(({ model, messages }) => ({
    model,
    messages,
    toUIMessageStreamResponse: () => new Response("stream"),
  })),
  convertToModelMessages: vi.fn(async (msgs) => msgs),
}));

import { POST } from "@/app/api/chat/route";
import { streamText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEEPSEEK_API_KEY = "env-key";
  });

  it("uses provided apiKey over env variable", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
        apiKey: "user-key",
      }),
    });

    await POST(req);

    expect(createDeepSeek).toHaveBeenCalledWith({ apiKey: "user-key" });
  });

  it("falls back to env DEEPSEEK_API_KEY when no apiKey provided", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
      }),
    });

    await POST(req);

    expect(createDeepSeek).toHaveBeenCalledWith({ apiKey: "env-key" });
  });

  it("calls streamText with converted messages", async () => {
    const messages = [{ role: "user", content: "hello" }];
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({ messages, apiKey: "key" }),
    });

    const response = await POST(req);

    expect(streamText).toHaveBeenCalled();
    expect(response).toBeInstanceOf(Response);
  });
});
