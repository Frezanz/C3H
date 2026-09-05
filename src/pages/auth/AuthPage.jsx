import { useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { signIn, signUp } from '@/services/auth';
import { setUser } from '@/store/userSlice';
import { useDispatch } from 'react-redux';
import { AUTH_PROFILES, GENERIC_AUTH } from '@/config/app.config';
import ApperIcon from '@/components/ApperIcon';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import AuthLayout from './AuthLayout';

export default function AuthPage({ mode }) {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { profile: profileParam } = useParams();
  const matchedProfile = AUTH_PROFILES?.length && profileParam
    ? AUTH_PROFILES.find((p) => p.key === profileParam)
    : null;
  const redirectAfterAuth = matchedProfile?.redirectAfterAuth ?? GENERIC_AUTH.redirectAfterAuth;
  const authPage = matchedProfile?.authPage;
  const title = mode === 'login'
    ? authPage?.loginTitle ?? GENERIC_AUTH.loginTitle
    : authPage?.signupTitle ?? GENERIC_AUTH.signupTitle;
  const description = mode === 'login'
    ? authPage?.loginDescription ?? GENERIC_AUTH.loginDescription
    : authPage?.signupDescription ?? GENERIC_AUTH.signupDescription;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [needsEmailConfirmation, setNeedsEmailConfirmation] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      const metadata = {
        profile: matchedProfile?.key ?? '',
        profileLabel: matchedProfile?.label ?? 'Member',
        displayName: email.split('@')[0],
      };
      if (mode === 'login') {
        const user = await signIn(email, password);
        dispatch(setUser(user));
        navigate(redirectAfterAuth, { replace: true });
      } else {
        const result = await signUp(email, password, metadata);
        if (!result.session) {
          setNeedsEmailConfirmation(true);
          return;
        }
        dispatch(setUser(result.user));
        navigate(redirectAfterAuth, { replace: true });
      }
    } catch (err) {
      setError(err?.message || (mode === 'login' ? 'Unable to sign in.' : 'Unable to create your account.'));
    } finally {
      setLoading(false);
    }
  };

  if (needsEmailConfirmation) {
    return (
      <AuthLayout title="Check your email" icon="MailCheck">
        <div className="rounded-xl border bg-muted/30 p-5 text-center space-y-4">
          <p className="text-sm text-foreground">We sent a confirmation link to <strong>{email}</strong>.</p>
          <p className="text-xs text-muted-foreground">Open it to finish creating your account, then sign in.</p>
          <Button variant="outline" asChild className="w-full h-9"><Link to="/login">Back to sign in</Link></Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={title} description={description}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="space-y-1">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus autoComplete="email" className="h-9" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            {mode === 'login' && <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80">Forgot password?</Link>}
          </div>
          <div className="relative">
            <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="h-9 pr-10" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground" tabIndex={-1} aria-label={showPassword ? 'Hide password' : 'Show password'}>
              <ApperIcon name={showPassword ? 'EyeOff' : 'Eye'} size={16} />
            </button>
          </div>
        </div>
        {mode === 'signup' && (
          <div className="space-y-1">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <div className="relative">
              <Input id="confirmPassword" type={showConfirmPassword ? 'text' : 'password'} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required autoComplete="new-password" className="h-9 pr-10" />
              <button type="button" onClick={() => setShowConfirmPassword((v) => !v)} className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground" tabIndex={-1} aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}>
                <ApperIcon name={showConfirmPassword ? 'EyeOff' : 'Eye'} size={16} />
              </button>
            </div>
          </div>
        )}
        {error && <p className="text-sm text-destructive" role="alert">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full h-9">{loading ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</Button>
      </form>
      <AuthFooter mode={mode} profilePrefix={profileParam} altLinksLeadIn={matchedProfile?.altLinksLeadIn} altLinks={matchedProfile?.altLinks} />
    </AuthLayout>
  );
}

function AuthFooter({ mode, profilePrefix, altLinksLeadIn, altLinks }) {
  const base = profilePrefix ? `/${profilePrefix}` : '';
  return (
    <div className="mt-8 space-y-5">
      <p className="text-[13px] text-center text-muted-foreground">
        {mode === 'login' ? <>Don&apos;t have an account? <Link to={`${base}/signup`} className="text-primary font-medium hover:underline">Sign up</Link></> : <>Already have an account? <Link to={`${base}/login`} className="text-primary font-medium hover:underline">Sign in</Link></>}
      </p>
      {altLinks?.length > 0 && <div className="flex flex-col gap-2">{altLinks.map((link) => <Link key={link.href} to={link.href} className="group flex items-center gap-3 rounded-lg border border-border/50 bg-muted/30 px-4 py-3"><div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary"><ApperIcon name="UserRound" size={16} /></div><div className="flex-1 min-w-0"><p className="text-sm font-medium">{link.label}</p>{altLinksLeadIn && <p className="text-xs text-muted-foreground truncate">{altLinksLeadIn}</p>}</div><ApperIcon name="ChevronRight" size={16} /></Link>)}</div>}
    </div>
  );
}
