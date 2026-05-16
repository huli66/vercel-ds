"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidBlockProps {
  code: string;
}

export function MermaidBlock({ code }: MermaidBlockProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function renderMermaid() {
      try {
        const mermaid = (await import("mermaid")).default;
        mermaid.initialize({ startOnLoad: false });
        const id = `mermaid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const { svg } = await mermaid.render(id, code);
        if (!cancelled && containerRef.current) {
          containerRef.current.innerHTML = svg;
          setError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Mermaid render error");
        }
      }
    }

    renderMermaid();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (error) {
    return (
      <pre data-testid="mermaid-error">
        <code>{code}</code>
      </pre>
    );
  }

  return (
    <div
      ref={containerRef}
      data-testid="mermaid-container"
      style={{ display: "flex", justifyContent: "center", margin: "16px 0" }}
    />
  );
}
