
import { createClient } from '@supabase/supabase-js';

// Access configuration from global window object
// Using TANGER_CONFIG to avoid Vercel/bundlers stripping 'process.env'
const config = (window as any).TANGER_CONFIG || (window as any).process?.env || {};

const supabaseUrl = config.SUPABASE_URL;
const supabaseAnonKey = config.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase Config Missing. Current Config:", config);
  throw new Error("Supabase URL or Anon Key is not defined. Make sure they are set in index.html");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
