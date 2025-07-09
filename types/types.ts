export interface ModelInfo {
  name: string;
  appName: string;
  fullReference: string;
  verbose_name?: string;
  fields?: string[];
  category?: string;
  isBuiltIn?: boolean;
}

export interface Option {
  name: string;
  type: string;
  description: string;
  example: string;
}

export interface FieldConfiguration {
  required: string[];
  options: Option[];
}

export interface Template {
  name: string;
  description: string;
  yaml: string;
}
