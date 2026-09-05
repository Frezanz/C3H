import { useEffect, useState } from 'react';
import ApperIcon from '@/components/ApperIcon';
import { useFunction } from '@/hooks/useFunction';
import { formatRelativeTime } from '@/utils/date';
import { Button } from '@/components/ui/button';

export const route = { path: '/messages', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'Bell', label: 'Messages', section: 'Member', profiles: null, order: 2 };

export default function Messages() {
  const { invoke, loading } = useFunction(import.meta.env.VITE_SUPABASE_COMMUNITY_API, { showError: false });
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState('');

  async function loadMessages() {
    setError('');
    const result = await invoke({ action: 'list_messages' });
    if (result?.success) setMessages(result.data ?? []);
    else setError(result?.error || 'Unable to load messages.');
  }

  useEffect(() => { loadMessages(); }, []);

  async function markRead(id) {
    const result = await invoke({ action: 'mark_message_read', message_id: id });
    if (result?.success) setMessages((current) => current.map((message) => message.id === id ? { ...message, read_at: result.data?.read_at ?? new Date().toISOString() } : message));
  }

  return <div className="space-y-6 py-2">
    <div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Member inbox</div><h1 className="mt-2 text-3xl font-heading font-semibold tracking-tight">Messages</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Personalized updates and messages associated with your community account.</p></div>
    {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
    <section className="space-y-3">{loading && !messages.length ? <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading messages…</div> : messages.length ? messages.map((message) => <article key={message.id} className={`rounded-2xl border border-border bg-card p-5 shadow-xs ${message.read_at ? '' : 'border-primary/30'}`}><div className="flex items-start gap-4"><div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary"><ApperIcon name={message.read_at ? 'MailOpen' : 'Mail'} size={17} /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="text-sm font-medium">{message.title}</h2>{!message.read_at && <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs text-accent">New</span>}</div><p className="mt-2 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">{message.body}</p><div className="mt-3 text-xs text-muted-foreground">{formatRelativeTime(message.created_at)}</div></div>{!message.read_at && <Button variant="ghost" size="sm" onClick={() => markRead(message.id)}>Mark read</Button>}</div></article>) : <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center"><ApperIcon name="Inbox" size={24} className="mx-auto text-muted-foreground" /><div className="mt-3 text-sm font-medium">Your inbox is clear</div><p className="mt-1 text-sm text-muted-foreground">Personalized messages will appear here.</p></div>}</section>
  </div>;
}
