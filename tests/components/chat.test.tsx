import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Sidebar } from "@/components/Sidebar";
import { SettingsProvider } from "@/contexts/SettingsContext";
import type { ConversationMeta } from "@/lib/storage";

const mockConversations: ConversationMeta[] = [
  { id: "1", title: "First Chat", createdAt: 1000, updatedAt: 2000 },
  { id: "2", title: "Second Chat", createdAt: 1500, updatedAt: 2500 },
];

function renderWithProviders(ui: React.ReactElement) {
  return render(<SettingsProvider>{ui}</SettingsProvider>);
}

describe("Sidebar", () => {
  const onSelect = vi.fn();
  const onNew = vi.fn();
  const onDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders empty state when no conversations", () => {
    renderWithProviders(
      <Sidebar
        conversations={[]}
        activeId={null}
        onSelect={onSelect}
        onNew={onNew}
        onDelete={onDelete}
      />
    );
    expect(screen.getByText("暂无历史对话")).toBeInTheDocument();
  });

  it("renders conversation list", () => {
    renderWithProviders(
      <Sidebar
        conversations={mockConversations}
        activeId={null}
        onSelect={onSelect}
        onNew={onNew}
        onDelete={onDelete}
      />
    );
    expect(screen.getByText("First Chat")).toBeInTheDocument();
    expect(screen.getByText("Second Chat")).toBeInTheDocument();
  });

  it("calls onNew when new button clicked", () => {
    renderWithProviders(
      <Sidebar
        conversations={[]}
        activeId={null}
        onSelect={onSelect}
        onNew={onNew}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByText("新建对话"));
    expect(onNew).toHaveBeenCalledOnce();
  });

  it("calls onSelect when conversation clicked", () => {
    renderWithProviders(
      <Sidebar
        conversations={mockConversations}
        activeId={null}
        onSelect={onSelect}
        onNew={onNew}
        onDelete={onDelete}
      />
    );
    fireEvent.click(screen.getByText("First Chat"));
    expect(onSelect).toHaveBeenCalledWith("1");
  });

  it("calls onDelete when delete button clicked", () => {
    renderWithProviders(
      <Sidebar
        conversations={mockConversations}
        activeId={null}
        onSelect={onSelect}
        onNew={onNew}
        onDelete={onDelete}
      />
    );
    const deleteButtons = screen.getAllByLabelText("删除对话");
    fireEvent.click(deleteButtons[0]);
    expect(onDelete).toHaveBeenCalledWith("1");
    expect(onSelect).not.toHaveBeenCalled();
  });
});
