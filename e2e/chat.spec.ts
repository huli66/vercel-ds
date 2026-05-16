import { test, expect } from "@playwright/test";

test.describe("Chat Application", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    // Clear localStorage before each test
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("page loads with empty state", async ({ page }) => {
    await expect(page.getByText("+ 新建对话")).toBeVisible();
    await expect(page.getByText("暂无历史对话")).toBeVisible();
    await expect(
      page.getByText("选择一个对话或新建对话开始聊天")
    ).toBeVisible();
  });

  test("create new conversation", async ({ page }) => {
    await page.getByText("+ 新建对话").click();
    await expect(page.getByText("新对话")).toBeVisible();
    await expect(page.getByPlaceholder("输入消息...")).toBeVisible();
  });

  test("switch between conversations", async ({ page }) => {
    // Create first conversation
    await page.getByText("+ 新建对话").click();
    await expect(page.getByPlaceholder("输入消息...")).toBeVisible();

    // Create second conversation
    await page.getByText("+ 新建对话").click();

    // Should have two conversations in sidebar
    const items = page.locator("aside >> text=新对话");
    await expect(items).toHaveCount(2);
  });

  test("delete conversation", async ({ page }) => {
    await page.getByText("+ 新建对话").click();
    await expect(page.getByText("新对话")).toBeVisible();

    await page.getByLabel("删除对话").click();
    await expect(page.getByText("暂无历史对话")).toBeVisible();
  });

  test("conversations persist after reload", async ({ page }) => {
    await page.getByText("+ 新建对话").click();
    await expect(page.getByText("新对话")).toBeVisible();

    await page.reload();
    await expect(page.getByText("新对话")).toBeVisible();
  });

  test("input field and send button exist", async ({ page }) => {
    await page.getByText("+ 新建对话").click();

    const input = page.getByPlaceholder("输入消息...");
    await expect(input).toBeVisible();

    const sendButton = page.getByRole("button", { name: "发送" });
    await expect(sendButton).toBeVisible();
    await expect(sendButton).toBeDisabled();

    await input.fill("Hello");
    await expect(sendButton).toBeEnabled();
  });
});
