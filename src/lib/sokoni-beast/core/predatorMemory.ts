// src/lib/sokoni-beast/core/predatorMemory.ts
// Remembers EVERYTHING about the user

import { supabase } from '@/integrations/supabase/untyped-client';
import { BeastSession } from './beastEngine';

interface MemoryEntry {
  timestamp: number;
  input: string;
  response: string;
  intent: any;
  success: boolean;
}

export class predatorMemory {
  private localStorageKey = 'sokoni-beast-memory';
  private sessionCache = new Map<string, BeastSession>();
  
  async loadOrCreate(userId: string): Promise<BeastSession> {
    // Check cache first
    if (this.sessionCache.has(userId)) {
      return this.sessionCache.get(userId)!;
    }
    
    // Try localStorage
    const local = localStorage.getItem(`${this.localStorageKey}:${userId}`);
    if (local) {
      try {
        const session = JSON.parse(local);
        const restored = {
          ...session,
          context: new Map(Object.entries(session.context || {})),
          lastIntent: session.lastIntent,
          shoppingCart: session.shoppingCart || [],
          viewedListings: session.viewedListings || []
        };
        this.sessionCache.set(userId, restored);
        return restored;
      } catch (e) { /* fall through */ }
    }
    
    // Create new session
    const newSession: BeastSession = {
      userId,
      history: [],
      context: new Map(),
      confidence: 1,
      shoppingCart: [],
      viewedListings: []
    };
    
    // Load from Supabase if logged in
    if (userId && userId.length > 10) { // UUID length check
      await this.hydrateFromCloud(userId, newSession);
    }
    
    this.sessionCache.set(userId, newSession);
    await this.persist(userId);
    
    return newSession;
  }
  
  async record(userId: string, input: string, response: string, intent: any): Promise<void> {
    const session = await this.loadOrCreate(userId);
    
    // Add to history
    session.history.push(input);
    if (session.history.length > 50) session.history.shift();
    
    // Update context
    session.lastIntent = intent;
    session.context.set('lastInteraction', Date.now());
    session.context.set('lastIntent', intent);
    
    // Track viewed listings
    if (intent.type === 'NAVIGATE' && intent.path?.includes('/listing/')) {
      const listingId = intent.path.split('/').pop();
      if (listingId && !session.viewedListings.includes(listingId)) {
        session.viewedListings.unshift(listingId);
        if (session.viewedListings.length > 20) session.viewedListings.pop();
      }
    }
    
    // Update shopping cart
    if (intent.type === 'PURCHASE_INTENT' && intent.listingId) {
      if (!session.shoppingCart?.includes(intent.listingId)) {
        session.shoppingCart = [...(session.shoppingCart || []), intent.listingId];
      }
    }
    
    await this.persist(userId);
  }
  
  async getRecentContext(userId: string, limit = 5): Promise<MemoryEntry[]> {
    const session = await this.loadOrCreate(userId);
    // Return last N interactions (simplified)
    return session.history.slice(-limit).map((input, i) => ({
      timestamp: Date.now() - (limit - i) * 60000,
      input,
      response: '',
      intent: null,
      success: true
    }));
  }
  
  async getFrequentlyViewedCategories(userId: string): Promise<string[]> {
    const session = await this.loadOrCreate(userId);
    // Analyze viewed listings for patterns
    const categories = session.context.get('frequentCategories') || [];
    return categories;
  }
  
  private async persist(userId: string): Promise<void> {
    const session = this.sessionCache.get(userId);
    if (!session) return;
    
    // Save to localStorage
    const toStore = {
      ...session,
      context: Object.fromEntries(session.context)
    };
    localStorage.setItem(`${this.localStorageKey}:${userId}`, JSON.stringify(toStore));
    
    // Optionally save to cloud if user is logged in
    if (userId && userId.length > 10 && session.history.length % 10 === 0) {
      await this.syncToCloud(userId, session);
    }
  }
  
  private async hydrateFromCloud(userId: string, session: BeastSession): Promise<void> {
    try {
      // Load last 10 interactions from Supabase
      const { data } = await supabase
        .from('assistant_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) {
        session.history = data.map(m => m.content).reverse();
        session.viewedListings = []; // Would need separate table
      }
    } catch (e) {
      // Cloud table might not exist yet - that's fine
    }
  }
  
  private async syncToCloud(userId: string, session: BeastSession): Promise<void> {
    try {
      // Sync important data to cloud
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        beast_memory: {
          viewedListings: session.viewedListings,
          shoppingCart: session.shoppingCart,
          lastIntent: session.lastIntent
        },
        updated_at: new Date().toISOString()
      });
    } catch (e) {
      // Silent fail - local storage is primary
    }
  }
  
  clear(userId: string): void {
    this.sessionCache.delete(userId);
    localStorage.removeItem(`${this.localStorageKey}:${userId}`);
  }
}