"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import rehypeHighlight from "rehype-highlight";
import type { Components } from "react-markdown";
import { MermaidBlock } from "./MermaidBlock";

interface MarkdownRendererProps {
  content: string;
  isStreaming?: boolean;
}

export function MarkdownRenderer({ content, isStreaming }: MarkdownRendererProps) {
  const components: Components = {
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : null;
      const codeString = String(children).replace(/\n$/, "");

      if (language === "mermaid") {
        if (isStreaming) {
          return <code className={className} {...props}>{children}</code>;
        }
        return <MermaidBlock code={codeString} />;
      }

      if (!className) {
        return (
          <code className={className} {...props}>
            {children}
          </code>
        );
      }

      return (
        <code className={className} {...props}>
          {children}
        </code>
      );
    },
    pre({ children }) {
      return (
        <pre className="bg-[#1e1e1e] dark:bg-[#0d0d0d] text-[#d4d4d4] p-4 rounded-lg overflow-auto my-3">
          {children}
        </pre>
      );
    },
    table({ children }) {
      return (
        <table className="border-collapse w-full my-3">
          {children}
        </table>
      );
    },
    th({ children }) {
      return (
        <th className="border border-border px-3 py-2 bg-muted text-left">
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td className="border border-border px-3 py-2">
          {children}
        </td>
      );
    },
  };

  return (
    <div data-testid="markdown-renderer">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex, rehypeHighlight]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
