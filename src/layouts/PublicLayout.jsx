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

const navigation = [
  { to: '/announcements', label: 'Announcements', icon: 'Megaphone' },
  { to: '/participate', label: 'Participate', icon: 'Network' },
  { to: '/questions', label: 'Questions', icon: 'CircleHelp' },
  { to: '/preparedness', label: 'Preparedness', icon: 'ShieldCheck' },
  { to: '/principles', label: 'Principles', icon: 'BookOpen' },
];

export default function PublicLayout() {
  const user = useSelector((state) => state.user.user);
  const location = useLocation();
  const { profile } = useProfile();
  const home = user?.Id ? '/dashboard' : '/';
  const isFrontDoor = location.pathname === '/';
  const [latest, setLatest] = useState(null);
  const [loadingLatest, setLoadingLatest] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

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

  const navClass = ({ isActive }) => `flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition duration-(--transition-fast) hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${isActive ? 'bg-accent text-accent-foreground' : 'text-muted-foreground'}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border/70 bg-background/85 shadow-xs backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          <Link to={home} className="group flex min-w-0 items-center gap-3 rounded-2xl px-1.5 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md transition duration-(--transition-fast) group-hover:scale-[1.03]">
              <div className="absolute inset-0 rounded-xl ring-1 ring-inset ring-primary-foreground/15" />
              <ApperIcon name={APP_CONFIG.icon} size={18} />
            </div>
            <div className="min-w-0">
              <div className="font-heading text-lg font-semibold leading-none tracking-tight">C3H</div>
              <div className="mt-1 hidden text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground sm:block">Community space</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Primary navigation">
            {navigation.slice(0, 3).map((item) => <NavLink key={item.to} to={item.to} className={navClass}>{item.label}</NavLink>)}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {user?.Id ? (
              <Link to="/profile" className="hidden items-center gap-2 rounded-xl border border-border bg-card px-2 py-1.5 shadow-xs transition duration-(--transition-fast) hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] sm:flex">
                <Avatar className="size-7"><AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback></Avatar>
                <span className="max-w-28 truncate text-sm font-semibold">{displayName}</span>
              </Link>
            ) : (
              <Link to="/login" className="hidden rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold shadow-xs transition duration-(--transition-fast) hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] sm:inline-flex">Sign in</Link>
            )}
            <button type="button" aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-card shadow-xs transition duration-(--transition-fast) hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.96] md:hidden">
              <ApperIcon name={menuOpen ? 'X' : 'Menu'} size={19} />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-border/70 bg-background/95 px-4 pb-4 pt-3 shadow-lg backdrop-blur-xl md:hidden">
            <nav className="mx-auto max-w-[1440px] space-y-1" aria-label="Mobile navigation">
              <div className="mb-3 px-3 text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Explore C3H</div>
              {navigation.map((item) => <NavLink key={item.to} to={item.to} className={navClass}>
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-primary"><ApperIcon name={item.icon} size={16} /></span>
                <span className="flex-1">{item.label}</span>
                <ApperIcon name="ChevronRight" size={15} />
              </NavLink>)}
              <div className="my-3 border-t border-border" />
              {user?.Id ? (
                <NavLink to="/profile" className={navClass}>
                  <Avatar className="size-8"><AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback></Avatar>
                  <span className="min-w-0 flex-1 truncate">{displayName}</span>
                  <Badge variant="outline">{profileMeta?.label ?? 'Member'}</Badge>
                </NavLink>
              ) : (
                <Link to="/login" className="flex items-center gap-3 rounded-xl bg-primary px-3 py-2.5 text-sm font-semibold text-primary-foreground transition duration-(--transition-fast) hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-foreground/10"><ApperIcon name="LogIn" size={16} /></span>
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        )}
      </header>
      <main>
        <ErrorBoundary>
          {isFrontDoor ? (
            <section className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6 sm:py-16 lg:py-20">
              <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-1 ring-primary-foreground/10">
                  <ApperIcon name={APP_CONFIG.icon} size={24} />
                </div>
                <h1 className="mt-6 font-heading text-4xl font-semibold tracking-tight sm:text-5xl">C3H</h1>
                <p className="mt-3 text-base font-medium text-muted-foreground sm:text-lg">Let's be free, open and powerful.</p>
              </div>

              <div className="mt-12 rounded-3xl border border-border bg-card p-5 shadow-lg sm:p-7">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Latest</div>
                    <h2 className="mt-1 text-base font-heading font-semibold">One thing worth seeing</h2>
                  </div>
                  <Link to="/announcements" className="shrink-0 text-sm font-medium text-primary transition duration-(--transition-fast) hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View all</Link>
                </div>

                <div className="mt-5">
                  {loadingLatest ? (
                    <div className="rounded-2xl bg-muted p-6 text-sm text-muted-foreground">Loading the latest update…</div>
                  ) : latest ? (
                    <Link to={latest.kind === 'Announcement' ? '/announcements' : '/questions'} className="group block rounded-2xl border border-border bg-background p-5 transition duration-(--transition-fast) hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{latest.kind}</Badge>
                        {latest.category && <Badge variant="outline">{latest.category}</Badge>}
                      </div>
                      <h3 className="mt-4 text-lg font-medium leading-relaxed sm:text-xl">{latest.title || latest.body}</h3>
                      {latest.body && latest.title && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{latest.body}</p>}
                      <div className="mt-4 flex items-center justify-between gap-4 text-xs text-muted-foreground">
                        <span>{latest.kind === 'Announcement' ? 'Community announcement' : 'Community question'}</span>
                        <span className="font-medium transition-transform duration-(--transition-fast) group-hover:translate-x-0.5">Open →</span>
                      </div>
                    </Link>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-border p-6 text-sm text-muted-foreground">No published updates yet.</div>
                  )}
                </div>
              </div>

              <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {[
                  { to: '/announcements', icon: 'Megaphone', title: 'Announcements', text: 'Read the full community update stream.' },
                  { to: user?.Id ? '/profile' : '/login', icon: 'UserRound', title: user?.Id ? displayName : 'Your profile', text: user?.Id ? 'Your current community identity.' : 'Sign in to build your community identity.' },
                  { to: '/participate', icon: 'Network', title: 'Participate', text: 'Find a project, research team or initiative to contribute to.' },
                ].map((item, index) => <Link key={item.to} to={item.to} className={`group rounded-2xl border border-border bg-card p-5 shadow-xs transition duration-(--transition-fast) hover:-translate-y-0.5 hover:bg-accent hover:text-accent-foreground hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}`}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-primary transition duration-(--transition-fast) group-hover:bg-accent group-hover:text-accent-foreground"><ApperIcon name={item.icon} size={19} /></div>
                  <div className="mt-4 flex flex-wrap items-center gap-2 text-sm font-medium">{item.title} {item.to === '/profile' && user?.Id && <Badge variant="outline">{profileMeta?.label ?? 'Member'}</Badge>}</div>
                  <div className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.text}</div>
                  <div className="mt-4 text-xs font-medium text-primary">Explore →</div>
                </Link>)}
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
