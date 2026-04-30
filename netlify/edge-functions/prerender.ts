export default async (request: Request) => {
  const url = new URL(request.url);
  const path = url.pathname;
  const userAgent = request.headers.get('user-agent') || '';
  
  // List of bot user-agents to prerender for
  const botPattern = /Googlebot|Bingbot|facebookexternalhit|Twitterbot|LinkedInBot|WhatsApp|Discordbot|Slurp|DuckDuckBot|Baiduspider|YandexBot|TelegramBot|Applebot|Pinterestbot|redditbot/i;
  
  // If not a bot, let it go to the normal SPA
  if (!botPattern.test(userAgent)) {
    return; // Netlify will continue to the next matching route
  }
  
  console.log(`Prerendering for bot: ${userAgent}, path: ${path}`);
  
  // For bots, fetch prerendered HTML from Supabase Edge Function
  const supabaseUrl = `https://nanxwdsvtgswkwjodlpm.supabase.co/functions/v1/prerender?path=${path}`;
  
  try {
    const response = await fetch(supabaseUrl, {
      headers: {
        'User-Agent': userAgent,
      },
    });
    
    const html = await response.text();
    
    return new Response(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=600, s-maxage=3600',
        'X-Prerendered-By': 'Netlify-Edge',
      },
    });
  } catch (error) {
    console.error('Prerender error:', error);
    return; // Fall back to SPA on error
  }
};

export const config = {
  path: ["/products/*", "/services/*", "/events/*", "/shop/*"],
};