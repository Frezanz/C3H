import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/services/supabase';
import { Loader2 } from 'lucide-react';

export default function Callback() {
  const navigate = useNavigate();
  useEffect(() => { let mounted = true; supabase?.auth.getSession().then(({ data }) => { if (mounted) navigate(data.session ? '/' : '/login', { replace: true }); }); return () => { mounted = false; }; }, [navigate]);
  return <div className="min-h-svh flex items-center justify-center bg-background"><div className="flex flex-col items-center gap-3"><Loader2 className="size-8 animate-spin text-muted-foreground" /><p className="text-sm text-muted-foreground">Verifying your account…</p></div></div>;
}
