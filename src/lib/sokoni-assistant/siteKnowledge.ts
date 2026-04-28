// Static site knowledge for Sokoni Arena assistant.
// Includes every primary page + dashboard sections + hash anchors so the AI
// can deep-link the user wherever they want to go.

export type SitePage = {
  path: string;
  names: string[];      // synonyms users might say
  description: string;  // what this page is for
  requiresAuth?: boolean;
};

export const SITE_PAGES: SitePage[] = [
  { path: "/", names: ["home", "homepage", "main page", "landing", "front page", "start"], description: "Sokoni Arena home — featured shops, listings and categories." },
  { path: "/products", names: ["products", "items", "bidhaa", "things for sale", "goods", "shop products"], description: "Browse all products." },
  { path: "/services", names: ["services", "huduma", "service providers"], description: "Browse services." },
  { path: "/events", names: ["events", "matukio", "happenings"], description: "Browse upcoming events." },
  { path: "/shops", names: ["shops", "stores", "maduka", "vendors", "businesses", "all shops"], description: "All verified and active shops." },
  { path: "/search", names: ["search", "search page", "find page"], description: "Full search with filters." },
  { path: "/fun-circle", names: ["fun circle", "funcircle", "social", "friends area", "stories"], description: "Stories, friends and social DMs." },
  { path: "/fun-circle/notifications", names: ["fun circle notifications", "social notifications"], description: "Fun Circle notifications." },
  { path: "/favorites", names: ["favorites", "favourites", "saved", "wishlist", "liked items", "saved listings"], description: "Your saved listings.", requiresAuth: true },
  { path: "/messages", names: ["messages", "chats", "inbox", "ujumbe", "conversations", "dms"], description: "Direct messages.", requiresAuth: true },
  { path: "/dashboard", names: ["dashboard", "my account", "account", "my listings", "my shop", "my dashboard"], description: "Your dashboard.", requiresAuth: true },
  { path: "/dashboard?tab=shop", names: ["my shop tab", "shop tab", "manage shop"], description: "Manage your shop.", requiresAuth: true },
  { path: "/dashboard?tab=cart", names: ["cart", "my cart", "shopping cart"], description: "Your cart.", requiresAuth: true },
  { path: "/dashboard?tab=messages", names: ["dashboard messages"], description: "Dashboard messages.", requiresAuth: true },
  { path: "/dashboard?action=new-listing", names: ["new listing", "post listing", "post ad", "create ad", "sell something"], description: "Create a new listing.", requiresAuth: true },
  { path: "/dashboard?tab=profile", names: ["edit profile", "my profile", "profile editor"], description: "Edit your profile.", requiresAuth: true },
  { path: "/login", names: ["login", "sign in", "log in", "ingia"], description: "Sign in." },
  { path: "/register", names: ["register", "sign up", "create account", "join", "signup", "jisajili"], description: "Create an account." },
  { path: "/forgot-password", names: ["forgot password", "reset password", "password reset"], description: "Reset your password." },
  { path: "/how-it-works", names: ["how it works", "how to use", "guide", "tutorial", "walkthrough"], description: "How Sokoni Arena works." },
  { path: "/help", names: ["help", "support", "contact us", "contact", "customer care"], description: "Help and support." },
  { path: "/terms", names: ["terms", "terms of service", "tos"], description: "Terms of service." },
  { path: "/privacy", names: ["privacy", "privacy policy"], description: "Privacy policy." },
  { path: "/admin", names: ["admin", "admin panel"], description: "Admin panel.", requiresAuth: true },
];

/** Home page section anchors so the AI can scroll users to the right block. */
export const HOME_SECTIONS: { id: string; names: string[]; label: string }[] = [
  { id: "hero", names: ["hero", "top banner", "main banner"], label: "Hero banner" },
  { id: "flash-sales", names: ["flash sales", "deals", "today's deals", "promoted"], label: "Flash sales" },
  { id: "categories", names: ["categories", "category section"], label: "Categories" },
  { id: "featured-listings", names: ["featured listings", "trending listings"], label: "Featured listings" },
  { id: "featured-shops", names: ["featured shops"], label: "Featured shops" },
  { id: "premium-shops", names: ["premium shops"], label: "Premium shops" },
  { id: "top-shops", names: ["top shops"], label: "Top shops" },
  { id: "you-might-like", names: ["recommendations", "for you", "you might also like"], label: "Recommended for you" },
  { id: "trust", names: ["trust", "why us", "advantages"], label: "Why Sokoni Arena" },
  { id: "cta", names: ["sign up cta", "join cta"], label: "Join Sokoni Arena" },
];

export type FeatureGuide = {
  keys: string[];
  title: string;
  steps: string[];
  cta?: { label: string; path: string };
};

export const FEATURE_GUIDES: FeatureGuide[] = [
  {
    keys: ["promote shop", "shop promotion", "boost shop", "feature shop"],
    title: "Promote your shop",
    steps: [
      "From the Dashboard open My Shop",
      "Click 'Request Promotion'",
      "Choose a duration and submit",
      "Once approved your shop appears in Premium Shops on the homepage",
    ],
    cta: { label: "My Shop", path: "/dashboard?tab=shop" },
  },
  {
    keys: ["feature listing", "featured listing", "boost listing", "sponsor listing"],
    title: "Feature or sponsor a listing",
    steps: [
      "Open the listing from your Dashboard",
      "Click 'Request Featured' or 'Request Sponsorship'",
      "Once approved, the listing appears at the top of search and category pages",
    ],
    cta: { label: "My Listings", path: "/dashboard" },
  },
  {
    keys: ["contact seller", "message seller", "call seller", "whatsapp seller"],
    title: "Contact a seller",
    steps: [
      "Open any listing",
      "Use the Call, WhatsApp or in-app Message buttons",
      "Sign in to send in-app messages",
    ],
  },
  {
    keys: ["favorite", "save listing", "wishlist", "like listing"],
    title: "Save favorites",
    steps: [
      "Tap the heart icon on any listing",
      "Open Favorites from the menu to view saved items",
    ],
    cta: { label: "Open Favorites", path: "/favorites" },
  },
];

export type FAQ = { keys: string[]; answer: string };

export const FAQS: FAQ[] = [
  { keys: ["price", "pricing", "cost", "fees", "is it free", "how much"], answer: "Browsing and posting basic listings is free. Premium options like Featured listings, Sponsored ads and Shop promotions are paid — request them from your Dashboard." },
  { keys: ["payment", "pay", "mpesa", "m-pesa", "cash", "card"], answer: "Payments between buyers and sellers are arranged directly. Most users pay via M-Pesa or cash on delivery. Always inspect the item before paying." },
  { keys: ["safe", "safety", "scam", "fraud", "trust", "verify", "verified"], answer: "Stay safe: meet in public, inspect items first, never send money before seeing the product, and report suspicious shops. Verified shops carry a verification badge." },
  { keys: ["delivery", "shipping", "courier"], answer: "Delivery is arranged directly between buyer and seller. Many sellers offer in-town delivery or use couriers like Pickup Mtaani, G4S or Wells Fargo." },
  { keys: ["return", "refund", "exchange"], answer: "Returns and refunds are handled by individual sellers. Always confirm a seller's return policy before paying." },
  { keys: ["account", "delete account", "remove account"], answer: "To delete your account, contact support from the Help section. Your listings and shop will be removed." },
];

export const SOKONI_ADVANTAGES = [
  "Free to browse and post basic listings",
  "Built-in shop pages with branding, promotions and analytics",
  "Verified shop badges so buyers know who to trust",
  "Featured listings and sponsored ads for extra reach",
  "Direct messaging, WhatsApp and call buttons on every listing",
  "Fun Circle social layer — stories, friends and reactions",
  "Local-first: prices in KES, M-Pesa friendly, Kenyan categories",
  "Mobile-first design and PWA install for app-like speed",
];

export const WALKTHROUGH_STEPS = [
  "Welcome to Sokoni Arena — Kenya's social marketplace.",
  "From the home page jump into Products, Services, Events or Shops.",
  "Tap any listing for photos, price, location and contact buttons.",
  "Heart a listing to save it to Favorites for later.",
  "Sign in or create an account to message sellers, post listings or open your own shop.",
  "Your Dashboard manages listings, shop, messages and promotions.",
  "Visit Fun Circle for the social side — stories, friends and reactions.",
  "Need help anytime? Just open me, the Sokoni Arena assistant, and ask.",
];
