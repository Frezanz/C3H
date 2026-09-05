import apper from 'https://cdn.apper.io/actions/apper-actions.js';
import { createClient } from 'npm:@supabase/supabase-js';

const SUPABASE_URL = 'https://miyiowbmpatjyeovkznr.supabase.co';

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' },
  });
}

apper.serve(async (req) => {
  try {
    const secretKey = await apper.getSecret('SUPABASE_SERVICE_ROLE_KEY');
    if (!secretKey) return json({ success: false, error: 'Supabase server key is not configured.' }, 503);

    const supabase = createClient(SUPABASE_URL, secretKey, { auth: { persistSession: false } });
    const { data: content, error: contentError } = await supabase
      .from('content_items')
      .select('id,type,title,body,author_name,created_at,updated_at')
      .eq('published', true)
      .eq('visibility', 'public')
      .is('password_hash', null)
      .order('created_at', { ascending: false })
      .limit(40);
    if (contentError) return json({ success: false, error: contentError.message }, 400);

    const { data: questions, error: questionError } = await supabase
      .from('questions')
      .select('id,question,title,body,category,author_name,created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(40);
    if (questionError) return json({ success: false, error: questionError.message }, 400);

    const { data: announcements, error: announcementError } = await supabase
      .from('announcements')
      .select('id,title,body,created_at')
      .eq('published', true)
      .order('created_at', { ascending: false })
      .limit(40);
    if (announcementError) return json({ success: false, error: announcementError.message }, 400);

    const feed = [
      ...(content || []).map((item) => ({
        id: `content:${item.id}`,
        content_id: item.id,
        type: item.type,
        title: item.title || '',
        body: item.body,
        author_name: item.author_name || 'Member',
        created_at: item.created_at,
      })),
      ...(questions || []).map((item) => ({
        id: `question:${item.id}`,
        content_id: item.id,
        type: 'question',
        title: item.title || item.question || 'Question',
        body: item.body || item.question || '',
        author_name: item.author_name || 'Member',
        category: item.category || null,
        created_at: item.created_at,
      })),
      ...(announcements || []).map((item) => ({
        id: `announcement:${item.id}`,
        content_id: item.id,
        type: 'announcement',
        title: item.title,
        body: item.body,
        author_name: 'C3H',
        created_at: item.created_at,
      })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 60);

    return json({ success: true, data: feed });
  } catch (error) {
    return json({ success: false, error: error?.message || 'Unexpected server error.' }, 500);
  }
});