export const djangoFieldTypes = [
  {
    label: "CharField",
    detail: "A string field with max_length",
    documentation:
      "For small to medium-sized strings. Requires max_length parameter.",
  },
  {
    label: "TextField",
    detail: "A large text field",
    documentation: "For large amounts of text. No length limit.",
  },
  {
    label: "IntegerField",
    detail: "An integer field",
    documentation: "For integer numbers (-2147483648 to 2147483647)",
  },
  {
    label: "DecimalField",
    detail: "A decimal number field",
    documentation:
      "For precise decimal numbers. Requires max_digits and decimal_places.",
  },
  {
    label: "DateTimeField",
    detail: "A date and time field",
    documentation:
      "For storing date and time. Supports auto_now and auto_now_add.",
  },
  {
    label: "DateField",
    detail: "A date field",
    documentation: "For storing dates only",
  },
  {
    label: "EmailField",
    detail: "An email address field",
    documentation: "CharField with email validation",
  },
  {
    label: "ForeignKey",
    detail: "A foreign key relationship",
    documentation:
      "Many-to-one relationship. Requires 'to' and 'on_delete' parameters.",
  },
  {
    label: "ImageField",
    detail: "An image upload field",
    documentation: "For uploading images. Requires Pillow library.",
  },
  {
    label: "BooleanField",
    detail: "A boolean field",
    documentation: "True/False values",
  },
  {
    label: "URLField",
    detail: "A URL field",
    documentation: "CharField with URL validation",
  },
  {
    label: "SlugField",
    detail: "A slug field",
    documentation: "For URL-friendly strings",
  },
  {
    label: "UUIDField",
    detail: "A UUID field",
    documentation: "For storing UUIDs",
  },
  {
    label: "JSONField",
    detail: "A JSON field",
    documentation: "For storing JSON data (PostgreSQL, MySQL 5.7+)",
  },
];
