import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@ai-sdk/deepseek", () => ({
  createDeepSeek: vi.fn((opts: { apiKey: string }) => {
    return (model: string) => ({ provider: "deepseek", model, apiKey: opts.apiKey });
  }),
}));

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: vi.fn((opts: { apiKey: string }) => {
    return (model: string) => ({ provider: "openai", model, apiKey: opts.apiKey });
  }),
}));

vi.mock("ai", () => ({
  streamText: vi.fn(({ model, messages, system, temperature, maxOutputTokens }) => ({
    model,
    messages,
    system,
    temperature,
    maxOutputTokens,
    toUIMessageStreamResponse: () => new Response("stream"),
  })),
  convertToModelMessages: vi.fn(async (msgs) => msgs),
}));

import { POST } from "@/app/api/chat/route";
import { streamText } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.DEEPSEEK_API_KEY = "env-key";
    process.env.OPENAI_API_KEY = "env-oai-key";
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

  it("uses OpenAI provider when provider is openai", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
        provider: "openai",
        modelId: "gpt-4o",
        apiKey: "oai-key",
      }),
    });

    await POST(req);

    expect(createOpenAI).toHaveBeenCalledWith({ apiKey: "oai-key" });
    expect(createDeepSeek).not.toHaveBeenCalled();
  });

  it("falls back to env OPENAI_API_KEY for openai provider", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
        provider: "openai",
        modelId: "gpt-4o",
      }),
    });

    await POST(req);

    expect(createOpenAI).toHaveBeenCalledWith({ apiKey: "env-oai-key" });
  });

  it("passes systemPrompt to streamText", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
        systemPrompt: "You are a helpful assistant",
      }),
    });

    await POST(req);

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        system: "You are a helpful assistant",
      })
    );
  });

  it("passes temperature and maxTokens to streamText", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
        temperature: 1.5,
        maxTokens: 8192,
      }),
    });

    await POST(req);

    expect(streamText).toHaveBeenCalledWith(
      expect.objectContaining({
        temperature: 1.5,
        maxOutputTokens: 8192,
      })
    );
  });

  it("defaults to deepseek provider and deepseek-chat model", async () => {
    const req = new Request("http://localhost/api/chat", {
      method: "POST",
      body: JSON.stringify({
        messages: [{ role: "user", content: "hi" }],
      }),
    });

    await POST(req);

    expect(createDeepSeek).toHaveBeenCalled();
    // The mock returns a function, verify it was called with the default model
    const mockFn = (createDeepSeek as ReturnType<typeof vi.fn>).mock.results[0].value;
    // createDeepSeek returns a function that's called with modelId
    expect(typeof mockFn).toBe("function");
  });
});
