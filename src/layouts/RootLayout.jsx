import { createContext, useContext, useEffect, useRef, useCallback } from 'react';
import { Outlet, useLocation, useMatches, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { getSession, onAuthStateChange, normalizeUser, signOut } from '@/services/auth';
import { setUser, clearUser, setInitialized } from '@/store/userSlice';
import { verifyRouteAccess } from '@/router/route.utils';
import { APP_CONFIG, AUTH_PROFILES, GENERIC_AUTH } from '@/config/app.config';
import { Loader2 } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/error-boundary';

const AuthContext = createContext(null);
export function useAuth() { const ctx = useContext(AuthContext); if (!ctx) throw new Error('useAuth must be used within RootLayout'); return ctx; }
const AUTH_PAGE_PATTERN = /^\/(([-\w]+)\/)?(login|signup|callback|forgot-password|reset-password|verify-email|accept-invite)/;

export default function RootLayout() {
  const dispatch = useDispatch();
  const { user, isAuthenticated, isInitialized } = useSelector((state) => state.user);
  const location = useLocation();
  const navigate = useNavigate();
  const matches = useMatches();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    let mounted = true;
    getSession().then((session) => {
      if (!mounted) return;
      const currentUser = normalizeUser(session?.user);
      if (currentUser) dispatch(setUser(currentUser)); else dispatch(clearUser());
    }).catch(() => { if (mounted) dispatch(setInitialized()); });
    const subscription = onAuthStateChange(({ session, user: nextUser }) => {
      if (!mounted) return;
      if (session?.user && nextUser) dispatch(setUser(nextUser)); else dispatch(clearUser());
    });
    return () => { mounted = false; subscription?.data?.subscription?.unsubscribe?.(); };
  }, [dispatch]);

  useEffect(() => {
    if (!isInitialized) return;
    const params = new URLSearchParams(window.location.search);
    const redirectPath = params.get('redirect');
    if (isAuthenticated && redirectPath && location.pathname.startsWith('/login')) {
      navigateRef.current(redirectPath, { replace: true });
    }
  }, [isInitialized, isAuthenticated, location.pathname]);

  const deepestMatch = matches[matches.length - 1];
  const accessRule = deepestMatch?.handle?.access ?? 'public';
  useEffect(() => {
    if (!isInitialized) return;
    if (!verifyRouteAccess(accessRule, user)) {
      const loginRoute = APP_CONFIG.defaultLoginRoute ?? '/login';
      if (user) navigateRef.current('/access-denied', { replace: true });
      else navigateRef.current(`${loginRoute}?redirect=${encodeURIComponent(location.pathname + location.search)}`, { replace: true });
    }
  }, [location.pathname, location.search, isInitialized, user, accessRule]);

  const handleLogout = useCallback(async () => {
    try { await signOut(); } finally { dispatch(clearUser()); navigateRef.current(APP_CONFIG.defaultLoginRoute ?? '/login', { replace: true }); }
  }, [dispatch]);

  if (!isInitialized) return <div className="h-screen flex flex-col items-center justify-center bg-background gap-3"><Loader2 className="size-8 animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">Connecting…</p></div>;
  return <AuthContext.Provider value={{ logout: handleLogout, user, isAuthenticated }}><ErrorBoundary fullPage><Outlet /></ErrorBoundary></AuthContext.Provider>;
}
