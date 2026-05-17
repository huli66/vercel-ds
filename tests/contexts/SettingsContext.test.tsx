import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SettingsProvider, useSettings } from "@/contexts/SettingsContext";

function TestConsumer() {
  const { settings, updateSettings } = useSettings();
  return (
    <div>
      <span data-testid="model">{settings.defaultModel}</span>
      <span data-testid="temp">{settings.modelParams.temperature}</span>
      <button
        onClick={() => updateSettings({ defaultModel: "openai:gpt-4o" })}
      >
        change-model
      </button>
      <button
        onClick={() =>
          updateSettings({
            modelParams: { ...settings.modelParams, temperature: 1.5 },
          })
        }
      >
        change-temp
      </button>
    </div>
  );
}

describe("SettingsContext", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("provides default settings", () => {
    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );
    expect(screen.getByTestId("model").textContent).toBe(
      "deepseek:deepseek-chat"
    );
    expect(screen.getByTestId("temp").textContent).toBe("0.7");
  });

  it("updates settings on action", () => {
    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    fireEvent.click(screen.getByText("change-model"));
    expect(screen.getByTestId("model").textContent).toBe("openai:gpt-4o");
  });

  it("persists updates to localStorage", () => {
    render(
      <SettingsProvider>
        <TestConsumer />
      </SettingsProvider>
    );

    fireEvent.click(screen.getByText("change-temp"));
    expect(screen.getByTestId("temp").textContent).toBe("1.5");

    const saved = JSON.parse(localStorage.getItem("app-settings")!);
    expect(saved.modelParams.temperature).toBe(1.5);
  });

  it("throws when useSettings is used outside provider", () => {
    expect(() => render(<TestConsumer />)).toThrow(
      "useSettings must be used within SettingsProvider"
    );
  });
});
