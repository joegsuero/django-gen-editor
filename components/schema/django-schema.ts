export const djangoJsonSchema = {
  $schema: "http://json-schema.org/draft-07/schema#",
  title: "Django Backend Schema",
  description: "Schema for Django backend application definition",
  type: "object",
  required: ["apps"],
  properties: {
    description: {
      type: "string",
      description: "Optional description of the schema",
    },
    version: {
      type: "string",
      pattern: "^\\d+\\.\\d+\\.\\d+$",
      description: "Schema version in semver format",
    },
    apps: {
      type: "array",
      description: "List of Django applications",
      minItems: 1,
      items: {
        type: "object",
        patternProperties: {
          "^[a-zA-Z_][a-zA-Z0-9_]*$": {
            type: "array",
            items: {
              type: "object",
              properties: {
                models: {
                  type: "array",
                  description: "Django models definition",
                  items: {
                    type: "object",
                    required: ["name"],
                    properties: {
                      name: {
                        type: "string",
                        pattern: "^[A-Z][a-zA-Z0-9]*$",
                        description: "Model name in PascalCase",
                      },
                      verbose_name: {
                        type: "string",
                        description: "Human-readable singular name",
                      },
                      verbose_name_plural: {
                        type: "string",
                        description: "Human-readable plural name",
                      },
                      abstract: {
                        type: "boolean",
                        description: "Whether this is an abstract model",
                      },
                      db_table: {
                        type: "string",
                        description: "Custom database table name",
                      },
                      ordering: {
                        type: "array",
                        items: { type: "string" },
                        description: "Default ordering for the model",
                      },
                      fields: {
                        type: "array",
                        description: "Model fields",
                        minItems: 1,
                        items: {
                          type: "object",
                          required: ["name", "type"],
                          properties: {
                            name: {
                              type: "string",
                              pattern: "^[a-z][a-z0-9_]*$",
                              description: "Field name in snake_case",
                            },
                            type: {
                              type: "string",
                              enum: [
                                "CharField",
                                "TextField",
                                "IntegerField",
                                "BigIntegerField",
                                "SmallIntegerField",
                                "PositiveIntegerField",
                                "PositiveSmallIntegerField",
                                "DecimalField",
                                "FloatField",
                                "DateTimeField",
                                "DateField",
                                "TimeField",
                                "DurationField",
                                "EmailField",
                                "URLField",
                                "SlugField",
                                "UUIDField",
                                "BooleanField",
                                "NullBooleanField",
                                "JSONField",
                                "BinaryField",
                                "ImageField",
                                "FileField",
                                "ForeignKey",
                                "OneToOneField",
                                "ManyToManyField",
                              ],
                              description: "Django field type",
                            },
                            options: {
                              type: "string",
                              description: "Field options as Django code string",
                            },
                            help_text: {
                              type: "string",
                              description: "Help text for the field",
                            },
                          },
                          allOf: [
                            {
                              if: {
                                properties: { type: { const: "CharField" } },
                              },
                              then: {
                                properties: {
                                  options: {
                                    pattern: ".*max_length\\s*=\\s*\\d+.*",
                                    description: "CharField requires max_length parameter",
                                  },
                                },
                              },
                            },
                            {
                              if: {
                                properties: { type: { const: "DecimalField" } },
                              },
                              then: {
                                properties: {
                                  options: {
                                    pattern: ".*max_digits\\s*=\\s*\\d+.*decimal_places\\s*=\\s*\\d+.*",
                                    description: "DecimalField requires max_digits and decimal_places",
                                  },
                                },
                              },
                            },
                            {
                              if: {
                                properties: { type: { enum: ["ForeignKey", "OneToOneField"] } },
                              },
                              then: {
                                properties: {
                                  options: {
                                    pattern: ".*to\\s*=\\s*['\"][^'\"]+['\"].*on_delete\\s*=\\s*models\\.[A-Z_]+.*",
                                    description: "Relationship fields require 'to' and 'on_delete' parameters",
                                  },
                                },
                              },
                            },
                          ],
                        },
                      },
                      manager: {
                        type: "object",
                        description: "Custom manager definition",
                        properties: {
                          base_manager: {
                            type: "string",
                            default: "models.Manager",
                            description: "Base manager class",
                          },
                          methods: {
                            type: "array",
                            description: "Custom manager methods",
                            items: {
                              type: "object",
                              required: ["name", "query_fragment"],
                              properties: {
                                name: {
                                  type: "string",
                                  pattern: "^[a-z][a-z0-9_]*$",
                                  description: "Method name in snake_case",
                                },
                                args: {
                                  type: "array",
                                  items: { type: "string" },
                                  description: "Method arguments",
                                },
                                query_fragment: {
                                  type: "string",
                                  pattern:
                                    "^\\.(filter|exclude|annotate|aggregate|order_by|distinct|all|get|first|last|count|exists).*",
                                  description: "QuerySet method chain starting with .",
                                },
                                requires_q: {
                                  type: "boolean",
                                  description: "Whether method requires Q objects import",
                                },
                                description: {
                                  type: "string",
                                  description: "Method documentation",
                                },
                              },
                            },
                          },
                        },
                      },
                      api: {
                        type: "object",
                        description: "REST API configuration",
                        properties: {
                          include_actions: {
                            oneOf: [
                              {
                                type: "string",
                                enum: ["__all__"],
                                description: "Include all CRUD actions",
                              },
                              {
                                type: "array",
                                items: {
                                  type: "string",
                                  enum: ["list", "retrieve", "create", "update", "partial_update", "destroy"],
                                },
                                uniqueItems: true,
                                description: "Specific actions to include",
                              },
                            ],
                          },
                          serializer: {
                            type: "object",
                            description: "Serializer configuration",
                            properties: {
                              fields: {
                                oneOf: [
                                  {
                                    type: "string",
                                    enum: ["all", "__all__"],
                                  },
                                  {
                                    type: "array",
                                    items: { type: "string" },
                                    uniqueItems: true,
                                  },
                                ],
                                description: "Fields to include in serializer",
                              },
                              read_only_fields: {
                                type: "array",
                                items: { type: "string" },
                                uniqueItems: true,
                                description: "Read-only fields",
                              },
                              write_only_fields: {
                                type: "array",
                                items: { type: "string" },
                                uniqueItems: true,
                                description: "Write-only fields",
                              },
                              extra_kwargs: {
                                type: "object",
                                description: "Extra field configurations",
                              },
                            },
                          },
                          permissions: {
                            type: "array",
                            items: {
                              type: "string",
                              enum: [
                                "rest_framework.permissions.AllowAny",
                                "rest_framework.permissions.IsAuthenticated",
                                "rest_framework.permissions.IsAdminUser",
                                "rest_framework.permissions.IsAuthenticatedOrReadOnly",
                                "rest_framework.permissions.DjangoModelPermissions",
                                "rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly",
                                "rest_framework.permissions.DjangoObjectPermissions",
                              ],
                            },
                            uniqueItems: true,
                            description: "Permission classes",
                          },
                          authentication: {
                            type: "array",
                            items: {
                              type: "string",
                              enum: [
                                "rest_framework.authentication.BasicAuthentication",
                                "rest_framework.authentication.SessionAuthentication",
                                "rest_framework.authentication.TokenAuthentication",
                                "rest_framework_simplejwt.authentication.JWTAuthentication",
                                "rest_framework.authentication.RemoteUserAuthentication",
                              ],
                            },
                            uniqueItems: true,
                            description: "Authentication classes",
                          },
                          filterset: {
                            type: "object",
                            description: "Django Filter configuration",
                            properties: {
                              fields: {
                                oneOf: [
                                  {
                                    type: "array",
                                    items: { type: "string" },
                                    uniqueItems: true,
                                  },
                                  {
                                    type: "object",
                                    patternProperties: {
                                      "^[a-z][a-z0-9_]*$": {
                                        type: "array",
                                        items: {
                                          type: "string",
                                          enum: [
                                            "exact",
                                            "iexact",
                                            "contains",
                                            "icontains",
                                            "in",
                                            "gt",
                                            "gte",
                                            "lt",
                                            "lte",
                                            "startswith",
                                            "istartswith",
                                            "endswith",
                                            "iendswith",
                                            "range",
                                            "date",
                                            "year",
                                            "month",
                                            "day",
                                            "week",
                                            "week_day",
                                            "time",
                                            "hour",
                                            "minute",
                                            "second",
                                            "isnull",
                                            "regex",
                                            "iregex",
                                          ],
                                        },
                                      },
                                    },
                                  },
                                ],
                              },
                            },
                          },
                          search_fields: {
                            type: "array",
                            items: { type: "string" },
                            uniqueItems: true,
                            description: "Fields to search in",
                          },
                          ordering_fields: {
                            type: "array",
                            items: { type: "string" },
                            uniqueItems: true,
                            description: "Fields that can be used for ordering",
                          },
                          pagination: {
                            type: "object",
                            description: "Pagination configuration",
                            properties: {
                              page_size: {
                                type: "integer",
                                minimum: 1,
                                maximum: 1000,
                              },
                              page_size_query_param: {
                                type: "string",
                              },
                              max_page_size: {
                                type: "integer",
                                minimum: 1,
                              },
                            },
                          },
                        },
                      },
                      meta: {
                        type: "object",
                        description: "Additional Meta class options",
                        properties: {
                          unique_together: {
                            type: "array",
                            items: {
                              type: "array",
                              items: { type: "string" },
                            },
                          },
                          index_together: {
                            type: "array",
                            items: {
                              type: "array",
                              items: { type: "string" },
                            },
                          },
                          indexes: {
                            type: "array",
                            items: {
                              type: "object",
                              properties: {
                                fields: {
                                  type: "array",
                                  items: { type: "string" },
                                },
                                name: { type: "string" },
                              },
                            },
                          },
                        },
                      },
                    },
                  },
                },
                views: {
                  type: "array",
                  description: "Custom view definitions",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      type: {
                        type: "string",
                        enum: ["function", "class", "generic"],
                      },
                    },
                  },
                },
                urls: {
                  type: "array",
                  description: "URL pattern definitions",
                  items: {
                    type: "object",
                    properties: {
                      pattern: { type: "string" },
                      view: { type: "string" },
                      name: { type: "string" },
                    },
                  },
                },
              },
            },
          },
        },
        additionalProperties: false,
      },
    },
  },
  additionalProperties: false,
}

export const fieldTypeValidations = {
  CharField: {
    required: ["max_length"],
    optional: ["null", "blank", "default", "unique", "db_index", "choices"],
    description: "Text field with maximum length",
  },
  TextField: {
    required: [],
    optional: ["null", "blank", "default", "db_index"],
    description: "Large text field",
  },
  IntegerField: {
    required: [],
    optional: ["null", "blank", "default", "unique", "db_index", "choices"],
    description: "32-bit integer field",
  },
  DecimalField: {
    required: ["max_digits", "decimal_places"],
    optional: ["null", "blank", "default", "unique", "db_index"],
    description: "Fixed-precision decimal number",
  },
  DateTimeField: {
    required: [],
    optional: ["null", "blank", "default", "auto_now", "auto_now_add", "db_index"],
    description: "Date and time field",
  },
  ForeignKey: {
    required: ["to", "on_delete"],
    optional: ["null", "blank", "related_name", "related_query_name", "limit_choices_to", "db_constraint"],
    description: "Many-to-one relationship",
  },
  EmailField: {
    required: [],
    optional: ["max_length", "null", "blank", "default", "unique", "db_index"],
    description: "Email address field with validation",
  },
}

// Add comprehensive field options definitions after the existing djangoJsonSchema

export const djangoFieldOptions = {
  CharField: {
    required: ["max_length"],
    options: [
      { name: "max_length", type: "integer", description: "Maximum length of the field", example: "max_length=255" },
      { name: "min_length", type: "integer", description: "Minimum length of the field", example: "min_length=1" },
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "default", type: "string|function", description: "Default value", example: "default=''" },
      { name: "unique", type: "boolean", description: "Enforce uniqueness", example: "unique=True" },
      { name: "db_index", type: "boolean", description: "Create database index", example: "db_index=True" },
      {
        name: "choices",
        type: "list",
        description: "List of valid choices",
        example: "choices=[('S', 'Small'), ('M', 'Medium')]",
      },
      {
        name: "validators",
        type: "list",
        description: "List of validators",
        example: "validators=[MinLengthValidator(2)]",
      },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Enter your name'" },
      { name: "verbose_name", type: "string", description: "Human-readable name", example: "verbose_name='Full Name'" },
      { name: "editable", type: "boolean", description: "Show in forms", example: "editable=False" },
    ],
  },
  TextField: {
    required: [],
    options: [
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "default", type: "string", description: "Default value", example: "default=''" },
      { name: "db_index", type: "boolean", description: "Create database index", example: "db_index=True" },
      {
        name: "validators",
        type: "list",
        description: "List of validators",
        example: "validators=[MaxLengthValidator(1000)]",
      },
      {
        name: "help_text",
        type: "string",
        description: "Help text for forms",
        example: "help_text='Enter description'",
      },
      {
        name: "verbose_name",
        type: "string",
        description: "Human-readable name",
        example: "verbose_name='Description'",
      },
      { name: "editable", type: "boolean", description: "Show in forms", example: "editable=False" },
    ],
  },
  IntegerField: {
    required: [],
    options: [
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "default", type: "integer", description: "Default value", example: "default=0" },
      { name: "unique", type: "boolean", description: "Enforce uniqueness", example: "unique=True" },
      { name: "db_index", type: "boolean", description: "Create database index", example: "db_index=True" },
      {
        name: "choices",
        type: "list",
        description: "List of valid choices",
        example: "choices=[(1, 'One'), (2, 'Two')]",
      },
      {
        name: "validators",
        type: "list",
        description: "List of validators",
        example: "validators=[MinValueValidator(0)]",
      },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Enter a number'" },
      { name: "verbose_name", type: "string", description: "Human-readable name", example: "verbose_name='Count'" },
      { name: "editable", type: "boolean", description: "Show in forms", example: "editable=False" },
    ],
  },
  DecimalField: {
    required: ["max_digits", "decimal_places"],
    options: [
      { name: "max_digits", type: "integer", description: "Maximum number of digits", example: "max_digits=10" },
      { name: "decimal_places", type: "integer", description: "Number of decimal places", example: "decimal_places=2" },
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "default", type: "decimal", description: "Default value", example: "default=0.00" },
      { name: "unique", type: "boolean", description: "Enforce uniqueness", example: "unique=True" },
      { name: "db_index", type: "boolean", description: "Create database index", example: "db_index=True" },
      {
        name: "validators",
        type: "list",
        description: "List of validators",
        example: "validators=[MinValueValidator(0)]",
      },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Enter price'" },
      { name: "verbose_name", type: "string", description: "Human-readable name", example: "verbose_name='Price'" },
    ],
  },
  DateTimeField: {
    required: [],
    options: [
      { name: "auto_now", type: "boolean", description: "Update on every save", example: "auto_now=True" },
      { name: "auto_now_add", type: "boolean", description: "Set on creation only", example: "auto_now_add=True" },
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "default", type: "datetime|function", description: "Default value", example: "default=timezone.now" },
      { name: "db_index", type: "boolean", description: "Create database index", example: "db_index=True" },
      {
        name: "validators",
        type: "list",
        description: "List of validators",
        example: "validators=[validate_future_date]",
      },
      {
        name: "help_text",
        type: "string",
        description: "Help text for forms",
        example: "help_text='Select date and time'",
      },
      {
        name: "verbose_name",
        type: "string",
        description: "Human-readable name",
        example: "verbose_name='Created At'",
      },
    ],
  },
  DateField: {
    required: [],
    options: [
      { name: "auto_now", type: "boolean", description: "Update on every save", example: "auto_now=True" },
      { name: "auto_now_add", type: "boolean", description: "Set on creation only", example: "auto_now_add=True" },
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "default", type: "date|function", description: "Default value", example: "default=date.today" },
      { name: "db_index", type: "boolean", description: "Create database index", example: "db_index=True" },
      {
        name: "validators",
        type: "list",
        description: "List of validators",
        example: "validators=[validate_future_date]",
      },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Select date'" },
      {
        name: "verbose_name",
        type: "string",
        description: "Human-readable name",
        example: "verbose_name='Birth Date'",
      },
    ],
  },
  EmailField: {
    required: [],
    options: [
      { name: "max_length", type: "integer", description: "Maximum length (default 254)", example: "max_length=254" },
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "default", type: "string", description: "Default value", example: "default=''" },
      { name: "unique", type: "boolean", description: "Enforce uniqueness", example: "unique=True" },
      { name: "db_index", type: "boolean", description: "Create database index", example: "db_index=True" },
      {
        name: "validators",
        type: "list",
        description: "Additional validators",
        example: "validators=[validate_email]",
      },
      {
        name: "help_text",
        type: "string",
        description: "Help text for forms",
        example: "help_text='Enter valid email'",
      },
      {
        name: "verbose_name",
        type: "string",
        description: "Human-readable name",
        example: "verbose_name='Email Address'",
      },
    ],
  },
  BooleanField: {
    required: [],
    options: [
      { name: "default", type: "boolean", description: "Default value", example: "default=False" },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Check if active'" },
      { name: "verbose_name", type: "string", description: "Human-readable name", example: "verbose_name='Is Active'" },
      { name: "editable", type: "boolean", description: "Show in forms", example: "editable=False" },
    ],
  },
  ForeignKey: {
    required: ["to", "on_delete"],
    options: [
      { name: "to", type: "string", description: "Target model", example: "to='User'" },
      { name: "on_delete", type: "string", description: "Deletion behavior", example: "on_delete=models.CASCADE" },
      { name: "null", type: "boolean", description: "Allow NULL values", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty in forms", example: "blank=True" },
      {
        name: "related_name",
        type: "string",
        description: "Reverse relation name",
        example: "related_name='products'",
      },
      {
        name: "related_query_name",
        type: "string",
        description: "Reverse filter name",
        example: "related_query_name='product'",
      },
      {
        name: "limit_choices_to",
        type: "dict",
        description: "Limit available choices",
        example: "limit_choices_to={'is_active': True}",
      },
      { name: "db_constraint", type: "boolean", description: "Create DB constraint", example: "db_constraint=False" },
      { name: "db_index", type: "boolean", description: "Create database index", example: "db_index=True" },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Select user'" },
      { name: "verbose_name", type: "string", description: "Human-readable name", example: "verbose_name='Owner'" },
    ],
  },
  OneToOneField: {
    required: ["to", "on_delete"],
    options: [
      { name: "to", type: "string", description: "Target model", example: "to='User'" },
      { name: "on_delete", type: "string", description: "Deletion behavior", example: "on_delete=models.CASCADE" },
      { name: "null", type: "boolean", description: "Allow NULL values", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty in forms", example: "blank=True" },
      { name: "related_name", type: "string", description: "Reverse relation name", example: "related_name='profile'" },
      { name: "parent_link", type: "boolean", description: "Use as parent link", example: "parent_link=True" },
      { name: "db_constraint", type: "boolean", description: "Create DB constraint", example: "db_constraint=False" },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Select profile'" },
      {
        name: "verbose_name",
        type: "string",
        description: "Human-readable name",
        example: "verbose_name='User Profile'",
      },
    ],
  },
  ManyToManyField: {
    required: ["to"],
    options: [
      { name: "to", type: "string", description: "Target model", example: "to='Tag'" },
      { name: "blank", type: "boolean", description: "Allow empty in forms", example: "blank=True" },
      {
        name: "related_name",
        type: "string",
        description: "Reverse relation name",
        example: "related_name='products'",
      },
      {
        name: "related_query_name",
        type: "string",
        description: "Reverse filter name",
        example: "related_query_name='product'",
      },
      { name: "through", type: "string", description: "Intermediate model", example: "through='ProductTag'" },
      {
        name: "through_fields",
        type: "tuple",
        description: "Through model fields",
        example: "through_fields=('product', 'tag')",
      },
      { name: "symmetrical", type: "boolean", description: "Symmetrical relation", example: "symmetrical=False" },
      { name: "db_constraint", type: "boolean", description: "Create DB constraint", example: "db_constraint=False" },
      { name: "db_table", type: "string", description: "Junction table name", example: "db_table='product_tags'" },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Select tags'" },
      { name: "verbose_name", type: "string", description: "Human-readable name", example: "verbose_name='Tags'" },
    ],
  },
  URLField: {
    required: [],
    options: [
      { name: "max_length", type: "integer", description: "Maximum length (default 200)", example: "max_length=500" },
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "default", type: "string", description: "Default value", example: "default=''" },
      { name: "unique", type: "boolean", description: "Enforce uniqueness", example: "unique=True" },
      { name: "db_index", type: "boolean", description: "Create database index", example: "db_index=True" },
      {
        name: "validators",
        type: "list",
        description: "Additional validators",
        example: "validators=[URLValidator()]",
      },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Enter valid URL'" },
      {
        name: "verbose_name",
        type: "string",
        description: "Human-readable name",
        example: "verbose_name='Website URL'",
      },
    ],
  },
  SlugField: {
    required: [],
    options: [
      { name: "max_length", type: "integer", description: "Maximum length (default 50)", example: "max_length=100" },
      {
        name: "allow_unicode",
        type: "boolean",
        description: "Allow unicode characters",
        example: "allow_unicode=True",
      },
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "default", type: "string", description: "Default value", example: "default=''" },
      { name: "unique", type: "boolean", description: "Enforce uniqueness", example: "unique=True" },
      { name: "db_index", type: "boolean", description: "Create database index", example: "db_index=True" },
      {
        name: "help_text",
        type: "string",
        description: "Help text for forms",
        example: "help_text='URL-friendly name'",
      },
      { name: "verbose_name", type: "string", description: "Human-readable name", example: "verbose_name='URL Slug'" },
    ],
  },
  UUIDField: {
    required: [],
    options: [
      { name: "default", type: "function", description: "Default UUID generator", example: "default=uuid.uuid4" },
      { name: "unique", type: "boolean", description: "Enforce uniqueness", example: "unique=True" },
      { name: "primary_key", type: "boolean", description: "Use as primary key", example: "primary_key=True" },
      { name: "editable", type: "boolean", description: "Show in forms", example: "editable=False" },
      {
        name: "help_text",
        type: "string",
        description: "Help text for forms",
        example: "help_text='Unique identifier'",
      },
      { name: "verbose_name", type: "string", description: "Human-readable name", example: "verbose_name='UUID'" },
    ],
  },
  JSONField: {
    required: [],
    options: [
      { name: "default", type: "dict|list|function", description: "Default JSON value", example: "default=dict" },
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "encoder", type: "class", description: "JSON encoder class", example: "encoder=DjangoJSONEncoder" },
      { name: "decoder", type: "class", description: "JSON decoder class", example: "decoder=JSONDecoder" },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Enter JSON data'" },
      { name: "verbose_name", type: "string", description: "Human-readable name", example: "verbose_name='Metadata'" },
    ],
  },
  ImageField: {
    required: [],
    options: [
      { name: "upload_to", type: "string|function", description: "Upload directory", example: "upload_to='images/'" },
      {
        name: "height_field",
        type: "string",
        description: "Field to store height",
        example: "height_field='image_height'",
      },
      {
        name: "width_field",
        type: "string",
        description: "Field to store width",
        example: "width_field='image_width'",
      },
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "default", type: "string", description: "Default value", example: "default=''" },
      { name: "validators", type: "list", description: "File validators", example: "validators=[validate_image]" },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Upload image'" },
      {
        name: "verbose_name",
        type: "string",
        description: "Human-readable name",
        example: "verbose_name='Profile Image'",
      },
    ],
  },
  FileField: {
    required: [],
    options: [
      { name: "upload_to", type: "string|function", description: "Upload directory", example: "upload_to='files/'" },
      { name: "null", type: "boolean", description: "Allow NULL values in database", example: "null=True" },
      { name: "blank", type: "boolean", description: "Allow empty values in forms", example: "blank=True" },
      { name: "default", type: "string", description: "Default value", example: "default=''" },
      {
        name: "validators",
        type: "list",
        description: "File validators",
        example: "validators=[validate_file_extension]",
      },
      { name: "help_text", type: "string", description: "Help text for forms", example: "help_text='Upload file'" },
      { name: "verbose_name", type: "string", description: "Human-readable name", example: "verbose_name='Document'" },
    ],
  },
}

// Common on_delete options for relationship fields
export const onDeleteOptions = [
  { name: "models.CASCADE", description: "Delete related objects when this object is deleted" },
  { name: "models.PROTECT", description: "Prevent deletion if related objects exist" },
  { name: "models.SET_NULL", description: "Set foreign key to NULL (requires null=True)" },
  { name: "models.SET_DEFAULT", description: "Set foreign key to default value" },
  { name: "models.SET()", description: "Set foreign key to specified value" },
  { name: "models.DO_NOTHING", description: "Do nothing (may cause database integrity errors)" },
  { name: "models.RESTRICT", description: "Prevent deletion by raising RestrictedError" },
]
