import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Icon from '@/components/Icon';
import CommentComposer from '@/components/CommentComposer';
import { useFunction } from '@/hooks/useFunction';

export const route = { path: '/questions', layout: 'public', access: 'public' };
export const nav = { icon: 'CircleHelp', label: 'Questions', section: 'Explore', profiles: null, order: 10 };

export default function Questions() {
  const user = useSelector((state) => state.user.user);
  const { invoke, loading } = useFunction('supabase-community-api', { showError: false });
  const { invoke: sendPrivateResponse } = useFunction('creator-response', { showError: false });
  const { invoke: contentInvoke } = useFunction('content-api', { showError: false });
  const [questions, setQuestions] = useState([]);
  const [comments, setComments] = useState({});
  const [answers, setAnswers] = useState({});
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [search, setSearch] = useState('');
  const [error, setError] = useState('');

  const loadQuestions = async () => {
    setError('');
    const result = await invoke({ action: 'list_questions' });
    if (result?.success && Array.isArray(result.data)) setQuestions(result.data);
    else setError(result?.error || 'Unable to load questions.');
  };
  useEffect(() => { loadQuestions(); }, []);
  const filtered = useMemo(() => { const term = search.trim().toLowerCase(); if (!term) return questions; return questions.filter((q) => `${q.title} ${q.body} ${q.category}`.toLowerCase().includes(term)); }, [questions, search]);
  const grouped = useMemo(() => filtered.reduce((acc, q) => { const key = q.category || 'Community'; (acc[key] ||= []).push(q); return acc; }, {}), [filtered]);

  const loadComments = async (questionId) => { const result = await invoke({ action: 'list_comments', question_id: questionId }); if (result?.success) setComments((current) => ({ ...current, [questionId]: result.data || [] })); };
  const loadAnswers = async (questionId) => { const result = await contentInvoke({ action: 'list_answers', question_id: questionId }); if (result?.success) setAnswers((current) => ({ ...current, [questionId]: Array.isArray(result.data) ? result.data : [] })); };
  const openDiscussion = async (questionId) => { await Promise.all([loadComments(questionId), loadAnswers(questionId)]); };
  const addAnswer = async (questionId) => {
    const body = String(answerDrafts[questionId] || '').trim();
    if (!body || !user?.Id) return;
    const result = await contentInvoke({ action: 'create_answer', question_id: questionId, body });
    if (result?.success) { setAnswerDrafts((current) => ({ ...current, [questionId]: '' })); await loadAnswers(questionId); }
  };
  const acceptAnswer = async (questionId, answerId) => { const result = await contentInvoke({ action: 'accept_answer', answer_id: answerId }); if (result?.success) await loadAnswers(questionId); };
  const deleteAnswer = async (questionId, answerId) => { if (!window.confirm('Delete this answer?')) return; const result = await contentInvoke({ action: 'delete_answer', answer_id: answerId }); if (result?.success) await loadAnswers(questionId); };
  const addPublicComment = async (questionId, body) => { if (!user?.Id) return { success: false, error: 'Sign in to comment.' }; const result = await invoke({ action: 'create_comment', question_id: questionId, body }); if (result?.success) await loadComments(questionId); return result; };
  const sendPrivate = async (questionId, body) => { if (!user?.Id) return { success: false, error: 'Sign in to respond privately.' }; return await sendPrivateResponse({ content_type: 'question', content_id: questionId, body }); };
  const editComment = async (questionId, comment) => { const body = window.prompt('Edit your comment', comment.body); if (body == null || !body.trim()) return; const result = await invoke({ action: 'update_comment', comment_id: comment.id, body: body.trim() }); if (result?.success) await loadComments(questionId); };
  const deleteComment = async (questionId, commentId) => { if (!window.confirm('Delete this comment?')) return; const result = await invoke({ action: 'delete_comment', comment_id: commentId }); if (result?.success) await loadComments(questionId); };

  return <div className="py-8 sm:py-10">
    <div className="max-w-4xl"><div className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Question bank</div><h1 className="mt-2 font-heading text-5xl leading-none sm:text-6xl">Questions worth answering before the crisis.</h1><p className="mt-5 text-lg leading-8 text-muted-foreground">Real questions, stored in the community database. Search them, open the discussion, and add your perspective.</p><div className="relative mt-6"><Icon name="Search" size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search questions..." className="w-full rounded-2xl border border-border bg-card py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-ring" /></div></div>
    {error && <div className="mt-8 rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm">{error} Make sure the Supabase schema has been run.</div>}
    {loading && !questions.length && <div className="mt-10 text-sm text-muted-foreground">Loading questions…</div>}
    <div className="mt-10 space-y-6">{Object.entries(grouped).map(([category, items]) => <section key={category} className="rounded-3xl border border-border bg-card p-5 shadow-xs sm:p-7"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary"><Icon name="CircleHelp" size={19} /></div><h2 className="font-heading text-2xl">{category}</h2></div><div className="mt-5 space-y-4">{items.map((q, i) => <article key={q.id} className="rounded-2xl border border-border bg-background p-4 sm:p-5"><div className="flex items-start gap-3"><span className="font-semibold text-primary">{i + 1}.</span><div className="min-w-0 flex-1"><div className="font-semibold leading-6">{q.title || q.body}</div><div className="mt-3 flex flex-wrap gap-2"><button type="button" onClick={() => openDiscussion(q.id)} className="inline-flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-xs font-semibold hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon name="MessageCircle" size={14} /> Discussion</button></div></div></div>
      {answers[q.id] && <div className="mt-4 border-t border-border pt-4"><div className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Answers · {answers[q.id].length}</div><div className="space-y-3">{answers[q.id].map((answer) => <div key={answer.id} className={`rounded-xl border p-3 ${answer.accepted ? 'border-primary/40 bg-muted' : 'border-border bg-card'}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><span className="text-xs font-semibold">{answer.author_name}</span>{answer.accepted && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">Accepted answer</span>}</div><div className="mt-2 whitespace-pre-wrap text-sm leading-6">{answer.body}</div></div>{user?.Id && answer.author_key === String(user.Id) && <button type="button" onClick={() => deleteAnswer(q.id, answer.id)} aria-label="Delete answer" className="shrink-0 rounded-lg p-1.5 text-muted-foreground hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Icon name="Trash2" size={14} /></button>}</div>{user?.Id && q.author_key && String(q.author_key) === String(user.Id) && !answer.accepted && <button type="button" onClick={() => acceptAnswer(q.id, answer.id)} className="mt-3 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Accept answer</button>}</div>)}</div>{user?.Id ? <div className="mt-4 flex gap-2"><textarea value={answerDrafts[q.id] || ''} onChange={(event) => setAnswerDrafts((current) => ({ ...current, [q.id]: event.target.value }))} rows={3} maxLength={10000} placeholder="Write an answer…" className="min-w-0 flex-1 resize-y rounded-xl border border-input bg-background px-3 py-2.5 text-sm leading-6 outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring" /><button type="button" disabled={!String(answerDrafts[q.id] || '').trim()} onClick={() => addAnswer(q.id)} className="self-end rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Answer</button></div> : <div className="mt-4 rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">Sign in to answer this question.</div>}</div>}
      {comments[q.id] && <div className="mt-4 border-t border-border pt-4"><div className="space-y-3">{comments[q.id].map((comment) => <div key={comment.id} className="rounded-xl bg-muted/70 p-3"><div className="flex items-center justify-between gap-3"><div className="text-xs font-semibold">{comment.author_name}</div>{comment.author_key === String(user?.Id) && <div className="flex gap-1"><button type="button" onClick={() => editComment(q.id, comment)} className="rounded-lg p-1.5 hover:bg-background" aria-label="Edit comment"><Icon name="Pencil" size={14} /></button><button type="button" onClick={() => deleteComment(q.id, comment.id)} className="rounded-lg p-1.5 hover:bg-background" aria-label="Delete comment"><Icon name="Trash2" size={14} /></button></div>}</div><div className="mt-1 text-sm leading-6">{comment.body}</div></div>)}</div><div className="mt-4">{user?.Id ? <CommentComposer onPublicSubmit={(body) => addPublicComment(q.id, body)} onPrivateSubmit={(body) => sendPrivate(q.id, body)} /> : <div className="rounded-xl border border-dashed border-border p-3 text-sm text-muted-foreground">Sign in to join the discussion or send a private response.</div>}</div></div>}
    </article>)}</div></section>)}</div>
    {!questions.length && !loading && !error && <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No questions have been published yet.</div>}
    {questions.length > 0 && filtered.length === 0 && <div className="mt-10 rounded-3xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">No questions match “{search}”.</div>}
    <div className="mt-8 rounded-3xl border border-border bg-background p-6 sm:p-8"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-heading text-2xl">The hardest question</div><p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">If violence begins tonight in a remote settlement, what can civilians realistically do in the first 1 hour, 6 hours, 24 hours and 7 days?</p></div><Link to="/preparedness" className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Turn questions into preparedness <Icon name="ArrowRight" size={16} /></Link></div></div>
  </div>;
}
