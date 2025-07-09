import React from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Info } from "lucide-react"; // Asumiendo que 'Info' es un icono de lucide-react
import { builtInModels } from "../../constants/DjangoBuiltInModels";

interface CustomModel {
  fullReference: string;
  appName: string;
  name: string;
  verbose_name?: string;
  fields?: string[];
}

interface SchemaTabContentProps {
  yamlContent: string;
  parseAvailableModels?: (yaml: string) => CustomModel[];
}

const defaultParseAvailableModels = (yaml: string): CustomModel[] => {
  if (yaml.includes("models:")) {
    const mockModels: CustomModel[] = [];
    const lines = yaml.split("\n");
    let inModelsSection = false;
    let currentApp = "";

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith("apps:")) {
        inModelsSection = true;
      } else if (inModelsSection && trimmedLine.startsWith("- name:")) {
        currentApp = trimmedLine.replace("- name:", "").trim();
      } else if (
        inModelsSection &&
        currentApp &&
        trimmedLine.startsWith("models:")
      ) {
        // Look for models within the current app
        const modelMatch = line.match(/^- name: (\w+)/);
        if (modelMatch) {
          const modelName = modelMatch[1];
          mockModels.push({
            fullReference: `${currentApp}.${modelName}`,
            appName: currentApp,
            name: modelName,
            verbose_name: `${modelName} (Custom)`,
            fields: ["id", "name", "created_at"], // Placeholder fields
          });
        }
      }
    });
    return mockModels;
  }
  return [];
};

const SchemaTabContent = ({
  yamlContent,
  parseAvailableModels = defaultParseAvailableModels,
}: SchemaTabContentProps) => {
  // Obtener los modelos personalizados parseando el contenido YAML
  const customModels = parseAvailableModels(yamlContent);

  return (
    // El componente ScrollArea envuelve todo el contenido para permitir el desplazamiento
    <ScrollArea style={{ height: "75vh" }} className="border rounded-lg p-4">
      <div className="space-y-4">
        {/* Sección: Enhanced ForeignKey Autocompletion */}
        <div>
          <h3 className="font-semibold mb-2">
            Enhanced ForeignKey Autocompletion
          </h3>
          <div className="text-sm space-y-2">
            <div>
              • <strong>Dynamic Model Discovery:</strong> Automatically parses
              your YAML to find all available models across apps
            </div>
            <div>
              • <strong>App.Model Syntax:</strong> Suggests models in proper
              Django format (e.g., 'products.Product', 'users.User')
            </div>
            <div>
              • <strong>Context-Aware Filtering:</strong> Only shows suggestions
              when typing ForeignKey 'to' parameters
            </div>
            <div>
              • <strong>Built-in Models:</strong> Includes Django's built-in
              models like 'auth.User', 'auth.Group'
            </div>
            <div>
              • <strong>Self-References:</strong> Supports self-referential
              relationships for hierarchical structures
            </div>
            <div>
              • <strong>Rich Documentation:</strong> Shows model details,
              fields, and verbose names in suggestions
            </div>
          </div>
        </div>

        <Separator />

        {/* Sección: Smart Duplicate Prevention */}
        <div>
          <h3 className="font-semibold mb-2">Smart Duplicate Prevention</h3>
          <div className="text-sm space-y-2">
            <div>
              • <strong>Option Filtering:</strong> Already configured field
              options are automatically excluded from suggestions
            </div>
            <div>
              • <strong>Permission Filtering:</strong> Previously selected
              permissions won't appear in autocompletion
            </div>
            <div>
              • <strong>Visual Feedback:</strong> Hover over field types to see
              configured vs. available options
            </div>
            <div>
              • <strong>Required Parameter Tracking:</strong> Missing required
              parameters are highlighted in suggestions
            </div>
            <div>
              • <strong>Configuration Summary:</strong> Autocompletion shows
              what's already configured for context
            </div>
          </div>
        </div>

        <Separator />

        {/* Sección: Available Models for ForeignKey Relationships */}
        <div>
          <h3 className="font-semibold mb-2">
            Available Models for ForeignKey Relationships
          </h3>
          <div className="space-y-4">
            {/* Sub-sección: Custom Models */}
            <div>
              <h4 className="text-sm font-medium text-blue-600 dark:text-blue-400 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                Custom Models ({customModels.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {customModels.map((model, index) => (
                  <div
                    key={index}
                    className="p-2 border rounded text-sm bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  >
                    <div className="font-medium text-blue-800 dark:text-blue-200">
                      {model.fullReference}
                    </div>
                    <div className="text-xs text-blue-600 dark:text-blue-300">
                      App: {model.appName} | Model: {model.name}
                      {model.verbose_name && ` | ${model.verbose_name}`}
                    </div>
                    {model.fields && model.fields.length > 0 && (
                      <div className="text-xs text-blue-500 dark:text-blue-400 mt-1">
                        Fields: {model.fields.slice(0, 3).join(", ")}
                        {model.fields.length > 3 &&
                          ` +${model.fields.length - 3} more`}
                      </div>
                    )}
                  </div>
                ))}
                {customModels.length === 0 && (
                  <div className="text-center text-muted-foreground py-4 border-2 border-dashed rounded">
                    <Info className="h-6 w-6 mx-auto mb-2 opacity-50" />
                    <p>No custom models defined yet</p>
                    <p className="text-xs mt-1">
                      Add models to your YAML schema to see them here
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-sección: Built-in Models */}
            <div>
              <h4 className="text-sm font-medium text-green-600 dark:text-green-400 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Django Built-in Models
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {builtInModels.map((model, index) => (
                  <div
                    key={index}
                    className="p-2 border rounded text-sm bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  >
                    <div className="font-medium text-green-800 dark:text-green-200">
                      {model.app}.{model.name}
                    </div>
                    <div className="text-xs text-green-600 dark:text-green-300">
                      {model.category} | {model.description}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sub-sección: Usage Examples */}
            <div>
              <h4 className="text-sm font-medium text-purple-600 dark:text-purple-400 mb-2 flex items-center gap-1">
                <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                ForeignKey Usage Examples
              </h4>
              <div className="space-y-2 text-xs">
                <div className="p-2 border rounded bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <div className="font-medium text-purple-800 dark:text-purple-200">
                    Custom Model Reference
                  </div>
                  <code className="text-purple-600 dark:text-purple-300">
                    options: "to='products.Category', on_delete=models.CASCADE"
                  </code>
                </div>
                <div className="p-2 border rounded bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <div className="font-medium text-purple-800 dark:text-purple-200">
                    Built-in User Model
                  </div>
                  <code className="text-purple-600 dark:text-purple-300">
                    options: "to='auth.User', on_delete=models.CASCADE"
                  </code>
                </div>
                <div className="p-2 border rounded bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                  <div className="font-medium text-purple-800 dark:text-purple-200">
                    Self-Reference
                  </div>
                  <code className="text-purple-600 dark:text-purple-300">
                    options: "to='users.User', on_delete=models.SET_NULL,
                    null=True"
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Sección: Django Built-in Models (Repetido, pero con formato diferente en el original) */}
        {/* Esta sección parece ser una repetición de la sub-sección anterior, pero con un formato más simple.
            Si el original tiene una razón para esta duplicación, la mantendremos.
            De lo contrario, podría considerarse una refactorización para evitar la redundancia. */}
        <div>
          <h3 className="font-semibold mb-2">Django Built-in Models</h3>
          <div className="space-y-2">
            {builtInModels.map((model, index) => (
              <div key={index} className="p-2 border rounded text-sm">
                <code className="bg-slate-100 dark:bg-slate-800 px-1 rounded text-xs">
                  {model.app}.{model.name}
                </code>
                <p className="text-xs text-muted-foreground mt-1">
                  {model.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
};

export default SchemaTabContent;
