import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { RitualLog, Settings as AppSettings, Profile } from '../app/types/database';

// Use the provided Supabase URL and anon key
const supabaseUrl = 'https://ddayngewhgmynensehmg.supabase.co';
// Use the anon key for client-side access
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRkYXluZ2V3aGdteW5lbnNlaG1nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA5MzE2MDUsImV4cCI6MjA1NjUwNzYwNX0.hXP1t-LZdO_OemKaPeW27ee2GSx1q6cQSNoCxXro_78';

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

// Create the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: getStorage(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: Platform.OS === 'web' && isLocalStorageAvailable(),
  },
});

// Helper functions for common Supabase operations

// User authentication
export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    return { data, error };
  } catch (err) {
    console.error('Error in signUp:', err);
    return { data: null, error: err };
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  } catch (err) {
    console.error('Error in signIn:', err);
    return { data: null, error: err };
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err) {
    console.error('Error in signOut:', err);
    return { error: err };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    return { user: data?.user, error };
  } catch (err) {
    console.error('Error in getCurrentUser:', err);
    return { user: null, error: err };
  }
};

export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    return { session: data?.session, error };
  } catch (err) {
    console.error('Error in getSession:', err);
    return { session: null, error: err };
  }
};

// Ritual logs
export const getRitualLogs = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('ritual_logs')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error in getRitualLogs:', err);
    return { data: [], error: err };
  }
};

export const addRitualLog = async (ritualLog: RitualLog) => {
  try {
    const { data, error } = await supabase
      .from('ritual_logs')
      .insert([
        {
          user_id: ritualLog.user_id,
          ritual_id: ritualLog.ritual_id,
          completed_at: ritualLog.completed_at,
          notes: ritualLog.notes,
          rating: ritualLog.rating
        }
      ])
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error in addRitualLog:', err);
    return { data: null, error: err };
  }
};

// User profiles
export const getUserProfile = async (userId: string) => {
  try {
    // First check if the profile already exists
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId);
    
    // If there's an error checking for the profile, throw it
    if (checkError) throw checkError;
    
    // If the profile exists, return it
    if (existingProfile && existingProfile.length > 0) {
      return { data: existingProfile[0], error: null };
    }
    
    // If the profile doesn't exist, create a default one
    const defaultProfile = {
      id: userId,
      name: '',
      bio: '',
      avatar_url: '',
      level: 1,
      experience: 0,
      streak_days: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    // Insert the default profile
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([defaultProfile])
      .select()
      .single();
      
    if (insertError) throw insertError;
    return { data: newProfile, error: null };
  } catch (err) {
    console.error('Error in getUserProfile:', err);
    return { data: null, error: err };
  }
};

export const updateUserProfile = async (userId: string, updates: Partial<Profile>) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('Error in updateUserProfile:', err);
    return { data: null, error: err };
  }
};

// Settings operations
export const getUserSettings = async (userId: string) => {
  try {
    // First check if settings already exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId);
    
    // If there's an error checking for settings, throw it
    if (checkError) throw checkError;
    
    // If settings exist, return them
    if (existingSettings && existingSettings.length > 0) {
      return { data: existingSettings[0], error: null };
    }
    
    // If settings don't exist, create default ones
    const defaultUserSettings = getDefaultSettings(userId);
    
    // Insert the default settings
    const { data: newSettings, error: insertError } = await supabase
      .from('settings')
      .insert([defaultUserSettings])
      .select()
      .single();
      
    if (insertError) throw insertError;
    return { data: newSettings, error: null };
  } catch (err) {
    console.error('Error in getUserSettings:', err);
    return { data: null, error: err };
  }
};



// Default settings used when creating new user
export const getDefaultSettings = (userId: string): AppSettings => ({
  user_id: userId,
  dark_mode: true,
  notifications: true,
  auto_detect_location: true,
  location: {
    // Add zodiac sign information to the location object
    zodiac: {
      sunSign: 'aries',
      moonSign: 'taurus',
      risingSign: 'gemini'
    }
  },
  sound_enabled: true,
  haptic_feedback_enabled: true,
  language: 'en',
  units: 'metric',
  theme: 'dark',
  font_size: 'medium'
});

// Settings - real API calls
export const updateUserSettings = async (userId: string, updates: Partial<AppSettings>) => {
  try {
    // First check if settings already exist
    const { data: existingSettings, error: checkError } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId);
    
    // If there's an error checking for settings, throw it
    if (checkError) throw checkError;
    
    let result;
    
    // If settings exist, update them
    if (existingSettings && existingSettings.length > 0) {
      result = await supabase
        .from('settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();
    } else {
      // If settings don't exist, create them
      const defaultSettings = getDefaultSettings(userId);
      result = await supabase
        .from('settings')
        .insert([{ ...defaultSettings, ...updates }])
        .select()
        .single();
    }
    
    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (err) {
    console.error('Error in updateUserSettings:', err);
    return { data: null, error: err };
  }
};