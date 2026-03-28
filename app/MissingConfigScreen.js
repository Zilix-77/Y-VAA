import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { strings } from '../constants/strings';

/**
 * Shown when Supabase env vars are not set — avoids silent failures during development.
 */
export function MissingConfigScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.missingEnvTitle}</Text>
      <Text style={styles.body}>{strings.missingEnvBody}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 12,
  },
  body: {
    fontSize: 16,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
