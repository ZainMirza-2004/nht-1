import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase is properly configured
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder') || supabaseAnonKey.includes('placeholder')) {
  console.error('❌ Supabase is not configured!');
  console.error('Please create a .env file in the project root with:');
  console.error('VITE_SUPABASE_URL=your-supabase-project-url');
  console.error('VITE_SUPABASE_ANON_KEY=your-supabase-anon-key');
  console.error('');
  console.error('Get these values from: https://app.supabase.com → Your Project → Settings → API');
}

export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-anon-key'
);
