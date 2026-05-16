import { test, expect } from "@playwright/test";

// Helper to create a mock streaming response
function mockStreamResponse(text: string) {
  // Simulate AI SDK streaming format
  const lines = [
    `0:${JSON.stringify(text)}\n`,
    `e:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":20}}\n`,
    `d:{"finishReason":"stop","usage":{"promptTokens":10,"completionTokens":20}}\n`,
  ];
  return lines.join("");
}

test.describe("Markdown Rendering", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Create a new conversation
    await page.getByText("+ 新建对话").click();
    await expect(page.getByPlaceholder("输入消息...")).toBeVisible();
  });

  test("renders markdown in AI messages", async ({ page }) => {
    // Mock the chat API to return markdown content
    await page.route("**/api/chat", async (route) => {
      const markdown = "# Hello World\n\nThis is **bold** text.\n\n```js\nconst x = 1;\n```\n\n| Col1 | Col2 |\n|------|------|\n| A | B |";
      await route.fulfill({
        status: 200,
        contentType: "text/plain; charset=utf-8",
        body: mockStreamResponse(markdown),
      });
    });

    const input = page.getByPlaceholder("输入消息...");
    await input.fill("test");
    await page.getByRole("button", { name: "发送" }).click();

    // Verify markdown elements are rendered
    await expect(page.locator("[data-testid='markdown-renderer']")).toBeVisible({ timeout: 10000 });
    await expect(page.locator("[data-testid='markdown-renderer'] h1")).toBeVisible();
    await expect(page.locator("[data-testid='markdown-renderer'] table")).toBeVisible();
    await expect(page.locator("[data-testid='markdown-renderer'] pre code")).toBeVisible();
  });

  test("renders mermaid diagrams as SVG", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      const markdown = "```mermaid\ngraph TD\n  A[Start] --> B[End]\n```";
      await route.fulfill({
        status: 200,
        contentType: "text/plain; charset=utf-8",
        body: mockStreamResponse(markdown),
      });
    });

    const input = page.getByPlaceholder("输入消息...");
    await input.fill("test");
    await page.getByRole("button", { name: "发送" }).click();

    // Mermaid renders to SVG
    await expect(page.locator("[data-testid='mermaid-container'] svg")).toBeVisible({ timeout: 15000 });
  });

  test("user messages remain plain text", async ({ page }) => {
    await page.route("**/api/chat", async (route) => {
      await route.fulfill({
        status: 200,
        contentType: "text/plain; charset=utf-8",
        body: mockStreamResponse("OK"),
      });
    });

    const input = page.getByPlaceholder("输入消息...");
    // Send a message with markdown syntax
    await input.fill("**bold** and # heading");
    await page.getByRole("button", { name: "发送" }).click();

    // Wait for messages to appear
    await expect(page.locator("[data-testid='markdown-renderer']")).toBeVisible({ timeout: 10000 });

    // User message should NOT have markdown rendering - check for raw text in span
    const userMessage = page.locator("div").filter({ hasText: "你:" }).first();
    await expect(userMessage.locator("span")).toContainText("**bold** and # heading");
    // User message should not have an h1
    await expect(userMessage.locator("h1")).toHaveCount(0);
  });
});
