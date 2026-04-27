// src/lib/sokoni-beast/hunters/actionFinder.ts
// Understands EXACTLY what the user wants to DO

import { BeastSession, BeastCommand } from '../core/beastEngine';

export class actionFinder {
  async hunt(input: string, session: BeastSession): Promise<BeastCommand & { confidence: number }> {
    const text = input.toLowerCase().trim();
    
    // Priority 1: Shopping/Commerce actions
    if (this.isPurchaseIntent(text)) {
      const listingId = await this.extractListingId(text, session);
      return {
        type: 'PURCHASE_INTENT',
        listingId,
        confidence: 0.98
      };
    }
    
    // Priority 2: Search intent
    if (this.isSearchIntent(text)) {
      return {
        type: 'SEARCH',
        query: this.extractSearchQuery(text),
        filters: this.extractFilters(text),
        confidence: 0.95
      };
    }
    
    // Priority 3: Navigation
    if (this.isNavigationIntent(text)) {
      const nav = this.parseNavigation(text);
      return {
        type: 'NAVIGATE',
        path: nav.path,
        params: nav.params,
        confidence: 0.97
      };
    }
    
    // Priority 4: Filter/Sort existing view
    if (this.isFilterIntent(text)) {
      return {
        type: 'FILTER',
        category: this.extractCategory(text),
        filters: this.extractFilters(text),
        confidence: 0.92
      };
    }
    
    // Priority 5: Contact seller
    if (this.isContactIntent(text)) {
      return {
        type: 'CONTACT',
        sellerId: await this.extractSellerId(text, session),
        method: this.extractContactMethod(text),
        confidence: 0.94
      };
    }
    
    // Priority 6: Save to wishlist
    if (this.isSaveIntent(text)) {
      return {
        type: 'FAVORITE',
        listingId: await this.extractListingId(text, session),
        confidence: 0.96
      };
    }
    
    // Priority 7: Create/Sell
    if (this.isCreateListingIntent(text)) {
      const data = await this.extractListingData(text, session);
      return {
        type: 'CREATE_LISTING',
        data,
        confidence: 0.88
      };
    }
    
    // Priority 8: Shop actions
    if (this.isShopIntent(text)) {
      const shopId = await this.extractShopId(text, session);
      const action = text.includes('follow') ? 'follow' : 
                     text.includes('visit') ? 'visit' : 
                     text.includes('promote') ? 'promote' : 'visit';
      return {
        type: 'SHOP_ACTION',
        shopId,
        action,
        confidence: 0.93
      };
    }
    
    // Priority 9: Analysis/Comparison
    if (this.isAnalysisIntent(text)) {
      return {
        type: 'ANALYZE',
        resourceType: text.includes('price') ? 'price' :
                      text.includes('shop') ? 'shop' : 'product',
        id: text.includes('this') && session.lastIntent ? 
            (session.lastIntent as any).listingId : undefined,
        query: this.extractSearchQuery(text),
        confidence: 0.85
      };
    }
    
    // Fallback - try to find any action
    return this.fallbackAction(text, session);
  }

  private isPurchaseIntent(text: string): boolean {
    const patterns = [
      /\b(buy|purchase|get|order|add to cart|checkout|pay|mpesa|pay now)\b/i,
      /\b(i want|need|take)\s+(this|that|it)\b/i,
      /\b(how (much|to buy)|price of)\b/i
    ];
    return patterns.some(p => p.test(text));
  }

  private isSearchIntent(text: string): boolean {
    const patterns = [
      /\b(search|find|look for|show|get me|where can i find)\b/i,
      /\b(any|some)\s+\w+\s+(for sale|available)\b/i,
      /\b(under|below|around|over)\s+\d+\s*k?\b/i,
      /^\s*(\w+\s+){1,5}(price|cost|kes)\s*$/i
    ];
    return patterns.some(p => p.test(text)) || !this.isNavigationIntent(text);
  }

  private isNavigationIntent(text: string): boolean {
    const routes = [
      'home', 'products', 'services', 'events', 'shops', 'fun-circle',
      'favorites', 'messages', 'dashboard', 'profile', 'cart', 'checkout',
      'my listings', 'my shop', 'settings', 'help'
    ];
    
    const navWords = ['open', 'go to', 'take me to', 'show', 'visit', 'navigate to'];
    return navWords.some(w => text.includes(w)) || 
           routes.some(r => text.includes(r));
  }

  private isFilterIntent(text: string): boolean {
    const filterWords = ['filter', 'sort', 'only show', 'just', 'limit to'];
    return filterWords.some(w => text.includes(w)) && 
           (text.includes('price') || text.includes('location') || 
            text.includes('category') || text.includes('condition'));
  }

  private isContactIntent(text: string): boolean {
    const contactWords = ['contact', 'message', 'whatsapp', 'call', 'reach', 'chat with'];
    return contactWords.some(w => text.includes(w)) && 
           (text.includes('seller') || text.includes('shop') || text.includes('them'));
  }

  private isSaveIntent(text: string): boolean {
    const saveWords = ['save', 'favorite', 'wishlist', 'bookmark', 'heart', 'like'];
    return saveWords.some(w => text.includes(w));
  }

  private isCreateListingIntent(text: string): boolean {
    const createWords = ['sell', 'post', 'list', 'create ad', 'add listing', 'upload'];
    return createWords.some(w => text.includes(w));
  }

  private isShopIntent(text: string): boolean {
    const shopWords = ['shop', 'store', 'vendor', 'seller page'];
    return shopWords.some(w => text.includes(w)) && 
           (text.includes('follow') || text.includes('visit') || text.includes('promote'));
  }

  private isAnalysisIntent(text: string): boolean {
    const analysisWords = ['compare', 'analyze', 'is it good', 'worth', 'better', 'vs', 
                          'price check', 'market value', 'similar', 'alternatives'];
    return analysisWords.some(w => text.includes(w));
  }

  private extractSearchQuery(text: string): string {
    // Remove action words and keep the core query
    let cleaned = text
      .replace(/\b(search|find|look for|show me|get|where can i find|any|some)\b/gi, '')
      .replace(/\b(under|below|over|above|around|between)\s+\d+\s*k?\b/gi, '')
      .replace(/\b(in|near|from)\s+\w+\b/gi, '')
      .trim();
    
    return cleaned || text;
  }

  private extractFilters(text: string): any {
    const filters: any = {};
    
    // Price filters
    const underMatch = text.match(/(?:under|below|less than|max|cheaper than)\s+(\d+(?:[.,]\d+)?)\s*(k|kay|thousand)?/i);
    if (underMatch) {
      let value = parseFloat(underMatch[1]);
      if (underMatch[2] === 'k' || underMatch[2] === 'kay') value *= 1000;
      filters.maxPrice = value;
    }
    
    const overMatch = text.match(/(?:over|above|more than|min|from)\s+(\d+(?:[.,]\d+)?)\s*(k|kay|thousand)?/i);
    if (overMatch) {
      let value = parseFloat(overMatch[1]);
      if (overMatch[2] === 'k' || overMatch[2] === 'kay') value *= 1000;
      filters.minPrice = value;
    }
    
    // Location
    const locations = ['nairobi', 'mombasa', 'kisumu', 'nakuru', 'eldoret', 'thika', 'kiambu'];
    for (const loc of locations) {
      if (text.includes(loc)) {
        filters.location = loc;
        break;
      }
    }
    
    // Category
    const categoryMap: Record<string, string[]> = {
      'electronics': ['phone', 'laptop', 'tv', 'speaker', 'simu', 'kompyuta'],
      'fashion': ['shoe', 'dress', 'shirt', 'viatu', 'nguo'],
      'vehicles': ['car', 'motorcycle', 'gari', 'pikipiki'],
      'furniture': ['sofa', 'table', 'bed', 'samani', 'furniture']
    };
    
    for (const [cat, keywords] of Object.entries(categoryMap)) {
      if (keywords.some(kw => text.includes(kw))) {
        filters.category = cat;
        break;
      }
    }
    
    return filters;
  }

  private parseNavigation(text: string): { path: string; params: Record<string, string> } {
    const routeMap: Record<string, string> = {
      'home': '/',
      'products': '/products',
      'services': '/services',
      'events': '/events',
      'shops': '/shops',
      'fun circle': '/fun-circle',
      'favorites': '/favorites',
      'messages': '/messages',
      'dashboard': '/dashboard',
      'profile': '/profile',
      'cart': '/cart',
      'checkout': '/checkout',
      'my shop': '/dashboard?tab=shop',
      'my listings': '/dashboard?tab=listings'
    };
    
    for (const [key, path] of Object.entries(routeMap)) {
      if (text.includes(key)) {
        return { path, params: {} };
      }
    }
    
    // Handle listing-specific navigation
    const listingMatch = text.match(/listing\s+(\w+)/i) || text.match(/item\s+(\w+)/i);
    if (listingMatch) {
      return { path: `/listing/${listingMatch[1]}`, params: { id: listingMatch[1] } };
    }
    
    return { path: '/', params: {} };
  }

  private extractContactMethod(text: string): 'whatsapp' | 'call' | 'message' {
    if (text.includes('whatsapp')) return 'whatsapp';
    if (text.includes('call') || text.includes('phone')) return 'call';
    return 'message';
  }

  private async extractListingId(text: string, session: BeastSession): Promise<string> {
    // Check if they said "this" or "that" - use last viewed
    if (text.includes('this') || text.includes('that')) {
      if (session.lastIntent && (session.lastIntent as any).listingId) {
        return (session.lastIntent as any).listingId;
      }
      if (session.viewedListings.length > 0) {
        return session.viewedListings[0];
      }
    }
    
    // Extract explicit ID
    const idMatch = text.match(/[a-f0-9-]{36}/i);
    if (idMatch) return idMatch[0];
    
    // Search by title
    const title = this.extractSearchQuery(text);
    if (title) {
      const { data } = await supabase
        .from('listings_public')
        .select('id')
        .ilike('title', `%${title}%`)
        .limit(1);
      if (data && data[0]) return data[0].id;
    }
    
    return '';
  }

  private async extractShopId(text: string, session: BeastSession): Promise<string> {
    const nameMatch = text.match(/(?:shop|store)\s+(\w+)/i);
    if (nameMatch) {
      const { data } = await supabase
        .from('shops')
        .select('id')
        .ilike('name', `%${nameMatch[1]}%`)
        .limit(1);
      if (data && data[0]) return data[0].id;
    }
    return '';
  }

  private async extractListingData(text: string, session: BeastSession): Promise<any> {
    // Extract product info from natural language
    const title = this.extractSearchQuery(text);
    const priceMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(k|kay|thousand)?/i);
    const price = priceMatch ? parseFloat(priceMatch[1]) * (priceMatch[2] ? 1000 : 1) : undefined;
    
    return {
      title: title || 'New Listing',
      price,
      status: 'draft'
    };
  }

  private async fallbackAction(text: string, session: BeastSession): Promise<any> {
    // Last resort - search is always safe
    return {
      type: 'SEARCH',
      query: text,
      filters: {},
      confidence: 0.6
    };
  }

  async extractKeywords(text: string): Promise<{ product?: string; action?: string }> {
    const productMatch = text.match(/(?:find|search|get|show).*?(\w+(?:\s+\w+){0,3})$/i);
    return {
      product: productMatch ? productMatch[1] : text
    };
  }
}