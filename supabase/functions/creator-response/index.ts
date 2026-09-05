import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || 'https://miyiowbmpatjyeovkznr.supabase.co';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
};

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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
  const token = header.replace(/^Bearer\s+/i, '');
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  const user = data.user;
  return {
    Id: user.id,
    id: user.id,
    Email: user.email,
    email: user.email,
    Name: user.user_metadata?.display_name || user.user_metadata?.name || user.email || 'Member',
    name: user.user_metadata?.display_name || user.user_metadata?.name || user.email || 'Member',
  };
}


function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const body = await req.json().catch(() => ({}));
    const secretKey = getSecretKey();
    const resendKey = Deno.env.get('RESEND_API_KEY');
    const fromEmail = Deno.env.get('RESEND_FROM_EMAIL');
    if (!secretKey) return json({ success: false, error: 'Supabase server key is not configured.' }, 503);
    if (!resendKey || !fromEmail) return json({ success: false, error: 'Private email delivery is not configured yet.' }, 503);

    const contentType = String(body.content_type || 'question').trim().toLowerCase();
    const contentId = String(body.content_id || '').trim();
    const text = String(body.body || '').trim();
    if (!contentId || !text) return json({ success: false, error: 'content_id and body are required.' }, 400);
    if (text.length > 5000) return json({ success: false, error: 'Private response is too long.' }, 400);
    if (!['question'].includes(contentType)) return json({ success: false, error: 'Private responses are not enabled for this content type yet.' }, 400);

    const supabase = createClient(SUPABASE_URL, secretKey, { auth: { persistSession: false } });
    const actor = await getActor();
    const userKey = actor?.Id || actor?.id || actor?.Email || actor?.email;
    const senderName = actor?.Name || actor?.name || actor?.Email || actor?.email || 'A C3H member';
    if (!userKey) return json({ success: false, error: 'Authenticated user identity is unavailable.' }, 401);

    const { data: content, error: contentError } = await supabase
      .from('questions')
      .select('id,title,body,author_key,author_name')
      .eq('id', contentId)
      .eq('published', true)
      .maybeSingle();
    if (contentError) return json({ success: false, error: contentError.message }, 400);
    if (!content) return json({ success: false, error: 'Content was not found.' }, 404);
    if (String(content.author_key) === String(userKey)) return json({ success: false, error: 'You cannot send a private response to your own content.' }, 400);

    const { data: creatorProfile, error: profileError } = await supabase
      .from('profiles')
      .select('email,display_name')
      .eq('user_key', String(content.author_key))
      .maybeSingle();
    if (profileError) return json({ success: false, error: profileError.message }, 400);
    const recipient = creatorProfile?.email;
    if (!recipient) return json({ success: false, error: 'The creator has no email available for private responses.' }, 409);

    const subject = `Private response to your C3H question: ${String(content.title || 'Question').slice(0, 120)}`;
    const html = `<div style="font-family:system-ui,-apple-system,Segoe UI,sans-serif;line-height:1.6;color:#171717;max-width:680px"><p>You received a private response to your C3H content.</p><p><strong>From:</strong> ${escapeHtml(senderName)}</p><p><strong>Content:</strong> ${escapeHtml(content.title || 'Question')}</p><div style="margin:20px 0;padding:16px;border:1px solid #ddd;border-radius:12px;white-space:pre-wrap">${escapeHtml(text)}</div><p style="color:#666;font-size:13px">This response was delivered privately. C3H does not expose your email address to the sender.</p></div>`;

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromEmail, to: [recipient], subject, html, reply_to: actor?.Email || actor?.email || undefined }),
    });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) return json({ success: false, error: result?.message || 'Email delivery failed.' }, 502);
    return json({ success: true, data: { delivered: true } });
  } catch (error) {
    return json({ success: false, error: error?.message || 'Unexpected server error.' }, 500);
  }
});
