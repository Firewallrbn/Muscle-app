import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';


const supabaseUrl = "https://dzwkyykjnrcllgsqnrlg.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR6d2t5eWtqbnJjbGxnc3FucmxnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMjE1NzUsImV4cCI6MjA3NzY5NzU3NX0.IgNzNMA5e8WCkVyo_89l1Nagfcl2zRf8y3QrMBxFJrU";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});