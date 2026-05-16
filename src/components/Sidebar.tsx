"use client";

import type { ConversationMeta } from "@/lib/storage";

interface SidebarProps {
  conversations: ConversationMeta[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
}

export function Sidebar({
  conversations,
  activeId,
  onSelect,
  onNew,
  onDelete,
}: SidebarProps) {
  return (
    <aside
      style={{
        width: 260,
        borderRight: "1px solid #e0e0e0",
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      <div style={{ padding: "16px", borderBottom: "1px solid #e0e0e0" }}>
        <button
          onClick={onNew}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: "#1976d2",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            cursor: "pointer",
            fontSize: 14,
          }}
        >
          + 新建对话
        </button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
        {conversations.length === 0 && (
          <p style={{ color: "#999", textAlign: "center", fontSize: 14 }}>
            暂无历史对话
          </p>
        )}
        {conversations.map((conv) => (
          <div
            key={conv.id}
            onClick={() => onSelect(conv.id)}
            style={{
              padding: "10px 12px",
              marginBottom: 4,
              borderRadius: 6,
              cursor: "pointer",
              backgroundColor: conv.id === activeId ? "#e3f2fd" : "transparent",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: 14,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {conv.title}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete(conv.id);
              }}
              style={{
                background: "none",
                border: "none",
                color: "#999",
                cursor: "pointer",
                fontSize: 16,
                padding: "0 4px",
                lineHeight: 1,
              }}
              aria-label="删除对话"
            >
              x
            </button>
          </div>
        ))}
      </div>
    </aside>
  );
}
