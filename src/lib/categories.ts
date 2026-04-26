/**
 * Master taxonomy for SokoniArena.
 *
 * 3 levels:
 *   Section  → e.g. "Vehicles & Transportation"
 *   Category → e.g. "Cars"
 *   Subcategory → e.g. "Used"
 *
 * Each section is mapped to the listing_type (product / service / event) it
 * primarily belongs to. Sections that span multiple types use "all".
 *
 * The slug for each section is what gets stored in the `section` column on
 * listings. Categories and subcategories are stored as their display labels
 * (matching existing `category` / `subcategory` columns).
 *
 * IMPORTANT: This file is the single source of truth. The DB is seeded from
 * it via the optional `categories` table (see migrations), but the app reads
 * directly from this file for filters, forms, and search.
 */

export type ListingTypeScope = "product" | "service" | "event" | "all";

export interface SubCategory {
  /** Display label (also stored in DB as `subcategory`). */
  label: string;
}

export interface Category {
  /** Display label (also stored in DB as `category`). */
  label: string;
  /** URL-safe slug (used in querystrings). */
  slug: string;
  subcategories?: SubCategory[];
}

export interface Section {
  /** Stable slug stored on listings.section + used in URLs. */
  slug: string;
  /** Display label. */
  label: string;
  /** Which listing_type tabs this section appears under. */
  scope: ListingTypeScope;
  /** Optional short description for tooltips / category landing pages. */
  description?: string;
  categories: Category[];
}

const sub = (...labels: string[]): SubCategory[] => labels.map((label) => ({ label }));
const cat = (label: string, subs?: SubCategory[]): Category => ({
  label,
  slug: label
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, ""),
  subcategories: subs,
});

export const SECTIONS: Section[] = [
  {
    slug: "vehicles",
    label: "Vehicles & Transportation",
    scope: "all",
    description: "Cars, bikes, boats, machinery and everything that moves.",
    categories: [
      cat("Cars", sub("New", "Used", "Electric", "Hybrid")),
      cat("Motorcycles & Scooters"),
      cat("Buses & Microbuses"),
      cat("Trucks & Trailers"),
      cat("Construction & Heavy Machinery"),
      cat("Watercraft & Boats", sub("Sailboats", "Motorboats", "Jet Skis")),
      cat("Aircraft", sub("Private Planes", "Helicopters", "Ultralights")),
      cat("Personal Mobility", sub("E-Scooters", "E-Unicycles", "Hoverboards", "Skateboards")),
      cat("Car Services", sub("Repair", "Detailing", "Towing", "Rental")),
      cat("Vehicle Parts & Accessories", sub("Tyres", "Batteries", "Lights", "Audio", "Spare Parts")),
      cat("Car Electronics", sub("GPS", "Dashcams", "Parking Sensors")),
    ],
  },
  {
    slug: "property",
    label: "Property & Real Estate",
    scope: "all",
    categories: [
      cat("Houses & Apartments For Sale"),
      cat("Houses & Apartments For Rent"),
      cat("Short Let / Vacation Rentals"),
      cat("Land & Plots For Sale"),
      cat("Land & Plots For Rent"),
      cat("Commercial Property", sub("Offices For Sale", "Offices For Rent", "Retail Spaces", "Warehouses")),
      cat("New Builds / Pre-construction"),
      cat("Event Centres, Venues & Workstations"),
      cat("Shared / Co-working Spaces"),
      cat("Property Services", sub("Appraisal", "Property Management", "Cleaning")),
    ],
  },
  {
    slug: "electronics",
    label: "Electronics",
    scope: "product",
    categories: [
      cat("Mobile Phones", sub("Smartphones", "Feature Phones", "Refurbished")),
      cat("Tablets", sub("iPad", "Android", "Windows", "E-Readers")),
      cat("Laptops & Computers", sub("Netbooks", "Ultrabooks", "Notebooks", "Workstations", "Desktops")),
      cat("Computer Components", sub("CPUs", "GPUs", "Motherboards", "RAM", "Cooling/Fans", "Internal Drives")),
      cat("Computer Accessories", sub("Keyboards", "Mice", "Webcams", "Docking Stations", "Laptop Bags")),
      cat("Computer Monitors", sub("Gaming", "Professional", "Portable")),
      cat("Printers & Scanners", sub("Inkjet", "Laser", "3D Printers")),
      cat("Networking Products", sub("Routers", "Switches", "WiFi Extenders", "Cables")),
      cat("Data Storage", sub("External HDD", "USB Flash Drives", "SSDs", "NAS", "Memory Cards")),
      cat("TV & Video Equipment", sub("LED/OLED/QD-OLED", "Projectors", "Screens", "TV Mounts")),
      cat("Home Audio", sub("Soundbars", "Home Theater Systems", "Receivers", "Woofers")),
      cat("Headphones & Earphones", sub("In-Ear", "Over-Ear", "True Wireless", "Noise-Cancelling")),
      cat("Portable / Bluetooth Speakers"),
      cat("Cameras", sub("DSLR", "Mirrorless", "Compact", "Action Cams", "360 Cams", "Cinema Cams")),
      cat("Camera & Photo Accessories", sub("Tripods", "Lenses", "Flashes", "Bags", "Studio Lights")),
      cat("Security & Surveillance", sub("IP Cameras", "CCTV Kits", "Doorbells", "Alarm Systems")),
      cat("Gaming Consoles", sub("PlayStation", "Xbox", "Nintendo", "PSP", "Handhelds")),
      cat("Video Games", sub("Digital", "Physical Discs/Cartridges", "Pre-owned")),
      cat("PC Gaming", sub("Gaming Chairs", "Controllers", "VR Headsets", "Racing Wheels", "Stream Decks")),
      cat("Smart Watches & Wearables"),
      cat("Batteries & Power", sub("Powerbanks", "Rechargeable Batteries", "Chargers")),
      cat("Health & Fitness Electronics", sub("Smart Scales", "ECG Monitors", "Blood Pressure Monitors")),
      cat("Refurbished & Open-Box"),
    ],
  },
  {
    slug: "home-furniture-appliances",
    label: "Home, Furniture & Appliances",
    scope: "product",
    categories: [
      cat("Living Room Furniture", sub("Sofas", "Coffee Tables", "TV Stands", "Recliners")),
      cat("Bedroom Furniture", sub("Beds", "Mattresses", "Wardrobes", "Dressers", "Nightstands")),
      cat("Dining Furniture", sub("Dining Tables", "Chairs", "Benches", "Bar Stools")),
      cat("Office Furniture", sub("Desks", "Office Chairs", "Bookshelves", "Filing Cabinets")),
      cat("Outdoor Furniture", sub("Patio Furniture", "Garden Benches", "Hammocks", "Parasols")),
      cat("Children's Furniture", sub("Beds", "Desks", "Play Tables", "Storage")),
      cat("Large Appliances", sub("Refrigerators", "Washers", "Dryers", "Dishwashers", "Ovens", "Stoves")),
      cat("Small Kitchen Appliances", sub("Microwaves", "Blenders", "Air Fryers", "Coffee Makers", "Toasters", "Kettles", "Slow Cookers")),
      cat("Home Environment", sub("Air Conditioners", "Heaters", "Humidifiers", "Dehumidifiers", "Fans", "Air Purifiers")),
      cat("Floor Care", sub("Vacuum Cleaners", "Robot Vacuums", "Steam Mops")),
      cat("Home Decor", sub("Rugs & Carpets", "Wall Art", "Mirrors", "Artificial Plants", "Candles", "Pillows & Throws", "Curtains & Blinds", "Door Mats")),
      cat("Lighting & Electrical", sub("Ceiling Lights", "Lamps & Shades", "Decorative Lights", "Outdoor Lighting", "Smart Lighting")),
      cat("Kitchen & Dining", sub("Cookware", "Utensils", "Cutlery", "Storage", "Water Dispensers", "Flasks & Bottles", "Shelves & Racks")),
      cat("Bedding & Bath", sub("Bedding", "Pillows", "Mattresses", "Mosquito Nets", "Bathroom")),
      cat("Home Organization", sub("Wardrobes/Closets", "Shoe Racks", "Laundry Storage", "Baskets & Bins", "Bathroom Storage", "Garage Storage")),
      cat("Household Supplies", sub("Cleaning Products", "Laundry", "Air Fresheners", "Papers & Rolls", "Trash Bags")),
    ],
  },
  {
    slug: "fashion",
    label: "Fashion & Clothing",
    scope: "product",
    categories: [
      cat("Men's Clothing", sub("Shirts", "T-Shirts & Tanks", "Jeans & Pants", "Shorts", "Suits & Sports Coats", "Underwear & Loungewear", "Outerwear")),
      cat("Women's Clothing", sub("Dresses", "Tops & Tees", "Skirts", "Jeans & Pants", "Suits & Blazers", "Coats & Jackets", "Lingerie & Sleepwear", "Swimwear")),
      cat("Kids' Fashion", sub("Infant (0-24m)", "Toddler (2-5y)", "Kids (6-12y)", "Teen (13+)", "School Uniforms")),
      cat("Men's Shoes", sub("Sneakers", "Loafers", "Sandals", "Boots", "Formal Shoes")),
      cat("Women's Shoes", sub("Heels", "Flats", "Sneakers", "Sandals", "Boots", "Wedges")),
      cat("Kids' Shoes", sub("Sneakers", "Sandals", "School Shoes", "Boots")),
      cat("Watches", sub("Analog", "Digital", "Smart", "Luxury")),
      cat("Jewelry", sub("Rings", "Necklaces", "Earrings", "Bracelets", "Anklets")),
      cat("Bags & Wallets", sub("Backpacks", "Handbags", "Messenger Bags", "Luggage", "Wallets")),
      cat("Sunglasses & Eyewear", sub("Prescription", "Sunglasses", "Blue-Light")),
      cat("Hats & Caps"),
      cat("Belts, Scarves & Accessories"),
      cat("Ties & Bowties"),
      cat("Socks & Hosiery"),
    ],
  },
  {
    slug: "beauty",
    label: "Beauty & Personal Care",
    scope: "all",
    categories: [
      cat("Skincare", sub("Facial", "Body", "Eye & Lip Care")),
      cat("Hair Care", sub("Shampoo & Conditioner", "Styling", "Hair Tools", "Hair Loss", "Wigs & Extensions")),
      cat("Makeup", sub("Face", "Eyes", "Lips", "Tools & Brushes", "Kits & Combos")),
      cat("Fragrances", sub("Men's", "Women's", "Unisex", "Perfume Oils & Attar", "Gift Sets", "Aromatherapy")),
      cat("Personal Care", sub("Oral Care", "Deodorants", "Shower & Bath", "Shave & Hair Removal", "Feminine Care", "Sexual Wellness")),
      cat("Health & Wellness", sub("Vitamins & Supplements", "Sports Nutrition", "Herbal & Natural", "Massagers", "Health Monitors")),
      cat("Luxury & Dermacosmetics", sub("Premium Brands", "Clinical Skincare")),
      cat("Beauty Services", sub("Salon", "Spa & Massage", "Barber")),
    ],
  },
  {
    slug: "baby-kids",
    label: "Health, Baby & Kids",
    scope: "product",
    categories: [
      cat("Baby Gear", sub("Strollers & Prams", "Car Seats", "Highchairs & Boosters", "Walkers & Bouncers", "Carriers & Slings", "Playpens")),
      cat("Feeding", sub("Bottle-Feeding", "Breastfeeding", "Solid Feeding", "Pacifiers")),
      cat("Diapering", sub("Disposable Diapers", "Cloth Diapers", "Diaper Bags", "Wipes & Pads", "Changing Tables")),
      cat("Nursery & Sleep", sub("Cribs & Cradles", "Baby Bedding", "Mattresses", "Sleep Monitors")),
      cat("Baby Safety", sub("Edge Guards", "Cabinet Locks", "Baby Gates", "Bath Safety")),
      cat("Baby Toys", sub("Building Toys", "Music Toys", "Bath Toys", "Stuffed Animals", "Activity Mats")),
      cat("Maternity & Pregnancy", sub("Maternity Clothing", "Pregnancy Pillows", "Support Belts", "Stretch Mark Care")),
      cat("Kids' Toys & Games", sub("Bicycles & Scooters", "Board Games", "Action Figures", "Puzzles")),
      cat("School Supplies", sub("Backpacks", "Lunch Boxes", "Stationery")),
    ],
  },
  {
    slug: "supermarket",
    label: "Supermarket & Grocery",
    scope: "product",
    categories: [
      cat("Food Cupboard", sub("Cooking Ingredients", "Grains & Rice", "Cereals", "Snacks", "Canned Foods", "Spreads")),
      cat("Beverages", sub("Carbonated", "Juices", "Water", "Coffee, Tea & Cocoa")),
      cat("Dairy & Eggs", sub("Milk", "Yogurt", "Cheese", "Butter", "Eggs", "Plant-Based Milks")),
      cat("Beer, Wine & Spirits"),
      cat("Household Supplies", sub("Detergents", "Cleaners", "Air Fresheners", "Bulbs & Batteries", "Papers & Rolls")),
      cat("Pet Supplies", sub("Pet Food", "Litter & Bedding", "Bowls & Feeders")),
    ],
  },
  {
    slug: "sports-leisure",
    label: "Sporting Goods, Leisure & Outdoors",
    scope: "all",
    categories: [
      cat("Fitness & Exercise", sub("Cardio Equipment", "Strength", "Yoga & Pilates", "Boxing & MMA", "Gym Accessories")),
      cat("Outdoor Recreation", sub("Camping", "Hiking", "Climbing", "Fishing", "Hunting")),
      cat("Team & Racquet Sports", sub("Football/Soccer", "Basketball", "Volleyball", "Tennis", "Badminton", "Table Tennis", "Pickleball", "Golf", "Cricket")),
      cat("Water Sports", sub("Swimming", "Surfing", "Paddleboarding", "Kayaking", "Snorkeling", "Scuba")),
      cat("Winter Sports", sub("Skiing", "Snowboarding")),
      cat("Outdoor Cooking & Grilling", sub("Grills", "Smokers", "Griddles", "Accessories")),
      cat("Gardening & Lawn Care", sub("Tools", "Lawnmowers", "Watering", "Plants & Seeds", "Outdoor Decor")),
      cat("Musical Instruments", sub("Guitars & Amps", "Keyboards & Pianos", "Drums & Percussion", "Wind & Brass", "String", "DJ & Pro Audio", "Accessories")),
      cat("Books, Movies & Music", sub("Fiction", "Non-Fiction", "Biography", "Children & Teens", "Education", "Religious", "Comics", "DVDs/Blu-rays/Vinyl")),
      cat("Toys & Games", sub("Board Games", "Puzzles", "Collectibles", "Remote Control")),
      cat("Smoking Accessories", sub("Vapes & E-Liquids", "Rolling Papers", "Grinders", "Pipes", "Hookahs")),
      cat("Arts, Crafts & Awards", sub("Painting", "Drawing", "Sewing & Fabric", "Beading & Jewelry Making", "Trophies & Plaques", "Scrapbooking")),
    ],
  },
  {
    slug: "computing-it",
    label: "Computing & IT",
    scope: "all",
    categories: [
      cat("Hardware Sales", sub("Laptops & Desktops", "Workstations", "Servers & Racks", "Peripherals", "Networking")),
      cat("Software & Digital Goods", sub("Operating Systems", "Productivity", "Creative", "Antivirus & Security", "Cloud Storage", "Game Keys")),
      cat("IT Services", sub("Computer Repair", "Data Recovery", "Website Design & Hosting", "Software Development", "Cybersecurity", "Cloud Migration", "IT Training")),
    ],
  },
  {
    slug: "repair-construction",
    label: "Repair & Construction",
    scope: "all",
    categories: [
      cat("Building Materials", sub("Cement & Bricks", "Lumber", "Drywall", "Roofing")),
      cat("Electrical Equipment", sub("Wires", "Breakers", "Panels", "Conduits")),
      cat("Plumbing", sub("Pipes & Fittings", "Water Heaters", "Pumps", "Toilets")),
      cat("Paint & Supplies", sub("Interior/Exterior Paint", "Brushes & Rollers", "Sprayers")),
      cat("Hardware & Fasteners", sub("Nails", "Screws", "Bolts", "Anchors")),
      cat("Doors & Windows", sub("Complete Units", "Glass", "Locks & Handles")),
      cat("Flooring", sub("Tile", "Laminate", "Hardwood", "Carpet", "Vinyl")),
      cat("Power Tools", sub("Drills", "Saws", "Sanders", "Grinders", "Routers")),
      cat("Hand Tools", sub("Hammers", "Screwdrivers", "Wrenches", "Pliers")),
      cat("Measuring & Layout", sub("Tape Measures", "Levels", "Laser Measures")),
      cat("Pneumatic Tools", sub("Nail Guns", "Compressors")),
      cat("Tool Storage", sub("Toolboxes", "Belts & Bags")),
      cat("Trade Services", sub("Carpentry", "Masonry", "Painting", "Tiling", "Electrical Repair", "Plumbing Repair", "HVAC", "Roofing", "Fencing & Decking", "Landscaping", "Appliance Repair", "Phone/Tablet Repair", "Cleaning Services")),
    ],
  },
  {
    slug: "commercial-equipment",
    label: "Commercial Equipment & Tools (B2B)",
    scope: "product",
    categories: [
      cat("Food & Hospitality", sub("Restaurant Equipment", "Catering Supplies", "Bar Equipment", "Commercial Coffee Machines")),
      cat("Retail & Store", sub("Display Racks", "Mannequins", "Cash Registers & POS", "Shopping Carts")),
      cat("Medical & Laboratory", sub("Medical Equipment", "Lab Supplies", "Dental Equipment", "Hospital Furniture")),
      cat("Safety & Protective Gear", sub("Hard Hats", "Safety Glasses & Gloves", "Hi-Vis Clothing", "Hearing & Respiratory", "Fall Protection", "Fire & Signs")),
      cat("Manufacturing & Industrial", sub("Industrial Machinery", "Conveyors & Packaging", "Forklifts & Pallet Jacks", "Raw Materials")),
      cat("Salon & Beauty Equipment", sub("Barber/Salon Chairs", "Professional Hair Tools", "Sterilizers & Trolleys", "Nail Stations")),
      cat("Printing & Graphics", sub("Commercial Printers", "Vinyl Cutters & Engravers", "Binding & Laminating")),
      cat("Stage & Event Equipment", sub("Truss & Stages", "Professional Lighting", "Event Furniture", "Sound Systems")),
    ],
  },
  {
    slug: "animals-pets",
    label: "Animals & Pets",
    scope: "all",
    categories: [
      cat("Pets (Live)", sub("Dogs & Puppies", "Cats & Kittens", "Birds", "Fish", "Small Animals", "Reptiles", "Horses & Livestock")),
      cat("Pet Food", sub("Dry", "Wet", "Treats", "Raw")),
      cat("Pet Accessories", sub("Collars & Leashes", "Harnesses", "Muzzles")),
      cat("Bedding & Carriers", sub("Beds", "Crates", "Carriers")),
      cat("Pet Toys", sub("Chew", "Balls", "Puzzle")),
      cat("Pet Grooming", sub("Brushes", "Shampoos", "Nail Clippers")),
      cat("Pet Health", sub("Flea & Tick", "Vitamins", "First Aid")),
      cat("Pet Services", sub("Grooming", "Training", "Boarding", "Walking", "Veterinary", "Pet Sitting")),
    ],
  },
  {
    slug: "agriculture",
    label: "Food, Agriculture & Farming",
    scope: "all",
    categories: [
      cat("Crops & Seeds", sub("Grains", "Vegetable Seeds", "Fruit Seeds")),
      cat("Fertilizers & Chemicals", sub("Organic Fertilizers", "Chemical Fertilizers", "NPK", "Pesticides", "Herbicides", "Fungicides")),
      cat("Farm Machinery", sub("Tractors", "Harvesters", "Plows", "Irrigation", "Milking Machines", "Egg Incubators", "Feed Mixers")),
      cat("Farm Animals & Livestock", sub("Cattle", "Sheep", "Goats", "Pigs", "Poultry", "Animal Feed", "Veterinary Medicines")),
      cat("Farm Services", sub("Land Preparation", "Harvesting", "Veterinary", "Crop Spraying")),
    ],
  },
  {
    slug: "jobs-cvs",
    label: "Jobs & CVs",
    scope: "service",
    categories: [
      cat("Jobs Offered", sub(
        "Accounting & Finance", "Advertising & Marketing", "Computing & IT",
        "Construction & Skilled Trades", "Customer Service", "Driver & Logistics",
        "Education & Teaching", "Engineering & Architecture", "Healthcare & Nursing",
        "Hospitality & Bar", "Manufacturing & Warehouse", "Retail & Sales",
        "Security", "Part-Time & Weekend", "Remote / Work-From-Home"
      )),
      cat("CVs / Seeking Work", sub(
        "Accounting & Finance", "IT & Computing", "Driving & Logistics",
        "Teaching & Education", "Engineering", "Healthcare", "Hospitality",
        "Sales & Retail", "Internship / Graduate", "Freelance / Gig"
      )),
    ],
  },
  {
    slug: "professional-services",
    label: "Services (General & Professional)",
    scope: "service",
    categories: [
      cat("Professional Services", sub("Legal", "Tax & Accounting", "Consulting", "Recruitment & HR", "Insurance")),
      cat("Home & Personal Services", sub("Cleaning", "Moving & Logistics", "Child Care & Tutoring", "Health & Beauty", "Fitness & Personal Training", "Photography & Video", "DJ & Entertainment", "Catering & Event Planning", "Wedding Planning")),
      cat("Transportation & Travel", sub("Chauffeur & Airport Transfer", "Travel Agents & Tours", "Car Rental", "Bus Charter", "Shipping & Freight")),
      cat("Digital & Tech Services", sub("Web & App Development", "Digital Marketing", "Graphic Design", "Video Editing", "IT Support")),
    ],
  },
  {
    slug: "events-tickets",
    label: "Events & Tickets",
    scope: "event",
    categories: [
      cat("Music & Concerts"),
      cat("Business & Networking"),
      cat("Workshops & Classes"),
      cat("Sports & Fitness"),
      cat("Arts & Culture"),
      cat("Food & Drink"),
      cat("Charity & Causes"),
      cat("Festivals"),
      cat("Religious Gatherings"),
      cat("Entertainment & Nightlife"),
      cat("Conferences & Expos"),
      cat("Tickets", sub("Concerts", "Sports", "Theater")),
    ],
  },
  {
    slug: "other",
    label: "Other",
    scope: "all",
    categories: [
      cat("Industrial & Scientific Supplies"),
      cat("Memorial & Funeral Services"),
      cat("Religious Items", sub("Statues", "Books", "Incense")),
      cat("Charity & Donations"),
      cat("Collectibles & Antiques", sub("Coins", "Stamps", "Vintage Items")),
      cat("Gift Cards & Vouchers"),
      cat("Raw Materials", sub("Wood", "Metal", "Fabrics", "Chemicals")),
      cat("Surplus & Liquidation Lots"),
    ],
  },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

/** All sections relevant to a given listing type. */
export function getSectionsForType(type: ListingTypeScope | undefined | null): Section[] {
  if (!type || type === "all") return SECTIONS;
  return SECTIONS.filter((s) => s.scope === "all" || s.scope === type);
}

/** Look up a section by slug. */
export function findSection(slug: string | null | undefined): Section | undefined {
  if (!slug) return undefined;
  return SECTIONS.find((s) => s.slug === slug);
}

/** Look up a category by section slug + category label. */
export function findCategory(sectionSlug: string, categoryLabel: string): Category | undefined {
  return findSection(sectionSlug)?.categories.find((c) => c.label === categoryLabel);
}

/** Flat list of all category labels (for legacy single-level filters). */
export function allCategoryLabels(scope: ListingTypeScope = "all"): string[] {
  const sections = getSectionsForType(scope);
  const out: string[] = [];
  for (const s of sections) for (const c of s.categories) out.push(c.label);
  return Array.from(new Set(out));
}

/** Flat list of all section labels for a given listing type. */
export function sectionLabelsForType(scope: ListingTypeScope = "all"): string[] {
  return getSectionsForType(scope).map((s) => s.label);
}

/** Build a "Section → Category → Subcategory" breadcrumb. */
export function categoryBreadcrumb(
  sectionSlug?: string | null,
  categoryLabel?: string | null,
  subLabel?: string | null,
): string {
  const section = findSection(sectionSlug || undefined);
  const parts = [section?.label, categoryLabel || undefined, subLabel || undefined].filter(Boolean);
  return parts.join(" › ");
}
