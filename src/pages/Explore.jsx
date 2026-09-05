import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ApperIcon from '@/components/ApperIcon';
import { useFunction } from '@/hooks/useFunction';

export const route = { path: '/explore', layout: 'public', access: 'public' };

const branches = [
  {
    label: 'Knowledge', icon: 'BookOpen', children: [
      { label: 'Questions', to: '/questions', icon: 'CircleHelp' },
      { label: 'Preparedness', to: '/preparedness', icon: 'ShieldCheck' },
      { label: 'Research', icon: 'Search', planned: true },
    ],
  },
  {
    label: 'Community', icon: 'Users', children: [
      { label: 'Participate', to: '/participate', icon: 'Network' },
      { label: 'Announcements', to: '/announcements', icon: 'Megaphone' },
      { label: 'Groups', icon: 'Users', planned: true },
      { label: 'Members', icon: 'UserRound', planned: true },
    ],
  },
  {
    label: 'Action', icon: 'Workflow', children: [
      { label: 'Projects', icon: 'FolderKanban', planned: true },
      { label: 'Reports', icon: 'FileBarChart', planned: true },
    ],
  },
];

const typeMeta = {
  question: { label: 'Question', icon: 'CircleHelp', to: '/questions' },
  post: { label: 'Post', icon: 'PenLine' },
  announcement: { label: 'Announcement', icon: 'Megaphone', to: '/announcements' },
  group: { label: 'Group', icon: 'Users' },
  project: { label: 'Project', icon: 'FolderKanban' },
  research: { label: 'Research', icon: 'BookOpen' },
  report: { label: 'Report', icon: 'FileBarChart' },
};

function formatDate(value) {
  if (!value) return '';
  try { return new Intl.DateTimeFormat(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(value)); } catch (_) { return ''; }
}

export default function Explore() {
  const [mapOpen, setMapOpen] = useState(false);
  const [feed, setFeed] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState('');
  const { invoke } = useFunction(import.meta.env.VITE_PUBLIC_FEED, {});

  useEffect(() => {
    let cancelled = false;
    async function loadFeed() {
      setFeedLoading(true);
      setFeedError('');
      try {
        const result = await invoke({});
        const rows = result?.data || result || [];
        if (!cancelled) setFeed(Array.isArray(rows) ? rows : []);
      } catch (error) {
        if (!cancelled) setFeedError(error?.message || 'The public feed could not be loaded.');
      } finally {
        if (!cancelled) setFeedLoading(false);
      }
    }
    loadFeed();
    return () => { cancelled = true; };
  }, [invoke]);

  return (
    <div className="mx-auto max-w-5xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
      <header className="mx-auto max-w-3xl text-center">
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Explore C3H</div>
        <h1 className="mt-4 font-heading text-5xl leading-none tracking-tight sm:text-6xl">Understand. Discuss. Prepare. Act.</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
          Follow the paths of C3H, then discover what the community is asking, learning, building and sharing.
        </p>
      </header>

      <section className="mt-10 rounded-[1.75rem] border border-border bg-card/60 shadow-xs">
        <button type="button" onClick={() => setMapOpen((value) => !value)} aria-expanded={mapOpen} className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left sm:px-6">
          <span className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary"><ApperIcon name="GitBranch" size={17} /></span><span><span className="block text-sm font-semibold">C3H map</span><span className="block text-xs text-muted-foreground">See how the parts connect</span></span></span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border"><ApperIcon name={mapOpen ? 'ChevronUp' : 'ChevronDown'} size={16} /></span>
        </button>

        {mapOpen && (
          <div className="border-t border-border px-5 py-6 sm:px-8">
            <div className="mx-auto max-w-3xl">
              <div className="flex flex-col items-center">
                <div className="rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm">C3H</div>
                <div className="h-6 w-px bg-border" />
                <div className="grid w-full gap-5 md:grid-cols-3">
                  {branches.map((branch) => (
                    <div key={branch.label} className="relative rounded-2xl border border-border bg-background p-4">
                      <div className="absolute left-1/2 top-[-21px] h-5 w-px bg-border" />
                      <div className="flex items-center gap-2 font-semibold"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-primary"><ApperIcon name={branch.icon} size={16} /></span>{branch.label}</div>
                      <div className="ml-4 mt-3 border-l border-border pl-4">
                        {branch.children.map((child) => child.planned ? (
                          <div key={child.label} aria-disabled="true" className="flex cursor-default items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground/70">
                            <ApperIcon name={child.icon} size={15} />
                            <span className="flex-1">{child.label}</span>
                            <span className="rounded-full border border-border px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide">Coming later</span>
                          </div>
                        ) : (
                          <Link key={child.label} to={child.to} className="group flex items-center gap-2 rounded-xl px-2 py-2 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground">
                            <ApperIcon name={child.icon} size={15} className="text-primary" />
                            <span className="flex-1">{child.label}</span>
                            <ApperIcon name="ArrowUpRight" size={13} className="opacity-0 transition group-hover:opacity-100" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
                  <span>Question</span><span>→</span><span>Knowledge</span><span>→</span><span>People</span><span>→</span><span>Group</span><span>→</span><span>Project</span><span>→</span><span>Research</span><span>→</span><span>Action</span>
                </div>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-primary" />Available</span>
                  <span className="inline-flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />Coming later</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </section>

      <section className="mt-16">
        <div className="flex items-end justify-between gap-4 border-b border-border pb-4">
          <div><div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Public feed</div><h2 className="mt-2 font-heading text-4xl tracking-tight sm:text-5xl">What’s happening</h2></div>
          <div className="hidden text-xs text-muted-foreground sm:block">Public content only</div>
        </div>

        {feedLoading ? (
          <div className="grid gap-4 pt-5 md:grid-cols-2"><div className="h-44 animate-pulse rounded-2xl border border-border bg-muted/40" /><div className="h-44 animate-pulse rounded-2xl border border-border bg-muted/40" /></div>
        ) : feedError ? (
          <div className="mt-5 rounded-2xl border border-border bg-card p-6 text-sm text-muted-foreground">{feedError}</div>
        ) : feed.length === 0 ? (
          <div className="mt-5 rounded-2xl border border-dashed border-border p-10 text-center"><ApperIcon name="Inbox" size={25} className="mx-auto text-muted-foreground" /><p className="mt-3 font-medium">The public feed is quiet.</p><p className="mt-1 text-sm text-muted-foreground">Published public content will appear here.</p></div>
        ) : (
          <div className="grid gap-4 pt-5 md:grid-cols-2">
            {feed.map((item) => {
              const meta = typeMeta[item.type] || { label: item.type || 'Content', icon: 'FileText' };
              return (
                <article key={item.id} className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground"><span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-primary"><ApperIcon name={meta.icon} size={15} /></span>{meta.label}<span className="mx-1">·</span>{formatDate(item.created_at)}</div>
                  <h3 className="mt-4 font-heading text-2xl leading-tight">{item.title || meta.label}</h3>
                  <p className="mt-3 line-clamp-4 text-sm leading-6 text-muted-foreground">{item.body}</p>
                  <div className="mt-5 flex items-center justify-between gap-3 border-t border-border/70 pt-4 text-xs text-muted-foreground"><span>By {item.author_name || 'Member'}</span>{meta.to ? <Link to={meta.to} className="inline-flex items-center gap-1.5 font-semibold text-foreground hover:text-primary">Explore <ApperIcon name="ArrowUpRight" size={14} /></Link> : <span className="text-muted-foreground">Public</span>}</div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
