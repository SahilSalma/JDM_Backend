/**
 * Seed script — populates the database with demo products and blog posts.
 * Idempotent: checks for existing data before inserting.
 *
 * Run with:
 *   npx tsx src/config/seed.ts
 */
import 'dotenv/config';

import { db } from './database';
import { products, makes, models, blogPosts, productImages, saleConditions, orders, orderItems, navbarSettings } from '../models/schema';
import { eq, and } from 'drizzle-orm';


// ─── Helpers ──────────────────────────────────────────────────────────────────

function slug(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function productExists(sku: string): Promise<boolean> {
  const row = await db
    .select({ id: products.id })
    .from(products)
    .where(eq(products.sku, sku))
    .get();
  return row !== undefined;
}

async function updateProductMakeModel(sku: string, make: string, model: string): Promise<void> {
  const makeId = await resolveMakeId(make);
  const modelId = model && makeId ? await resolveModelId(model, makeId) : null;
  await db
    .update(products)
    .set({ make, model, make_id: makeId, model_id: modelId })
    .where(eq(products.sku, sku));
}

async function resolveMakeId(name: string): Promise<string | null> {
  const row = await db
    .select({ id: makes.id })
    .from(makes)
    .where(eq(makes.name, name))
    .get();
  return row?.id ?? null;
}

async function resolveModelId(name: string, makeId: string): Promise<string | null> {
  const row = await db
    .select({ id: models.id })
    .from(models)
    .where(and(eq(models.name, name), eq(models.make_id, makeId)))
    .get();
  return row?.id ?? null;
}

async function blogExists(postSlug: string): Promise<boolean> {
  const row = await db
    .select({ id: blogPosts.id })
    .from(blogPosts)
    .where(eq(blogPosts.slug, postSlug))
    .get();
  return row !== undefined;
}

// ─── Engine Data ──────────────────────────────────────────────────────────────

const engines = [
  {
    sku: 'ENG-K24A-001',
    title: 'Honda K24A JDM Engine',
    category: 'engine' as const,
    make: 'Honda',
    model: 'Accord',
    year_start: 2008,
    year_end: 2012,
    engine_code: 'K24A',
    displacement: '2.4L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 180000,
    compare_at_price_cents: 220000,
    quantity: 3,
    featured: true,
    short_description:
      'JDM Honda K24A 2.4L inline-4 engine sourced from Japanese domestic market Accord. ' +
      'Known for its VTEC reliability and high redline performance.',
    description:
      'The Honda K24A is a 2.4-liter inline-4 engine that represents the pinnacle of Honda\'s ' +
      'DOHC i-VTEC technology. Sourced directly from Japanese domestic market Accord models, ' +
      'these engines feature low mileage and have been inspected for oil leaks, compression, ' +
      'and overall condition. Compatible with 2008–2012 Honda Accord and a wide range of K-series swap applications.',
    meta_title: 'Honda K24A JDM Engine | 2008-2012 Accord | JDM Tokyo Motorsports',
    meta_description:
      'Buy a genuine JDM Honda K24A 2.4L engine from 2008-2012 Accord. Low-mileage, inspected, and ready to ship.',
  },
  {
    sku: 'ENG-2JZGTE-001',
    title: 'Toyota 2JZ-GTE Twin Turbo JDM Engine',
    category: 'engine' as const,
    make: 'Toyota',
    model: 'Supra',
    year_start: 1993,
    year_end: 1998,
    engine_code: '2JZ-GTE',
    displacement: '3.0L',
    cylinders: 6,
    fuel_type: 'Gasoline',
    price_cents: 550000,
    compare_at_price_cents: 650000,
    quantity: 2,
    featured: true,
    short_description:
      'The legendary Toyota 2JZ-GTE twin-turbocharged inline-6. Straight from JDM Supra units, ' +
      'renowned for its ability to handle 1000+ hp builds.',
    description:
      'The Toyota 2JZ-GTE is arguably the most legendary JDM engine ever produced. ' +
      'This 3.0-liter twin-turbocharged inline-6 was installed in the JDM Toyota Supra from 1993–1998 ' +
      'and is celebrated worldwide for its exceptional strength and tunability. ' +
      'Our units are sourced from low-mileage Japanese vehicles and include VVT-i equipped variants where available. ' +
      'Capable of producing 800–1000+ hp with proper supporting modifications.',
    meta_title: 'Toyota 2JZ-GTE JDM Engine | 1993-1998 Supra | JDM Tokyo Motorsports',
    meta_description:
      'Legendary Toyota 2JZ-GTE twin-turbo 3.0L JDM engine from 1993-1998 Supra. Ready for high-horsepower builds.',
  },
  {
    sku: 'ENG-SR20DET-001',
    title: 'Nissan SR20DET JDM Turbo Engine',
    category: 'engine' as const,
    make: 'Nissan',
    model: 'Silvia',
    year_start: 1991,
    year_end: 2002,
    engine_code: 'SR20DET',
    displacement: '2.0L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 320000,
    compare_at_price_cents: 380000,
    quantity: 4,
    featured: true,
    short_description:
      'Nissan SR20DET 2.0L turbocharged inline-4 from JDM Silvia. The go-to engine for drift builds and track cars.',
    description:
      'The Nissan SR20DET is the definitive JDM drift engine. Originally installed in the Nissan Silvia S13, S14, and S15, ' +
      'this 2.0-liter turbocharged inline-4 provides an excellent power-to-weight ratio and responds extremely well to modifications. ' +
      'Our JDM units come from Japanese market Silvia models and feature the sought-after "blacktop" or "redtop" designation. ' +
      'Fits a wide range of SR20 swap applications including 240SX and various other platforms.',
    meta_title: 'Nissan SR20DET JDM Turbo Engine | Silvia | JDM Tokyo Motorsports',
    meta_description:
      'Genuine JDM Nissan SR20DET 2.0L turbo engine from Silvia. Perfect for drift builds. Low mileage, inspected.',
  },
  {
    sku: 'ENG-EJ257-001',
    title: 'Subaru EJ257 JDM Engine — WRX STI',
    category: 'engine' as const,
    make: 'Subaru',
    model: 'WRX STI',
    year_start: 2004,
    year_end: 2014,
    engine_code: 'EJ257',
    displacement: '2.5L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 450000,
    compare_at_price_cents: 520000,
    quantity: 3,
    featured: false,
    short_description:
      'Subaru EJ257 2.5L turbocharged boxer engine from JDM WRX STI. Delivers rally-proven performance.',
    description:
      'The Subaru EJ257 is the high-performance turbocharged variant of Subaru\'s EJ25 boxer engine, ' +
      'fitted exclusively in the WRX STI from 2004–2014. These JDM-sourced units feature the factory forged internals ' +
      'and are known for their robust construction. Compatible with USDM WRX STI models with minor supporting modifications. ' +
      'Ideal for track builds, rally applications, and high-output street cars.',
    meta_title: 'Subaru EJ257 JDM Engine | WRX STI 2004-2014 | JDM Tokyo Motorsports',
    meta_description:
      'JDM Subaru EJ257 2.5L turbo boxer engine from WRX STI. Factory forged internals. Low mileage imported units.',
  },
  {
    sku: 'ENG-13BREW-001',
    title: 'Mazda 13B-REW JDM Rotary Engine — RX-7',
    category: 'engine' as const,
    make: 'Mazda',
    model: 'RX-7',
    year_start: 1993,
    year_end: 2002,
    engine_code: '13B-REW',
    displacement: '1.3L',
    cylinders: 2, // rotor count used as cylinders equivalent
    fuel_type: 'Gasoline',
    price_cents: 480000,
    compare_at_price_cents: 560000,
    quantity: 2,
    featured: true,
    short_description:
      'Mazda 13B-REW sequential twin-turbo rotary engine from JDM FD RX-7. Iconic performance, lightweight design.',
    description:
      'The Mazda 13B-REW is the crown jewel of Mazda\'s rotary engine lineage. Used in the FD3S RX-7 from 1993–2002, ' +
      'this 1.3-liter twin-rotor engine with sequential twin-turbos produces 255 hp from the factory — extraordinary for its displacement. ' +
      'Our JDM units are sourced from low-mileage Japanese RX-7 FD models and include the complete turbo assembly. ' +
      'Each unit is compression-tested on all rotor faces before shipping. Ideal for RX-7 restorers and rotary swap enthusiasts.',
    meta_title: 'Mazda 13B-REW JDM Rotary Engine | RX-7 FD | JDM Tokyo Motorsports',
    meta_description:
      'Genuine JDM Mazda 13B-REW twin-turbo rotary engine from FD RX-7. Compression tested. Sequential turbo intact.',
  },
  {
    sku: 'ENG-B18C-001',
    title: 'Honda B18C JDM Engine — Integra Type R',
    category: 'engine' as const,
    make: 'Honda',
    model: 'Integra',
    year_start: 1994,
    year_end: 2001,
    engine_code: 'B18C',
    displacement: '1.8L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 280000,
    compare_at_price_cents: 340000,
    quantity: 5,
    featured: false,
    short_description:
      'Honda B18C 1.8L DOHC VTEC engine from JDM Integra Type R. High-revving NA performance classic.',
    description:
      'The Honda B18C is one of the most celebrated naturally aspirated performance engines ever built. ' +
      'Sourced from the JDM Integra Type R (DC2), these engines feature Honda\'s DOHC VTEC technology and ' +
      'high-compression internals designed to rev to 8,500 RPM. Known for exceptional power delivery, ' +
      'linear throttle response, and legendary reliability. Fits all DC2, EG, and EK chassis with proper supporting mods. ' +
      'A must-have for any serious Honda build.',
    meta_title: 'Honda B18C JDM Engine | Integra Type R | JDM Tokyo Motorsports',
    meta_description:
      'JDM Honda B18C 1.8L VTEC engine from Integra Type R. High-rev naturally aspirated powerhouse. Inspected and tested.',
  },
  {
    sku: 'ENG-1JZGTE-001',
    title: 'Toyota 1JZ-GTE JDM Turbo Engine — Mark II',
    category: 'engine' as const,
    make: 'Toyota',
    model: 'Mark II',
    year_start: 1990,
    year_end: 2001,
    engine_code: '1JZ-GTE',
    displacement: '2.5L',
    cylinders: 6,
    fuel_type: 'Gasoline',
    price_cents: 350000,
    compare_at_price_cents: 420000,
    quantity: 3,
    featured: false,
    short_description:
      'Toyota 1JZ-GTE 2.5L turbocharged inline-6 from JDM Mark II / Chaser. Compact powerplant with massive tuning potential.',
    description:
      'The Toyota 1JZ-GTE is the smaller sibling of the iconic 2JZ-GTE, offering similar inline-6 smoothness ' +
      'in a more compact package. Originally fitted in the JDM Toyota Mark II, Chaser, and Cresta, this 2.5-liter ' +
      'turbocharged engine is highly regarded for drift and track use due to its lighter weight and excellent turbo response. ' +
      'VVT-i variants are available and respond well to bolt-on modifications. Compatible with numerous swap applications.',
    meta_title: 'Toyota 1JZ-GTE JDM Engine | Mark II / Chaser | JDM Tokyo Motorsports',
    meta_description:
      'JDM Toyota 1JZ-GTE 2.5L turbo inline-6 from Mark II and Chaser. Lighter 1JZ alternative. Big tuning potential.',
  },
  {
    sku: 'ENG-RB26DETT-001',
    title: 'Nissan RB26DETT JDM Engine — Skyline GT-R',
    category: 'engine' as const,
    make: 'Nissan',
    model: 'Skyline GT-R',
    year_start: 1989,
    year_end: 2002,
    engine_code: 'RB26DETT',
    displacement: '2.6L',
    cylinders: 6,
    fuel_type: 'Gasoline',
    price_cents: 850000,
    compare_at_price_cents: 1000000,
    quantity: 1,
    featured: true,
    short_description:
      'Nissan RB26DETT 2.6L twin-turbo inline-6 from JDM BNR32/BCNR33/BNR34 Skyline GT-R. The Godzilla engine.',
    description:
      'The Nissan RB26DETT is the heart of the legendary Skyline GT-R — known as "Godzilla." ' +
      'This 2.6-liter twin-turbocharged inline-6 was purpose-built for motorsport homologation and features ' +
      'individual throttle bodies, a reinforced block, and exceptional engineering tolerance. ' +
      'Sourced from R32, R33, and R34 GT-R units, our engines are the real deal: JDM, low-mileage, and fully inspected. ' +
      'Widely regarded as one of the greatest engines ever made. Limited availability — do not miss your opportunity.',
    meta_title: 'Nissan RB26DETT JDM Engine | Skyline GT-R | JDM Tokyo Motorsports',
    meta_description:
      'Genuine Nissan RB26DETT 2.6L twin-turbo engine from JDM Skyline GT-R. Rare, inspected, and ready to ship.',
  },
  {
    sku: 'ENG-J35A-001',
    title: 'Honda J35A JDM Engine — Odyssey / Pilot',
    category: 'engine' as const,
    make: 'Honda',
    model: 'Odyssey',
    year_start: 2005,
    year_end: 2014,
    engine_code: 'J35A',
    displacement: '3.5L',
    cylinders: 6,
    fuel_type: 'Gasoline',
    price_cents: 120000,
    compare_at_price_cents: 160000,
    quantity: 6,
    featured: false,
    short_description:
      'Honda J35A 3.5L V6 engine from JDM Odyssey and Pilot. Reliable, smooth daily driver and swap candidate.',
    description:
      'The Honda J35A is a 3.5-liter naturally aspirated V6 engine known for its exceptional reliability and smooth power delivery. ' +
      'Sourced from JDM Honda Odyssey and Pilot models, these units offer low mileage and are ideal for daily driver replacements ' +
      'or J-series swaps into lighter Honda chassis. Compatible with Accord, Pilot, Ridgeline, and numerous other Honda applications. ' +
      'An affordable and dependable option for those seeking V6 power.',
    meta_title: 'Honda J35A JDM Engine | Odyssey & Pilot 2005-2014 | JDM Tokyo Motorsports',
    meta_description:
      'JDM Honda J35A 3.5L V6 engine from Odyssey and Pilot. Reliable, low-mileage daily driver replacement.',
  },
  {
    sku: 'ENG-4G63T-001',
    title: 'Mitsubishi 4G63T JDM Turbo Engine — Lancer Evolution',
    category: 'engine' as const,
    make: 'Mitsubishi',
    model: 'Lancer Evolution',
    year_start: 1992,
    year_end: 2007,
    engine_code: '4G63T',
    displacement: '2.0L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 420000,
    compare_at_price_cents: 500000,
    quantity: 3,
    featured: false,
    short_description:
      'Mitsubishi 4G63T 2.0L turbocharged inline-4 from JDM Lancer Evolution. Rally-proven AWD powerhouse.',
    description:
      'The Mitsubishi 4G63T is the rally-bred heart of the legendary Lancer Evolution series. ' +
      'This 2.0-liter turbocharged inline-4 is renowned for its cast-iron block strength and phenomenal response to tuning. ' +
      'Sourced from JDM Evolution I through IX models (1992–2007), our units feature the sought-after cast-iron block ' +
      'construction and are compatible with numerous EVO swap applications. ' +
      'World-famous for WRC success and street performance alike.',
    meta_title: 'Mitsubishi 4G63T JDM Turbo Engine | Lancer Evo | JDM Tokyo Motorsports',
    meta_description:
      'JDM Mitsubishi 4G63T 2.0L turbo engine from Lancer Evolution. Rally-proven cast-iron block. High tuning potential.',
  },
];

// ─── Transmission Data ────────────────────────────────────────────────────────

const transmissions = [
  {
    sku: 'TRANS-MCTA-001',
    title: 'Honda MCTA Automatic Transmission — Accord',
    category: 'transmission' as const,
    make: 'Honda',
    model: 'Accord',
    year_start: 2003,
    year_end: 2007,
    engine_code: 'MCTA',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Automatic',
    price_cents: 80000,
    compare_at_price_cents: 110000,
    quantity: 4,
    featured: false,
    short_description:
      'Honda MCTA 5-speed automatic transmission from 2003-2007 Accord. Smooth shifting, direct OEM replacement.',
    description:
      'The Honda MCTA is the 5-speed automatic transmission used in the 2003–2007 Honda Accord. ' +
      'These JDM-sourced units are known for their smooth operation and reliability. ' +
      'A direct-fit replacement for US market Accord automatics of the same generation. ' +
      'Each unit is tested for proper gear engagement and torque converter function before shipping.',
    meta_title: 'Honda MCTA Automatic Transmission | 2003-2007 Accord | JDM Tokyo Motorsports',
    meta_description:
      'JDM Honda MCTA 5-speed automatic transmission from 2003-2007 Accord. Low mileage, tested, ready to install.',
  },
  {
    sku: 'TRANS-R154-001',
    title: 'Toyota R154 5-Speed Manual Transmission — Supra',
    category: 'transmission' as const,
    make: 'Toyota',
    model: 'Supra',
    year_start: 1988,
    year_end: 2002,
    engine_code: 'R154',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Manual',
    price_cents: 220000,
    compare_at_price_cents: 280000,
    quantity: 2,
    featured: true,
    short_description:
      'Toyota R154 5-speed manual transmission from JDM Supra. Handles high-torque 2JZ applications with ease.',
    description:
      'The Toyota R154 is the iconic 5-speed manual transmission paired with the 2JZ-GTE in the JDM Supra. ' +
      'Built to handle exceptional torque loads, this transmission is essential for any serious 2JZ-powered build. ' +
      'Sourced from JDM Toyota Supra (A70 and A80) and Mark II models, our units are tested for smooth gear selection ' +
      'and synchro engagement. Compatible with 1JZ and 2JZ engine applications with appropriate bell housing adapters.',
    meta_title: 'Toyota R154 5-Speed Manual Transmission | Supra | JDM Tokyo Motorsports',
    meta_description:
      'JDM Toyota R154 5-speed manual transmission from Supra. Handles 2JZ torque. Inspected synchros and seals.',
  },
  {
    sku: 'TRANS-FS5W71C-001',
    title: 'Nissan FS5W71C 5-Speed Manual Transmission — Silvia',
    category: 'transmission' as const,
    make: 'Nissan',
    model: 'Silvia',
    year_start: 1991,
    year_end: 2002,
    engine_code: 'FS5W71C',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Manual',
    price_cents: 150000,
    compare_at_price_cents: 200000,
    quantity: 4,
    featured: false,
    short_description:
      'Nissan FS5W71C 5-speed manual from JDM Silvia S13/S14/S15. The go-to gearbox for SR20DET builds.',
    description:
      'The Nissan FS5W71C is the standard 5-speed manual transmission used in SR20DET-powered Silvia models. ' +
      'This transmission is the most common companion to the SR20DET engine and is well-supported by aftermarket parts. ' +
      'Our JDM units come from Japanese Silvia S13, S14, and S15 models with proper gear engagement and minimal play. ' +
      'Ideal for track-day cars, drift builds, and SR20 swaps into 240SX platforms.',
    meta_title: 'Nissan FS5W71C 5-Speed Manual Transmission | Silvia | JDM Tokyo Motorsports',
    meta_description:
      'JDM Nissan FS5W71C 5-speed manual gearbox from Silvia. SR20DET companion. Inspected and tested.',
  },
  {
    sku: 'TRANS-TY856WB-001',
    title: 'Subaru TY856WB 6-Speed Manual Transmission — WRX STI',
    category: 'transmission' as const,
    make: 'Subaru',
    model: 'WRX STI',
    year_start: 2004,
    year_end: 2014,
    engine_code: 'TY856WB',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Manual',
    price_cents: 320000,
    compare_at_price_cents: 400000,
    quantity: 2,
    featured: false,
    short_description:
      'Subaru TY856WB 6-speed manual from JDM WRX STI. Factory close-ratio gearbox for the EJ257 platform.',
    description:
      'The Subaru TY856WB is the close-ratio 6-speed manual transmission fitted in the JDM WRX STI from 2004–2014. ' +
      'Designed to work with the AWD drivetrain and EJ257 powerplant, this transmission delivers precise shifts ' +
      'and strong synchros capable of handling high-horsepower applications. ' +
      'Compatible with USDM WRX STI models. Each unit is tested for proper operation across all six gears and reverse.',
    meta_title: 'Subaru TY856WB 6-Speed Manual Transmission | WRX STI | JDM Tokyo Motorsports',
    meta_description:
      'JDM Subaru TY856WB 6-speed close-ratio manual from WRX STI. EJ257 platform gearbox. Low mileage.',
  },
  {
    sku: 'TRANS-M15MD-001',
    title: 'Mazda M15M-D 5-Speed Manual Transmission — RX-7',
    category: 'transmission' as const,
    make: 'Mazda',
    model: 'RX-7',
    year_start: 1993,
    year_end: 2002,
    engine_code: 'M15M-D',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Manual',
    price_cents: 180000,
    compare_at_price_cents: 240000,
    quantity: 3,
    featured: false,
    short_description:
      'Mazda M15M-D 5-speed manual from JDM FD RX-7. Matched to 13B-REW for optimal rotary performance.',
    description:
      'The Mazda M15M-D is the factory 5-speed manual transmission paired with the 13B-REW rotary engine in the FD RX-7. ' +
      'Sourced from JDM FD3S models, these transmissions are known for their smooth action and compatibility ' +
      'with aftermarket clutch and shifter components. ' +
      'Each unit has been inspected for gear wear, synchro health, and output shaft integrity. ' +
      'An essential companion for any RX-7 rotary restoration or performance build.',
    meta_title: 'Mazda M15M-D 5-Speed Manual Transmission | RX-7 FD | JDM Tokyo Motorsports',
    meta_description:
      'JDM Mazda M15M-D 5-speed manual from FD RX-7. Perfect 13B-REW companion. Inspected and tested.',
  },
];

// ─── Additional Engine Data (for pagination) ─────────────────────────────────

const additionalEngines = [
  {
    sku: 'ENG-RB25DET-001',
    title: 'Nissan RB25DET JDM Turbo Engine — Skyline R33',
    category: 'engine' as const,
    make: 'Nissan',
    model: 'Skyline',
    year_start: 1993,
    year_end: 1998,
    engine_code: 'RB25DET',
    displacement: '2.5L',
    cylinders: 6,
    fuel_type: 'Gasoline',
    price_cents: 380000,
    compare_at_price_cents: 450000,
    quantity: 3,
    featured: false,
    short_description: 'Nissan RB25DET 2.5L turbo inline-6 from JDM R33 Skyline. Popular for RWD builds and 240SX swaps.',
    description: 'The Nissan RB25DET is a 2.5-liter turbocharged inline-6 found in the R33 Skyline GTS-T. It shares the legendary RB lineage with the RB26DETT but in a more accessible, single-turbo package. Excellent for drift builds, 240SX swaps, and street performance cars.',
    meta_title: 'Nissan RB25DET JDM Engine | Skyline R33 | JDM Tokyo Motorsports',
    meta_description: 'JDM Nissan RB25DET 2.5L turbo inline-6 from R33 Skyline. Great for RWD builds.',
  },
  {
    sku: 'ENG-F20C-001',
    title: 'Honda F20C JDM Engine — S2000 AP1',
    category: 'engine' as const,
    make: 'Honda',
    model: 'S2000',
    year_start: 1999,
    year_end: 2003,
    engine_code: 'F20C',
    displacement: '2.0L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 520000,
    compare_at_price_cents: 620000,
    quantity: 2,
    featured: true,
    short_description: 'Honda F20C 2.0L VTEC engine from JDM S2000 AP1. 9,000 RPM redline. The highest specific output NA engine of its era.',
    description: 'The Honda F20C is the naturally aspirated masterpiece from the S2000 AP1. With a 9,000 RPM redline and 124 hp/liter, it held the record for highest specific output from a naturally aspirated engine. Sourced from JDM S2000 AP1 models with low mileage.',
    meta_title: 'Honda F20C JDM Engine | S2000 AP1 | JDM Tokyo Motorsports',
    meta_description: 'JDM Honda F20C 2.0L VTEC engine from S2000 AP1. 9,000 RPM redline NA performance.',
  },
  {
    sku: 'ENG-VQ35DE-001',
    title: 'Nissan VQ35DE JDM Engine — 350Z / Fairlady Z',
    category: 'engine' as const,
    make: 'Nissan',
    model: '350Z',
    year_start: 2003,
    year_end: 2006,
    engine_code: 'VQ35DE',
    displacement: '3.5L',
    cylinders: 6,
    fuel_type: 'Gasoline',
    price_cents: 180000,
    compare_at_price_cents: 240000,
    quantity: 5,
    featured: false,
    short_description: 'Nissan VQ35DE 3.5L V6 from JDM 350Z. Ward\'s 10 Best Engines winner. Smooth, reliable, and swap-friendly.',
    description: 'The Nissan VQ35DE is a 3.5-liter V6 that powered the 350Z and earned multiple Ward\'s 10 Best Engines awards. Known for exceptional smoothness, reliability, and a strong aftermarket. These JDM units feature low mileage and are perfect for Z car restorers or V6 swap projects.',
    meta_title: 'Nissan VQ35DE JDM Engine | 350Z | JDM Tokyo Motorsports',
    meta_description: 'JDM Nissan VQ35DE 3.5L V6 from 350Z. Award-winning engine. Low mileage.',
  },
  {
    sku: 'ENG-3SGTE-001',
    title: 'Toyota 3S-GTE JDM Turbo Engine — MR2 / Celica',
    category: 'engine' as const,
    make: 'Toyota',
    model: 'MR2',
    year_start: 1990,
    year_end: 1999,
    engine_code: '3S-GTE',
    displacement: '2.0L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 280000,
    compare_at_price_cents: 340000,
    quantity: 3,
    featured: false,
    short_description: 'Toyota 3S-GTE 2.0L turbo from JDM MR2 and Celica GT-Four. Mid-engine turbo legend.',
    description: 'The Toyota 3S-GTE is a 2.0-liter turbocharged inline-4 used in the MR2 Turbo and Celica GT-Four. Known for its robust internals and strong tuning potential, these JDM engines come from low-mileage Japanese vehicles. The Gen3 variant features a CT20B turbo and is highly sought after.',
    meta_title: 'Toyota 3S-GTE JDM Turbo Engine | MR2 / Celica | JDM Tokyo Motorsports',
    meta_description: 'JDM Toyota 3S-GTE 2.0L turbo from MR2 and Celica GT-Four. Mid-engine turbo power.',
  },
  {
    sku: 'ENG-K20A-001',
    title: 'Honda K20A JDM Engine — Civic Type R EP3',
    category: 'engine' as const,
    make: 'Honda',
    model: 'Civic Type R',
    year_start: 2001,
    year_end: 2005,
    engine_code: 'K20A',
    displacement: '2.0L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 350000,
    compare_at_price_cents: 420000,
    quantity: 4,
    featured: true,
    short_description: 'Honda K20A 2.0L i-VTEC from JDM Civic Type R EP3. 220 HP NA powerhouse with 8,600 RPM redline.',
    description: 'The Honda K20A from the JDM Civic Type R EP3 produces 220 HP naturally aspirated with an 8,600 RPM redline. This engine features i-VTEC technology and is one of the most potent four-cylinder NA engines ever built. A top choice for Honda K-swap enthusiasts.',
    meta_title: 'Honda K20A JDM Engine | Civic Type R EP3 | JDM Tokyo Motorsports',
    meta_description: 'JDM Honda K20A 2.0L i-VTEC from Civic Type R. 220 HP NA with 8,600 RPM redline.',
  },
  {
    sku: 'ENG-EJ205-001',
    title: 'Subaru EJ205 JDM Turbo Engine — WRX',
    category: 'engine' as const,
    make: 'Subaru',
    model: 'WRX',
    year_start: 2002,
    year_end: 2005,
    engine_code: 'EJ205',
    displacement: '2.0L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 220000,
    compare_at_price_cents: 280000,
    quantity: 4,
    featured: false,
    short_description: 'Subaru EJ205 2.0L turbo boxer from JDM WRX. Affordable rally-bred flat-four power.',
    description: 'The Subaru EJ205 is the turbocharged 2.0-liter boxer engine from the JDM WRX. While not as powerful as the STI\'s EJ257, it offers excellent reliability and tunability at a lower price point. Popular for WRX swaps and budget rally builds.',
    meta_title: 'Subaru EJ205 JDM Turbo Engine | WRX | JDM Tokyo Motorsports',
    meta_description: 'JDM Subaru EJ205 2.0L turbo boxer from WRX. Affordable rally-bred performance.',
  },
  {
    sku: 'ENG-4AGE-001',
    title: 'Toyota 4A-GE JDM Engine — AE86 Corolla',
    category: 'engine' as const,
    make: 'Toyota',
    model: 'Corolla AE86',
    year_start: 1983,
    year_end: 1987,
    engine_code: '4A-GE',
    displacement: '1.6L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 250000,
    compare_at_price_cents: 310000,
    quantity: 2,
    featured: true,
    short_description: 'Toyota 4A-GE 1.6L from JDM AE86 Corolla. The engine that defined the drift and touge culture.',
    description: 'The Toyota 4A-GE is the iconic 1.6L twin-cam engine from the AE86 Corolla, made famous by Initial D and real-world motorsport. Our JDM units are the sought-after silver-top or blacktop 20-valve variants with individual throttle bodies. A must-have for AE86 restorers and lightweight sports car builders.',
    meta_title: 'Toyota 4A-GE JDM Engine | AE86 Corolla | JDM Tokyo Motorsports',
    meta_description: 'JDM Toyota 4A-GE 1.6L from AE86 Corolla. 20-valve ITB equipped. Drift legend.',
  },
  {
    sku: 'ENG-6G72TT-001',
    title: 'Mitsubishi 6G72TT JDM Engine — 3000GT VR-4',
    category: 'engine' as const,
    make: 'Mitsubishi',
    model: '3000GT VR-4',
    year_start: 1991,
    year_end: 1999,
    engine_code: '6G72TT',
    displacement: '3.0L',
    cylinders: 6,
    fuel_type: 'Gasoline',
    price_cents: 380000,
    compare_at_price_cents: 460000,
    quantity: 2,
    featured: false,
    short_description: 'Mitsubishi 6G72 twin-turbo 3.0L V6 from JDM 3000GT VR-4. AWD twin-turbo tech flagship.',
    description: 'The Mitsubishi 6G72TT is a 3.0-liter twin-turbocharged V6 from the JDM GTO (3000GT VR-4). This engine was Mitsubishi\'s technology flagship, featuring active aero, AWD, and AWS. Capable of over 400 HP with bolt-on modifications. A rare and powerful JDM gem.',
    meta_title: 'Mitsubishi 6G72TT JDM Engine | 3000GT VR-4 | JDM Tokyo Motorsports',
    meta_description: 'JDM Mitsubishi 6G72 twin-turbo V6 from 3000GT VR-4. Rare AWD twin-turbo powerhouse.',
  },
  {
    sku: 'ENG-BPZE-001',
    title: 'Mazda BP-ZE JDM Engine — MX-5 Miata',
    category: 'engine' as const,
    make: 'Mazda',
    model: 'MX-5 Miata',
    year_start: 1990,
    year_end: 1997,
    engine_code: 'BP-ZE',
    displacement: '1.8L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 120000,
    compare_at_price_cents: 160000,
    quantity: 6,
    featured: false,
    short_description: 'Mazda BP-ZE 1.8L from JDM Eunos Roadster / MX-5. The heart of the world\'s favorite sports car.',
    description: 'The Mazda BP-ZE is the 1.8-liter twin-cam engine from the NA/NB MX-5 Miata (Eunos Roadster in Japan). Known for its reliability, light weight, and excellent balance. Perfect replacement for NA/NB Miatas or as a lightweight swap candidate. Abundant aftermarket support including turbo kits.',
    meta_title: 'Mazda BP-ZE JDM Engine | MX-5 Miata | JDM Tokyo Motorsports',
    meta_description: 'JDM Mazda BP-ZE 1.8L from MX-5 Miata. Lightweight reliable roadster engine.',
  },
  {
    sku: 'ENG-VR38DETT-001',
    title: 'Nissan VR38DETT JDM Engine — GT-R R35',
    category: 'engine' as const,
    make: 'Nissan',
    model: 'GT-R R35',
    year_start: 2008,
    year_end: 2016,
    engine_code: 'VR38DETT',
    displacement: '3.8L',
    cylinders: 6,
    fuel_type: 'Gasoline',
    price_cents: 1200000,
    compare_at_price_cents: 1500000,
    quantity: 1,
    featured: true,
    short_description: 'Nissan VR38DETT 3.8L twin-turbo V6 from JDM GT-R R35. Hand-built supercar slayer.',
    description: 'The Nissan VR38DETT is the hand-assembled 3.8-liter twin-turbo V6 from the legendary GT-R R35. Each engine is built by a single master craftsman (takumi) at Nissan\'s Yokohama plant. Producing 485+ HP stock with proven capability to exceed 1,500 HP with modifications. Extremely rare on the used market.',
    meta_title: 'Nissan VR38DETT JDM Engine | GT-R R35 | JDM Tokyo Motorsports',
    meta_description: 'JDM Nissan VR38DETT 3.8L twin-turbo from GT-R R35. Hand-built by Nissan takumi craftsmen.',
  },
  {
    sku: 'ENG-SR20VE-001',
    title: 'Nissan SR20VE JDM Engine — Primera / Bluebird',
    category: 'engine' as const,
    make: 'Nissan',
    model: 'Primera',
    year_start: 1997,
    year_end: 2001,
    engine_code: 'SR20VE',
    displacement: '2.0L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 200000,
    compare_at_price_cents: 260000,
    quantity: 3,
    featured: false,
    short_description: 'Nissan SR20VE 2.0L NEO VVL from JDM Primera. Underrated NA SR with variable valve lift.',
    description: 'The Nissan SR20VE features Nissan\'s NEO VVL (Variable Valve Lift) system, making it one of the most capable NA four-cylinders from the 90s. Found in the JDM Primera and Bluebird, this engine is a hidden gem for lightweight builds and track cars. Revs to 7,500 RPM.',
    meta_title: 'Nissan SR20VE JDM Engine | Primera | JDM Tokyo Motorsports',
    meta_description: 'JDM Nissan SR20VE 2.0L with NEO VVL variable valve lift. Underrated NA SR powerplant.',
  },
  {
    sku: 'ENG-L15B-001',
    title: 'Honda L15B JDM Turbo Engine — Civic FK7',
    category: 'engine' as const,
    make: 'Honda',
    model: 'Civic',
    year_start: 2017,
    year_end: 2021,
    engine_code: 'L15B',
    displacement: '1.5L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 220000,
    compare_at_price_cents: 280000,
    quantity: 4,
    featured: false,
    short_description: 'Honda L15B 1.5L VTEC Turbo from JDM Civic FK7. Modern downsized turbo performance.',
    description: 'The Honda L15B is Honda\'s modern 1.5-liter VTEC Turbo engine from the 10th-gen Civic. Combining turbo torque with Honda\'s VTEC technology, it produces excellent power for its displacement. Low-mileage JDM units are ideal replacements for US-market Civics or Si models.',
    meta_title: 'Honda L15B JDM Turbo Engine | Civic FK7 | JDM Tokyo Motorsports',
    meta_description: 'JDM Honda L15B 1.5L VTEC Turbo from Civic FK7. Modern downsized turbo power.',
  },
  {
    sku: 'ENG-FA20-001',
    title: 'Subaru FA20 JDM Engine — BRZ / 86',
    category: 'engine' as const,
    make: 'Subaru',
    model: 'BRZ',
    year_start: 2012,
    year_end: 2020,
    engine_code: 'FA20',
    displacement: '2.0L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 280000,
    compare_at_price_cents: 340000,
    quantity: 3,
    featured: false,
    short_description: 'Subaru FA20 2.0L boxer from JDM BRZ / Toyota 86. Lightweight NA sports car engine with D-4S injection.',
    description: 'The Subaru FA20 is a 2.0-liter naturally aspirated boxer engine developed jointly by Subaru and Toyota for the BRZ and 86. Featuring Toyota\'s D-4S dual injection and a flat-four layout, it delivers a low center of gravity and engaging throttle response. Popular for forced induction builds.',
    meta_title: 'Subaru FA20 JDM Engine | BRZ / 86 | JDM Tokyo Motorsports',
    meta_description: 'JDM Subaru FA20 2.0L boxer from BRZ and Toyota 86. Lightweight sports car engine.',
  },
  {
    sku: 'ENG-B16B-001',
    title: 'Honda B16B JDM Engine — Civic Type R EK9',
    category: 'engine' as const,
    make: 'Honda',
    model: 'Civic Type R',
    year_start: 1997,
    year_end: 2000,
    engine_code: 'B16B',
    displacement: '1.6L',
    cylinders: 4,
    fuel_type: 'Gasoline',
    price_cents: 480000,
    compare_at_price_cents: 580000,
    quantity: 1,
    featured: true,
    short_description: 'Honda B16B 1.6L DOHC VTEC from JDM Civic Type R EK9. 185 HP from 1.6 liters. Holy grail B-series.',
    description: 'The Honda B16B is the ultimate expression of Honda\'s B-series engine, exclusive to the JDM Civic Type R EK9. Producing 185 HP from just 1.6 liters naturally aspirated, it features hand-ported heads, aggressive cam profiles, and an 8,800 RPM redline. Extremely rare and highly collectible.',
    meta_title: 'Honda B16B JDM Engine | Civic Type R EK9 | JDM Tokyo Motorsports',
    meta_description: 'JDM Honda B16B 1.6L VTEC from Civic Type R EK9. 185 HP NA holy grail engine.',
  },
  {
    sku: 'ENG-RB20DET-001',
    title: 'Nissan RB20DET JDM Turbo Engine — Skyline R32 GTS-T',
    category: 'engine' as const,
    make: 'Nissan',
    model: 'Skyline',
    year_start: 1989,
    year_end: 1993,
    engine_code: 'RB20DET',
    displacement: '2.0L',
    cylinders: 6,
    fuel_type: 'Gasoline',
    price_cents: 180000,
    compare_at_price_cents: 230000,
    quantity: 4,
    featured: false,
    short_description: 'Nissan RB20DET 2.0L turbo inline-6 from JDM R32 Skyline GTS-T. Entry-level RB turbo.',
    description: 'The Nissan RB20DET is the entry point to the RB turbo family. Found in the R32 Skyline GTS-T, this 2.0-liter turbo inline-6 offers the signature RB smoothness at a budget-friendly price. Great for those starting their RB journey or needing a reliable inline-6 swap option.',
    meta_title: 'Nissan RB20DET JDM Engine | Skyline R32 GTS-T | JDM Tokyo Motorsports',
    meta_description: 'JDM Nissan RB20DET 2.0L turbo inline-6 from R32 Skyline. Budget-friendly RB power.',
  },
];

// ─── Additional Transmission Data (for pagination) ───────────────────────────

const additionalTransmissions = [
  {
    sku: 'TRANS-CD009-001',
    title: 'Nissan CD009 6-Speed Manual Transmission — 350Z',
    category: 'transmission' as const,
    make: 'Nissan',
    model: '350Z',
    year_start: 2003,
    year_end: 2006,
    engine_code: 'CD009',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Manual',
    price_cents: 160000,
    compare_at_price_cents: 220000,
    quantity: 3,
    featured: false,
    short_description: 'Nissan CD009 6-speed manual from JDM 350Z. Strong aftermarket support for LS and RB swaps.',
    description: 'The Nissan CD009 is the 6-speed manual transmission from the 350Z. Extremely popular in the swap community due to its strength, availability, and aftermarket adapter plates for LS, RB, and JZ engine swaps. A cost-effective manual option for high-torque builds.',
    meta_title: 'Nissan CD009 6-Speed Manual | 350Z | JDM Tokyo Motorsports',
    meta_description: 'JDM Nissan CD009 6-speed manual from 350Z. Popular for LS and RB swaps.',
  },
  {
    sku: 'TRANS-V160-001',
    title: 'Getrag V160 6-Speed Manual Transmission — Supra',
    category: 'transmission' as const,
    make: 'Toyota',
    model: 'Supra',
    year_start: 1993,
    year_end: 2002,
    engine_code: 'V160',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Manual',
    price_cents: 450000,
    compare_at_price_cents: 550000,
    quantity: 1,
    featured: true,
    short_description: 'Getrag V160 6-speed manual from JDM Supra. Handles 800+ HP. The ultimate 2JZ companion.',
    description: 'The Getrag V160 is the factory 6-speed manual transmission for the JDM Supra A80 with 2JZ-GTE. Built by Getrag in Germany, it handles 800+ HP reliably and is the gold standard for serious 2JZ builds. Extremely rare and highly sought after. Includes bell housing.',
    meta_title: 'Getrag V160 6-Speed Manual | Supra | JDM Tokyo Motorsports',
    meta_description: 'JDM Getrag V160 6-speed from Supra. Handles 800+ HP. Ultimate 2JZ companion.',
  },
  {
    sku: 'TRANS-AP1-001',
    title: 'Honda S2000 AP1 6-Speed Manual Transmission',
    category: 'transmission' as const,
    make: 'Honda',
    model: 'S2000',
    year_start: 1999,
    year_end: 2003,
    engine_code: 'AP1-6MT',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Manual',
    price_cents: 180000,
    compare_at_price_cents: 240000,
    quantity: 2,
    featured: false,
    short_description: 'Honda S2000 AP1 6-speed manual. Short-throw precision shifting matched to the F20C.',
    description: 'The Honda S2000 AP1 6-speed manual transmission is known for its precise, short-throw shifter and excellent gear ratios. Factory matched to the high-revving F20C engine, this transmission delivers an unmatched driving experience. Low-mileage JDM units in excellent condition.',
    meta_title: 'Honda S2000 6-Speed Manual | AP1 | JDM Tokyo Motorsports',
    meta_description: 'JDM Honda S2000 AP1 6-speed manual transmission. Precision shifting for F20C.',
  },
  {
    sku: 'TRANS-W58-001',
    title: 'Toyota W58 5-Speed Manual Transmission — Mark II / Cressida',
    category: 'transmission' as const,
    make: 'Toyota',
    model: 'Mark II',
    year_start: 1988,
    year_end: 2000,
    engine_code: 'W58',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Manual',
    price_cents: 120000,
    compare_at_price_cents: 160000,
    quantity: 4,
    featured: false,
    short_description: 'Toyota W58 5-speed manual from JDM Mark II and Cressida. Budget 1JZ manual option.',
    description: 'The Toyota W58 is a 5-speed manual transmission found in the JDM Mark II, Chaser, and Cressida. While lighter-duty than the R154, it handles stock to mildly modified 1JZ-GTE power levels and is much more affordable. A great budget-friendly option for 1JZ swap projects.',
    meta_title: 'Toyota W58 5-Speed Manual | Mark II | JDM Tokyo Motorsports',
    meta_description: 'JDM Toyota W58 5-speed manual from Mark II. Budget-friendly 1JZ manual option.',
  },
  {
    sku: 'TRANS-EVO-001',
    title: 'Mitsubishi Evo 5-Speed AWD Manual Transmission',
    category: 'transmission' as const,
    make: 'Mitsubishi',
    model: 'Lancer Evolution',
    year_start: 1996,
    year_end: 2007,
    engine_code: 'EVO-5MT',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Manual',
    price_cents: 280000,
    compare_at_price_cents: 340000,
    quantity: 2,
    featured: false,
    short_description: 'Mitsubishi Evo 5-speed AWD manual with transfer case. Rally-bred drivetrain.',
    description: 'Complete AWD manual transmission assembly from JDM Lancer Evolution models. Includes the transfer case for full AWD capability. Designed to handle the 4G63T\'s output in WRC conditions. Compatible with Evo IV through IX with minor variations.',
    meta_title: 'Mitsubishi Evo AWD Manual Transmission | JDM Tokyo Motorsports',
    meta_description: 'JDM Mitsubishi Evo 5-speed AWD manual with transfer case. Rally-proven drivetrain.',
  },
  {
    sku: 'TRANS-RB25-001',
    title: 'Nissan RB25 5-Speed Manual Transmission — Skyline R33',
    category: 'transmission' as const,
    make: 'Nissan',
    model: 'Skyline',
    year_start: 1993,
    year_end: 1998,
    engine_code: 'FS5R30A',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Manual',
    price_cents: 140000,
    compare_at_price_cents: 190000,
    quantity: 3,
    featured: false,
    short_description: 'Nissan FS5R30A 5-speed manual from JDM R33 Skyline. Matched to RB25DET.',
    description: 'The Nissan FS5R30A is the factory 5-speed manual transmission paired with the RB25DET in the R33 Skyline GTS-T. A robust transmission capable of handling moderate power levels. Ideal for RB25 builds, drift cars, and Skyline restorations.',
    meta_title: 'Nissan FS5R30A 5-Speed Manual | Skyline R33 | JDM Tokyo Motorsports',
    meta_description: 'JDM Nissan FS5R30A 5-speed manual from R33 Skyline. RB25DET factory companion.',
  },
  {
    sku: 'TRANS-CIVIC-001',
    title: 'Honda Civic Type R 5-Speed LSD Manual — EK9',
    category: 'transmission' as const,
    make: 'Honda',
    model: 'Civic Type R',
    year_start: 1997,
    year_end: 2000,
    engine_code: 'S4C-LSD',
    displacement: null,
    cylinders: null,
    fuel_type: null,
    transmission_type: 'Manual',
    price_cents: 200000,
    compare_at_price_cents: 260000,
    quantity: 2,
    featured: false,
    short_description: 'Honda EK9 Civic Type R 5-speed with factory LSD. Close-ratio gears for B16B.',
    description: 'Factory 5-speed close-ratio manual transmission from the JDM Civic Type R EK9 with integrated helical LSD. This is one of the most desirable Honda transmissions due to the factory limited-slip differential. Matched to the B16B engine for optimal gear ratios. Rare and highly collectible.',
    meta_title: 'Honda Civic Type R LSD Manual | EK9 | JDM Tokyo Motorsports',
    meta_description: 'JDM Honda Civic Type R EK9 5-speed with factory LSD. Close-ratio B16B companion.',
  },
];

// ─── Demo Order Data (for pagination) ────────────────────────────────────────

const DEMO_CUSTOMERS = [
  { name: 'John Martinez', email: 'john.martinez@example.com' },
  { name: 'Sarah Chen', email: 'sarah.chen@example.com' },
  { name: 'Mike Thompson', email: 'mike.thompson@example.com' },
  { name: 'Emily Nakamura', email: 'emily.nakamura@example.com' },
  { name: 'Carlos Rivera', email: 'carlos.rivera@example.com' },
  { name: 'Alex Kim', email: 'alex.kim@example.com' },
  { name: 'David O\'Brien', email: 'david.obrien@example.com' },
  { name: 'Lisa Yamamoto', email: 'lisa.yamamoto@example.com' },
  { name: 'Ryan Patel', email: 'ryan.patel@example.com' },
  { name: 'Jessica Wong', email: 'jessica.wong@example.com' },
  { name: 'Brandon Lee', email: 'brandon.lee@example.com' },
  { name: 'Amanda Foster', email: 'amanda.foster@example.com' },
  { name: 'Kevin Tanaka', email: 'kevin.tanaka@example.com' },
  { name: 'Megan Brooks', email: 'megan.brooks@example.com' },
  { name: 'Chris Hernandez', email: 'chris.hernandez@example.com' },
];

const DEMO_STATUSES: Array<{ status: string; payment: string }> = [
  { status: 'pending', payment: 'pending' },
  { status: 'confirmed', payment: 'paid' },
  { status: 'processing', payment: 'paid' },
  { status: 'shipped', payment: 'paid' },
  { status: 'delivered', payment: 'paid' },
  { status: 'cancelled', payment: 'refunded' },
];

const DEMO_ADDRESSES = [
  { line1: '123 Main St', city: 'Los Angeles', state: 'CA', zip: '90001', country: 'US' },
  { line1: '456 Oak Ave', city: 'San Francisco', state: 'CA', zip: '94102', country: 'US' },
  { line1: '789 Elm Blvd', city: 'Houston', state: 'TX', zip: '77001', country: 'US' },
  { line1: '321 Pine Dr', city: 'Phoenix', state: 'AZ', zip: '85001', country: 'US' },
  { line1: '654 Maple Ln', city: 'Seattle', state: 'WA', zip: '98101', country: 'US' },
];

// ─── Blog Post Data ───────────────────────────────────────────────────────────

const blogData = [
  {
    slug: 'top-5-jdm-engines-for-your-build',
    title: 'Top 5 JDM Engines for Your Next Build',
    excerpt:
      'From the legendary 2JZ-GTE to the high-revving B18C, we break down the five JDM engines ' +
      'every enthusiast should know — and why they belong in your build.',
    content: `# Top 5 JDM Engines for Your Next Build

Whether you're planning a track weapon, a drift car, or a street machine, choosing the right JDM engine is the foundation of any successful build. Here are five engines we see requested every day at JDM Tokyo Motorsports, and for good reason.

## 1. Toyota 2JZ-GTE

No list of top JDM engines is complete without the 2JZ-GTE. Originally found in the JDM Toyota Supra (A80), this 3.0-liter twin-turbocharged inline-6 has earned a near-mythical reputation for its ability to handle enormous power levels on the factory block. With proper supporting modifications, 700–800 hp is achievable without opening the engine.

**Best for:** Drag builds, drift cars, high-power street builds.

## 2. Honda B18C (Type R)

The Integra Type R's 1.8-liter DOHC VTEC is arguably the finest naturally aspirated four-cylinder ever mass-produced. With a 8,500 RPM redline and a power delivery that rewards skilled drivers, the B18C is the gold standard for Honda track and time-attack builds.

**Best for:** Track cars, time attack, Honda swaps.

## 3. Nissan SR20DET

The SR20DET's combination of compact size, turbocharged performance, and outstanding aftermarket support makes it the go-to engine for drift builds and 240SX swaps. Blacktop and redtop variants offer different performance characteristics to suit your needs.

**Best for:** Drift cars, 240SX swaps, budget performance builds.

## 4. Mazda 13B-REW

Unique among internal combustion engines, the 13B-REW's sequential twin-turbo setup and rotary design deliver a power-to-weight ratio unmatched by any conventional engine. The smoothness and high-RPM capability of the rotary make it a sensory experience like no other.

**Best for:** RX-7 restoration, rotary swaps, lightweight sports cars.

## 5. Mitsubishi 4G63T

The rally-bred 4G63T powered Lancer Evolution cars to multiple WRC championships. Its cast-iron block provides outstanding strength, and the engine responds tremendously to turbo and fueling upgrades. A true motorsport legend available at a reasonable price point.

**Best for:** AWD builds, track cars, EVO swaps.

---

All of these engines are available now at JDM Tokyo Motorsports. Contact us or browse our catalog for current inventory and pricing.`,
    status: 'published' as const,
    meta_title: 'Top 5 JDM Engines for Your Build | JDM Tokyo Motorsports Blog',
    meta_description:
      'Discover the top 5 JDM engines for performance builds: 2JZ-GTE, B18C, SR20DET, 13B-REW, and 4G63T. Expert breakdown from JDM Tokyo Motorsports.',
    published_at: new Date('2025-03-15').toISOString(),
  },
  {
    slug: 'how-to-verify-jdm-engine-quality',
    title: 'How to Verify JDM Engine Quality Before You Buy',
    excerpt:
      'Not all JDM engines are equal. Learn what to look for — compression numbers, oil condition, ' +
      'mileage documentation, and red flags — before committing to a purchase.',
    content: `# How to Verify JDM Engine Quality Before You Buy

Purchasing a used JDM engine is a significant investment. Whether you're sourcing locally or buying online from a specialist like JDM Tokyo Motorsports, knowing how to evaluate engine quality protects your wallet and your build.

## 1. Request Compression Test Results

A compression test is the most reliable indicator of an engine's internal health. All cylinders should read within 10% of each other. For rotary engines like the 13B-REW, request a rotor-face pressure test rather than a standard compression check.

**What to look for:** Consistent readings across all cylinders (or rotor faces). Low or wildly inconsistent readings indicate worn rings, head gasket issues, or valve problems.

## 2. Check the Oil Condition

Ask for a photo of the oil on the dipstick or the oil cap underside. Milky or frothy oil indicates coolant contamination — a sign of a compromised head gasket or cracked block.

**What to look for:** Dark but non-milky oil is acceptable. Any white residue or foamy texture is a red flag.

## 3. Inspect for External Leaks

Request photos of the engine from multiple angles. Common leak points include the valve cover gasket, rear main seal, and timing cover. Minor seepage is common on aged JDM units, but active leaks suggest deferred maintenance.

## 4. Mileage Documentation

Reputable sellers provide documentation from Japanese auction sheets showing odometer readings. Ask for the JDM auction inspection sheet (オークションシート) — it includes a condition grade and mileage verification.

**What to look for:** Grade 3.5 or higher on Japanese auction scales. Mileage under 80,000 km is considered excellent for most performance engines.

## 5. Buy from a Reputable Specialist

Sourcing from a dedicated JDM importer like JDM Tokyo Motorsports ensures each engine has been inspected by our team before listing. We provide compression test results, photos, and mileage documentation for every unit in our inventory.

---

Have questions about a specific engine? [Contact us](/contact) and our team will provide the documentation you need to buy with confidence.`,
    status: 'published' as const,
    meta_title: 'How to Verify JDM Engine Quality | JDM Tokyo Motorsports Blog',
    meta_description:
      'Learn how to evaluate JDM engine quality: compression tests, oil inspection, mileage documentation, and auction sheet grading. Expert guide from JDM Tokyo Motorsports.',
    published_at: new Date('2025-04-02').toISOString(),
  },
  {
    slug: 'jdm-engine-shipping-guide',
    title: 'JDM Engine Shipping: What to Expect After You Order',
    excerpt:
      'From palletization to freight delivery at your door, here\'s the complete guide to how JDM engines ship ' +
      'and what you need to prepare on your end.',
    content: `# JDM Engine Shipping: What to Expect After You Order

Once you've placed your order with JDM Tokyo Motorsports, the shipping process begins immediately. Here's a step-by-step breakdown of what happens between your purchase and the engine arriving at your door.

## Step 1: Order Confirmation and Preparation (1–2 Business Days)

After payment is confirmed, our warehouse team pulls your engine from inventory and performs a final visual inspection. The engine is then drained of residual fluids, capped, and secured on a wooden pallet with industrial-grade strapping.

## Step 2: Freight Carrier Assignment

Engines and transmissions are heavy freight items. We use LTL (less-than-truckload) freight carriers for all engine shipments. You'll receive an email with:

- Tracking number
- Carrier name
- Estimated delivery window (typically 3–7 business days after pickup)

## Step 3: Delivery Appointment

For residential deliveries, the freight carrier will call you to schedule a delivery appointment. Make sure the phone number on your order is correct. **You must be present to accept the delivery.**

**Important:** If you selected residential delivery, ensure you have someone available to help unload. Engines are heavy — the 2JZ-GTE, for example, weighs approximately 500 lbs on its pallet.

## Step 4: Inspection at Delivery

Before signing the delivery receipt, inspect the pallet and packaging for damage. If you notice damage, note it on the delivery receipt before signing. Refuse delivery only if damage is severe and clearly engine-impacting.

## Step 5: Contact Us With Any Issues

Our support team is available Monday–Friday to handle any shipping questions, damage claims, or delivery concerns. We're committed to getting your engine to you safely and quickly.

---

For business deliveries (forklift or loading dock available), shipping rates are lower. Select the correct delivery type during checkout to ensure accurate shipping costs.`,
    status: 'published' as const,
    meta_title: 'JDM Engine Shipping Guide | What to Expect | JDM Tokyo Motorsports',
    meta_description:
      'Complete guide to JDM engine shipping: palletization, freight carriers, delivery appointments, and what to check on arrival. From JDM Tokyo Motorsports.',
    published_at: new Date('2025-04-20').toISOString(),
  },
];

// ─── Seed Function ────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  console.log('🌱 Starting seed...\n');

  // ── Makes & Models (must run before products) ──
  await seedMakesAndModels();

  // ── Engines ──
  console.log('→ Seeding engines...');
  let enginesInserted = 0;
  let enginesSkipped = 0;

  for (const engine of engines) {
    const exists = await productExists(engine.sku);
    if (exists) {
      await updateProductMakeModel(engine.sku, engine.make, engine.model);
      console.log(`  ✓  Updated make/model: ${engine.sku} — ${engine.title}`);
      enginesSkipped++;
      continue;
    }

    const engineMakeId = await resolveMakeId(engine.make);
    const engineModelId = engine.model && engineMakeId ? await resolveModelId(engine.model, engineMakeId) : null;

    await db.insert(products).values({
      sku: engine.sku,
      slug: slug(engine.title),
      title: engine.title,
      description: engine.description,
      short_description: engine.short_description,
      category: engine.category,
      price_cents: engine.price_cents,
      compare_at_price_cents: engine.compare_at_price_cents,
      make_id: engineMakeId,
      model_id: engineModelId,
      make: engine.make,
      model: engine.model,
      year_start: engine.year_start,
      year_end: engine.year_end,
      engine_code: engine.engine_code,
      displacement: engine.displacement,
      cylinders: engine.cylinders,
      fuel_type: engine.fuel_type,
      quantity: engine.quantity,
      max_per_order: 1,
      low_stock_threshold: 1,
      show_when_out_of_stock: false,
      featured: engine.featured,
      status: 'active',
      meta_title: engine.meta_title,
      meta_description: engine.meta_description,
    });

    console.log(`  ✓  Inserted: ${engine.sku} — ${engine.title}`);
    enginesInserted++;
  }

  console.log(
    `\n  Engines: ${enginesInserted} inserted, ${enginesSkipped} skipped.\n`,
  );

  // ── Transmissions ──
  console.log('→ Seeding transmissions...');
  let transInserted = 0;
  let transSkipped = 0;

  for (const trans of transmissions) {
    const exists = await productExists(trans.sku);
    if (exists) {
      await updateProductMakeModel(trans.sku, trans.make, trans.model);
      console.log(`  ✓  Updated make/model: ${trans.sku} — ${trans.title}`);
      transSkipped++;
      continue;
    }

    const transMakeId = await resolveMakeId(trans.make);
    const transModelId = trans.model && transMakeId ? await resolveModelId(trans.model, transMakeId) : null;

    await db.insert(products).values({
      sku: trans.sku,
      slug: slug(trans.title),
      title: trans.title,
      description: trans.description,
      short_description: trans.short_description,
      category: trans.category,
      price_cents: trans.price_cents,
      compare_at_price_cents: trans.compare_at_price_cents,
      make_id: transMakeId,
      model_id: transModelId,
      make: trans.make,
      model: trans.model,
      year_start: trans.year_start,
      year_end: trans.year_end,
      engine_code: trans.engine_code,
      displacement: trans.displacement,
      cylinders: trans.cylinders,
      fuel_type: trans.fuel_type,
      transmission_type: trans.transmission_type,
      quantity: trans.quantity,
      max_per_order: 1,
      low_stock_threshold: 1,
      show_when_out_of_stock: false,
      featured: trans.featured,
      status: 'active',
      meta_title: trans.meta_title,
      meta_description: trans.meta_description,
    });

    console.log(`  ✓  Inserted: ${trans.sku} — ${trans.title}`);
    transInserted++;
  }

  console.log(
    `\n  Transmissions: ${transInserted} inserted, ${transSkipped} skipped.\n`,
  );

  // ── Additional Engines ──
  console.log('→ Seeding additional engines...');
  let addEnginesInserted = 0;
  let addEnginesSkipped = 0;

  for (const engine of additionalEngines) {
    const exists = await productExists(engine.sku);
    if (exists) {
      await updateProductMakeModel(engine.sku, engine.make, engine.model);
      console.log(`  ✓  Updated make/model: ${engine.sku} — ${engine.title}`);
      addEnginesSkipped++;
      continue;
    }

    const addEngineMakeId = await resolveMakeId(engine.make);
    const addEngineModelId = engine.model && addEngineMakeId ? await resolveModelId(engine.model, addEngineMakeId) : null;

    await db.insert(products).values({
      sku: engine.sku,
      slug: slug(engine.title),
      title: engine.title,
      description: engine.description,
      short_description: engine.short_description,
      category: engine.category,
      price_cents: engine.price_cents,
      compare_at_price_cents: engine.compare_at_price_cents,
      make_id: addEngineMakeId,
      model_id: addEngineModelId,
      make: engine.make,
      model: engine.model,
      year_start: engine.year_start,
      year_end: engine.year_end,
      engine_code: engine.engine_code,
      displacement: engine.displacement,
      cylinders: engine.cylinders,
      fuel_type: engine.fuel_type,
      quantity: engine.quantity,
      max_per_order: 1,
      low_stock_threshold: 1,
      show_when_out_of_stock: false,
      featured: engine.featured,
      status: 'active',
      meta_title: engine.meta_title,
      meta_description: engine.meta_description,
    });

    console.log(`  ✓  Inserted: ${engine.sku} — ${engine.title}`);
    addEnginesInserted++;
  }

  console.log(`  Additional engines: ${addEnginesInserted} inserted, ${addEnginesSkipped} skipped.\n`);

  // ── Additional Transmissions ──
  console.log('→ Seeding additional transmissions...');
  let addTransInserted = 0;
  let addTransSkipped = 0;

  for (const trans of additionalTransmissions) {
    const exists = await productExists(trans.sku);
    if (exists) {
      await updateProductMakeModel(trans.sku, trans.make, trans.model);
      console.log(`  ✓  Updated make/model: ${trans.sku} — ${trans.title}`);
      addTransSkipped++;
      continue;
    }

    const addTransMakeId = await resolveMakeId(trans.make);
    const addTransModelId = trans.model && addTransMakeId ? await resolveModelId(trans.model, addTransMakeId) : null;

    await db.insert(products).values({
      sku: trans.sku,
      slug: slug(trans.title),
      title: trans.title,
      description: trans.description,
      short_description: trans.short_description,
      category: trans.category,
      price_cents: trans.price_cents,
      compare_at_price_cents: trans.compare_at_price_cents,
      make_id: addTransMakeId,
      model_id: addTransModelId,
      make: trans.make,
      model: trans.model,
      year_start: trans.year_start,
      year_end: trans.year_end,
      engine_code: trans.engine_code,
      displacement: trans.displacement,
      cylinders: trans.cylinders,
      fuel_type: trans.fuel_type,
      transmission_type: trans.transmission_type,
      quantity: trans.quantity,
      max_per_order: 1,
      low_stock_threshold: 1,
      show_when_out_of_stock: false,
      featured: trans.featured,
      status: 'active',
      meta_title: trans.meta_title,
      meta_description: trans.meta_description,
    });

    console.log(`  ✓  Inserted: ${trans.sku} — ${trans.title}`);
    addTransInserted++;
  }

  console.log(`  Additional transmissions: ${addTransInserted} inserted, ${addTransSkipped} skipped.\n`);

  // ── Demo Orders ──
  await seedDemoOrders();

  // ── Blog Posts ──
  console.log('→ Seeding blog posts...');
  let blogInserted = 0;
  let blogSkipped = 0;

  for (const post of blogData) {
    const exists = await blogExists(post.slug);
    if (exists) {
      console.log(`  ⏭  Skipped (exists): ${post.slug}`);
      blogSkipped++;
      continue;
    }

    await db.insert(blogPosts).values({
      slug: post.slug,
      title: post.title,
      content: post.content,
      excerpt: post.excerpt,
      status: post.status,
      meta_title: post.meta_title,
      meta_description: post.meta_description,
      published_at: post.published_at,
    });

    console.log(`  ✓  Inserted: ${post.slug}`);
    blogInserted++;
  }

  console.log(
    `\n  Blog posts: ${blogInserted} inserted, ${blogSkipped} skipped.\n`,
  );

  // ── Site Settings (sale_conditions) ──
  await seedSettings();

  // ── Product Images ──
  await seedProductImages();

  // ── Enrich product detail fields (mileage, condition, included, specs, warranty) ──
  await enrichProductDetails();

  const totalProducts = engines.length + transmissions.length;
  console.log('\n✅ Seed complete.');
  console.log(
    `   Products: ${enginesInserted + transInserted}/${totalProducts} inserted`,
  );
  console.log(
    `   Blog posts: ${blogInserted}/${blogData.length} inserted`,
  );
}

// ─── Settings & Policy Content ────────────────────────────────────────────────

const POLICY_WARRANTY = [
  {
    type: 'highlight',
    icon: 'shield',
    title: '30-Day Warranty on All Units',
    content:
      'JDM Tokyo Motorsports warrants all engines and transmissions against defects in materials and workmanship for 30 days from the date of delivery. If your unit fails within this period due to a covered defect, we will replace it or provide a full refund.',
  },
  {
    type: 'bullets',
    icon: 'check',
    title: 'What Is Covered',
    content: [
      'Compression failures not disclosed at time of sale',
      'Internal mechanical defects present at time of shipment',
      'Incorrect unit shipped (wrong engine code or model)',
      'Units with undisclosed damage discovered upon inspection',
      'Significant mileage discrepancy from listed specification',
    ].join('\n'),
  },
  {
    type: 'bullets',
    icon: 'alert',
    title: 'What Is Not Covered',
    content: [
      'Damage caused by improper installation or modification',
      'Normal wear and tear during operation',
      'Damage caused by overheating, lack of oil, or coolant issues after installation',
      'External components such as sensors, wiring harnesses, or accessories',
    ].join('\n'),
  },
  {
    type: 'numbered',
    title: 'How to File a Claim',
    content: [
      'Contact our team by phone (+1 800 536-8669) or email (sales@jdmtokyomotors.com) within 30 days of delivery.',
      'Provide your order number, photos of the unit, and a description of the issue.',
      'Our team will review your claim within 1–2 business days and provide a resolution.',
      'Approved claims will receive a replacement unit or full refund processed through Stripe.',
    ].join('\n'),
  },
  {
    type: 'disclaimer',
    icon: 'clock',
    title: 'Warranty Duration',
    content:
      'The warranty period begins on the date of delivery as confirmed by the freight carrier. Claims must be submitted within 30 calendar days of delivery to be eligible.',
  },
];

const POLICY_SHIPPING = [
  {
    type: 'cards',
    title: 'Shipping Rates',
    content: '',
    items: [
      {
        title: 'Business Address',
        value: '$500',
        description:
          'Delivery to a commercial address with a loading dock or forklift available for unloading.',
        icon: 'building',
      },
      {
        title: 'Residential Address',
        value: '$700',
        description:
          'Delivery to a home or residential address. Includes liftgate service for safe unloading.',
        icon: 'home',
      },
    ],
  },
  {
    type: 'bullets',
    icon: 'truck',
    title: 'Shipping Carriers',
    content: ['Forward Air', 'XPO Logistics', 'Estes Express Lines'].join('\n'),
  },
  {
    type: 'numbered',
    title: 'Delivery Timeline',
    content: [
      'Order Processing (1–2 Business Days) — After payment is confirmed, your order is processed and the unit is prepared for shipping.',
      'Transit Time (3–7 Business Days) — Freight transit times vary by destination. West Coast orders typically arrive faster than East Coast.',
      'Tracking Notification — You will receive tracking information via email once your order ships from our facility.',
    ].join('\n'),
  },
  {
    type: 'disclaimer',
    icon: 'package',
    title: 'Important Shipping Notes',
    content:
      'All engines and transmissions are palletized and wrapped for safe transit. You will need to inspect your shipment upon delivery and note any visible damage on the bill of lading before signing. Contact us immediately if damage is discovered.',
  },
];

const POLICY_RETURNS = [
  {
    type: 'text',
    title: 'Return Policy',
    content:
      'We accept returns within 30 days of delivery for units that qualify under our return eligibility. All refunds are processed through Stripe and typically appear within 5–10 business days.\n\nTo initiate a return, please contact our team by phone or email with your order number and reason for return. We will provide return shipping instructions.',
  },
  {
    type: 'bullets',
    icon: 'check',
    title: 'Eligible for Return',
    content: [
      'Defective units covered under our 30-day warranty',
      'Incorrect unit shipped (wrong engine code or model)',
      'Units with significant undisclosed damage',
    ].join('\n'),
  },
  {
    type: 'bullets',
    icon: 'alert',
    title: 'Not Eligible for Return',
    content: [
      'Units that have been installed or modified',
      'Returns requested after 30 days from delivery',
      'Units damaged due to improper installation or misuse',
    ].join('\n'),
  },
  {
    type: 'numbered',
    title: 'Return Process',
    content: [
      'Contact us by phone (+1 800 536-8669) or email (sales@jdmtokyomotors.com) to initiate your return.',
      'Provide your order number and photos documenting the issue.',
      'We will review your request within 1–2 business days and issue a return authorization if approved.',
      'Return the unit in its original packaging. Once received and inspected, your refund will be processed through Stripe.',
    ].join('\n'),
  },
  {
    type: 'cards',
    title: 'Need Help?',
    content: 'Our team is available Monday–Friday, 9:00 AM – 5:00 PM PST.',
    items: [
      {
        title: 'Call Us',
        value: '+1 (800) 536-8669',
        description: 'Speak with a specialist for fast return authorization.',
        icon: 'phone',
      },
      {
        title: 'Email Us',
        value: 'sales@jdmtokyomotors.com',
        description: 'Send us your order number and we will reply within 1 business day.',
        icon: 'mail',
      },
    ],
  },
];

const POLICY_PRIVACY = [
  {
    type: 'text',
    title: 'Information We Collect',
    content:
      'We collect information you provide directly to us, including your name, email address, phone number, shipping address, and payment information when you place an order. We also automatically collect certain information about your device and how you interact with our website.',
  },
  {
    type: 'text',
    title: 'How We Use Your Information',
    content:
      'We use the information we collect to process your orders, send order confirmations and shipping notifications, respond to your inquiries, improve our website and services, and send promotional communications if you have opted in.',
  },
  {
    type: 'text',
    title: 'Information Sharing',
    content:
      'We do not sell your personal information. We share your information only with service providers who help us operate our business (such as Stripe for payment processing and freight carriers for delivery), and when required by law.',
  },
  {
    type: 'text',
    title: 'Cookies and Tracking',
    content:
      'We use cookies and similar tracking technologies to enhance your browsing experience, remember your preferences, and analyze website traffic. You can disable cookies in your browser settings, but some features of the site may not function properly.',
  },
  {
    type: 'highlight',
    icon: 'shield',
    title: 'Data Security',
    content:
      'We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. Payment information is processed securely by Stripe and is never stored on our servers.',
  },
  {
    type: 'text',
    title: 'Your Rights',
    content:
      'You have the right to access, correct, or delete your personal information. You may also opt out of promotional communications at any time by clicking the unsubscribe link in any email or by contacting us directly.',
  },
  {
    type: 'disclaimer',
    icon: 'mail',
    title: 'Contact Us',
    content:
      'If you have questions about this Privacy Policy, please contact us at sales@jdmtokyomotors.com or call +1 (800) 536-8669. We are available Monday through Friday, 9:00 AM to 5:00 PM PST.',
  },
];

// ─── Trust badges + home category cards (admin-editable) ──────────────────────

const TRUST_BADGES = [
  {
    icon: 'shield',
    title: '30-Day Warranty',
    description: 'Every engine and transmission is backed by our comprehensive 30-day warranty.',
  },
  {
    icon: 'truck',
    title: 'Free Inspection',
    description: 'All units are inspected and tested before shipping from our facility.',
  },
  {
    icon: 'gauge',
    title: 'Low Mileage',
    description: 'JDM units typically have 30k–80k miles, far less than US counterparts.',
  },
  {
    icon: 'headset',
    title: 'Expert Support',
    description: 'Our specialists are available Monday–Friday to help with fitment and orders.',
  },
];

const HOME_CATEGORIES = [
  {
    title: 'Engines',
    description: 'JDM 4-cylinder, V6, rotary, and twin-turbo engines from Japan.',
    href: '/engines',
    image: '/images/categories/engines.jpg',
    icon: 'engine',
  },
  {
    title: 'Transmissions',
    description: 'Manual, automatic, CVT, and sequential JDM transmissions.',
    href: '/transmissions',
    image: '/images/categories/transmissions.jpg',
    icon: 'transmission',
  },
  {
    title: 'Parts',
    description: 'Performance parts, OEM replacements, and JDM accessories.',
    href: '/parts',
    image: '/images/categories/parts.jpg',
    icon: 'parts',
  },
];

const POLICY_TERMS = [
  {
    type: 'text',
    title: 'Acceptance of Terms',
    content:
      'By accessing and placing an order with JDM Tokyo Motorsports, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree, please do not use our website or place orders.',
  },
  {
    type: 'text',
    title: 'Products and Descriptions',
    content:
      'We make every effort to display accurate product information, including specifications, mileage, and condition details. All units are sourced from Japanese domestic market vehicles and inspected before listing. Photos are representative and may not depict the exact unit you receive.',
  },
  {
    type: 'text',
    title: 'Orders and Acceptance',
    content:
      'All orders are subject to acceptance and availability. We reserve the right to refuse or cancel any order at our discretion, including in the event of pricing errors, suspected fraud, or stock issues. You will be notified and refunded promptly if your order is cancelled.',
  },
  {
    type: 'text',
    title: 'Payment',
    content:
      'Payment is processed securely via Stripe at the time of checkout. We accept all major credit and debit cards. Your order will not be shipped until payment has been successfully captured.',
  },
  {
    type: 'text',
    title: 'Shipping',
    content:
      'Shipping rates are $500 for business addresses and $700 for residential addresses, shipped via freight carrier. Transit times typically range from 3–7 business days after order processing. See our Shipping page for full details.',
  },
  {
    type: 'text',
    title: 'Returns and Refunds',
    content:
      'Returns are accepted within 30 days of delivery for eligible items, as outlined in our Returns and Warranty policies. Refunds are processed through Stripe and may take 5–10 business days to appear on your statement.',
  },
  {
    type: 'highlight',
    icon: 'alert',
    title: 'Limitation of Liability',
    content:
      'JDM Tokyo Motorsports is not liable for any damages arising from improper installation, modification, or use of our products. Our maximum liability for any claim is limited to the purchase price of the product.',
  },
  {
    type: 'text',
    title: 'Governing Law',
    content:
      'These terms are governed by the laws of the State of California. Any disputes shall be resolved in the courts of Los Angeles County, California.',
  },
];

async function upsertSetting(
  key: string,
  value: string,
  description?: string,
  overwriteIfEmpty = false,
): Promise<'inserted' | 'updated' | 'skipped'> {
  const existing = await db
    .select({ id: saleConditions.id, rule_value: saleConditions.rule_value })
    .from(saleConditions)
    .where(eq(saleConditions.rule_key, key))
    .get();

  if (existing) {
    if (!overwriteIfEmpty) return 'skipped';
    // Treat missing/whitespace/empty-JSON-array as empty and replace.
    const cur = (existing.rule_value ?? '').trim();
    const isEmpty = cur === '' || cur === '[]' || cur === '{}' || cur === 'null';
    if (!isEmpty) return 'skipped';
    await db
      .update(saleConditions)
      .set({ rule_value: value, description: description ?? null, updated_at: new Date().toISOString() })
      .where(eq(saleConditions.id, existing.id));
    return 'updated';
  }

  await db.insert(saleConditions).values({
    rule_key: key,
    rule_value: value,
    description: description ?? null,
    is_active: true,
    updated_at: new Date().toISOString(),
  });
  return 'inserted';
}

const VEHICLE_DATA = [
  { name: 'Honda', models: ['Civic', 'Integra', 'Accord', 'S2000', 'Prelude', 'NSX', 'CR-V', 'Fit', 'Odyssey', 'Civic Type R'], yearRange: { min: 1985, max: 2025 } },
  { name: 'Toyota', models: ['Supra', 'Celica', 'MR2', 'Corolla', 'Chaser', 'Mark II', 'Altezza', 'Soarer', 'Land Cruiser', 'Camry', 'GT86', 'Corolla AE86'], yearRange: { min: 1980, max: 2025 } },
  { name: 'Nissan', models: ['Skyline', 'Silvia', '180SX', '240SX', '350Z', '370Z', 'GT-R', 'GT-R R35', 'Fairlady Z', 'Sentra', 'Altima', 'Maxima', 'Skyline GT-R', 'Primera'], yearRange: { min: 1985, max: 2025 } },
  { name: 'Subaru', models: ['Impreza', 'WRX', 'WRX STI', 'Legacy', 'Forester', 'Outback', 'BRZ'], yearRange: { min: 1990, max: 2025 } },
  { name: 'Mazda', models: ['RX-7', 'RX-8', 'MX-5', 'Eunos Roadster', 'Speed3', 'Miata', 'Mazda3', 'Mazda6', 'MX-5 Miata'], yearRange: { min: 1985, max: 2025 } },
  { name: 'Mitsubishi', models: ['Lancer', 'Evolution', '3000GT', 'Eclipse', 'Galant', 'Pajero', '3000GT VR-4', 'Lancer Evolution'], yearRange: { min: 1985, max: 2025 } },
  { name: 'Acura', models: ['Integra', 'RSX', 'NSX', 'TL', 'TSX', 'MDX'], yearRange: { min: 1985, max: 2025 } },
  { name: 'Lexus', models: ['IS300', 'IS250', 'GS300', 'LS400', 'SC300', 'SC430', 'RX300'], yearRange: { min: 1990, max: 2025 } },
  { name: 'Infiniti', models: ['G35', 'G37', 'Q50', 'Q60', 'I30', 'I35'], yearRange: { min: 1990, max: 2025 } },
  { name: 'Hyundai', models: ['Genesis', 'Tiburon', 'Veloster', 'Elantra', 'Sonata'], yearRange: { min: 1990, max: 2025 } },
  { name: 'Kia', models: ['Stinger', 'Optima', 'Forte', 'Soul'], yearRange: { min: 2000, max: 2025 } },
];

const NAVBAR_LINKS = (() => {
  const names = VEHICLE_DATA.map(m => m.name.toLowerCase());
  return {
    mainBrands: names.slice(0, 6),
    otherBrands: names.slice(6),
    customLinks: [],
    moreLinks: ['about', 'blog', 'contact', 'track-order', 'warranty', 'shipping', 'returns', 'privacy', 'terms'],
  };
})();

async function seedMakesAndModels(): Promise<void> {
  console.log('\n→ Seeding makes and models...');

  let makesInserted = 0;
  let modelsInserted = 0;

  for (let i = 0; i < VEHICLE_DATA.length; i++) {
    const v = VEHICLE_DATA[i];
    const slug = v.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const existingMake = await db
      .select({ id: makes.id })
      .from(makes)
      .where(eq(makes.name, v.name))
      .get();

    let makeId: string;
    if (existingMake) {
      makeId = existingMake.id;
      console.log(`  ⏭  Skipped make (exists): ${v.name}`);
    } else {
      makeId = crypto.randomUUID();
      await db.insert(makes).values({
        id: makeId,
        name: v.name,
        slug,
        year_range_min: v.yearRange.min,
        year_range_max: v.yearRange.max,
        sort_order: i,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log(`  ✓  Inserted make: ${v.name}`);
      makesInserted++;
    }

    for (const modelName of v.models) {
      const existingModel = await db
        .select({ id: models.id })
        .from(models)
        .where(and(eq(models.name, modelName), eq(models.make_id, makeId)))
        .get();

      if (existingModel) {
        continue;
      }

      const modelSlug = modelName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      await db.insert(models).values({
        id: crypto.randomUUID(),
        name: modelName,
        slug: modelSlug,
        make_id: makeId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      modelsInserted++;
    }
  }

  console.log(`  Makes: ${makesInserted} inserted, models: ${modelsInserted} inserted.\n`);
}

async function seedNavbarLinks(): Promise<void> {
  console.log('\n→ Seeding navbar settings...');

  const key = 'navbar_links';
  const value = JSON.stringify(NAVBAR_LINKS);

  const existing = await db
    .select({ id: navbarSettings.id, setting_value: navbarSettings.setting_value })
    .from(navbarSettings)
    .where(eq(navbarSettings.setting_key, key))
    .get();

  if (existing) {
    const cur = (existing.setting_value ?? '').trim();
    const isEmpty = cur === '' || cur === '[]' || cur === '{}' || cur === 'null';
    if (!isEmpty) {
      console.log(`  ⏭  Skipped (exists): ${key}`);
      return;
    }
    await db
      .update(navbarSettings)
      .set({ setting_value: value, updated_at: new Date().toISOString() })
      .where(eq(navbarSettings.setting_key, key));
    console.log(`  ↻  Filled empty: ${key}`);
    return;
  }

  await db.insert(navbarSettings).values({
    setting_key: key,
    setting_value: value,
    description: 'Navbar brand configuration',
    is_active: true,
    updated_at: new Date().toISOString(),
  });
  console.log(`  ✓  Inserted: ${key}`);
}

async function seedSettings(): Promise<void> {
  console.log('\n→ Seeding site settings (contact info & policies)...');

  const settings: Array<{ key: string; value: string; desc?: string; overwriteIfEmpty?: boolean }> = [
    // Contact & hours
    { key: 'contact_phone', value: '+1 (800) 536-8669', desc: 'Public phone number' },
    { key: 'contact_email', value: 'sales@jdmtokyomotors.com', desc: 'Public email address' },
    { key: 'contact_address', value: '123 JDM Way, Los Angeles, CA 90001', desc: 'Public business address' },
    { key: 'hours_weekdays', value: '9:00 AM – 5:00 PM PST', desc: 'Business hours Mon–Fri' },
    { key: 'hours_saturday', value: '9:00 AM – 3:00 PM PST', desc: 'Business hours Saturday' },
    { key: 'hours_sunday', value: 'Closed', desc: 'Business hours Sunday' },

    // Policy pages — JSON-encoded structured sections.
    // Overwrite empty arrays so previously-saved empty admin values get filled.
    { key: 'policy_warranty', value: JSON.stringify(POLICY_WARRANTY), desc: 'Warranty page content', overwriteIfEmpty: true },
    { key: 'policy_shipping', value: JSON.stringify(POLICY_SHIPPING), desc: 'Shipping page content', overwriteIfEmpty: true },
    { key: 'policy_returns', value: JSON.stringify(POLICY_RETURNS), desc: 'Returns page content', overwriteIfEmpty: true },
    { key: 'policy_privacy', value: JSON.stringify(POLICY_PRIVACY), desc: 'Privacy page content', overwriteIfEmpty: true },
    { key: 'policy_terms', value: JSON.stringify(POLICY_TERMS), desc: 'Terms page content', overwriteIfEmpty: true },

    // Home page sections
    { key: 'trust_badges', value: JSON.stringify(TRUST_BADGES), desc: 'Trust badges shown on the home page', overwriteIfEmpty: true },
    { key: 'home_categories', value: JSON.stringify(HOME_CATEGORIES), desc: 'Category cards shown on the home page', overwriteIfEmpty: true },

    // Free shipping threshold (cents). 0 = disabled.
    { key: 'free_shipping_threshold_cents', value: '0', desc: 'Free shipping threshold in cents (0 = disabled)' },

    // Shipping carriers and their tracking URLs
    {
      key: 'shipping_carriers',
      value: JSON.stringify([
        { name: 'UPS', tracking_url: 'https://www.ups.com/track?tracknum={tracking_number}' },
        { name: 'FedEx', tracking_url: 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}' },
        { name: 'USPS', tracking_url: 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}' },
        { name: 'DHL', tracking_url: 'https://www.dhl.com/en/express/tracking.html?AWB={tracking_number}' }
      ]),
      desc: 'Configured shipping carriers and their tracking URLs',
      overwriteIfEmpty: true
    },

    // Vehicle data (makes, models, year ranges)
    { key: 'vehicle_data', value: JSON.stringify(VEHICLE_DATA), desc: 'Vehicle makes, models, and year ranges', overwriteIfEmpty: true },
  ];

  // Seed navbar_links in navbar_settings table
  await seedNavbarLinks();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  for (const { key, value, desc, overwriteIfEmpty } of settings) {
    const result = await upsertSetting(key, value, desc, overwriteIfEmpty);
    if (result === 'inserted') {
      console.log(`  ✓  Inserted: ${key}`);
      inserted++;
    } else if (result === 'updated') {
      console.log(`  ↻  Filled empty: ${key}`);
      updated++;
    } else {
      console.log(`  ⏭  Skipped (exists): ${key}`);
      skipped++;
    }
  }
  console.log(`  Settings: ${inserted} inserted, ${updated} filled, ${skipped} skipped.`);
}

// ─── Product Images ───────────────────────────────────────────────────────────
//
// Seeds at least one image per product so cards aren't empty.
// Uses any existing files under /uploads/products/medium/ as a placeholder pool.

import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

async function seedProductImages(): Promise<void> {
  console.log('\n→ Seeding product images...');

  const mediumDir = join(process.cwd(), 'uploads', 'products', 'medium');
  let pool: string[] = [];
  if (existsSync(mediumDir)) {
    pool = readdirSync(mediumDir)
      .filter((f) => /\.(webp|jpg|jpeg|png)$/i.test(f))
      .map((f) => `/uploads/products/medium/${f}`);
  }

  if (pool.length === 0) {
    console.log('  ⚠  No image files found in uploads/products/medium/. Skipping image seed.');
    return;
  }

  const allProducts = await db.select({ id: products.id, sku: products.sku }).from(products);
  let inserted = 0;
  let skipped = 0;
  let poolIdx = 0;

  for (const p of allProducts) {
    const existing = await db
      .select({ id: productImages.id })
      .from(productImages)
      .where(eq(productImages.product_id, p.id))
      .get();
    if (existing) {
      skipped++;
      continue;
    }

    const imagePath = pool[poolIdx % pool.length];
    poolIdx++;

    await db.insert(productImages).values({
      product_id: p.id,
      image_path: imagePath,
      alt_text: p.sku,
      sort_order: 0,
    });

    // Mirror to primary_image_path on the product if not already set.
    await db
      .update(products)
      .set({ primary_image_path: imagePath })
      .where(eq(products.id, p.id));

    console.log(`  ✓  Image attached: ${p.sku} → ${imagePath}`);
    inserted++;
  }

  console.log(`  Product images: ${inserted} inserted, ${skipped} skipped.`);}

// ─── Product detail enrichment ───────────────────────────────────────────────
//
// Fills in mileage_km, condition, condition_notes, included_items, specs_json,
// warranty_summary for any product where they are still NULL/empty. Uses
// sensible JDM-shop defaults derived from the product's own fields. Idempotent.

async function enrichProductDetails(): Promise<void> {
  console.log('\n→ Enriching product detail fields...');

  const allProducts = await db.select().from(products);
  let updated = 0;

  for (const p of allProducts) {
    const patch: Partial<typeof products.$inferInsert> = {};

    if (!p.mileage_km) {
      // 30k–80k km — typical low-mileage JDM range. Deterministic by SKU hash.
      const seed = (p.sku ?? '').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
      const km = 30000 + ((seed * 137) % 50000);
      patch.mileage_km = km;
    }

    if (!p.condition) {
      patch.condition = 'JDM Used – Inspected & Tested';
    }

    if (!p.condition_notes) {
      patch.condition_notes =
        `Sourced directly from the Japanese domestic market. Each unit is visually inspected for ` +
        `oil leaks, external damage, missing components, and abnormal wear before being listed. ` +
        `Compression and spark are checked where applicable. ` +
        `Internal inspection is not performed unless explicitly listed; minor cosmetic wear is normal for used JDM units.`;
    }

    if (!p.included_items) {
      const isTrans = p.category === 'transmission';
      patch.included_items = isTrans
        ? [
            'Transmission assembly',
            'Bell housing (where applicable)',
            'Shift fork & internals',
            'Input/output shafts',
            '30-day warranty coverage',
          ].join('\n')
        : [
            'Long block engine assembly',
            'Intake & exhaust manifolds (where applicable)',
            'Throttle body / injectors (when present on donor)',
            'Wiring harness (no ECU)',
            'Mechanical inspection report',
            '30-day warranty coverage',
          ].join('\n');
    }

    if (!p.specs_json) {
      const specs: Array<{ label: string; value: string }> = [];
      if (p.engine_code) specs.push({ label: 'Engine Code', value: p.engine_code });
      if (p.displacement) specs.push({ label: 'Displacement', value: p.displacement });
      if (p.cylinders) specs.push({ label: 'Cylinders', value: String(p.cylinders) });
      if (p.fuel_type) specs.push({ label: 'Fuel Type', value: p.fuel_type });
      if (p.transmission_type) specs.push({ label: 'Transmission Type', value: p.transmission_type });
      if (p.year_start && p.year_end)
        specs.push({ label: 'Year Range', value: `${p.year_start}–${p.year_end}` });
      specs.push({ label: 'Origin', value: 'Japan (JDM)' });
      specs.push({ label: 'Condition', value: 'Used – Inspected' });
      patch.specs_json = JSON.stringify(specs);
    }

    if (!p.warranty_summary) {
      patch.warranty_summary =
        '30-day warranty against major defects. See our Warranty page for full coverage details.';
    }

    if (Object.keys(patch).length > 0) {
      await db.update(products).set(patch).where(eq(products.id, p.id));
      updated++;
    }
  }

  console.log(`  Enriched ${updated}/${allProducts.length} products.`);
}

// ─── Demo Orders ──────────────────────────────────────────────────────────────

async function seedDemoOrders(): Promise<void> {
  console.log('\n→ Seeding demo orders...');

  // Check if we already have orders
  const existingOrders = await db.select({ id: orders.id }).from(orders).limit(1);
  if (existingOrders.length > 0) {
    console.log('  ⏭  Skipped (orders already exist).');
    return;
  }

  // Get all products to use in order items
  const allProducts = await db
    .select({ id: products.id, title: products.title, sku: products.sku, price_cents: products.price_cents })
    .from(products);

  if (allProducts.length === 0) {
    console.log('  ⚠  No products available for demo orders. Skipping.');
    return;
  }

  const ORDER_COUNT = 28;
  let inserted = 0;

  for (let i = 0; i < ORDER_COUNT; i++) {
    const customer = DEMO_CUSTOMERS[i % DEMO_CUSTOMERS.length];
    const statusInfo = DEMO_STATUSES[i % DEMO_STATUSES.length];
    const address = DEMO_ADDRESSES[i % DEMO_ADDRESSES.length];
    const [firstName, ...lastParts] = customer.name.split(' ');
    const lastName = lastParts.join(' ');

    // Pick 1-2 products for the order
    const itemCount = (i % 2) + 1;
    const orderProducts = [];
    for (let j = 0; j < itemCount; j++) {
      orderProducts.push(allProducts[(i + j) % allProducts.length]);
    }

    const shippingCents = i % 3 === 0 ? 70000 : 50000;
    const subtotalCents = orderProducts.reduce((sum, p) => sum + p.price_cents, 0);
    const totalCents = subtotalCents + shippingCents;

    // Create a date spread over the last 60 days
    const daysAgo = Math.floor((ORDER_COUNT - i) * 2);
    const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();
    const orderNumber = `JDM-${String(10001 + i)}`;

    const orderId = crypto.randomUUID();

    await db.insert(orders).values({
      id: orderId,
      order_number: orderNumber,
      customer_email: customer.email,
      customer_first_name: firstName,
      customer_last_name: lastName,
      customer_phone: `+1 (555) ${String(100 + i).padStart(3, '0')}-${String(1000 + i * 7).slice(-4)}`,
      shipping_line1: address.line1,
      shipping_city: address.city,
      shipping_state: address.state,
      shipping_zip: address.zip,
      shipping_country: address.country,
      shipping_type: i % 4 === 0 ? 'forklift' : i % 4 === 1 ? 'no_forklift' : i % 4 === 2 ? 'liftgate' : 'residential_delivery',
      subtotal_cents: subtotalCents,
      shipping_cents: shippingCents,
      tax_cents: 0,
      total_cents: totalCents,
      payment_status: statusInfo.payment as 'pending' | 'paid' | 'failed' | 'refunded' | 'partially_refunded',
      status: statusInfo.status as 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled',
      tracking_number: statusInfo.status === 'shipped' || statusInfo.status === 'delivered'
        ? `1Z999AA1${String(1000000 + i * 137).slice(-7)}`
        : null,
      carrier: statusInfo.status === 'shipped' || statusInfo.status === 'delivered' ? 'XPO Logistics' : null,
      shipped_at: statusInfo.status === 'shipped' || statusInfo.status === 'delivered' ? createdAt : null,
      delivered_at: statusInfo.status === 'delivered' ? createdAt : null,
      created_at: createdAt,
      updated_at: createdAt,
    });

    // Insert order items
    for (const prod of orderProducts) {
      await db.insert(orderItems).values({
        order_id: orderId,
        product_id: prod.id,
        quantity: 1,
        unit_price_cents: prod.price_cents,
        total_cents: prod.price_cents,
        product_title: prod.title,
        product_sku: prod.sku,
      });
    }

    inserted++;
  }

  console.log(`  Demo orders: ${inserted} inserted.`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
