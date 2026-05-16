import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { MarkdownRenderer } from "../../src/components/MarkdownRenderer";

// Mock mermaid to avoid dynamic import issues in tests
vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: vi.fn().mockResolvedValue({ svg: "<svg>mock</svg>" }),
  },
}));

describe("MarkdownRenderer", () => {
  it("renders basic markdown (headings, bold, lists)", () => {
    const md = `# Hello

**bold text**

- item 1
- item 2`;

    render(<MarkdownRenderer content={md} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Hello");
    expect(screen.getByText("bold text")).toBeInTheDocument();
    expect(screen.getAllByRole("listitem")).toHaveLength(2);
  });

  it("renders GFM tables", () => {
    const md = `| Name | Age |
| --- | --- |
| Alice | 30 |`;

    render(<MarkdownRenderer content={md} />);
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("renders code blocks with highlight classes", () => {
    const md = "```javascript\nconst x = 1;\n```";

    const { container } = render(<MarkdownRenderer content={md} />);
    const codeEl = container.querySelector("pre code");
    expect(codeEl).toBeInTheDocument();
    expect(codeEl?.className).toContain("language-javascript");
  });

  it("renders LaTeX formulas with KaTeX", () => {
    const md = "$E=mc^2$";

    const { container } = render(<MarkdownRenderer content={md} />);
    const katexEl = container.querySelector(".katex");
    expect(katexEl).toBeInTheDocument();
  });

  it("renders mermaid code blocks with MermaidBlock component", () => {
    const md = "```mermaid\ngraph TD\nA-->B\n```";

    const { container } = render(<MarkdownRenderer content={md} />);
    // Should render MermaidBlock, not a regular code block
    const mermaidContainer = container.querySelector("[data-testid='mermaid-container']");
    expect(mermaidContainer).toBeInTheDocument();
  });
});
