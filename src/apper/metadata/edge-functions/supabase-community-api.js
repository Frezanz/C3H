import apper from 'https://cdn.apper.io/actions/apper-actions.js';
import { createClient } from 'npm:@supabase/supabase-js@2';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
}

async function getActor() {
  const candidates = [
    () => apperClient?.getCurrentUser?.(),
    () => apperClient?.getUser?.(),
    () => apperClient?.session?.getCurrentUser?.(),
    () => apperClient?.session?.get?.(),
  ];
  for (const get of candidates) {
    try {
      const value = await get();
      if (value) return value?.user || value;
    } catch (_) {}
  }
  return apperClient?.user || null;
}

apper.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const secretKey = await apper.getSecret('SUPABASE_SERVICE_ROLE_KEY');
    if (!secretKey) return json({ success: false, error: 'Supabase server key is not configured.' }, 503);

    const supabase = createClient('https://miyiowbmpatjyeovkznr.supabase.co', secretKey, { auth: { persistSession: false } });
    const actor = await getActor();
    const userKey = actor?.Id || actor?.id || actor?.Email || actor?.email;
    const userEmail = actor?.Email || actor?.email || null;
    if (!userKey) return json({ success: false, error: 'Authenticated user identity is unavailable.' }, 401);

    const action = body.action || 'list_questions';

    if (action === 'list_questions') {
      const { data, error } = await supabase.from('questions').select('*').eq('published', true).order('display_order', { ascending: true });
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data });
    }
    if (action === 'list_announcements') {
      const { data, error } = await supabase.from('announcements').select('*').eq('published', true).order('created_at', { ascending: false });
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data });
    }
    if (action === 'list_comments') {
      if (!body.question_id) return json({ success: false, error: 'question_id is required.' }, 400);
      const { data, error } = await supabase.from('comments').select('*').eq('question_id', body.question_id).order('created_at', { ascending: true });
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data });
    }
    if (action === 'create_comment') {
      const text = String(body.body || '').trim();
      if (!body.question_id || !text) return json({ success: false, error: 'question_id and body are required.' }, 400);
      if (text.length > 2000) return json({ success: false, error: 'Comment is too long.' }, 400);
      const { data, error } = await supabase.from('comments').insert({ question_id: body.question_id, author_key: String(userKey), author_name: actor?.Name || actor?.name || userEmail || 'Member', body: text }).select().single();
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data }, 201);
    }
    if (action === 'update_comment') {
      if (!body.comment_id) return json({ success: false, error: 'comment_id is required.' }, 400);
      const text = String(body.body || '').trim();
      if (!text || text.length > 2000) return json({ success: false, error: 'A valid comment body is required.' }, 400);
      const { data, error } = await supabase.from('comments').update({ body: text, updated_at: new Date().toISOString() }).eq('id', body.comment_id).eq('author_key', String(userKey)).select().single();
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data });
    }
    if (action === 'delete_comment') {
      if (!body.comment_id) return json({ success: false, error: 'comment_id is required.' }, 400);
      const { error } = await supabase.from('comments').delete().eq('id', body.comment_id).eq('author_key', String(userKey));
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true });
    }
    if (action === 'get_profile') {
      const { data, error } = await supabase.from('profiles').select('*').eq('user_key', String(userKey)).maybeSingle();
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data, user: { key: String(userKey), email: userEmail } });
    }
    if (action === 'upsert_profile') {
      const displayName = String(body.display_name || actor?.Name || actor?.name || userEmail || 'Member').trim().slice(0, 120);
      const preferences = body.preferences && typeof body.preferences === 'object' ? body.preferences : {};
      const { data, error } = await supabase.from('profiles').upsert({ user_key: String(userKey), email: userEmail, display_name: displayName, preferences, updated_at: new Date().toISOString() }, { onConflict: 'user_key' }).select().single();
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data });
    }
    if (action === 'list_messages') {
      const { data, error } = await supabase.from('personalized_messages').select('*').eq('user_key', String(userKey)).order('created_at', { ascending: false });
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data });
    }
    if (action === 'mark_message_read') {
      if (!body.message_id) return json({ success: false, error: 'message_id is required.' }, 400);
      const { data, error } = await supabase.from('personalized_messages').update({ read_at: new Date().toISOString() }).eq('id', body.message_id).eq('user_key', String(userKey)).select().single();
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data });
    }
    if (action === 'create_signed_upload') {
      const path = String(body.path || '').trim();
      const bucket = String(body.bucket || 'community-media').trim();
      if (!path || path.includes('..')) return json({ success: false, error: 'A valid storage path is required.' }, 400);
      const { data, error } = await supabase.storage.from(bucket).createSignedUploadUrl(`${String(userKey)}/${path}`);
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data });
    }
    return json({ success: false, error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    return json({ success: false, error: error?.message || 'Unexpected server error.' }, 500);
  }
});
