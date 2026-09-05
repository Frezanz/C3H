import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { APP_CONFIG } from '@/config/app.config';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import ApperIcon from '@/components/ApperIcon';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/useProfile';
import { getProfileMeta } from '@/services/userPermissions';
import { supabase } from '@/services/supabase';

const navigation = [
  { to: '/questions', label: 'Questions', description: 'Ask, explore and discuss', icon: 'CircleHelp' },
  { to: '/preparedness', label: 'Preparedness', description: 'Build practical capability', icon: 'ShieldCheck' },
  { to: '/announcements', label: 'Announcements', description: 'Community updates', icon: 'Megaphone' },
  { to: '/participate', label: 'Participate', description: 'Contribute to initiatives', icon: 'Network' },
  { to: '/principles', label: 'Principles', description: 'How C3H approaches things', icon: 'BookOpen' },
];

const createOptions = [
  { key: 'post', label: 'Post', description: 'Share plain text, ideas, questions or updates.', icon: 'PenLine' },
  { key: 'group', label: 'Group', description: 'Start a community group', icon: 'Users' },
  { key: 'project', label: 'Project', description: 'Create something people can work on', icon: 'FolderKanban' },
  { key: 'research', label: 'Research', description: 'Paper, study, dataset or finding', icon: 'BookOpen' },
  { key: 'announcement', label: 'Announcement', description: 'Share an important update', icon: 'Megaphone' },
  { key: 'report', label: 'Report', description: 'Document an issue or finding', icon: 'FileBarChart' },
];

export default function PublicLayout() {
  const user = useSelector((state) => state.user.user);
  const location = useLocation();
  const { profile } = useProfile();
  const home = user?.Id ? '/dashboard' : '/';
  const isFrontDoor = location.pathname === '/';
  const [menuOpen, setMenuOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [latestUpdate, setLatestUpdate] = useState(null);
  const [updateDismissed, setUpdateDismissed] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
    setCreateOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  useEffect(() => {
    if (!isFrontDoor || !supabase) return;
    let cancelled = false;
    const loadLatest = async () => {
      const { data } = await supabase
        .from('announcements')
        .select('id,title,body,created_at')
        .eq('published', true)
        .order('created_at', { ascending: false })
        .limit(1);
      if (!cancelled && data?.[0]) setLatestUpdate(data[0]);
    };
    loadLatest();
    return () => { cancelled = true; };
  }, [isFrontDoor]);

  const profileMeta = getProfileMeta(profile);
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.emailAddress || 'Member';
  const initials = displayName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'M';

  const navClass = ({ isActive }) => `group flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition duration-(--transition-fast) hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98] ${isActive ? 'bg-muted text-foreground shadow-xs' : 'text-foreground'}`;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-border/70 bg-background/85 backdrop-blur-xl">
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

          <div className="flex items-center gap-2">
            {!isFrontDoor && <ThemeToggle />}
            {user?.Id && <Link to="/profile" className="hidden items-center rounded-full border border-border bg-card p-1 shadow-xs transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:flex"><Avatar className="size-8"><AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback></Avatar></Link>}
            {!user?.Id && <Link to="/login" className="hidden rounded-xl px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex">Sign in</Link>}
            <button type="button" aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-xs transition duration-(--transition-fast) hover:bg-accent hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.94]"><ApperIcon name={menuOpen ? 'X' : 'Menu'} size={19} /></button>
          </div>
        </div>
      </header>

      {menuOpen && (
        <>
          <button type="button" aria-label="Close menu overlay" onClick={() => setMenuOpen(false)} className="fixed inset-0 z-[calc(var(--z-sticky)+1)] cursor-default bg-background/60 backdrop-blur-[2px]" />
          <aside className="fixed right-0 top-0 z-[calc(var(--z-sticky)+2)] flex h-dvh w-[min(50vw,380px)] min-w-[280px] max-w-[50vw] flex-col border-l border-border bg-background shadow-2xl" aria-label="C3H menu">
            <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/70 px-4 sm:px-5">
              <div><div className="font-heading text-base font-semibold">C3H</div><div className="text-xs text-muted-foreground">Menu</div></div>
              <button type="button" aria-label="Close menu" onClick={() => setMenuOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.94]"><ApperIcon name="X" size={17} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-4">
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Explore</div>
              <nav className="space-y-1" aria-label="C3H navigation">
                {navigation.map((item) => <NavLink key={item.to} to={item.to} className={navClass}><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary transition group-hover:bg-background"><ApperIcon name={item.icon} size={17} /></span><span className="min-w-0 flex-1"><span className="block">{item.label}</span><span className="mt-0.5 block text-xs font-normal text-muted-foreground">{item.description}</span></span><ApperIcon name="ChevronRight" size={15} className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></NavLink>)}
              </nav>
              <div className="my-5 border-t border-border" />
              <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Account</div>
              {user?.Id ? <nav className="space-y-1" aria-label="Account navigation">
                <NavLink to="/dashboard" className={navClass}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary"><ApperIcon name="LayoutDashboard" size={17} /></span><span className="flex-1">Dashboard</span><ApperIcon name="ChevronRight" size={15} className="text-muted-foreground" /></NavLink>
                <NavLink to="/messages" className={navClass}><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted text-primary"><ApperIcon name="Bell" size={17} /></span><span className="flex-1">Messages</span><ApperIcon name="ChevronRight" size={15} className="text-muted-foreground" /></NavLink>
                <NavLink to="/profile" className={navClass}><Avatar className="size-9"><AvatarFallback className="bg-primary text-xs text-primary-foreground">{initials}</AvatarFallback></Avatar><span className="min-w-0 flex-1"><span className="block truncate">{displayName}</span><span className="block text-xs font-normal text-muted-foreground">{profileMeta?.label ?? 'Member'}</span></span><ApperIcon name="ChevronRight" size={15} className="text-muted-foreground" /></NavLink>
              </nav> : <Link to="/login" className="flex items-center gap-3 rounded-2xl bg-primary px-3 py-3 text-sm font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.99]"><span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary-foreground/10"><ApperIcon name="LogIn" size={17} /></span><span className="flex-1">Sign in</span><ApperIcon name="ArrowUpRight" size={16} /></Link>}
            </div>
          </aside>
        </>
      )}

      <main>
        <ErrorBoundary>
          {isFrontDoor ? (
            <section className="relative flex min-h-[calc(100vh-4rem)] items-center justify-center overflow-hidden px-5 py-16 sm:px-8">
              <div className="w-full max-w-3xl text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.35rem] bg-primary text-primary-foreground shadow-xl ring-1 ring-primary-foreground/10"><ApperIcon name={APP_CONFIG.icon} size={27} /></div>
                <h1 className="mt-7 font-heading text-5xl font-semibold tracking-[-0.04em] sm:text-6xl lg:text-7xl">C3H</h1>
                <p className="mx-auto mt-4 max-w-xl text-base font-medium leading-relaxed text-muted-foreground sm:text-lg">Let's be free, open and powerful.</p>
                <p className="mx-auto mt-10 max-w-lg text-sm leading-7 text-muted-foreground/80">A space for questions, preparedness, participation and collective capability.</p>
                <button type="button" onClick={() => setMenuOpen(true)} className="mt-9 inline-flex items-center gap-2 rounded-full border border-border bg-card px-5 py-2.5 text-sm font-semibold shadow-xs transition hover:-translate-y-0.5 hover:bg-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:translate-y-0">Explore C3H <ApperIcon name="ArrowRight" size={16} /></button>
              </div>

              {latestUpdate && !updateDismissed && (
                <div className="absolute inset-x-4 bottom-5 z-10 mx-auto w-[min(92vw,620px)] sm:bottom-7">
                  <article className="relative max-h-[42vh] overflow-hidden rounded-[1.5rem] border border-border bg-card/95 p-5 text-left shadow-2xl backdrop-blur-xl sm:p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0"><div className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Latest update</div><h2 className="mt-1 font-heading text-xl font-semibold leading-tight sm:text-2xl">{latestUpdate.title}</h2></div>
                      <button type="button" aria-label="Dismiss update" onClick={() => setUpdateDismissed(true)} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ApperIcon name="X" size={17} /></button>
                    </div>
                    <div className="mt-3 max-h-[24vh] overflow-y-auto pr-1 text-sm leading-6 text-muted-foreground">{latestUpdate.body}</div>
                    <div className="mt-4 flex items-center justify-between gap-3 border-t border-border/70 pt-3"><span className="text-xs text-muted-foreground">Community update</span><button type="button" onClick={() => setUpdateDismissed(true)} className="rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">OK</button></div>
                  </article>
                </div>
              )}

              {(!latestUpdate || updateDismissed) && (
                <div className="absolute bottom-6 right-5 z-20 sm:bottom-8 sm:right-8">
                  <div className="relative">
                    {createOpen && <div className="absolute bottom-14 right-0 mb-2 w-[min(86vw,320px)] overflow-hidden rounded-2xl border border-border bg-card p-2 text-left shadow-2xl backdrop-blur-xl">
                      <div className="px-3 py-2"><div className="text-sm font-semibold">Create</div><div className="text-xs text-muted-foreground">Add something to C3H</div></div>
                      {createOptions.map((option) => <Link key={option.key} to={`/create?type=${option.key}`} onClick={() => setCreateOpen(false)} className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary group-hover:bg-background"><ApperIcon name={option.icon} size={16} /></span><span className="min-w-0 flex-1"><span className="block text-sm font-medium">{option.label}</span><span className="block text-xs text-muted-foreground">{option.description}</span></span><ApperIcon name="ChevronRight" size={14} className="text-muted-foreground" /></Link>)}
                    </div>}
                    <button type="button" aria-label={createOpen ? 'Close create menu' : 'Create'} aria-expanded={createOpen} onClick={() => setCreateOpen((value) => !value)} className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition hover:scale-105 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"><ApperIcon name={createOpen ? 'X' : 'Plus'} size={21} /></button>
                  </div>
                </div>
              )}
            </section>
          ) : <div className="mx-auto max-w-[1440px] px-4 pb-16 sm:px-6 lg:px-8"><Outlet /></div>}
        </ErrorBoundary>
      </main>
    </div>
  );
}
