import { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { PrimaryButton } from '../../components/PrimaryButton';
import { colors } from '../../constants/colors';
import { strings } from '../../constants/strings';
import { joinQuizByRoomCode } from '../../lib/quizApi';

/**
 * Student landing: enter a room code and start the quiz attempt.
 */
export function StudentHomeScreen({ navigation, profile, session, onSignOut }) {
  const [roomCode, setRoomCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const email = session?.user?.email ?? '';

  /**
   * Calls join RPC and navigates to the timed quiz screen.
   */
  const handleJoin = async () => {
    const code = roomCode.trim().toUpperCase();
    if (code.length < 4) {
      Alert.alert(strings.errorTitle, strings.roomCodeInvalid);
      return;
    }
    setSubmitting(true);
    const { data, error } = await joinQuizByRoomCode(code);
    setSubmitting(false);
    if (error) {
      Alert.alert(strings.errorTitle, error.message);
      return;
    }
    const payload = data;
    navigation.navigate('TakeQuiz', {
      attemptId: payload.attempt_id,
      quizId: payload.quiz_id,
      title: payload.title,
      timeLimitSeconds: payload.time_limit_seconds,
      startedAtIso: payload.started_at,
      serverNowIso: payload.server_now,
    });
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{strings.appName}</Text>
      <Text style={styles.sub}>{strings.studentHomeSubtitle}</Text>
      <View style={styles.row}>
        <Text style={styles.meta}>{profile?.display_name || email}</Text>
        <Pressable onPress={onSignOut} style={({ pressed }) => [pressed && styles.pressed]}>
          <Text style={styles.link}>{strings.signOut}</Text>
        </Pressable>
      </View>
      <Text style={styles.label}>{strings.roomCodeInputLabel}</Text>
      <TextInput
        style={styles.input}
        value={roomCode}
        onChangeText={(value) => setRoomCode(value.toUpperCase())}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder="ABC123"
      />
      <PrimaryButton label={strings.joinRoomCta} onPress={handleJoin} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 20,
    paddingTop: 48,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  sub: {
    marginTop: 6,
    fontSize: 15,
    color: colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
  },
  meta: {
    fontSize: 14,
    color: colors.textMuted,
    flex: 1,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    letterSpacing: 2,
    fontWeight: '700',
    marginBottom: 16,
    color: colors.textPrimary,
  },
  pressed: {
    opacity: 0.75,
  },
});
