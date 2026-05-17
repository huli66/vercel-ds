# 提示词文档 -- 用于重新实现此项目

以下是经过精炼的提示词，可以用于从零开始重新实现这个项目。分为七个阶段。

---

## 阶段一：项目初始化

```
创建一个 Next.js + TypeScript 项目，使用 pnpm 作为包管理器。

安装以下依赖：
- ai（Vercel AI SDK 核心）
- @ai-sdk/deepseek（DeepSeek 模型支持）
- @ai-sdk/openai（OpenAI 模型支持）
- @ai-sdk/react（React hooks）

项目使用 App Router（src/app/ 目录结构）。

创建 .env 文件，包含 DEEPSEEK_API_KEY 和 OPENAI_API_KEY。
```

---

## 阶段二：核心聊天功能

```
使用 AI SDK v6 实现流式聊天功能。

注意：AI SDK v6 与旧版 API 差异很大，以下是正确用法：

### 服务端 API 路由 (src/app/api/chat/route.ts)

- 从请求体中解构 messages, apiKey, provider, modelId, systemPrompt, temperature, maxTokens
- provider 默认 "deepseek"，modelId 默认 "deepseek-chat"
- 根据 provider 创建 createDeepSeek 或 createOpenAI 实例
- 用 convertToModelMessages(messages) 转为 ModelMessage 格式（异步，必须 await）
- streamText({ model, system, messages, temperature, maxOutputTokens })
  注意：参数名是 maxOutputTokens 不是 maxTokens
- 返回 result.toUIMessageStreamResponse()

### 客户端聊天组件

- 使用 @ai-sdk/react 的 useChat hook
- v6 中 useChat 不再返回 input/handleInputChange/handleSubmit，需自行用 useState 管理输入
- useChat 不接受 api 参数，需通过 transport 配置：
  transport: new DefaultChatTransport({ api: "/api/chat" })
  （DefaultChatTransport 从 "ai" 包导入）
- 初始消息用 messages 参数传入（不是 initialMessages）
- 返回值：{ messages, setMessages, sendMessage, status, stop }
- status 值为 "ready" | "submitted" | "streaming" | "error"
- 发送消息：sendMessage({ text: "内容" }, { body: { apiKey, provider, modelId, ... } })
- body 中的字段会合并到 POST 请求体

### 消息格式

- v6 的 UIMessage 没有 content 字段，内容在 parts 数组中
- 渲染方式：message.parts.filter(p => p.type === "text").map(p => p.text).join("")
```

---

## 阶段三：历史对话管理

```
在左侧添加历史对话列表功能。

### 存储抽象层 (src/lib/storage/)

设计 ChatStorage 接口，所有方法返回 Promise：
- listConversations(): Promise<ConversationMeta[]>
- getConversation(id): Promise<Conversation | null>
- saveConversation(conversation): Promise<void>
- deleteConversation(id): Promise<void>

数据模型：
- ConversationMeta: { id, title, createdAt, updatedAt, model?, systemPrompt? }
- Conversation: ConversationMeta + { messages: UIMessage[] }
- AppSettings: { defaultModel, defaultSystemPrompt, apiKeys: { deepseek?, openai? }, modelParams: { temperature, maxTokens } }

实现 LocalChatStorage（基于 localStorage）和 LocalSettingsStorage。

### 组件拆分

- Sidebar：对话列表，新建按钮 + 设置入口
- ChatArea：聊天区域，接收 conversationId/initialMessages/model/systemPrompt
- Page：SettingsProvider 包裹，顶层状态管理

### 关键实现细节

1. ChatArea 用 key={conversationId}，切换对话时强制重新挂载以重置 useChat
2. 对话标题自动取第一条用户消息前 20 个字符
3. 会话 ID 用 crypto.randomUUID()
4. 新建对话时从 settings 复制默认模型和系统提示词
5. 每个对话独立保存 model 和 systemPrompt 到 ConversationMeta
```

---

## 阶段四：Tailwind CSS + shadcn/ui + 暗色模式

```
将所有内联样式替换为 Tailwind CSS，添加 shadcn/ui 组件库和暗色模式。

### 安装

pnpm add tailwindcss @tailwindcss/postcss postcss next-themes lucide-react
pnpm dlx shadcn@latest init --defaults
pnpm dlx shadcn@latest add button dropdown-menu dialog textarea tooltip scroll-area sheet tabs slider input label select badge

### 配置

- postcss.config.mjs：配置 @tailwindcss/postcss 插件
- src/app/globals.css：@import "tailwindcss" + katex CSS + shadcn 主题变量（shadcn init 自动生成）
- src/lib/utils.ts：cn() 工具函数（shadcn init 自动生成）

### 重要：shadcn/ui base-ui API 差异

新版 shadcn 使用 @base-ui/react 而非 Radix UI，API 不同：
- 无 asChild 属性，使用 render={<Button />} 代替
- Trigger 组件的 render prop 必须传原生 <button>（或 Button 组件），否则出现 nativeButton 警告
- Select onValueChange 参数类型为 string | null，需判空
- Slider onValueChange 参数类型为 number | readonly number[]，需处理

### 暗色模式

- ThemeProvider 组件：基于 next-themes，attribute="class"
- ThemeToggle 组件：DropdownMenu 切换浅色/深色/系统
- layout.tsx 中 <html suppressHydrationWarning>，用 ThemeProvider 包裹

### 响应式侧边栏

- 桌面端（md 以上）：Sidebar 直接显示
- 移动端：Sheet 抽屉组件 + MobileSidebarToggle 汉堡按钮
```

---

## 阶段五：设置系统与多模型支持

```
### 设置系统

- SettingsContext (src/contexts/SettingsContext.tsx)：React Context 提供 settings + updateSettings
- SettingsDialog：Dialog + Tabs（通用/API Keys/模型默认值）
- 通用 tab：主题切换、默认系统提示词
- API Keys tab：DeepSeek / OpenAI 密钥输入（password 类型）
- 模型默认值 tab：Select 选择默认模型、Slider 调 temperature、Input 设 maxTokens

### 多模型

模型配置 (src/lib/models.ts)：
- ModelConfig: { id: "provider:modelId", provider, modelId, displayName }
- 预设模型：deepseek-chat, deepseek-reasoner, gpt-4o, gpt-4o-mini
- getModelConfig(id) 查找函数

ModelSelector 组件：Select 按 provider 分组，显示 Badge 标识 DS/OAI

ChatArea 顶部显示 ModelSelector + 系统提示词输入
sendMessage body 中传递 { provider, modelId, systemPrompt, temperature, maxTokens }
```

---

## 阶段六：消息交互增强

```
### MessageBubble 组件

从 ChatArea 提取消息渲染逻辑：
- 头像区（User/Bot 图标 + 圆形背景）
- 用户消息：纯文本 + hover 显示操作栏
- AI 消息：MarkdownRenderer + hover 显示操作栏
- 编辑模式：Textarea + 保存并提交/取消按钮

### MessageActions 组件

hover 显示的操作栏：
- 复制：navigator.clipboard.writeText + "已复制" 反馈
- 编辑（仅用户消息）：进入 MessageBubble 编辑模式
- 重新生成（仅最后一条 AI 消息）：setMessages 截断 → sendMessage
- 反馈（仅 AI 消息）：👍/👎 存储到 localStorage

### 停止生成

streaming/submitted 状态时，发送按钮变为红色 Square 图标，点击调用 stop()

### 编辑用户消息

点击编辑 → Textarea 显示原文 → 修改后保存：
setMessages(messages.slice(0, editIndex)) → setTimeout → sendMessage({ text: newText })

### 重新生成 AI 回复

找到最后一条用户消息 → setMessages 截断到该消息前 → setTimeout → sendMessage
```

---

## 阶段七：自动化测试

```
添加完整的自动化测试。

### 安装

pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom @vitejs/plugin-react @playwright/test
npx playwright install chromium

### 配置（详见阶段四的测试部分）

### 测试内容

单元测试：
- tests/lib/storage.test.ts — localStorage adapter CRUD
- tests/lib/models.test.ts — 模型配置验证、getModelConfig
- tests/lib/settingsStorage.test.ts — 设置存储 CRUD、默认值合并
- tests/contexts/SettingsContext.test.tsx — Context 默认值、更新、持久化、Provider 缺失报错
- tests/components/chat.test.tsx — Sidebar 交互（需 SettingsProvider 包裹）
- tests/components/MessageBubble.test.tsx — 消息渲染、编辑流程
- tests/components/MessageActions.test.tsx — 操作按钮、复制、反馈
- tests/components/ModelSelector.test.tsx — 模型选择器显示
- tests/components/markdown.test.tsx — Markdown 渲染
- tests/components/mermaid.test.tsx — Mermaid 图表
- tests/api/chat.test.ts — API 多模型、systemPrompt、temperature/maxTokens

E2E 测试：
- e2e/chat.spec.ts — 完整用户流程
- e2e/markdown.spec.ts — Markdown 渲染验证

### 注意事项

- Sidebar 等使用 SettingsDialog 的组件，测试时需用 SettingsProvider 包裹
- shadcn base-ui 组件的 tooltip 触发按钮用 [data-slot='tooltip-trigger'] 选择器
- 测试 setup 需要 mock localStorage（tests/setup.ts）
```

---

## 一句话版本

> 使用 Next.js 16 App Router + TypeScript + pnpm + Tailwind CSS v4 + shadcn/ui (base-ui)，基于 Vercel AI SDK v6（ai、@ai-sdk/deepseek、@ai-sdk/openai、@ai-sdk/react）构建多模型流式聊天应用。支持 DeepSeek/OpenAI 模型切换（ModelSelector + API 路由多 provider 分发）、对话级系统提示词、全局设置面板（SettingsDialog + SettingsContext，API Keys/temperature/maxTokens，localStorage 持久化）、暗色模式（next-themes）、响应式布局（桌面 Sidebar + 移动端 Sheet 抽屉）、消息交互增强（停止生成 stop()、重新生成 setMessages 截断重发、编辑用户消息、复制、反馈）、AI 回复 Markdown 富文本渲染（react-markdown + remark-gfm + remark-math + rehype-katex + rehype-highlight + mermaid）。注意 v6 API：useChat 返回 { messages, setMessages, sendMessage, status, stop }，消息格式是 UIMessage（parts 数组），服务端需 convertToModelMessages（异步）转换，streamText 用 maxOutputTokens 不是 maxTokens，响应用 toUIMessageStreamResponse。shadcn base-ui 用 render prop 代替 asChild。测试 Vitest（11 文件 58 用例）+ Playwright（E2E）。

---

## 注意事项

1. **分阶段执行** -- 不要一次性给出所有需求，按阶段逐步实现并验证
2. **强调 v6 差异** -- AI SDK v6 与网上大部分教程（v3/v4）差异巨大，明确指出正确 API
3. **shadcn base-ui 差异** -- 新版 shadcn 用 @base-ui/react，无 asChild，用 render prop
4. **先跑通再扩展** -- 先确保基础聊天可用，再加设置系统和交互增强
5. **构建验证** -- 每步完成后运行 `pnpm build` 确认无类型错误
