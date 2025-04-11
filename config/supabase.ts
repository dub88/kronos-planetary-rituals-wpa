import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import 'react-native-url-polyfill/auto';

if (!process.env.EXPO_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing SUPABASE_URL in environment variables');
}

if (!process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  throw new Error('Missing SUPABASE_ANON_KEY in environment variables');
}

export const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
export const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

// Create a custom storage adapter for AsyncStorage
const AsyncStorageAdapter = {
  getItem: (key: string) => AsyncStorage.getItem(key),
  setItem: (key: string, value: string) => AsyncStorage.setItem(key, value),
  removeItem: (key: string) => AsyncStorage.removeItem(key),
};

// Check if we're in a browser environment where localStorage is available
const isLocalStorageAvailable = () => {
  try {
    if (typeof localStorage === 'undefined') return false;
    const testKey = '__supabase_ls_test__';
    localStorage.setItem(testKey, 'test');
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
};

// Create a dummy storage for SSR environments
const dummyStorage = {
  getItem: () => Promise.resolve(null),
  setItem: () => Promise.resolve(),
  removeItem: () => Promise.resolve(),
};

// Determine which storage to use
const getStorage = () => {
  if (Platform.OS !== 'web') return AsyncStorageAdapter;
  return isLocalStorageAvailable() ? localStorage : dummyStorage;
};

// Create the Supabase client with platform-specific storage
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web' && isLocalStorageAvailable(),
  },
});
