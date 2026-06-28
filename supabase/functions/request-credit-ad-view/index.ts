import { createClient } from 'npm:@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    if (!authHeader.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401)
    }

    const userClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    )
    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: userErr } = await userClient.auth.getUser(token)
    if (userErr || !userData?.user) return json({ error: 'Unauthorized' }, 401)
    const userId = userData.user.id

    const body = await req.json().catch(() => null) as
      | { ad_id?: string; campaign_id?: string; kind?: 'ad' | 'campaign'; watched_seconds?: number; fingerprint?: string } | null
    const targetId = body?.ad_id ?? body?.campaign_id
    const kind: 'ad' | 'campaign' = body?.kind ?? (body?.campaign_id ? 'campaign' : 'ad')
    if (!targetId || typeof body?.watched_seconds !== 'number') {
      return json({ error: 'Invalid request' }, 400)
    }
    if (body.watched_seconds < 0 || body.watched_seconds > 3600) {
      return json({ error: 'Invalid watched_seconds' }, 400)
    }
    const fingerprint = (body.fingerprint ?? '').slice(0, 128)
    const userAgent = (req.headers.get('user-agent') ?? '').slice(0, 256)
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim().slice(0, 64) || null

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const rpcName = kind === 'campaign' ? 'credit_campaign_view' : 'credit_ad_view'
    const rpcArgs = kind === 'campaign'
      ? { p_campaign_id: targetId, p_user_id: userId, p_watched: Math.floor(body.watched_seconds), p_fingerprint: fingerprint, p_user_agent: userAgent, p_ip: ip }
      : { p_ad_id: targetId, p_user_id: userId, p_watched: Math.floor(body.watched_seconds), p_fingerprint: fingerprint, p_user_agent: userAgent, p_ip: ip }
    const { data, error } = await admin.rpc(rpcName, rpcArgs as any)
    if (error) return json({ error: error.message }, 400)
    return json(data ?? { ok: true }, 200)
  } catch (e) {
    return json({ error: (e as Error).message }, 500)
  }
})

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}
