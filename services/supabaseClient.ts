import { createClient } from '@supabase/supabase-js';

// Access environment variables from the window object where they are defined in index.html
// FIX: Cast window to `any` to bypass TypeScript error for non-standard `window.process` property.
const supabaseUrl = (window as any).process.env.SUPABASE_URL;
const supabaseAnonKey = (window as any).process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key is not defined. Make sure they are set in index.html");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
