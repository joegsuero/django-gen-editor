export const djangoPermissions = [
  {
    label: "rest_framework.permissions.AllowAny",
    detail: "Allow unrestricted access to any user",
  },
  {
    label: "rest_framework.permissions.IsAuthenticated",
    detail: "Allow access only to authenticated users",
  },
  {
    label: "rest_framework.permissions.IsAdminUser",
    detail: "Allow access only to admin users (is_staff=True)",
  },
  {
    label: "rest_framework.permissions.IsAuthenticatedOrReadOnly",
    detail:
      "Allow read-only access to anonymous users, full access to authenticated users",
  },
  {
    label: "rest_framework.permissions.DjangoModelPermissions",
    detail: "Use Django's built-in model permissions",
  },
  {
    label: "rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly",
    detail: "Django model permissions with anonymous read-only access",
  },
  {
    label: "rest_framework.permissions.DjangoObjectPermissions",
    detail: "Use Django Guardian object-level permissions",
  },
];
