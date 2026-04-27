// src/lib/sokoni-beast/fangs/navigationFang.ts
export class navigationFang {
  async go(path: string, params?: Record<string, string>): Promise<any> {
    // Replace params in path
    let finalPath = path;
    if (params) {
      for (const [key, value] of Object.entries(params)) {
        finalPath = finalPath.replace(`:${key}`, value);
      }
    }
    
    // Trigger navigation
    if (typeof window !== 'undefined') {
      window.location.href = finalPath;
    }
    
    return { type: 'NAVIGATED', path: finalPath };
  }
  
  async applyFilters(url: string, filters: any): Promise<void> {
    const searchParams = new URLSearchParams();
    if (filters.category) searchParams.set('category', filters.category);
    if (filters.minPrice) searchParams.set('minPrice', filters.minPrice.toString());
    if (filters.maxPrice) searchParams.set('maxPrice', filters.maxPrice.toString());
    if (filters.location) searchParams.set('location', filters.location);
    
    const newUrl = `${url}?${searchParams.toString()}`;
    window.location.href = newUrl;
  }
}

// src/lib/sokoni-beast/fangs/conversionFang.ts
export class conversionFang {
  async connect(sellerId: string, method: 'whatsapp' | 'call' | 'message'): Promise<any> {
    // Get seller contact from Supabase
    const { data } = await supabase
      .from('shops')
      .select('phone, whatsapp')
      .eq('id', sellerId)
      .single();
    
    if (method === 'whatsapp' && data?.whatsapp) {
      window.open(`https://wa.me/${data.whatsapp}`, '_blank');
    } else if (method === 'call' && data?.phone) {
      window.location.href = `tel:${data.phone}`;
    } else {
      window.location.href = `/messages?user=${sellerId}`;
    }
    
    return { success: true, method };
  }
  
  async saveToWishlist(listingId: string): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      window.location.href = '/login';
      return { success: false, requireLogin: true };
    }
    
    await supabase.from('favorites').insert({
      user_id: user.user.id,
      listing_id: listingId
    });
    
    return { success: true, listingId };
  }
  
  async initiateCheckout(listingId: string): Promise<any> {
    window.location.href = `/checkout?listing=${listingId}`;
    return { success: true };
  }
  
  async startListing(data: any): Promise<any> {
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      window.location.href = '/login';
      return { success: false, requireLogin: true };
    }
    
    // Store in session storage for the listing form
    sessionStorage.setItem('draftListing', JSON.stringify(data));
    window.location.href = '/dashboard?action=new-listing';
    
    return { success: true };
  }
  
  async shopInteraction(shopId: string, action: 'follow' | 'visit' | 'promote'): Promise<any> {
    if (action === 'visit') {
      window.location.href = `/shops/${shopId}`;
    } else if (action === 'follow') {
      // Follow logic
      const { data: user } = await supabase.auth.getUser();
      if (user.user) {
        await supabase.from('shop_followers').insert({
          user_id: user.user.id,
          shop_id: shopId
        });
      }
    } else if (action === 'promote') {
      window.location.href = `/dashboard?tab=shop&action=promote`;
    }
    
    return { success: true, action };
  }
}