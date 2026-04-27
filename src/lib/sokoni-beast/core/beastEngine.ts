// src/lib/sokoni-beast/core/beastEngine.ts
// SOKONI BEAST - The predator that knows ONLY your site

import { neuralWeb } from './neuralWeb';
import { predatorMemory } from './predatorMemory';
import { deepSearch } from '../hunters/deepSearch';
import { actionFinder } from '../hunters/actionFinder';
import { contextSniffer } from '../hunters/contextSniffer';
import { voiceFang } from '../fangs/voiceFang';
import { navigationFang } from '../fangs/navigationFang';
import { conversionFang } from '../fangs/conversionFang';
import { beastConfig } from '../config/beastConfig';

export type BeastCommand = 
  | { type: 'SEARCH'; query: string; filters?: any }
  | { type: 'NAVIGATE'; path: string; params?: Record<string, string> }
  | { type: 'FILTER'; category: string; filters: any }
  | { type: 'CONTACT'; sellerId: string; method: 'whatsapp' | 'call' | 'message' }
  | { type: 'FAVORITE'; listingId: string }
  | { type: 'PURCHASE_INTENT'; listingId: string }
  | { type: 'CREATE_LISTING'; data: Partial<Listing> }
  | { type: 'SHOP_ACTION'; shopId: string; action: 'follow' | 'visit' | 'promote' }
  | { type: 'ANALYZE'; resourceType: 'product' | 'shop' | 'price'; id?: string };

export interface BeastSession {
  userId: string;
  history: string[];
  context: Map<string, any>;
  lastIntent?: BeastCommand;
  confidence: number;
  shoppingCart?: string[];
  viewedListings: string[];
}

export class SokoniBeast {
  private memory: predatorMemory;
  private webHunter: neuralWeb;
  private searcher: deepSearch;
  private actionHunter: actionFinder;
  private contextSniffer: contextSniffer;
  private voice: voiceFang;
  private navigator: navigationFang;
  private converter: conversionFang;
  
  private activeSession: BeastSession | null = null;

  constructor() {
    this.memory = new predatorMemory();
    this.webHunter = new neuralWeb();
    this.searcher = new deepSearch();
    this.actionHunter = new actionFinder();
    this.contextSniffer = new contextSniffer();
    this.voice = new voiceFang();
    this.navigator = new navigationFang();
    this.converter = new conversionFang();
  }

  async initialize(userId: string) {
    // Load or create session with predator memory
    this.activeSession = await this.memory.loadOrCreate(userId);
    
    // Sniff user behavior from last 24h
    const behavior = await this.contextSniffer.sniff(userId);
    this.activeSession.context.set('behavior', behavior);
    
    // Pre-load hot data
    await this.preloadHotZones();
    
    return this;
  }

  async process(input: string, options?: { 
    voiceMode?: boolean;
    urgency?: 'low' | 'medium' | 'high';
  }): Promise<string> {
    if (!this.activeSession) throw new Error('Beast not initialized');

    // Step 1: Understand intent with high accuracy
    const intent = await this.actionHunter.hunt(input, this.activeSession);
    this.activeSession.lastIntent = intent;
    this.activeSession.confidence = intent.confidence || 0.95;

    // Step 2: Execute based on intent type
    let result: any;
    
    switch (intent.type) {
      case 'SEARCH':
        result = await this.executeSearch(intent, options);
        break;
      case 'NAVIGATE':
        result = await this.navigator.go(intent.path, intent.params);
        break;
      case 'FILTER':
        result = await this.applyFilters(intent);
        break;
      case 'CONTACT':
        result = await this.converter.connect(intent.sellerId, intent.method);
        break;
      case 'FAVORITE':
        result = await this.converter.saveToWishlist(intent.listingId);
        break;
      case 'PURCHASE_INTENT':
        result = await this.converter.initiateCheckout(intent.listingId);
        break;
      case 'CREATE_LISTING':
        result = await this.converter.startListing(intent.data);
        break;
      case 'SHOP_ACTION':
        result = await this.converter.shopInteraction(intent.shopId, intent.action);
        break;
      case 'ANALYZE':
        result = await this.analyzeAndRecommend(intent);
        break;
      default:
        result = await this.fallbackResponse(input);
    }

    // Step 3: Update memory with new intelligence
    await this.memory.record(this.activeSession.userId, input, result, intent);

    // Step 4: Format response with personality
    const response = this.formatResponse(result, intent);
    
    // Step 5: Speak if in voice mode
    if (options?.voiceMode) {
      await this.voice.speak(response);
    }

    return response;
  }

  private async executeSearch(intent: any, options?: any): Promise<any> {
    const searchResults = await this.searcher.hunt({
      query: intent.query,
      filters: intent.filters,
      session: this.activeSession,
      urgency: options?.urgency || 'medium'
    });

    // Auto-navigate to best result if confidence > 90%
    if (searchResults.confidence > 0.9 && searchResults.listings.length === 1) {
      await this.navigator.go(`/listing/${searchResults.listings[0].id}`);
      return {
        type: 'DIRECT_NAVIGATION',
        listing: searchResults.listings[0],
        message: `Found exactly what you need. Taking you to ${searchResults.listings[0].title}`
      };
    }

    return searchResults;
  }

  private async applyFilters(intent: any): Promise<any> {
    // Smart filter application
    const currentUrl = window.location.pathname;
    const filters = intent.filters;
    
    await this.navigator.applyFilters(currentUrl, filters);
    
    return {
      type: 'FILTERS_APPLIED',
      message: `Showing ${filters.category || 'items'} ${filters.price ? `under ${filters.price} KES` : ''}`
    };
  }

  private async analyzeAndRecommend(intent: any): Promise<any> {
    switch (intent.resourceType) {
      case 'product':
        const product = await this.searcher.getProductDetails(intent.id);
        const similar = await this.searcher.findSimilar(product);
        return {
          type: 'PRODUCT_ANALYSIS',
          product,
          similar,
          recommendation: similar[0] ? `Others also bought ${similar[0].title}` : null
        };
      
      case 'shop':
        const shop = await this.searcher.getShopDetails(intent.id);
        const topProducts = await this.searcher.getShopTopProducts(intent.id);
        return {
          type: 'SHOP_ANALYSIS',
          shop,
          topProducts,
          message: `${shop.name} has ${shop.followers} followers and ${topProducts.length} popular items`
        };
      
      case 'price':
        const pricing = await this.searcher.analyzeMarketPrice(intent.query);
        return {
          type: 'PRICE_ANALYSIS',
          pricing,
          message: `Market price for similar items ranges from ${pricing.min} to ${pricing.max} KES. Best deal at ${pricing.bestValue} KES`
        };
    }
  }

  private formatResponse(result: any, intent: any): string {
    // The Beast speaks like a Kenyan market expert
    const templates = {
      SEARCH: {
        multiple: (count: number) => `Nimepata ${count} ${count === 1 ? 'kitu' : 'vitu'}. Let me show you the best ones.`,
        single: (title: string) => `Found ${title}! Opening it now for you.`,
        empty: () => `Hakuna kitu for that. Want me to search nearby or remove some filters?`
      },
      NAVIGATION: {
        success: (path: string) => `Going to ${path.replace('/', '')}. Fast like a cheetah!`,
        error: () => `That page doesn't exist on Sokoni. Want me to show you what's available?`
      },
      PURCHASE: {
        start: () => `Great choice! Opening checkout. Always verify seller ratings first.`,
        continue: () => `You have items in your cart. Complete purchase to avoid losing them.`
      },
      FAVORITE: {
        saved: () => `Saved to your wishlist! Access anytime from Favorites.`,
        exists: () => `Already in your wishlist. Ready to buy?`
      }
    };

    const t = templates[intent.type];
    if (!t) return this.voice.naturalResponse(result.message || "Niko hapa. What else do you need?");

    if (result.type === 'DIRECT_NAVIGATION') return t.single(result.listing.title);
    if (result.listings?.length > 1) return t.multiple(result.listings.length);
    if (result.listings?.length === 0) return t.empty();
    
    return result.message || t.success?.(intent.path) || "Nimeelewa. I'm on it!";
  }

  private async preloadHotZones() {
    // Pre-load site structure into memory for instant navigation
    const pages = ['products', 'services', 'events', 'shops', 'fun-circle', 'dashboard'];
    for (const page of pages) {
      await this.webHunter.index(page);
    }
  }

  private async fallbackResponse(input: string): Promise<any> {
    // Last resort - try to understand anyway
    const keywords = await this.actionHunter.extractKeywords(input);
    if (keywords.product) {
      return this.executeSearch({ query: keywords.product, type: 'SEARCH' });
    }
    return {
      type: 'HELP',
      message: "Sema 'search phones under 30k', 'open shops', or 'help me sell'"
    };
  }
}