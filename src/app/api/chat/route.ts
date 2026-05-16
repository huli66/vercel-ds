import { createDeepSeek } from "@ai-sdk/deepseek";
import { streamText, convertToModelMessages } from "ai";

export async function POST(req: Request) {
  // 客户端通过 sendMessage 的 body 选项传入额外字段，会自动合并到请求体中
  const { messages, apiKey } = await req.json();

  // 优先使用客户端传入的 apiKey，未传则使用环境变量
  const deepseek = createDeepSeek({
    apiKey: apiKey || process.env.DEEPSEEK_API_KEY,
  });

  // 客户端发送的是 UIMessage 格式（包含 parts 数组），
  // 但 streamText 需要 ModelMessage 格式（包含 content 字符串/数组），
  // 因此需要通过 convertToModelMessages 进行转换（该函数是异步的）
  const result = streamText({
    model: deepseek("deepseek-chat"),
    messages: await convertToModelMessages(messages),
  });

  // toUIMessageStreamResponse 将流式结果转为符合 UIMessage 协议的 Response，
  // 客户端的 useChat hook 能自动解析此格式并实时更新消息
  return result.toUIMessageStreamResponse();
}
