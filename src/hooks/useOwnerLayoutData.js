import { useMemo } from 'react';
import { useAuth } from '@/layouts/RootLayout';
import { APP_CONFIG, AUTH_PROFILES, GENERIC_AUTH } from '@/config/app.config';
import { useFetch } from '@/hooks/useFetch';
import { supabase } from '@/services/supabase';

// Auto-discover nav items and footer pages from page exports
const pageMods = import.meta.glob('/src/pages/**/*.jsx', { eager: true });

const discoveredNavItems = Object.entries(pageMods)
  .filter(([, mod]) => mod.nav)
  .map(([, mod]) => ({ ...mod.nav, to: mod.nav.to ?? mod.route?.path }))
  .sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

const navPaths = new Set(discoveredNavItems.map((n) => n.to));
const footerPages = Object.entries(pageMods)
  .filter(([, mod]) => mod.route && mod.route.layout === 'owner' && mod.route.access !== 'public' && !mod.route.path.includes(':') && !navPaths.has(mod.route.path))
  .map(([, mod]) => mod.route);

const countItems = discoveredNavItems.filter((item) => item.count?.table);

async function fetchCounts() {
  if (!supabase || !countItems.length) return {};
  const results = await Promise.all(countItems.map(async (item) => {
    let query = supabase.from(item.count.table).select('id', { count: 'exact', head: true });
    if (item.count.where && typeof item.count.where === 'object') query = query.match(item.count.where);
    const { count, error } = await query;
    return { count: error ? 0 : (count ?? 0) };
  }));
  const counts = {};
  countItems.forEach((item, i) => { counts[item.to] = results[i]?.count ?? 0; });
  return counts;
}

// The single data source for OwnerLayout: auth, nav discovery, profile filtering,
// section grouping, footer pages, nav count badges, and the post-login home route.
export function useOwnerLayoutData() {
  const { logout, user } = useAuth();

  // "Home" for a signed-in user is their profile's post-login route, matching AuthPage.
  const homeRoute = useMemo(() => {
    const matched = AUTH_PROFILES?.find((p) => p.name === user?.profile);
    return matched?.redirectAfterAuth ?? GENERIC_AUTH?.redirectAfterAuth ?? '/';
  }, [user?.profile]);

  const navItems = useMemo(
    () => discoveredNavItems.filter((item) => !item.profiles || item.profiles.includes(user?.profile)),
    [user?.profile]
  );

  const navGroups = useMemo(() => {
    const groups = [];
    const byLabel = new Map();
    for (const item of navItems) {
      const groupLabel = item.section ?? null;
      let group = groupLabel != null ? byLabel.get(groupLabel) : null;
      if (!group) {
        group = { label: groupLabel, items: [] };
        groups.push(group);
        if (groupLabel != null) byLabel.set(groupLabel, group);
      }
      group.items.push(item);
    }
    return groups;
  }, [navItems]);

  const initials = `${user?.firstName?.[0] ?? ''}${user?.lastName?.[0] ?? ''}`.toUpperCase()
    || APP_CONFIG.name.slice(0, 2).toUpperCase();
  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.emailAddress;

  const { data: counts, run: refreshCounts } = useFetch(fetchCounts, []);

  return { user, logout, homeRoute, navItems, navGroups, footerPages, initials, displayName, counts: counts ?? {}, refreshCounts };
}
