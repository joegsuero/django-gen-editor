import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";

interface SettingsTabContentProps {
  editorTheme: "vs-dark" | "light";
  setEditorTheme: (theme: "vs-dark" | "light") => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  wordWrap: boolean;
  setWordWrap: (checked: boolean) => void;
  minimap: boolean;
  setMinimap: (checked: boolean) => void;
}

const SettingsTabContent = ({
  editorTheme,
  setEditorTheme,
  fontSize,
  setFontSize,
  wordWrap,
  setWordWrap,
  minimap,
  setMinimap,
}: SettingsTabContentProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <Label htmlFor="editor-theme">Editor Theme</Label>
        <select
          id="editor-theme"
          className="w-full border rounded px-3 py-2 mt-1"
          value={editorTheme}
          onChange={(e) =>
            setEditorTheme(e.target.value as "vs-dark" | "light")
          }
        >
          <option value="vs-dark">Dark</option>
          <option value="light">Light</option>
        </select>
      </div>

      <div>
        <Label htmlFor="font-size">Font Size</Label>
        <Input
          type="number"
          id="font-size"
          className="w-full border rounded px-3 py-2 mt-1"
          value={fontSize}
          onChange={(e) => setFontSize(Number.parseInt(e.target.value, 10))}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="word-wrap">Word Wrap</Label>
        <Switch
          id="word-wrap"
          checked={wordWrap}
          onCheckedChange={setWordWrap}
        />
      </div>

      <div className="flex items-center space-x-2">
        <Label htmlFor="minimap">Minimap</Label>
        <Switch id="minimap" checked={minimap} onCheckedChange={setMinimap} />
      </div>
    </div>
  );
};

export default SettingsTabContent;
