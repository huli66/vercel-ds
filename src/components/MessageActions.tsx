"use client";

import { useState } from "react";
import { Copy, Check, RefreshCw, Pencil, ThumbsUp, ThumbsDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MessageActionsProps {
  role: "user" | "assistant";
  content: string;
  messageId: string;
  onEdit?: () => void;
  onRegenerate?: () => void;
}

function getFeedback(messageId: string): "up" | "down" | null {
  if (typeof window === "undefined") return null;
  const data = localStorage.getItem("message-feedback");
  if (!data) return null;
  const map = JSON.parse(data);
  return map[messageId] ?? null;
}

function setFeedback(messageId: string, value: "up" | "down" | null) {
  const data = localStorage.getItem("message-feedback");
  const map = data ? JSON.parse(data) : {};
  if (value === null) {
    delete map[messageId];
  } else {
    map[messageId] = value;
  }
  localStorage.setItem("message-feedback", JSON.stringify(map));
}

function ActionButton({
  tooltip,
  onClick,
  children,
}: {
  tooltip: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        className="inline-flex items-center justify-center h-7 w-7 rounded-md text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground cursor-pointer"
        onClick={onClick}
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}

export function MessageActions({
  role,
  content,
  messageId,
  onEdit,
  onRegenerate,
}: MessageActionsProps) {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedbackState] = useState<"up" | "down" | null>(() =>
    getFeedback(messageId)
  );

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleFeedback = (value: "up" | "down") => {
    const next = feedback === value ? null : value;
    setFeedbackState(next);
    setFeedback(messageId, next);
  };

  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <ActionButton tooltip={copied ? "已复制" : "复制"} onClick={handleCopy}>
        {copied ? (
          <Check className="h-3.5 w-3.5 text-green-500" />
        ) : (
          <Copy className="h-3.5 w-3.5" />
        )}
      </ActionButton>

      {role === "user" && onEdit && (
        <ActionButton tooltip="编辑" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </ActionButton>
      )}

      {role === "assistant" && onRegenerate && (
        <ActionButton tooltip="重新生成" onClick={onRegenerate}>
          <RefreshCw className="h-3.5 w-3.5" />
        </ActionButton>
      )}

      {role === "assistant" && (
        <>
          <ActionButton tooltip="有帮助" onClick={() => handleFeedback("up")}>
            <ThumbsUp
              className={`h-3.5 w-3.5 ${
                feedback === "up" ? "fill-current text-green-500" : ""
              }`}
            />
          </ActionButton>
          <ActionButton tooltip="无帮助" onClick={() => handleFeedback("down")}>
            <ThumbsDown
              className={`h-3.5 w-3.5 ${
                feedback === "down" ? "fill-current text-red-500" : ""
              }`}
            />
          </ActionButton>
        </>
      )}
    </div>
  );
}
