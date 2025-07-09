import Ajv from "ajv";
import addFormats from "ajv-formats";
import {
  djangoJsonSchema,
  fieldTypeValidations,
} from "../schema/django-schema";

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning" | "info";
  code: string;
  suggestion?: string;
}

export class YAMLValidator {
  private ajv: Ajv;

  constructor() {
    this.ajv = new Ajv({
      allErrors: true,
      verbose: true,
      strict: false,
      validateFormats: true,
    });
    addFormats(this.ajv);
  }

  // Convert YAML string to JSON for validation
  private yamlToJson(yamlContent: string): {
    data: any;
    errors: ValidationError[];
  } {
    const errors: ValidationError[] = [];

    try {
      // Simple YAML to JSON conversion
      const lines = yamlContent.split("\n");
      const result = this.parseYAMLLines(lines);
      return { data: result, errors };
    } catch (error) {
      errors.push({
        line: 1,
        column: 1,
        message: `YAML parsing error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        severity: "error",
        code: "YAML_PARSE_ERROR",
      });
      return { data: null, errors };
    }
  }

  private parseYAMLLines(lines: string[]): any {
    const result: any = {};
    const stack: Array<{ obj: any; indent: number }> = [
      { obj: result, indent: -1 },
    ];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#")) continue;

      const indent = line.length - line.trimStart().length;
      const current = stack[stack.length - 1];

      // Handle indentation changes
      while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
        stack.pop();
      }

      const parent = stack[stack.length - 1].obj;

      if (trimmed.startsWith("- ")) {
        // Array item
        const content = trimmed.substring(2).trim();
        if (!Array.isArray(parent)) {
          throw new Error(`Expected array at line ${i + 1}`);
        }

        if (content.includes(":")) {
          // Object in array
          const obj = {};
          parent.push(obj);
          stack.push({ obj, indent });
          this.parseKeyValue(content, obj, i + 1);
        } else {
          // Simple array item
          parent.push(content);
        }
      } else if (trimmed.includes(":")) {
        // Key-value pair
        this.parseKeyValue(trimmed, parent, i + 1);

        // Check if this creates a new object/array
        const [key, value] = trimmed.split(":", 2);
        const cleanKey = key.trim();
        const cleanValue = value?.trim();

        if (!cleanValue || cleanValue === "") {
          // This key will have nested content
          if (!parent[cleanKey]) {
            parent[cleanKey] = {};
          }
          stack.push({ obj: parent[cleanKey], indent });
        }
      }
    }

    return result;
  }

  private parseKeyValue(content: string, parent: any, lineNumber: number) {
    const colonIndex = content.indexOf(":");
    if (colonIndex === -1) return;

    const key = content.substring(0, colonIndex).trim();
    const value = content.substring(colonIndex + 1).trim();

    if (value === "" || value === null) {
      // Will be filled by nested content
      if (!parent[key]) {
        parent[key] = {};
      }
    } else if (value.startsWith("[") && value.endsWith("]")) {
      // Inline array
      try {
        parent[key] = JSON.parse(value);
      } catch {
        parent[key] = value
          .slice(1, -1)
          .split(",")
          .map((s) => s.trim().replace(/^["']|["']$/g, ""));
      }
    } else if (value.startsWith('"') && value.endsWith('"')) {
      // Quoted string
      parent[key] = value.slice(1, -1);
    } else if (value === "true" || value === "false") {
      // Boolean
      parent[key] = value === "true";
    } else if (!isNaN(Number(value))) {
      // Number
      parent[key] = Number(value);
    } else {
      // String
      parent[key] = value;
    }
  }

  // Validate against JSON Schema
  validateSchema(yamlContent: string): ValidationError[] {
    const { data, errors } = this.yamlToJson(yamlContent);

    if (errors.length > 0) {
      return errors;
    }

    const validate = this.ajv.compile(djangoJsonSchema);
    const valid = validate(data);

    if (!valid && validate.errors) {
      const schemaErrors = validate.errors.map((error) =>
        this.convertAjvError(error, yamlContent)
      );
      return [...errors, ...schemaErrors];
    }

    // Additional Django-specific validations
    const djangoErrors = this.validateDjangoSpecifics(data, yamlContent);

    return [...errors, ...djangoErrors];
  }

  private convertAjvError(error: any, yamlContent: string): ValidationError {
    const lines = yamlContent.split("\n");
    let line = 1;
    const column = 1;

    // Try to find the line number based on the instance path
    if (error.instancePath) {
      const path = error.instancePath.split("/").filter(Boolean);
      line = this.findLineForPath(path, lines);
    }

    let message = error.message || "Validation error";
    let suggestion = "";

    // Enhance error messages with suggestions
    switch (error.keyword) {
      case "required":
        message = `Missing required property: ${error.params.missingProperty}`;
        suggestion = `Add the required property "${error.params.missingProperty}"`;
        break;
      case "enum":
        message = `Invalid value. Expected one of: ${error.params.allowedValues.join(
          ", "
        )}`;
        suggestion = `Use one of the allowed values: ${error.params.allowedValues.join(
          ", "
        )}`;
        break;
      case "pattern":
        if (error.instancePath.includes("name")) {
          message =
            'Model names must be in PascalCase (e.g., "ProductCategory")';
          suggestion = "Use PascalCase for model names";
        } else if (error.instancePath.includes("fields")) {
          message = 'Field names must be in snake_case (e.g., "created_at")';
          suggestion = "Use snake_case for field names";
        }
        break;
      case "minItems":
        message = `Array must have at least ${error.params.limit} items`;
        suggestion = `Add at least ${error.params.limit} items to the array`;
        break;
    }

    return {
      line,
      column,
      message,
      severity: "error",
      code: error.keyword.toUpperCase(),
      suggestion,
    };
  }

  private findLineForPath(path: string[], lines: string[]): number {
    let currentLine = 1;
    const currentPath: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line || line.startsWith("#")) continue;

      if (line.includes(":")) {
        const key = line.split(":")[0].trim().replace(/^- /, "");

        // Simple path matching - this could be more sophisticated
        if (path.includes(key)) {
          currentLine = i + 1;
        }
      }
    }

    return currentLine;
  }

  private validateDjangoSpecifics(
    data: any,
    yamlContent: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!data.apps || !Array.isArray(data.apps)) {
      return errors;
    }

    data.apps.forEach((app: any, appIndex: number) => {
      Object.keys(app).forEach((appName) => {
        const appConfig = app[appName];
        if (!Array.isArray(appConfig)) return;

        appConfig.forEach((config: any) => {
          if (config.models && Array.isArray(config.models)) {
            config.models.forEach((model: any, modelIndex: number) => {
              // Validate model fields
              if (model.fields && Array.isArray(model.fields)) {
                model.fields.forEach((field: any, fieldIndex: number) => {
                  const fieldErrors = this.validateField(
                    field,
                    appName,
                    model.name,
                    fieldIndex
                  );
                  errors.push(...fieldErrors);
                });
              }

              // Validate API configuration
              if (model.api) {
                const apiErrors = this.validateApiConfig(model.api, model.name);
                errors.push(...apiErrors);
              }

              // Validate manager methods
              if (model.manager && model.manager.methods) {
                const managerErrors = this.validateManagerMethods(
                  model.manager.methods,
                  model.name
                );
                errors.push(...managerErrors);
              }
            });
          }
        });
      });
    });

    return errors;
  }

  private validateField(
    field: any,
    appName: string,
    modelName: string,
    fieldIndex: number
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!field.type || !field.name) {
      return errors;
    }

    const fieldValidation =
      fieldTypeValidations[field.type as keyof typeof fieldTypeValidations];
    if (!fieldValidation) {
      return errors;
    }

    // Check required parameters
    if (field.options) {
      fieldValidation.required.forEach((requiredParam) => {
        if (!field.options.includes(requiredParam)) {
          errors.push({
            line: fieldIndex + 1, // Approximate line number
            column: 1,
            message: `${field.type} field '${field.name}' is missing required parameter: ${requiredParam}`,
            severity: "error",
            code: "MISSING_REQUIRED_PARAM",
            suggestion: `Add ${requiredParam} parameter to the field options`,
          });
        }
      });
    } else if (fieldValidation.required.length > 0) {
      errors.push({
        line: fieldIndex + 1,
        column: 1,
        message: `${field.type} field '${
          field.name
        }' requires options: ${fieldValidation.required.join(", ")}`,
        severity: "error",
        code: "MISSING_FIELD_OPTIONS",
        suggestion: `Add options parameter with: ${fieldValidation.required.join(
          ", "
        )}`,
      });
    }

    // Validate ForeignKey relationships
    if (field.type === "ForeignKey" && field.options) {
      if (!field.options.includes("on_delete")) {
        errors.push({
          line: fieldIndex + 1,
          column: 1,
          message: `ForeignKey field '${field.name}' must specify on_delete behavior`,
          severity: "error",
          code: "MISSING_ON_DELETE",
          suggestion:
            "Add on_delete parameter (e.g., 'on_delete=models.CASCADE')",
        });
      }
    }

    return errors;
  }

  private validateApiConfig(api: any, modelName: string): ValidationError[] {
    const errors: ValidationError[] = [];

    // Validate serializer fields reference existing model fields
    if (
      api.serializer &&
      api.serializer.fields &&
      Array.isArray(api.serializer.fields)
    ) {
      // This would require cross-referencing with model fields
      // Implementation depends on having access to the full model structure
    }

    // Validate permission classes
    if (api.permissions && Array.isArray(api.permissions)) {
      api.permissions.forEach((permission: string) => {
        if (!permission.startsWith("rest_framework.permissions.")) {
          errors.push({
            line: 1, // Would need better line tracking
            column: 1,
            message: `Invalid permission class: ${permission}`,
            severity: "warning",
            code: "INVALID_PERMISSION",
            suggestion: "Use a valid Django REST framework permission class",
          });
        }
      });
    }

    return errors;
  }

  private validateManagerMethods(
    methods: any[],
    modelName: string
  ): ValidationError[] {
    const errors: ValidationError[] = [];

    methods.forEach((method: any, index: number) => {
      if (!method.query_fragment || !method.query_fragment.startsWith(".")) {
        errors.push({
          line: index + 1,
          column: 1,
          message: `Manager method '${method.name}' query_fragment must start with '.'`,
          severity: "error",
          code: "INVALID_QUERY_FRAGMENT",
          suggestion: "Start query_fragment with a dot (e.g., '.filter(...)')",
        });
      }

      // Validate QuerySet method names
      const validMethods = [
        "filter",
        "exclude",
        "annotate",
        "aggregate",
        "order_by",
        "distinct",
        "all",
        "get",
        "first",
        "last",
        "count",
        "exists",
      ];
      const methodMatch = method.query_fragment.match(/^\.(\w+)/);
      if (methodMatch && !validMethods.includes(methodMatch[1])) {
        errors.push({
          line: index + 1,
          column: 1,
          message: `Unknown QuerySet method: ${methodMatch[1]}`,
          severity: "warning",
          code: "UNKNOWN_QUERYSET_METHOD",
          suggestion: `Use a valid QuerySet method: ${validMethods.join(", ")}`,
        });
      }
    });

    return errors;
  }
}
