// src/lib/sokoni-beast/hunters/deepSearch.ts
// Searches your ENTIRE site - products, shops, events, services

import { supabase } from '@/integrations/supabase/untyped-client';
import { BeastSession } from '../core/beastEngine';

export class deepSearch {
  async hunt(params: {
    query: string;
    filters?: any;
    session: BeastSession;
    urgency?: string;
  }): Promise<any> {
    const { query, filters, session, urgency } = params;
    
    // Parse Kenyan natural language
    const parsed = this.parseKenyanQuery(query);
    
    // Hunt in parallel across all data sources
    const [listings, shops, events, services] = await Promise.all([
      this.searchListings(parsed, filters),
      this.searchShops(parsed),
      this.searchEvents(parsed),
      this.searchServices(parsed)
    ]);

    // Rank results by relevance
    const ranked = this.rankResults({
      listings, shops, events, services,
      userHistory: session.viewedListings,
      urgency
    });

    // Add to session memory
    session.context.set('lastSearch', { query: parsed.text, results: ranked });
    
    return {
      listings: ranked.listings.slice(0, 10),
      shops: ranked.shops.slice(0, 5),
      events: ranked.events.slice(0, 5),
      services: ranked.services.slice(0, 5),
      total: ranked.total,
      confidence: ranked.confidence,
      parsedQuery: parsed
    };
  }

  private parseKenyanQuery(raw: string): any {
    const text = raw.toLowerCase();
    
    // Price detection - handles "under 5k", "between 1000 and 5000", "below 10k"
    const prices = this.extractPrices(text);
    
    // Location - Kenyan towns only
    const locations = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 
                       'kiambu', 'ruiru', 'ngong', 'karen', 'westlands'];
    const location = locations.find(loc => text.includes(loc));
    
    // Category detection
    const categories = {
      electronics: ['phone', 'laptop', 'tv', 'speaker', 'charger', 'simu', 'kompyuta'],
      fashion: ['shoe', 'dress', 'shirt', 'jeans', 'skirt', 'viatu', 'nguo'],
      vehicles: ['car', 'motorcycle', 'bike', 'gari', 'pikipiki', 'boda'],
      home: ['sofa', 'table', 'bed', 'furniture', 'samani'],
      services: ['plumber', 'electrician', 'cleaner', 'mechanic', 'fundi']
    };
    
    let category = null;
    for (const [cat, keywords] of Object.entries(categories)) {
      if (keywords.some(kw => text.includes(kw))) {
        category = cat;
        break;
      }
    }
    
    // Condition - new vs used
    const condition = text.includes('new') ? 'new' : 
                     (text.includes('used') || text.includes('second hand')) ? 'used' : null;
    
    return {
      text: raw,
      minPrice: prices.min,
      maxPrice: prices.max,
      location,
      category,
      condition,
      hasPrice: !!prices.min || !!prices.max
    };
  }

  private extractPrices(text: string): { min?: number; max?: number } {
    // Under X, below X, less than X
    const underMatch = text.match(/(?:under|below|less than|max|cheaper than)\s+(\d+(?:[.,]\d+)?)\s*(k|kay|k)?/i);
    if (underMatch) {
      let value = parseFloat(underMatch[1]);
      if (underMatch[2] === 'k' || underMatch[2] === 'kay') value *= 1000;
      return { max: value };
    }
    
    // Over X, above X, more than X
    const overMatch = text.match(/(?:over|above|more than|min|from)\s+(\d+(?:[.,]\d+)?)\s*(k|kay|k)?/i);
    if (overMatch) {
      let value = parseFloat(overMatch[1]);
      if (overMatch[2] === 'k' || overMatch[2] === 'kay') value *= 1000;
      return { min: value };
    }
    
    // Between X and Y
    const betweenMatch = text.match(/between\s+(\d+(?:[.,]\d+)?)\s*(?:k|kay|k)?\s+(?:and|to)\s+(\d+(?:[.,]\d+)?)\s*(?:k|kay|k)?/i);
    if (betweenMatch) {
      let min = parseFloat(betweenMatch[1]);
      let max = parseFloat(betweenMatch[2]);
      if (betweenMatch[1].includes('k')) min *= 1000;
      if (betweenMatch[2].includes('k')) max *= 1000;
      return { min, max };
    }
    
    return {};
  }

  private async searchListings(parsed: any, filters?: any): Promise<any[]> {
    let query = supabase.from('listings_public').select('*').eq('status', 'available');
    
    if (parsed.category) query = query.eq('category', parsed.category);
    if (parsed.location) query = query.ilike('location', `%${parsed.location}%`);
    if (parsed.maxPrice) query = query.lte('price', parsed.maxPrice);
    if (parsed.minPrice) query = query.gte('price', parsed.minPrice);
    if (parsed.condition) query = query.eq('condition', parsed.condition);
    
    // Full text search on title and description
    if (parsed.text) {
      query = query.or(`title.ilike.%${parsed.text}%,description.ilike.%${parsed.text}%`);
    }
    
    const { data } = await query.limit(20);
    return data || [];
  }

  private async searchShops(parsed: any): Promise<any[]> {
    let query = supabase.from('shops').select('*').eq('is_active', true);
    
    if (parsed.location) query = query.ilike('location', `%${parsed.location}%`);
    if (parsed.text) {
      query = query.or(`name.ilike.%${parsed.text}%,description.ilike.%${parsed.text}%,category.ilike.%${parsed.text}%`);
    }
    
    const { data } = await query.limit(10);
    return data || [];
  }

  private async searchEvents(parsed: any): Promise<any[]> {
    let query = supabase.from('events').select('*').gte('event_date', new Date().toISOString());
    
    if (parsed.location) query = query.ilike('location', `%${parsed.location}%`);
    if (parsed.text) {
      query = query.or(`title.ilike.%${parsed.text}%,description.ilike.%${parsed.text}%`);
    }
    
    const { data } = await query.limit(10);
    return data || [];
  }

  private async searchServices(parsed: any): Promise<any[]> {
    let query = supabase.from('services').select('*').eq('is_active', true);
    
    if (parsed.location) query = query.ilike('location', `%${parsed.location}%`);
    if (parsed.text) {
      query = query.or(`name.ilike.%${parsed.text}%,description.ilike.%${parsed.text}%`);
    }
    
    const { data } = await query.limit(10);
    return data || [];
  }

  private rankResults(results: any, options: any): any {
    const { listings, shops, events, services, userHistory, urgency } = options;
    
    // Boost results similar to user's viewing history
    const boosted = listings.map((listing: any) => {
      let score = 1;
      if (userHistory.includes(listing.id)) score += 0.5;
      if (listing.is_featured) score += 0.3;
      if (listing.is_verified) score += 0.2;
      if (urgency === 'high') score *= 1.5;
      return { ...listing, relevance: score };
    });
    
    boosted.sort((a: any, b: any) => b.relevance - a.relevance);
    
    const confidence = boosted[0]?.relevance > 1.2 ? 0.95 : 
                       boosted[0]?.relevance > 0.8 ? 0.8 : 0.6;
    
    return {
      listings: boosted,
      shops,
      events,
      services,
      total: boosted.length + shops.length + events.length + services.length,
      confidence
    };
  }

  async getProductDetails(productId: string): Promise<any> {
    const { data } = await supabase
      .from('listings_public')
      .select('*, shop:shops(*)')
      .eq('id', productId)
      .single();
    return data;
  }

  async getShopDetails(shopId: string): Promise<any> {
    const { data } = await supabase
      .from('shops')
      .select('*')
      .eq('id', shopId)
      .single();
    return data;
  }

  async getShopTopProducts(shopId: string, limit = 5): Promise<any[]> {
    const { data } = await supabase
      .from('listings_public')
      .select('*')
      .eq('shop_id', shopId)
      .order('views', { ascending: false })
      .limit(limit);
    return data || [];
  }

  async analyzeMarketPrice(query: string): Promise<any> {
    const parsed = this.parseKenyanQuery(query);
    const listings = await this.searchListings(parsed);
    
    const prices = listings.map((l: any) => l.price).filter(Boolean);
    if (prices.length === 0) return { min: 0, max: 0, average: 0, bestValue: 0 };
    
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const average = prices.reduce((a, b) => a + b, 0) / prices.length;
    
    // Find best value (price-to-quality ratio based on likes/views)
    const bestValue = listings.reduce((best: any, current: any) => {
      const bestScore = (best.likes || 0) / best.price;
      const currentScore = (current.likes || 0) / current.price;
      return currentScore > bestScore ? current : best;
    }, listings[0]);
    
    return { min, max, average, bestValue: bestValue?.price || average };
  }

  async findSimilar(product: any): Promise<any[]> {
    const { data } = await supabase
      .from('listings_public')
      .select('*')
      .eq('category', product.category)
      .neq('id', product.id)
      .lte('price', product.price * 1.5)
      .gte('price', product.price * 0.5)
      .limit(5);
    return data || [];
  }
}