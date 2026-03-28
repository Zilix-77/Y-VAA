import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { strings } from '../constants/strings';

/**
 * First screen after app loads — replace body as you build auth and quiz flows.
 */
export function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.appName}</Text>
      <Text style={styles.subtitle}>{strings.homeTagline}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
