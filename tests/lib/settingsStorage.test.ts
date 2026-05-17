import { describe, it, expect, beforeEach } from "vitest";
import { LocalSettingsStorage } from "@/lib/storage/settingsStorage";
import type { AppSettings } from "@/lib/storage/types";

describe("LocalSettingsStorage", () => {
  let storage: LocalSettingsStorage;

  beforeEach(() => {
    localStorage.clear();
    storage = new LocalSettingsStorage();
  });

  it("returns default settings when nothing saved", () => {
    const settings = storage.getSettings();
    expect(settings.defaultModel).toBe("deepseek:deepseek-chat");
    expect(settings.defaultSystemPrompt).toBe("");
    expect(settings.apiKeys).toEqual({});
    expect(settings.modelParams.temperature).toBe(0.7);
    expect(settings.modelParams.maxTokens).toBe(4096);
  });

  it("saves and retrieves settings", () => {
    const custom: AppSettings = {
      defaultModel: "openai:gpt-4o",
      defaultSystemPrompt: "You are helpful",
      apiKeys: { deepseek: "sk-ds-123", openai: "sk-oai-456" },
      modelParams: { temperature: 1.0, maxTokens: 8192 },
    };

    storage.saveSettings(custom);
    const retrieved = storage.getSettings();

    expect(retrieved.defaultModel).toBe("openai:gpt-4o");
    expect(retrieved.defaultSystemPrompt).toBe("You are helpful");
    expect(retrieved.apiKeys.deepseek).toBe("sk-ds-123");
    expect(retrieved.apiKeys.openai).toBe("sk-oai-456");
    expect(retrieved.modelParams.temperature).toBe(1.0);
    expect(retrieved.modelParams.maxTokens).toBe(8192);
  });

  it("merges partial saved data with defaults", () => {
    localStorage.setItem(
      "app-settings",
      JSON.stringify({ defaultModel: "openai:gpt-4o" })
    );

    const settings = storage.getSettings();
    expect(settings.defaultModel).toBe("openai:gpt-4o");
    // Other fields should have defaults
    expect(settings.defaultSystemPrompt).toBe("");
    expect(settings.modelParams.temperature).toBe(0.7);
  });

  it("persists across instances", () => {
    const custom: AppSettings = {
      defaultModel: "openai:gpt-4o-mini",
      defaultSystemPrompt: "",
      apiKeys: {},
      modelParams: { temperature: 0.5, maxTokens: 2048 },
    };
    storage.saveSettings(custom);

    const newStorage = new LocalSettingsStorage();
    const retrieved = newStorage.getSettings();
    expect(retrieved.defaultModel).toBe("openai:gpt-4o-mini");
    expect(retrieved.modelParams.temperature).toBe(0.5);
  });
});
