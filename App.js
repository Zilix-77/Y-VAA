import { NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { MainNavigator } from './navigation/MainNavigator';
import { LoadingScreen } from './app/LoadingScreen';
import { MissingConfigScreen } from './app/MissingConfigScreen';
import { ScreenContainer } from './components/ScreenContainer';
import { useAuthSession } from './hooks/useAuthSession';
import { getSupabase } from './lib/supabase';
import { AuthNavigator } from './navigation/AuthNavigator';

/**
 * Chooses config error, loading, auth stack, or home based on Supabase session.
 */
export default function App() {
  const supabaseReady = getSupabase() != null;
  const { session, profile, loading, signOut } = useAuthSession();

  if (!supabaseReady) {
    return (
      <ScreenContainer>
        <MissingConfigScreen />
        <StatusBar style="dark" />
      </ScreenContainer>
    );
  }

  if (loading) {
    return (
      <ScreenContainer>
        <LoadingScreen />
        <StatusBar style="dark" />
      </ScreenContainer>
    );
  }

  return (
    <NavigationContainer>
      <ScreenContainer>
        {session ? (
          <MainNavigator profile={profile} session={session} onSignOut={signOut} />
        ) : (
          <AuthNavigator />
        )}
        <StatusBar style="dark" />
      </ScreenContainer>
    </NavigationContainer>
  );
}
