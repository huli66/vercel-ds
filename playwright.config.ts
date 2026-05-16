import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // 生成 HTML 报告到 playwright-report 目录，用 pnpm test:e2e:report 查看
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    // 仅在重试时记录 trace，用于调试失败的测试
    trace: "on-first-retry",
  },
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: "chromium", use: { browserName: "chromium" } },
  ],
});
