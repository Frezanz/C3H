import { useState } from 'react';
import { updatePassword } from '@/services/auth';
import Icon from '@/components/Icon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export const route = { path: '/change-password', layout: 'owner', access: 'authenticated' };

export default function ChangePassword() {
  const [password, setPassword] = useState(''); const [confirm, setConfirm] = useState(''); const [show, setShow] = useState(false); const [showConfirm, setShowConfirm] = useState(false); const [loading, setLoading] = useState(false); const [done, setDone] = useState(false); const [error, setError] = useState(null);
  const submit = async (e) => { e.preventDefault(); setError(null); if (password !== confirm) { setError('Passwords do not match'); return; } setLoading(true); try { await updatePassword(password); setDone(true); } catch (err) { setError(err?.message || 'Failed to change password'); } finally { setLoading(false); } };
  if (done) return <div className="max-w-[28rem] mx-auto p-6 text-center"><Icon name="CheckCircle" size={32} className="mx-auto mb-3" /><h1 className="text-lg font-semibold">Password changed</h1><p className="text-sm text-muted-foreground mt-2">Your password has been changed successfully.</p></div>;
  return <div className="max-w-[28rem] mx-auto p-6"><div className="text-center mb-6"><Icon name="Lock" size={28} className="mx-auto mb-2" /><h1 className="text-lg font-semibold">Change password</h1><p className="text-sm text-muted-foreground mt-1">Update your password.</p></div><form onSubmit={submit} className="flex flex-col gap-3"><PasswordField id="password" label="New password" value={password} onChange={(e) => setPassword(e.target.value)} show={show} toggle={() => setShow((v) => !v)} /><PasswordField id="confirm" label="Confirm new password" value={confirm} onChange={(e) => setConfirm(e.target.value)} show={showConfirm} toggle={() => setShowConfirm((v) => !v)} />{error && <p className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={loading} className="w-full h-9">{loading ? 'Updating…' : 'Change password'}</Button></form></div>;
}
function PasswordField({ id, label, value, onChange, show, toggle }) { return <div className="space-y-1"><Label htmlFor={id}>{label}</Label><div className="relative"><Input id={id} type={show ? 'text' : 'password'} value={value} onChange={onChange} required className="h-9 pr-10" /><button type="button" onClick={toggle} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground" tabIndex={-1}><Icon name={show ? 'EyeOff' : 'Eye'} size={16} /></button></div></div>; }
