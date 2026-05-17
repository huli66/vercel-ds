# AI Chat 项目文档

## 1. 项目概述

基于 Vercel AI SDK v6 构建的多模型流式聊天应用，支持 DeepSeek 和 OpenAI 模型切换、丰富的消息交互、暗色模式。

**核心功能：**
- 流式聊天（实时逐字显示 AI 回复）
- 多模型切换（DeepSeek Chat/Reasoner、GPT-4o/4o-mini）
- 对话级系统提示词 + 全局默认设置
- 消息操作（编辑用户消息、重新生成 AI 回复、停止生成、复制、反馈）
- 左侧历史对话列表（新建/切换/删除，移动端抽屉式侧边栏）
- 消息持久化（localStorage，ChatStorage 接口可扩展为服务端存储）
- AI 回复 Markdown 富文本渲染（代码高亮、表格、LaTeX 公式、Mermaid 流程图）
- 暗色模式（系统/手动切换）
- 全局设置面板（API Keys、默认模型、temperature/maxTokens）

## 2. 技术架构

```
┌────────────────────────────────────────────────────────┐
│                        浏览器                           │
│                                                        │
│  ThemeProvider → SettingsProvider → TooltipProvider     │
│                                                        │
│  ┌──────────────┐    ┌──────────────────────────────┐  │
│  │   Sidebar    │    │          ChatArea            │  │
│  │  历史列表     │    │ ModelSelector + SystemPrompt │  │
│  │  SettingsDialog│  │ MessageBubble × N            │  │
│  │              │    │   └─ MessageActions          │  │
│  └──────────────┘    │   └─ MarkdownRenderer       │  │
│  (Sheet on mobile)   │       └─ MermaidBlock       │  │
│        ↕             └──────────────────────────────┘  │
│  ┌──────────┐                    ↕                     │
│  │ Storage  │     POST /api/chat { provider, modelId,  │
│  │ 抽象层    │       apiKey, systemPrompt, temperature }│
│  └──────────┘                                          │
└────────────────────────────────────────────────────────┘
                           ↓
┌────────────────────────────────────────────────────────┐
│                  Next.js API Route                      │
│                                                        │
│  provider → createDeepSeek / createOpenAI              │
│  convertToModelMessages → streamText → Response        │
│  (UIMessage → ModelMessage)                            │
└────────────────────────────────────────────────────────┘
```

**技术栈：**
| 层 | 技术 |
|---|---|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 6 |
| UI | Tailwind CSS v4 + shadcn/ui (base-ui) + lucide-react |
| 主题 | next-themes (暗色模式) |
| AI SDK | ai 6.x, @ai-sdk/react 3.x, @ai-sdk/deepseek 2.x, @ai-sdk/openai 3.x |
| 包管理 | pnpm |
| 单元测试 | Vitest + @testing-library/react |
| E2E 测试 | Playwright |

## 3. 核心模块详解

### 3.1 API 路由 (`src/app/api/chat/route.ts`)

**职责：** 接收客户端消息，根据 provider 参数选择 DeepSeek 或 OpenAI，返回流式响应。

**请求体：**
```typescript
{
  messages: UIMessage[];
  apiKey?: string;          // 客户端传入的 key（优先于 env）
  provider?: "deepseek" | "openai";  // 默认 "deepseek"
  modelId?: string;         // 默认 "deepseek-chat"
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}
```

**关键流程：**
1. 根据 `provider` 创建 `createDeepSeek` 或 `createOpenAI` 实例
2. `convertToModelMessages(messages)` 将 UIMessage 转为 ModelMessage（异步，必须 `await`）
3. `streamText({ model, system, messages, temperature, maxOutputTokens })` 处理流式请求
4. 返回 `result.toUIMessageStreamResponse()`

> 注意：AI SDK v6 中参数名是 `maxOutputTokens`，不是 `maxTokens`。

### 3.2 useChat Hook (`src/components/ChatArea.tsx`)

**AI SDK v6 用法（详见 PROMPT.md 阶段二）：**

```typescript
const { messages, setMessages, sendMessage, status, stop } = useChat({
  id: conversationId,
  transport: new DefaultChatTransport({ api: "/api/chat" }),
  messages: initialMessages,
});
```

**v6 新增能力：**
- `setMessages` — 允许直接修改消息列表（用于编辑/重新生成）
- `stop` — 停止当前流式生成
- `sendMessage` 的 `body` 选项传递 provider/modelId/systemPrompt/temperature/maxTokens

### 3.3 设置系统

**三层结构：**
- `AppSettings` 类型 (`src/lib/storage/types.ts`) — 定义设置数据结构
- `LocalSettingsStorage` (`src/lib/storage/settingsStorage.ts`) — localStorage 读写
- `SettingsContext` (`src/contexts/SettingsContext.tsx`) — React Context 提供 `useSettings()` hook

**设置内容：** 默认模型、默认系统提示词、API Keys (DeepSeek/OpenAI)、模型参数 (temperature/maxTokens)

### 3.4 多模型支持 (`src/lib/models.ts`)

模型配置以 `provider:modelId` 格式作为唯一 ID：
- `deepseek:deepseek-chat` — DeepSeek Chat
- `deepseek:deepseek-reasoner` — DeepSeek Reasoner
- `openai:gpt-4o` — GPT-4o
- `openai:gpt-4o-mini` — GPT-4o Mini

每个对话独立保存选择的模型（`ConversationMeta.model`），新建对话时从全局设置复制默认值。

### 3.5 存储抽象层 (`src/lib/storage/`)

```typescript
interface ChatStorage {
  listConversations(): Promise<ConversationMeta[]>;
  getConversation(id: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
}
```

**数据模型：**
- `ConversationMeta` — id, title, createdAt, updatedAt, model?, systemPrompt?
- `Conversation` — Meta + messages
- `AppSettings` — defaultModel, defaultSystemPrompt, apiKeys, modelParams

### 3.6 消息交互 (`src/components/MessageBubble.tsx` + `MessageActions.tsx`)

| 操作 | 触发 | 实现 |
|------|------|------|
| 停止生成 | 发送按钮变红色方块 | 调用 `stop()` |
| 重新生成 | AI 消息 hover → 刷新图标 | `setMessages` 截断到最后用户消息前 → 重新 `sendMessage` |
| 编辑消息 | 用户消息 hover → 铅笔图标 | 替换为 Textarea → 保存时 `setMessages` 截断 → `sendMessage` |
| 复制 | hover → 复制图标 | `navigator.clipboard.writeText()` |
| 反馈 | AI 消息 hover → 👍/👎 | localStorage 存储 `{ [messageId]: "up" \| "down" }` |

### 3.7 组件结构

```
layout.tsx (ThemeProvider → TooltipProvider)
└── Page (SettingsProvider)
    └── ChatApp
        ├── Sidebar (桌面端直接显示，移动端 Sheet 抽屉)
        │   ├── 新建对话按钮
        │   ├── SettingsDialog (Dialog + Tabs)
        │   │   └── ThemeToggle
        │   └── 对话列表 (ScrollArea)
        ├── MobileSidebarToggle (md:hidden)
        └── ChatArea (key={activeId})
            ├── ModelSelector + 系统提示词输入
            ├── MessageBubble × N
            │   ├── MessageActions (hover 浮现)
            │   └── MarkdownRenderer (AI 消息)
            │       └── MermaidBlock
            ├── 滚动到底部按钮
            └── 输入区域 (Textarea + Send/Stop 按钮)
```

### 3.8 shadcn/ui 注意事项

本项目使用的 shadcn/ui 基于 **@base-ui/react**（非 Radix UI），API 有以下差异：
- **无 `asChild` 属性** — 使用 `render={<Button />}` 代替
- **Trigger 组件**期望 `render` prop 传入原生 `<button>` 元素，否则会出现 `nativeButton` 警告
- **Select `onValueChange`** 回调参数类型为 `string | null`，需判空
- **Slider `onValueChange`** 回调参数类型为 `number | readonly number[]`，需处理数组

## 4. AI SDK v6 的坑（重要）

| 问题 | 说明 |
|------|------|
| **消息格式** | 客户端是 UIMessage（parts 数组），服务端需要 ModelMessage（content 字符串）。必须用 `convertToModelMessages` 转换 |
| **convertToModelMessages 是异步的** | 返回 `Promise<ModelMessage[]>`，必须 `await` |
| **useChat 无 input 管理** | v6 不再返回 `input`/`handleInputChange`/`handleSubmit`，需自行管理输入状态 |
| **无 api 参数** | useChat 不接受 `api: "/xxx"` 参数，需通过 `transport: new DefaultChatTransport({ api })` 配置 |
| **初始消息** | 用 `messages` 而非 `initialMessages` 传入 |
| **流式响应方法** | 用 `toUIMessageStreamResponse()` 而非已移除的 `toDataStreamResponse()` |
| **status 值** | `"ready" \| "submitted" \| "streaming" \| "error"`，没有 `isLoading` 布尔值 |
| **message.content 已移除** | 内容在 `message.parts` 数组中，需 `parts.filter(p => p.type === "text").map(p => p.text)` |
| **maxTokens 改名** | v6 streamText 中使用 `maxOutputTokens`，不是 `maxTokens` |

## 5. 可扩展方向

- **服务端存储** — 创建新 adapter 实现 `ChatStorage` 接口，替换 `LocalChatStorage`
- **新增模型** — 在 `src/lib/models.ts` 的 `AVAILABLE_MODELS` 中添加条目，API 路由自动支持
- **消息导出** — 将对话导出为 JSON/Markdown 文件
- **流式工具调用** — AI SDK v6 支持 tool use，可扩展函数调用能力

## 6. 测试方案

### Vitest（单元 + 组件测试）
| 文件 | 内容 |
|------|------|
| `tests/lib/storage.test.ts` | 存储层 CRUD 逻辑 |
| `tests/lib/models.test.ts` | 模型配置验证、getModelConfig |
| `tests/lib/settingsStorage.test.ts` | 设置存储 CRUD、默认值、合并 |
| `tests/contexts/SettingsContext.test.tsx` | Context 默认值、更新、持久化 |
| `tests/components/chat.test.tsx` | Sidebar 组件交互 |
| `tests/components/MessageBubble.test.tsx` | 消息气泡渲染、编辑流程 |
| `tests/components/MessageActions.test.tsx` | 操作按钮、复制、反馈 |
| `tests/components/ModelSelector.test.tsx` | 模型选择器显示 |
| `tests/components/markdown.test.tsx` | Markdown 渲染 |
| `tests/components/mermaid.test.tsx` | Mermaid 图表渲染 |
| `tests/api/chat.test.ts` | API 路由多模型、参数传递 |

### Playwright（E2E 端到端测试）
- `e2e/chat.spec.ts` — 完整用户流程
- `e2e/markdown.spec.ts` — Markdown 渲染验证

**命令：**
```bash
pnpm test          # Vitest watch 模式
pnpm test:run      # Vitest 单次运行
pnpm test:e2e      # Playwright headless
pnpm test:e2e:headed  # 打开浏览器
pnpm test:e2e:ui      # 交互式 UI 面板
pnpm test:e2e:report  # 查看 HTML 报告
```
