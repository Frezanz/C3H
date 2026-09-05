import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useSelector } from 'react-redux';
import ApperIcon from '@/components/ApperIcon';
import { useFunction } from '@/hooks/useFunction';
import { formatRelativeTime } from '@/utils/date';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export const route = { path: '/dashboard', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'LayoutDashboard', label: 'Dashboard', section: 'Member', profiles: null, order: 1 };

export default function Dashboard() {
  const user = useSelector((state) => state.user.user);
  const { invoke, loading } = useFunction(import.meta.env.VITE_SUPABASE_COMMUNITY_API, { showError: false });
  const [questions, setQuestions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setError('');
      const [questionResult, messageResult] = await Promise.all([
        invoke({ action: 'list_questions' }),
        invoke({ action: 'list_messages' }),
      ]);
      if (!active) return;
      if (questionResult?.success) setQuestions((questionResult.data ?? []).slice(0, 3));
      if (messageResult?.success) setMessages(messageResult.data ?? []);
      if (!questionResult?.success && !messageResult?.success) setError('Your member data could not be loaded yet.');
    }
    load();
    return () => { active = false; };
  }, []);

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.emailAddress || 'Member';
  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase() || 'M';
  const unread = messages.filter((message) => !message.read_at).length;

  return <div className="space-y-6 py-2">
    <section className="rounded-3xl bg-primary p-6 text-primary-foreground shadow-lg sm:p-8">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4"><Avatar size="lg"><AvatarFallback className="bg-primary-foreground text-primary">{initials}</AvatarFallback></Avatar><div><div className="text-xs font-medium uppercase tracking-wide opacity-75">Member workspace</div><h1 className="mt-1 text-2xl font-heading font-semibold tracking-tight sm:text-3xl">Welcome, {name}.</h1><p className="mt-2 text-sm leading-relaxed opacity-80">Stay informed, participate in discussions, and build useful community capability.</p></div></div>
        <Button asChild variant="secondary" className="shrink-0"><Link to="/questions"><ApperIcon name="CircleHelp" size={16} /> Explore questions</Link></Button>
      </div>
    </section>

    {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}

    <section className="grid gap-4 sm:grid-cols-3">
      <Link to="/questions" className="rounded-2xl border border-border bg-card p-4 shadow-xs transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Questions</div><div className="mt-2 text-3xl font-bold tabular-nums">{questions.length || '—'}</div><div className="mt-1 text-xs text-muted-foreground">Featured in your workspace</div></Link>
      <Link to="/messages" className="rounded-2xl border border-border bg-card p-4 shadow-xs transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Unread</div><div className="mt-2 text-3xl font-bold tabular-nums">{unread}</div><div className="mt-1 text-xs text-muted-foreground">Personalized messages</div></Link>
      <Link to="/profile" className="rounded-2xl border border-border bg-card p-4 shadow-xs transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]"><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Profile</div><div className="mt-2 text-base font-medium">{name}</div><div className="mt-1 text-xs text-muted-foreground">Manage your member preferences</div></Link>
    </section>

    <section className="rounded-2xl border border-border bg-card p-6 shadow-xs"><div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-heading font-semibold">Current questions</h2><p className="mt-1 text-sm text-muted-foreground">Start with something worth discussing.</p></div><Link to="/questions" className="text-sm font-medium text-primary hover:underline">View all</Link></div><div className="mt-5 space-y-3">{loading && !questions.length ? <div className="text-sm text-muted-foreground">Loading…</div> : questions.length ? questions.map((question) => <div key={question.id} className="rounded-xl border border-border bg-background p-4"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{question.category}</Badge></div><div className="mt-2 text-sm font-medium leading-relaxed">{question.title || question.body}</div></div>) : <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No published questions yet.</div>}</div></section>

    <section className="rounded-2xl border border-border bg-card p-6 shadow-xs"><div className="flex items-center justify-between gap-4"><div><h2 className="text-lg font-heading font-semibold">Your messages</h2><p className="mt-1 text-sm text-muted-foreground">Updates selected for your account.</p></div><Link to="/messages" className="text-sm font-medium text-primary hover:underline">Open inbox</Link></div><div className="mt-5 space-y-3">{messages.slice(0, 3).map((message) => <div key={message.id} className="rounded-xl border border-border bg-background p-4"><div className="flex items-start justify-between gap-4"><div className="min-w-0"><div className="text-sm font-medium">{message.title}</div><div className="mt-1 text-sm leading-relaxed text-muted-foreground line-clamp-2">{message.body}</div></div>{!message.read_at && <span className="mt-1 size-2 shrink-0 rounded-full bg-accent" title="Unread" />}</div><div className="mt-2 text-xs text-muted-foreground">{formatRelativeTime(message.created_at)}</div></div>)}{!messages.length && <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No personalized messages yet.</div>}</div></section>
  </div>;
}
