export interface ModelConfig {
  id: string;
  provider: "deepseek" | "openai";
  modelId: string;
  displayName: string;
}

export const AVAILABLE_MODELS: ModelConfig[] = [
  {
    id: "deepseek:deepseek-chat",
    provider: "deepseek",
    modelId: "deepseek-chat",
    displayName: "DeepSeek Chat",
  },
  {
    id: "deepseek:deepseek-reasoner",
    provider: "deepseek",
    modelId: "deepseek-reasoner",
    displayName: "DeepSeek Reasoner",
  },
  {
    id: "openai:gpt-4o",
    provider: "openai",
    modelId: "gpt-4o",
    displayName: "GPT-4o",
  },
  {
    id: "openai:gpt-4o-mini",
    provider: "openai",
    modelId: "gpt-4o-mini",
    displayName: "GPT-4o Mini",
  },
];

export function getModelConfig(id: string): ModelConfig | undefined {
  return AVAILABLE_MODELS.find((m) => m.id === id);
}
