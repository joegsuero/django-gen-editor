"use client";

import type React from "react";
import { useState, useRef, useCallback, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Save,
  Upload,
  AlertCircle,
  CheckCircle,
  Code,
  Search,
} from "lucide-react";
import { type Monaco } from "@monaco-editor/react";
import type { editor } from "monaco-editor";
import {
  YAMLValidator,
  type ValidationError,
} from "../validator/yaml-validator";

import { djangoFieldOptions, onDeleteOptions } from "../schema/django-schema";
import { djangoPermissions } from "../../constants/DjangoPermissions";
import { apiActions } from "../../constants/ApiActions";
import { builtInModels } from "../../constants/DjangoBuiltInModels";
import MonacoEditor from "./MonacoEditor";
import SchemaTabContent from "../tabs/SchemaTab";
import ValidationTabContent from "../tabs/ValidationTab";
import SettingsTabContent from "../tabs/SettingsTab";
import HelpTabContent from "../tabs/HelpTab";
import { defaultEditorContent } from "../../constants/defaultEditorContent";
import { FieldConfiguration, ModelInfo } from "@/types/types";
import TemplatesTabContent from "../tabs/TemplatesTab";

export default function YAMLEditor() {
  const [yamlContent, setYamlContent] = useState(defaultEditorContent);
  const [fileName, setFileName] = useState("schema-definition.yaml");
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>(
    []
  );
  const [editorTheme, setEditorTheme] = useState<"vs-dark" | "light">(
    "vs-dark"
  );
  const [fontSize, setFontSize] = useState(14);
  const [wordWrap, setWordWrap] = useState(false);
  const [minimap, setMinimap] = useState(true);
  const [strictValidation, setStrictValidation] = useState(true);
  const [editorInstance, setEditorInstance] =
    useState<editor.IStandaloneCodeEditor | null>(null);
  const [monacoInstance, setMonacoInstance] = useState<Monaco | null>(null);
  const [validator] = useState(new YAMLValidator());
  const [validationProgress, setValidationProgress] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real-time validation with debouncing
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (strictValidation) {
        setValidationProgress(0);
        const errors = validator.validateSchema(yamlContent);
        setValidationErrors(errors);
        setValidationProgress(100);

        // Update Monaco markers
        if (monacoInstance && editorInstance) {
          const model = editorInstance.getModel();
          if (model) {
            const markers = errors.map((error) => ({
              startLineNumber: error.line,
              startColumn: error.column,
              endLineNumber: error.line,
              endColumn: model.getLineMaxColumn(error.line),
              message: error.message,
              severity:
                error.severity === "error"
                  ? monacoInstance.MarkerSeverity.Error
                  : error.severity === "warning"
                  ? monacoInstance.MarkerSeverity.Warning
                  : monacoInstance.MarkerSeverity.Info,
            }));

            monacoInstance.editor.setModelMarkers(
              model,
              "django-schema-validation",
              markers
            );
          }
        }
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [
    yamlContent,
    strictValidation,
    validator,
    monacoInstance,
    editorInstance,
  ]);

  // Function to parse available models from YAML content
  const parseAvailableModels = useCallback(
    (yamlContent: string): ModelInfo[] => {
      const models: ModelInfo[] = [];

      try {
        const lines = yamlContent.split("\n");
        let currentApp = "";
        let inModelsSection = false;
        let currentModel: Partial<ModelInfo> = {};
        let inFieldsSection = false;
        let modelIndentLevel = 0;
        let appIndentLevel = 0;

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          const trimmed = line.trim();
          const indentLevel = line.length - line.trimStart().length;

          if (!trimmed || trimmed.startsWith("#")) continue;

          // Detect app name - handle both array and object formats
          const appArrayMatch = line.match(
            /^\s*-\s*([a-zA-Z_][a-zA-Z0-9_]*):\s*$/
          );
          const appObjectMatch = line.match(
            /^\s*([a-zA-Z_][a-zA-Z0-9_]*):\s*$/
          );

          if (appArrayMatch) {
            // Array format: - app_name:
            currentApp = appArrayMatch[1];
            appIndentLevel = indentLevel;
            inModelsSection = false;
            continue;
          } else if (appObjectMatch && indentLevel === 0) {
            // Object format: app_name: (at root level)
            currentApp = appObjectMatch[1];
            appIndentLevel = indentLevel;
            inModelsSection = false;
            continue;
          }

          // Detect models section - handle various formats
          if (
            (trimmed === "- models:" || trimmed === "models:") &&
            currentApp
          ) {
            inModelsSection = true;
            modelIndentLevel = indentLevel;
            continue;
          }

          // Process model definitions when in models section
          if (inModelsSection && currentApp) {
            // Detect model name - handle both formats
            const modelArrayMatch = line.match(
              /^\s*-\s*name:\s*([A-Z][a-zA-Z0-9]*)\s*$/
            );
            const modelObjectMatch = line.match(
              /^\s*name:\s*([A-Z][a-zA-Z0-9]*)\s*$/
            );

            if (modelArrayMatch || modelObjectMatch) {
              // Save previous model if exists
              if (currentModel.name && currentModel.appName) {
                models.push({
                  name: currentModel.name,
                  appName: currentModel.appName,
                  fullReference: `${currentModel.appName}.${currentModel.name}`,
                  verbose_name: currentModel.verbose_name,
                  fields: currentModel.fields || [],
                });
              }

              // Start new model
              const modelName = modelArrayMatch
                ? modelArrayMatch[1]
                : modelObjectMatch![1];
              currentModel = {
                name: modelName,
                appName: currentApp,
                fields: [],
              };
              inFieldsSection = false;
              continue;
            }

            // Detect verbose_name - handle quoted and unquoted values
            const verboseNameMatch = line.match(
              /^\s*verbose_name:\s*["']?([^"'\n]+)["']?\s*$/
            );
            if (verboseNameMatch && currentModel.name) {
              currentModel.verbose_name = verboseNameMatch[1].replace(
                /["']/g,
                ""
              );
              continue;
            }

            // Detect fields section
            if (trimmed === "fields:" && currentModel.name) {
              inFieldsSection = true;
              continue;
            }

            // Detect field names when in fields section
            if (inFieldsSection && currentModel.fields) {
              const fieldArrayMatch = line.match(
                /^\s*-\s*name:\s*([a-z][a-z0-9_]*)\s*$/
              );
              const fieldObjectMatch = line.match(
                /^\s*name:\s*([a-z][a-z0-9_]*)\s*$/
              );

              if (fieldArrayMatch || fieldObjectMatch) {
                const fieldName = fieldArrayMatch
                  ? fieldArrayMatch[1]
                  : fieldObjectMatch![1];
                currentModel.fields.push(fieldName);
              }
            }

            // Detect end of fields section
            if (
              inFieldsSection &&
              trimmed &&
              !trimmed.startsWith("-") &&
              !trimmed.includes("name:") &&
              !trimmed.includes("type:") &&
              !trimmed.includes("options:") &&
              !trimmed.includes("help_text:") &&
              trimmed.includes(":")
            ) {
              inFieldsSection = false;
            }

            // Detect end of current model (start of new model or section)
            if (
              currentModel.name &&
              (line.match(/^\s*-\s*name:\s*[A-Z]/) || // New model
                trimmed === "api:" ||
                trimmed === "manager:" ||
                trimmed === "meta:" || // New model section
                trimmed === "views:" ||
                trimmed === "urls:" || // New app section
                (indentLevel <= appIndentLevel && trimmed.includes(":"))) // New app
            ) {
              // Don't end the model here, let it be handled by the next iteration
            }
          }

          // Detect end of models section
          if (
            inModelsSection &&
            (trimmed === "views:" ||
              trimmed === "urls:" ||
              (indentLevel <= appIndentLevel &&
                line.match(/^\s*-?\s*[a-zA-Z_]/)))
          ) {
            inModelsSection = false;
          }

          // Detect new app (end current app context)
          if (
            currentApp &&
            (line.match(/^\s*-\s*[a-zA-Z_][a-zA-Z0-9_]*:\s*$/) || // New app in array format
              (indentLevel === 0 &&
                line.match(/^\s*[a-zA-Z_][a-zA-Z0-9_]*:\s*$/))) // New app in object format
          ) {
            // This will be handled in the next iteration
          }
        }

        // Save last model if exists
        if (currentModel.name && currentModel.appName) {
          models.push({
            name: currentModel.name,
            appName: currentModel.appName,
            fullReference: `${currentModel.appName}.${currentModel.name}`,
            verbose_name: currentModel.verbose_name,
            fields: currentModel.fields || [],
          });
        }

        // Remove duplicates and sort
        const uniqueModels = models.filter(
          (model, index, self) =>
            index ===
            self.findIndex((m) => m.fullReference === model.fullReference)
        );

        return uniqueModels.sort((a, b) => {
          // Sort by app name first, then by model name
          if (a.appName !== b.appName) {
            return a.appName.localeCompare(b.appName);
          }
          return a.name.localeCompare(b.name);
        });
      } catch (error) {
        console.error("Error parsing models from YAML:", error);
        return [];
      }
    },
    []
  );

  // Replace the existing handleEditorDidMount function with enhanced context-aware completion
  const handleEditorDidMount = useCallback(
    (editor: editor.IStandaloneCodeEditor, monaco: Monaco) => {
      setEditorInstance(editor);
      setMonacoInstance(monaco);

      // Configure YAML language
      monaco.languages.setLanguageConfiguration("yaml", {
        brackets: [
          ["{", "}"],
          ["[", "]"],
          ["(", ")"],
        ],
        autoClosingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
        surroundingPairs: [
          { open: "{", close: "}" },
          { open: "[", close: "]" },
          { open: "(", close: ")" },
          { open: '"', close: '"' },
          { open: "'", close: "'" },
        ],
        indentationRules: {
          increaseIndentPattern: /^.*:(\s*\[.*\]|\s*\{.*\}|\s*[^#].*)?$/,
          decreaseIndentPattern: /^\s*[}\]]/,
        },
      });

      // Enhanced completion provider with context-aware field options and duplicate filtering
      monaco.languages.registerCompletionItemProvider("yaml", {
        provideCompletionItems: (model, position) => {
          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          const currentLine = model.getLineContent(position.lineNumber);
          const linePrefix = currentLine.substring(0, position.column - 1);

          const suggestions: any[] = [];

          // Helper function to parse existing options from the options string
          const parseExistingOptions = (optionsString: string): Set<string> => {
            const existingOptions = new Set<string>();

            if (!optionsString) return existingOptions;

            // Remove quotes and clean the string
            const cleanOptions = optionsString
              .replace(/^["']|["']$/g, "")
              .trim();

            if (!cleanOptions) return existingOptions;

            // Split by comma and extract parameter names
            const optionParts = cleanOptions.split(",");

            for (const part of optionParts) {
              const trimmedPart = part.trim();
              if (trimmedPart) {
                // Extract parameter name (everything before '=')
                const equalIndex = trimmedPart.indexOf("=");
                if (equalIndex > 0) {
                  const paramName = trimmedPart.substring(0, equalIndex).trim();
                  existingOptions.add(paramName);
                }
              }
            }

            return existingOptions;
          };

          // Helper function to find current field context and existing options
          const getCurrentFieldContext = (textUntilPosition: string) => {
            const lines = textUntilPosition.split("\n");
            let currentFieldType = null;
            let existingOptions = new Set<string>();
            let fieldStartIndex = -1;

            // Look backwards to find the current field definition
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i];

              // Check for field type
              const typeMatch = line.match(/type:\s*(\w+)/);
              if (typeMatch && !currentFieldType) {
                currentFieldType = typeMatch[1];
              }

              // Check for existing options
              const optionsMatch = line.match(/options:\s*["']([^"']*)["']?/);
              if (optionsMatch && existingOptions.size === 0) {
                existingOptions = parseExistingOptions(optionsMatch[1]);
              }

              // Stop if we hit another field definition or model boundary
              if (
                (line.includes("- name:") && i < lines.length - 1) ||
                line.includes("models:") ||
                line.includes("apps:")
              ) {
                fieldStartIndex = i;
                break;
              }
            }

            return { currentFieldType, existingOptions, fieldStartIndex };
          };

          // Helper function to detect if we're in a ForeignKey 'to' parameter context
          const isForeignKeyToContext = (
            linePrefix: string,
            textUntilPosition: string
          ): boolean => {
            // Check if we're in options and the field type is a relationship field
            const { currentFieldType } =
              getCurrentFieldContext(textUntilPosition);
            const isRelationshipField = [
              "ForeignKey",
              "OneToOneField",
              "ManyToManyField",
            ].includes(currentFieldType || "");

            if (!isRelationshipField) return false;

            // Check various contexts where 'to' parameter might be typed
            return (
              linePrefix.includes("to=") ||
              linePrefix.includes("to =") ||
              linePrefix.includes('to="') ||
              linePrefix.includes("to='") ||
              (linePrefix.includes("options:") &&
                linePrefix.includes('"') &&
                !linePrefix.endsWith('"'))
            );
          };

          // Context-aware field type suggestions
          if (
            linePrefix.includes("type:") &&
            linePrefix.trim().endsWith("type:")
          ) {
            Object.keys(djangoFieldOptions).forEach((fieldType) => {
              const fieldInfo =
                djangoFieldOptions[
                  fieldType as keyof typeof djangoFieldOptions
                ];
              const requiredParams = fieldInfo.required.join(", ") || "none";

              suggestions.push({
                label: fieldType,
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: ` ${fieldType}`,
                detail: `Django ${fieldType}`,
                documentation: {
                  value: `**${fieldType}**\n\nRequired parameters: ${requiredParams}\n\nAvailable options: ${fieldInfo.options
                    .map((opt) => opt.name)
                    .join(", ")}`,
                  isTrusted: true,
                },
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endColumn: position.column,
                },
              });
            });
          }

          // Enhanced ForeignKey model suggestions
          if (isForeignKeyToContext(linePrefix, textUntilPosition)) {
            const availableModels = parseAvailableModels(model.getValue());

            // Get current input to filter suggestions
            const currentInput = linePrefix
              .split(/[",\s]/)
              .pop()
              ?.replace(/.*to\s*=\s*["']?/, "")
              ?.trim();

            // Enhanced built-in models with more comprehensive list

            // Combine and filter all models
            const allAvailableModels = [
              ...availableModels.map((m) => ({
                ...m,
                category: "Custom Models",
                isCustom: true,
              })),
              ...builtInModels.map((b) => ({
                name: b.name,
                appName: b.app,
                fullReference: `${b.app}.${b.name}`,
                verbose_name: b.description,
                fields: [],
                category: b.category,
                isCustom: false,
              })),
            ];

            // Filter models based on current input
            const filteredModels = allAvailableModels.filter((modelInfo) => {
              if (!currentInput) return true;
              const searchTerm = currentInput.toLowerCase();
              return (
                modelInfo.fullReference.toLowerCase().includes(searchTerm) ||
                modelInfo.name.toLowerCase().includes(searchTerm) ||
                modelInfo.appName.toLowerCase().includes(searchTerm) ||
                (modelInfo.verbose_name &&
                  modelInfo.verbose_name.toLowerCase().includes(searchTerm))
              );
            });

            // Group models by category for better organization
            const customModels = filteredModels.filter((m) => m.isCustom);
            const builtInModelsList = filteredModels.filter((m) => !m.isCustom);

            // Add custom models first (higher priority)
            customModels.forEach((modelInfo) => {
              const isInQuotes =
                linePrefix.includes('"') || linePrefix.includes("'");
              const insertText = isInQuotes
                ? modelInfo.fullReference
                : `"${modelInfo.fullReference}"`;

              // Create detailed documentation for custom models
              const fieldsInfo = modelInfo.fields?.length
                ? `\n\n**Fields:** ${modelInfo.fields.join(", ")}`
                : "";
              const verboseInfo = modelInfo.verbose_name
                ? `\n\n**Verbose Name:** ${modelInfo.verbose_name}`
                : "";

              suggestions.push({
                label: modelInfo.fullReference,
                kind: monaco.languages.CompletionItemKind.Class,
                insertText: insertText,
                detail: `${modelInfo.appName} app - ${
                  modelInfo.verbose_name || modelInfo.name
                } (Custom Model)`,
                documentation: {
                  value: `**${modelInfo.fullReference}** (Custom Model)\n\n**App:** ${modelInfo.appName}\n**Model:** ${modelInfo.name}${verboseInfo}${fieldsInfo}\n\n🎯 **Custom model defined in your YAML schema**\n\n💡 Use this reference for ForeignKey, OneToOneField, or ManyToManyField relationships.`,
                  isTrusted: true,
                },
                sortText: `1_${modelInfo.appName}_${modelInfo.name}`, // Higher priority than built-ins
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endColumn: position.column,
                },
              });
            });

            // Add built-in models
            builtInModelsList.forEach((modelInfo) => {
              const isInQuotes =
                linePrefix.includes('"') || linePrefix.includes("'");
              const insertText = isInQuotes
                ? modelInfo.fullReference
                : `"${modelInfo.fullReference}"`;

              suggestions.push({
                label: modelInfo.fullReference,
                kind: monaco.languages.CompletionItemKind.Module,
                insertText: insertText,
                detail: `Django built-in - ${modelInfo.verbose_name} (${modelInfo.category})`,
                documentation: {
                  value: `**${modelInfo.fullReference}** (Django Built-in)\n\n**Category:** ${modelInfo.category}\n\n${modelInfo.verbose_name}\n\n🔧 **This is a standard Django model that's available by default.**\n\n💡 No additional setup required - part of Django framework.`,
                  isTrusted: true,
                },
                sortText: `2_${modelInfo.appName}_${modelInfo.name}`, // Lower priority than custom models
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endColumn: position.column,
                },
              });
            });

            // Add self-reference option if we can determine current model
            const currentModelContext =
              getCurrentModelContext(textUntilPosition);
            if (currentModelContext.modelName && currentModelContext.appName) {
              const selfRef = `${currentModelContext.appName}.${currentModelContext.modelName}`;
              if (
                !currentInput ||
                selfRef.toLowerCase().includes(currentInput.toLowerCase())
              ) {
                const isInQuotes =
                  linePrefix.includes('"') || linePrefix.includes("'");
                const insertText = isInQuotes ? selfRef : `"${selfRef}"`;

                suggestions.push({
                  label: selfRef,
                  kind: monaco.languages.CompletionItemKind.Variable,
                  insertText: insertText,
                  detail: `Self-reference - Current model (${currentModelContext.modelName})`,
                  documentation: {
                    value: `**${selfRef}** (Self-Reference)\n\n**Current Model:** ${currentModelContext.modelName}\n**App:** ${currentModelContext.appName}\n\n🔄 **Reference to the current model being defined**\n\nUseful for hierarchical relationships like:\n• Parent/child structures\n• Manager/employee relationships\n• Category/subcategory hierarchies\n• Comment threading systems`,
                    isTrusted: true,
                  },
                  sortText: `0_self_${selfRef}`, // Highest priority for self-reference
                  range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endColumn: position.column,
                  },
                });
              }
            }

            // Add summary information if no models found
            if (filteredModels.length === 0 && currentInput) {
              suggestions.push({
                label: `No models found matching "${currentInput}"`,
                kind: monaco.languages.CompletionItemKind.Text,
                insertText: "",
                detail:
                  "Try a different search term or check your YAML structure",
                documentation: {
                  value: `**No matching models found**\n\nSearched for: "${currentInput}"\n\n**Available models:**\n${
                    availableModels.length > 0
                      ? availableModels
                          .map((m) => `• ${m.fullReference}`)
                          .join("\n")
                      : "• No custom models defined yet"
                  }\n\n**Built-in models:**\n${builtInModels
                    .map((b) => `• ${b.app}.${b.name}`)
                    .join(
                      "\n"
                    )}\n\n💡 **Tip:** Make sure your model names are in PascalCase and properly defined in the YAML structure.`,
                  isTrusted: true,
                },
                sortText: "999_no_results",
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endColumn: position.column,
                },
              });
            }

            // Add helpful information about available models
            if (
              !currentInput &&
              (customModels.length > 0 || builtInModelsList.length > 0)
            ) {
              const totalCustom = customModels.length;
              const totalBuiltIn = builtInModelsList.length;

              suggestions.push({
                label: `📊 ${totalCustom} custom + ${totalBuiltIn} built-in models available`,
                kind: monaco.languages.CompletionItemKind.Text,
                insertText: "",
                detail: "Start typing to filter model suggestions",
                documentation: {
                  value: `**Available Models Summary**\n\n**Custom Models (${totalCustom}):**\n${
                    customModels
                      .map(
                        (m) =>
                          `• ${m.fullReference} - ${m.verbose_name || m.name}`
                      )
                      .join("\n") || "• None defined yet"
                  }\n\n**Django Built-in Models (${totalBuiltIn}):**\n${builtInModelsList
                    .map((m) => `• ${m.fullReference} - ${m.verbose_name}`)
                    .join(
                      "\n"
                    )}\n\n💡 **Tip:** Custom models have higher priority in suggestions and appear first.`,
                  isTrusted: true,
                },
                sortText: "998_summary",
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endColumn: position.column,
                },
              });
            }
          }

          // Helper function to get current model context
          function getCurrentModelContext(textUntilPosition: string) {
            const lines = textUntilPosition.split("\n");
            let currentApp = "";
            let currentModel = "";

            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i];

              // Look for model name
              const modelMatch = line.match(
                /^\s*-\s*name:\s*([A-Z][a-zA-Z0-9]*)\s*$/
              );
              if (modelMatch && !currentModel) {
                currentModel = modelMatch[1];
              }

              // Look for app name
              const appMatch = line.match(
                /^\s*-\s*([a-zA-Z_][a-zA-Z0-9_]*):\s*$/
              );
              if (appMatch && !currentApp) {
                currentApp = appMatch[1];
              }

              if (currentApp && currentModel) break;
            }

            return { appName: currentApp, modelName: currentModel };
          }

          // Enhanced context-aware field options with duplicate filtering
          if (
            linePrefix.includes("options:") &&
            !isForeignKeyToContext(linePrefix, textUntilPosition)
          ) {
            const { currentFieldType, existingOptions } =
              getCurrentFieldContext(textUntilPosition);

            if (
              currentFieldType &&
              djangoFieldOptions[
                currentFieldType as keyof typeof djangoFieldOptions
              ]
            ) {
              const fieldInfo: FieldConfiguration =
                djangoFieldOptions[
                  currentFieldType as keyof typeof djangoFieldOptions
                ];

              // Check if we're inside quotes for options
              const inQuotes =
                linePrefix.includes('"') && !linePrefix.endsWith('"');

              // Get current partial input to avoid suggesting what's being typed
              const currentInput =
                linePrefix
                  .split(/[",\s]/)
                  .pop()
                  ?.trim() || "";
              const currentParamName = currentInput.split("=")[0];

              // Filter out already used options and current partial input
              const availableOptions = fieldInfo.options.filter((option) => {
                const isAlreadyUsed = existingOptions.has(option.name);
                const isCurrentlyTyping = currentParamName === option.name;
                return !isAlreadyUsed && !isCurrentlyTyping;
              });

              availableOptions.forEach((option) => {
                const isRequired = fieldInfo.required.includes(option.name);
                const insertText = inQuotes
                  ? `${option.name}=`
                  : `"${option.name}="`;

                // Add visual indicator for already configured options
                const usedOptionsArray = Array.from(existingOptions);
                const configuredInfo =
                  usedOptionsArray.length > 0
                    ? `\n\n✅ **Already configured:** ${usedOptionsArray.join(
                        ", "
                      )}`
                    : "";

                suggestions.push({
                  label: option.name,
                  kind: monaco.languages.CompletionItemKind.Property,
                  insertText: insertText,
                  detail: `${option.type} - ${option.description}`,
                  documentation: {
                    value: `**${option.name}** (${option.type})\n\n${
                      option.description
                    }\n\n**Example:** ${option.example}${
                      isRequired ? "\n\n⚠️ **Required parameter**" : ""
                    }${configuredInfo}`,
                    isTrusted: true,
                  },
                  sortText: isRequired
                    ? `0_${option.name}`
                    : `1_${option.name}`,
                  range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endColumn: position.column,
                  },
                });
              });

              // Add on_delete options for relationship fields (filter out if already used)
              if (
                ["ForeignKey", "OneToOneField"].includes(currentFieldType) &&
                inQuotes &&
                !existingOptions.has("on_delete")
              ) {
                onDeleteOptions.forEach((option) => {
                  suggestions.push({
                    label: option.name,
                    kind: monaco.languages.CompletionItemKind.Enum,
                    insertText: `on_delete=${option.name}`,
                    detail: option.description,
                    documentation: {
                      value: `**${option.name}**\n\n${option.description}`,
                      isTrusted: true,
                    },
                    sortText: `0_${option.name}`,
                    range: {
                      startLineNumber: position.lineNumber,
                      endLineNumber: position.lineNumber,
                      startColumn: position.column,
                      endColumn: position.column,
                    },
                  });
                });
              }

              // Show summary of remaining required options
              const missingRequired = fieldInfo.required.filter(
                (req) => !existingOptions.has(req)
              );
              if (missingRequired.length > 0 && inQuotes) {
                suggestions.push({
                  label: `⚠️ Missing required: ${missingRequired.join(", ")}`,
                  kind: monaco.languages.CompletionItemKind.Text,
                  insertText: "",
                  detail: `${missingRequired.length} required parameter(s) still needed`,
                  documentation: {
                    value: `**Missing Required Parameters:**\n\n${missingRequired
                      .map((req) => `• ${req}`)
                      .join(
                        "\n"
                      )}\n\nThese parameters must be added to make the field valid.`,
                    isTrusted: true,
                  },
                  sortText: "000_warning",
                  range: {
                    startLineNumber: position.lineNumber,
                    endLineNumber: position.lineNumber,
                    startColumn: position.column,
                    endColumn: position.column,
                  },
                });
              }
            }
          }

          // API actions suggestions
          if (
            linePrefix.includes("include_actions:") &&
            linePrefix.trim().endsWith("[")
          ) {
            apiActions.forEach((action) => {
              suggestions.push({
                label: action.label,
                kind: monaco.languages.CompletionItemKind.Method,
                insertText: action.label,
                detail: action.detail,
                documentation: action.documentation,
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endColumn: position.column,
                },
              });
            });
          }

          // Enhanced permissions suggestions with duplicate filtering
          if (
            linePrefix.includes("permissions:") ||
            (linePrefix.includes("-") &&
              textUntilPosition.includes("permissions:"))
          ) {
            // Parse existing permissions in the current permissions array
            const existingPermissions = new Set<string>();
            const lines = textUntilPosition.split("\n");
            let inPermissionsSection = false;

            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i].trim();

              if (line.includes("permissions:")) {
                inPermissionsSection = true;
                continue;
              }

              if (inPermissionsSection) {
                // Stop if we hit another section or different indentation level
                if (
                  line &&
                  !line.startsWith("-") &&
                  !line.startsWith('"') &&
                  line.includes(":")
                ) {
                  break;
                }

                // Extract permission from line like '- "rest_framework.permissions.AllowAny"'
                const permissionMatch = line.match(/["']([^"']+)["']/);
                if (permissionMatch) {
                  existingPermissions.add(permissionMatch[1]);
                }
              }
            }

            // Filter out already used permissions
            const availablePermissions = djangoPermissions.filter(
              (permission) => !existingPermissions.has(permission.label)
            );

            availablePermissions.forEach((permission) => {
              const usedPermissionsArray = Array.from(existingPermissions);
              const configuredInfo =
                usedPermissionsArray.length > 0
                  ? `\n\n✅ **Already configured:** ${usedPermissionsArray.join(
                      ", "
                    )}`
                  : "";

              suggestions.push({
                label: permission.label,
                kind: monaco.languages.CompletionItemKind.Reference,
                insertText: `"${permission.label}"`,
                detail: permission.detail,
                documentation: {
                  value: `**${permission.label}**\n\n${permission.detail}${configuredInfo}`,
                  isTrusted: true,
                },
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endColumn: position.column,
                },
              });
            });

            // Show summary if all permissions are used
            if (
              availablePermissions.length === 0 &&
              existingPermissions.size > 0
            ) {
              suggestions.push({
                label: "✅ All available permissions configured",
                kind: monaco.languages.CompletionItemKind.Text,
                insertText: "",
                detail: `${existingPermissions.size} permission(s) already configured`,
                documentation: {
                  value: `**Configured Permissions:**\n\n${Array.from(
                    existingPermissions
                  )
                    .map((perm) => `• ${perm}`)
                    .join("\n")}`,
                  isTrusted: true,
                },
                sortText: "000_info",
                range: {
                  startLineNumber: position.lineNumber,
                  endLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endColumn: position.column,
                },
              });
            }
          }

          // Schema structure suggestions based on context
          const indentLevel =
            (linePrefix.length - linePrefix.trimStart().length) / 2;

          if (indentLevel === 0 && linePrefix.trim() === "") {
            suggestions.push({
              label: "apps",
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: "apps:\n  - ",
              detail: "Root level apps definition",
              documentation: "Define Django applications in your project",
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column,
                endColumn: position.column,
              },
            });
          }

          // Model structure suggestions
          if (
            linePrefix.trim() === "- " &&
            textUntilPosition.includes("models:")
          ) {
            suggestions.push({
              label: "name",
              kind: monaco.languages.CompletionItemKind.Property,
              insertText: "name: ",
              detail: "Model name (required)",
              documentation: "Model name in PascalCase (e.g., ProductCategory)",
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column,
                endColumn: position.column,
              },
            });
          }

          // Enhanced field structure suggestions
          if (
            linePrefix.trim() === "- " &&
            textUntilPosition.includes("fields:")
          ) {
            suggestions.push({
              label: "field definition",
              kind: monaco.languages.CompletionItemKind.Snippet,
              insertText:
                'name: field_name\n${1:              }type: ${2:CharField}\n${1:              }options: "${3:max_length=255}"',
              detail: "Complete field definition",
              documentation:
                "Creates a complete field with name, type, and options",
              insertTextRules:
                monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
              range: {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column,
                endColumn: position.column,
              },
            });
          }

          return { suggestions };
        },
      });

      // Enhanced hover provider with field-specific information and configuration status
      monaco.languages.registerHoverProvider("yaml", {
        provideHover: (model, position) => {
          const word = model.getWordAtPosition(position);
          if (!word) return null;

          const textUntilPosition = model.getValueInRange({
            startLineNumber: 1,
            startColumn: 1,
            endLineNumber: position.lineNumber,
            endColumn: position.column,
          });

          // Helper function to parse existing options (same as in completion provider)
          const parseExistingOptions = (optionsString: string): Set<string> => {
            const existingOptions = new Set<string>();

            if (!optionsString) return existingOptions;

            const cleanOptions = optionsString
              .replace(/^["']|["']$/g, "")
              .trim();
            if (!cleanOptions) return existingOptions;

            const optionParts = cleanOptions.split(",");

            for (const part of optionParts) {
              const trimmedPart = part.trim();
              if (trimmedPart) {
                const equalIndex = trimmedPart.indexOf("=");
                if (equalIndex > 0) {
                  const paramName = trimmedPart.substring(0, equalIndex).trim();
                  existingOptions.add(paramName);
                }
              }
            }

            return existingOptions;
          };

          // Get current field context
          const getCurrentFieldContext = (textUntilPosition: string) => {
            const lines = textUntilPosition.split("\n");
            let currentFieldType = null;
            let existingOptions = new Set<string>();

            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i];

              const typeMatch = line.match(/type:\s*(\w+)/);
              if (typeMatch && !currentFieldType) {
                currentFieldType = typeMatch[1];
              }

              const optionsMatch = line.match(/options:\s*["']([^"']*)["']?/);
              if (optionsMatch && existingOptions.size === 0) {
                existingOptions = parseExistingOptions(optionsMatch[1]);
              }

              if (
                (line.includes("- name:") && i < lines.length - 1) ||
                line.includes("models:") ||
                line.includes("apps:")
              ) {
                break;
              }
            }

            return { currentFieldType, existingOptions };
          };

          // Enhanced model reference detection in hover provider
          if (
            word.word.includes(".") ||
            word.word.match(/^[A-Z][a-zA-Z0-9]*$/)
          ) {
            const availableModels = parseAvailableModels(model.getValue());

            // Check custom models first
            let modelInfo = availableModels.find(
              (m) =>
                m.fullReference === word.word ||
                m.name === word.word ||
                word.word.includes(m.name)
            );

            // If not found in custom models, check built-in models
            if (!modelInfo) {
              const builtInMatch = builtInModels.find(
                (b) =>
                  `${b.app}.${b.name}` === word.word ||
                  b.name === word.word ||
                  word.word.includes(b.name)
              );

              if (builtInMatch) {
                modelInfo = {
                  name: builtInMatch.name,
                  appName: builtInMatch.app,
                  fullReference: `${builtInMatch.app}.${builtInMatch.name}`,
                  verbose_name: builtInMatch.description,
                  fields: [],
                  category: builtInMatch.category,
                  isBuiltIn: true,
                };
              }
            }

            if (modelInfo) {
              const fieldsInfo = modelInfo.fields?.length
                ? `\n\n**Available Fields:** ${modelInfo.fields.join(", ")}`
                : "";
              const verboseInfo = modelInfo.verbose_name
                ? `\n**Description:** ${modelInfo.verbose_name}`
                : "";
              const categoryInfo = (modelInfo as any).category
                ? `\n**Category:** ${(modelInfo as any).category}`
                : "";
              const typeInfo = (modelInfo as any).isBuiltIn
                ? "\n**Type:** Django Built-in Model"
                : "\n**Type:** Custom Model";

              return {
                range: new monaco.Range(
                  position.lineNumber,
                  word.startColumn,
                  position.lineNumber,
                  word.endColumn
                ),
                contents: [
                  { value: `**${modelInfo.fullReference}** - Django Model` },
                  {
                    value: `**App:** ${modelInfo.appName}${typeInfo}${categoryInfo}`,
                  },
                  {
                    value: `**Model:** ${modelInfo.name}${verboseInfo}${fieldsInfo}`,
                  },
                ],
              };
            }
          }

          // Check if it's a field type
          const fieldInfo =
            djangoFieldOptions[word.word as keyof typeof djangoFieldOptions];
          if (fieldInfo) {
            const { existingOptions } =
              getCurrentFieldContext(textUntilPosition);
            const requiredParams = fieldInfo.required.join(", ") || "none";
            const availableOptions = fieldInfo.options.filter(
              (opt) => !existingOptions.has(opt.name)
            );
            const configuredOptions = fieldInfo.options.filter((opt) =>
              existingOptions.has(opt.name)
            );

            const configuredInfo =
              configuredOptions.length > 0
                ? `\n\n✅ **Configured:** ${configuredOptions
                    .map((opt) => opt.name)
                    .join(", ")}`
                : "";

            const availableInfo =
              availableOptions.length > 0
                ? `\n\n🔧 **Available:** ${availableOptions
                    .map((opt) => opt.name)
                    .join(", ")}`
                : "\n\n✅ **All options configured**";

            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [
                { value: `**${word.word}** - Django Field Type` },
                { value: `**Required parameters:** ${requiredParams}` },
                {
                  value: `💡 Use autocompletion in the options field for parameter suggestions${configuredInfo}${availableInfo}`,
                },
              ],
            };
          }

          // Check if it's a permission
          const permission = djangoPermissions.find((p) =>
            p.label.includes(word.word)
          );
          if (permission) {
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [
                { value: `**${permission.label}**` },
                { value: permission.detail },
              ],
            };
          }

          // Check if it's an on_delete option
          const onDeleteOption = onDeleteOptions.find((opt) =>
            opt.name.includes(word.word)
          );
          if (onDeleteOption) {
            return {
              range: new monaco.Range(
                position.lineNumber,
                word.startColumn,
                position.lineNumber,
                word.endColumn
              ),
              contents: [
                { value: `**${onDeleteOption.name}**` },
                { value: onDeleteOption.description },
              ],
            };
          }

          return null;
        },
      });

      // Code actions provider for quick fixes
      monaco.languages.registerCodeActionProvider("yaml", {
        provideCodeActions: (model, range, context) => {
          const actions: any[] = [];

          context.markers.forEach((marker) => {
            if (marker.message.includes("Missing required property")) {
              const property = marker.message.match(
                /Missing required property: (\w+)/
              )?.[1];
              if (property) {
                actions.push({
                  title: `Add required property: ${property}`,
                  kind: "quickfix",
                  edit: {
                    edits: [
                      {
                        resource: model.uri,
                        edit: {
                          range: new monaco.Range(
                            marker.startLineNumber,
                            marker.endColumn,
                            marker.startLineNumber,
                            marker.endColumn
                          ),
                          text: `\n${" ".repeat(
                            marker.startColumn - 1
                          )}${property}: `,
                        },
                      },
                    ],
                  },
                });
              }
            }

            // Quick fix for missing field options
            if (marker.message.includes("requires options")) {
              const fieldTypeMatch = marker.message.match(/(\w+) field/);
              if (fieldTypeMatch) {
                const fieldType = fieldTypeMatch[1];
                const fieldInfo =
                  djangoFieldOptions[
                    fieldType as keyof typeof djangoFieldOptions
                  ];
                if (fieldInfo && fieldInfo.required.length > 0) {
                  const requiredOptions = fieldInfo.required
                    .map((param) => `${param}=`)
                    .join(", ");
                  actions.push({
                    title: `Add required options for ${fieldType}`,
                    kind: "quickfix",
                    edit: {
                      edits: [
                        {
                          resource: model.uri,
                          edit: {
                            range: new monaco.Range(
                              marker.startLineNumber,
                              marker.endColumn,
                              marker.startLineNumber,
                              marker.endColumn
                            ),
                            text: `\n${" ".repeat(
                              marker.startColumn - 1
                            )}options: "${requiredOptions}"`,
                          },
                        },
                      ],
                    },
                  });
                }
              }
            }
          });

          return {
            actions,
            dispose: () => {},
          };
        },
      });
    },
    [parseAvailableModels]
  );

  // File operations
  const handleSave = () => {
    const blob = new Blob([yamlContent], { type: "text/yaml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleLoad = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setYamlContent(content);
        setFileName(file.name);
      };
      reader.readAsText(file);
    }
  };

  const handleFormatDocument = () => {
    if (editorInstance) {
      editorInstance.getAction("editor.action.formatDocument")?.run();
    }
  };

  const handleFind = () => {
    if (editorInstance) {
      editorInstance.getAction("actions.find")?.run();
    }
  };

  const errorCount = validationErrors.filter(
    (e) => e.severity === "error"
  ).length;
  const warningCount = validationErrors.filter(
    (e) => e.severity === "warning"
  ).length;
  const infoCount = validationErrors.filter(
    (e) => e.severity === "info"
  ).length;

  const getValidationSummary = () => {
    if (!strictValidation) return "Schema validation disabled";
    if (validationErrors.length === 0) return "Schema is valid";
    return `${errorCount} errors, ${warningCount} warnings, ${infoCount} info`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto p-4 space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Django Gen YAML Descriptor
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                YAML Editor for the
                <a
                  href="https://github.com/joegsuero/django-generator"
                  target="blank"
                  className="text-blue-600 hover:text-gray-400 transition-colors:duration-300"
                >
                  {" "}
                  Django Gen Package{" "}
                </a>
                for generate your API faster
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={errorCount === 0 ? "default" : "destructive"}>
                {errorCount === 0 ? (
                  <>
                    <CheckCircle className="h-3 w-3 mr-1" /> Valid
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3 mr-1" /> {errorCount} Errors
                  </>
                )}
              </Badge>
              {warningCount > 0 && (
                <Badge variant="secondary">{warningCount} Warnings</Badge>
              )}
              {infoCount > 0 && (
                <Badge variant="outline">{infoCount} Info</Badge>
              )}
            </div>
          </div>
          {strictValidation && validationProgress < 100 && (
            <Progress value={validationProgress} className="w-full mt-2" />
          )}
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="editor" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="editor">Editor</TabsTrigger>
              {/* <TabsTrigger value="validation">
                Validation
                {validationErrors.length > 0 && (
                  <Badge variant="secondary" className="ml-1 text-xs">
                    {validationErrors.length}
                  </Badge>
                )}
              </TabsTrigger> */}
              <TabsTrigger value="templates">Templates</TabsTrigger>
              {/* <TabsTrigger value="schema">Schema</TabsTrigger> */}
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="help">Help</TabsTrigger>
            </TabsList>

            <TabsContent value="editor" className="space-y-4">
              {/* File Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <Label htmlFor="filename">File:</Label>
                  <Input
                    id="filename"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                    className="w-48"
                  />
                </div>
                <Button onClick={handleSave} size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save
                </Button>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  size="sm"
                  variant="outline"
                  className="gap-2"
                >
                  <Upload className="h-4 w-4" />
                  Load
                </Button>
                {/* <Button
                  onClick={handleFormatDocument}
                  size="sm"
                  variant="outline"
                  className="gap-2 bg-transparent"
                >
                  <Palette className="h-4 w-4" />
                  Format
                </Button> */}
                <Button
                  onClick={handleFind}
                  size="sm"
                  variant="outline"
                  className="gap-2 bg-transparent"
                >
                  <Search className="h-4 w-4" />
                  Find
                </Button>
                {/* <div className="flex items-center gap-2 ml-auto">
                  <Shield className="h-4 w-4" />
                  <Label htmlFor="strict-validation" className="text-sm">
                    Strict Validation
                  </Label>
                  <Switch
                    id="strict-validation"
                    checked={strictValidation}
                    onCheckedChange={setStrictValidation}
                  />
                </div> */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".yaml,.yml"
                  onChange={handleLoad}
                  className="hidden"
                />
              </div>

              {/* Validation Summary */}
              {/* <Alert
                className={
                  errorCount > 0
                    ? "border-red-200"
                    : warningCount > 0
                    ? "border-yellow-200"
                    : "border-green-200"
                }
              >
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  <strong>Schema Validation:</strong> {getValidationSummary()}
                </AlertDescription>
              </Alert> */}

              {/* Monaco Editor */}
              <div className="border rounded-lg overflow-hidden">
                <MonacoEditor
                  editorTheme={editorTheme}
                  fontSize={fontSize}
                  handleEditorDidMount={handleEditorDidMount}
                  minimap={minimap}
                  setYamlContent={setYamlContent}
                  wordWrap={wordWrap}
                  yamlContent={yamlContent}
                />
              </div>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <TemplatesTabContent setYamlContent={setYamlContent} />
            </TabsContent>
            <TabsContent value="validation" className="space-y-4">
              <ValidationTabContent
                editorInstance={editorInstance}
                errorCount={errorCount}
                infoCount={infoCount}
                strictValidation={strictValidation}
                validationErrors={validationErrors}
                warningCount={warningCount}
              />
            </TabsContent>
            <TabsContent value="schema" className="space-y-4">
              <SchemaTabContent
                yamlContent={yamlContent}
                parseAvailableModels={parseAvailableModels}
              />
            </TabsContent>
            <TabsContent value="settings" className="space-y-4">
              <SettingsTabContent
                editorTheme={editorTheme}
                fontSize={fontSize}
                minimap={minimap}
                setEditorTheme={setEditorTheme}
                setFontSize={setFontSize}
                setMinimap={setMinimap}
                setWordWrap={setWordWrap}
                wordWrap={wordWrap}
              />
            </TabsContent>

            <TabsContent value="help" className="space-y-4">
              <HelpTabContent />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
