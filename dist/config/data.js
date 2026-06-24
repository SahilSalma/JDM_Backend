"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("./database");
const POLICY_WARRANTY = [
    {
        type: "text",
        title: "1. Warranty Duration & Coverage",
        content: "JDM Tokyo Motorsports warrants that every used engine and transmission sold will be in a serviceable condition, having regard to the nature of used automotive components, for the durations specified below.\n\n1.1 Warranty Start Date\n- In-Store Pickups / Local Sales: The warranty period begins immediately on the purchase/pickup date.\n- Out-of-State / Freight Shipments: The warranty period begins on the day the shipment is marked delivered by the freight carrier."
    },
    {
        type: "cards",
        title: "Product Classifications & Warranty Terms",
        content: "Below is the warranty duration by product classification.",
        items: [
            { title: "Used Replacement Engines", value: "60 Days", description: "Unless otherwise specified on sales receipt", icon: "zap" },
            { title: "Used Replacement Transmissions", value: "60 Days", description: "Unless otherwise specified on sales receipt", icon: "settings2" },
            { title: "Used Performance Engines", value: "30 Days", description: "Strictly non-returnable and non-exchangeable", icon: "sparkles" },
            { title: "Used Performance Transmissions", value: "30 Days", description: "Strictly non-returnable and non-exchangeable", icon: "settings2" },
            { title: "Rotary Engines (Mazda 13BT / 13BTT / 20B)", value: "NO WARRANTY", description: "Sold \"AS IS\"", icon: "help-circle" },
            { title: "ECUs & Electronic Parts", value: "NO WARRANTY", description: "Sold \"AS IS\"", icon: "credit-card" }
        ]
    },
    {
        type: "bullets",
        icon: "help-circle",
        title: "Other Products Sold AS-IS (No Warranty)",
        content: "Accessories & Add-on Items: NO WARRANTY (All accessory sales are final)\nBody, Interior, Wheels, & Suspension: NO WARRANTY (Sold \"AS IS\")\nFront End, Hood, Headlights, Fenders: NO WARRANTY (Sold \"AS IS\")"
    },
    {
        type: "text",
        title: "2. Mandatory Pre-Installation & Maintenance Requirements",
        content: "To maintain warranty validity, the customer must comply with strict preparation and maintenance procedures. Failure to perform and document these steps will completely void the warranty.\n\n2.1 Certified Installation:\nAll engines and transmissions must be installed by a certified mechanic. JDM Tokyo Motorsports does not provide technical support for custom chassis installations or aftermarket \"swaps.\""
    },
    {
        type: "bullets",
        icon: "wrench",
        title: "2.2 Required Pre-Installation Actions",
        content: "Gaskets & Seals: Install a new rear main seal, new oil pan gasket, and new valve cover gaskets.\nOil System Care: Thoroughly clean the oil pickup tube and replace the oil filter. Fill the engine with manufacturer-suggested oil types and levels.\nCooling System Overhaul: Install a brand-new water pump and a new thermostat. Perform a comprehensive flush of all cooling lines and the radiator before filling with fresh antifreeze.\nTiming & Ignition: Replace the timing belt/chain (if applicable), inspect/replace all external accessory drive belts, and install brand-new spark plugs.\nFluid Lines: Flush all external transmission cooling and oil lines to prevent contamination from previous vehicle debris."
    },
    {
        type: "numbered",
        title: "2.3 Post-Installation Break-In Maintenance",
        content: "The engine oil and filter must be changed after the first 600 miles of operation, and at standard factory intervals thereafter.\nProof of maintenance (receipts, work orders) must be retained by the customer in the event of a claim.\nLong Block Recommendation: JDM Tokyo Motorsports highly recommends utilizing the bare engine block (long block) only, and swapping your original vehicle's factory accessories (intake/exhaust manifolds, wiring harness, brackets, sensors, injectors, and ECU) onto the JDM engine block for optimal compatibility."
    },
    {
        type: "text",
        title: "3. Disclaimers, Exclusions, & Voiding Factors",
        content: "This limited warranty covers the internal operating components of the engine block and cylinder head(s) only. It explicitly excludes all external and attached accessories."
    },
    {
        type: "bullets",
        icon: "info",
        title: "3.1 Non-Covered Components",
        content: "Intake and exhaust manifolds, carburetors, fuel injectors, fuel systems, and fuel pumps.\nAlternators, starters, distributors, coil packs, ignitors, wiring harnesses, and ECUs.\nPower steering pumps, oil pumps, water pumps, thermostats, belts, and hoses.\nClutches, flywheels, pressure plates, pulleys, engine mounts, axles, and half-shafts.\nFactory or aftermarket turbocharger/supercharger units."
    },
    {
        type: "bullets",
        icon: "shield",
        title: "3.2 Immediate Warranty Voiding Conditions",
        content: "Prohibited Modifications: Installation of aftermarket forced induction, nitrous oxide (NOS), alcohol injection systems, or aftermarket ECU tuning upgrades not explicitly designed for the stock engine configuration.\nInternal Alteration: Opening, dismantling, or swapping internal components, including the removal of cylinder heads, crankshafts, connecting rods, pistons, camshafts, gears, or opening the transmission casing.\nMisuse & Racing: The vehicle is used for competitive driving, racing, track events, rallying, or shows evidence of abuse, neglect, overheating, or operation with insufficient fluid levels.\nEnvironmental Damage: Failure caused by collision, fire, theft, vandalism, water ingestion (hydrolock), freezing, or environmental disasters."
    },
    {
        type: "bullets",
        icon: "help-circle",
        title: "3.3 General Sales Disclaimers",
        content: "Labor & Inconvenience: JDM Tokyo Motorsports is strictly not liable for labor costs associated with the installation or removal of any part, towing fees, car rentals, storage fees, or any incidental inconveniences.\nFitment Responsibility: Vehicle fitment is the sole responsibility of the buyer. Buyers must independently verify chassis, engine bay, and drivetrain compatibility before finalizing a purchase. JDM Tokyo Motorsports is not responsible for incorrect fitment.\nSmog & Emissions Compliance: We make no guarantee that JDM components will meet local, state, or federal emissions or smog testing guidelines. It is the buyer's responsibility to review local environmental regulations before purchasing."
    },
    {
        type: "text",
        title: "4. Warranty Claims, Returns, & Order Cancellations",
        content: "Detailed guidelines for submitting warranty claims, returning parts, or cancelling orders."
    },
    {
        type: "numbered",
        title: "4.1 Warranty Claim Procedure",
        content: "Initiation: All warranty claims must be submitted formally via email with a precise, written explanation of the mechanical issue.\nFreight & Testing: The customer is responsible for pre-paying all return freight charges to ship a suspected defective item back to our facility. JDM Tokyo Motorsports will inspect and test the engine/transmission to verify the validity of the claim.\nResolution: If the component is verified to be defective under our covered terms, JDM Tokyo Motorsports will ship a replacement unit at no extra part cost. If the component is determined not to be defective, the customer must pay the return freight costs to have the item shipped back to them.\nAsset Return Timeline: In the event that a replacement unit is dispatched to the customer before the original item is sent back, the original item must be securely returned to our facility within ten (10) days. Failure to return the original item within this window will result in the customer being billed full price for both units, plus all associated freight charges."
    },
    {
        type: "bullets",
        icon: "rotate-ccw",
        title: "4.2 Return & Cancellation Rules",
        content: "Window: All return requests must be filed via email within thirty (30) days from the initial purchase date. Performance engines are strictly exempt from standard return/exchange options.\nCondition of Returns: Returned items must be received in the exact condition they were originally sold: fully assembled, unmodified, and matching the original sales photography. Missing or swapped parts will be billed directly to the customer or will invalidate the return completely.\nRestocking & Order Fees: Orders cancelled before shipment are subject to normal cancellation processing. Any refused shipments, unauthorized returns, or accepted returns are subject to a 35% restocking fee calculated from the total unit invoice amount, plus all accumulated round-trip freight and shipping costs.\nDeposits: All customer deposits are strictly non-refundable and non-transferable."
    }
];
const POLICY_RETURNS = [
    {
        type: "text",
        title: "1. Return Guidelines & Conditions",
        content: "All returns must be fully legitimate and strictly comply with the terms of our Warranty & Sales Policy. By purchasing from JDM Tokyo Motorsports, the buyer explicitly accepts and agrees to the following terms:"
    },
    {
        type: "bullets",
        icon: "rotate-ccw",
        title: "Return Guidelines & Conditions",
        content: "Return Window: Any return request must be formally submitted via email within 30 days from the original date of purchase.\nPrepaid Shipping & Fees: Initial shipping charges are completely non-refundable. All costs associated with returning an item—including round-trip freight shipping, customs fees, and localized duties—must be prepaid entirely by the customer.\nItem Condition: In the event that a return is authorized, the item must be returned in the exact same condition as originally sold and must be fully assembled.\nComponent Retention: You must retain and include all components, unwanted accessories, or parts that were attached to the item at the sale. We must receive every part included in the package for the claim to be valid. The returned item must match our original inventory photography.\nReturn File Initiation: Buyers must contact our customer support desk via email to formally establish a return file prior to shipping any items back to our warehouse. Unscheduled or unauthorized shipments will be refused."
    },
    {
        type: "text",
        title: "2. Inspection & Validation Process",
        content: "Mandatory Testing: All returned items and components are subjected to a rigorous physical inspection and diagnostic testing process upon arrival at our facility. This inspection is used to verify that no structural, mechanical, or cosmetic damage occurred while the item was in the client's possession.\n\nProof of Delivery Disclaimer: When our warehouse staff signs for a returned shipment (Proof of Delivery), the act of signing acknowledges physical receipt only. It does not imply or constitute acceptance of your return or warranty claim."
    },
    {
        type: "bullets",
        icon: "shield",
        title: "Inspection Resolutions",
        content: "Damage Exclusions: If our inspection reveals that the engine, transmission, or part was damaged, improperly handled, altered, or destroyed while in the client's possession, JDM Tokyo Motorsports will not issue a refund, exchange, or any other form of compensation.\nValid Claims: If the claim is determined to be valid under our guidelines, we will notify you and initiate a replacement unit shipment or issue a refund.\nInvalid Claims: If the claim is determined to be invalid, no replacement unit will be sent, and no refund will be issued."
    },
    {
        type: "text",
        title: "3. Refund & Cancellation Terms",
        content: "We maintain strict guidelines regarding final sales, deposits, and order cancellations."
    },
    {
        type: "bullets",
        icon: "credit-card",
        title: "Refund & Restocking Details",
        content: "Final Sale Policy: All sales are final. There are strictly no refunds, returns, or exchanges on standard loose parts, body panels, electrical elements, or accessories.\nNon-Refundable Deposits: All customer holds, booking fees, and deposits are strictly non-refundable.\nOrder Cancellations: An order can only be cancelled free of restocking fees if the request is processed before the item has been packed and shipped from our facility.\nRestocking & Freight Fees: All refused shipments, rejected freight deliveries, or authorized returns for non-defective items are subject to a mandatory 35% restocking fee calculated from the total invoice unit amount. The customer will also be held fully responsible for all round-trip freight charges."
    },
    {
        type: "cards",
        title: "Need Help with Returns?",
        content: "Contact us to establish a return file or for any help.",
        items: [
            { title: "Email Us", value: "jdmtokyomotors@gmail.com", description: "Initiate your return file by email. Replies within 1 business day.", icon: "mail" },
            { title: "Call Us", value: "916-917-5588", description: "Support available Monday–Friday, 9:00 AM – 5:00 PM PST.", icon: "phone" }
        ]
    }
];
const POLICY_PRIVACY = [
    {
        type: "text",
        title: "1. Introduction & Scope",
        content: "This Privacy Policy describes how jdmtokyomotorsports.com (the \"Site\", \"we\", \"us\", or \"our\") collects, uses, and discloses your Personal Information when you visit the platform, interact with our services, or make a purchase from our online store.\n\nBy utilizing our Site, you acknowledge and agree to the data collection, utilization, and disclosure protocols outlined in this policy document."
    },
    {
        type: "text",
        title: "2. Collecting Personal Information",
        content: "When you visit the Site, we collect certain information about your device, your interaction with the Site, and information necessary to process your transactions. We may also collect additional information if you contact our customer support desks directly.\n\nIn this Privacy Policy, \"Personal Information\" refers to any information that can uniquely identify an individual. Below is a detailed breakdown of the data points we gather and why:"
    },
    {
        type: "bullets",
        icon: "info",
        title: "2.1 Device Information",
        content: "Examples of Data Collected: Web browser version, IP address, localized time zone, cookie profile records, viewed products, specific search queries, and real-time interaction metrics with the Site.\nPurpose of Collection: To ensure the Site loads accurately for your system and configuration, and to perform advanced usage analytics to optimize our interface.\nSource of Collection: Gathered automatically when you access our Site using technical scripts such as cookies, log files, web beacons, tags, or pixels.\nBusiness Disclosures: Shared directly with our automated core e-commerce and payment processors (WooCommerce and Stripe)."
    },
    {
        type: "bullets",
        icon: "shopping-bag",
        title: "2.2 Order Information",
        content: "Examples of Data Collected: Legal name, billing address, shipping destination address, phone number, email address, and encrypted payment information (including credit card numbers).\nPurpose of Collection: To fulfill our sales contract with you, process your payment info, arrange specialized freight shipping, issue invoices/order confirmations, protect against fraud or risk, and provide targeted marketing updates based on your explicit preferences.\nSource of Collection: Provided directly and voluntarily by you at the time of purchase.\nBusiness Disclosures: Shared directly with our e-commerce and payment processors (WooCommerce and Stripe)."
    },
    {
        type: "bullets",
        icon: "message-square",
        title: "2.3 Customer Support Information",
        content: "Examples of Data Collected: Correspondence history, vehicle specifications, verification images, or any supplementary personal context provided during troubleshooting.\nPurpose of Collection: To deliver accurate technical support, process warranty claims, and handle order adjustments.\nSource of Collection: Collected directly from you during communication.\nBusiness Disclosures: Retained internally within our secure customer relation databases to manage ongoing client issues."
    },
    {
        type: "text",
        title: "3. Age Restrictions & Minors",
        content: "We do not intentionally or knowingly collect Personal Information from children or minors. If you are a parent or legal guardian and believe your child has mistakenly provided us with identifiable Personal Information, please contact us immediately at our listed corporate address to request an absolute deletion of that data from our servers."
    },
    {
        type: "bullets",
        icon: "globe",
        title: "4. Sharing Personal Information",
        content: "Service Providers: Shared with dedicated third-party service providers to help us execute our contractual requirements and optimize our services as described above.\nWooCommerce: We utilize WooCommerce to power our active digital e-commerce storefront.\nStripe: We utilize Stripe to manage secure, encrypted financial transactions.\nCompliance & Rights: Shared if necessary to comply with applicable laws and regulatory mandates, respond to a subpoena or search warrant, or safeguard our legal corporate rights."
    },
    {
        type: "text",
        title: "5. Behavioral Advertising & Digital Marketing",
        content: "We use your Personal Information to provide you with tailored advertisements or localized marketing communications that we believe may interest you.\n\nGoogle Analytics: We use Google Analytics to monitor how customers interact with our Site. You can review how Google utilizes this data by reading the Google Privacy Policy. You may also completely opt-out via the Google Analytics Opt-out Tool.\n\nPartner Sharing: We share aggregated transaction histories and interaction metrics with marketing partners through tracking pixels.\n\nFor a comprehensive explanation of how targeted advertising functions, you can visit the Network Advertising Initiative's (\"NAI\") Educational Page."
    },
    {
        type: "bullets",
        icon: "settings2",
        title: "5.1 Opt-Out Control Panels",
        content: "Facebook: Ad Settings Panel\nGoogle: Personalized Ad Settings\nBing: Personalized Ad Policies & Opt-out\nDigital Advertising Alliance: Access a collective opt-out network at the DAA Portal."
    },
    {
        type: "bullets",
        icon: "check-circle",
        title: "6. Lawful Basis for Processing (EEA Residents)",
        content: "Consent: Your explicit, informed consent.\nContract: The performance of a binding sales contract between you and our Site.\nLegal Obligations: Compliance with our structural legal obligations.\nVital Interests: The protection of your vital personal interests.\nLegitimate Interests: Our legitimate business interests, provided they do not override your fundamental rights and freedoms."
    },
    {
        type: "text",
        title: "7. Data Retention & Erasure",
        content: "When you place a transaction order through the Site, we will permanently retain your Order Information for our historical corporate accounting archives unless and until you formally request that we erase this information. Please see below for your corresponding rights of absolute deletion."
    },
    {
        type: "text",
        title: "8. Automated Decision-Making",
        content: "Residents of the EEA maintain the right to object to processing configurations based solely on automated decision-making (including user profiling) when that decision results in a legal or highly significant effect.\n\nJDM Tokyo Motorsports does not engage in fully automated decision-making that carries legal or significant consequences using customer data.\n\nOur e-commerce processors (WooCommerce/Stripe) deploy limited automated decision-making protocols strictly to curb digital fraud. These security functions do not carry long-term legal ramifications for the user:\n- A temporary, short-term IP address denylist triggered by consecutive, failed payment attempts (lasts several hours).\n- A temporary credit card token denylists paired with flagged, security-denied IP addresses (lasts several days)."
    },
    {
        type: "text",
        title: "9. Consumer Data Rights",
        content: "We respect the rights of residents under local privacy regulations (GDPR in the European Economic Area, and CCPA/CPRA in California)."
    },
    {
        type: "bullets",
        icon: "shield-check",
        title: "9.1 GDPR & 9.2 CCPA/CPRA Consumer Rights",
        content: "GDPR (European Economic Area): If you reside within the EEA, you maintain the explicit right to access the Personal Information we hold regarding your profile, to port it directly to a new service platform, or to request that your information be corrected, updated, or fully erased.\nCCPA / CPRA (California Residents): California residents maintain the statutory \"Right to Know\" regarding the Personal Information we compile, the right to port it to alternative services, and the right to demand it be corrected, updated, or permanently deleted.\nRequest Submission: If you would like to appoint an authorized legal agent to file these digital privacy requests on your behalf, please verify their status and contact us through the formal channels listed below."
    },
    {
        type: "text",
        title: "10. Cookie Deployment & Tracking Controls",
        content: "A cookie is a small data package downloaded onto your hardware architecture when you load our Site. We implement distinct functional, performance, analytical, and social media cookies to refine your browsing experience by remembering systemic platform choices (such as user logins or region preferences).\n\nMost cookies deployed on our platform are persistent, designed to expire automatically between 30 minutes and two years from their download timestamp.\n\nManagement: You can manipulate cookie acceptance through your unique browser configuration menu (typically under \"Preferences\" or \"Tools\").\n\nImpact: Please note that disabling or blocking cookies may degrade platform usability, and certain structural segments of our online storefront may cease to function correctly.\n\nDo Not Track Signals: Because there is currently no synchronized industrial consensus on handling automated browser-level \"Do Not Track\" signals, our Site configuration does not alter its baseline data-gathering routines when it detects a DNT broadcast."
    },
    {
        type: "text",
        title: "11. Policy Modifications",
        content: "We reserve the absolute right, at our sole discretion, to revise, update, or replace any structural segment of this Privacy Policy by publishing revised frameworks directly on this page.\n\nIt remains your responsibility to monitor our Site regularly for changes. Your continued use of the platform following updates represents a complete acceptance of the altered terms."
    },
    {
        type: "highlight",
        icon: "mail",
        title: "12. Contact Information & Privacy Support Desk",
        content: "Entity: JDM Tokyo Motorsports\nMailing Address: 980 F Street Ste 20, West Sacramento, CA 95605\nDirect Contact Number: 916-917-5588\nElectronic Privacy Mailbox: jdmtokyomotors@gmail.com\n\nIf you are unsatisfied with our response to a privacy conflict, you maintain the explicit legal right to register a formal complaint directly with your regional data protection authority or local consumer protection bureau."
    }
];
const POLICY_TERMS = [
    {
        type: "text",
        title: "1. Overview & General Agreement",
        content: "This website is operated by JDM Tokyo Motorsports. Throughout the site, the terms \"we\", \"us\" and \"our\" refer to JDM Tokyo Motorsports. We offer this website, including all information, tools, and services available from this site to you, the user, conditioned upon your acceptance of all terms, conditions, policies, and notices stated here.\n\nBy visiting our site and/or purchasing something from us, you engage in our \"Service\" and agree to be bound by the following terms and conditions (\"Terms of Service\", \"Terms\"), including those additional terms, conditions, and policies referenced herein and/or available by hyperlink. These Terms of Service apply to all users of the site, including without limitation users who are browsers, vendors, customers, merchants, and/or contributors of content.\n\nPlease read these Terms of Service carefully before accessing or using our website. By accessing or using any part of the site, you agree to be bound by these Terms of Service. If you do not agree to all the terms and conditions of this agreement, then you may not access the website or use any services.\n\nAny new features or tools which are added to the current store shall also be subject to the Terms of Service. You can review the most current version of the Terms of Service at any time on this page. We reserve the right to update, change, or replace any part of these Terms of Service by posting updates and/or changes to our website. It is your responsibility to check this page periodically for changes. Your continued use of or access to the website following the posting of any changes constitutes acceptance of those changes."
    },
    {
        type: "bullets",
        icon: "info",
        title: "2. Online Store Usage & Eligibility",
        content: "Age of Majority: By agreeing to these Terms of Service, you represent that you are at least the age of majority in your state or province of residence, or that you are the age of majority and give us your consent to allow minor dependents to use this site.\nLawful Use: You may not use our products for any illegal or unauthorized purpose nor may you, in the use of the Service, violate any laws in your jurisdiction (including copyright laws).\nSecurity: You must not transmit any worms or viruses or any code of a destructive nature.\nTermination: A breach or violation of any of the Terms will result in an immediate termination of your access to our Services."
    },
    {
        type: "bullets",
        icon: "shield",
        title: "3. General Corporate Rights",
        content: "Refusal of Service: We reserve the right to refuse service to anyone for any reason at any time.\nData Handling: You understand that your content (not including credit card information) may be transferred unencrypted and involve transmissions over various networks and changes to conform/adapt to technical requirements. Credit card information is always encrypted during transfer.\nIntellectual Property: You agree not to reproduce, duplicate, copy, sell, resell, or exploit any portion of the Service, use of the Service, or access to the Service without express written permission by us."
    },
    {
        type: "text",
        title: "4. Information Accuracy & Updates",
        content: "We are not responsible if information made available on this site is not accurate, complete, or current. The material on this site is provided for general information only and should not be relied upon or used as the sole basis for making decisions without consulting primary, more accurate, more complete, or more timely sources of information. Any reliance on the material on this site is at your own risk.\n\nThis site may contain certain historical information. Historical information, necessarily, is not current and is provided for your reference only. We reserve the right to modify the contents of this site at any time, but we have no obligation to update any information on our site. You agree that it is your responsibility to monitor changes to our site."
    },
    {
        type: "bullets",
        icon: "credit-card",
        title: "5. Modifications to Pricing & Services",
        content: "Price Adjustment: Prices for our products are subject to change without notice.\nDiscontinuance: We reserve the right at any time to modify or discontinue the Service (or any part or content thereof) without notice at any time.\nLiability: We shall not be liable to you or to any third-party for any modification, price change, suspension, or discontinuance of the Service."
    },
    {
        type: "bullets",
        icon: "shopping-bag",
        title: "6. Products, Inventory, & Limitations",
        content: "Online Exclusivity: Certain products or services may be available exclusively online through the website. These products or services may have limited quantities and are subject to return or exchange strictly according to our Warranty & Sales Policy.\nDisplay Accuracy: We have made every effort to display as accurately as possible the colors and images of our products that appear at the store. We cannot guarantee that your monitor's display will be accurate.\nSales Limitations: We reserve the right, but are not obligated, to limit the sales of our products or Services to any person, geographic region, or jurisdiction on a case-by-case basis. We reserve the right to limit the quantities of any products or services that we offer.\nDescriptions & Discontinuation: All descriptions of products or product pricing are subject to change at any time without notice, at our sole discretion. We reserve the right to discontinue any product at any time."
    },
    {
        type: "bullets",
        icon: "settings2",
        title: "7. Account & Billing Accuracy",
        content: "Order Rejection: We reserve the right to refuse any order you place with us. We may, in our sole discretion, limit or cancel quantities purchased per person, per household, or per order (including same account, same card, or same address).\nCommercial Flags: We reserve the right to limit or prohibit orders that, in our sole judgment, appear to be placed by unapproved dealers, resellers, or distributors.\nInformation Maintenance: You agree to provide current, complete, and accurate purchase and account information for all purchases made at our store. You agree to promptly update your account so that we can complete transactions."
    },
    {
        type: "bullets",
        icon: "globe",
        title: "8. Third-Party Links & Resources",
        content: "As-Is Access: You acknowledge and agree that we provide access to third-party tools \"as is\" and \"as available\" without any warranties, representations, or conditions.\nExternal Links: Third-party links on this site may direct you to third-party websites that are not affiliated with us. We are not responsible for examining or evaluating their content.\nDamages: We are not liable for any harm or damages related to the purchase or use of goods, services, resources, content, or any other transactions made in connection with third-party websites."
    },
    {
        type: "text",
        title: "9. User Comments, Feedback, & Submissions",
        content: "If, at our request or without it, you send creative ideas, suggestions, proposals, plans, or other materials (collectively, 'comments'), you agree that we may, at any time, without restriction, edit, copy, publish, distribute, translate, and otherwise use in any medium any comments that you forward to us.\n\nWe are and shall be under no obligation:\n- To maintain any comments in confidence.\n- To pay compensation for any comments.\n- To respond to any comments.\n\nWe may, but have no obligation to, monitor, edit, or remove content that we determine in our sole discretion is unlawful, offensive, threatening, libelous, defamatory, pornographic, obscene, or otherwise objectionable or violates any party's intellectual property or these Terms of Service."
    },
    {
        type: "text",
        title: "10. Errors, Inaccuracies, and Omissions",
        content: "Occasionally there may be information on our site or in the Service that contains typographical errors, inaccuracies, or omissions that may relate to product descriptions, pricing, promotions, offers, product shipping charges, transit times, and availability. We reserve the right to correct any errors, inaccuracies, or omissions, and to change or update information or cancel orders if any information in the Service or on any related website is inaccurate at any time without prior notice (including after you have submitted your order).\n\nWe undertake no obligation to update, amend, or clarify information in the Service or on any related website, including without limitation, pricing information, except as required by law."
    },
    {
        type: "bullets",
        icon: "help-circle",
        title: "11. Prohibited Usage of Platform",
        content: "Unlawful use or soliciting others to perform unlawful acts.\nViolating regulations, rules, laws, or local ordinances.\nInfringing upon or violating our intellectual property rights or the rights of others.\nHarassment, abuse, insult, harm, defamation, slander, or discrimination based on gender, orientation, religion, race, age, origin, or disability.\nSubmitting false/misleading info or uploading malicious code.\nCollecting or tracking personal info of others; spamming, phishing, pharming, scraping.\nInterfering with or circumventing website or Internet security features."
    },
    {
        type: "text",
        title: "12. Disclaimer of Warranties & Limitation of Liability",
        content: "We do not guarantee, represent, or warrant that your use of our service will be uninterrupted, timely, secure, or error-free. We do not warrant that the results that may be obtained will be accurate or reliable.\n\nYou agree that from time to time we may remove the service for indefinite periods of time or cancel the service at any time, without notice to you. You expressly agree that your use of, or inability to use, the service is at your sole risk.\n\nThe service and all products are provided 'as is' and 'as available' for your use, without any representation, warranties, or conditions of any kind, either express or implied, including all implied warranties or conditions of merchantability, merchantable quality, fitness for a particular purpose, durability, title, and non-infringement.\n\nIn no case shall JDM Tokyo Motorsports, our directors, officers, employees, or suppliers be liable for any injury, loss, claim, or any direct, indirect, incidental, punitive, special, or consequential damages of any kind—including lost profits, lost revenue, lost savings, loss of data, replacement costs, or any similar damages—arising from your use of any of the service or products. Our liability shall be limited to the maximum extent permitted by law."
    },
    {
        type: "bullets",
        icon: "info",
        title: "13. Indemnification & Severability",
        content: "Indemnification: You agree to indemnify, defend, and hold harmless JDM Tokyo Motorsports and our affiliates, partners, officers, and employees, harmless from any claim or demand made by any third-party due to or arising out of your breach of these Terms of Service.\nSeverability: In the event that any provision of these Terms of Service is determined to be unlawful, void, or unenforceable, such provision shall nonetheless be enforceable to the fullest extent permitted by applicable law, and the unenforceable portion shall be deemed to be severed from these Terms of Service."
    },
    {
        type: "bullets",
        icon: "clock",
        title: "14. Termination & Entire Agreement",
        content: "Survival: The obligations and liabilities of the parties incurred prior to the termination date shall survive the termination of this agreement.\nDuration: These Terms of Service are effective unless and until terminated by either you or us. You may terminate at any time by ceasing to use our site.\nBreach: If you fail to comply with any term, we may terminate this agreement at any time without notice and you will remain liable for all amounts due.\nWaiver: The failure of us to exercise or enforce any right shall not constitute a waiver.\nEntirety: These Terms of Service and any policies constitute the entire agreement and supersede any prior agreements."
    },
    {
        type: "text",
        title: "15. Governing Law & Jurisdictional Authority",
        content: "These Terms of Service and any separate agreements whereby we provide you Services shall be governed by and construed in accordance with the laws of the United States."
    },
    {
        type: "highlight",
        icon: "mail",
        title: "16. Contact Information & Corporate Identity",
        content: "Business Entity: JDM Tokyo Motorsports\nCorporate Mailing Address: 980 F Street Ste 20, West Sacramento, CA 95605\nDirect Support Phone Line: 916-917-5588\nElectronic Communication Desk: jdmtokyomotors@gmail.com\n\nLast Updated: May 15, 2026"
    }
];
const STORY_P1 = "At JDM Tokyo Motorsports, we are specializing about delivering Authentic Japanese Domestic Market (JDM) Automotive Parts, Performance Upgrades, and OEM components for a wide range of vehicles. With strong connections to Japan's automotive market and our main supplier in Japan, we provide high-quality parts including Low miles JDM engines, transmissions to enhance power, reliability, and style.";
const STORY_P2 = "Our Mission is to connect customers with high-quality JDM parts sourced directly from Japan's world-renowned automotive industry, ensuring exceptional quality, reliability, and performance you can trust.";
const STORY_P3 = "Whether you're building a high-performance car, restoring a classic JDM vehicle, or upgrading your daily driver, we provide reliable access to imported car parts, expert support, and competitive pricing. Every product we supply is carefully selected to ensure quality, compatibility, and performance.";
function upsertSetting(key, value, description = "") {
    const row = database_1.sqlite.prepare("SELECT id FROM sale_conditions WHERE rule_key = ?").get(key);
    const now = new Date().toISOString();
    if (row) {
        database_1.sqlite.prepare("UPDATE sale_conditions SET rule_value = ?, description = ?, updated_at = ? WHERE rule_key = ?").run(value, description, now, key);
        console.log(`Updated setting: ${key}`);
    }
    else {
        database_1.sqlite.prepare("INSERT INTO sale_conditions (id, rule_key, rule_value, description, is_active, updated_at) VALUES (?, ?, ?, ?, ?, ?)").run(crypto_1.default.randomUUID(), key, value, description, 1, now);
        console.log(`Inserted setting: ${key}`);
    }
}
function main() {
    try {
        upsertSetting("policy_warranty", JSON.stringify(POLICY_WARRANTY), "Warranty page content");
        upsertSetting("policy_returns", JSON.stringify(POLICY_RETURNS), "Returns page content");
        upsertSetting("policy_privacy", JSON.stringify(POLICY_PRIVACY), "Privacy page content");
        upsertSetting("policy_terms", JSON.stringify(POLICY_TERMS), "Terms page content");
        upsertSetting("about_story_p1", STORY_P1, "About page story paragraph 1");
        upsertSetting("about_story_p2", STORY_P2, "About page story paragraph 2");
        upsertSetting("about_story_p3", STORY_P3, "About page story paragraph 3");
        upsertSetting("contact_phone", "916-917-5588", "Public phone number");
        upsertSetting("contact_email", "jdmtokyomotors@gmail.com", "Public email address");
        upsertSetting("contact_address", "980 F Street Ste 20, West Sacramento, CA 95605", "Public business address");
        console.log("All contents imported successfully to DB!");
    }
    catch (e) {
        console.error("Error during import:", e);
        process.exit(1);
    }
}
main();
//# sourceMappingURL=data.js.map