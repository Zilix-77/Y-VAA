import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Tracks foreground vs background — later we will auto-submit the quiz when the app backgrounds.
 */
export function useQuizAppState() {
  const [appState, setAppState] = useState(AppState.currentState);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState);
    return () => subscription.remove();
  }, []);

  return { appState };
}
