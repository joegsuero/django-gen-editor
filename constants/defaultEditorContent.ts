export const defaultEditorContent = `# Django Backend Schema Definition
apps:
  - products:
      - models:
          - name: Category
            verbose_name: "Product Category"
            verbose_name_plural: "Product Categories"
            fields:
              - name: name
                type: CharField
                options: "max_length=100"
              - name: slug
                type: SlugField
                options: "max_length=100, unique=True"
          - name: Product
            verbose_name: "Product"
            verbose_name_plural: "Products"
            fields:
              - name: name
                type: CharField
                options: "max_length=255"
              - name: category
                type: ForeignKey
                options: "to='products.Category', on_delete=models.CASCADE"
              - name: description
                type: TextField
                options: "null=True, blank=True"
              - name: price
                type: DecimalField
                options: "max_digits=10, decimal_places=2"
              - name: stock_quantity
                type: IntegerField
                options: "default=0"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: [created_at, updated_at]
              permissions:
                - "rest_framework.permissions.IsAuthenticatedOrReadOnly"
  - users:
      - models:
          - name: User
            verbose_name: "User"
            verbose_name_plural: "Users"
            fields:
              - name: username
                type: CharField
                options: "max_length=150, unique=True"
              - name: email
                type: EmailField
                options: "unique=True"
              - name: first_name
                type: CharField
                options: "max_length=30, blank=True"
              - name: last_name
                type: CharField
                options: "max_length=30, blank=True"`;
