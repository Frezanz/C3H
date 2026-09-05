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



function isMissingTable(error) {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const secretKey = getSecretKey();
    if (!secretKey) return json({ success: false, error: 'Supabase server key is not configured.' }, 503);

    const supabase = createClient(SUPABASE_URL, secretKey, { auth: { persistSession: false } });
    const [contentResult, questionResult, announcementResult] = await Promise.all([
      supabase
        .from('content_items')
        .select('id,type,title,body,author_name,created_at')
        .eq('published', true)
        .eq('visibility', 'public')
        .is('password_hash', null)
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('questions')
        .select('id,title,body,category,author_name,created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('announcements')
        .select('id,title,body,created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(40),
    ]);

    if (contentResult.error && !isMissingTable(contentResult.error)) return json({ success: false, error: contentResult.error.message }, 400);
    if (questionResult.error && !isMissingTable(questionResult.error)) return json({ success: false, error: questionResult.error.message }, 400);
    if (announcementResult.error && !isMissingTable(announcementResult.error)) return json({ success: false, error: announcementResult.error.message }, 400);

    const feed = [
      ...((contentResult.data || []).map((item) => ({
        id: `content:${item.id}`,
        content_id: item.id,
        type: item.type,
        title: item.title || '',
        body: item.body,
        author_name: item.author_name || 'Member',
        created_at: item.created_at,
      }))),
      ...((questionResult.data || []).map((item) => ({
        id: `question:${item.id}`,
        content_id: item.id,
        type: 'question',
        title: item.title || 'Question',
        body: item.body || '',
        author_name: item.author_name || 'Member',
        category: item.category || null,
        created_at: item.created_at,
      }))),
      ...((announcementResult.data || []).map((item) => ({
        id: `announcement:${item.id}`,
        content_id: item.id,
        type: 'announcement',
        title: item.title,
        body: item.body,
        author_name: 'C3H',
        created_at: item.created_at,
      }))),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 60);

    return json({ success: true, data: feed });
  } catch (error) {
    return json({ success: false, error: error?.message || 'Unexpected server error.' }, 500);
  }
});