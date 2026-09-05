import apper from 'https://cdn.apper.io/actions/apper-actions.js';
import { createClient } from 'npm:@supabase/supabase-js';

const SUPABASE_URL = 'https://miyiowbmpatjyeovkznr.supabase.co';
const encoder = new TextEncoder();

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

async function sha256(value) {
  const buffer = await crypto.subtle.digest('SHA-256', encoder.encode(value));
  return Array.from(new Uint8Array(buffer)).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function randomToken() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function accessAllowed(content, userKey, selectedPeople = [], groupMember = false, passwordVerified = false) {
  if (content.password_hash && !passwordVerified) return false;
  if (content.visibility === 'public') return true;
  if (content.visibility === 'community') return Boolean(userKey);
  if (content.visibility === 'selected') return selectedPeople.some((key) => String(key) === String(userKey));
  if (content.visibility === 'group') return groupMember;
  return false;
}

async function groupMembership(supabase, groupKey, userKey) {
  if (!groupKey || !userKey) return false;
  const { data, error } = await supabase.from('group_members').select('id').eq('group_id', groupKey).eq('user_key', String(userKey)).maybeSingle();
  if (error) return false;
  return Boolean(data);
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
      const password = typeof body.password === 'string' ? body.password : '';
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
      if (title.length > 240 || contentBody.length > 50000) return json({ success: false, error: 'Content exceeds the allowed length.' }, 400);

      const passwordHash = password.length ? await sha256(password) : null;
      const { data: content, error } = await supabase.from('content_items').insert({
        type, title: title || null, body: contentBody, author_key: String(userKey), author_name: userName,
        visibility, password_hash: passwordHash, group_key: selectedGroup, published: false,
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
      return json({ success: true, data: { id: content.id, published: false, password_protected: Boolean(passwordHash) } }, 201);
    }

    if (action === 'publish_content') {
      const contentId = String(body.content_id || '').trim();
      if (!contentId) return json({ success: false, error: 'content_id is required.' }, 400);
      const { data, error } = await supabase.from('content_items').update({ published: true, updated_at: new Date().toISOString() }).eq('id', contentId).eq('author_key', String(userKey)).select().single();
      if (error) return json({ success: false, error: error.message }, 400);
      if (!data) return json({ success: false, error: 'Content was not found or is not yours.' }, 404);
      return json({ success: true, data: { id: data.id, published: true } });
    }

    if (action === 'list_groups') {
      const { data, error } = await supabase.from('groups').select('id,name').order('name', { ascending: true });
      if (error) return json({ success: false, error: error.message }, 400);
      return json({ success: true, data: data || [] });
    }

    if (action === 'verify_content_password') {
      const contentId = String(body.content_id || '').trim();
      const password = typeof body.password === 'string' ? body.password : '';
      if (!contentId || !password) return json({ success: false, error: 'content_id and password are required.' }, 400);
      const { data: content, error } = await supabase.from('content_items').select('id,password_hash,published').eq('id', contentId).eq('published', true).maybeSingle();
      if (error) return json({ success: false, error: error.message }, 400);
      if (!content) return json({ success: false, error: 'Content was not found.' }, 404);
      if (!content.password_hash) return json({ success: false, error: 'This content is not password protected.' }, 400);
      const candidate = await sha256(password);
      if (candidate !== content.password_hash) return json({ success: false, error: 'Incorrect password.' }, 403);
      const token = randomToken();
      const tokenHash = await sha256(token);
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString();
      const { error: grantError } = await supabase.from('content_access_grants').upsert({ content_id: contentId, user_key: String(userKey), token_hash: tokenHash, expires_at: expiresAt }, { onConflict: 'content_id,user_key' });
      if (grantError) return json({ success: false, error: grantError.message }, 400);
      return json({ success: true, data: { access_token: token, expires_at: expiresAt } });
    }

    if (action === 'list_content') {
      const type = String(body.type || '').trim().toLowerCase();
      const accessToken = typeof body.access_token === 'string' ? body.access_token : '';
      const tokenHash = accessToken ? await sha256(accessToken) : '';
      const { data, error } = await supabase.from('content_items').select('id,type,title,body,author_key,author_name,visibility,group_key,published,created_at,updated_at,password_hash').eq('published', true).eq('type', type).order('created_at', { ascending: false });
      if (error) return json({ success: false, error: error.message }, 400);
      const ids = (data || []).map((row) => row.id);
      let people = [];
      if (ids.length) {
        const { data: acl, error: aclError } = await supabase.from('content_people').select('content_id,user_key').in('content_id', ids);
        if (aclError) return json({ success: false, error: aclError.message }, 400);
        people = acl || [];
      }
      const grantIds = new Set();
      if (tokenHash && ids.length) {
        const { data: grants } = await supabase.from('content_access_grants').select('content_id').in('content_id', ids).eq('user_key', String(userKey)).eq('token_hash', tokenHash).gt('expires_at', new Date().toISOString());
        (grants || []).forEach((grant) => grantIds.add(grant.content_id));
      }
      const visible = [];
      for (const row of data || []) {
        const keys = people.filter((item) => item.content_id === row.id).map((item) => item.user_key);
        const isPasswordVerified = !row.password_hash || grantIds.has(row.id);
        const member = row.visibility === 'group' ? await groupMembership(supabase, row.group_key, String(userKey)) : false;
        if (accessAllowed(row, String(userKey), keys, member, isPasswordVerified)) {
          const { password_hash: _hash, ...safeRow } = row;
          visible.push({ ...safeRow, password_protected: Boolean(row.password_hash) });
        }
      }
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
