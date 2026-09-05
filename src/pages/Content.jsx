import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Icon from '@/components/Icon';
import { useFunction } from '@/hooks/useFunction';

export const route = { path: '/content/:id', layout: 'public', access: 'public' };

const accessKey = (id) => `c3h:content-access:${id}`;

function getAnonymousKey() {
  try {
    const keyName = 'c3h:anonymous-key';
    let key = localStorage.getItem(keyName);
    if (!key) {
      key = globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      localStorage.setItem(keyName, key);
    }
    return key;
  } catch (_) {
    return '';
  }
}

function formatDate(value) {
  if (!value) return '';
  try { return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)); } catch (_) { return ''; }
}

export default function Content() {
  const { id } = useParams();
  const user = useSelector((state) => state.user.user);
  const { invoke } = useFunction('public-content', { showError: false });
  const [content, setContent] = useState(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);
  const [unlocking, setUnlocking] = useState(false);
  const [error, setError] = useState('');

  const anonymousKey = useMemo(() => getAnonymousKey(), []);

  const loadContent = async (token = '') => {
    if (!id) return;
    setLoading(true); setError('');
    try {
      let savedToken = token;
      if (!savedToken) {
        try {
          const saved = JSON.parse(localStorage.getItem(accessKey(id)) || 'null');
          if (saved?.token && saved?.expires_at && new Date(saved.expires_at) > new Date()) savedToken = saved.token;
          else localStorage.removeItem(accessKey(id));
        } catch (_) {}
      }
      const result = await invoke({ action: 'get_content', content_id: id, access_token: savedToken, anonymous_key: anonymousKey });
      if (!result?.success) throw new Error(result?.error || 'Unable to load content.');
      setContent(result.data);
    } catch (err) {
      setContent(null);
      setError(err?.message || 'Unable to load content.');
    } finally { setLoading(false); }
  };

  useEffect(() => { loadContent(); }, [id]);

  const unlock = async (event) => {
    event.preventDefault();
    if (!password || !id) return;
    setUnlocking(true); setError('');
    try {
      const result = await invoke({ action: 'verify_password', content_id: id, password, anonymous_key: anonymousKey });
      if (!result?.success || !result.data?.access_token) throw new Error(result?.error || 'Could not unlock this content.');
      localStorage.setItem(accessKey(id), JSON.stringify({ token: result.data.access_token, expires_at: result.data.expires_at }));
      setPassword('');
      await loadContent(result.data.access_token);
    } catch (err) {
      setError(err?.message || 'Incorrect password.');
    } finally { setUnlocking(false); }
  };

  if (loading) return <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8"><div className="h-8 w-2/3 animate-pulse rounded-lg bg-muted" /><div className="mt-5 h-32 animate-pulse rounded-2xl border border-border bg-muted/40" /></div>;

  if (error && !content) return <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8"><Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><Icon name="ArrowLeft" size={16} /> Back</Link><section className="mt-8 rounded-2xl border border-border bg-card p-6"><h1 className="font-heading text-2xl font-semibold">Content unavailable</h1><p className="mt-2 text-sm text-muted-foreground">{error}</p></section></div>;

  const locked = content?.password_protected && !content?.unlocked;

  return <div className="mx-auto max-w-3xl px-5 pb-20 pt-8 sm:px-8 sm:pt-12">
    <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"><Icon name="ArrowLeft" size={16} /> Back to C3H</Link>
    <article className="mt-8 rounded-[1.75rem] border border-border bg-card p-6 shadow-xs sm:p-8">
      <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span className="rounded-full bg-muted px-2.5 py-1">{content?.type || 'Content'}</span><span>·</span><span>{formatDate(content?.created_at)}</span></div>
      <h1 className="mt-4 font-heading text-4xl leading-tight tracking-tight sm:text-5xl">{content?.title || 'Untitled content'}</h1>
      <p className="mt-3 text-sm text-muted-foreground">By {content?.author_name || 'Member'}</p>
      {locked ? <section className="mt-8 rounded-2xl border border-primary/20 bg-primary/5 p-6">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-background text-primary"><Icon name="LockKeyhole" size={20} /></div>
        <h2 className="mt-4 font-heading text-2xl font-semibold">Password protected</h2>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">Enter the password to unlock the content. Your password is verified on the server and is never returned to the browser.</p>
        <form onSubmit={unlock} className="mt-5 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1"><input type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" placeholder="Enter password" className="w-full rounded-xl border border-input bg-background px-3 py-3 pr-20 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground">{showPassword ? 'Hide' : 'Show'}</button></div>
          <button type="submit" disabled={!password || unlocking} className="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:pointer-events-none disabled:opacity-50">{unlocking ? 'Unlocking…' : 'Unlock'}</button>
        </form>
        {error && <p role="alert" className="mt-3 text-sm font-medium text-destructive">{error}</p>}
      </section> : <div className="mt-8 whitespace-pre-wrap text-[15px] leading-7 text-foreground">{content?.body}</div>}
    </article>
    {user?.Id && locked && <p className="mt-4 text-center text-xs text-muted-foreground">You are signed in. Password protection still applies to this content.</p>}
  </div>;
}
