import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { APP_CONFIG } from '@/config/app.config';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import ThemeToggle from '@/components/ThemeToggle';
import ApperIcon from '@/components/ApperIcon';

export default function PublicLayout() {
  const user = useSelector((state) => state.user.user);
  const location = useLocation();
  const home = user?.Id ? '/dashboard' : '/';
  const isFrontDoor = location.pathname === '/';

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
            <NavLink to="/questions" className={({isActive}) => `rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground'}`}>Questions</NavLink>
            <NavLink to="/preparedness" className={({isActive}) => `rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground'}`}>Preparedness</NavLink>
            <NavLink to="/principles" className={({isActive}) => `rounded-lg px-3 py-2 text-sm font-medium transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : 'text-muted-foreground'}`}>Principles</NavLink>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to={user?.Id ? '/dashboard' : '/login'} className="hidden rounded-xl border border-border bg-card px-3 py-2 text-sm font-semibold shadow-xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex">{user?.Id ? 'Open workspace' : 'Sign in'}</Link>
          </div>
        </div>
      </header>
      <main>
        <ErrorBoundary>
          {isFrontDoor ? (
            <section className="flex min-h-[calc(100vh-4rem)] items-center justify-center py-16">
              <div className="w-full max-w-xl text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                  <ApperIcon name={APP_CONFIG.icon} size={24} />
                </div>
                <h1 className="mt-6 font-heading text-3xl font-semibold tracking-tight sm:text-4xl">C3H</h1>
                <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">A quiet entry point for the community space.</p>
                <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                  <Link to="/questions" className="rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-xs transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">Enter</Link>
                  {!user?.Id && <Link to="/login" className="rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold shadow-xs transition hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-[0.98]">Sign in</Link>}
                </div>
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
