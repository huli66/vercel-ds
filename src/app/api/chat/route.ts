import { createDeepSeek } from "@ai-sdk/deepseek";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  const {
    messages,
    apiKey,
    provider = "deepseek",
    modelId = "deepseek-chat",
    systemPrompt,
    temperature,
    maxTokens,
  } = await req.json();

  let model;
  if (provider === "openai") {
    const openai = createOpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY,
    });
    model = openai(modelId);
  } else {
    const deepseek = createDeepSeek({
      apiKey: apiKey || process.env.DEEPSEEK_API_KEY,
    });
    model = deepseek(modelId);
  }

  const result = streamText({
    model,
    system: systemPrompt || undefined,
    messages: await convertToModelMessages(messages),
    temperature: temperature ?? undefined,
    maxOutputTokens: maxTokens ?? undefined,
  });

  return result.toUIMessageStreamResponse();
}
