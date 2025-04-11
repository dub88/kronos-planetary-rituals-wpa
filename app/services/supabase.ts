import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import type { 
  Database, 
  RitualLog, 
  RitualLogInsert, 
  Profile, 
  ProfileUpdate, 
  Settings, 
  SettingsUpdate 
} from '../types/database';

const { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } = Constants.expoConfig?.extra || {};

// Initialize Supabase client
if (!EXPO_PUBLIC_SUPABASE_URL || !EXPO_PUBLIC_SUPABASE_ANON_KEY) {
  console.error('Missing Supabase environment variables');
  // Instead of throwing, we'll use a fallback URL for development
  // This allows the app to run even without proper environment setup
}

// Network timeout for Supabase requests (10 seconds)
const NETWORK_TIMEOUT = 10000;

// Check if we're in a browser environment
const isBrowser = () => {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
};

export const supabase = createClient<Database>(
  EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder-url.supabase.co',
  EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      persistSession: isBrowser(),
      autoRefreshToken: isBrowser(),
      detectSessionInUrl: false,
    },
    global: {
      fetch: async (url, options) => {
        // Create an AbortController to handle timeouts
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), NETWORK_TIMEOUT);
        
        try {
          // Add the abort signal to the fetch options
          const response = await fetch(url, {
            ...options,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);
          return response;
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('Supabase fetch error:', error);
          // Re-throw the error to be handled by Supabase client
          throw error;
        }
      },
    },
  }
);

// Ritual Logs
// Helper function to check if we're in offline mode
const isOfflineMode = async (): Promise<boolean> => {
  try {
    // Simple network check - try to fetch a small resource
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const response = await fetch('https://www.google.com/generate_204', {
      method: 'HEAD',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    return !response.ok;
  } catch (error) {
    console.log('Network check failed, assuming offline mode');
    return true;
  }
};

export const addRitualLog = async (ritualLog: Omit<RitualLogInsert, 'id' | 'created_at' | 'user_id'>) => {
  try {
    // Check if we're offline
    const offline = await isOfflineMode();
    if (offline) {
      console.log('Device appears to be offline, storing ritual log locally');
      // TODO: Implement local storage for offline ritual logs
      // For now, just return a mock response
      return {
        ...ritualLog,
        id: `local-${Date.now()}`,
        user_id: 'offline-user',
        completed_at: new Date().toISOString(),
      };
    }
    
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      console.log('User not authenticated, using anonymous mode');
      // Instead of throwing, use a temporary user ID
      const tempUserId = 'anonymous-user';
      return {
        ...ritualLog,
        id: `anon-${Date.now()}`,
        user_id: tempUserId,
        completed_at: new Date().toISOString(),
      };
    }

    const { data, error } = await supabase
      .from('ritual_logs')
      .insert({
        ...ritualLog,
        user_id: user.user.id,
        id: crypto.randomUUID(),
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in addRitualLog:', error);
    throw error;
  }
};

export const getRitualLogs = async () => {
  try {
    // Check if we're offline
    const offline = await isOfflineMode();
    if (offline) {
      console.log('Device appears to be offline, returning cached ritual logs');
      // TODO: Implement local storage for offline ritual logs
      // For now, just return an empty array
      return [];
    }
    
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      console.log('User not authenticated, returning empty ritual logs');
      return [];
    }

    const { data, error } = await supabase
      .from('ritual_logs')
      .select('*')
      .eq('user_id', user.user.id)
      .order('completed_at', { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in getRitualLogs:', error);
    throw error;
  }
};

// Default profile data
export const defaultProfile: Omit<Profile, 'id'> = {
  updated_at: new Date().toISOString(),
  name: '',
  bio: '',
  avatar_url: '',
  level: 1,
  experience: 0,
  streak_days: 0,
  created_at: new Date().toISOString()
};

// User Profile
export const getUserProfile = async () => {
  try {
    // Check if we're offline
    const offline = await isOfflineMode();
    if (offline) {
      console.log('Device appears to be offline, returning default profile');
      return {
        id: 'offline-user',
        ...defaultProfile
      };
    }
    
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      console.log('User not authenticated, returning default profile');
      return {
        id: 'anonymous-user',
        ...defaultProfile
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.user.id)
      .single();

    if (error) {
      // If no profile exists, create one
      if (error.code === 'PGRST116') {
        const newProfile = {
          id: user.user.id,
          ...defaultProfile
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
          
        if (createError) throw createError;
        return createdProfile;
      } else {
        throw error;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    throw error;
  }
};

export const updateUserProfile = async (profile: Omit<ProfileUpdate, 'id' | 'updated_at'>) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profile,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.user.id)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    throw error;
  }
};

// Default settings
export const defaultSettings: Omit<Settings, 'user_id'> = {
  dark_mode: false,
  notifications: true,
  auto_detect_location: true,
  location: null,
  sound_enabled: true,
  haptic_feedback_enabled: true,
  language: 'en',
  units: 'metric',
  theme: 'system',
  font_size: 'medium'
};

// Settings
export const getUserSettings = async () => {
  try {
    // Check if we're offline
    const offline = await isOfflineMode();
    if (offline) {
      console.log('Device appears to be offline, returning default settings');
      return {
        id: 'offline-settings',
        user_id: 'offline-user',
        ...defaultSettings
      };
    }
    
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      console.log('User not authenticated, returning default settings');
      return {
        id: 'anonymous-settings',
        user_id: 'anonymous-user',
        ...defaultSettings
      };
    }

    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (error) {
      // If no settings exist, create default settings
      if (error.code === 'PGRST116') {
        const newSettings = {
          id: crypto.randomUUID(),
          user_id: user.user.id,
          ...defaultSettings
        };
        
        const { data: createdSettings, error: createError } = await supabase
          .from('settings')
          .insert(newSettings)
          .select()
          .single();
          
        if (createError) throw createError;
        return createdSettings;
      } else {
        throw error;
      }
    }
    
    return data;
  } catch (error) {
    console.error('Error in getUserSettings:', error);
    throw error;
  }
};

export const updateUserSettings = async (settings: Omit<SettingsUpdate, 'user_id'>) => {
  try {
    const { data: user } = await supabase.auth.getUser();
    if (!user?.user?.id) {
      throw new Error('User not authenticated');
    }

    const { data: existingSettings } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', user.user.id)
      .single();

    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from('settings')
        .update({
          ...settings,
          user_id: user.user.id,
        })
        .eq('user_id', user.user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Insert new settings
      const { data, error } = await supabase
        .from('settings')
        .insert({
          ...settings,
          user_id: user.user.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (error) {
    console.error('Error in updateUserSettings:', error);
    throw error;
  }
};

// Create Supabase service object
const SupabaseService = {
  supabase,
  addRitualLog,
  getRitualLogs,
  getUserProfile,
  updateUserProfile,
  getUserSettings,
  updateUserSettings
};

// Default export for the Supabase service
export default SupabaseService;
