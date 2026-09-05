import { supabase } from './supabase';

function requireClient() {
  if (!supabase) {
    throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY.');
  }
  return supabase;
}

export function normalizeUser(user) {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  const displayName = metadata.displayName || metadata.display_name || metadata.name || user.email?.split('@')[0] || 'Member';
  const nameParts = displayName.trim().split(/\s+/).filter(Boolean);
  return {
    ...user,
    Id: user.id,
    id: user.id,
    emailAddress: user.email,
    profile: metadata.profile ?? '',
    profileLabel: metadata.profileLabel ?? 'Member',
    displayName,
    firstName: metadata.firstName || metadata.first_name || nameParts[0] || 'Member',
    lastName: metadata.lastName || metadata.last_name || nameParts.slice(1).join(' '),
  };
}

export async function getSession() {
  const { data, error } = await requireClient().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getUser() {
  const { data, error } = await requireClient().auth.getUser();
  if (error) {
    if (error.name === 'AuthSessionMissingError') return null;
    throw error;
  }
  return normalizeUser(data.user);
}

export function onAuthStateChange(callback) {
  return requireClient().auth.onAuthStateChange((event, session) => {
    callback({ event, session, user: normalizeUser(session?.user) });
  });
}

export async function signIn(email, password) {
  const { data, error } = await requireClient().auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  return normalizeUser(data.user);
}

export async function signUp(email, password, metadata = {}) {
  const { data, error } = await requireClient().auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${window.location.origin}/callback`,
    },
  });
  if (error) throw error;
  return { user: normalizeUser(data.user), session: data.session };
}

export async function signOut() {
  const { error } = await requireClient().auth.signOut();
  if (error) throw error;
}

export async function sendPasswordReset(email) {
  const { error } = await requireClient().auth.resetPasswordForEmail(email.trim(), {
    redirectTo: `${window.location.origin}/reset-password`,
  });
  if (error) throw error;
}

export async function updatePassword(password) {
  const { data, error } = await requireClient().auth.updateUser({ password });
  if (error) throw error;
  return normalizeUser(data.user);
}

export async function resendSignupEmail(email) {
  const { error } = await requireClient().auth.resend({ type: 'signup', email: email.trim() });
  if (error) throw error;
}
