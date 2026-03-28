import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AuthTextInput } from '../components/AuthTextInput';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { ROLES } from '../constants/roles';
import { strings } from '../constants/strings';
import { formatAuthErrorMessage } from '../lib/authErrors';
import { getSupabase } from '../lib/supabase';

/**
 * Registers a new user with role in user metadata — trigger creates public.profiles row.
 */
export function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState(ROLES.STUDENT);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  /**
   * Creates the auth user and passes role/display_name in raw user metadata for the DB trigger.
   */
  const handleSignUp = async () => {
    const client = getSupabase();
    if (!client) {
      setErrorMessage(strings.missingEnvBody);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      setInfoMessage('');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      setInfoMessage('');
      return;
    }
    setErrorMessage('');
    setInfoMessage('');
    setSubmitting(true);
    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          role,
          display_name: displayName.trim() || undefined,
        },
      },
    });
    setSubmitting(false);
    if (error) {
      setErrorMessage(formatAuthErrorMessage(error.message));
      return;
    }
    if (!data.session) {
      setInfoMessage('Sign up successful. If email confirmation is on in Supabase, confirm your email, then log in.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{strings.signUpTitle}</Text>
        <Text style={styles.roleLabel}>{strings.roleLabel}</Text>
        <View style={styles.roleRow}>
          <Pressable
            onPress={() => setRole(ROLES.TEACHER)}
            style={[styles.roleChip, role === ROLES.TEACHER && styles.roleChipActive]}
          >
            <Text style={[styles.roleChipText, role === ROLES.TEACHER && styles.roleChipTextActive]}>
              {strings.teacherRole}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRole(ROLES.STUDENT)}
            style={[styles.roleChip, role === ROLES.STUDENT && styles.roleChipActive]}
          >
            <Text style={[styles.roleChipText, role === ROLES.STUDENT && styles.roleChipTextActive]}>
              {strings.studentRole}
            </Text>
          </Pressable>
        </View>
        <AuthTextInput
          label={strings.displayNameLabel}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Your name"
          autoCapitalize="words"
          autoComplete="name"
        />
        <AuthTextInput
          label={strings.emailLabel}
          value={email}
          onChangeText={setEmail}
          placeholder="you@school.edu"
          keyboardType="email-address"
          autoComplete="email"
        />
        <AuthTextInput
          label={strings.passwordLabel}
          value={password}
          onChangeText={setPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          autoComplete="password-new"
        />
        <AuthTextInput
          label={strings.confirmPasswordLabel}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat password"
          secureTextEntry
          autoComplete="password-new"
        />
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        {infoMessage ? <Text style={styles.info}>{infoMessage}</Text> : null}
        <PrimaryButton label={strings.signUpCta} onPress={handleSignUp} loading={submitting} />
        <Pressable onPress={() => navigation.navigate('Login')} style={styles.linkWrap}>
          <Text style={styles.link}>{strings.goToLogin}</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    paddingBottom: 32,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.textPrimary,
    marginBottom: 16,
  },
  roleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  roleChip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  roleChipActive: {
    borderColor: colors.accent,
    backgroundColor: '#eff6ff',
  },
  roleChipText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textMuted,
  },
  roleChipTextActive: {
    color: colors.accent,
  },
  error: {
    color: colors.error,
    marginBottom: 12,
    fontSize: 14,
  },
  info: {
    color: colors.textPrimary,
    marginBottom: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  linkWrap: {
    marginTop: 16,
    alignItems: 'center',
  },
  link: {
    color: colors.accent,
    fontSize: 15,
    fontWeight: '600',
  },
});
