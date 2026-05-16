# 提示词文档 — 用于重新实现此项目

以下是经过精炼的提示词，可以用于从零开始重新实现这个项目。分为初始化、核心功能、历史对话、测试四个阶段。

---

## 阶段一：项目初始化

```
创建一个 Next.js + TypeScript 项目，使用 pnpm 作为包管理器。

安装以下依赖：
- ai（Vercel AI SDK 核心）
- @ai-sdk/deepseek（DeepSeek 模型支持）
- @ai-sdk/openai（OpenAI 模型支持，预留）
- @ai-sdk/react（React hooks）

项目使用 App Router（src/app/ 目录结构）。

创建 .env 文件，包含 DEEPSEEK_API_KEY。
```

---

## 阶段二：核心聊天功能

```
使用 AI SDK v6 实现流式聊天功能。

注意：AI SDK v6 与旧版 API 差异很大，以下是正确用法：

### 服务端 API 路由 (src/app/api/chat/route.ts)

- 从请求体中解构 messages 和 apiKey
- 用 createDeepSeek({ apiKey: apiKey || process.env.DEEPSEEK_API_KEY }) 创建模型
- 客户端发来的是 UIMessage 格式（包含 parts 数组），需要用 convertToModelMessages(messages) 转为 ModelMessage 格式
- convertToModelMessages 是异步函数，必须 await
- 用 streamText({ model, messages }) 处理流式请求
- 返回 result.toUIMessageStreamResponse()（不是 toDataStreamResponse，那个已移除）

### 客户端聊天组件

- 使用 @ai-sdk/react 的 useChat hook
- v6 中 useChat 不再返回 input/handleInputChange/handleSubmit，需自行用 useState 管理输入
- useChat 不接受 api 参数，需通过 transport 配置：
  transport: new DefaultChatTransport({ api: "/api/chat" })
  （DefaultChatTransport 从 "ai" 包导入）
- 如果不传 transport，默认也是请求 /api/chat
- 初始消息用 messages 参数传入（不是 initialMessages）
- 返回值：{ messages, sendMessage, status }
- status 值为 "ready" | "submitted" | "streaming" | "error"
- 发送消息：sendMessage({ text: "内容" }, { body: { apiKey } })
- body 中的字段会合并到 POST 请求体，服务端可通过 req.json() 获取

### 消息渲染

- v6 的 UIMessage 没有 content 字段，内容在 parts 数组中
- 渲染方式：message.parts.filter(p => p.type === "text").map(p => p.text).join("")

### 界面

- 顶部：可选的 API Key 输入框（password 类型）
- 中间：消息列表（用户消息蓝色背景，AI 消息灰色背景）
- 底部：输入框 + 发送按钮
- 流式状态下显示"AI 正在思考..."
```

---

## 阶段三：历史对话管理

```
在左侧添加历史对话列表功能。

### 存储抽象层 (src/lib/storage/)

设计 ChatStorage 接口，所有方法返回 Promise（为未来服务端存储预留）：
- listConversations(): Promise<ConversationMeta[]>
- getConversation(id): Promise<Conversation | null>
- saveConversation(conversation): Promise<void>
- deleteConversation(id): Promise<void>

数据模型：
- ConversationMeta: { id, title, createdAt, updatedAt }
- Conversation: ConversationMeta + { messages: UIMessage[] }

先实现 LocalChatStorage（基于 localStorage），统一存储在一个 key 下。

### 组件拆分

将页面拆分为：
- Sidebar 组件：展示对话列表，接收 conversations/activeId/onSelect/onNew/onDelete
- ChatArea 组件：聊天区域，接收 conversationId/initialMessages/apiKey/onMessagesChange
- Page：顶层状态管理，组合两个组件

### 关键实现细节

1. ChatArea 用 key={conversationId}，切换对话时强制重新挂载以重置 useChat 状态
2. 对话标题自动取第一条用户消息前 20 个字符
3. 会话 ID 用 crypto.randomUUID() 生成
4. ChatArea 内 useEffect 监听 messages 变化，通过回调通知 Page 持久化

### 布局

- 整体 flex 布局，高度 100vh
- Sidebar 固定宽度 260px，带右边框
- 右侧 flex:1，顶部 API Key 输入，下方聊天区域
- body 设置 margin:0
```

---

## 阶段四：自动化测试

```
添加完整的自动化测试。

### 安装依赖

pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react @playwright/test
npx playwright install chromium

### Vitest 配置 (vitest.config.ts)

- 使用 @vitejs/plugin-react
- 环境：jsdom
- setup 文件：./tests/setup.ts（导入 @testing-library/jest-dom/vitest，mock localStorage）
- 排除 e2e 目录：exclude: ["e2e/**", "node_modules/**"]
- 路径别名：@ → ./src

### Playwright 配置 (playwright.config.ts)

- testDir: ./e2e
- baseURL: http://localhost:3000
- webServer: { command: "pnpm dev", url: "http://localhost:3000", reuseExistingServer: true }
- 项目：仅 chromium

### 测试内容

单元测试 (tests/lib/storage.test.ts)：
- localStorage adapter 的 CRUD 操作（增删改查、排序、不存在返回 null）

组件测试 (tests/components/chat.test.tsx)：
- Sidebar 空状态、列表渲染、点击切换、新建、删除

API 路由测试 (tests/api/chat.test.ts)：
- Mock createDeepSeek 和 streamText
- 验证 apiKey 优先级（用户传入 > 环境变量）
- 验证 streamText 被调用

E2E 测试 (e2e/chat.spec.ts)：
- 页面加载空状态
- 新建对话
- 切换对话
- 删除对话
- 刷新后持久化
- 输入框和按钮状态

### package.json 脚本

"test": "vitest"
"test:run": "vitest run"
"test:e2e": "playwright test"
"test:e2e:headed": "playwright test --headed"
"test:e2e:ui": "playwright test --ui"
"test:e2e:report": "playwright show-report"
```

---

## 一句话版本（给 AI 的完整提示）

> 使用 Next.js 16 App Router + TypeScript + pnpm，基于 Vercel AI SDK v6（ai、@ai-sdk/deepseek、@ai-sdk/react）构建 DeepSeek 流式聊天应用。功能包含：左侧历史对话侧边栏（新建/切换/删除，localStorage 持久化，ChatStorage 接口预留服务端扩展），右侧聊天区域支持流式渲染和自定义 API Key 输入。注意 v6 API 变化：useChat 返回 sendMessage/status 而非 input/handleSubmit，消息格式是 UIMessage（parts 数组）而非 content 字符串，服务端需 convertToModelMessages（异步）转换后再传给 streamText，响应用 toUIMessageStreamResponse。测试使用 Vitest（单元+组件）+ Playwright（E2E）。

---

## 注意事项

使用这份提示词时，建议：

1. **分阶段执行** — 不要一次性给出所有需求，按阶段逐步实现并验证
2. **强调 v6 差异** — AI SDK v6 与网上大部分教程（v3/v4）差异巨大，明确指出正确 API
3. **先跑通再扩展** — 先确保基础聊天可用，再加历史功能和测试
4. **构建验证** — 每步完成后运行 `pnpm build` 确认无类型错误
