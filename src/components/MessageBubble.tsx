"use client";

import { useState } from "react";
import type { UIMessage } from "ai";
import { MarkdownRenderer } from "./MarkdownRenderer";
import { MessageActions } from "./MessageActions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { User, Bot } from "lucide-react";

interface MessageBubbleProps {
  message: UIMessage;
  isLast: boolean;
  isStreaming: boolean;
  onEdit?: (newText: string) => void;
  onRegenerate?: () => void;
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p) => p.type === "text")
    .map((p) => p.text)
    .join("");
}

export function MessageBubble({
  message,
  isLast,
  isStreaming,
  onEdit,
  onRegenerate,
}: MessageBubbleProps) {
  const [editing, setEditing] = useState(false);
  const [editText, setEditText] = useState("");
  const text = getMessageText(message);
  const isUser = message.role === "user";

  const handleStartEdit = () => {
    setEditText(text);
    setEditing(true);
  };

  const handleSaveEdit = () => {
    if (editText.trim() && onEdit) {
      onEdit(editText.trim());
    }
    setEditing(false);
  };

  const handleCancelEdit = () => {
    setEditing(false);
  };

  return (
    <div className="group flex gap-3 py-4">
      <div
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        }`}
      >
        {isUser ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="text-xs font-medium text-muted-foreground">
          {isUser ? "你" : "AI"}
        </div>

        {editing ? (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={4}
              className="resize-none"
              autoFocus
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>
                保存并提交
              </Button>
              <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                取消
              </Button>
            </div>
          </div>
        ) : isUser ? (
          <div className="whitespace-pre-wrap text-sm">{text}</div>
        ) : (
          <div className="text-sm prose prose-sm dark:prose-invert max-w-none">
            <MarkdownRenderer
              content={text}
              isStreaming={isStreaming && isLast}
            />
          </div>
        )}

        {!editing && !isStreaming && (
          <MessageActions
            role={isUser ? "user" : "assistant"}
            content={text}
            messageId={message.id}
            onEdit={isUser && onEdit ? handleStartEdit : undefined}
            onRegenerate={!isUser && onRegenerate ? onRegenerate : undefined}
          />
        )}
      </div>
    </div>
  );
}
