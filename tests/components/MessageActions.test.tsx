import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MessageActions } from "@/components/MessageActions";

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

function renderActions(
  props: Partial<Parameters<typeof MessageActions>[0]> = {}
) {
  const defaults = {
    role: "user" as const,
    content: "Hello world",
    messageId: "msg-1",
  };
  return render(<MessageActions {...defaults} {...props} />);
}

describe("MessageActions", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("renders copy button for user messages", () => {
    renderActions({ role: "user" });
    const triggers = document.querySelectorAll("[data-slot='tooltip-trigger']");
    expect(triggers.length).toBeGreaterThanOrEqual(1);
  });

  it("renders edit button when onEdit provided for user messages", () => {
    const onEdit = vi.fn();
    renderActions({ role: "user", onEdit });
    const triggers = document.querySelectorAll("[data-slot='tooltip-trigger']");
    // Should have copy + edit = 2
    expect(triggers.length).toBe(2);
  });

  it("does not render edit for assistant messages", () => {
    const onEdit = vi.fn();
    renderActions({ role: "assistant", onEdit });
    // Assistant should not show edit even if onEdit passed
    // It shows: copy + feedback up + feedback down = 3
    const triggers = document.querySelectorAll("[data-slot='tooltip-trigger']");
    expect(triggers.length).toBe(3);
  });

  it("renders regenerate button for assistant with onRegenerate", () => {
    const onRegenerate = vi.fn();
    renderActions({ role: "assistant", onRegenerate });
    // copy + regenerate + thumbs up + thumbs down = 4
    const triggers = document.querySelectorAll("[data-slot='tooltip-trigger']");
    expect(triggers.length).toBe(4);
  });

  it("calls onEdit when edit button clicked", () => {
    const onEdit = vi.fn();
    renderActions({ role: "user", onEdit });
    const triggers = document.querySelectorAll("[data-slot='tooltip-trigger']");
    fireEvent.click(triggers[1]); // edit is second
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("calls onRegenerate when regenerate button clicked", () => {
    const onRegenerate = vi.fn();
    renderActions({ role: "assistant", onRegenerate });
    const triggers = document.querySelectorAll("[data-slot='tooltip-trigger']");
    fireEvent.click(triggers[1]); // regenerate is second (after copy)
    expect(onRegenerate).toHaveBeenCalledOnce();
  });

  it("copies content to clipboard", async () => {
    renderActions({ role: "user", content: "Copy me" });
    const triggers = document.querySelectorAll("[data-slot='tooltip-trigger']");
    fireEvent.click(triggers[0]); // copy is first
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("Copy me");
  });

  it("toggles feedback for assistant messages", () => {
    renderActions({ role: "assistant", messageId: "msg-feedback" });
    const triggers = document.querySelectorAll("[data-slot='tooltip-trigger']");
    // thumbs up is index 1, thumbs down is index 2 (no regenerate)
    const thumbsUp = triggers[1];

    fireEvent.click(thumbsUp);
    const stored = JSON.parse(localStorage.getItem("message-feedback")!);
    expect(stored["msg-feedback"]).toBe("up");

    // Click again to toggle off
    fireEvent.click(thumbsUp);
    const updated = JSON.parse(localStorage.getItem("message-feedback")!);
    expect(updated["msg-feedback"]).toBeUndefined();
  });
});
