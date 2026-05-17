"use client";

import { AVAILABLE_MODELS } from "@/lib/models";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ModelSelectorProps {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const deepseekModels = AVAILABLE_MODELS.filter(
    (m) => m.provider === "deepseek"
  );
  const openaiModels = AVAILABLE_MODELS.filter(
    (m) => m.provider === "openai"
  );

  const current = AVAILABLE_MODELS.find((m) => m.id === value);

  return (
    <Select value={value} onValueChange={(v) => { if (v) onChange(v); }}>
      <SelectTrigger className="w-[200px] h-8 text-sm">
        <SelectValue>
          {current && (
            <span className="flex items-center gap-1.5">
              <Badge variant="outline" className="text-[10px] px-1 py-0 font-normal">
                {current.provider === "deepseek" ? "DS" : "OAI"}
              </Badge>
              {current.displayName}
            </span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          <SelectLabel>DeepSeek</SelectLabel>
          {deepseekModels.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.displayName}
            </SelectItem>
          ))}
        </SelectGroup>
        <SelectGroup>
          <SelectLabel>OpenAI</SelectLabel>
          {openaiModels.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.displayName}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
