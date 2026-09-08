/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

const getStoredConfig = () => {
  try {
    const url = localStorage.getItem('SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || '';
    const key = localStorage.getItem('SUPABASE_ANON_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || '';
    return { url, key };
  } catch {
    return {
      url: import.meta.env.VITE_SUPABASE_URL || '',
      key: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
    };
  }
};

const { url: supabaseUrl, key: supabaseAnonKey } = getStoredConfig();

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);

export const saveSupabaseConfig = (url: string, key: string) => {
  localStorage.setItem('SUPABASE_URL', url.trim());
  localStorage.setItem('SUPABASE_ANON_KEY', key.trim());
  window.location.reload();
};
