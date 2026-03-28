/**
 * Turns Supabase Auth error strings into short, beginner-friendly messages.
 */
export function formatAuthErrorMessage(rawMessage) {
  if (!rawMessage || typeof rawMessage !== 'string') {
    return 'Something went wrong. Try again.';
  }
  const lower = rawMessage.toLowerCase();
  if (
    lower.includes('rate') ||
    lower.includes('over_email_send_rate_limit') ||
    lower.includes('email rate')
  ) {
    return 'Too many signup or email requests. Wait a few minutes, try again, or use a different email. For local testing you can turn off “Confirm email” in Supabase → Authentication → Providers → Email.';
  }
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) {
    return 'Wrong email or password.';
  }
  return rawMessage;
}
