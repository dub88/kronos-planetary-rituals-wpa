import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

// Initialize the Supabase client with environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mock-supabase-url.com';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'mock-anon-key';

// Check if we're in a browser environment
const isBrowser = () => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

// Create Supabase client with configuration based on our integration setup
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: isBrowser(),
    autoRefreshToken: isBrowser(),
    detectSessionInUrl: false
  }
});

// Default export for Expo Router
export default {
  // This is a placeholder object to satisfy the default export requirement
  supabase
};
