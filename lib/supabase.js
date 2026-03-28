import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

let supabaseClient = null;

/**
 * Trims values and removes a single pair of surrounding quotes from .env pastes.
 */
function normalizeEnvValue(value) {
  if (value == null || typeof value !== 'string') {
    return '';
  }
  let trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

/**
 * Returns true if the value is still a template from .env.example or obviously incomplete.
 */
function looksLikePlaceholderKey(key) {
  if (!key) {
    return true;
  }
  const lower = key.toLowerCase();
  return (
    lower.includes('paste_publishable') ||
    lower.includes('your_publishable') ||
    lower === 'your_publishable_or_anon_key'
  );
}

/**
 * Project URL must be the HTTPS API host, not the Supabase dashboard link in the browser.
 */
function isValidSupabaseProjectUrl(url) {
  if (!url) {
    return false;
  }
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:') {
      return false;
    }
    if (parsed.hostname === 'supabase.com') {
      return false;
    }
    return parsed.hostname.endsWith('.supabase.co');
  } catch {
    return false;
  }
}

/**
 * Returns a singleton Supabase client with persisted auth (AsyncStorage), or null if env is missing or invalid.
 */
export function getSupabase() {
  if (supabaseClient) {
    return supabaseClient;
  }
  const supabaseUrl = normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_URL);
  const supabaseAnonKey = normalizeEnvValue(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  if (!isValidSupabaseProjectUrl(supabaseUrl)) {
    return null;
  }
  if (looksLikePlaceholderKey(supabaseAnonKey)) {
    return null;
  }
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  return supabaseClient;
}
