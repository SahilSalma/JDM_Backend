"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.reviews = exports.orderNotificationRecipients = exports.navbarSettings = exports.subscriptions = exports.emailTemplates = exports.shippingZones = exports.emailLog = exports.blogPosts = exports.saleConditions = exports.adminUsers = exports.inventoryLog = exports.orderItems = exports.orders = exports.productCompatibility = exports.productImages = exports.products = exports.models = exports.makes = void 0;
const sqlite_core_1 = require("drizzle-orm/sqlite-core");
// ─── Makes ────────────────────────────────────────────────────────────────────
exports.makes = (0, sqlite_core_1.sqliteTable)('makes', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: (0, sqlite_core_1.text)('name').notNull().unique(),
    slug: (0, sqlite_core_1.text)('slug').notNull().unique(),
    year_range_min: (0, sqlite_core_1.integer)('year_range_min').default(1980),
    year_range_max: (0, sqlite_core_1.integer)('year_range_max').default(2025),
    sort_order: (0, sqlite_core_1.integer)('sort_order').default(0).notNull(),
    created_at: (0, sqlite_core_1.text)('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: (0, sqlite_core_1.text)('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    nameIdx: (0, sqlite_core_1.uniqueIndex)('makes_name_idx').on(table.name),
    slugIdx: (0, sqlite_core_1.uniqueIndex)('makes_slug_idx').on(table.slug),
    sortOrderIdx: (0, sqlite_core_1.index)('makes_sort_order_idx').on(table.sort_order),
}));
// ─── Models ───────────────────────────────────────────────────────────────────
exports.models = (0, sqlite_core_1.sqliteTable)('models', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    name: (0, sqlite_core_1.text)('name').notNull(),
    slug: (0, sqlite_core_1.text)('slug').notNull(),
    make_id: (0, sqlite_core_1.text)('make_id').notNull().references(() => exports.makes.id, { onDelete: 'cascade' }),
    created_at: (0, sqlite_core_1.text)('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: (0, sqlite_core_1.text)('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    makeIdIdx: (0, sqlite_core_1.index)('models_make_id_idx').on(table.make_id),
    makeModelNameIdx: (0, sqlite_core_1.uniqueIndex)('models_make_id_name_idx').on(table.make_id, table.name),
    slugIdx: (0, sqlite_core_1.index)('models_slug_idx').on(table.slug),
}));
// ─── Products ────────────────────────────────────────────────────────────────
exports.products = (0, sqlite_core_1.sqliteTable)('products', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    sku: (0, sqlite_core_1.text)('sku').notNull().unique(),
    slug: (0, sqlite_core_1.text)('slug').notNull().unique(),
    title: (0, sqlite_core_1.text)('title').notNull(),
    description: (0, sqlite_core_1.text)('description'),
    short_description: (0, sqlite_core_1.text)('short_description'),
    category: (0, sqlite_core_1.text)('category', { enum: ['engine', 'transmission', 'part'] }).notNull(),
    price_cents: (0, sqlite_core_1.integer)('price_cents').notNull(),
    compare_at_price_cents: (0, sqlite_core_1.integer)('compare_at_price_cents'),
    make_id: (0, sqlite_core_1.text)('make_id').references(() => exports.makes.id, { onDelete: 'set null' }),
    model_id: (0, sqlite_core_1.text)('model_id').references(() => exports.models.id, { onDelete: 'set null' }),
    make: (0, sqlite_core_1.text)('make'),
    model: (0, sqlite_core_1.text)('model'),
    year_start: (0, sqlite_core_1.integer)('year_start'),
    year_end: (0, sqlite_core_1.integer)('year_end'),
    engine_code: (0, sqlite_core_1.text)('engine_code'),
    displacement: (0, sqlite_core_1.text)('displacement'),
    cylinders: (0, sqlite_core_1.integer)('cylinders'),
    fuel_type: (0, sqlite_core_1.text)('fuel_type'),
    transmission_type: (0, sqlite_core_1.text)('transmission_type'),
    quantity: (0, sqlite_core_1.integer)('quantity').default(0).notNull(),
    max_per_order: (0, sqlite_core_1.integer)('max_per_order').default(1).notNull(),
    low_stock_threshold: (0, sqlite_core_1.integer)('low_stock_threshold').default(1).notNull(),
    show_when_out_of_stock: (0, sqlite_core_1.integer)('show_when_out_of_stock', { mode: 'boolean' }).default(false).notNull(),
    primary_image_path: (0, sqlite_core_1.text)('primary_image_path'),
    /** Vehicle mileage in km (optional). */
    mileage_km: (0, sqlite_core_1.integer)('mileage_km'),
    /** Generic condition label (e.g. "JDM Used – Inspected"). */
    condition: (0, sqlite_core_1.text)('condition'),
    /** Additional information / condition notes. */
    condition_notes: (0, sqlite_core_1.text)('condition_notes'),
    /** Newline-separated bullet list of what's included. */
    included_items: (0, sqlite_core_1.text)('included_items'),
    /** JSON array of {label, value} spec rows. */
    specs_json: (0, sqlite_core_1.text)('specs_json'),
    /** Per-product warranty summary. */
    warranty_summary: (0, sqlite_core_1.text)('warranty_summary'),
    /** JSON array of related product IDs. */
    related_product_ids: (0, sqlite_core_1.text)('related_product_ids'),
    meta_title: (0, sqlite_core_1.text)('meta_title'),
    meta_description: (0, sqlite_core_1.text)('meta_description'),
    google_merchant_synced: (0, sqlite_core_1.integer)('google_merchant_synced', { mode: 'boolean' }).default(false).notNull(),
    google_merchant_id: (0, sqlite_core_1.text)('google_merchant_id'),
    gtin: (0, sqlite_core_1.text)('gtin'),
    mpn: (0, sqlite_core_1.text)('mpn'),
    status: (0, sqlite_core_1.text)('status', { enum: ['active', 'inactive', 'archived'] }).default('active').notNull(),
    featured: (0, sqlite_core_1.integer)('featured', { mode: 'boolean' }).default(false).notNull(),
    created_at: (0, sqlite_core_1.text)('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: (0, sqlite_core_1.text)('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
    is_deleted: (0, sqlite_core_1.integer)('is_deleted', { mode: 'boolean' }).default(false).notNull(),
}, (table) => ({
    skuIdx: (0, sqlite_core_1.uniqueIndex)('products_sku_idx').on(table.sku),
    slugIdx: (0, sqlite_core_1.uniqueIndex)('products_slug_idx').on(table.slug),
    categoryIdx: (0, sqlite_core_1.index)('products_category_idx').on(table.category),
    statusIdx: (0, sqlite_core_1.index)('products_status_idx').on(table.status),
    makeIdx: (0, sqlite_core_1.index)('products_make_idx').on(table.make),
    makeIdIdx: (0, sqlite_core_1.index)('products_make_id_idx').on(table.make_id),
    modelIdIdx: (0, sqlite_core_1.index)('products_model_id_idx').on(table.model_id),
    featuredIdx: (0, sqlite_core_1.index)('products_featured_idx').on(table.featured),
}));
// ─── Product Images ───────────────────────────────────────────────────────────
exports.productImages = (0, sqlite_core_1.sqliteTable)('product_images', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_id: (0, sqlite_core_1.text)('product_id').notNull().references(() => exports.products.id, { onDelete: 'cascade' }),
    image_path: (0, sqlite_core_1.text)('image_path').notNull(),
    alt_text: (0, sqlite_core_1.text)('alt_text'),
    sort_order: (0, sqlite_core_1.integer)('sort_order').default(0).notNull(),
    created_at: (0, sqlite_core_1.text)('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    productIdIdx: (0, sqlite_core_1.index)('product_images_product_id_idx').on(table.product_id),
}));
// ─── Product Compatibility ────────────────────────────────────────────────────
exports.productCompatibility = (0, sqlite_core_1.sqliteTable)('product_compatibility', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_id: (0, sqlite_core_1.text)('product_id').notNull().references(() => exports.products.id, { onDelete: 'cascade' }),
    make: (0, sqlite_core_1.text)('make').notNull(),
    model: (0, sqlite_core_1.text)('model').notNull(),
    year_start: (0, sqlite_core_1.integer)('year_start'),
    year_end: (0, sqlite_core_1.integer)('year_end'),
    notes: (0, sqlite_core_1.text)('notes'),
}, (table) => ({
    productIdIdx: (0, sqlite_core_1.index)('product_compat_product_id_idx').on(table.product_id),
    makeModelIdx: (0, sqlite_core_1.index)('product_compat_make_model_idx').on(table.make, table.model),
}));
// ─── Orders ───────────────────────────────────────────────────────────────────
exports.orders = (0, sqlite_core_1.sqliteTable)('orders', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    order_number: (0, sqlite_core_1.text)('order_number').notNull().unique(),
    customer_email: (0, sqlite_core_1.text)('customer_email').notNull(),
    customer_first_name: (0, sqlite_core_1.text)('customer_first_name').notNull(),
    customer_last_name: (0, sqlite_core_1.text)('customer_last_name').notNull(),
    customer_phone: (0, sqlite_core_1.text)('customer_phone'),
    // Shipping address
    shipping_line1: (0, sqlite_core_1.text)('shipping_line1').notNull(),
    shipping_line2: (0, sqlite_core_1.text)('shipping_line2'),
    shipping_city: (0, sqlite_core_1.text)('shipping_city').notNull(),
    shipping_state: (0, sqlite_core_1.text)('shipping_state').notNull(),
    shipping_zip: (0, sqlite_core_1.text)('shipping_zip').notNull(),
    shipping_country: (0, sqlite_core_1.text)('shipping_country').default('US').notNull(),
    shipping_type: (0, sqlite_core_1.text)('shipping_type').notNull(),
    // Billing address
    billing_line1: (0, sqlite_core_1.text)('billing_line1'),
    billing_line2: (0, sqlite_core_1.text)('billing_line2'),
    billing_city: (0, sqlite_core_1.text)('billing_city'),
    billing_state: (0, sqlite_core_1.text)('billing_state'),
    billing_zip: (0, sqlite_core_1.text)('billing_zip'),
    billing_country: (0, sqlite_core_1.text)('billing_country').default('US'),
    subtotal_cents: (0, sqlite_core_1.integer)('subtotal_cents').notNull(),
    shipping_cents: (0, sqlite_core_1.integer)('shipping_cents').notNull(),
    tax_cents: (0, sqlite_core_1.integer)('tax_cents').default(0).notNull(),
    total_cents: (0, sqlite_core_1.integer)('total_cents').notNull(),
    stripe_payment_intent_id: (0, sqlite_core_1.text)('stripe_payment_intent_id'),
    stripe_charge_id: (0, sqlite_core_1.text)('stripe_charge_id'),
    authorizenet_transaction_id: (0, sqlite_core_1.text)('authorizenet_transaction_id'),
    payment_status: (0, sqlite_core_1.text)('payment_status', {
        enum: ['pending', 'paid', 'failed', 'refunded', 'partially_refunded'],
    }).default('pending').notNull(),
    status: (0, sqlite_core_1.text)('status', {
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
    }).default('pending').notNull(),
    tracking_number: (0, sqlite_core_1.text)('tracking_number'),
    carrier: (0, sqlite_core_1.text)('carrier'),
    shipped_at: (0, sqlite_core_1.text)('shipped_at'),
    delivered_at: (0, sqlite_core_1.text)('delivered_at'),
    customer_notes: (0, sqlite_core_1.text)('customer_notes'),
    admin_notes: (0, sqlite_core_1.text)('admin_notes'),
    created_at: (0, sqlite_core_1.text)('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: (0, sqlite_core_1.text)('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    orderNumberIdx: (0, sqlite_core_1.uniqueIndex)('orders_order_number_idx').on(table.order_number),
    emailIdx: (0, sqlite_core_1.index)('orders_email_idx').on(table.customer_email),
    statusIdx: (0, sqlite_core_1.index)('orders_status_idx').on(table.status),
    paymentStatusIdx: (0, sqlite_core_1.index)('orders_payment_status_idx').on(table.payment_status),
    createdAtIdx: (0, sqlite_core_1.index)('orders_created_at_idx').on(table.created_at),
    stripeIntentIdx: (0, sqlite_core_1.index)('orders_stripe_intent_idx').on(table.stripe_payment_intent_id),
    authorizenetTransIdx: (0, sqlite_core_1.index)('orders_authnet_trans_idx').on(table.authorizenet_transaction_id),
}));
// ─── Order Items ──────────────────────────────────────────────────────────────
exports.orderItems = (0, sqlite_core_1.sqliteTable)('order_items', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    order_id: (0, sqlite_core_1.text)('order_id').notNull().references(() => exports.orders.id, { onDelete: 'cascade' }),
    product_id: (0, sqlite_core_1.text)('product_id').references(() => exports.products.id, { onDelete: 'set null' }),
    quantity: (0, sqlite_core_1.integer)('quantity').default(1).notNull(),
    unit_price_cents: (0, sqlite_core_1.integer)('unit_price_cents').notNull(),
    total_cents: (0, sqlite_core_1.integer)('total_cents').notNull(),
    product_title: (0, sqlite_core_1.text)('product_title').notNull(),
    product_sku: (0, sqlite_core_1.text)('product_sku').notNull(),
}, (table) => ({
    orderIdIdx: (0, sqlite_core_1.index)('order_items_order_id_idx').on(table.order_id),
    productIdIdx: (0, sqlite_core_1.index)('order_items_product_id_idx').on(table.product_id),
}));
// ─── Inventory Log ────────────────────────────────────────────────────────────
exports.inventoryLog = (0, sqlite_core_1.sqliteTable)('inventory_log', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_id: (0, sqlite_core_1.text)('product_id').notNull().references(() => exports.products.id, { onDelete: 'cascade' }),
    previous_quantity: (0, sqlite_core_1.integer)('previous_quantity').notNull(),
    new_quantity: (0, sqlite_core_1.integer)('new_quantity').notNull(),
    change_reason: (0, sqlite_core_1.text)('change_reason'),
    changed_by: (0, sqlite_core_1.text)('changed_by').default('admin').notNull(),
    created_at: (0, sqlite_core_1.text)('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    productIdIdx: (0, sqlite_core_1.index)('inventory_log_product_id_idx').on(table.product_id),
    createdAtIdx: (0, sqlite_core_1.index)('inventory_log_created_at_idx').on(table.created_at),
}));
// ─── Admin Users ──────────────────────────────────────────────────────────────
exports.adminUsers = (0, sqlite_core_1.sqliteTable)('admin_users', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: (0, sqlite_core_1.text)('email').notNull().unique(),
    password_hash: (0, sqlite_core_1.text)('password_hash').notNull(),
    name: (0, sqlite_core_1.text)('name').notNull(),
    role: (0, sqlite_core_1.text)('role', { enum: ['admin', 'super_admin'] }).default('admin').notNull(),
    last_login_at: (0, sqlite_core_1.text)('last_login_at'),
    created_at: (0, sqlite_core_1.text)('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    emailIdx: (0, sqlite_core_1.uniqueIndex)('admin_users_email_idx').on(table.email),
}));
// ─── Sale Conditions ──────────────────────────────────────────────────────────
exports.saleConditions = (0, sqlite_core_1.sqliteTable)('sale_conditions', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    rule_key: (0, sqlite_core_1.text)('rule_key').notNull().unique(),
    rule_value: (0, sqlite_core_1.text)('rule_value').notNull(),
    description: (0, sqlite_core_1.text)('description'),
    is_active: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true).notNull(),
    updated_at: (0, sqlite_core_1.text)('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    ruleKeyIdx: (0, sqlite_core_1.uniqueIndex)('sale_conditions_rule_key_idx').on(table.rule_key),
}));
// ─── Blog Posts ───────────────────────────────────────────────────────────────
exports.blogPosts = (0, sqlite_core_1.sqliteTable)('blog_posts', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    slug: (0, sqlite_core_1.text)('slug').notNull().unique(),
    title: (0, sqlite_core_1.text)('title').notNull(),
    content: (0, sqlite_core_1.text)('content').notNull(),
    excerpt: (0, sqlite_core_1.text)('excerpt'),
    featured_image_path: (0, sqlite_core_1.text)('featured_image_path'),
    status: (0, sqlite_core_1.text)('status', { enum: ['draft', 'published'] }).default('draft').notNull(),
    meta_title: (0, sqlite_core_1.text)('meta_title'),
    meta_description: (0, sqlite_core_1.text)('meta_description'),
    published_at: (0, sqlite_core_1.text)('published_at'),
    created_at: (0, sqlite_core_1.text)('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: (0, sqlite_core_1.text)('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    slugIdx: (0, sqlite_core_1.uniqueIndex)('blog_posts_slug_idx').on(table.slug),
    statusIdx: (0, sqlite_core_1.index)('blog_posts_status_idx').on(table.status),
    publishedAtIdx: (0, sqlite_core_1.index)('blog_posts_published_at_idx').on(table.published_at),
}));
// ─── Email Log ────────────────────────────────────────────────────────────────
exports.emailLog = (0, sqlite_core_1.sqliteTable)('email_log', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    order_id: (0, sqlite_core_1.text)('order_id').references(() => exports.orders.id, { onDelete: 'set null' }),
    recipient_email: (0, sqlite_core_1.text)('recipient_email').notNull(),
    template_used: (0, sqlite_core_1.text)('template_used'),
    subject: (0, sqlite_core_1.text)('subject').notNull(),
    body_content: (0, sqlite_core_1.text)('body_content'),
    has_attachment: (0, sqlite_core_1.integer)('has_attachment', { mode: 'boolean' }).default(false).notNull(),
    sent_at: (0, sqlite_core_1.text)('sent_at').notNull().$defaultFn(() => new Date().toISOString()),
    status: (0, sqlite_core_1.text)('status', { enum: ['sent', 'failed', 'bounced'] }).default('sent').notNull(),
}, (table) => ({
    orderIdIdx: (0, sqlite_core_1.index)('email_log_order_id_idx').on(table.order_id),
    recipientIdx: (0, sqlite_core_1.index)('email_log_recipient_idx').on(table.recipient_email),
    sentAtIdx: (0, sqlite_core_1.index)('email_log_sent_at_idx').on(table.sent_at),
}));
// ─── Shipping Zones ───────────────────────────────────────────────────────────
exports.shippingZones = (0, sqlite_core_1.sqliteTable)('shipping_zones', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    state_code: (0, sqlite_core_1.text)('state_code'),
    city: (0, sqlite_core_1.text)('city'),
    zone_type: (0, sqlite_core_1.text)('zone_type', { enum: ['forklift', 'no_forklift', 'liftgate', 'residential_delivery'] }).notNull(),
    rate_cents: (0, sqlite_core_1.integer)('rate_cents').notNull(),
    is_active: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true).notNull(),
}, (table) => ({
    zoneTypeIdx: (0, sqlite_core_1.index)('shipping_zones_zone_type_idx').on(table.zone_type),
    stateCodeIdx: (0, sqlite_core_1.index)('shipping_zones_state_code_idx').on(table.state_code),
    isActiveIdx: (0, sqlite_core_1.index)('shipping_zones_is_active_idx').on(table.is_active),
}));
// ─── Email Templates ──────────────────────────────────────────────────────────
exports.emailTemplates = (0, sqlite_core_1.sqliteTable)('email_templates', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    template_name: (0, sqlite_core_1.text)('template_name').notNull().unique(),
    subject_template: (0, sqlite_core_1.text)('subject_template'),
    html_template: (0, sqlite_core_1.text)('html_template').notNull(),
    is_active: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true).notNull(),
    description: (0, sqlite_core_1.text)('description'),
    created_at: (0, sqlite_core_1.text)('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: (0, sqlite_core_1.text)('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    templateNameIdx: (0, sqlite_core_1.uniqueIndex)('email_templates_name_idx').on(table.template_name),
    isActiveIdx: (0, sqlite_core_1.index)('email_templates_is_active_idx').on(table.is_active),
}));
// ─── Subscriptions ────────────────────────────────────────────────────────────
exports.subscriptions = (0, sqlite_core_1.sqliteTable)('subscriptions', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: (0, sqlite_core_1.text)('email').notNull().unique(),
    first_name: (0, sqlite_core_1.text)('first_name'),
    last_name: (0, sqlite_core_1.text)('last_name'),
    source: (0, sqlite_core_1.text)('source', { enum: ['footer', 'checkout', 'popup'] }).default('footer').notNull(),
    subscribed_at: (0, sqlite_core_1.text)('subscribed_at').notNull().$defaultFn(() => new Date().toISOString()),
    is_active: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true).notNull(),
}, (table) => ({
    emailIdx: (0, sqlite_core_1.uniqueIndex)('subscriptions_email_idx').on(table.email),
    isActiveIdx: (0, sqlite_core_1.index)('subscriptions_is_active_idx').on(table.is_active),
    sourceIdx: (0, sqlite_core_1.index)('subscriptions_source_idx').on(table.source),
}));
// ─── Navbar Settings ──────────────────────────────────────────────────────────
exports.navbarSettings = (0, sqlite_core_1.sqliteTable)('navbar_settings', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    setting_key: (0, sqlite_core_1.text)('setting_key').notNull().unique(),
    setting_value: (0, sqlite_core_1.text)('setting_value').notNull(),
    description: (0, sqlite_core_1.text)('description'),
    is_active: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true).notNull(),
    updated_at: (0, sqlite_core_1.text)('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    settingKeyIdx: (0, sqlite_core_1.uniqueIndex)('navbar_settings_key_idx').on(table.setting_key),
}));
// ─── Order Notification Recipients ────────────────────────────────────────────
exports.orderNotificationRecipients = (0, sqlite_core_1.sqliteTable)('order_notification_recipients', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    email: (0, sqlite_core_1.text)('email').notNull(),
    name: (0, sqlite_core_1.text)('name'),
    is_active: (0, sqlite_core_1.integer)('is_active', { mode: 'boolean' }).default(true).notNull(),
    sort_order: (0, sqlite_core_1.integer)('sort_order').default(0).notNull(),
    created_at: (0, sqlite_core_1.text)('created_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    isActiveIdx: (0, sqlite_core_1.index)('order_notification_recipients_is_active_idx').on(table.is_active),
    sortOrderIdx: (0, sqlite_core_1.index)('order_notification_recipients_sort_idx').on(table.sort_order),
}));
// ─── Reviews ───────────────────────────────────────────────────────────────────
exports.reviews = (0, sqlite_core_1.sqliteTable)('reviews', {
    id: (0, sqlite_core_1.text)('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
    product_id: (0, sqlite_core_1.text)('product_id').notNull().references(() => exports.products.id, { onDelete: 'cascade' }),
    order_id: (0, sqlite_core_1.text)('order_id').notNull().references(() => exports.orders.id, { onDelete: 'cascade' }),
    customer_name: (0, sqlite_core_1.text)('customer_name').notNull(),
    customer_email: (0, sqlite_core_1.text)('customer_email').notNull(),
    rating: (0, sqlite_core_1.integer)('rating').notNull(),
    title: (0, sqlite_core_1.text)('title'),
    content: (0, sqlite_core_1.text)('content').notNull(),
    images: (0, sqlite_core_1.text)('images').default('[]'),
    status: (0, sqlite_core_1.text)('status', { enum: ['approved', 'pending', 'rejected'] }).default('approved').notNull(),
    is_featured: (0, sqlite_core_1.integer)('is_featured', { mode: 'boolean' }).default(false).notNull(),
    sort_order: (0, sqlite_core_1.integer)('sort_order').default(0),
    created_at: (0, sqlite_core_1.text)('created_at').notNull().$defaultFn(() => new Date().toISOString()),
    updated_at: (0, sqlite_core_1.text)('updated_at').notNull().$defaultFn(() => new Date().toISOString()),
}, (table) => ({
    productIdIdx: (0, sqlite_core_1.index)('reviews_product_id_idx').on(table.product_id),
    orderIdIdx: (0, sqlite_core_1.index)('reviews_order_id_idx').on(table.order_id),
    emailIdx: (0, sqlite_core_1.index)('reviews_customer_email_idx').on(table.customer_email),
    statusIdx: (0, sqlite_core_1.index)('reviews_status_idx').on(table.status),
    featuredIdx: (0, sqlite_core_1.index)('reviews_is_featured_idx').on(table.is_featured),
    ratingIdx: (0, sqlite_core_1.index)('reviews_rating_idx').on(table.rating),
}));
//# sourceMappingURL=schema.js.map