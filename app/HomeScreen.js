import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';
import { strings } from '../constants/strings';

/**
 * Shown after login — shows role and a sign-out action until quiz flows are built.
 */
export function HomeScreen({ profile, session, onSignOut }) {
  const email = session?.user?.email ?? '';
  const roleLabel =
    profile?.role === 'teacher'
      ? strings.teacherRole
      : profile?.role === 'student'
        ? strings.studentRole
        : '—';
  const name = profile?.display_name || email || 'User';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{strings.appName}</Text>
      <Text style={styles.subtitle}>{strings.homeTagline}</Text>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Signed in as</Text>
        <Text style={styles.cardName}>{name}</Text>
        <Text style={styles.cardMeta}>{email}</Text>
        <Text style={styles.cardMeta}>
          {profile ? `Role: ${roleLabel}` : 'Profile: not loaded — run Supabase SQL and check RLS'}
        </Text>
      </View>
      <Pressable onPress={onSignOut} style={({ pressed }) => [styles.signOut, pressed && styles.signOutPressed]}>
        <Text style={styles.signOutText}>{strings.signOut}</Text>
      </Pressable>
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
    marginBottom: 24,
  },
  card: {
    width: '100%',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 4,
  },
  cardMeta: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  signOut: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  signOutPressed: {
    opacity: 0.7,
  },
  signOutText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
});
