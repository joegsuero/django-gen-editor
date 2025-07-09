import React from "react";
import { Separator } from "@/components/ui/separator";

interface HelpTabContentProps {}

const HelpTabContent = ({}: HelpTabContentProps) => {
  return (
    <div style={{ height: "75vh" }} className="space-y-4">
      <div>
        <h3 className="font-semibold">YAML Schema Structure</h3>
        <p>
          The YAML schema defines your Django backend structure, including apps,
          models, fields, and API configurations.
        </p>
        <ul className="list-disc pl-5">
          <li>
            <strong>apps:</strong> Root element containing a list of Django
            applications.
          </li>
          <li>
            <strong>models:</strong> Within each app, define your models with
            fields and options.
          </li>
          <li>
            <strong>fields:</strong> Specify field names, types, and
            Django-specific options.
          </li>
          <li>
            <strong>api:</strong> Configure API endpoints, serializers, and
            permissions for each model.
          </li>
        </ul>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold">Validation and Autocompletion</h3>
        <p>
          This editor provides real-time validation against a JSON schema,
          ensuring your YAML is correctly formatted and adheres to Django
          conventions.
        </p>
        <ul className="list-disc pl-5">
          <li>
            <strong>Real-time Validation:</strong> As you type, the editor
            checks for errors and warnings.
          </li>
          <li>
            <strong>Autocompletion:</strong> Press Ctrl+Space for context-aware
            suggestions.
          </li>
          <li>
            <strong>Hover Information:</strong> Hover over keywords for detailed
            documentation.
          </li>
        </ul>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold">File Operations</h3>
        <p>
          You can save your schema to a YAML file and load existing schemas from
          your local machine.
        </p>
        <ul className="list-disc pl-5">
          <li>
            <strong>Save:</strong> Click the "Save" button to download your
            schema as a YAML file.
          </li>
          <li>
            <strong>Load:</strong> Click the "Load" button to upload a YAML file
            from your computer.
          </li>
        </ul>
      </div>

      <Separator />

      <div>
        <h3 className="font-semibold">Strict Validation</h3>
        <p>
          Enable strict validation to enforce all schema rules. Disabling it may
          allow for more flexible configurations but could lead to runtime
          errors.
        </p>
      </div>
    </div>
  );
};

export default HelpTabContent;
