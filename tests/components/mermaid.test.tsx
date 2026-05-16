import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockRender = vi.fn();

vi.mock("mermaid", () => ({
  default: {
    initialize: vi.fn(),
    render: (...args: unknown[]) => mockRender(...args),
  },
}));

import { MermaidBlock } from "../../src/components/MermaidBlock";

describe("MermaidBlock", () => {
  beforeEach(() => {
    mockRender.mockReset();
  });

  it("renders SVG from mermaid", async () => {
    mockRender.mockResolvedValue({ svg: '<svg data-testid="mermaid-svg">chart</svg>' });

    render(<MermaidBlock code="graph TD\nA-->B" />);

    await waitFor(() => {
      const container = screen.getByTestId("mermaid-container");
      expect(container.innerHTML).toContain("svg");
    });
  });

  it("shows fallback on render error", async () => {
    mockRender.mockRejectedValue(new Error("Parse error"));

    render(<MermaidBlock code="invalid mermaid" />);

    await waitFor(() => {
      expect(screen.getByTestId("mermaid-error")).toBeInTheDocument();
      expect(screen.getByText("invalid mermaid")).toBeInTheDocument();
    });
  });
});
