import apper from 'https://cdn.apper.io/actions/apper-actions.js';
import { createClient } from 'npm:@supabase/supabase-js';

const SUPABASE_URL = 'https://miyiowbmpatjyeovkznr.supabase.co';

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

function accessAllowed(content, userKey, selectedPeople = []) {
  if (content.visibility === 'public') return true;
  if (content.visibility === 'community') return Boolean(userKey);
  if (content.visibility === 'selected') return selectedPeople.some((key) => String(key) === String(userKey));
  return false;
}

apper.serve(async (req) => {
  try {
    const body = await req.json().catch(() => ({}));
    const secretKey = await apper.getSecret('SUPABASE_SERVICE_ROLE_KEY');
    if (!secretKey) return json({ success: false, error: 'Supabase server key is not configured.' }, 503);

    const supabase = createClient(SUPABASE_URL, secretKey, { auth: { persistSession: false } });
    const actor = await getActor();
    const userKey = actor?.Id || actor?.id || actor?.Email || actor?.email;
    const userName = actor?.Name || actor?.name || actor?.Email || actor?.email || 'Member';
    if (!userKey) return json({ success: false, error: 'Authenticated user identity is unavailable.' }, 401);

    const action = String(body.action || '').trim();

    if (action === 'create_content') {
      const type = String(body.type || '').trim().toLowerCase();
      const title = String(body.title || '').trim();
      const contentBody = String(body.body || '').trim();
      const visibility = String(body.visibility || 'public').trim().toLowerCase();
      const password = String(body.password || '');
      const selectedPeople = Array.isArray(body.selected_people) ? body.selected_people.map(String).filter(Boolean) : [];
      const selectedGroup = String(body.selected_group || '').trim() || null;
      const allowedTypes = ['post', 'announcement', 'group', 'project', 'research', 'report'];
      const allowedVisibility = ['public', 'community', 'selected', 'group'];
      if (!allowedTypes.includes(type)) return json({ success: false, error: 'Unsupported content type.' }, 400);
      if (type !== 'post' && !title) return json({ success: false, error: 'A title is required.' }, 400);
      if (!contentBody) return json({ success: false, error: 'Content is required.' }, 400);
      if (!allowedVisibility.includes(visibility)) return json({ success: false, error: 'Unsupported visibility.' }, 400);
      if (visibility === 'selected' && !selectedPeople.length) return json({ success: false, error: 'Select at least one member.' }, 400);
      if (visibility === 'group' && !selectedGroup) return json({ success: false, error: 'Select a group.' }, 400);
      if (password.length && password.length < 1) return json({ success: false, error: 'Invalid password.' }, 400);
      if (title.length > 240 || contentBody.length > 50000) return json({ success: false, error: 'Content exceeds the allowed length.' }, 400);

      const passwordHash = password ? await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password)).then((buffer) => Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('')) : null;
      const { data: content, error } = await supabase.from('content_items').insert({
        type,
        title: title || null,
        body: contentBody,
        author_key: String(userKey),
        author_name: userName,
        visibility,
        password_hash: passwordHash,
        group_key: selectedGroup,
        published: false,
      }).select().single();
      if (error) return json({ success: false, error: error.message }, 400);

      if (selectedPeople.length) {
        const rows = [...new Set(selectedPeople)].map((memberKey) => ({ content_id: content.id, user_key: memberKey }));
        const { error: aclError } = await supabase.from('content_people').insert(rows);
        if (aclError) {
          await supabase.from('content_items').delete().eq('id', content.id);
          return json({ success: false, error: aclError.message }, 400);
        }
      }
      return json({ success: true, data: { ...content, password_protected: Boolean(passwordHash) } }, 201);
    }

    if (action === 'publish_content') {
      const contentId = String(body.content_id || '').trim();
      if (!contentId) return json({ success: false, error: 'content_id is required.' }, 400);
      const { data, error } = await supabase.from('content_items').update({ published: true, updated_at: new Date().toISOString() }).eq('id', contentId).eq('author_key', String(userKey)).select().single();
      if (error) return json({ success: false, error: error.message }, 400);
      if (!data) return json({ success: false, error: 'Content was not found or is not yours.' }, 404);
      return json({ success: true, data: { id: data.id, published: true } });
    }

    if (action === 'list_content') {
      const type = String(body.type || '').trim().toLowerCase();
      const { data, error } = await supabase.from('content_items').select('id,type,title,body,author_key,author_name,visibility,group_key,published,created_at,updated_at').eq('published', true).eq('type', type).order('created_at', { ascending: false });
      if (error) return json({ success: false, error: error.message }, 400);
      const ids = (data || []).map((row) => row.id);
      let people = [];
      if (ids.length) {
        const { data: acl, error: aclError } = await supabase.from('content_people').select('content_id,user_key').in('content_id', ids);
        if (aclError) return json({ success: false, error: aclError.message }, 400);
        people = acl || [];
      }
      const visible = (data || []).filter((row) => {
        const keys = people.filter((item) => item.content_id === row.id).map((item) => item.user_key);
        return accessAllowed(row, String(userKey), keys);
      }).map((row) => ({ ...row, password_protected: false }));
      return json({ success: true, data: visible });
    }

    if (action === 'create_answer') {
      const questionId = String(body.question_id || '').trim();
      const answer = String(body.body || '').trim();
      if (!questionId || !answer) return json({ success: false, error: 'question_id and body are required.' }, 400);
      if (answer.length > 10000) return json({ success: false, error: 'Answer is too long.' }, 400);
      const { data: question, error: questionError } = await supabase.from('questions').select('id,published').eq('id', questionId).maybeSingle();
      if (questionError) return json({ success: false, error: questionError.message }, 400);
      if (!question?.published) return json({ success: false, error: 'Question was not found.' }, 404);
      const { data, error } = await supabase.from('answers').insert({ question_id: questionId, author_key: String(userKey), author_name: userName, body: answer }).select().single();
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data }, 201);
    }

    if (action === 'list_answers') {
      const questionId = String(body.question_id || '').trim();
      if (!questionId) return json({ success: false, error: 'question_id is required.' }, 400);
      const { data, error } = await supabase.from('answers').select('*').eq('question_id', questionId).order('accepted', { ascending: false }).order('created_at', { ascending: true });
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data });
    }

    if (action === 'accept_answer') {
      const answerId = String(body.answer_id || '').trim();
      if (!answerId) return json({ success: false, error: 'answer_id is required.' }, 400);
      const { data: answer, error: answerError } = await supabase.from('answers').select('id,question_id').eq('id', answerId).maybeSingle();
      if (answerError) return json({ success: false, error: answerError.message }, 400);
      if (!answer) return json({ success: false, error: 'Answer was not found.' }, 404);
      const { data: question, error: questionError } = await supabase.from('questions').select('id,author_key').eq('id', answer.question_id).maybeSingle();
      if (questionError) return json({ success: false, error: questionError.message }, 400);
      if (!question || String(question.author_key) !== String(userKey)) return json({ success: false, error: 'Only the question creator can accept an answer.' }, 403);
      const { error: clearError } = await supabase.from('answers').update({ accepted: false }).eq('question_id', answer.question_id);
      if (clearError) return json({ success: false, error: clearError.message }, 400);
      const { data, error } = await supabase.from('answers').update({ accepted: true, updated_at: new Date().toISOString() }).eq('id', answerId).select().single();
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data });
    }

    if (action === 'delete_answer') {
      const answerId = String(body.answer_id || '').trim();
      if (!answerId) return json({ success: false, error: 'answer_id is required.' }, 400);
      const { error } = await supabase.from('answers').delete().eq('id', answerId).eq('author_key', String(userKey));
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true });
    }

    return json({ success: false, error: `Unknown action: ${action}` }, 400);
  } catch (error) {
    return json({ success: false, error: error?.message || 'Unexpected server error.' }, 500);
  }
});
