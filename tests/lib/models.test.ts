import { describe, it, expect } from "vitest";
import { AVAILABLE_MODELS, getModelConfig } from "@/lib/models";

describe("models", () => {
  describe("AVAILABLE_MODELS", () => {
    it("contains deepseek and openai models", () => {
      const providers = [...new Set(AVAILABLE_MODELS.map((m) => m.provider))];
      expect(providers).toContain("deepseek");
      expect(providers).toContain("openai");
    });

    it("each model has unique id", () => {
      const ids = AVAILABLE_MODELS.map((m) => m.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it("each model id follows provider:modelId format", () => {
      for (const model of AVAILABLE_MODELS) {
        expect(model.id).toBe(`${model.provider}:${model.modelId}`);
      }
    });
  });

  describe("getModelConfig", () => {
    it("returns model config for valid id", () => {
      const config = getModelConfig("deepseek:deepseek-chat");
      expect(config).toBeDefined();
      expect(config!.provider).toBe("deepseek");
      expect(config!.modelId).toBe("deepseek-chat");
    });

    it("returns undefined for invalid id", () => {
      expect(getModelConfig("unknown:model")).toBeUndefined();
    });
  });
});
