import { Template } from "@/types/types";

const ecommerce = {
  name: "E-commerce Platform",
  description:
    "A comprehensive schema for an e-commerce application, including products, categories, customers, orders, and order items.",
  yaml: `apps:
  - products:
      - models:
          - name: Product
            verbose_name: "Product"
            verbose_name_plural: "Products"
            fields:
              - name: name
                type: CharField
                options: "max_length=255"
              - name: description
                type: TextField
                options: "null=True, blank=True"
              - name: price
                type: DecimalField
                options: "max_digits=10, decimal_places=2"
              - name: stock_quantity
                type: IntegerField
                options: "default=0"
              - name: category
                type: ForeignKey
                options: "to='Category', on_delete=models.SET_NULL, null=True, blank=True, related_name='products'"
              - name: created_at
                type: DateTimeField
                options: "auto_now_add=True"
              - name: updated_at
                type: DateTimeField
                options: "auto_now=True"
            manager:
              base_manager: "models.Manager"
              methods:
                - name: available_products
                  query_fragment: ".filter(stock_quantity__gt=0)"
                - name: products_in_category
                  args: [category_id]
                  query_fragment: ".filter(category__id=category_id)"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: [created_at, updated_at]
              permissions:
                - "rest_framework.permissions.IsAuthenticatedOrReadOnly"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [price, stock_quantity, category]
              search_fields: [name, description]
              ordering_fields: [price, created_at, name]

          - name: Category
            verbose_name: "Category"
            verbose_name_plural: "Categories"
            fields:
              - name: name
                type: CharField
                options: "max_length=100, unique=True"
              - name: description
                type: TextField
                options: "null=True, blank=True"
            manager:
              base_manager: "models.Manager"
              methods:
                - name: active_categories
                  query_fragment: ".all()"
            api:
              include_actions: [list, retrieve, create]
              serializer:
                fields: [id, name, description]
                read_only_fields: []
              permissions:
                - "rest_framework.permissions.IsAdminUser"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              search_fields: [name]
              ordering_fields: [name]

          - name: ProductImage
            verbose_name: "Product Image"
            verbose_name_plural: "Product Images"
            fields:
              - name: product
                type: ForeignKey
                options: "to='Product', on_delete=models.CASCADE, related_name='images'"
              - name: image
                type: ImageField
                options: "upload_to='product_images/'"
              - name: description
                type: CharField
                options: "max_length=255, null=True, blank=True"
            manager:
              base_manager: "models.Manager"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: []
              permissions:
                - "rest_framework.permissions.IsAuthenticated"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [product]

  - customers:
      - models:
          - name: Customer
            verbose_name: "Customer"
            verbose_name_plural: "Customers"
            fields:
              - name: first_name
                type: CharField
                options: "max_length=100"
              - name: last_name
                type: CharField
                options: "max_length=100"
              - name: email
                type: EmailField
                options: "unique=True"
              - name: phone_number
                type: CharField
                options: "max_length=20, null=True, blank=True"
              - name: address
                type: TextField
                options: "null=True, blank=True"
              - name: registration_date
                type: DateField
                options: "auto_now_add=True"
            manager:
              base_manager: "models.Manager"
              methods:
                - name: by_email
                  args: [email_address]
                  query_fragment: ".filter(email__iexact=email_address)"
                - name: recent_customers
                  query_fragment: ".filter(registration_date__gte=datetime.date.today() - datetime.timedelta(days=30))"
                  requires_q: True
            api:
              include_actions: [list, retrieve, create, update, partial_update]
              serializer:
                fields: "all"
                read_only_fields: [registration_date]
              permissions:
                - "rest_framework.permissions.IsAuthenticated"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [email, registration_date]
              search_fields: [first_name, last_name, email, phone_number]
              ordering_fields: [last_name, first_name, email, registration_date]

  - orders:
      - models:
          - name: Order
            verbose_name: "Order"
            verbose_name_plural: "Orders"
            fields:
              - name: customer
                type: ForeignKey
                options: "to='customers.Customer', on_delete=models.CASCADE, related_name='orders'"
              - name: order_date
                type: DateTimeField
                options: "auto_now_add=True"
              - name: total_amount
                type: DecimalField
                options: "max_digits=10, decimal_places=2, default=0.00"
              - name: status
                type: CharField
                options: "max_length=50, default='pending', choices=[('pending', 'Pending'), ('processing', 'Processing'), ('completed', 'Completed'), ('cancelled', 'Cancelled')]"
            manager:
              base_manager: "models.Manager"
              methods:
                - name: customer_orders
                  args: [customer_id]
                  query_fragment: ".filter(customer__id=customer_id)"
                - name: completed_orders
                  query_fragment: ".filter(status='completed')"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: [order_date, total_amount]
              permissions:
                - "rest_framework.permissions.IsAuthenticated"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [customer, status, order_date]
              ordering_fields: [order_date, total_amount]

          - name: OrderItem
            verbose_name: "Order Item"
            verbose_name_plural: "Order Items"
            fields:
              - name: order
                type: ForeignKey
                options: "to='Order', on_delete=models.CASCADE, related_name='items'"
              - name: product
                type: ForeignKey
                options: "to='products.Product', on_delete=models.CASCADE"
              - name: quantity
                type: IntegerField
                options: "default=1"
              - name: price_at_purchase
                type: DecimalField
                options: "max_digits=10, decimal_places=2"
            manager:
              base_manager: "models.Manager"
            api:
              include_actions: [list, retrieve, create]
              serializer:
                fields: "all"
                read_only_fields: [price_at_purchase]
              permissions:
                - "rest_framework.permissions.IsAuthenticated"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [order, product]
`,
};

const blog = {
  name: "Blog Platform",
  description:
    "A simple schema for a blog, featuring posts, authors, and comments.",
  yaml: `apps:
  - blog:
      - models:
          - name: Post
            verbose_name: "Blog Post"
            verbose_name_plural: "Blog Posts"
            fields:
              - name: title
                type: CharField
                options: "max_length=200"
              - name: content
                type: TextField
              - name: author
                type: ForeignKey
                options: "to='auth.User', on_delete=models.CASCADE"
              - name: published_date
                type: DateTimeField
                options: "auto_now_add=True"
              - name: updated_date
                type: DateTimeField
                options: "auto_now=True"
            manager:
              base_manager: "models.Manager"
              methods:
                - name: published_posts
                  query_fragment: ".filter(published_date__isnull=False)"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: [published_date, updated_date]
              permissions:
                - "rest_framework.permissions.IsAuthenticatedOrReadOnly"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              search_fields: [title, content]
              ordering_fields: [published_date, title]
          - name: Comment
            verbose_name: "Comment"
            verbose_name_plural: "Comments"
            fields:
              - name: post
                type: ForeignKey
                options: "to='Post', on_delete=models.CASCADE, related_name='comments'"
              - name: author
                type: CharField
                options: "max_length=100"
              - name: email
                type: EmailField
                options: "blank=True, null=True"
              - name: content
                type: TextField
              - name: created_at
                type: DateTimeField
                options: "auto_now_add=True"
            manager:
              base_manager: "models.Manager"
            api:
              include_actions: [list, retrieve, create]
              serializer:
                fields: "all"
                read_only_fields: [created_at]
              permissions:
                - "rest_framework.permissions.AllowAny"
              authentication: []
              filterset:
                fields: [post]
              ordering_fields: [created_at]
`,
};

const user_management_system = {
  name: "User Management System",
  description: "A basic schema for managing users and their profiles.",
  yaml: `apps:
  - users:
      - models:
          - name: Profile
            verbose_name: "User Profile"
            verbose_name_plural: "User Profiles"
            fields:
              - name: user
                type: OneToOneField
                options: "to='auth.User', on_delete=models.CASCADE"
              - name: bio
                type: TextField
                options: "null=True, blank=True"
              - name: date_of_birth
                type: DateField
                options: "null=True, blank=True"
              - name: avatar
                type: ImageField
                options: "upload_to='avatars/', null=True, blank=True"
            manager:
              base_manager: "models.Manager"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: [user]
              permissions:
                - "rest_framework.permissions.IsAuthenticated"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [user]
`,
};

const event_management_system = {
  name: "Event Management System",
  description:
    "A schema for managing events, including event details, speakers, and attendees.",
  yaml: `apps:
  - events:
      - models:
          - name: Event
            verbose_name: "Event"
            verbose_name_plural: "Events"
            fields:
              - name: title
                type: CharField
                options: "max_length=255"
              - name: description
                type: TextField
                options: "null=True, blank=True"
              - name: date
                type: DateField
              - name: time
                type: TimeField
              - name: location
                type: CharField
                options: "max_length=255"
              - name: capacity
                type: IntegerField
                options: "null=True, blank=True"
              - name: is_published
                type: BooleanField
                options: "default=False"
            manager:
              base_manager: "models.Manager"
              methods:
                - name: upcoming_events
                  query_fragment: ".filter(date__gte=datetime.date.today(), is_published=True)"
                  requires_q: True
                - name: published_events
                  query_fragment: ".filter(is_published=True)"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: []
              permissions:
                - "rest_framework.permissions.IsAuthenticatedOrReadOnly"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [date, is_published]
              search_fields: [title, description, location]
              ordering_fields: [date, title]

          - name: Speaker
            verbose_name: "Speaker"
            verbose_name_plural: "Speakers"
            fields:
              - name: name
                type: CharField
                options: "max_length=255"
              - name: bio
                type: TextField
                options: "null=True, blank=True"
              - name: email
                type: EmailField
                options: "unique=True"
              - name: events
                type: ManyToManyField
                options: "to='Event', related_name='speakers'"
            manager:
              base_manager: "models.Manager"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: []
              permissions:
                - "rest_framework.permissions.IsAdminUser"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              search_fields: [name, bio, email]
              ordering_fields: [name]

          - name: Attendee
            verbose_name: "Attendee"
            verbose_name_plural: "Attendees"
            fields:
              - name: event
                type: ForeignKey
                options: "to='Event', on_delete=models.CASCADE, related_name='attendees'"
              - name: name
                type: CharField
                options: "max_length=255"
              - name: email
                type: EmailField
            manager:
              base_manager: "models.Manager"
              methods:
                - name: attendees_for_event
                  args: [event_id]
                  query_fragment: ".filter(event__id=event_id)"
            api:
              include_actions: [list, retrieve, create]
              serializer:
                fields: "all"
                read_only_fields: []
              permissions:
                - "rest_framework.permissions.IsAuthenticated"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [event, email]
              search_fields: [name, email]
`,
};
const helpdesk_system = {
  name: "Helpdesk System",
  description:
    "A schema for a helpdesk application, including support tickets, users, and responses.",
  yaml: `apps:
  - support:
      - models:
          - name: Ticket
            verbose_name: "Support Ticket"
            verbose_name_plural: "Support Tickets"
            fields:
              - name: subject
                type: CharField
                options: "max_length=255"
              - name: description
                type: TextField
              - name: submitted_by
                type: ForeignKey
                options: "to='auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='submitted_tickets'"
              - name: assigned_to
                type: ForeignKey
                options: "to='auth.User', on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_tickets'"
              - name: status
                type: CharField
                options: "max_length=50, default='open', choices=[('open', 'Open'), ('in_progress', 'In Progress'), ('closed', 'Closed')]"
              - name: priority
                type: CharField
                options: "max_length=50, default='medium', choices=[('low', 'Low'), ('medium', 'Medium'), ('high', 'High')]"
              - name: created_at
                type: DateTimeField
                options: "auto_now_add=True"
              - name: updated_at
                type: DateTimeField
                options: "auto_now=True"
            manager:
              base_manager: "models.Manager"
              methods:
                - name: open_tickets
                  query_fragment: ".filter(status='open')"
                - name: tickets_by_user
                  args: [user_id]
                  query_fragment: ".filter(submitted_by__id=user_id)"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: [created_at, updated_at]
              permissions:
                - "rest_framework.permissions.IsAuthenticated"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [status, priority, submitted_by, assigned_to]
              search_fields: [subject, description]
              ordering_fields: [created_at, priority]

          - name: Response
            verbose_name: "Ticket Response"
            verbose_name_plural: "Ticket Responses"
            fields:
              - name: ticket
                type: ForeignKey
                options: "to='Ticket', on_delete=models.CASCADE, related_name='responses'"
              - name: responded_by
                type: ForeignKey
                options: "to='auth.User', on_delete=models.SET_NULL, null=True, blank=True"
              - name: message
                type: TextField
              - name: created_at
                type: DateTimeField
                options: "auto_now_add=True"
            manager:
              base_manager: "models.Manager"
            api:
              include_actions: [list, retrieve, create]
              serializer:
                fields: "all"
                read_only_fields: [created_at]
              permissions:
                - "rest_framework.permissions.IsAuthenticated"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [ticket, responded_by]
              ordering_fields: [created_at]
`,
};

const portfolio = {
  name: "Portfolio/Gallery",
  description: "A simple schema for showcasing projects or a media gallery.",
  yaml: `apps:
  - portfolio:
      - models:
          - name: Project
            verbose_name: "Project"
            verbose_name_plural: "Projects"
            fields:
              - name: title
                type: CharField
                options: "max_length=255"
              - name: description
                type: TextField
                options: "null=True, blank=True"
              - name: client
                type: CharField
                options: "max_length=255, null=True, blank=True"
              - name: completion_date
                type: DateField
                options: "null=True, blank=True"
              - name: url
                type: URLField
                options: "max_length=200, null=True, blank=True"
              - name: category
                type: CharField
                options: "max_length=100, null=True, blank=True"
              - name: is_featured
                type: BooleanField
                options: "default=False"
            manager:
              base_manager: "models.Manager"
              methods:
                - name: featured_projects
                  query_fragment: ".filter(is_featured=True)"
                - name: projects_by_category
                  args: [category_name]
                  query_fragment: ".filter(category__iexact=category_name)"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: []
              permissions:
                - "rest_framework.permissions.IsAuthenticatedOrReadOnly"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [category, is_featured]
              search_fields: [title, description, client]
              ordering_fields: [completion_date, title]

          - name: ProjectImage
            verbose_name: "Project Image"
            verbose_name_plural: "Project Images"
            fields:
              - name: project
                type: ForeignKey
                options: "to='Project', on_delete=models.CASCADE, related_name='images'"
              - name: image
                type: ImageField
                options: "upload_to='project_images/'"
              - name: caption
                type: CharField
                options: "max_length=255, null=True, blank=True"
            manager:
              base_manager: "models.Manager"
            api:
              include_actions: [list, retrieve, create]
              serializer:
                fields: "all"
                read_only_fields: []
              permissions:
                - "rest_framework.permissions.IsAuthenticatedOrReadOnly"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [project]
`,
};

const booking_appointment_system = {
  name: "Booking/Appointment System",
  description:
    "A schema for managing bookings or appointments, including services, appointments, and customers.",
  yaml: `apps:
  - bookings:
      - models:
          - name: Service
            verbose_name: "Service"
            verbose_name_plural: "Services"
            fields:
              - name: name
                type: CharField
                options: "max_length=255"
              - name: description
                type: TextField
                options: "null=True, blank=True"
              - name: price
                type: DecimalField
                options: "max_digits=10, decimal_places=2, null=True, blank=True"
              - name: duration_minutes
                type: IntegerField
                options: "null=True, blank=True"
            manager:
              base_manager: "models.Manager"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: []
              permissions:
                - "rest_framework.permissions.IsAuthenticatedOrReadOnly"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              search_fields: [name, description]
              ordering_fields: [name, price]

          - name: Appointment
            verbose_name: "Appointment"
            verbose_name_plural: "Appointments"
            fields:
              - name: service
                type: ForeignKey
                options: "to='Service', on_delete=models.CASCADE, related_name='appointments'"
              - name: customer_name
                type: CharField
                options: "max_length=255"
              - name: customer_email
                type: EmailField
              - name: appointment_date
                type: DateField
              - name: appointment_time
                type: TimeField
              - name: notes
                type: TextField
                options: "null=True, blank=True"
              - name: is_confirmed
                type: BooleanField
                options: "default=False"
            manager:
              base_manager: "models.Manager"
              methods:
                - name: upcoming_appointments
                  query_fragment: ".filter(appointment_date__gte=datetime.date.today()).order_by('appointment_date', 'appointment_time')"
                  requires_q: True
                - name: confirmed_appointments
                  query_fragment: ".filter(is_confirmed=True)"
            api:
              include_actions: "__all__"
              serializer:
                fields: "all"
                read_only_fields: []
              permissions:
                - "rest_framework.permissions.IsAuthenticated"
              authentication:
                - "rest_framework_simplejwt.authentication.JWTAuthentication"
              filterset:
                fields: [service, appointment_date, is_confirmed]
              search_fields: [customer_name, customer_email]
              ordering_fields: [appointment_date, appointment_time]
`,
};

export const templates: Template[] = [
  ecommerce,
  blog,
  user_management_system,
  event_management_system,
  helpdesk_system,
  portfolio,
  booking_appointment_system,
];
