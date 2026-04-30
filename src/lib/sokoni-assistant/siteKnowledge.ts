// Static knowledge base for Sokoni Assistant.
// Free, in-memory, no API calls.

export type SitePage = {
  path: string;
  names: string[];      // synonyms users might say
  description: string;  // what this page is for
};

export const SITE_PAGES: SitePage[] = [
  { path: "/", names: ["home", "homepage", "main page", "landing", "front page"], description: "The SokoniArena home page with featured shops, listings and categories." },
  { path: "/products", names: ["products", "items", "bidhaa", "things for sale", "goods"], description: "Browse all products on the marketplace." },
  { path: "/services", names: ["services", "huduma", "service providers"], description: "Browse services offered by sellers." },
  { path: "/events", names: ["events", "matukio", "happenings"], description: "Find upcoming events." },
  { path: "/shops", names: ["shops", "stores", "maduka", "vendors", "businesses"], description: "Browse all verified and active shops." },
  { path: "/fun-circle", names: ["fun circle", "funcircle", "social", "friends area", "stories"], description: "The social side of SokoniArena — stories, friends and chats." },
  { path: "/favorites", names: ["favorites", "favourites", "saved", "wishlist", "liked items"], description: "Your saved listings." },
  { path: "/messages", names: ["messages", "chats", "inbox", "ujumbe", "conversations"], description: "Your direct messages with sellers and friends." },
  { path: "/dashboard", names: ["dashboard", "my account", "account", "my listings", "my shop"], description: "Your personal dashboard — listings, shop, cart, messages." },
  { path: "/login", names: ["login", "sign in", "log in"], description: "Sign in to your account." },
  { path: "/register", names: ["register", "sign up", "create account", "join", "signup"], description: "Create a new SokoniArena account." },
  { path: "/how-it-works", names: ["how it works", "how to use", "guide", "tutorial", "walkthrough"], description: "A guided walkthrough of how SokoniArena works." },
  { path: "/terms", names: ["terms", "terms of service", "tos"], description: "Our terms of service." },
  { path: "/privacy", names: ["privacy", "privacy policy"], description: "Our privacy policy." },
];

export type FeatureGuide = {
  keys: string[];
  title: string;
  steps: string[];
  cta?: { label: string; path: string };
};

export const FEATURE_GUIDES: FeatureGuide[] = [
  {
    keys: ["post ad", "create ad", "add listing", "list product", "sell something", "post listing", "new listing"],
    title: "Post a listing",
    steps: [
      "Sign in to your account",
      "Open your Dashboard",
      "Click 'New Listing' and choose product, service or event",
      "Add photos, title, price, category and location",
      "Hit Publish — your ad goes live instantly",
    ],
    cta: { label: "Open Dashboard", path: "/dashboard" },
  },
  {
    keys: ["open shop", "create shop", "start shop", "my shop", "open store"],
    title: "Open a shop",
    steps: [
      "Go to your Dashboard",
      "Open the 'My Shop' panel",
      "Add a name, logo, cover image and description",
      "Submit — once approved, your shop has its own page",
      "Add listings to your shop and request promotion if you want extra reach",
    ],
    cta: { label: "Open Dashboard", path: "/dashboard" },
  },
  {
    keys: ["promote shop", "shop promotion", "boost shop", "feature shop"],
    title: "Promote your shop",
    steps: [
      "From the Dashboard open My Shop",
      "Click 'Request Promotion'",
      "Choose a duration and submit",
      "Once approved, your shop appears in Premium Shops on the homepage",
    ],
    cta: { label: "My Shop", path: "/dashboard" },
  },
  {
    keys: ["feature listing", "featured listing", "boost listing", "sponsor listing"],
    title: "Feature or sponsor a listing",
    steps: [
      "From your Dashboard, open the listing",
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
      "Use Call, WhatsApp or in-app Message buttons",
      "You must be signed in to send in-app messages",
    ],
  },
  {
    keys: ["favorite", "save listing", "wishlist", "like listing"],
    title: "Save favorites",
    steps: [
      "Tap the heart icon on any listing",
      "Open the Favorites page from the menu to view all saved items",
    ],
    cta: { label: "Open Favorites", path: "/favorites" },
  },
  {
    keys: ["fun circle", "stories", "friends", "social"],
    title: "Use Fun Circle",
    steps: [
      "Open Fun Circle from the menu",
      "Add friends, post stories, react and comment",
      "Stories expire after 24 hours",
    ],
    cta: { label: "Open Fun Circle", path: "/fun-circle" },
  },
  {
    keys: ["reset password", "forgot password", "change password"],
    title: "Reset your password",
    steps: [
      "Open 'Forgot password' from the login page",
      "Enter your email and submit",
      "Click the reset link in your email and set a new password",
    ],
    cta: { label: "Forgot password", path: "/forgot-password" },
  },
];

export type FAQ = { keys: string[]; answer: string };

export const FAQS: FAQ[] = [
  {
    keys: ["price", "pricing", "cost", "fees", "is it free", "how much"],
    answer: "Browsing and posting basic listings is free. Premium options like Featured listings, Sponsored ads and Shop promotions are paid — you can request them from your Dashboard.",
  },
  {
    keys: ["payment", "pay", "mpesa", "m-pesa", "cash", "card"],
    answer: "Payments between buyers and sellers are arranged directly. Most users pay via M-Pesa or cash on delivery. Always inspect the item before paying.",
  },
  {
    keys: ["safe", "safety", "scam", "fraud", "trust", "verify", "verified"],
    answer: "Stay safe: meet in public places, inspect items first, never send money before seeing the product, and report suspicious shops. Verified shops carry a verification badge.",
  },
  {
    keys: ["delivery", "shipping", "courier"],
    answer: "Delivery is arranged directly between buyer and seller. Many sellers offer in-town delivery or use couriers like Pickup Mtaani, G4S or Wells Fargo.",
  },
  {
    keys: ["return", "refund", "exchange"],
    answer: "Returns and refunds are handled by individual sellers. Always confirm a seller's return policy before paying.",
  },
  {
    keys: ["account", "delete account", "remove account"],
    answer: "To delete your account, contact support from the Help section. Your listings and shop will be removed.",
  },
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
  "Welcome to SokoniArena — Kenya's social marketplace.",
  "From the home page you can jump into Products, Services, Events or Shops.",
  "Tap any listing to see photos, price, location and contact buttons.",
  "Heart a listing to save it to Favorites for later.",
  "Sign in or create an account to message sellers, post listings or open your own shop.",
  "Your Dashboard is where you manage listings, your shop, messages and promotions.",
  "Visit Fun Circle for the social side — stories, friends and reactions.",
  "Need help anytime? Just open me, the Sokoni Assistant, and ask.",
];
