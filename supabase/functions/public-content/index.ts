import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://miyiowbmpatjyeovkznr.supabase.co';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

function getSecretKey() {
  try {
    const keys = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    return keys.default || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  } catch {
    return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
  }
}

async function getActor(req, supabase) {
  const header = req.headers.get('Authorization');
  if (!header) return null;
  const token = header.replace(/^Bearer\\s+/i, '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  const user = data.user;
  return { Id: user.id, Name: user.user_metadata?.display_name || user.user_metadata?.name || user.email || 'Member' };
}

const encoder = new TextEncoder();

async function sha256(value) {
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function groupMembership(supabase, groupKey, userKey) {
  if (!groupKey || !userKey) return false;
  const { data } = await supabase.from('group_members').select('id').eq('group_id', groupKey).eq('user_key', String(userKey)).maybeSingle();
  return Boolean(data);
}

async function visibilityAllowed(supabase, content, userKey) {
  if (content.visibility === 'public') return true;
  if (!userKey) return false;
  if (content.visibility === 'community') return true;
  if (content.visibility === 'selected') {
    const { data } = await supabase.from('content_people').select('user_key').eq('content_id', content.id).eq('user_key', String(userKey)).maybeSingle();
    return Boolean(data);
  }
  if (content.visibility === 'group') return groupMembership(supabase, content.group_key, String(userKey));
  return false;
}

async function grantValid(supabase, contentId, userKey, accessToken) {
  if (!contentId || !userKey || !accessToken) return false;
  const tokenHash = await sha256(accessToken);
  const { data } = await supabase
    .from('content_access_grants')
    .select('id')
    .eq('content_id', contentId)
    .eq('user_key', String(userKey))
    .eq('token_hash', tokenHash)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle();
  return Boolean(data);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const secretKey = getSecretKey();
    if (!secretKey) return json({ success: false, error: 'Supabase server key is not configured.' }, 503);

    const supabase = createClient(SUPABASE_URL, secretKey, { auth: { persistSession: false } });
    const actor = await getActor(req, supabase);
    const userKey = actor?.Id || null;
    const action = String(body.action || 'get_content').trim();
    const contentId = String(body.content_id || '').trim();
    if (!contentId) return json({ success: false, error: 'content_id is required.' }, 400);

    const { data: content, error } = await supabase
      .from('content_items')
      .select('id,type,title,body,author_key,author_name,visibility,group_key,published,created_at,updated_at,password_hash')
      .eq('id', contentId)
      .eq('published', true)
      .maybeSingle();
    if (error) return json({ success: false, error: error.message }, 400);
    if (!content) return json({ success: false, error: 'Content was not found.' }, 404);

    if (action === 'verify_password') {
      const password = typeof body.password === 'string' ? body.password : '';
      const anonymousKey = typeof body.anonymous_key === 'string' ? body.anonymous_key.trim() : '';
      if (!content.password_hash) return json({ success: false, error: 'This content is not password protected.' }, 400);
      if (!password) return json({ success: false, error: 'Password is required.' }, 400);
      if (password.length > 256) return json({ success: false, error: 'Password is too long.' }, 400);
      const accessUserKey = userKey || (content.visibility === 'public' ? anonymousKey : null);
      if (!accessUserKey) return json({ success: false, error: 'Sign in is required to access this content.' }, 401);
      if (!(await visibilityAllowed(supabase, content, userKey))) return json({ success: false, error: 'You are not allowed to access this content.' }, 403);
      const candidate = await sha256(password);
      if (candidate !== content.password_hash) return json({ success: false, error: 'Incorrect password.' }, 403);
      const token = randomToken();
      const tokenHash = await sha256(token);
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const { error: grantError } = await supabase.from('content_access_grants').upsert(
        { content_id: contentId, user_key: String(accessUserKey), token_hash: tokenHash, expires_at: expiresAt },
        { onConflict: 'content_id,user_key' },
      );
      if (grantError) return json({ success: false, error: grantError.message }, 400);
      return json({ success: true, data: { access_token: token, expires_at: expiresAt } });
    }

    if (action === 'get_content') {
      const anonymousKey = typeof body.anonymous_key === 'string' ? body.anonymous_key.trim() : '';
      const accessToken = typeof body.access_token === 'string' ? body.access_token : '';
      const accessUserKey = userKey || (content.visibility === 'public' ? anonymousKey : null);
      const passwordVerified = !content.password_hash || await grantValid(supabase, content.id, accessUserKey, accessToken);
      const allowed = passwordVerified && await visibilityAllowed(supabase, content, userKey);
      const safeMeta = {
        id: content.id,
        type: content.type,
        title: content.title,
        author_key: content.author_key,
        author_name: content.author_name,
        visibility: content.visibility,
        published: content.published,
        created_at: content.created_at,
        updated_at: content.updated_at,
        password_protected: Boolean(content.password_hash),
        unlocked: Boolean(allowed),
      };
      if (!allowed) {
        if (!userKey && content.visibility !== 'public') return json({ success: false, error: 'Sign in is required to access this content.' }, 401);
        if (!passwordVerified) return json({ success: true, data: safeMeta });
        return json({ success: false, error: 'You are not allowed to access this content.' }, 403);
      }
      return json({ success: true, data: { ...safeMeta, body: content.body } });
    }

    return json({ success: false, error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    return json({ success: false, error: error?.message || 'Unexpected server error.' }, 500);
  }
});
