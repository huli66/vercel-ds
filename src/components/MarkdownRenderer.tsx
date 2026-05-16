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

      // Inline code (no language class and not inside pre)
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
        <pre
          style={{
            backgroundColor: "#1e1e1e",
            color: "#d4d4d4",
            padding: "16px",
            borderRadius: "8px",
            overflow: "auto",
            margin: "12px 0",
          }}
        >
          {children}
        </pre>
      );
    },
    table({ children }) {
      return (
        <table
          style={{
            borderCollapse: "collapse",
            width: "100%",
            margin: "12px 0",
          }}
        >
          {children}
        </table>
      );
    },
    th({ children }) {
      return (
        <th
          style={{
            border: "1px solid #ddd",
            padding: "8px 12px",
            backgroundColor: "#f5f5f5",
            textAlign: "left",
          }}
        >
          {children}
        </th>
      );
    },
    td({ children }) {
      return (
        <td style={{ border: "1px solid #ddd", padding: "8px 12px" }}>
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
