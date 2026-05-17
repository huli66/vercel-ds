import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageBubble } from "@/components/MessageBubble";
import { SettingsProvider } from "@/contexts/SettingsContext";
import type { UIMessage } from "ai";

const userMessage: UIMessage = {
  id: "msg-1",
  role: "user",
  parts: [{ type: "text", text: "Hello AI" }],
};

const assistantMessage: UIMessage = {
  id: "msg-2",
  role: "assistant",
  parts: [{ type: "text", text: "Hello! How can I help?" }],
};

function renderBubble(props: Partial<Parameters<typeof MessageBubble>[0]> = {}) {
  const defaults = {
    message: userMessage,
    isLast: false,
    isStreaming: false,
  };
  return render(
    <SettingsProvider>
      <MessageBubble {...defaults} {...props} />
    </SettingsProvider>
  );
}

function getTooltipTriggers() {
  return document.querySelectorAll("[data-slot='tooltip-trigger']");
}

describe("MessageBubble", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders user message text", () => {
    renderBubble({ message: userMessage });
    expect(screen.getByText("Hello AI")).toBeInTheDocument();
    expect(screen.getByText("你")).toBeInTheDocument();
  });

  it("renders assistant message text", () => {
    renderBubble({ message: assistantMessage });
    expect(screen.getByText("AI")).toBeInTheDocument();
  });

  it("shows action buttons for user messages with onEdit", () => {
    const onEdit = vi.fn();
    renderBubble({ message: userMessage, onEdit });
    // User with onEdit: copy + edit = 2 triggers
    const triggers = getTooltipTriggers();
    expect(triggers.length).toBe(2);
  });

  it("enters edit mode when edit button clicked", () => {
    const onEdit = vi.fn();
    renderBubble({ message: userMessage, onEdit });

    const triggers = getTooltipTriggers();
    fireEvent.click(triggers[1]); // edit is second

    expect(screen.getByText("保存并提交")).toBeInTheDocument();
    expect(screen.getByText("取消")).toBeInTheDocument();
  });

  it("calls onEdit with new text on save", () => {
    const onEdit = vi.fn();
    renderBubble({ message: userMessage, onEdit });

    fireEvent.click(getTooltipTriggers()[1]);

    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "Updated message" } });
    fireEvent.click(screen.getByText("保存并提交"));

    expect(onEdit).toHaveBeenCalledWith("Updated message");
  });

  it("cancels edit mode without calling onEdit", () => {
    const onEdit = vi.fn();
    renderBubble({ message: userMessage, onEdit });

    fireEvent.click(getTooltipTriggers()[1]);
    fireEvent.click(screen.getByText("取消"));

    expect(onEdit).not.toHaveBeenCalled();
    expect(screen.getByText("Hello AI")).toBeInTheDocument();
  });

  it("does not show actions when streaming", () => {
    const onEdit = vi.fn();
    renderBubble({ message: userMessage, isStreaming: true, onEdit });
    const triggers = getTooltipTriggers();
    expect(triggers.length).toBe(0);
  });

  it("shows regenerate button for last assistant message", () => {
    const onRegenerate = vi.fn();
    renderBubble({
      message: assistantMessage,
      isLast: true,
      onRegenerate,
    });
    // copy + regenerate + thumbs up + thumbs down = 4
    const triggers = getTooltipTriggers();
    expect(triggers.length).toBe(4);
  });
});
