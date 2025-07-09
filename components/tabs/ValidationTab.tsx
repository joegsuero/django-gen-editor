import React from "react";
// Asumiendo que estos componentes provienen de shadcn/ui o una librería similar.
// Asegúrate de que las rutas de importación sean correctas para tu proyecto.
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert"; // Asumiendo que Alert y AlertDescription son de shadcn/ui
import { Badge } from "@/components/ui/badge"; // Asumiendo que Badge es de shadcn/ui
import {
  Info,
  CheckCircle,
  AlertCircle,
  Lightbulb,
  Shield,
} from "lucide-react"; // Iconos de lucide-react

// Definición de la interfaz para un mensaje de validación
interface ValidationMessage {
  severity: "error" | "warning" | "info";
  line: number;
  column: number;
  code: string;
  message: string;
  suggestion?: string;
}

// Interfaz para las props del componente ValidationTabContent
interface ValidationTabContentProps {
  strictValidation: boolean;
  validationErrors: ValidationMessage[];
  errorCount: number;
  warningCount: number;
  infoCount: number;
  editorInstance: any | null; // El tipo real de Monaco Editor instance
}

const ValidationTabContent = ({
  strictValidation,
  validationErrors,
  errorCount,
  warningCount,
  infoCount,
  editorInstance,
}: ValidationTabContentProps) => {
  return (
    <div style={{ height: "75vh" }} className="space-y-4">
      {/* Mensaje de resumen de validación */}
      {!strictValidation ? (
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Schema validation is disabled. Enable it in the editor controls for
            detailed validation.
          </AlertDescription>
        </Alert>
      ) : validationErrors.length === 0 ? (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Your YAML schema is valid! All Django schema requirements are met.
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant={errorCount > 0 ? "destructive" : "default"}>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Found {errorCount} errors, {warningCount} warnings, and {infoCount}{" "}
            informational messages.
          </AlertDescription>
        </Alert>
      )}

      {/* Área de desplazamiento para los detalles de validación */}
      <ScrollArea className="h-96 border rounded-lg p-4">
        {validationErrors.length > 0 ? (
          <div className="space-y-3">
            {validationErrors.map((error, index) => (
              <div
                key={index}
                className={`p-3 rounded-lg border-l-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 ${
                  error.severity === "error"
                    ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                    : error.severity === "warning"
                    ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"
                    : "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
                }`}
                onClick={() => {
                  if (editorInstance) {
                    editorInstance.setPosition({
                      lineNumber: error.line,
                      column: error.column,
                    });
                    editorInstance.focus();
                  }
                }}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        error.severity === "error"
                          ? "destructive"
                          : error.severity === "warning"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      Line {error.line}:{error.column}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {error.code}
                    </Badge>
                    <span className="text-sm font-medium">{error.message}</span>
                  </div>
                  {error.suggestion && (
                    <div className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Lightbulb className="h-3 w-3 mt-0.5 flex-shrink-0" />
                      <span>{error.suggestion}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : strictValidation ? (
          <div className="text-center text-muted-foreground">
            <CheckCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No validation issues found. Your schema is valid!</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <Shield className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>
              Enable strict validation to see detailed schema validation
              results.
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default ValidationTabContent;
