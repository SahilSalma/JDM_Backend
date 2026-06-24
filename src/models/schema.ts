import { sql } from 'drizzle-orm';
import {
  text,
  integer,
  sqliteTable,
  index,
  uniqueIndex,
} from 'drizzle-orm/sqlite-core';

// ─── Makes ────────────────────────────────────────────────────────────────────

export const makes = sqliteTable(
  'makes',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull().unique(),
    slug: text('slug').notNull().unique(),
    year_range_min: integer('year_range_min').default(1980),
    year_range_max: integer('year_range_max').default(2025),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    nameIdx: uniqueIndex('makes_name_idx').on(table.name),
    slugIdx: uniqueIndex('makes_slug_idx').on(table.slug),
    sortOrderIdx: index('makes_sort_order_idx').on(table.sort_order),
  }),
);

export type Make = typeof makes.$inferSelect;
export type NewMake = typeof makes.$inferInsert;

// ─── Models ───────────────────────────────────────────────────────────────────

export const models = sqliteTable(
  'models',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    make_id: text('make_id').notNull().references(() => makes.id, { onDelete: 'cascade' }),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    makeIdIdx: index('models_make_id_idx').on(table.make_id),
    makeModelNameIdx: uniqueIndex('models_make_id_name_idx').on(table.make_id, table.name),
    slugIdx: index('models_slug_idx').on(table.slug),
  }),
);

export type Model = typeof models.$inferSelect;
export type NewModel = typeof models.$inferInsert;

// ─── Products ────────────────────────────────────────────────────────────────

export const products = sqliteTable(
  'products',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sku: text('sku').notNull().unique(),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    description: text('description'),
    short_description: text('short_description'),
    category: text('category', { enum: ['engine', 'transmission', 'part'] }).notNull(),
    price_cents: integer('price_cents').notNull(),
    compare_at_price_cents: integer('compare_at_price_cents'),
    make_id: text('make_id').references(() => makes.id, { onDelete: 'set null' }),
    model_id: text('model_id').references(() => models.id, { onDelete: 'set null' }),
    make: text('make'),
    model: text('model'),
    year_start: integer('year_start'),
    year_end: integer('year_end'),
    engine_code: text('engine_code'),
    displacement: text('displacement'),
    cylinders: integer('cylinders'),
    fuel_type: text('fuel_type'),
    transmission_type: text('transmission_type'),
    quantity: integer('quantity').default(0).notNull(),
    max_per_order: integer('max_per_order').default(1).notNull(),
    low_stock_threshold: integer('low_stock_threshold').default(1).notNull(),
    show_when_out_of_stock: integer('show_when_out_of_stock', { mode: 'boolean' }).default(false).notNull(),
    primary_image_path: text('primary_image_path'),
    /** Vehicle mileage in km (optional). */
    mileage_km: integer('mileage_km'),
    /** Generic condition label (e.g. "JDM Used – Inspected"). */
    condition: text('condition'),
    /** Additional information / condition notes. */
    condition_notes: text('condition_notes'),
    /** Newline-separated bullet list of what's included. */
    included_items: text('included_items'),
    /** JSON array of {label, value} spec rows. */
    specs_json: text('specs_json'),
    /** Per-product warranty summary. */
    warranty_summary: text('warranty_summary'),
    /** JSON array of related product IDs. */
    related_product_ids: text('related_product_ids'),
    meta_title: text('meta_title'),
    meta_description: text('meta_description'),
    google_merchant_synced: integer('google_merchant_synced', { mode: 'boolean' }).default(false).notNull(),
    google_merchant_id: text('google_merchant_id'),
    gtin: text('gtin'),
    mpn: text('mpn'),
    status: text('status', { enum: ['active', 'inactive', 'archived'] }).default('active').notNull(),
    featured: integer('featured', { mode: 'boolean' }).default(false).notNull(),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
    is_deleted: integer('is_deleted', { mode: 'boolean' }).default(false).notNull(),
  },
  (table) => ({
    skuIdx: uniqueIndex('products_sku_idx').on(table.sku),
    slugIdx: uniqueIndex('products_slug_idx').on(table.slug),
    categoryIdx: index('products_category_idx').on(table.category),
    statusIdx: index('products_status_idx').on(table.status),
    makeIdx: index('products_make_idx').on(table.make),
    makeIdIdx: index('products_make_id_idx').on(table.make_id),
    modelIdIdx: index('products_model_id_idx').on(table.model_id),
    featuredIdx: index('products_featured_idx').on(table.featured),
  }),
);

export type Product = typeof products.$inferSelect;
export type NewProduct = typeof products.$inferInsert;

// ─── Product Images ───────────────────────────────────────────────────────────

export const productImages = sqliteTable(
  'product_images',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_id: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    image_path: text('image_path').notNull(),
    alt_text: text('alt_text'),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    productIdIdx: index('product_images_product_id_idx').on(table.product_id),
  }),
);

export type ProductImage = typeof productImages.$inferSelect;
export type NewProductImage = typeof productImages.$inferInsert;

// ─── Product Compatibility ────────────────────────────────────────────────────

export const productCompatibility = sqliteTable(
  'product_compatibility',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_id: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    make: text('make').notNull(),
    model: text('model').notNull(),
    year_start: integer('year_start'),
    year_end: integer('year_end'),
    notes: text('notes'),
  },
  (table) => ({
    productIdIdx: index('product_compat_product_id_idx').on(table.product_id),
    makeModelIdx: index('product_compat_make_model_idx').on(table.make, table.model),
  }),
);

export type ProductCompatibility = typeof productCompatibility.$inferSelect;
export type NewProductCompatibility = typeof productCompatibility.$inferInsert;

// ─── Orders ───────────────────────────────────────────────────────────────────

export const orders = sqliteTable(
  'orders',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    order_number: text('order_number').notNull().unique(),
    customer_email: text('customer_email').notNull(),
    customer_first_name: text('customer_first_name').notNull(),
    customer_last_name: text('customer_last_name').notNull(),
    customer_phone: text('customer_phone'),

    // Shipping address
    shipping_line1: text('shipping_line1').notNull(),
    shipping_line2: text('shipping_line2'),
    shipping_city: text('shipping_city').notNull(),
    shipping_state: text('shipping_state').notNull(),
    shipping_zip: text('shipping_zip').notNull(),
    shipping_country: text('shipping_country').default('US').notNull(),
    shipping_type: text('shipping_type').notNull(),

    // Billing address
    billing_line1: text('billing_line1'),
    billing_line2: text('billing_line2'),
    billing_city: text('billing_city'),
    billing_state: text('billing_state'),
    billing_zip: text('billing_zip'),
    billing_country: text('billing_country').default('US'),

    subtotal_cents: integer('subtotal_cents').notNull(),
    shipping_cents: integer('shipping_cents').notNull(),
    tax_cents: integer('tax_cents').default(0).notNull(),
    total_cents: integer('total_cents').notNull(),

    stripe_payment_intent_id: text('stripe_payment_intent_id'),
    stripe_charge_id: text('stripe_charge_id'),
    authorizenet_transaction_id: text('authorizenet_transaction_id'),

    payment_status: text('payment_status', {
      enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    }).default('pending').notNull(),

    status: text('status', {
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    }).default('pending').notNull(),

    tracking_number: text('tracking_number'),
    carrier: text('carrier'),
    shipped_at: text('shipped_at'),
    delivered_at: text('delivered_at'),

    customer_notes: text('customer_notes'),
    admin_notes: text('admin_notes'),

    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    orderNumberIdx: uniqueIndex('orders_order_number_idx').on(table.order_number),
    emailIdx: index('orders_email_idx').on(table.customer_email),
    statusIdx: index('orders_status_idx').on(table.status),
    paymentStatusIdx: index('orders_payment_status_idx').on(table.payment_status),
    createdAtIdx: index('orders_created_at_idx').on(table.created_at),
    stripeIntentIdx: index('orders_stripe_intent_idx').on(table.stripe_payment_intent_id),
    authorizenetTransIdx: index('orders_authnet_trans_idx').on(table.authorizenet_transaction_id),
  }),
);

export type Order = typeof orders.$inferSelect;
export type NewOrder = typeof orders.$inferInsert;

// ─── Order Items ──────────────────────────────────────────────────────────────

export const orderItems = sqliteTable(
  'order_items',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    order_id: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    product_id: text('product_id').references(() => products.id, { onDelete: 'set null' }),
    quantity: integer('quantity').default(1).notNull(),
    unit_price_cents: integer('unit_price_cents').notNull(),
    total_cents: integer('total_cents').notNull(),
    product_title: text('product_title').notNull(),
    product_sku: text('product_sku').notNull(),
  },
  (table) => ({
    orderIdIdx: index('order_items_order_id_idx').on(table.order_id),
    productIdIdx: index('order_items_product_id_idx').on(table.product_id),
  }),
);

export type OrderItem = typeof orderItems.$inferSelect;
export type NewOrderItem = typeof orderItems.$inferInsert;

// ─── Inventory Log ────────────────────────────────────────────────────────────

export const inventoryLog = sqliteTable(
  'inventory_log',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_id: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    previous_quantity: integer('previous_quantity').notNull(),
    new_quantity: integer('new_quantity').notNull(),
    change_reason: text('change_reason'),
    changed_by: text('changed_by').default('admin').notNull(),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    productIdIdx: index('inventory_log_product_id_idx').on(table.product_id),
    createdAtIdx: index('inventory_log_created_at_idx').on(table.created_at),
  }),
);

export type InventoryLog = typeof inventoryLog.$inferSelect;
export type NewInventoryLog = typeof inventoryLog.$inferInsert;

// ─── Admin Users ──────────────────────────────────────────────────────────────

export const adminUsers = sqliteTable(
  'admin_users',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull().unique(),
    password_hash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: text('role', { enum: ['admin', 'super_admin'] }).default('admin').notNull(),
    last_login_at: text('last_login_at'),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    emailIdx: uniqueIndex('admin_users_email_idx').on(table.email),
  }),
);

export type AdminUser = typeof adminUsers.$inferSelect;
export type NewAdminUser = typeof adminUsers.$inferInsert;

// ─── Sale Conditions ──────────────────────────────────────────────────────────

export const saleConditions = sqliteTable(
  'sale_conditions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    rule_key: text('rule_key').notNull().unique(),
    rule_value: text('rule_value').notNull(),
    description: text('description'),
    is_active: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    ruleKeyIdx: uniqueIndex('sale_conditions_rule_key_idx').on(table.rule_key),
  }),
);

export type SaleCondition = typeof saleConditions.$inferSelect;
export type NewSaleCondition = typeof saleConditions.$inferInsert;

// ─── Blog Posts ───────────────────────────────────────────────────────────────

export const blogPosts = sqliteTable(
  'blog_posts',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: text('slug').notNull().unique(),
    title: text('title').notNull(),
    content: text('content').notNull(),
    excerpt: text('excerpt'),
    featured_image_path: text('featured_image_path'),
    status: text('status', { enum: ['draft', 'published'] }).default('draft').notNull(),
    meta_title: text('meta_title'),
    meta_description: text('meta_description'),
    published_at: text('published_at'),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    slugIdx: uniqueIndex('blog_posts_slug_idx').on(table.slug),
    statusIdx: index('blog_posts_status_idx').on(table.status),
    publishedAtIdx: index('blog_posts_published_at_idx').on(table.published_at),
  }),
);

export type BlogPost = typeof blogPosts.$inferSelect;
export type NewBlogPost = typeof blogPosts.$inferInsert;

// ─── Email Log ────────────────────────────────────────────────────────────────

export const emailLog = sqliteTable(
  'email_log',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    order_id: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
    recipient_email: text('recipient_email').notNull(),
    template_used: text('template_used'),
    subject: text('subject').notNull(),
    body_content: text('body_content'),
    has_attachment: integer('has_attachment', { mode: 'boolean' }).default(false).notNull(),
    sent_at: text('sent_at').notNull().$defaultFn(() => new Date().toISOString()),
    status: text('status', { enum: ['sent', 'failed', 'bounced'] }).default('sent').notNull(),
  },
  (table) => ({
    orderIdIdx: index('email_log_order_id_idx').on(table.order_id),
    recipientIdx: index('email_log_recipient_idx').on(table.recipient_email),
    sentAtIdx: index('email_log_sent_at_idx').on(table.sent_at),
  }),
);

export type EmailLog = typeof emailLog.$inferSelect;
export type NewEmailLog = typeof emailLog.$inferInsert;

// ─── Shipping Zones ───────────────────────────────────────────────────────────

export const shippingZones = sqliteTable(
  'shipping_zones',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    state_code: text('state_code'),
    city: text('city'),
    zone_type: text('zone_type', { enum: ['forklift', 'no_forklift', 'liftgate', 'residential_delivery'] }).notNull(),
    rate_cents: integer('rate_cents').notNull(),
    is_active: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  },
  (table) => ({
    zoneTypeIdx: index('shipping_zones_zone_type_idx').on(table.zone_type),
    stateCodeIdx: index('shipping_zones_state_code_idx').on(table.state_code),
    isActiveIdx: index('shipping_zones_is_active_idx').on(table.is_active),
  }),
);

export type ShippingZone = typeof shippingZones.$inferSelect;
export type NewShippingZone = typeof shippingZones.$inferInsert;

// ─── Email Templates ──────────────────────────────────────────────────────────

export const emailTemplates = sqliteTable(
  'email_templates',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    template_name: text('template_name').notNull().unique(),
    subject_template: text('subject_template'),
    html_template: text('html_template').notNull(),
    is_active: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    description: text('description'),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    templateNameIdx: uniqueIndex('email_templates_name_idx').on(table.template_name),
    isActiveIdx: index('email_templates_is_active_idx').on(table.is_active),
  }),
);

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type NewEmailTemplate = typeof emailTemplates.$inferInsert;

// ─── Subscriptions ────────────────────────────────────────────────────────────

export const subscriptions = sqliteTable(
  'subscriptions',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull().unique(),
    first_name: text('first_name'),
    last_name: text('last_name'),
    source: text('source', { enum: ['footer', 'checkout', 'popup'] }).default('footer').notNull(),
    subscribed_at: text('subscribed_at').notNull().$defaultFn(() => new Date().toISOString()),
    is_active: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
  },
  (table) => ({
    emailIdx: uniqueIndex('subscriptions_email_idx').on(table.email),
    isActiveIdx: index('subscriptions_is_active_idx').on(table.is_active),
    sourceIdx: index('subscriptions_source_idx').on(table.source),
  }),
);

export type Subscription = typeof subscriptions.$inferSelect;
export type NewSubscription = typeof subscriptions.$inferInsert;

// ─── Navbar Settings ──────────────────────────────────────────────────────────

export const navbarSettings = sqliteTable(
  'navbar_settings',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    setting_key: text('setting_key').notNull().unique(),
    setting_value: text('setting_value').notNull(),
    description: text('description'),
    is_active: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    settingKeyIdx: uniqueIndex('navbar_settings_key_idx').on(table.setting_key),
  }),
);

export type NavbarSetting = typeof navbarSettings.$inferSelect;
export type NewNavbarSetting = typeof navbarSettings.$inferInsert;

// ─── Order Notification Recipients ────────────────────────────────────────────

export const orderNotificationRecipients = sqliteTable(
  'order_notification_recipients',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: text('email').notNull(),
    name: text('name'),
    is_active: integer('is_active', { mode: 'boolean' }).default(true).notNull(),
    sort_order: integer('sort_order').default(0).notNull(),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    isActiveIdx: index('order_notification_recipients_is_active_idx').on(table.is_active),
    sortOrderIdx: index('order_notification_recipients_sort_idx').on(table.sort_order),
  }),
);

export type OrderNotificationRecipient = typeof orderNotificationRecipients.$inferSelect;
export type NewOrderNotificationRecipient = typeof orderNotificationRecipients.$inferInsert;

// ─── Reviews ───────────────────────────────────────────────────────────────────

export const reviews = sqliteTable(
  'reviews',
  {
    id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_id: text('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    order_id: text('order_id').notNull().references(() => orders.id, { onDelete: 'cascade' }),
    customer_name: text('customer_name').notNull(),
    customer_email: text('customer_email').notNull(),
    rating: integer('rating').notNull(),
    title: text('title'),
    content: text('content').notNull(),
    images: text('images').default('[]'),
    status: text('status', { enum: ['approved', 'pending', 'rejected'] }).default('approved').notNull(),
    is_featured: integer('is_featured', { mode: 'boolean' }).default(false).notNull(),
    sort_order: integer('sort_order').default(0),
    created_at: text('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: text('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
  },
  (table) => ({
    productIdIdx: index('reviews_product_id_idx').on(table.product_id),
    orderIdIdx: index('reviews_order_id_idx').on(table.order_id),
    emailIdx: index('reviews_customer_email_idx').on(table.customer_email),
    statusIdx: index('reviews_status_idx').on(table.status),
    featuredIdx: index('reviews_is_featured_idx').on(table.is_featured),
    ratingIdx: index('reviews_rating_idx').on(table.rating),
  }),
);

export type Review = typeof reviews.$inferSelect;
export type NewReview = typeof reviews.$inferInsert;
