// Sokoni Assistant Edge Function — Lovable-free.
// AI cascade: GROQ → GEMINI → OPENAI. If none configured, returns 204
// so the client falls back to the free rule-based engine.
//
// All keys are OPTIONAL. The marketplace works fully without any AI key.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ---- rate limiting (per-instance, per-client) ----
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(clientId: string): boolean {
  const now = Date.now();
  const windowMs = 60_000;
  const maxRequests = 60;
  const entry = rateLimitMap.get(clientId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(clientId, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= maxRequests) return false;
  entry.count++;
  return true;
}

// ---- AI provider cascade ----
type Provider = {
  name: string;
  url: string;
  model: string;
  key: string;
  // some providers (Gemini OpenAI-compat) need extra header / body tweaks — not needed here
};

function activeProviders(): Provider[] {
  const list: Provider[] = [];
  const groq = Deno.env.get("GROQ_API_KEY");
  if (groq) list.push({
    name: "groq",
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: Deno.env.get("GROQ_MODEL") || "llama-3.3-70b-versatile",
    key: groq,
  });
  const gemini = Deno.env.get("GEMINI_API_KEY");
  if (gemini) list.push({
    name: "gemini",
    url: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
    model: Deno.env.get("GEMINI_MODEL") || "gemini-2.0-flash",
    key: gemini,
  });
  const openai = Deno.env.get("OPENAI_API_KEY");
  if (openai) list.push({
    name: "openai",
    url: "https://api.openai.com/v1/chat/completions",
    model: Deno.env.get("OPENAI_MODEL") || "gpt-4o-mini",
    key: openai,
  });
  return list;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  const authHeader = req.headers.get("authorization");
  const userClient = createClient(supabaseUrl, anonKey, { auth: { persistSession: false } });

  let userId: string | null = null;
  if (authHeader) {
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await userClient.auth.getUser(token);
    userId = user?.id || null;
  }

  const clientId = userId || req.headers.get("x-real-ip") || "anonymous";
  if (!checkRateLimit(clientId)) {
    return new Response(JSON.stringify({ error: "Rate limit exceeded. Please slow down." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  try {
    const body = await req.json();
    const { action, data } = body;

    // ============================================
    // AI CHAT — provider cascade with graceful fallback
    // ============================================
    if (action === "chat") {
      const providers = activeProviders();
      // No keys configured → tell client to use rule engine.
      if (!providers.length) {
        return new Response(JSON.stringify({ fallback: "rules", reason: "no_ai_provider_configured" }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      const { messages = [], username, isLoggedIn } = data || {};

      const systemPrompt = `You are the SOKONI ARENA assistant — a sharp, decisive Kenyan marketplace AI. Use tools to ACT, never narrate filling search bars. When you search and find a likely match, OPEN THE LISTING DETAIL directly via tools (search_marketplace handles routing intelligently).

PAGES: / /products /services /events /shops /shop/:slug /fun-circle /favorites /messages /dashboard /login /register /forgot-password /how-it-works /help /search?q=...

TOOLS: search_marketplace, open_listing, navigate, contact_seller, save_favorite, market_analysis, shop_action, start_listing, walkthrough, end_session.

USER: logged_in=${isLoggedIn ? "yes" : "no"}, name=${username || "guest"}.

STYLE: Confident, conversational, ≤3 short sentences. Light Sheng/Swahili (karibu, sawa, poa, twende, nimepata). For broad questions like "what is fun circle" give a one-line answer then offer a follow-up question. Never invent products or prices — always call search_marketplace. Personal pages need login → /login. The brand is "Sokoni Arena" — never say "Sokoni Beast".`;

      const tools = buildTools();

      // Try each provider in order; on 4xx/5xx, fall through.
      let lastError = "";
      for (const provider of providers) {
        try {
          const aiResp = await fetch(provider.url, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${provider.key}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: provider.model,
              stream: true,
              messages: [{ role: "system", content: systemPrompt }, ...messages],
              tools,
            }),
          });

          if (aiResp.ok && aiResp.body) {
            return new Response(aiResp.body, {
              headers: {
                ...corsHeaders,
                "Content-Type": "text/event-stream",
                "x-ai-provider": provider.name,
              },
            });
          }

          lastError = `${provider.name}:${aiResp.status}`;
          console.warn(`[sokoni-assistant] provider ${provider.name} failed:`, aiResp.status);
          // 401/403 → bad key, skip. 429 → quota, skip. 5xx → skip.
        } catch (e) {
          lastError = `${provider.name}:network`;
          console.warn(`[sokoni-assistant] provider ${provider.name} threw:`, e);
        }
      }

      // All providers failed → tell client to use rule engine.
      return new Response(JSON.stringify({ fallback: "rules", reason: "all_providers_failed", lastError }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // ============================================
    // STORE CONVERSATION MESSAGE
    // ============================================
    if (action === "store_message") {
      if (!userId) return unauth();
      const { conversation_id, role, content, intent_type, action_taken, metadata } = data;
      let convId = conversation_id;
      if (!convId) {
        const { data: newConv, error: convError } = await adminClient
          .from("assistant_conversations")
          .insert({ user_id: userId, is_active: true })
          .select("id").single();
        if (convError) throw convError;
        convId = newConv.id;
      }
      await adminClient.from("assistant_conversations")
        .update({ last_activity_at: new Date().toISOString() }).eq("id", convId);
      const { data: message, error: msgError } = await adminClient
        .from("assistant_messages")
        .insert({ conversation_id: convId, user_id: userId, role, content, intent_type, action_taken, metadata })
        .select().single();
      if (msgError) throw msgError;
      return ok({ success: true, conversation_id: convId, message });
    }

    if (action === "end_conversation") {
      if (!userId) return unauth();
      const { conversation_id } = data;
      await adminClient.from("assistant_conversations")
        .update({ is_active: false, ended_at: new Date().toISOString() })
        .eq("id", conversation_id).eq("user_id", userId);
      return ok({ success: true });
    }

    if (action === "get_history") {
      if (!userId) return unauth();
      const { limit = 50, offset = 0 } = data || {};
      const { data: conversations, error } = await adminClient
        .from("assistant_conversations")
        .select(`*, messages:assistant_messages(*)`)
        .eq("user_id", userId)
        .order("started_at", { ascending: false })
        .range(offset, offset + limit - 1);
      if (error) throw error;
      return ok({ success: true, conversations });
    }

    if (action === "log_analytics") {
      const { event_type, event_data, session_id } = data;
      await adminClient.from("assistant_analytics").insert({
        user_id: userId, session_id: session_id || crypto.randomUUID(),
        event_type, event_data,
      });
      return ok({ success: true });
    }

    if (action === "admin_get_all_conversations") {
      if (!userId) return unauth();
      const { data: isAdmin } = await adminClient.rpc("has_role", { _user_id: userId, _role: "admin" });
      if (!isAdmin) return new Response(JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      const { data: rows, error } = await adminClient
        .from("assistant_conversations")
        .select(`*, messages:assistant_messages(*), profile:profiles_public(username, full_name)`)
        .order("started_at", { ascending: false }).limit(200);
      if (error) throw error;
      return ok({ success: true, conversations: rows });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    console.error("sokoni-assistant error:", e);
    return new Response(JSON.stringify({ error: e?.message || "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});

function ok(body: any) {
  return new Response(JSON.stringify(body), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
function unauth() {
  return new Response(JSON.stringify({ error: "Authentication required" }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
}

function buildTools() {
  return [
    { type: "function", function: { name: "search_marketplace", description: "Search SokoniArena for products, services, events or shops.",
      parameters: { type: "object", properties: {
        query: { type: "string" },
        type: { type: "string", enum: ["product", "service", "event", "shop"] },
      }, required: ["query"], additionalProperties: false } } },
    { type: "function", function: { name: "open_listing", description: "Open a specific listing detail page.",
      parameters: { type: "object", properties: {
        listing_id: { type: "string" }, title: { type: "string" },
      }, additionalProperties: false } } },
    { type: "function", function: { name: "navigate", description: "Navigate to a page on SokoniArena.",
      parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"], additionalProperties: false } } },
    { type: "function", function: { name: "contact_seller", description: "Contact seller via WhatsApp, call or in-app message.",
      parameters: { type: "object", properties: {
        listing_id: { type: "string" }, shop_id: { type: "string" },
        method: { type: "string", enum: ["whatsapp", "call", "message"] },
      }, required: ["method"], additionalProperties: false } } },
    { type: "function", function: { name: "save_favorite", description: "Save a listing to wishlist.",
      parameters: { type: "object", properties: { listing_id: { type: "string" } }, required: ["listing_id"], additionalProperties: false } } },
    { type: "function", function: { name: "market_analysis", description: "Analyze price range for a product across SokoniArena.",
      parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"], additionalProperties: false } } },
    { type: "function", function: { name: "shop_action", description: "Visit, follow or promote a shop.",
      parameters: { type: "object", properties: {
        shop_id: { type: "string" }, shop_name: { type: "string" },
        action: { type: "string", enum: ["visit", "follow", "promote"] },
      }, required: ["action"], additionalProperties: false } } },
    { type: "function", function: { name: "start_listing", description: "Start creating a new listing.",
      parameters: { type: "object", properties: {
        title: { type: "string" }, price: { type: "number" },
        category: { type: "string" }, type: { type: "string", enum: ["product", "service", "event"] },
      }, additionalProperties: false } } },
    { type: "function", function: { name: "walkthrough", description: "Guided tour of SokoniArena.",
      parameters: { type: "object", properties: {}, additionalProperties: false } } },
    { type: "function", function: { name: "end_session", description: "End the live voice session.",
      parameters: { type: "object", properties: {}, additionalProperties: false } } },
  ];
}
