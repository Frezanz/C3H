import { Link } from 'react-router-dom';
import { useProfile } from '@/hooks/useProfile';
import { getProfileMeta } from '@/services/userPermissions';
import ThemeToggle from '@/components/ThemeToggle';
import ApperIcon from '@/components/ApperIcon';

export default function UserMenu({ user, initials, displayName, logout }) {
  const { profile } = useProfile();
  const meta = getProfileMeta(profile);
  return (
    <div className="rounded-2xl border border-sidebar-border bg-card p-3 shadow-xs">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{initials}</div>
        <div className="min-w-0"><div className="truncate text-sm font-semibold">{displayName}</div><div className="truncate text-xs text-muted-foreground">{user?.emailAddress ?? 'Member'} · {meta?.label ?? 'Member'}</div></div>
      </div>
      <div className="mt-3"><ThemeToggle className="w-full justify-between" /></div>
      <div className="mt-3 grid gap-1">
        <Link to="/principles" className="flex items-center gap-2 rounded-lg px-2 py-2 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ApperIcon name="BookOpen" size={15} /> Principles</Link>
        <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><ApperIcon name="LogOut" size={15} /> Sign out</button>
      </div>
    </div>
  );
}
