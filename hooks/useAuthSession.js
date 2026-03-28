import { useCallback, useEffect, useState } from 'react';
import { getSupabase } from '../lib/supabase';

/**
 * Subscribes to Supabase auth, loads the public.profiles row for the signed-in user, and exposes sign out.
 */
export function useAuthSession() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfileForUser = useCallback(async (userId) => {
    const client = getSupabase();
    if (!client) {
      setProfile(null);
      return;
    }
    const { data, error } = await client.from('profiles').select('*').eq('id', userId).maybeSingle();
    if (error) {
      setProfile(null);
      return;
    }
    setProfile(data);
  }, []);

  useEffect(() => {
    const client = getSupabase();
    if (!client) {
      setLoading(false);
      return undefined;
    }

    let active = true;

    async function bootstrap() {
      const { data: { session: initialSession } } = await client.auth.getSession();
      if (!active) {
        return;
      }
      setSession(initialSession);
      if (initialSession?.user) {
        await fetchProfileForUser(initialSession.user.id);
      } else {
        setProfile(null);
      }
      setLoading(false);
    }

    bootstrap();

    const { data: listener } = client.auth.onAuthStateChange(async (_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user) {
        await fetchProfileForUser(nextSession.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [fetchProfileForUser]);

  /**
   * Signs the user out locally and on the server.
   */
  const signOut = useCallback(async () => {
    const client = getSupabase();
    if (!client) {
      return;
    }
    await client.auth.signOut();
  }, []);

  return { session, profile, loading, signOut };
}
