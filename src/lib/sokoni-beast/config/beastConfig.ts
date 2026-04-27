// src/lib/sokoni-beast/config/beastConfig.ts
export const beastConfig = {
  // Your site's DNA
  siteName: 'SokoniArena',
  siteUrl: 'https://sokoniarena.co.ke',
  currency: 'KES',
  primaryColor: '#16a34a',
  
  // What the beast can do
  capabilities: [
    'search_products',
    'search_services', 
    'search_events',
    'search_shops',
    'navigate_site',
    'filter_results',
    'contact_sellers',
    'save_favorites',
    'initiate_purchase',
    'create_listings',
    'manage_shops',
    'price_comparison',
    'market_analysis'
  ],
  
  // Kenyan context
  locations: [
    'nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret',
    'thika', 'kiambu', 'ruiru', 'ngong', 'karen', 'westlands'
  ],
  
  categories: {
    electronics: ['phone', 'laptop', 'tv', 'speaker', 'charger'],
    fashion: ['shoes', 'dress', 'shirt', 'jeans', 'skirt'],
    vehicles: ['car', 'motorcycle', 'bike', 'boda'],
    home: ['furniture', 'sofa', 'table', 'bed'],
    services: ['plumber', 'electrician', 'cleaner', 'mechanic']
  },
  
  // Response personality
  personality: {
    confidence: 'high',
    tone: 'helpful_predator', // Friendly but decisive
    useSwahili: true,
    emojiEnabled: true
  }
};