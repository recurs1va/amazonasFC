
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Database } from './types';

// Função auxiliar para buscar variáveis de ambiente de forma segura em diferentes ambientes (Vite, Webpack, Node)
const getEnv = (name: string): string => {
  try {
    // Tenta Vite
    const viteEnv = (import.meta as any).env?.[name];
    if (viteEnv) return viteEnv;
    
    // Tenta process.env (Vercel/Node)
    const procEnv = (globalThis as any).process?.env?.[name];
    if (procEnv) return procEnv;
  } catch (e) {
    // Silencioso
  }
  return '';
};

const SUPABASE_URL = getEnv('VITE_SUPABASE_URL');
const SUPABASE_KEY = getEnv('VITE_SUPABASE_KEY');

// Valida se a URL é uma URL HTTP/HTTPS válida
const isValidUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

// Só considera configurado se a URL for válida e a key existir
export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && 
  SUPABASE_KEY && 
  isValidUrl(SUPABASE_URL)
);

// Só cria o cliente Supabase se estiver configurado corretamente
// Caso contrário, exporta null e o sistema usa localStorage
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured 
  ? createClient<Database>(SUPABASE_URL, SUPABASE_KEY)
  : null;
