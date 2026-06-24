import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';
import 'dotenv/config';

// Load env first (before importing database which relies on it)
import { env } from './env';
import { sqlite } from './database';

async function migrate(): Promise<void> {
  console.log('Starting database migration...');

  // Ensure data directory exists
  const dbDir = path.dirname(path.resolve(env.DATABASE_PATH));
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  // Create all tables
  sqlite.exec(`
    CREATE TABLE IF NOT EXISTS makes (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      year_range_min INTEGER DEFAULT 1980,
      year_range_max INTEGER DEFAULT 2025,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS models (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      slug TEXT NOT NULL,
      make_id TEXT NOT NULL REFERENCES makes(id) ON DELETE CASCADE,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      sku TEXT NOT NULL UNIQUE,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      description TEXT,
      short_description TEXT,
      category TEXT NOT NULL CHECK(category IN ('engine','transmission','part')),
      price_cents INTEGER NOT NULL,
      compare_at_price_cents INTEGER,
      make TEXT,
      model TEXT,
      year_start INTEGER,
      year_end INTEGER,
      engine_code TEXT,
      displacement TEXT,
      cylinders INTEGER,
      fuel_type TEXT,
      transmission_type TEXT,
      quantity INTEGER NOT NULL DEFAULT 0,
      max_per_order INTEGER NOT NULL DEFAULT 1,
      low_stock_threshold INTEGER NOT NULL DEFAULT 1,
      show_when_out_of_stock INTEGER NOT NULL DEFAULT 0,
      primary_image_path TEXT,
      mileage_km INTEGER,
      condition TEXT,
      condition_notes TEXT,
      specs_json TEXT,
      warranty_summary TEXT,
      related_product_ids TEXT,
      meta_title TEXT,
      meta_description TEXT,
      google_merchant_synced INTEGER NOT NULL DEFAULT 0,
      google_merchant_id TEXT,
      gtin TEXT,
      mpn TEXT,
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','inactive','archived')),
      featured INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS product_images (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      image_path TEXT NOT NULL,
      alt_text TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS product_compatibility (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      year_start INTEGER,
      year_end INTEGER,
      notes TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      order_number TEXT NOT NULL UNIQUE,
      customer_email TEXT NOT NULL,
      customer_first_name TEXT NOT NULL,
      customer_last_name TEXT NOT NULL,
      customer_phone TEXT,
      shipping_line1 TEXT NOT NULL,
      shipping_line2 TEXT,
      shipping_city TEXT NOT NULL,
      shipping_state TEXT NOT NULL,
      shipping_zip TEXT NOT NULL,
      shipping_country TEXT NOT NULL DEFAULT 'US',
      shipping_type TEXT NOT NULL,
      billing_line1 TEXT,
      billing_line2 TEXT,
      billing_city TEXT,
      billing_state TEXT,
      billing_zip TEXT,
      billing_country TEXT DEFAULT 'US',
      subtotal_cents INTEGER NOT NULL,
      shipping_cents INTEGER NOT NULL,
      tax_cents INTEGER NOT NULL DEFAULT 0,
      total_cents INTEGER NOT NULL,
      stripe_payment_intent_id TEXT,
      stripe_charge_id TEXT,
      authorizenet_transaction_id TEXT,
      payment_status TEXT NOT NULL DEFAULT 'pending' CHECK(payment_status IN ('pending','paid','failed','refunded','partially_refunded')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','processing','shipped','delivered','cancelled','refunded')),
      tracking_number TEXT,
      carrier TEXT,
      shipped_at TEXT,
      delivered_at TEXT,
      customer_notes TEXT,
      admin_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      product_id TEXT REFERENCES products(id) ON DELETE SET NULL,
      quantity INTEGER NOT NULL DEFAULT 1,
      unit_price_cents INTEGER NOT NULL,
      total_cents INTEGER NOT NULL,
      product_title TEXT NOT NULL,
      product_sku TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS inventory_log (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      previous_quantity INTEGER NOT NULL,
      new_quantity INTEGER NOT NULL,
      change_reason TEXT,
      changed_by TEXT NOT NULL DEFAULT 'admin',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin' CHECK(role IN ('admin','super_admin')),
      last_login_at TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sale_conditions (
      id TEXT PRIMARY KEY,
      rule_key TEXT NOT NULL UNIQUE,
      rule_value TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS blog_posts (
      id TEXT PRIMARY KEY,
      slug TEXT NOT NULL UNIQUE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      excerpt TEXT,
      featured_image_path TEXT,
      status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published')),
      meta_title TEXT,
      meta_description TEXT,
      published_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS email_log (
      id TEXT PRIMARY KEY,
      order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
      recipient_email TEXT NOT NULL,
      template_used TEXT,
      subject TEXT NOT NULL,
      body_content TEXT,
      has_attachment INTEGER NOT NULL DEFAULT 0,
      sent_at TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'sent' CHECK(status IN ('sent','failed','bounced'))
    );

    CREATE TABLE IF NOT EXISTS shipping_zones (
      id TEXT PRIMARY KEY,
      state_code TEXT,
      city TEXT,
      zone_type TEXT NOT NULL CHECK(zone_type IN ('forklift','no_forklift','liftgate','business','residential')),
      rate_cents INTEGER NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS email_templates (
      id TEXT PRIMARY KEY,
      template_name TEXT NOT NULL UNIQUE,
      subject_template TEXT,
      html_template TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      description TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS subscriptions (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      first_name TEXT,
      last_name TEXT,
      source TEXT NOT NULL DEFAULT 'footer' CHECK(source IN ('footer','checkout','popup')),
      subscribed_at TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS navbar_settings (
      id TEXT PRIMARY KEY,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      description TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS order_notification_recipients (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      name TEXT,
      is_active INTEGER NOT NULL DEFAULT 1,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      customer_name TEXT NOT NULL,
      customer_email TEXT NOT NULL,
      rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
      title TEXT DEFAULT '',
      content TEXT NOT NULL,
      images TEXT DEFAULT '[]',
      status TEXT NOT NULL DEFAULT 'approved' CHECK(status IN ('approved','pending','rejected')),
      is_featured INTEGER NOT NULL DEFAULT 0,
      sort_order INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  console.log('Tables created.');

  // Idempotent ALTER TABLE: add new product columns if they don't exist yet.
  // (SQLite ignores duplicate column adds via PRAGMA check.)
  const productCols = sqlite.prepare(`PRAGMA table_info(products)`).all() as Array<{ name: string }>;
  const colNames = new Set(productCols.map((c) => c.name));
  const newCols: Array<[string, string]> = [
    ['mileage_km', 'INTEGER'],
    ['condition', 'TEXT'],
    ['condition_notes', 'TEXT'],
    ['specs_json', 'TEXT'],
    ['warranty_summary', 'TEXT'],
    ['related_product_ids', 'TEXT'],
  ];
  for (const [name, type] of newCols) {
    if (!colNames.has(name)) {
      sqlite.exec(`ALTER TABLE products ADD COLUMN ${name} ${type}`);
      console.log(`Added column: products.${name}`);
    }
  }

  // Idempotent ALTER TABLE: add new order columns if they don't exist yet.
  const orderCols = sqlite.prepare(`PRAGMA table_info(orders)`).all() as Array<{ name: string }>;
  const orderColNames = new Set(orderCols.map((c) => c.name));
  if (!orderColNames.has('authorizenet_transaction_id')) {
    sqlite.exec(`ALTER TABLE orders ADD COLUMN authorizenet_transaction_id TEXT`);
    console.log(`Added column: orders.authorizenet_transaction_id`);
  }

  // Idempotent ALTER TABLE: add body_content to email_log if missing
  const emailLogCols = sqlite.prepare(`PRAGMA table_info(email_log)`).all() as Array<{ name: string }>;
  const emailLogColNames = new Set(emailLogCols.map((c) => c.name));
  if (!emailLogColNames.has('body_content')) {
    sqlite.exec(`ALTER TABLE email_log ADD COLUMN body_content TEXT`);
    console.log(`Added column: email_log.body_content`);
  }
  if (!emailLogColNames.has('has_attachment')) {
    sqlite.exec(`ALTER TABLE email_log ADD COLUMN has_attachment INTEGER NOT NULL DEFAULT 0`);
    console.log(`Added column: email_log.has_attachment`);
  }

  // Create FTS5 virtual table for full-text search on products.
  // Stand-alone (non-external-content) so we own the row data and don't crash
  // when the products table layout drifts from the FTS columns.
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS products_fts USING fts5(
      product_id UNINDEXED,
      title,
      description,
      sku,
      make,
      model,
      engine_code
    );
  `);

  // If an older external-content FTS table exists, drop and recreate it so
  // search queries don't fail with "no such column: T.product_id".
  try {
    const ftsSchema = sqlite
      .prepare(`SELECT sql FROM sqlite_master WHERE type='table' AND name='products_fts'`)
      .get() as { sql?: string } | undefined;
    if (ftsSchema?.sql && ftsSchema.sql.includes("content='products'")) {
      console.log('Dropping legacy external-content FTS table...');
      sqlite.exec('DROP TABLE products_fts;');
      sqlite.exec(`
        CREATE VIRTUAL TABLE products_fts USING fts5(
          product_id UNINDEXED,
          title,
          description,
          sku,
          make,
          model,
          engine_code
        );
      `);
    }
  } catch (err) {
    console.warn('FTS recreate check failed:', err);
  }

  console.log('FTS5 virtual table created.');

  // Create additional indexes
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS products_category_idx ON products(category);
    CREATE INDEX IF NOT EXISTS products_status_idx ON products(status);
    CREATE INDEX IF NOT EXISTS products_make_idx ON products(make);
    CREATE INDEX IF NOT EXISTS products_featured_idx ON products(featured);
    CREATE INDEX IF NOT EXISTS product_images_product_id_idx ON product_images(product_id);
    CREATE INDEX IF NOT EXISTS product_compat_product_id_idx ON product_compatibility(product_id);
    CREATE INDEX IF NOT EXISTS product_compat_make_model_idx ON product_compatibility(make, model);
    CREATE INDEX IF NOT EXISTS orders_email_idx ON orders(customer_email);
    CREATE INDEX IF NOT EXISTS orders_status_idx ON orders(status);
    CREATE INDEX IF NOT EXISTS orders_payment_status_idx ON orders(payment_status);
    CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at);
    CREATE INDEX IF NOT EXISTS orders_stripe_intent_idx ON orders(stripe_payment_intent_id);
    CREATE INDEX IF NOT EXISTS orders_authnet_trans_idx ON orders(authorizenet_transaction_id);
    CREATE INDEX IF NOT EXISTS order_items_order_id_idx ON order_items(order_id);
    CREATE INDEX IF NOT EXISTS order_items_product_id_idx ON order_items(product_id);
    CREATE INDEX IF NOT EXISTS inventory_log_product_id_idx ON inventory_log(product_id);
    CREATE INDEX IF NOT EXISTS inventory_log_created_at_idx ON inventory_log(created_at);
    CREATE INDEX IF NOT EXISTS email_log_order_id_idx ON email_log(order_id);
    CREATE INDEX IF NOT EXISTS email_log_recipient_idx ON email_log(recipient_email);
    CREATE INDEX IF NOT EXISTS email_log_sent_at_idx ON email_log(sent_at);
    CREATE INDEX IF NOT EXISTS shipping_zones_zone_type_idx ON shipping_zones(zone_type);
    CREATE INDEX IF NOT EXISTS shipping_zones_is_active_idx ON shipping_zones(is_active);
    CREATE INDEX IF NOT EXISTS email_templates_name_idx ON email_templates(template_name);
    CREATE INDEX IF NOT EXISTS email_templates_is_active_idx ON email_templates(is_active);
    CREATE INDEX IF NOT EXISTS subscriptions_email_idx ON subscriptions(email);
    CREATE INDEX IF NOT EXISTS subscriptions_is_active_idx ON subscriptions(is_active);
    CREATE INDEX IF NOT EXISTS subscriptions_source_idx ON subscriptions(source);
    CREATE INDEX IF NOT EXISTS navbar_settings_key_idx ON navbar_settings(setting_key);
    CREATE INDEX IF NOT EXISTS order_notification_recipients_is_active_idx ON order_notification_recipients(is_active);
    CREATE INDEX IF NOT EXISTS order_notification_recipients_sort_idx ON order_notification_recipients(sort_order);
  `);

  console.log('Indexes created.');

  // ── Makes & models indexes ──
  sqlite.exec(`
    CREATE INDEX IF NOT EXISTS makes_sort_order_idx ON makes(sort_order);
    CREATE INDEX IF NOT EXISTS models_make_id_idx ON models(make_id);
    CREATE INDEX IF NOT EXISTS models_make_id_name_idx ON models(make_id, name);
    CREATE INDEX IF NOT EXISTS models_slug_idx ON models(slug);

    CREATE INDEX IF NOT EXISTS reviews_product_id_idx ON reviews(product_id);
    CREATE INDEX IF NOT EXISTS reviews_order_id_idx ON reviews(order_id);
    CREATE INDEX IF NOT EXISTS reviews_customer_email_idx ON reviews(customer_email);
    CREATE INDEX IF NOT EXISTS reviews_status_idx ON reviews(status);
    CREATE INDEX IF NOT EXISTS reviews_is_featured_idx ON reviews(is_featured);
    CREATE INDEX IF NOT EXISTS reviews_rating_idx ON reviews(rating);
  `);

  // ── Migrate vehicle_data from sale_conditions to makes/models tables ──
  const vehicleRow = sqlite.prepare(`SELECT rule_value FROM sale_conditions WHERE rule_key = 'vehicle_data'`).get() as { rule_value?: string } | undefined;
  if (vehicleRow?.rule_value) {
    try {
      const vehicleData = JSON.parse(vehicleRow.rule_value);
      if (Array.isArray(vehicleData)) {
        const existingMakes = new Set(
          (sqlite.prepare(`SELECT name FROM makes`).all() as Array<{ name: string }>).map(r => r.name.toLowerCase())
        );
        const insertMake = sqlite.prepare(`
          INSERT OR IGNORE INTO makes (id, name, slug, year_range_min, year_range_max, sort_order, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        const insertModel = sqlite.prepare(`
          INSERT OR IGNORE INTO models (id, name, slug, make_id, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `);

        for (let i = 0; i < vehicleData.length; i++) {
          const m = vehicleData[i];
          if (!m.name) continue;
          if (existingMakes.has(m.name.toLowerCase())) continue;

          const makeId = crypto.randomUUID();
          const now = new Date().toISOString();
          const makeSlug = m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
          insertMake.run(makeId, m.name, makeSlug, m.yearRange?.min ?? 1980, m.yearRange?.max ?? 2025, i, now, now);

          if (Array.isArray(m.models)) {
            for (const modelName of m.models) {
              if (!modelName) continue;
              const modelSlug = modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
              insertModel.run(crypto.randomUUID(), modelName, modelSlug, makeId, now, now);
            }
          }
          existingMakes.add(m.name.toLowerCase());
        }
        console.log(`Migrated ${vehicleData.length} makes + models from vehicle_data.`);
      }
    } catch (err) {
      console.warn('Failed to migrate vehicle_data to makes/models:', err);
    }
  }

  // ── Add make_id / model_id to products (idempotent) ──
  const prodColsAfter = sqlite.prepare(`PRAGMA table_info(products)`).all() as Array<{ name: string }>;
  const prodColNamesAfter = new Set(prodColsAfter.map((c) => c.name));
  if (!prodColNamesAfter.has('make_id')) {
    sqlite.exec(`ALTER TABLE products ADD COLUMN make_id TEXT REFERENCES makes(id) ON DELETE SET NULL`);
    console.log('Added column: products.make_id');
  }
  if (!prodColNamesAfter.has('model_id')) {
    sqlite.exec(`ALTER TABLE products ADD COLUMN model_id TEXT REFERENCES models(id) ON DELETE SET NULL`);
    console.log('Added column: products.model_id');
  }

  // Create indexes for the new columns (must be after ALTER TABLE)
  const prodColsFinal = sqlite.prepare(`PRAGMA table_info(products)`).all() as Array<{ name: string }>;
  const prodColNamesFinal = new Set(prodColsFinal.map((c) => c.name));
  if (prodColNamesFinal.has('make_id')) {
    sqlite.exec(`CREATE INDEX IF NOT EXISTS products_make_id_idx ON products(make_id)`);
  }
  if (prodColNamesFinal.has('model_id')) {
    sqlite.exec(`CREATE INDEX IF NOT EXISTS products_model_id_idx ON products(model_id)`);
  }

  // ── Migrate existing product make/model text to FK IDs ──
  const productsToMigrate = sqlite.prepare(`
    SELECT id, make, model FROM products WHERE make IS NOT NULL OR model IS NOT NULL
  `).all() as Array<{ id: string; make: string | null; model: string | null }>;

  if (productsToMigrate.length > 0) {
    const updateProductMakeModel = (stmt: any) => (productId: string, makeId: string | null, modelId: string | null) => {
      stmt.run(makeId, modelId, productId);
    };

    const updateStmt = sqlite.prepare(`UPDATE products SET make_id = ?, model_id = ? WHERE id = ?`);
    let migrated = 0;

    for (const p of productsToMigrate) {
      let makeId: string | null = null;
      let modelId: string | null = null;

      if (p.make) {
        const makeRow = sqlite.prepare(`SELECT id FROM makes WHERE LOWER(name) = LOWER(?)`).get(p.make) as { id: string } | undefined;
        if (makeRow) makeId = makeRow.id;
      }
      if (p.model && makeId) {
        const modelRow = sqlite.prepare(`SELECT id FROM models WHERE LOWER(name) = LOWER(?) AND make_id = ?`).get(p.model, makeId) as { id: string } | undefined;
        if (modelRow) modelId = modelRow.id;
      }

      if (makeId || modelId) {
        updateProductMakeModel(updateStmt)(p.id, makeId, modelId);
        migrated++;
      }
    }
    console.log(`Migrated ${migrated} products to make_id / model_id.`);
  }

  // Insert default sale conditions
  const now = new Date().toISOString();
  const insertCondition = sqlite.prepare(`
    INSERT OR IGNORE INTO sale_conditions (id, rule_key, rule_value, description, is_active, updated_at)
    VALUES (?, ?, ?, ?, 1, ?)
  `);

  insertCondition.run(
    crypto.randomUUID(),
    'max_items_per_product',
    '1',
    'Maximum number of units a customer can purchase of a single product per order',
    now,
  );
  insertCondition.run(
    crypto.randomUUID(),
    'show_out_of_stock',
    '0',
    'Whether to display out-of-stock products on the storefront',
    now,
  );
  insertCondition.run(
    crypto.randomUUID(),
    'max_inventory_per_restock',
    '5',
    'Maximum quantity allowed per restock operation',
    now,
  );

  console.log('Default sale conditions inserted.');

  // Insert site settings (using same sale_conditions table as key-value store)
  const siteSettings = [
    ['contact_phone', '(555) 123-4567', 'Business phone number'],
    ['contact_email', 'info@jdmtokyomotors.com', 'Business email address'],
    ['contact_address', '123 Motor St, Los Angeles, CA 90001', 'Business address'],
    ['hours_weekdays', '9:00 AM - 6:00 PM', 'Weekday business hours'],
    ['hours_saturday', '10:00 AM - 4:00 PM', 'Saturday business hours'],
    ['hours_sunday', 'Closed', 'Sunday business hours'],
    ['social_instagram', '', 'Instagram URL (empty = hidden)'],
    ['social_facebook', '', 'Facebook URL (empty = hidden)'],
    ['social_tiktok', '', 'TikTok URL (empty = hidden)'],
    ['social_x', '', 'X/Twitter URL (empty = hidden)'],
    ['footer_description', '', 'Footer company description override'],
    ['announcement_enabled', '0', 'Whether the announcement bar is active'],
    ['announcement_message', '', 'Announcement bar message text'],
    ['about_story_p1', '', 'About page story paragraph 1'],
    ['about_story_p2', '', 'About page story paragraph 2'],
    ['about_story_p3', '', 'About page story paragraph 3'],
    ['about_value_quality_title', 'Unmatched Quality', 'About value card 1 title'],
    ['about_value_quality_desc', '', 'About value card 1 description'],
    ['about_value_warranty_title', '30-Day Warranty', 'About value card 2 title'],
    ['about_value_warranty_desc', '', 'About value card 2 description'],
    ['about_value_source_title', 'Direct From Japan', 'About value card 3 title'],
    ['about_value_source_desc', '', 'About value card 3 description'],
    ['about_value_mileage_title', 'Low Mileage', 'About value card 4 title'],
    ['about_value_mileage_desc', '', 'About value card 4 description'],
    ['about_value_support_title', 'Expert Support', 'About value card 5 title'],
    ['about_value_support_desc', '', 'About value card 5 description'],
    ["reviews_enabled", "1", "Show customer reviews section on homepage"],
    ["reviews_mode", "automatic", "Homepage review mode: automatic or manual"],
    ["reviews_title", "Customer Reviews", "Homepage review section title"],
    ["reviews_subtitle", "What our customers say about their JDM engines and transmissions", "Homepage review section subtitle"],
    ['about_value_shipping_title', 'Fast Shipping', 'About value card 6 title'],
    ['about_value_shipping_desc', '', 'About value card 6 description'],
    ['policy_warranty', JSON.stringify([
      { title: '30-Day Warranty on All Units', content: 'JDM Tokyo Motorsports warrants all engines and transmissions against defects in materials and workmanship for 30 days from the date of delivery. If your unit fails within this period due to a covered defect, we will replace it or provide a full refund.' },
      { title: 'What Is Covered', content: 'Compression failures not disclosed at time of sale.\n\nInternal mechanical defects present at time of shipment.\n\nIncorrect unit shipped (wrong engine code or model).\n\nUnits with undisclosed damage discovered upon inspection.\n\nSignificant mileage discrepancy from listed specification.' },
      { title: 'What Is Not Covered', content: 'Damage caused by improper installation or modification.\n\nNormal wear and tear during operation.\n\nDamage caused by overheating, lack of oil, or coolant issues after installation.\n\nExternal components such as sensors, wiring harnesses, or accessories.' },
      { title: 'How to File a Claim', content: '1. Contact our team by phone (+1 800 536-8669) or email (sales@jdmtokyomotors.com) within 30 days of delivery.\n\n2. Provide your order number, photos of the unit, and a description of the issue.\n\n3. Our team will review your claim within 1–2 business days and provide a resolution.\n\n4. Approved claims will receive a replacement unit or full refund processed through Stripe.' },
      { title: 'Warranty Duration', content: 'The warranty period begins on the date of delivery as confirmed by the freight carrier. Claims must be submitted within 30 calendar days of delivery to be eligible.' },
    ]), 'Warranty policy (JSON sections)'],
    ['policy_shipping', JSON.stringify([
      { title: 'Shipping Rates', content: 'Business Address — $500: Delivery to a commercial address with a loading dock or forklift. Fastest and most affordable option for shop owners and businesses.\n\nResidential Address — $700: Delivery to a home or residential address. Includes liftgate service for safe unloading at your driveway.' },
      { title: 'Shipping Carriers', content: 'We partner with trusted freight carriers to ensure safe delivery of your engine or transmission.\n\nForward Air\n\nXPO Logistics\n\nEstes Express Lines' },
      { title: 'Delivery Timeline', content: 'Order Processing (1–2 Business Days): After payment is confirmed, your order is processed and the unit is prepared for shipping.\n\nTransit Time (3–7 Business Days): Freight transit times vary by destination. West Coast orders typically arrive faster than East Coast.\n\nTracking Notification: You will receive tracking information via email once your order ships from our facility.' },
      { title: 'Important Shipping Notes', content: 'All engines and transmissions are palletized and wrapped for safe transit. You will need to inspect your shipment upon delivery and note any visible damage on the bill of lading before signing. Contact us immediately if damage is discovered.' },
    ]), 'Shipping policy (JSON sections)'],
    ['policy_privacy', JSON.stringify([
      { title: 'Information We Collect', content: 'We collect information you provide directly to us, including your name, email address, phone number, shipping address, and payment information when you place an order. We also collect technical information about your device and browsing behavior to improve our website.' },
      { title: 'How We Use Your Information', content: 'We use the information we collect to process your orders, send order confirmations and shipping notifications, respond to your inquiries, improve our website and services, and send promotional communications if you have opted in.' },
      { title: 'Information Sharing', content: 'We do not sell your personal information. We share your information only with service providers who help us operate our business (such as Stripe for payment processing and freight carriers for delivery), and when required by law.' },
      { title: 'Cookies and Tracking', content: 'We use cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and analyze website traffic. You can control cookie settings through your browser preferences.' },
      { title: 'Data Security', content: 'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, loss, or disclosure. Payment information is processed securely by Stripe and is never stored on our servers.' },
      { title: 'Your Rights', content: 'You have the right to access, correct, or delete your personal information. You may also opt out of promotional communications at any time by clicking the unsubscribe link in any email or contacting us directly.' },
      { title: 'Contact Us', content: 'If you have questions about this Privacy Policy, please contact us at sales@jdmtokyomotors.com or call +1 (800) 536-8669. We are available Monday through Friday, 9:00 AM to 5:00 PM PST.' },
    ]), 'Privacy policy (JSON sections)'],
    ['policy_terms', JSON.stringify([
      { title: 'Acceptance of Terms', content: 'By accessing and using the JDM Tokyo Motorsports website, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our website or purchase our products.' },
      { title: 'Products and Descriptions', content: 'We make every effort to accurately describe our products, including mileage, condition, and compatibility information. However, minor variations may occur. All products are used Japanese domestic market units unless otherwise specified.' },
      { title: 'Orders and Cancellations', content: 'Orders are subject to acceptance and availability. We reserve the right to cancel or refuse any order at our discretion. If we cancel your order, you will receive a full refund. Order cancellations by the customer must be requested before the order ships.' },
      { title: 'Payment', content: 'All prices are in US dollars. Payment is processed securely through Stripe. By providing payment information, you represent that you are authorized to use the payment method. We do not store credit card information on our servers.' },
      { title: 'Shipping and Delivery', content: 'Shipping rates are $500 for business addresses and $700 for residential addresses, shipped via freight carrier. Delivery times are estimates and not guaranteed. Risk of loss transfers to you upon delivery to the freight carrier.' },
      { title: 'Returns and Refunds', content: 'Returns are accepted within 30 days of delivery for eligible items as described in our Returns Policy. Refunds are processed through Stripe and may take 5–10 business days to appear on your statement.' },
      { title: 'Limitation of Liability', content: 'JDM Tokyo Motorsports shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of our products or website. Our total liability shall not exceed the amount paid for the product in question.' },
      { title: 'Governing Law', content: 'These Terms of Service are governed by the laws of the State of California. Any disputes shall be resolved in the courts of Los Angeles County, California. If any provision of these terms is found to be unenforceable, the remaining provisions shall remain in full effect.' },
    ]), 'Terms of service (JSON sections)'],
    ['policy_returns', JSON.stringify([
      { title: 'Return Policy', content: 'We accept returns within 30 days of delivery for units that qualify under our return policy. All refunds are processed through Stripe and typically appear within 5–10 business days.\n\nTo initiate a return, please contact our team by phone or email with your order number and reason for return. We will provide return shipping instructions.' },
      { title: 'Eligible for Return', content: 'Defective units covered under our 30-day warranty.\n\nIncorrect unit shipped (wrong engine code or model).\n\nUnits with significant undisclosed damage.' },
      { title: 'Not Eligible for Return', content: 'Units that have been installed or modified.\n\nReturns requested after 30 days from delivery.\n\nUnits damaged due to improper installation or misuse.' },
      { title: 'Return Process', content: '1. Contact us by phone (+1 800 536-8669) or email (sales@jdmtokyomotors.com) to initiate your return.\n\n2. Provide your order number and photos documenting the issue.\n\n3. We will review your request within 1–2 business days and issue a return authorization if approved.\n\n4. Return the unit in its original packaging. Once received and inspected, your refund will be processed through Stripe.' },
    ]), 'Returns policy (JSON sections)'],
    ['order_confirmation_title', 'Order Confirmed!', 'Order confirmation page main heading'],
    ['order_confirmation_thank_you', 'Thank you for your purchase. Your order has been confirmed and will be processed shortly.', 'Order confirmation page thank you message'],
    ['order_confirmation_next_steps_title', 'What Happens Next?', 'Order confirmation page next steps section heading'],
    ['order_confirmation_step_1', 'Invoice on its way — you\'ll receive a full invoice by email shortly.', 'Order confirmation next step 1'],
    ['order_confirmation_step_2', 'Order preparation — we\'ll carefully pick, pack, and prepare your order for shipment.', 'Order confirmation next step 2'],
    ['order_confirmation_step_3', 'Tracking info sent — once your order ships, you\'ll receive tracking details by email.', 'Order confirmation next step 3'],
    ['order_confirmation_continue_btn_text', 'Continue Shopping', 'Order confirmation page continue button text'],
    ['order_confirmation_continue_btn_link', '/engines', 'Order confirmation page continue button link'],
    ['stripe_account_id', '', 'Stripe connected account ID (sensitive)'],
  ];

  for (const [key, value, desc] of siteSettings) {
    insertCondition.run(crypto.randomUUID(), key, value, desc, now);
  }

  console.log('Site settings inserted.');

  // Update existing databases: fill empty policy values with seed data
  const updateEmptyPolicy = sqlite.prepare(`
    UPDATE sale_conditions SET rule_value = ?, updated_at = ?
    WHERE rule_key = ? AND (rule_value = '' OR rule_value IS NULL)
  `);
  for (const [key, value] of siteSettings) {
    if (key.startsWith('policy_') && value) {
      updateEmptyPolicy.run(value, now, key);
    }
  }

  console.log('Policy seed data updated for empty entries.');

  // Insert default shipping zones
  const insertZone = sqlite.prepare(`
    INSERT OR IGNORE INTO shipping_zones (id, zone_type, rate_cents, is_active)
    SELECT ?, ?, ?, 1
    WHERE NOT EXISTS (SELECT 1 FROM shipping_zones WHERE zone_type = ?)
  `);

  insertZone.run(crypto.randomUUID(), 'forklift', 50000, 'forklift');
  insertZone.run(crypto.randomUUID(), 'no_forklift', 70000, 'no_forklift');
  insertZone.run(crypto.randomUUID(), 'liftgate', 85000, 'liftgate');
  insertZone.run(crypto.randomUUID(), 'residential_delivery', 75000, 'residential_delivery');

  console.log('Default shipping zones inserted.');

  // Create initial email templates
  const insertTemplate = sqlite.prepare(`
    INSERT INTO email_templates (id, template_name, subject_template, html_template, description, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 1, ?, ?)
    ON CONFLICT(template_name) DO UPDATE SET
      html_template = excluded.html_template,
      updated_at = excluded.updated_at
  `);
  
  const defaultReturnPolicy = `<p>For returns or refunds, please contact us via email at
    <a href="mailto:support@jdmtokyomotors.com"
       style="color:#DC2626; text-decoration:none;">support@jdmtokyomotors.com</a>
    or by phone at <strong>+1 (555) 000-0000</strong> within 30 days of delivery.
    All refunds are processed through our payment provider and may take
    3&ndash;7 business days to appear on your statement.
    Items must be in original, unused condition and in their original packaging.
    Electrical components and special-order parts may be subject to a restocking fee.</p>`;

  insertTemplate.run(
    crypto.randomUUID(),
    'returns_refunds_policy',
    'Returns & Refunds Policy',
    defaultReturnPolicy,
    'The default Returns & Refunds policy description rendered at the bottom of customer emails.',
    now,
    now
  );

  // Load HBS template contents from disk to seed into the DB if not present
  const templatesToSeed = [
    { name: 'order-confirmation', subject: 'Order Confirmed - {{orderNumber}}', file: 'order-confirmation.hbs', desc: 'Sent to customers immediately after they complete a checkout.' },
    { name: 'order-notification', subject: 'New Order Received - {{orderNumber}}', file: 'order-notification.hbs', desc: 'Sent to shop owner(s) when a new purchase is completed.' },
    { name: 'shipping-confirmation', subject: 'Your Order Has Shipped - {{orderNumber}}', file: 'shipping-confirmation.hbs', desc: 'Sent to customers when their tracking number is dispatched.' },
    { name: 'custom-message', subject: '{{subject}}', file: 'custom-message.hbs', desc: 'Branded container wrapper used when sending custom admin messages.' },
    { name: 'contact-notification', subject: 'New Contact Form Inquiry - {{subject}}', file: 'contact-notification.hbs', desc: 'Sent to shop owner(s) when someone submits the contact form.' },
    { name: 'contact-confirmation', subject: 'We received your message', file: 'contact-confirmation.hbs', desc: 'Sent to customers as an auto-reply when they submit the contact form.' }
  ];

  for (const tpl of templatesToSeed) {
    try {
      const filePath = path.resolve(__dirname, '../../emails/templates', tpl.file);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        insertTemplate.run(
          crypto.randomUUID(),
          tpl.name,
          tpl.subject,
          content,
          tpl.desc,
          now,
          now
        );
        console.log(`Seeded email template: ${tpl.name}`);
      } else {
        console.warn(`Template file not found on disk: ${filePath}`);
      }
    } catch (err) {
      console.error(`Failed to seed email template ${tpl.name}:`, err);
    }
  }

  console.log('Default email templates inserted.');

  // Create initial order notification recipients from env var
  if (env.OWNER_EMAIL) {
    const insertRecipient = sqlite.prepare(`
      INSERT OR IGNORE INTO order_notification_recipients (id, email, name, is_active, sort_order, created_at)
      SELECT ?, ?, 'Owner', 1, 0, ?
      WHERE NOT EXISTS (SELECT 1 FROM order_notification_recipients WHERE email = ?)
    `);
    insertRecipient.run(crypto.randomUUID(), env.OWNER_EMAIL, now, env.OWNER_EMAIL);
    console.log(`Initial order notification recipient added: ${env.OWNER_EMAIL}`);
  }

  // Create initial admin user from env vars
  const existingAdmin = sqlite
    .prepare('SELECT id FROM admin_users WHERE email = ?')
    .get(env.ADMIN_INITIAL_EMAIL);

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash(env.ADMIN_INITIAL_PASSWORD, 12);
    sqlite
      .prepare(
        `INSERT INTO admin_users (id, email, password_hash, name, role, created_at)
         VALUES (?, ?, ?, ?, 'super_admin', ?)`,
      )
      .run(crypto.randomUUID(), env.ADMIN_INITIAL_EMAIL, passwordHash, 'Admin', now);

    console.log(`Initial admin user created: ${env.ADMIN_INITIAL_EMAIL}`);
  } else {
    console.log(`Admin user already exists: ${env.ADMIN_INITIAL_EMAIL}`);
  }

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
