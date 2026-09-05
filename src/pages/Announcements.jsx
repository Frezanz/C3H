import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '@/components/Icon';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/services/supabase';
import { formatRelativeTime } from '@/utils/date';

export const route = { path: '/announcements', layout: 'public', access: 'public' };
export const nav = { icon: 'Megaphone', label: 'Announcements', section: 'Community', profiles: null, order: 1 };

export default function Announcements() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      if (!supabase) {
        if (active) {
          setError('Community data is not configured yet.');
          setLoading(false);
        }
        return;
      }
      const { data, error: queryError } = await supabase.from('announcements').select('id,title,body,created_at').eq('published', true).order('created_at', { ascending: false });
      if (!active) return;
      if (queryError) setError(queryError.message);
      else setItems(data ?? []);
      setLoading(false);
    }
    load();
    return () => { active = false; };
  }, []);

  return (
    <div className="space-y-6 py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Community</div>
          <h1 className="mt-2 text-3xl font-heading font-semibold tracking-tight sm:text-4xl">Announcements</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">The complete stream of published community updates.</p>
        </div>
        <Link to="/" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"><Icon name="ArrowLeft" size={16} /> Home</Link>
      </div>

      {error && <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">{error}</div>}
      {loading ? <div className="rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">Loading announcements…</div> : !items.length ? <div className="rounded-2xl border border-dashed border-border p-8 text-sm text-muted-foreground">No published announcements yet.</div> : (
        <div className="space-y-4">
          {items.map((item) => (
            <article key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-xs sm:p-6">
              <div className="flex flex-wrap items-center gap-2"><Badge variant="outline">Announcement</Badge><span className="text-xs text-muted-foreground">{formatRelativeTime(item.created_at)}</span></div>
              <h2 className="mt-3 text-lg font-medium leading-relaxed">{item.title}</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{item.body}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
