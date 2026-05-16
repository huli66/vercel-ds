# DeepSeek AI Chat 项目文档

## 1. 项目概述

基于 Vercel AI SDK v6 和 DeepSeek 模型构建的流式聊天应用，支持多轮对话、历史会话管理、自定义 API Key。

**核心功能：**
- 流式聊天（实时逐字显示 AI 回复）
- 左侧历史对话列表（新建/切换/删除）
- 消息持久化（localStorage，可扩展为服务端存储）
- 支持用户输入自定义 DeepSeek API Key

## 2. 技术架构

```
┌─────────────────────────────────────────────────┐
│                   浏览器                          │
│                                                 │
│  ┌──────────┐    ┌────────────────────────────┐ │
│  │ Sidebar  │    │        ChatArea            │ │
│  │ 历史列表  │    │  useChat (AI SDK React)    │ │
│  │          │    │  ↕ DefaultChatTransport    │ │
│  └──────────┘    └────────────────────────────┘ │
│        ↕                      ↕                  │
│  ┌──────────┐         POST /api/chat            │
│  │ Storage  │                                   │
│  │ 抽象层   │                                   │
│  └──────────┘                                   │
└─────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────┐
│              Next.js API Route                   │
│                                                 │
│  convertToModelMessages → streamText → Response │
│  (UIMessage → ModelMessage)  (DeepSeek API)     │
└─────────────────────────────────────────────────┘
```

**技术栈：**
| 层 | 技术 |
|---|---|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 6 |
| AI SDK | ai 6.x, @ai-sdk/react 3.x, @ai-sdk/deepseek 2.x |
| 包管理 | pnpm |
| 单元测试 | Vitest + @testing-library/react |
| E2E 测试 | Playwright |

## 3. 核心模块详解

### 3.1 API 路由 (`src/app/api/chat/route.ts`)

**职责：** 接收客户端消息，调用 DeepSeek API，返回流式响应。

**关键流程：**
```
客户端 POST { messages: UIMessage[], apiKey?: string }
       ↓
convertToModelMessages(messages)  // UIMessage[] → ModelMessage[]（异步）
       ↓
streamText({ model: deepseek("deepseek-chat"), messages })
       ↓
result.toUIMessageStreamResponse()  // 返回流式 Response
```

**要点：**
- `messages` 从客户端收到时是 UIMessage 格式（包含 `parts` 数组）
- `streamText` 需要 ModelMessage 格式（包含 `content` 字符串/数组）
- 必须用 `convertToModelMessages` 转换，且此函数是**异步**的，需要 `await`
- 返回值用 `toUIMessageStreamResponse()`，客户端 `useChat` 能自动解析

### 3.2 useChat Hook (`src/components/ChatArea.tsx`)

**AI SDK v6 中 useChat 的用法与旧版区别很大：**

```typescript
const { messages, sendMessage, status } = useChat({
  id: conversationId,
  transport: new DefaultChatTransport({ api: "/api/chat" }),
  messages: initialMessages,
});
```

**配置项：**
- `id` — 对话标识符，区分不同会话
- `transport` — 请求传输层。不传时默认也是 `DefaultChatTransport({ api: "/api/chat" })`
- `messages` — 初始消息列表（用于恢复历史对话）

**返回值：**
- `messages: UIMessage[]` — 当前对话所有消息
- `sendMessage(msg, options)` — 发送消息，options.body 会合并到 POST 请求体
- `status` — `"ready" | "submitted" | "streaming" | "error"`

**v6 不再提供：** `input`, `handleInputChange`, `handleSubmit`, `isLoading`, `append`

**消息格式 (UIMessage)：**
```typescript
{
  id: string;
  role: "user" | "assistant";
  parts: [{ type: "text", text: "消息内容" }];
}
```
注意：不再有 `message.content`，内容通过 `message.parts` 获取。

### 3.3 存储抽象层 (`src/lib/storage/`)

**接口设计：**
```typescript
interface ChatStorage {
  listConversations(): Promise<ConversationMeta[]>;
  getConversation(id: string): Promise<Conversation | null>;
  saveConversation(conversation: Conversation): Promise<void>;
  deleteConversation(id: string): Promise<void>;
}
```

所有方法返回 Promise，即使当前 localStorage 实现是同步的。这样未来替换为服务端 API 时业务代码无需修改。

**数据模型：**
- `ConversationMeta` — 列表展示用（id, title, createdAt, updatedAt）
- `Conversation` — 完整数据（Meta + messages）

### 3.4 组件结构

```
Page（状态管理 + 布局）
├── Sidebar（对话列表，纯展示组件）
└── ChatArea（聊天区域，内含 useChat hook）
    key={activeId}  ← 切换对话时强制重新挂载
```

**关键设计：**
- `ChatArea` 使用 `key={activeId}`，切换对话时 React 会销毁旧实例并创建新实例
- 这确保 `useChat` hook 用新的 messages 重新初始化，避免不同对话间状态混乱
- `onMessagesChange` 回调在消息变化时通知 Page 进行持久化

## 4. AI SDK v6 的坑（重要）

| 问题 | 说明 |
|------|------|
| **消息格式** | 客户端是 UIMessage（parts 数组），服务端需要 ModelMessage（content 字符串）。必须用 `convertToModelMessages` 转换 |
| **convertToModelMessages 是异步的** | 返回 `Promise<ModelMessage[]>`，必须 `await` |
| **useChat 无 input 管理** | v6 不再返回 `input`/`handleInputChange`/`handleSubmit`，需自行管理输入状态 |
| **无 api 参数** | useChat 不接受 `api: "/xxx"` 参数，需通过 `transport: new DefaultChatTransport({ api })` 配置 |
| **初始消息** | 用 `messages` 而非 `initialMessages` 传入 |
| **流式响应方法** | 用 `toUIMessageStreamResponse()` 而非已移除的 `toDataStreamResponse()` |
| **status 值** | `"ready" | "submitted" | "streaming" | "error"`，没有 `isLoading` 布尔值 |
| **message.content 已移除** | 内容在 `message.parts` 数组中，需 `parts.filter(p => p.type === "text").map(p => p.text)` |

## 5. 可扩展方向

### 5.1 服务端存储
创建新的 adapter 实现 `ChatStorage` 接口：
```typescript
class ServerChatStorage implements ChatStorage {
  async listConversations() {
    return fetch("/api/conversations").then(r => r.json());
  }
  // ...
}
```
然后在 `page.tsx` 中替换 `new LocalChatStorage()` 为 `new ServerChatStorage()` 即可。

### 5.2 多模型支持
- 在 UI 中添加模型选择器
- 将选中的模型通过 `sendMessage` 的 `body` 传给服务端
- 服务端根据 model 参数创建不同的 provider

### 5.3 Markdown 渲染
- 安装 `react-markdown` + `remark-gfm`
- 在消息展示处用 Markdown 组件替代纯文本

### 5.4 消息导出
- 添加导出按钮，将对话导出为 JSON/Markdown 文件

### 5.5 系统提示词
- 在 UI 中添加系统提示词输入
- 通过 body 传到服务端，在 streamText 的 system 参数中使用

## 6. 测试方案

### Vitest（单元 + 组件测试）
- `tests/lib/storage.test.ts` — 存储层 CRUD 逻辑
- `tests/components/chat.test.tsx` — Sidebar 组件交互
- `tests/api/chat.test.ts` — API 路由参数传递

### Playwright（E2E 端到端测试）
- `e2e/chat.spec.ts` — 完整用户流程

**命令：**
```bash
pnpm test          # Vitest watch 模式
pnpm test:run      # Vitest 单次运行
pnpm test:e2e      # Playwright headless
pnpm test:e2e:headed  # 打开浏览器看操作
pnpm test:e2e:ui      # 交互式 UI 面板
pnpm test:e2e:report  # 查看 HTML 报告
```
