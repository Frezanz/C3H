import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { updatePassword } from '@/services/auth';
import Icon from '@/components/Icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AuthLayout from './AuthLayout';

export default function ResetPassword() {
  const [ready, setReady] = useState(false); const [password, setPassword] = useState(''); const [confirmPassword, setConfirmPassword] = useState(''); const [showPassword, setShowPassword] = useState(false); const [showConfirm, setShowConfirm] = useState(false); const [loading, setLoading] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState(null);
  useEffect(() => { let mounted = true; supabase?.auth.getSession().then(({ data }) => { if (mounted) setReady(Boolean(data.session)); }); const sub = supabase?.auth.onAuthStateChange((event, session) => { if (mounted && (event === 'PASSWORD_RECOVERY' || session)) setReady(true); }); return () => { mounted = false; sub?.data?.subscription?.unsubscribe?.(); }; }, []);
  const handleSubmit = async (e) => { e.preventDefault(); setError(null); if (password !== confirmPassword) { setError('Passwords do not match'); return; } setLoading(true); try { await updatePassword(password); setDone(true); } catch (err) { setError(err?.message || 'Password reset failed'); } finally { setLoading(false); } };
  if (!ready) return <AuthLayout title="Reset password" icon="KeyRound"><p className="text-sm text-center text-muted-foreground">This reset link is invalid or has expired. Request a new one.</p><Button asChild className="w-full mt-4"><Link to="/forgot-password">Request a new link</Link></Button></AuthLayout>;
  if (done) return <AuthLayout title="Password reset" icon="CheckCircle"><div className="rounded-xl border bg-muted/30 p-5 text-center space-y-4"><p className="text-sm">Your password has been reset successfully.</p><Button asChild className="w-full h-9"><Link to="/login">Sign in</Link></Button></div></AuthLayout>;
  return <AuthLayout title="Reset password" description="Enter your new password below." icon="KeyRound"><form onSubmit={handleSubmit} className="flex flex-col gap-3"><PasswordField id="password" label="New password" value={password} onChange={(e) => setPassword(e.target.value)} show={showPassword} toggle={() => setShowPassword((v) => !v)} /><PasswordField id="confirm" label="Confirm new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} show={showConfirm} toggle={() => setShowConfirm((v) => !v)} />{error && <p className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={loading} className="w-full h-9">{loading ? 'Resetting…' : 'Reset password'}</Button></form></AuthLayout>;
}
function PasswordField({ id, label, value, onChange, show, toggle }) { return <div className="space-y-1"><Label htmlFor={id}>{label}</Label><div className="relative"><Input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} required className="h-9 pr-10" /><button type="button" onClick={toggle} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground" tabIndex={-1} aria-label={show ? 'Hide password' : 'Show password'}><Icon name={show ? 'EyeOff' : 'Eye'} size={16} /></button></div></div>; }
