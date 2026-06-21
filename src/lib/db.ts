// Untyped Supabase client wrapper used by the app until `types.ts`
// is regenerated from the live schema.
import { supabase as typedClient } from "@/integrations/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

export const db = typedClient as unknown as SupabaseClient;
export { typedClient as supabase };