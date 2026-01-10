
import { createClient } from '@supabase/supabase-js';
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

export const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Se não configurado, usamos URLs de placeholder para evitar crash na inicialização
export const supabase = createClient<Database>(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_KEY || 'placeholder'
);
