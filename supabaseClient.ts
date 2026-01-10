
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

// Using the credentials from your original code
const SUPABASE_URL = "";
const SUPABASE_KEY = "";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
