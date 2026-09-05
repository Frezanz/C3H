import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import Icon from '@/components/Icon';
import { useFunction } from '@/hooks/useFunction';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';

export const route = { path: '/profile', layout: 'owner', access: 'authenticated' };
export const nav = { icon: 'UserRound', label: 'Profile', section: 'Member', profiles: null, order: 3 };

export default function Profile() {
  const user = useSelector((state) => state.user.user);
  const { invoke, loading } = useFunction(import.meta.env.VITE_SUPABASE_COMMUNITY_API, { showError: false });
  const [displayName, setDisplayName] = useState('');
  const [notifications, setNotifications] = useState(true);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      const result = await invoke({ action: 'get_profile' });
      if (!active) return;
      if (result?.success) {
        setDisplayName(result.data?.display_name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.emailAddress || 'Member');
        setNotifications(result.data?.preferences?.notifications !== false);
      } else {
        setDisplayName([user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.emailAddress || 'Member');
      }
    }
    load();
    return () => { active = false; };
  }, []);

  async function saveProfile() {
    setSaved(false);
    setError('');
    const result = await invoke({ action: 'upsert_profile', display_name: displayName.trim(), preferences: { notifications } });
    if (result?.success) setSaved(true);
    else setError(result?.error || 'Unable to save your profile.');
  }

  const initials = displayName.split(/\s+/).filter(Boolean).map((part) => part[0]).join('').slice(0, 2).toUpperCase() || 'M';

  return <div className="space-y-6 py-2">
    <div><div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Account</div><h1 className="mt-2 text-3xl font-heading font-semibold tracking-tight">Your profile</h1><p className="mt-2 text-sm leading-relaxed text-muted-foreground">Control how your community workspace identifies and updates you.</p></div>
    <section className="grid gap-4 lg:grid-cols-[.8fr_1.2fr]">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs"><div className="flex flex-col items-center text-center"><Avatar size="lg" className="size-20"><AvatarFallback className="bg-primary text-xl text-primary-foreground">{initials}</AvatarFallback></Avatar><div className="mt-4 text-base font-medium">{displayName || 'Member'}</div><div className="mt-1 text-sm text-muted-foreground break-all">{user?.emailAddress}</div><Badge className="mt-3" variant="outline">Community member</Badge></div></div>
      <div className="rounded-2xl border border-border bg-card p-6 shadow-xs"><div className="space-y-5"><div><Label htmlFor="display-name">Display name</Label><Input id="display-name" className="mt-2" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} /></div><div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-background p-4"><div className="min-w-0"><div className="text-sm font-medium">Personalized notifications</div><p className="mt-1 text-sm leading-relaxed text-muted-foreground">Allow your account to receive personalized community messages.</p></div><Switch checked={notifications} onCheckedChange={setNotifications} aria-label="Personalized notifications" /></div>{error && <p className="text-sm text-destructive">{error}</p>}{saved && <p className="text-sm text-success">Profile saved.</p>}<Button onClick={saveProfile} disabled={loading || !displayName.trim()}><Icon name="Save" size={16} /> {loading ? 'Saving…' : 'Save profile'}</Button></div></div>
    </section>
  </div>;
}
