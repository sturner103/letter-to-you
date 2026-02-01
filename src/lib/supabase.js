import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nsjpjlqtqkkgwcstpunq.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5zanBqbHF0cWtrZ3djc3RwdW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjkxNDUxNTQsImV4cCI6MjA4NDcyMTE1NH0.AUh7WoLBtGCfNgB1vsbEw-qgXw62rPsbm_IySqZAw5Q';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false  // Disabled - was misinterpreting Stripe redirect params
  }
});

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data;
};
