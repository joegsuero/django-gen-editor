import React, { useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Copy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { templates } from "@/constants/templates"; // Ensure this import is correct

interface TemplatesTabContentProps {
  setYamlContent: (yaml: string) => void;
}

const TemplatesTabContent = ({ setYamlContent }: TemplatesTabContentProps) => {
  // Use a state to manage expanded status for each template
  // Key will be the template index, value will be the current expansion level (0: default, 1: slightly more, etc.)
  const [expandedStates, setExpandedStates] = useState<Record<number, number>>(
    {}
  );

  const toggleExpand = (index: number) => {
    setExpandedStates((prevStates) => {
      const currentLevel = prevStates[index] || 0;
      // Define expansion levels (e.g., 0: 24 lines, 1: 48 lines, 2: full)
      const nextLevel = (currentLevel + 1) % 3; // Cycle through 0, 1, 2
      return { ...prevStates, [index]: nextLevel };
    });
  };

  const collapseOnHoverLeave = (index: number) => {
    setExpandedStates((prevStates) => ({ ...prevStates, [index]: 0 })); // Reset to default on hover leave
  };

  const getMaxHeight = (index: number) => {
    const level = expandedStates[index] || 0;
    if (level === 0) return "max-h-48"; // Initial snippet (approx 4 lines)
    if (level === 1) return "max-h-96"; // More lines (approx 8 lines)
    return "max-h-full"; // Full content
  };

  const getOverlayText = (index: number) => {
    const level = expandedStates[index] || 0;
    if (level === 2) return ""; // No text when fully expanded
    return level === 0 ? "Click to expand" : "Click to expand more";
  };

  return (
    <ScrollArea style={{ height: "75vh" }} className="border rounded-lg p-4">
      <div className="space-y-4">
        {/* Section: Template Library */}
        <div>
          <h3 className="font-semibold mb-2 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            Template Library
          </h3>
          <div className="text-sm space-y-2">
            <p>
              Explore and apply pre-defined YAML schemas for common Django
              project types. Clicking on a template will populate the editor
              with its corresponding schema.
            </p>
          </div>
        </div>

        <Separator />

        {/* Section: Available Templates */}
        <div>
          <h3 className="font-semibold mb-2">Choose a Template</h3>
          <div className="space-y-4">
            {templates.map((template, index) => (
              <div
                key={index}
                className="p-4 border rounded-lg shadow-sm bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 transition-all duration-200 hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700"
                onMouseLeave={() => collapseOnHoverLeave(index)} // Collapse on mouse leave
              >
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-base font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                    <span className="w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse"></span>
                    {template.name}
                  </h4>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setYamlContent(template.yaml)}
                    className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 border-blue-200 dark:border-blue-800"
                  >
                    <Copy className="h-3 w-3" />
                    Apply
                  </Button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {template.description}
                </p>
                <div
                  className={`bg-gray-100 dark:bg-gray-900 p-3 rounded-md text-xs font-mono overflow-hidden relative group cursor-pointer transition-all duration-300 ${getMaxHeight(
                    index
                  )}`}
                  onClick={() => toggleExpand(index)} // Click to expand
                >
                  <pre className="whitespace-pre-wrap break-words text-gray-700 dark:text-gray-300">
                    {template.yaml}
                  </pre>
                  {/* Only show overlay if not fully expanded */}
                  {expandedStates[index] !== 2 && (
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-100 dark:from-gray-900 to-transparent flex items-end justify-center pb-2">
                      <span className="text-gray-500 dark:text-gray-500 text-xs">
                        {getOverlayText(index)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Section: How to Use */}
        <div>
          <h3 className="font-semibold mb-2">How to Use</h3>
          <div className="text-sm space-y-2">
            <div>
              1. <strong>Select a Template:</strong> Click the "
              <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">
                Apply
              </code>
              " button next to your desired project template.
            </div>
            <div>
              2. <strong>Edit & Customize:</strong> The template's YAML schema
              will appear in the editor. You can then modify it to fit your
              specific needs.
            </div>
            <div>
              3. <strong>Generate Backend:</strong> Once satisfied, use your
              backend generator tool to create the code based on the updated
              schema.
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default TemplatesTabContent;
