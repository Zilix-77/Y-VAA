import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { colors } from '../constants/colors';

/**
 * Full-screen spinner while we restore the session from AsyncStorage.
 */
export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
});
