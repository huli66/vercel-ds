import type { AppSettings } from "./types";

const SETTINGS_KEY = "app-settings";

const DEFAULT_SETTINGS: AppSettings = {
  defaultModel: "deepseek:deepseek-chat",
  defaultSystemPrompt: "",
  apiKeys: {},
  modelParams: { temperature: 0.7, maxTokens: 4096 },
};

export class LocalSettingsStorage {
  getSettings(): AppSettings {
    if (typeof window === "undefined") return DEFAULT_SETTINGS;
    const data = localStorage.getItem(SETTINGS_KEY);
    if (!data) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
  }

  saveSettings(settings: AppSettings): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
}
