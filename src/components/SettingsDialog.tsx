"use client";

import { useSettings } from "@/contexts/SettingsContext";
import { AVAILABLE_MODELS } from "@/lib/models";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
export function SettingsDialog() {
  const { settings, updateSettings } = useSettings();

  return (
    <Dialog>
      <DialogTrigger render={<Button variant="ghost" size="icon" className="h-8 w-8" />}>
        <Settings className="h-4 w-4" />
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="general" className="mt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="general">通用</TabsTrigger>
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
            <TabsTrigger value="model">模型默认值</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <Label>主题</Label>
              <ThemeToggle />
            </div>
            <div className="space-y-2">
              <Label>默认系统提示词</Label>
              <Textarea
                value={settings.defaultSystemPrompt}
                onChange={(e) =>
                  updateSettings({ defaultSystemPrompt: e.target.value })
                }
                placeholder="输入默认系统提示词..."
                rows={4}
              />
            </div>
          </TabsContent>

          <TabsContent value="apikeys" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>DeepSeek API Key</Label>
              <Input
                type="password"
                value={settings.apiKeys.deepseek ?? ""}
                onChange={(e) =>
                  updateSettings({
                    apiKeys: { ...settings.apiKeys, deepseek: e.target.value || undefined },
                  })
                }
                placeholder="sk-..."
              />
            </div>
            <div className="space-y-2">
              <Label>OpenAI API Key</Label>
              <Input
                type="password"
                value={settings.apiKeys.openai ?? ""}
                onChange={(e) =>
                  updateSettings({
                    apiKeys: { ...settings.apiKeys, openai: e.target.value || undefined },
                  })
                }
                placeholder="sk-..."
              />
            </div>
          </TabsContent>

          <TabsContent value="model" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>默认模型</Label>
              <Select
                value={settings.defaultModel}
                onValueChange={(v) => { if (v) updateSettings({ defaultModel: v }); }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {AVAILABLE_MODELS.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.displayName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>
                Temperature: {settings.modelParams.temperature.toFixed(1)}
              </Label>
              <Slider
                value={[settings.modelParams.temperature]}
                onValueChange={(v) => {
                  const val = Array.isArray(v) ? v[0] : v;
                  updateSettings({
                    modelParams: { ...settings.modelParams, temperature: val },
                  });
                }}
                min={0}
                max={2}
                step={0.1}
              />
            </div>
            <div className="space-y-2">
              <Label>Max Tokens</Label>
              <Input
                type="number"
                value={settings.modelParams.maxTokens}
                onChange={(e) =>
                  updateSettings({
                    modelParams: {
                      ...settings.modelParams,
                      maxTokens: parseInt(e.target.value) || 4096,
                    },
                  })
                }
                min={256}
                max={128000}
              />
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
