"use client";

import type { ConversationMeta } from "@/lib/storage";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SettingsDialog } from "./SettingsDialog";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <aside className="w-64 border-r border-border flex flex-col h-screen bg-sidebar text-sidebar-foreground">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Button onClick={onNew} className="flex-1" size="sm">
          <Plus className="h-4 w-4 mr-1" />
          新建对话
        </Button>
        <SettingsDialog />
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2">
          {conversations.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              暂无历史对话
            </p>
          )}
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelect(conv.id)}
              className={cn(
                "group flex items-center justify-between px-3 py-2 mb-1 rounded-md cursor-pointer text-sm transition-colors",
                conv.id === activeId
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50"
              )}
            >
              <span className="truncate flex-1">{conv.title}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(conv.id);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:text-destructive"
                aria-label="删除对话"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </aside>
  );
}
