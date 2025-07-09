export const apiActions = [
  {
    label: "list",
    detail: "GET /resource/",
    documentation: "List all instances",
  },
  {
    label: "retrieve",
    detail: "GET /resource/{id}/",
    documentation: "Get a specific instance",
  },
  {
    label: "create",
    detail: "POST /resource/",
    documentation: "Create a new instance",
  },
  {
    label: "update",
    detail: "PUT /resource/{id}/",
    documentation: "Update an instance",
  },
  {
    label: "partial_update",
    detail: "PATCH /resource/{id}/",
    documentation: "Partially update an instance",
  },
  {
    label: "destroy",
    detail: "DELETE /resource/{id}/",
    documentation: "Delete an instance",
  },
];
