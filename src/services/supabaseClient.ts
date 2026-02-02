
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

// Debug: log das variáveis de ambiente em produção
console.log('[supabaseClient] VITE_SUPABASE_URL:', SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'NÃO CONFIGURADO');
console.log('[supabaseClient] VITE_SUPABASE_KEY:', SUPABASE_KEY ? 'CONFIGURADO' : 'NÃO CONFIGURADO');

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

console.log('[supabaseClient] isSupabaseConfigured:', isSupabaseConfigured);

// Só cria o cliente Supabase se estiver configurado corretamente
// Caso contrário, exporta null e o sistema usa localStorage
export const supabase: SupabaseClient<Database> | null = isSupabaseConfigured 
  ? createClient<Database>(SUPABASE_URL, SUPABASE_KEY)
  : null;

if (isSupabaseConfigured) {
  console.log('[supabaseClient] ✅ Cliente Supabase criado com sucesso');
} else {
  console.warn('[supabaseClient] ⚠️ Supabase não configurado - usando localStorage como fallback');
}
