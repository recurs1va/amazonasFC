
import { createClient } from '@supabase/supabase-js';
import { Database } from './types';

/**
 * Para aplicações Vite/Vercel, usamos import.meta.env ou process.env.
 * Aqui buscamos primeiro de import.meta.env (Vite) e depois de process.env (outros builders).
 */
const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL || (process.env as any).VITE_SUPABASE_URL || '';
const SUPABASE_KEY = (import.meta as any).env?.VITE_SUPABASE_KEY || (process.env as any).VITE_SUPABASE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.warn(
    "Supabase: URL ou Key não encontradas. Certifique-se de configurar as variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_KEY."
  );
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_KEY);
