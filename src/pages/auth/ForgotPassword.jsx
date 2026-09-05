import { useState } from 'react';
import { Link } from 'react-router-dom';
import { sendPasswordReset } from '@/services/auth';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import Icon from '@/components/Icon';
import AuthLayout from './AuthLayout';

export default function ForgotPassword() {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false); const [error, setError] = useState(null);
  const handleSubmit = async (e) => { e.preventDefault(); setError(null); setLoading(true); try { await sendPasswordReset(email); setSent(true); } catch (err) { setError(err?.message || 'Failed to send reset link'); } finally { setLoading(false); } };
  if (sent) return <AuthLayout title="Check your email" icon="Mail"><div className="rounded-xl border bg-muted/30 p-5 text-center space-y-4"><div className="size-12 rounded-full bg-success/10 flex items-center justify-center mx-auto"><Icon name="CheckCircle" size={24} className="text-success" /></div><p className="text-sm">If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.</p><Button variant="outline" size="sm" asChild><Link to="/login">Back to sign in</Link></Button></div></AuthLayout>;
  return <AuthLayout title="Forgot password?" description="Enter your email and we&apos;ll send you a reset link." icon="KeyRound"><form onSubmit={handleSubmit} className="flex flex-col gap-3"><div className="space-y-1"><Label htmlFor="email">Email address</Label><Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus className="h-9" /></div>{error && <p className="text-sm text-destructive">{error}</p>}<Button type="submit" disabled={loading} className="w-full h-9">{loading ? 'Sending…' : 'Send reset link'}</Button></form><p className="text-center text-sm text-muted-foreground mt-5">Remember your password? <Link to="/login" className="text-primary font-medium">Sign in</Link></p></AuthLayout>;
}
