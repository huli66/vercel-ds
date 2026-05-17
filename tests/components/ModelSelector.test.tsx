import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ModelSelector } from "@/components/ModelSelector";

describe("ModelSelector", () => {
  it("renders with current model displayed", () => {
    const onChange = vi.fn();
    render(
      <ModelSelector value="deepseek:deepseek-chat" onChange={onChange} />
    );
    expect(screen.getByText("DeepSeek Chat")).toBeInTheDocument();
    expect(screen.getByText("DS")).toBeInTheDocument();
  });

  it("shows OAI badge for OpenAI models", () => {
    const onChange = vi.fn();
    render(<ModelSelector value="openai:gpt-4o" onChange={onChange} />);
    expect(screen.getByText("GPT-4o")).toBeInTheDocument();
    expect(screen.getByText("OAI")).toBeInTheDocument();
  });
});
