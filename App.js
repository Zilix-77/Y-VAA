import { StatusBar } from 'expo-status-bar';
import { HomeScreen } from './app/HomeScreen';
import { ScreenContainer } from './components/ScreenContainer';

/**
 * Root component — keeps status bar and first screen in one place.
 */
export default function App() {
  return (
    <ScreenContainer>
      <HomeScreen />
      <StatusBar style="dark" />
    </ScreenContainer>
  );
}
