import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser, resendSignupEmail } from '@/services/auth';
import { Button } from '@/components/ui/button';
import AuthLayout from './AuthLayout';

export default function EmailVerification() {
  const navigate = useNavigate(); const [loading, setLoading] = useState(false); const [message, setMessage] = useState(null); const [error, setError] = useState(null);
  const resend = async () => { setLoading(true); setError(null); try { const user = await getUser(); if (!user?.email) throw new Error('No email address is available.'); await resendSignupEmail(user.email); setMessage('Verification email sent.'); } catch (err) { setError(err?.message || 'Unable to resend verification email.'); } finally { setLoading(false); } };
  return <AuthLayout title="Verify your email" description="Check your inbox for the confirmation link." icon="MailCheck"><div className="text-center space-y-4"><p className="text-sm text-muted-foreground">After confirming your email, sign in to continue.</p>{message && <p className="text-sm text-success">{message}</p>}{error && <p className="text-sm text-destructive">{error}</p>}<Button onClick={resend} disabled={loading} variant="outline" className="w-full">{loading ? 'Sending…' : 'Resend email'}</Button><Button onClick={() => navigate('/login')} className="w-full">Back to sign in</Button></div></AuthLayout>;
}
