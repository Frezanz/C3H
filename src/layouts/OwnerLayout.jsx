import { NavLink, Link, Outlet } from 'react-router-dom';
import { useState } from 'react';
import { useOwnerLayoutData } from '@/hooks/useOwnerLayoutData';
import UserMenu from '@/components/UserMenu';
import ApperIcon from '@/components/ApperIcon';
import { ErrorBoundary } from '@/components/ui/error-boundary';
import { APP_CONFIG } from '@/config/app.config';

export default function OwnerLayout() {
  const { user, logout, homeRoute, navItems, navGroups, initials, displayName, counts } = useOwnerLayoutData();
  const [open, setOpen] = useState(false);
  const groupedNav = navGroups.length > 0 ? navGroups : [{ label: null, items: navItems }];
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex min-h-screen max-w-[1440px] flex-col lg:flex-row">
        <aside className="hidden w-60 shrink-0 border-r border-border bg-sidebar p-4 lg:flex lg:flex-col">
          <Link to={homeRoute} className="mb-6 flex items-center gap-3 rounded-xl px-2 py-2 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><ApperIcon name={APP_CONFIG.icon} size={18} /></div>
            <div className="font-heading text-lg">C3H</div>
          </Link>
          <nav className="space-y-5">
            {groupedNav.map((group, groupIdx) => <div key={group.label ?? `group-${groupIdx}`}>
              {group.label && <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">{group.label}</p>}
              <ul className="space-y-1">{group.items.map(item => <li key={item.to}><NavLink to={item.to} className={({isActive}) => `flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring ${isActive ? 'bg-sidebar-primary text-sidebar-primary-foreground' : 'text-sidebar-foreground'}`}><ApperIcon name={item.icon} size={17} /><span>{item.label}</span>{counts[item.to] != null && <span className="ml-auto rounded-full bg-sidebar-accent px-2 text-xs">{counts[item.to]}</span>}</NavLink></li>)}</ul>
            </div>)}
          </nav>
          <div className="mt-auto"><UserMenu user={user} initials={initials} displayName={displayName} logout={logout} /></div>
        </aside>
        <div className="flex min-h-screen min-w-0 flex-1 flex-col">
          <div className="sticky top-0 z-[var(--z-sticky)] flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur sm:px-6 lg:hidden">
            <Link to={homeRoute} className="font-heading text-lg">C3H</Link>
            <button type="button" aria-label="Toggle navigation" onClick={() => setOpen(v => !v)} className="rounded-xl border border-border bg-card p-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ApperIcon name={open ? 'X' : 'Menu'} size={18} /></button>
          </div>
          {open && <div className="border-b border-border bg-sidebar p-4 lg:hidden"><nav className="space-y-2">{navItems.map(item => <NavLink key={item.to} to={item.to} onClick={() => setOpen(false)} className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"><ApperIcon name={item.icon} size={17} />{item.label}</NavLink>)}</nav></div>}
          <main className="flex-1 p-4 sm:p-6 lg:p-8"><ErrorBoundary><Outlet /></ErrorBoundary></main>
        </div>
      </div>
    </div>
  );
}
