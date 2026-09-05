import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { APP_CONFIG } from '@/config/app.config';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import ThemeToggle from '@/components/ThemeToggle';
import ApperIcon from '@/components/ApperIcon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/services/supabase';
import { useProfile } from '@/hooks/useProfile';
import { getProfileMeta } from '@/services/userPermissions';

export default function PublicLayout() {
  const user = useSelector((state) => state.user.user);
  const location = useLocation();
  const { profile } = useProfile();
  const home = user?.Id ? '/dashboard' : '/';
  const isFrontDoor = location.pathname === '/';
  const [latest, setLatest] = useState(null);
  const [loadingLatest, setLoadingLatest] = useState(true);

  useEffect(() => {
    if (!isFrontDoor) return undefined;
    let active = true;

    async function loadLatest() {
      setLoadingLatest(true);
      if (!supabase) {
        if (active) setLoadingLatest(false);
        return;
      }

      const [{ data: announcements }, { data: questions }] = await Promise.all([
        supabase.from('announcements').select('id,title,body,created_at').eq('published', true).order('created_at', { ascending: false }).limit(5),
        supabase.from('questions').select('id,title,body,category,created_at').eq('published', true).order('created_at', { ascending: false }).limit(5),
      ]);

      if (!active) return;
      const candidates = [
        ...(announcements ?? []).map((item) => ({ ...item, kind: 'Announcement' })),
        ...(questions ?? []).map((item) => ({ ...item, kind: 'Question' })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setLatest(candidates[0] ?? null);
      setLoadingLatest(false);
    }

    loadLatest();
    return () => { active = false; };
  }, [isFrontDoor]);

  const profileMeta = getProfileMeta(profile);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.emailAddress || 'Member';
  const initials = displayName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'M';

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border/80 bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link to={home} className="flex items-center gap-3 rounded-xl px-1 py-1 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ApperIcon name={APP_CONFIG.icon} size={18} />
            </div>
            <div>
              <div className="font-heading text-lg leading-none">C3H</div>
              <div className="hidden text-xs text-muted-foreground sm:block">Community space</div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/announcements" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground'}`}>Announcements</NavLink>
            <NavLink to="/participate" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground'}`}>Participate</NavLink>
            <NavLink to="/questions" className={({ isActive }) => `rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground'}`}>Questions</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user?.Id ? (
              <Link to="/profile" className="flex items-center gap-2 rounded-xl border border-border bg-card px-2.5 py-1.5 shadow-xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <Avatar className="size-7"><AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback></Avatar>
                <span className="hidden max-w-24 truncate text-sm font-semibold sm:block">{displayName}</span>
              </Link>
            ) : (
              <Link to="/login" className="rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold shadow-xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Sign in</Link>
            )}
          </div>
        </div>
      </header>
      <main>
        <ErrorBoundary>
          {isFrontDoor ? (
            <section className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <ApperIcon name={APP_CONFIG.icon} size={24} />
                </div>
                <h1 className="mt-6 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">C3H</h1>
                <p className="mt-3 text-base font-medium text-muted-foreground sm:text-lg">Let's be free, open and powerful.</p>
              </div>

              <div className="mt-12 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Latest</div>
                    <h2 className="mt-1 text-base font-heading font-semibold">One thing worth seeing</h2>
                  </div>
                  <Link to="/announcements" className="shrink-0 text-sm font-medium text-primary transition hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View all</Link>
                </div>

                <div className="mt-5">
                  {loadingLatest ? (
                    <div className="rounded-2xl bg-muted p-6 text-sm text-muted-foreground">Loading the latest update…</div>
                  ) : latest ? (
                    <Link to={latest.kind === 'Announcement' ? '/announcements' : '/questions'} className="block rounded-2xl border border-border bg-background p-5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{latest.kind}</Badge>
                        {latest.category && <Badge variant="outline">{latest.category}</Badge>}
                      </div>
                      <h3 className="mt-4 text-lg font-medium leading-relaxed sm:text-xl">{latest.title || latest.body}</h3>
                      {latest.body && latest.title && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{latest.body}</p>}
                      <div className="mt-4 flex items-center justify-between gap-4 text-xs text-muted-foreground">
                        <span>{latest.kind === 'Announcement' ? 'Community announcement' : 'Community question'}</span>
                        <span>Open →</span>
                      </div>
                    </Link>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">No published updates yet.</div>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Link to="/announcements" className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">
                  <ApperIcon name="Megaphone" size={19} />
                  <div className="mt-4 text-sm font-medium">Announcements</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">Read the full community update stream.</div>
                </Link>
                <Link to={user?.Id ? '/profile' : '/login'} className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">
                  <ApperIcon name="UserRound" size={19} />
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium">{user?.Id ? displayName : 'Your profile'} {user?.Id && <Badge variant="outline">{profileMeta?.label ?? 'Member'}</Badge>}</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{user?.Id ? 'Your current community identity.' : 'Sign in to build your community identity.'}</div>
                </Link>
                <Link to="/participate" className="rounded-2xl border border-border bg-card p-5 shadow-xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] sm:col-span-2 lg:col-span-1">
                  <ApperIcon name="Network" size={19} />
                  <div className="mt-4 text-sm font-medium">Participate</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">Find a project, research team or initiative to contribute to.</div>
                </Link>
              </div>
            </section>
          ) : (
            <div className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8"><Outlet /></div>
          )}
        </ErrorBoundary>
      </main>
    </div>
  );
}
