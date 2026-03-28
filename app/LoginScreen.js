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
import { strings } from '../constants/strings';
import { formatAuthErrorMessage } from '../lib/authErrors';
import { getSupabase } from '../lib/supabase';

/**
 * Email/password login — navigates to Sign up for new users.
 */
export function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  /**
   * Sends credentials to Supabase and relies on useAuthSession to switch to the home UI.
   */
  const handleLogin = async () => {
    const client = getSupabase();
    if (!client) {
      setErrorMessage(strings.missingEnvBody);
      return;
    }
    setErrorMessage('');
    setSubmitting(true);
    const { error } = await client.auth.signInWithPassword({ email: email.trim(), password });
    setSubmitting(false);
    if (error) {
      setErrorMessage(formatAuthErrorMessage(error.message));
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{strings.loginTitle}</Text>
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
          placeholder="••••••••"
          secureTextEntry
          autoComplete="password"
        />
        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}
        <PrimaryButton label={strings.loginCta} onPress={handleLogin} loading={submitting} />
        <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.linkWrap}>
          <Text style={styles.link}>{strings.goToSignUp}</Text>
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
    marginBottom: 24,
  },
  error: {
    color: colors.error,
    marginBottom: 12,
    fontSize: 14,
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
