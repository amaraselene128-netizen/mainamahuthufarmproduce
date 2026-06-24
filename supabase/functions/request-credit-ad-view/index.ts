import { createClient } from 'npm:@supabase/supabase-js@2'
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'

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
      | { ad_id?: string; watched_seconds?: number; fingerprint?: string } | null
    if (!body?.ad_id || typeof body.watched_seconds !== 'number') {
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

    const { data, error } = await admin.rpc('credit_ad_view', {
      p_ad_id: body.ad_id,
      p_user_id: userId,
      p_watched: Math.floor(body.watched_seconds),
      p_fingerprint: fingerprint,
      p_user_agent: userAgent,
      p_ip: ip,
    })
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
